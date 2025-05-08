import { useEffect, useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { ProductCardStack } from "@/components/product/product-card-stack";
import { CategorySelector } from "@/components/category-selector";
import { Lists } from "@/pages/lists";
import { InfoPanel } from "@/components/info-panel";
import { ShareModal } from "@/components/share-modal";
import { AdBanner } from "@/components/ads/ad-banner";
import { TrendingKeywords } from "@/components/trending-keywords";
import { View } from "@/lib/constants";

export default function Home() {
  const { currentView, setCurrentView } = useAppContext();
  const [searchKeyword, setSearchKeyword] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 pb-24 pt-4 flex-1">
        {currentView === View.EXPLORE && (
          <div className="flex flex-col items-center">
            {/* 상단 배너 광고 */}
            <div className="w-full flex justify-center mb-4">
              <AdBanner adFormat="horizontal" className="max-w-full" />
            </div>
            
            <div className="w-full max-w-md mx-auto mb-2 bg-gray-50 p-4 rounded-lg">
              <CategorySelector />
            </div>
            
            <div className="flex flex-row w-full justify-center">
              {/* 좌측 사이드바 광고 (태블릿 및 데스크탑에서만 표시) */}
              <div className="hidden md:block mr-4">
                <AdBanner adFormat="vertical" />
              </div>
              
              {/* 메인 컨텐츠 */}
              <ProductCardStack />
              
              {/* 우측 사이드바 광고 (태블릿 및 데스크탑에서만 표시) */}
              <div className="hidden md:block ml-4">
                <AdBanner adFormat="vertical" />
              </div>
            </div>
            
            {/* 하단 사각형 광고 (모바일에서만 표시) */}
            <div className="w-full flex justify-center mt-6 md:hidden">
              <AdBanner adFormat="rectangle" />
            </div>
            
            {/* 인기 검색어 트렌딩 키워드 */}
            <div className="w-full max-w-md mx-auto mt-6">
              <TrendingKeywords 
                onKeywordSelect={(keyword) => setSearchKeyword(keyword)} 
                simple={true}
                maxItems={8}
              />
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
