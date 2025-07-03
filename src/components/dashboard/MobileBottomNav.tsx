
import { Button } from "@/components/ui/button";
import { Search, Plus, Library, MessageSquare, User, Shield, Book, ShoppingCart } from "lucide-react";
import { DashboardView } from "@/types/dashboard";

interface MobileBottomNavProps {
  currentView: DashboardView;
  setCurrentView: (view: DashboardView) => void;
  isAdmin?: boolean;
}

export const MobileBottomNav = ({ currentView, setCurrentView, isAdmin }: MobileBottomNavProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 px-4 py-2 z-50 backdrop-blur-sm">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        <button
          onClick={() => setCurrentView("discover")}
          className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all ${
            currentView === "discover" 
              ? "text-green-400 bg-green-500/10" 
              : "text-gray-400 hover:text-white hover:bg-gray-700/50"
          }`}
        >
          <Search className="h-5 w-5" />
          <span className="text-xs font-medium">Discover</span>
        </button>
        
        <button
          onClick={() => setCurrentView("sell")}
          className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all ${
            currentView === "sell" 
              ? "text-green-400 bg-green-500/10" 
              : "text-gray-400 hover:text-white hover:bg-gray-700/50"
          }`}
        >
          <Plus className="h-5 w-5" />
          <span className="text-xs font-medium">Sell</span>
        </button>
        
        <button
          onClick={() => setCurrentView("my-books")}
          className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all ${
            currentView === "my-books" 
              ? "text-green-400 bg-green-500/10" 
              : "text-gray-400 hover:text-white hover:bg-gray-700/50"
          }`}
        >
          <Book className="h-5 w-5" />
          <span className="text-xs font-medium">Books</span>
        </button>
        
        <button
          onClick={() => setCurrentView("requests")}
          className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all ${
            currentView === "requests" 
              ? "text-green-400 bg-green-500/10" 
              : "text-gray-400 hover:text-white hover:bg-gray-700/50"
          }`}
        >
          <MessageSquare className="h-5 w-5" />
          <span className="text-xs font-medium">Requests</span>
        </button>

        <button
          onClick={() => setCurrentView("my-requests")}
          className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all ${
            currentView === "my-requests" 
              ? "text-green-400 bg-green-500/10" 
              : "text-gray-400 hover:text-white hover:bg-gray-700/50"
          }`}
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="text-xs font-medium">Orders</span>
        </button>
        
        <button
          onClick={() => setCurrentView("profile")}
          className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all ${
            currentView === "profile" 
              ? "text-green-400 bg-green-500/10" 
              : "text-gray-400 hover:text-white hover:bg-gray-700/50"
          }`}
        >
          <User className="h-5 w-5" />
          <span className="text-xs font-medium">Profile</span>
        </button>
      </div>
    </div>
  );
};
