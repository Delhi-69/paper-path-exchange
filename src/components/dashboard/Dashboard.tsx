import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Header } from "./Header";
import { MobileHeader } from "./MobileHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import BookDiscovery from "./BookDiscovery";
import { SellBook } from "./SellBook";
import { MyBooks } from "./MyBooks";
import { Requests } from "./Requests";
import { MyRequests } from "./MyRequests";
import { Profile } from "./Profile";
import { NotificationCenter } from "./NotificationCenter";
import { TransactionHistory } from "./TransactionHistory";
import { AdminDashboard } from "./AdminDashboard";
import { PurchaseRequestNotifications } from "./PurchaseRequestNotifications";
import { NotificationTest } from "./NotificationTest";

export type DashboardTab = 
  | "discover" 
  | "sell" 
  | "my-books" 
  | "requests" 
  | "my-requests" 
  | "profile" 
  | "notifications"
  | "transactions"
  | "admin"
  | "preferences";

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>("discover");
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error getting user:', error);
        return;
      }
      
      if (user) {
        console.log('Current user:', user.id);
        setUser(user);
        
        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else {
          console.log('User profile loaded:', profile);
          setUserProfile(profile);
        }

        // Check if user is admin
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', user.id)
          .single();
        
        setIsAdmin(!!adminData);
        console.log('User is admin:', !!adminData);
      }
    };

    getUser();
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case "discover":
        return <BookDiscovery />;
      case "sell":
        return <SellBook />;
      case "my-books":
        return <MyBooks />;
      case "requests":
        return <Requests />;
      case "my-requests":
        return <MyRequests />;
      case "profile":
        return <Profile user={user} />;
      case "notifications":
        return (
          <div className="space-y-6">
            <NotificationTest />
            <NotificationCenter />
          </div>
        );
      case "transactions":
        return <TransactionHistory />;
      case "admin":
        return isAdmin ? <AdminDashboard /> : <div>Access denied</div>;
      default:
        return <BookDiscovery />;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Add notification system */}
      <PurchaseRequestNotifications userId={user.id} />
      
      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header 
          currentView={activeTab} 
          setCurrentView={setActiveTab} 
          isAdmin={isAdmin}
        />
      </div>
      
      {/* Mobile Header */}
      <div className="md:hidden">
        <MobileHeader 
          currentView={activeTab}
          setCurrentView={setActiveTab}
          isAdmin={isAdmin}
        />
      </div>

      {/* Main Content */}
      <main className="md:container md:mx-auto md:px-4 md:py-6 pb-20 md:pb-6">
        {renderTabContent()}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <MobileBottomNav 
          currentView={activeTab} 
          setCurrentView={setActiveTab}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
};
