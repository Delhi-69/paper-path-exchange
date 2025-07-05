import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, X, Trash2 } from "lucide-react";
import { useNotificationSound } from "@/hooks/useNotificationSound";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  priority: string;
  action_url?: string;
  created_at: string;
  related_id?: string;
}

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { playNotificationSound } = useNotificationSound();

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found, skipping notification fetch');
        setLoading(false);
        return;
      }

      console.log('Fetching notifications for user:', user.id);

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }
      
      console.log('Fetched notifications:', data?.length || 0);
      
      const mappedNotifications: Notification[] = (data || []).map(notification => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: notification.read || false,
        priority: notification.priority || 'normal',
        action_url: notification.action_url || undefined,
        created_at: notification.created_at || '',
        related_id: notification.related_id || undefined
      }));
      
      setNotifications(mappedNotifications);
    } catch (error: any) {
      console.error('Error in fetchNotifications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription for notifications
    const notificationChannel = supabase
      .channel('notifications_center')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
        console.log('New notification received:', payload);
        playNotificationSound();
        fetchNotifications();
        
        // Show toast for new notification
        const newNotification = payload.new;
        toast({
          title: newNotification.title,
          description: newNotification.message,
          duration: 5000,
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
        console.log('Notification updated:', payload);
        fetchNotifications();
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
        console.log('Notification deleted:', payload);
        fetchNotifications();
      })
      .subscribe((status) => {
        console.log('Notification subscription status:', status);
      });

    // Set up real-time subscription for purchase request updates
    const purchaseRequestChannel = supabase
      .channel('purchase_requests_updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'purchase_requests'
      }, async (payload) => {
        console.log('Purchase request updated:', payload);
        
        const updatedRequest = payload.new;
        const oldRequest = payload.old;
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if status changed
        if (oldRequest.status !== updatedRequest.status) {
          // Get book and user details for notification
          const { data: bookData } = await supabase
            .from('books')
            .select('title, seller_id')
            .eq('id', updatedRequest.book_id)
            .single();

          const { data: buyerProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', updatedRequest.buyer_id)
            .single();

          const { data: sellerProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', updatedRequest.seller_id)
            .single();

          // Create notifications based on status change
          let notifications = [];
          
          if (updatedRequest.status === 'accepted' && oldRequest.status === 'pending') {
            // Notify buyer that request was accepted
            if (user.id !== updatedRequest.seller_id) {
              notifications.push({
                user_id: updatedRequest.buyer_id,
                type: 'request_accepted',
                title: 'Request Accepted!',
                message: `${sellerProfile?.full_name || 'Seller'} accepted your request for "${bookData?.title}". You can now chat and arrange delivery.`,
                related_id: updatedRequest.id,
                priority: 'high'
              });
            }
          } else if (updatedRequest.status === 'rejected' && oldRequest.status === 'pending') {
            // Notify buyer that request was rejected
            if (user.id !== updatedRequest.seller_id) {
              notifications.push({
                user_id: updatedRequest.buyer_id,
                type: 'request_rejected',
                title: 'Request Declined',
                message: `${sellerProfile?.full_name || 'Seller'} declined your request for "${bookData?.title}".`,
                related_id: updatedRequest.id,
                priority: 'normal'
              });
            }
          } else if (updatedRequest.status === 'completed' && oldRequest.status === 'accepted') {
            // Notify both parties that transaction is completed
            notifications.push(
              {
                user_id: updatedRequest.buyer_id,
                type: 'transaction_completed',
                title: 'Transaction Completed!',
                message: `Your purchase of "${bookData?.title}" has been completed successfully.`,
                related_id: updatedRequest.id,
                priority: 'high'
              },
              {
                user_id: updatedRequest.seller_id,
                type: 'transaction_completed',
                title: 'Sale Completed!',
                message: `Your sale of "${bookData?.title}" to ${buyerProfile?.full_name || 'buyer'} has been completed.`,
                related_id: updatedRequest.id,
                priority: 'high'
              }
            );
          }

          // Insert notifications
          if (notifications.length > 0) {
            const { error } = await supabase
              .from('notifications')
              .insert(notifications);

            if (error) {
              console.error('Error creating status change notifications:', error);
            }
          }
        }

        // Check if delivery date was added/updated
        if (!oldRequest.expected_delivery_date && updatedRequest.expected_delivery_date) {
          const { data: bookData } = await supabase
            .from('books')
            .select('title')
            .eq('id', updatedRequest.book_id)
            .single();

          const { data: sellerProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', updatedRequest.seller_id)
            .single();

          // Notify buyer about delivery date
          if (user.id !== updatedRequest.buyer_id) {
            await supabase
              .from('notifications')
              .insert({
                user_id: updatedRequest.buyer_id,
                type: 'delivery_scheduled',
                title: 'Delivery Date Set',
                message: `${sellerProfile?.full_name || 'Seller'} has set the delivery date for "${bookData?.title}" to ${new Date(updatedRequest.expected_delivery_date).toLocaleDateString()}.`,
                related_id: updatedRequest.id,
                priority: 'normal'
              });
          }
        }
      })
      .subscribe((status) => {
        console.log('Purchase request subscription status:', status);
      });

    return () => {
      console.log('Cleaning up notification subscriptions');
      supabase.removeChannel(notificationChannel);
      supabase.removeChannel(purchaseRequestChannel);
    };
  }, [playNotificationSound, toast]);

  const markAsRead = async (notificationId: string) => {
    try {
      console.log('Marking notification as read:', notificationId);
      
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }

      // Update local state immediately for better UX
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));

      console.log('Notification marked as read successfully');
    } catch (error: any) {
      console.error('Error in markAsRead:', error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      console.log('Deleting notification:', notificationId);
      
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
        throw error;
      }

      // Update local state immediately for better UX
      setNotifications(notifications.filter(n => n.id !== notificationId));
      
      console.log('Notification deleted successfully');
      
      toast({
        title: "Notification deleted",
        description: "Notification has been removed",
      });
    } catch (error: any) {
      console.error('Error in deleteNotification:', error);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Marking all notifications as read for user:', user.id);

      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) {
        console.error('Error marking all as read:', error);
        throw error;
      }

      // Update local state immediately
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      
      console.log('All notifications marked as read successfully');
      
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error: any) {
      console.error('Error in markAllAsRead:', error);
      toast({
        title: "Error",
        description: "Failed to mark all as read",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white animate-pulse">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <Check className="h-4 w-4 mr-1" />
                Mark All Read
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600">You're all caught up!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`${!notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50 animate-fade-in' : ''} transition-all duration-300`}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold">{notification.title}</h4>
                      <Badge className={getPriorityColor(notification.priority)}>
                        {notification.priority}
                      </Badge>
                      {!notification.read && (
                        <Badge variant="secondary" className="animate-pulse">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-1 ml-4">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                      title="Delete notification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
