
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, TestTube } from "lucide-react";

export const NotificationTest = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createTestNotification = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be signed in to create notifications",
          variant: "destructive",
        });
        return;
      }

      console.log('Creating test notification for user:', user.id);

      // Create different types of test notifications
      const testNotifications = [
        {
          user_id: user.id,
          type: 'test',
          title: 'Welcome Test',
          message: 'This is a test notification to verify the system is working correctly.',
          priority: 'normal'
        },
        {
          user_id: user.id,
          type: 'purchase_request',
          title: 'New Purchase Request',
          message: 'Someone is interested in your book "Sample Book Title".',
          priority: 'high'
        },
        {
          user_id: user.id,
          type: 'message',
          title: 'New Message',
          message: 'You have received a new message about your book listing.',
          priority: 'normal'
        }
      ];

      // Insert one random notification
      const randomNotification = testNotifications[Math.floor(Math.random() * testNotifications.length)];
      
      const { data, error } = await supabase
        .from('notifications')
        .insert(randomNotification)
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        toast({
          title: "Error creating notification",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('Test notification created:', data);
        toast({
          title: "Test notification created!",
          description: "Check your notifications tab to see it.",
        });
      }
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast({
        title: "Unexpected error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const showTestToast = () => {
    toast({
      title: "Test Toast Notification",
      description: "This is a test toast notification that appears temporarily",
    });
  };

  const showSuccessToast = () => {
    toast({
      title: "Success!",
      description: "This is a success notification",
    });
  };

  const showErrorToast = () => {
    toast({
      title: "Error!",
      description: "This is an error notification",
      variant: "destructive",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TestTube className="h-5 w-5" />
          <span>Notification System Test</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium">Database Notifications</h4>
            <Button 
              onClick={createTestNotification} 
              disabled={loading}
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              {loading ? "Creating..." : "Create Test Notification"}
            </Button>
            <p className="text-xs text-gray-500">
              Creates a notification stored in the database that persists
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Toast Notifications</h4>
            <div className="space-y-2">
              <Button 
                onClick={showTestToast}
                variant="outline"
                className="w-full"
              >
                Test Toast
              </Button>
              <Button 
                onClick={showSuccessToast}
                variant="outline"
                className="w-full"
              >
                Success Toast
              </Button>
              <Button 
                onClick={showErrorToast}
                variant="outline"
                className="w-full"
              >
                Error Toast
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Shows temporary notifications that disappear automatically
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
