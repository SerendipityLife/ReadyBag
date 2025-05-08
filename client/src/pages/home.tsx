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

export default function Home() {
  const { currentView, setCurrentView } = useAppContext();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 pb-24 pt-4 flex-1">
        {currentView === View.EXPLORE && (
          <div className="flex flex-col items-center">
            {/* 메인 컨텐츠 - 상품이 최상단에 위치 */}
            <div className="w-full flex flex-col items-center">
              <ProductCardStack />
            </div>
            
            {/* 환율 정보 패널 - 상품 아래에 배치 */}
            <div className="w-full max-w-md mt-4">
              <CurrencyInfoPanel />
            </div>
            
            {/* 필터 버튼만 남기고 카테고리 체크박스 제거 */}
            <div className="w-full max-w-md flex justify-end mb-2">
              <FilterButton />
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
