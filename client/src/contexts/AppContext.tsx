import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ProductStatus, DEFAULT_COUNTRY, API_ROUTES, View } from "@/lib/constants";
import type { Country, Product, UserProduct } from "@shared/schema";

// 가격 범위 타입 정의
interface PriceRange {
  min: number;
  max: number;
}

type AppContextType = {
  currentView: View;
  setCurrentView: (view: View) => void;
  selectedCountry: Country;
  setSelectedCountry: (country: Country) => void;
  
  // 새로운 두단계 카테고리 시스템
  selectedStoreTypes: string[];
  setSelectedStoreTypes: (storeTypes: string[]) => void;
  selectedPurposeCategories: string[];
  setSelectedPurposeCategories: (categories: string[]) => void;
  isAllStoreTypesSelected: boolean;
  isAllPurposeCategoriesSelected: boolean;
  
  // 기존 카테고리 관련 (호환성을 위해 유지, 내부적으로는 새 시스템 사용)
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  addCategory: (category: string) => void;
  removeCategory: (category: string) => void;
  toggleCategory: (category: string) => void;
  isAllCategoriesSelected: boolean;
  
  currentProductIndex: number;
  setCurrentProductIndex: (index: number) => void;
  isShareModalOpen: boolean;
  openShareModal: () => void;
  closeShareModal: () => void;
  shareUrl: string | null;
  setShareUrl: (url: string | null) => void;
  generateShareUrl: (status?: ProductStatus) => void;
  exchangeRate: number | null;
  lastUpdated: string | null;
  
  // 필터 관련 추가 상태와 함수
  priceRange: PriceRange;
  setPriceRange: (range: PriceRange) => void;
  tags: string[];
  setTags: (tags: string[]) => void;
  applyFilters: (scope?: View) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  
  // App state
  const [currentView, setCurrentView] = useState<View>(View.EXPLORE);
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);
  
  // 새로운 두단계 카테고리 시스템
  const [selectedStoreTypes, setSelectedStoreTypes] = useState<string[]>(["ALL"]);
  const [selectedPurposeCategories, setSelectedPurposeCategories] = useState<string[]>(["ALL"]);
  
  // 기존 호환성을 위한 카테고리 상태
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["ALL"]);
  
  const [currentProductIndex, setCurrentProductIndex] = useState<number>(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  // 필터 관련 상태
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: 0, max: 50000 });
  const [tags, setTags] = useState<string[]>([]);

  // Derived state
  const isAllCategoriesSelected = selectedCategories.includes("ALL");
  const isAllStoreTypesSelected = selectedStoreTypes.includes("ALL") || selectedStoreTypes.length === 0;
  const isAllPurposeCategoriesSelected = selectedPurposeCategories.includes("ALL") || selectedPurposeCategories.length === 0;

  // Category management functions
  const addCategory = (category: string) => {
    if (category === "ALL") {
      setSelectedCategories(["ALL"]);
    } else {
      setSelectedCategories(prev => {
        const newCategories = prev.filter(c => c !== "ALL");
        if (!newCategories.includes(category)) {
          return [...newCategories, category];
        }
        return newCategories;
      });
    }
  };

  const removeCategory = (category: string) => {
    if (category === "ALL") {
      if (selectedCategories.length <= 1) {
        return; // Don't remove the last category
      }
      setSelectedCategories(prev => prev.filter(c => c !== "ALL"));
    } else {
      setSelectedCategories(prev => {
        const newCategories = prev.filter(c => c !== category);
        if (newCategories.length === 0) {
          return ["ALL"]; // If no categories are selected, select ALL
        }
        return newCategories;
      });
    }
  };

  const toggleCategory = (category: string) => {
    console.log("In AppContext toggleCategory:", category);
    if (selectedCategories.includes(category)) {
      console.log("Removing category:", category);
      removeCategory(category);
    } else {
      console.log("Adding category:", category);
      addCategory(category);
    }
    // Log after the state update was requested
    setTimeout(() => {
      console.log("selectedCategories after toggle request:", selectedCategories);
    }, 0);
  };

  // Get exchange rate
  const { data: exchangeRateData } = useQuery({
    queryKey: [API_ROUTES.CURRENCY, selectedCountry.currency],
    enabled: !!selectedCountry
  });

  // Exchange rate data type
  interface ExchangeRateData {
    rate: number;
    lastUpdated: string;
    fromCurrency: string;
    toCurrency: string;
  }
  
  // Update exchange rate when data changes
  useEffect(() => {
    if (exchangeRateData) {
      try {
        const data = exchangeRateData as ExchangeRateData;
        if (typeof data.rate === 'number') {
          setExchangeRate(data.rate);
        }
        if (typeof data.lastUpdated === 'string') {
          setLastUpdated(data.lastUpdated);
        }
      } catch (error) {
        console.error('Error parsing exchange rate data:', error);
      }
    }
  }, [exchangeRateData]);

  // Share modal functions
  const openShareModal = () => setIsShareModalOpen(true);
  const closeShareModal = () => setIsShareModalOpen(false);

  // Generate share URL
  const generateShareUrl = async (status?: ProductStatus) => {
    try {
      const response = await fetch(`${API_ROUTES.SHARED_LIST}${status ? `?status=${status}` : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ countryId: selectedCountry.id })
      });
      
      if (!response.ok) throw new Error('Failed to generate share URL');
      
      const data = await response.json();
      setShareUrl(data.shareUrl);
      openShareModal();
    } catch (error) {
      console.error('Error generating share URL:', error);
    }
  };
  
  // 필터 적용 함수
  const applyFilters = (scope?: View) => {
    // 적용할 필터 정보 로깅 (새로운 두단계 시스템 포함)
    console.log("Filters applied:", {
      storeTypes: selectedStoreTypes,
      purposeCategories: selectedPurposeCategories,
      categories: selectedCategories, // 호환성을 위해 유지
      priceRange,
      tags,
      scope
    });
    
    // 필터 적용 후 상품 리스트 초기화
    setCurrentProductIndex(0);
    
    // 필터가 적용된 제품 목록을 다시 불러오기 위해 쿼리 무효화
    // 모든 제품 쿼리 무효화
    queryClient.invalidateQueries({
      queryKey: [API_ROUTES.PRODUCTS],
      refetchType: 'active', // 현재 활성화된 쿼리만 다시 가져오기
    });
    
    // 사용자 제품 목록도 관련이 있으므로 함께 무효화
    queryClient.invalidateQueries({
      queryKey: [API_ROUTES.USER_PRODUCTS],
      refetchType: 'active',
    });
    
    // scope 파라미터가 전달된 경우에만 뷰 변경
    if (scope) {
      setCurrentView(scope);
    }
    // 이전 코드: setCurrentView(View.EXPLORE); - 항상 둘러보기 탭으로 이동하는 문제 해결
  };

  const value = {
    currentView,
    setCurrentView,
    selectedCountry,
    setSelectedCountry,
    
    // 새로운 두단계 카테고리 시스템
    selectedStoreTypes,
    setSelectedStoreTypes,
    selectedPurposeCategories,
    setSelectedPurposeCategories,
    isAllStoreTypesSelected,
    isAllPurposeCategoriesSelected,
    
    // 기존 카테고리 (호환성)
    selectedCategories,
    setSelectedCategories,
    addCategory,
    removeCategory,
    toggleCategory,
    isAllCategoriesSelected,
    
    currentProductIndex,
    setCurrentProductIndex,
    isShareModalOpen,
    openShareModal,
    closeShareModal,
    shareUrl,
    setShareUrl,
    generateShareUrl,
    exchangeRate,
    lastUpdated,
    
    // 필터 관련 상태 및 함수
    priceRange,
    setPriceRange,
    tags,
    setTags,
    applyFilters
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
