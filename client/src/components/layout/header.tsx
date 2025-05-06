import { useState } from "react";
import { useLocation } from "wouter";
import { useAppContext } from "@/contexts/AppContext";
import { CountrySelector } from "@/components/country-selector";
import { View } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2, UserCircle } from "lucide-react";

export function Header() {
  const [location, navigate] = useLocation();
  const { currentView, setCurrentView, generateShareUrl } = useAppContext();
  const isSharedList = location.startsWith("/shared");
  
  const handleBackClick = () => {
    if (isSharedList) {
      navigate("/");
    } else {
      setCurrentView(View.EXPLORE);
    }
  };
  
  const handleShareClick = () => {
    generateShareUrl();
  };
  
  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {(currentView === View.LISTS || isSharedList) && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden text-neutral hover:text-primary"
              onClick={handleBackClick}
            >
              <ArrowLeft size={20} />
            </Button>
          )}
          <h1 className="text-2xl font-heading font-bold text-primary">
            <span className="md:inline">Ready</span><span className="inline font-bold">Bag</span>
          </h1>
        </div>
        
        {!isSharedList && <CountrySelector />}
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-neutral hover:text-primary"
            onClick={handleShareClick}
          >
            <Share2 size={20} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-neutral hover:text-primary"
            // A placeholder for future user authentication
            onClick={() => {}}
          >
            <UserCircle size={20} />
          </Button>
        </div>
      </div>
    </header>
  );
}
