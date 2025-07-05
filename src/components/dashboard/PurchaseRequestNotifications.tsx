
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNotificationSound } from "@/hooks/useNotificationSound";

interface PurchaseRequestNotificationsProps {
  userId: string;
}

export const PurchaseRequestNotifications = ({ userId }: PurchaseRequestNotificationsProps) => {
  const { toast } = useToast();
  const { playNotificationSound } = useNotificationSound();

  useEffect(() => {
    if (!userId) return;

    console.log('Setting up purchase request notifications for user:', userId);

    // Listen for new purchase requests (for sellers)
    const newRequestsChannel = supabase
      .channel('new_purchase_requests')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'purchase_requests'
      }, async (payload) => {
        console.log('New purchase request:', payload);
        
        const newRequest = payload.new;
        
        // Only notify if current user is the seller
        if (newRequest.seller_id !== userId) return;

        // Get book and buyer details
        const { data: bookData } = await supabase
          .from('books')
          .select('title')
          .eq('id', newRequest.book_id)
          .single();

        const { data: buyerProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', newRequest.buyer_id)
          .single();

        playNotificationSound();
        
        toast({
          title: "New Purchase Request!",
          description: `${buyerProfile?.full_name || 'A buyer'} wants to buy "${bookData?.title}" for ₹${newRequest.offered_price}`,
          duration: 8000,
        });

        // Create notification in database
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'new_purchase_request',
            title: 'New Purchase Request',
            message: `${buyerProfile?.full_name || 'A buyer'} wants to buy "${bookData?.title}" for ₹${newRequest.offered_price}. Check your requests to respond.`,
            related_id: newRequest.id,
            priority: 'high'
          });
      })
      .subscribe((status) => {
        console.log('New requests subscription status:', status);
      });

    // Listen for chat messages
    const chatChannel = supabase
      .channel('chat_notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, async (payload) => {
        console.log('New chat message:', payload);
        
        const message = payload.new;
        
        // Don't notify if current user sent the message
        if (message.sender_id === userId) return;

        // Check if current user is part of this conversation
        const { data: purchaseRequest } = await supabase
          .from('purchase_requests')
          .select('buyer_id, seller_id, book_id')
          .eq('id', message.purchase_request_id)
          .single();

        if (!purchaseRequest || 
            (purchaseRequest.buyer_id !== userId && purchaseRequest.seller_id !== userId)) {
          return;
        }

        // Get sender details and book title
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', message.sender_id)
          .single();

        const { data: bookData } = await supabase
          .from('books')
          .select('title')
          .eq('id', purchaseRequest.book_id)
          .single();

        playNotificationSound();
        
        toast({
          title: "New Message",
          description: `${senderProfile?.full_name || 'Someone'} sent a message about "${bookData?.title}"`,
          duration: 5000,
        });

        // Create notification in database
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'new_message',
            title: 'New Message',
            message: `${senderProfile?.full_name || 'Someone'} sent you a message about "${bookData?.title}".`,
            related_id: message.purchase_request_id,
            priority: 'normal'
          });
      })
      .subscribe((status) => {
        console.log('Chat notifications subscription status:', status);
      });

    return () => {
      console.log('Cleaning up purchase request notification subscriptions');
      supabase.removeChannel(newRequestsChannel);
      supabase.removeChannel(chatChannel);
    };
  }, [userId, toast, playNotificationSound]);

  return null; // This is a utility component with no UI
};
