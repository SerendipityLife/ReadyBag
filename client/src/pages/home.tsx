import { useEffect } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { ProductCardStack } from "@/components/product/product-card-stack";
import { FilterButton } from "@/components/filter/filter-button";
import { Lists } from "@/pages/lists";
import { InfoPanel } from "@/components/info-panel";
import { ShareModal } from "@/components/share-modal";
import { View } from "@/lib/constants";
import { CurrencyInfoPanel } from "@/components/ui/currency-display";
import { NonMemberInfo } from "@/components/non-member-info";

export default function Home() {
  const { currentView, setCurrentView } = useAppContext();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 pb-24 pt-4 flex-1">
        {currentView === View.EXPLORE && (
          <div className="flex flex-col items-center">
            {/* 1. 필터 버튼 */}
            <div className="w-full max-w-md flex justify-end mb-4">
              <FilterButton />
            </div>
            
            {/* 2. 상품 컨텐츠 */}
            <div className="w-full flex flex-col items-center mb-4">
              <ProductCardStack />
            </div>
            
            {/* 3. 환율 정보 패널 */}
            <div className="w-full max-w-md mb-4">
              <CurrencyInfoPanel />
            </div>
            
            {/* 4. 비회원 안내 정보 */}
            <div className="w-full max-w-md mb-4">
              <NonMemberInfo />
            </div>
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
