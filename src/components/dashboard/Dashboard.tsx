import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { UberHeader } from "./UberHeader";
import { UberMobileNav } from "./UberMobileNav";
import BookDiscovery from "./BookDiscovery";
import { SellBook } from "./SellBook";
import { MyBooks } from "./MyBooks";
import { Requests } from "./Requests";
import { MyRequests } from "./MyRequests";
import { Profile } from "./Profile";
import { NotificationCenter } from "./NotificationCenter";
import { AdminDashboard } from "./AdminDashboard";
import { TransactionHistory } from "./TransactionHistory";
import { PWAInstallPrompt } from "../pwa/PWAInstallPrompt";
import { OfflineIndicator } from "../pwa/OfflineIndicator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DashboardView } from "@/types/dashboard";

interface DashboardProps {
  user: User | null;
}

export const Dashboard = ({ user }: DashboardProps) => {
  const [currentView, setCurrentView] = useState<DashboardView>("discover");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          setAdminCheckLoading(false);
          return;
        }

        const { data: adminData, error } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', currentUser.id)
          .single();

        if (!error && adminData) {
          setIsAdmin(true);
          console.log('User is admin via admin_users table');
        } else {
          const isAdminByEmail = currentUser.email === "arnabmanna203@gmail.com";
          if (isAdminByEmail) {
            setIsAdmin(true);
            console.log('User is admin via email check');
            
            const { error: insertError } = await supabase
              .from('admin_users')
              .insert({ user_id: currentUser.id })
              .select()
              .single();
            
            if (!insertError) {
              console.log('Added admin user to admin_users table');
            }
          }
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      } finally {
        setAdminCheckLoading(false);
      }
    };

    checkAdminStatus();

    const fetchProfile = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (!error) {
          setUserProfile(data);
        }
      }
    };
    fetchProfile();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, [user]);

  const renderContent = () => {
    switch (currentView) {
      case "discover":
        return <BookDiscovery />;
      case "sell":
        return <SellBook />;
      case "my-books":
        return <MyBooks />;
      case "requests":
        return <Requests userId={user?.id} userProfile={userProfile} />;
      case "my-requests":
        return <MyRequests userId={user?.id} userProfile={userProfile} />;
      case "profile":
        return <Profile user={user} />;
      case "notifications":
        return <NotificationCenter />;
      case "admin":
        return <AdminDashboard />;
      case "transactions":
        return <TransactionHistory />;
      default:
        return <BookDiscovery />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <PWAInstallPrompt />
      <OfflineIndicator />
      
      {/* Uber-style Header */}
      <UberHeader 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        isAdmin={isAdmin}
        user={user}
      />

      {/* Main Content with Uber-style transitions */}
      <main className="relative">
        <div className="transition-all duration-500 ease-in-out transform">
          {renderContent()}
        </div>
      </main>

      {/* Uber-style Mobile Navigation */}
      <UberMobileNav 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        isAdmin={isAdmin}
      />
    </div>
  );
};