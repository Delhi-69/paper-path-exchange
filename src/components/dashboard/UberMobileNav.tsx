import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  BookOpen, 
  MessageSquare, 
  User, 
  Shield,
  ShoppingCart
} from "lucide-react";
import { DashboardView } from "@/types/dashboard";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UberMobileNavProps {
  currentView: DashboardView;
  setCurrentView: (view: DashboardView) => void;
  isAdmin?: boolean;
}

export const UberMobileNav = ({ currentView, setCurrentView, isAdmin }: UberMobileNavProps) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", user.id)
          .eq("read", false);

        if (error) throw error;
        setUnreadCount(data?.length || 0);
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();

    const channel = supabase
      .channel('mobile_nav_notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, () => fetchUnreadCount())
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications'
      }, () => fetchUnreadCount())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const navItems = [
    { id: "discover", label: "Discover", icon: Search },
    { id: "sell", label: "Sell", icon: Plus },
    { id: "my-books", label: "Books", icon: BookOpen },
    { id: "requests", label: "Requests", icon: MessageSquare, badge: unreadCount },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Uber-style bottom navigation */}
      <div className="bg-white/95 backdrop-blur-md border-t border-gray-200/50 shadow-2xl">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setCurrentView(id as DashboardView)}
              className={`relative flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 transform ${
                currentView === id
                  ? "bg-gradient-to-t from-blue-600 to-purple-600 text-white shadow-lg scale-110"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:scale-95"
              }`}
            >
              <Icon className={`h-5 w-5 mb-1 ${currentView === id ? "text-white" : ""}`} />
              <span className={`text-xs font-medium ${currentView === id ? "text-white" : ""}`}>
                {label}
              </span>
              
              {badge && badge > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[1.25rem] h-5 flex items-center justify-center rounded-full animate-pulse border-2 border-white">
                  {badge > 9 ? "9+" : badge}
                </Badge>
              )}
              
              {/* Active indicator */}
              {currentView === id && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
              )}
            </button>
          ))}
        </div>
        
        {/* Safe area for devices with home indicator */}
        <div className="h-safe-area-inset-bottom bg-white/95"></div>
      </div>
    </div>
  );
};