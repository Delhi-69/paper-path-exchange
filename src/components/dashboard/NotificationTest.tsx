
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
          description: "No user found",
          variant: "destructive",
        });
        return;
      }

      console.log('Creating test notification for user:', user.id);

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'test',
          title: 'Test Notification',
          message: 'This is a test notification to check if the system is working.',
          priority: 'normal'
        })
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

  const showToastTest = () => {
    toast({
      title: "Toast Test",
      description: "This is a test toast notification",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification System Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={createTestNotification} 
          disabled={loading}
          className="w-full"
        >
          {loading ? "Creating..." : "Create Test Database Notification"}
        </Button>
        
        <Button 
          onClick={showToastTest}
          variant="outline"
          className="w-full"
        >
          Test Toast Notification
        </Button>
      </CardContent>
    </Card>
  );
};
