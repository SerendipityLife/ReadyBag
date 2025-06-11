import { useEffect } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { ProductCardStack } from "@/components/product/product-card-stack";
import { Lists } from "@/pages/lists";
import { InfoPanel } from "@/components/info-panel";
import { ShareModal } from "@/components/share-modal";
import { ShoppingHistoryPage } from "@/pages/shopping-history";
import { View } from "@/lib/constants";

export default function Home() {
  const { currentView, setCurrentView } = useAppContext();
  
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
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 pb-24 pt-4 flex-1">
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
    </div>
  );
}
