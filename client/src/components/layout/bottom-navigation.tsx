import { useAppContext } from "@/contexts/AppContext";
import { View } from "@/lib/constants";
import { Search, List, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNavigation() {
  const { currentView, setCurrentView } = useAppContext();
  
  const navItems = [
    {
      id: View.EXPLORE,
      label: "둘러보기",
      icon: Search,
    },
    {
      id: View.LISTS,
      label: "내 목록",
      icon: List,
    },
    {
      id: View.INFO,
      label: "정보",
      icon: Info,
    },
  ];
  
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full",
                currentView === item.id ? "text-primary" : "text-neutral"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
