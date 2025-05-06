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
      <div className="container mx-auto px-2 py-2 md:px-4 md:py-3 flex flex-col md:flex-row md:items-center justify-between">
        {/* Top row: Logo and action buttons */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center space-x-1 md:space-x-2">
            {(currentView === View.LISTS || isSharedList) && (
              <Button 
                variant="ghost" 
                size="sm"
                className="md:hidden text-neutral hover:text-primary p-1"
                onClick={handleBackClick}
              >
                <ArrowLeft size={18} />
              </Button>
            )}
            <h1 className={`text-xl md:text-2xl font-heading font-bold text-primary ${(currentView === View.LISTS || isSharedList) ? "ml-0" : "ml-1"}`}>
              <span className="md:inline">Ready</span><span className="inline font-bold">Bag</span>
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-neutral hover:text-primary p-1"
              onClick={handleShareClick}
            >
              <Share2 size={18} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-neutral hover:text-primary p-1"
              // A placeholder for future user authentication
              onClick={() => {}}
            >
              <UserCircle size={18} />
            </Button>
          </div>
        </div>
        
        {/* Bottom row: Country selector */}
        {!isSharedList && (
          <div className="mt-1 md:mt-0">
            <CountrySelector />
          </div>
        )}
      </div>
    </header>
  );
}
