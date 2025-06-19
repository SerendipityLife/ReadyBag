import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ProductStatus, DEFAULT_COUNTRY, API_ROUTES, View } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { Country, Product, UserProduct } from "@shared/schema";

// 가격 범위 타입 정의
interface PriceRange {
  min: number;
  max: number;
}

// 숙박지 위치 타입 정의
export interface AccommodationLocation {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

type AppContextType = {
  currentView: View;
  setCurrentView: (view: View) => void;
  selectedCountry: Country;
  setSelectedCountry: (country: Country) => void;
  
  // 숙박지 주소 관리
  accommodationLocation: AccommodationLocation | null;
  setAccommodationLocation: (location: AccommodationLocation | null) => void;
  
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
  
  // 캘린더 활성화 상태 관리
  shouldActivateCalendar: boolean;
  setShouldActivateCalendar: (activate: boolean) => void;
  
  // 여행 날짜 선택 UI 표시 상태
  showTravelDateSelector: boolean;
  setShowTravelDateSelector: (show: boolean) => void;
  
  // 여행 날짜 관리
  travelStartDate: Date | null;
  travelEndDate: Date | null;
  setTravelStartDate: (date: Date | null) => void;
  setTravelEndDate: (date: Date | null) => void;
  
  // 저장된 여행 날짜 폴더 관리
  savedTravelDates: Array<{id: string; startDate: Date; endDate: Date; label: string}>;
  setSavedTravelDates: (dates: Array<{id: string; startDate: Date; endDate: Date; label: string}>) => void;
  selectedTravelDateId: string | null;
  setSelectedTravelDateId: (id: string | null) => void;
  addTravelDate: (startDate: Date, endDate: Date) => string;
  removeTravelDate: (id: string) => void;
  clearNonMemberData: () => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // App state
  const [currentView, setCurrentView] = useState<View>(View.EXPLORE);
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);
  
  // 숙박지 주소 상태
  const [accommodationLocation, setAccommodationLocation] = useState<AccommodationLocation | null>(null);
  
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
  
  // 캘린더 활성화 상태
  const [shouldActivateCalendar, setShouldActivateCalendar] = useState(false);
  
  // 여행 날짜 선택 UI 표시 상태
  const [showTravelDateSelector, setShowTravelDateSelector] = useState(false);
  
  // 여행 날짜 상태
  const [travelStartDate, setTravelStartDate] = useState<Date | null>(null);
  const [travelEndDate, setTravelEndDate] = useState<Date | null>(null);
  
  // 저장된 여행 날짜 폴더 상태
  const [savedTravelDates, setSavedTravelDates] = useState<Array<{id: string; startDate: Date; endDate: Date; label: string}>>([]);
  const [selectedTravelDateId, setSelectedTravelDateId] = useState<string | null>(null);

  // selectedTravelDateId 변경 시 localStorage 동기화 및 다른 컴포넌트들에게 알림
  useEffect(() => {
    console.log(`[AppContext] selectedTravelDateId 변경됨:`, selectedTravelDateId);
    if (typeof window !== 'undefined') {
      if (selectedTravelDateId) {
        localStorage.setItem('selectedTravelDateId', selectedTravelDateId);
      } else {
        localStorage.removeItem('selectedTravelDateId');
      }
      
      // 커스텀 이벤트 발생으로 다른 컴포넌트들에게 알림
      window.dispatchEvent(new CustomEvent('travelDateChanged', { 
        detail: { selectedTravelDateId } 
      }));
    }
  }, [selectedTravelDateId]);

