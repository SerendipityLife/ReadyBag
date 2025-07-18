import { useEffect } from "react";
import { useAppContext } from "../contexts/AppContext";
import { Header } from "../components/layout/header.tsx";
import { BottomNavigation } from "../components/layout/bottom-navigation.tsx";
import { ProductCardStack } from "../components/product/product-card-stack.tsx";
import { Lists } from "./lists";
import { InfoPanel } from "../components/info-panel.tsx";
import { ShareModal } from "../components/share-modal.tsx";
import { ShoppingHistoryPage } from "./shopping-history";

import { WelcomeModal } from "../components/onboarding/welcome-modal.tsx";
import { CountrySelector } from "../components/country-selector.tsx";
import { View } from "../lib/constants.ts";

export default function Home() {
  const { 
    currentView, 
    setCurrentView, 
    travelStartDate, 
    travelEndDate, 
    setTravelStartDate, 
    setTravelEndDate,
    showWelcomeModal,
    setShowWelcomeModal
  } = useAppContext();

  const handleWelcomeComplete = () => {
    setShowWelcomeModal(false);
    localStorage.setItem('hasSeenWelcome', 'true');
  };
  
  // Add no-scroll class to HTML element when in EXPLORE view for mobile devices
  useEffect(() => {
    const htmlElement = document.documentElement;
    
    if (currentView === View.EXPLORE) {
      htmlElement.classList.add('no-scroll-mobile');
    } else {
      htmlElement.classList.remove('no-scroll-mobile');
    }
    
    // Cleanup on unmount
    return () => {
      htmlElement.classList.remove('no-scroll-mobile');
    };
  }, [currentView]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-blue-100">
      <Header />
      
      <main className="container mx-auto px-4 pt-4 flex-1 main-content pb-12">
        {currentView === View.EXPLORE && (
          <div className="flex flex-col items-center">
            {/* 상품 컨텐츠 */}
            <div className="w-full flex flex-col items-center">
              <ProductCardStack />
            </div>
          </div>
        )}
        
        {currentView === View.LISTS && (
          <Lists />
        )}
        
        {currentView === View.INFO && (
          <div className="w-full">
            {/* Info content will be handled by InfoPanel component */}
          </div>
        )}
        
        {currentView === View.HISTORY && (
          <ShoppingHistoryPage />
        )}
      </main>
      
      <BottomNavigation />
      <InfoPanel />
      <ShareModal />
      
      {/* 온보딩 모달 */}
      <WelcomeModal 
        isOpen={showWelcomeModal} 
        onClose={handleWelcomeComplete} 
      />
    </div>
  );
}
