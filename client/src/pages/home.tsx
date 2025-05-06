import { useEffect } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { ProductCardStack } from "@/components/product/product-card-stack";
import { CategorySelector } from "@/components/category-selector";
import { Lists } from "@/pages/lists";
import { InfoPanel } from "@/components/info-panel";
import { ShareModal } from "@/components/share-modal";
import { View } from "@/lib/constants";

export default function Home() {
  const { currentView, setCurrentView } = useAppContext();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 pb-24 pt-4 flex-1">
        {currentView === View.EXPLORE && (
          <div className="flex flex-col items-center">
            {/* 스티키 카테고리 선택기 */}
            <div className="w-full max-w-md mx-auto sticky top-14 z-10 bg-gray-50 pt-2 pb-2">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <CategorySelector />
              </div>
            </div>
            <ProductCardStack />
          </div>
        )}
        
        {currentView === View.LISTS && (
          <Lists />
        )}
      </main>
      
      <BottomNavigation />
      <InfoPanel />
      <ShareModal />
    </div>
  );
}