  // 비회원 데이터 초기화 함수
  const clearNonMemberData = () => {
    if (typeof window !== 'undefined') {
      // 모든 사용자 데이터 관련 localStorage 항목 삭제
      const keysToRemove = [
        'savedTravelDates',
        'selectedTravelDateId',
        'userProducts_japan', // 일본 상품 데이터
        'userProducts_korea', // 한국 상품 데이터 (미래 확장용)
        'userProducts_china'  // 중국 상품 데이터 (미래 확장용)
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // 상태 초기화
      setSavedTravelDates([]);
      setSelectedTravelDateId(null);
      setTravelStartDate(null);
      setTravelEndDate(null);
      
      console.log('비회원 데이터가 초기화되었습니다');
      
      // 로컬 스토리지 변경 이벤트 발생
      window.dispatchEvent(new Event('localStorageChange'));
    }
  };

  // Load saved travel dates from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedDates = localStorage.getItem('savedTravelDates');
        const savedSelectedId = localStorage.getItem('selectedTravelDateId');
        
        if (savedDates) {
          const parsed = JSON.parse(savedDates);
          if (Array.isArray(parsed)) {
            // Convert date strings back to Date objects and migrate to new ID format
            const datesWithParsedDates = parsed.map((date: any) => {
              const startDate = new Date(date.startDate);
              const endDate = new Date(date.endDate);
              
              // Generate new consistent ID based on date range
              const startStr = startDate.toISOString().split('T')[0];
              const endStr = endDate.toISOString().split('T')[0];
              const newId = `travel_${startStr}_${endStr}`;
              
              return {
                ...date,
                id: newId, // Use new consistent ID
                startDate,
                endDate
              };
            });
            setSavedTravelDates(datesWithParsedDates);
            
            // Update localStorage with new ID format
            localStorage.setItem('savedTravelDates', JSON.stringify(datesWithParsedDates));
          }
        }
        
        // 기존 저장된 상품 데이터를 새로운 ID 형식으로 마이그레이션
        const savedProducts = localStorage.getItem('userProducts');
        if (savedProducts && savedDates) {
          try {
            const products = JSON.parse(savedProducts);
            const dates = JSON.parse(savedDates);
            
            if (Array.isArray(products) && Array.isArray(dates)) {
              const migratedProducts = products.map((product: any) => {
                // 기존 상품의 여행 날짜 정보로 새로운 ID 생성
                if (product.travelStartDate && product.travelEndDate) {
                  const startDate = new Date(product.travelStartDate);
                  const endDate = new Date(product.travelEndDate);
                  const startStr = startDate.toISOString().split('T')[0];
                  const endStr = endDate.toISOString().split('T')[0];
                  const newTravelDateId = `travel_${startStr}_${endStr}`;
                  
                  return {
                    ...product,
                    travelDateId: newTravelDateId
                  };
                }
                return product;
              });
              
              // 마이그레이션된 상품 데이터를 localStorage에 저장
              localStorage.setItem('userProducts', JSON.stringify(migratedProducts));
            }
          } catch (error) {
            console.error('Error migrating product data:', error);
          }
        }
        
        if (savedSelectedId) {
          setSelectedTravelDateId(savedSelectedId);
        }
      } catch (error) {
        console.error('Error loading saved travel dates:', error);
      }
    }
  }, []);

  // 여행 날짜 관리 함수
  const addTravelDate = (startDate: Date, endDate: Date): string => {
    // 날짜 범위를 기준으로 일관된 ID 생성 (YYYY-MM-DD 형식 사용하여 고유성 보장)
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    const id = `travel_${startStr}_${endStr}`;
    const label = `${startDate.getMonth() + 1}월 ${startDate.getDate()}일 - ${endDate.getMonth() + 1}월 ${endDate.getDate()}일`;
    
    // 이미 같은 날짜 범위가 있는지 확인
    const existingDate = savedTravelDates.find(date => date.id === id);
    if (existingDate) {
      // 이미 존재하는 날짜면 해당 ID로 선택만 변경
      setSelectedTravelDateId(id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedTravelDateId', id);
      }
      return id;
    }
    
    const newTravelDate = { id, startDate, endDate, label };
    
    setSavedTravelDates(prev => {
      const updated = [...prev, newTravelDate];
      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('savedTravelDates', JSON.stringify(updated));
      }
      return updated;
    });
    setSelectedTravelDateId(id);
    
    // Update localStorage for selected ID
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedTravelDateId', id);
    }
    
    return id;
  };

  const removeTravelDate = async (id: string) => {
    console.log('Removing travel date:', id);
    
    try {
      // Delete associated products first
      if (user) {
        // For logged-in users: Delete from server
        const response = await apiRequest("DELETE", `/api/user-products/by-travel-date/${id}`);
        if (response.ok) {
          console.log('서버에서 여행 날짜 관련 상품들이 삭제되었습니다:', id);
        }
      } else {
        // For non-members: Delete from localStorage
        if (typeof window !== 'undefined') {
          const storageKey = `userProducts_${selectedCountry.id}`;
          const storedData = localStorage.getItem(storageKey);
          
          if (storedData) {
            try {
              const parsedData = JSON.parse(storedData);
              if (Array.isArray(parsedData)) {
                // Remove products with matching travelDateId
                const filteredData = parsedData.filter((item: any) => item.travelDateId !== id);
                localStorage.setItem(storageKey, JSON.stringify(filteredData));
                console.log('로컬 스토리지에서 여행 날짜 관련 상품들이 삭제되었습니다:', id);
              }
            } catch (e) {
              console.error('로컬 스토리지 데이터 파싱 오류:', e);
            }
          }
        }
      }
      
      // Invalidate cache to refresh data
      queryClient.invalidateQueries({ 
        queryKey: ['user-products'] 
      });
      
    } catch (error) {
      console.error('여행 날짜 관련 상품 삭제 중 오류:', error);
    }
    
    // Remove the travel date itself
    setSavedTravelDates(prev => {
      const updated = prev.filter(date => date.id !== id);
      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('savedTravelDates', JSON.stringify(updated));
      }
      return updated;
    });
    
    if (selectedTravelDateId === id) {
      setSelectedTravelDateId(null);
      setTravelStartDate(null);
      setTravelEndDate(null);
      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('selectedTravelDateId');
      }
    }
    
    // Trigger localStorage change event to notify other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('localStorageChange'));
    }
  };

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
    
    // 숙박지 주소 상태 및 함수
    accommodationLocation,
    setAccommodationLocation,
    
    // 필터 관련 상태 및 함수
    priceRange,
    setPriceRange,
    tags,
    setTags,
    applyFilters,
    
    // 캘린더 활성화 상태 관리
    shouldActivateCalendar,
    setShouldActivateCalendar,
    
    // 여행 날짜 선택 UI 표시 상태
    showTravelDateSelector,
    setShowTravelDateSelector,
    
    // 여행 날짜 관리
    travelStartDate,
    travelEndDate,
    setTravelStartDate,
    setTravelEndDate,
    
    // 저장된 여행 날짜 폴더 관리
    savedTravelDates,
    setSavedTravelDates,
    selectedTravelDateId,
    setSelectedTravelDateId,
    addTravelDate,
    removeTravelDate,
    clearNonMemberData
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
