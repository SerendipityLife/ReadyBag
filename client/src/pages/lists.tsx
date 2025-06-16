import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProductListItem } from "@/components/product/product-list-item";
import { useAppContext } from "@/contexts/AppContext";
import { API_ROUTES, ProductStatus, CATEGORY_MAPPING } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Share2, Bookmark, Heart, X, Trash2, RefreshCw, Triangle, User, AlertTriangle, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { AdBanner } from "@/components/ads/ad-banner";
import { LocationSearch } from "@/components/location/location-search";
import { TravelDateSelector } from "@/components/travel-date-selector";


import type { UserProduct } from "@shared/schema";

export function Lists() {
  const queryClient = useQueryClient();
  const { 
    selectedCountry, 
    selectedCategories, 
    generateShareUrl, 
    exchangeRate, 
    lastUpdated, 
    travelStartDate, 
    travelEndDate,
    selectedTravelDateId,
    savedTravelDates 
  } = useAppContext();
  const { user } = useAuth();
  const isNonMember = !user; // 비회원 여부 확인
  const [activeTab, setActiveTab] = useState<ProductStatus | "location">(ProductStatus.INTERESTED);
  const [selectedIds, setSelectedIds] = useState<Record<number, boolean>>({});
  const [selectAll, setSelectAll] = useState(false);
  
  // 비회원 사용자의 로컬 스토리지 데이터 가져오기
  const getLocalUserProducts = async () => {
    try {
      if (!selectedCountry?.id) return [];
      
      const storageKey = `userProducts_${selectedCountry.id}`;
      const storedData = localStorage.getItem(storageKey);
      
      if (!storedData) return [];
        
      // 로컬 스토리지 데이터 파싱 
      const localData = JSON.parse(storedData);
      console.log("로컬 스토리지에서 로드된 상품 데이터:", localData);
      
      if (!Array.isArray(localData) || localData.length === 0) return [];
      
      // 선택된 여행 날짜 ID로 필터링
      console.log(`[Lists] 필터링 중 - 선택된 날짜: ${selectedTravelDateId}`);
      const filteredData = selectedTravelDateId 
        ? localData.filter((item: any) => item.travelDateId === selectedTravelDateId)
        : localData.filter((item: any) => !item.travelDateId); // 날짜 ID가 없는 기존 데이터
      
      console.log(`[Lists] 필터링 결과: ${filteredData.length}개 상품`);
      console.log(`[Lists] 필터링된 데이터:`, filteredData);
      
      // allProducts가 있으면 먼저 사용 (API 호출 최소화)
      if (allProducts && Array.isArray(allProducts) && allProducts.length > 0) {
        return filteredData.map((item: any) => {
          const productData = allProducts.find((p: any) => p.id === item.productId);
          if (!productData) {
            console.log(`상품을 찾을 수 없음: ${item.productId}`);
            return {
              ...item,
              product: {
                id: item.productId,
                name: `상품 정보 없음 (ID: ${item.productId})`,
                description: "",
                price: 0,
                imageUrl: "",
                category: "",
                countryId: selectedCountry.id,
                hashtags: null,
                location: null
              }
            };
          }
          return {
            ...item,
            product: productData
          };
        });
      }
      
      // API에서 실제 상품 데이터 가져오기 (allProducts가 없을 경우)
      const results = await Promise.all(
        localData.map(async (item: any) => {
          if (!item.productId) {
            console.log("잘못된 항목:", item);
            return {
              ...item,
              product: {
                id: 0,
                name: "잘못된 상품 정보",
                description: "",
                price: 0,
                imageUrl: "",
                category: "",
                countryId: selectedCountry.id,
                hashtags: null,
                location: null
              }
            };
          }
          
          try {
            const response = await fetch(`${API_ROUTES.PRODUCTS}/${item.productId}`);
            if (!response.ok) {
              console.error(`상품 ${item.productId} 가져오기 실패:`, response.status);
              return {
                ...item,
                product: {
                  id: item.productId,
                  name: `상품 정보 없음 (ID: ${item.productId})`,
                  description: "",
                  price: 0,
                  imageUrl: "",
                  category: "",
                  countryId: selectedCountry.id,
                  hashtags: null,
                  location: null
                }
              };
            }
            const productData = await response.json();
            
            return {
              ...item,
              product: productData
            };
          } catch (error) {
            console.error(`상품 ${item.productId} 정보 가져오기 오류:`, error);
            return {
              ...item,
              product: {
                id: item.productId,
                name: `상품 정보 로드 오류 (ID: ${item.productId})`,
                description: "",
                price: 0,
                imageUrl: "",
                category: "",
                countryId: selectedCountry.id,
                hashtags: null,
                location: null
              }
            };
          }
        })
      );
      
      console.log("최종 로드된 제품 수:", results.length);
      return results;
    } catch (error) {
      console.error("로컬 스토리지 읽기 오류:", error);
      return [];
    }
  };
  
  // 상품 데이터 가져오기
  const { data: allProducts = [] } = useQuery({
    queryKey: [API_ROUTES.PRODUCTS, selectedCountry.id],
    enabled: !!selectedCountry && !!selectedCountry.id,
  });
  
  // 상품 데이터가 변경되면 로컬 스토리지 데이터 검증
  useEffect(() => {
    if (!user && allProducts && Array.isArray(allProducts) && allProducts.length > 0 && selectedCountry?.id) {
      try {
        const storageKey = `userProducts_${selectedCountry.id}`;
        const storedData = localStorage.getItem(storageKey);
        
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            console.log(`로컬 스토리지에서 ${parsedData.length}개 항목 검증 중`);
            
            // 유효한 productId만 남기기
            const validProductIds = Array.isArray(allProducts) ? allProducts.map((p: any) => p.id) : [];
            let validItems = parsedData.filter((item: any) => 
              item.productId && validProductIds.includes(item.productId)
            );
            
            // "notInterested" 상태인 아이템을 "maybe"로 변경 (관심없음 -> 나중에)
            validItems = validItems.map((item: any) => {
              if (item.status === "notInterested") {
                console.log(`상품 ID ${item.productId}의 상태를 'notInterested'에서 'maybe'로 변경`);
                return { ...item, status: "maybe" };
              }
              return item;
            });
            
            // 변경 사항이 있으면 스토리지 업데이트
            if (validItems.length !== parsedData.length || validItems.some((item: any, idx: number) => item.status !== parsedData[idx].status)) {
              console.log(`로컬 스토리지 항목 업데이트: ${validItems.length}개 항목 저장`);
              localStorage.setItem(storageKey, JSON.stringify(validItems));
              
              // 이벤트 발생시켜 UI 업데이트
              window.dispatchEvent(new Event('localStorageChange'));
            }
          }
        }
      } catch (error) {
        console.error("로컬 스토리지 데이터 검증 오류:", error);
      }
    }
  }, [user, allProducts, selectedCountry?.id]);
  
  // Fetch user products
  const { data: userProducts = [], isLoading, refetch } = useQuery<
    Array<UserProduct & { product: { id: number; name: string; description: string; price: number; imageUrl: string; category: string; countryId: string; hashtags?: string[]; location?: string }}>
  >({
    queryKey: ['user-products', selectedCountry.id, selectedTravelDateId || 'no-date'],
    queryFn: async () => {
      // 비회원일 경우 로컬 스토리지에서 가져옴
      if (!user) {
        const localProducts = await getLocalUserProducts();
        return localProducts;
      }
      
      // 로그인한 사용자는 API 호출
      const url = `${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}${selectedTravelDateId ? `&travelDateId=${selectedTravelDateId}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) return [];
      return await response.json();
    },
    staleTime: 0, // Always get fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });
  
  // 여행 날짜 변경 시 데이터 리페치
  useEffect(() => {
    if (selectedCountry?.id) {
      console.log(`[Lists] 여행 날짜 변경됨: ${selectedTravelDateId}, 데이터 리페치 중...`);
      refetch();
    }
  }, [selectedTravelDateId, selectedCountry?.id, refetch]);
  
  // 대량 삭제 mutation
  const batchDelete = useMutation({
    mutationFn: async (ids: number[]) => {
      // 비회원인 경우 로컬 스토리지에서 삭제
      if (isNonMember) {
        try {
          const storageKey = `userProducts_${selectedCountry.id}`;
          const storedData = localStorage.getItem(storageKey);
          
          if (storedData) {
            const products = JSON.parse(storedData);
            // 선택된 여행 날짜에 해당하는 상품만 삭제
            const updatedProducts = products.filter((item: any) => {
              // 삭제 대상이 아니면 유지
              if (!ids.includes(item.id)) return true;
              
              // 삭제 대상이지만 다른 여행 날짜의 상품이면 유지
              const itemTravelDateId = item.travelDateId || null;
              const currentTravelDateId = selectedTravelDateId || null;
              return itemTravelDateId !== currentTravelDateId;
            });
            
            localStorage.setItem(storageKey, JSON.stringify(updatedProducts));
            console.log(`로컬 스토리지에서 ${ids.length}개 상품 삭제 완료`);
            
            // 로컬 스토리지 변경 이벤트 트리거
            window.dispatchEvent(new Event('localStorageChange'));
            
            return { success: true, count: ids.length };
          }
          
          throw new Error("로컬 스토리지에서 상품을 찾을 수 없습니다");
        } catch (error) {
          console.error("로컬 스토리지 삭제 오류:", error);
          throw error;
        }
      }
      
      // 회원인 경우 API 호출
      try {
        // 일괄 삭제를 위해 각 ID마다 개별 요청을 보냄
        const deletePromises = ids.map(id => 
          apiRequest("DELETE", `${API_ROUTES.USER_PRODUCTS}/${id}`)
        );
        
        const results = await Promise.all(deletePromises);
        return results;
      } catch (error) {
        console.error("일괄 삭제 API 오류:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log("일괄 삭제 성공, 쿼리 무효화 중...");
      
      // 특정 쿼리 무효화
      queryClient.invalidateQueries({ 
        queryKey: [`${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}`, selectedCountry.id] 
      });
      
      // 상품 쿼리 무효화
      queryClient.invalidateQueries({ 
        queryKey: [API_ROUTES.PRODUCTS, selectedCountry.id] 
      });
      
      // 모든 사용자 상품 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: [API_ROUTES.USER_PRODUCTS]
      });
      
      // 패턴 기반 쿼리 무효화
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
          return typeof queryKey === 'string' && queryKey.includes('/api/user-products');
        }
      });
      
      // 상태 초기화
      setSelectedIds({});
      setSelectAll(false);
    }
  });
  
  // 대량 상태 변경 mutation
  const batchChangeStatus = useMutation({
    mutationFn: async ({ ids, status }: { ids: number[], status: ProductStatus }) => {
      // 비회원인 경우 로컬 스토리지에서 변경
      if (isNonMember) {
        try {
          const storageKey = `userProducts_${selectedCountry.id}`;
          const storedData = localStorage.getItem(storageKey);
          
          if (storedData) {
            const products = JSON.parse(storedData);
            const updatedProducts = products.map((item: any) => {
              if (ids.includes(item.id)) {
                return { ...item, status };
              }
              return item;
            });
            
            localStorage.setItem(storageKey, JSON.stringify(updatedProducts));
            console.log(`로컬 스토리지에서 ${ids.length}개 상품 상태 변경 완료: ${status}`);
            
            // 로컬 스토리지 변경 이벤트 트리거
            window.dispatchEvent(new Event('localStorageChange'));
            
            return { success: true, count: ids.length };
          }
          
          throw new Error("로컬 스토리지에서 상품을 찾을 수 없습니다");
        } catch (error) {
          console.error("로컬 스토리지 상태 변경 오류:", error);
          throw error;
        }
      }
    
      // 회원인 경우 API 호출
      try {  
        // 각 ID마다 개별 요청을 보냄
        const updatePromises = ids.map(id => 
          apiRequest("PATCH", `${API_ROUTES.USER_PRODUCTS}/${id}`, { status })
        );
        
        const results = await Promise.all(updatePromises);
        return results;
      } catch (error) {
        console.error("일괄 상태 변경 API 오류:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log("일괄 상태 변경 성공, 쿼리 무효화 중...");
      
      // 특정 쿼리 무효화
      queryClient.invalidateQueries({ 
        queryKey: [`${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}`, selectedCountry.id] 
      });
      
      // 모든 사용자 상품 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: [API_ROUTES.USER_PRODUCTS]
      });
      
      // 패턴 기반 쿼리 무효화
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
          return typeof queryKey === 'string' && queryKey.includes('/api/user-products');
        }
      });
      
      // 상태 초기화
      setSelectedIds({});
      setSelectAll(false);
    }
  });
  
  // TypeScript 타입 정의
  type ExtendedUserProduct = UserProduct & {
    product: {
      id: number;
      name: string;
      description: string;
      price: number;
      imageUrl: string;
      category: string;
      countryId: string;
      hashtags?: string[];
      location?: string;
    }
  };

  // 상품 카테고리 정규화 함수 (통합된 카테고리로 매핑)
  const normalizeCategory = (category: string): string => {
    if (!category) return "";
    return category in CATEGORY_MAPPING 
      ? CATEGORY_MAPPING[category as keyof typeof CATEGORY_MAPPING]
      : category;
  };

  // 카테고리 필터링 상태 확인
  const isAllCategoriesSelected = selectedCategories.includes("ALL") || selectedCategories.length === 0;

  // 상품이 선택된 카테고리에 포함되는지 확인하는 함수
  const isProductInSelectedCategories = (product: any): boolean => {
    if (!product || !product.category) return false;
    
    // 상품의 원래 카테고리와 정규화된 카테고리 모두 확인
    const originalCategory = product.category;
    const normalizedCategory = normalizeCategory(originalCategory);
    
    // 디버깅 정보
    console.log(`상품 카테고리 확인: ${originalCategory} → ${normalizedCategory}, 선택됨: ${selectedCategories.includes(originalCategory) || selectedCategories.includes(normalizedCategory)}`);
    
    // 원래 카테고리나 정규화된 카테고리가 선택된 카테고리에 포함되면 true
    return selectedCategories.includes(originalCategory) || 
           selectedCategories.includes(normalizedCategory);
  };

  // 카테고리 필터링과 상태 필터링을 함께 적용
  const getProductsByStatus = (status: ProductStatus) => {
    // 먼저 상태로 필터링
    const filteredByStatus = userProducts.filter((up) => up.status === status) as ExtendedUserProduct[];
    
    // 모든 카테고리가 선택되었으면 추가 필터링 없이 반환
    if (isAllCategoriesSelected) {
      return filteredByStatus;
    }
    
    // 디버깅 정보
    console.log(`필터링 전 ${status} 상품 수:`, filteredByStatus.length);
    console.log("선택된 카테고리:", selectedCategories);
    
    // 선택된 카테고리에 따라 필터링
    const result = filteredByStatus.filter(userProduct => 
      isProductInSelectedCategories(userProduct.product)
    );
    
    // 디버깅 정보
    console.log(`필터링 후 ${status} 상품 수:`, result.length);
    
    return result;
  };
  
  const interestedProducts = getProductsByStatus(ProductStatus.INTERESTED) || [];
  const maybeProducts = getProductsByStatus(ProductStatus.MAYBE) || [];
  
  // Get count badge for each tab
  const getCountBadge = (count: number) => (
    <span className="ml-1 bg-primary text-white rounded-full text-xs px-2 py-0.5">
      {count}
    </span>
  );
  
  // Handle share button click
  const handleShare = () => {
    if (activeTab !== "location" && Object.values(ProductStatus).includes(activeTab as ProductStatus)) {
      generateShareUrl(activeTab as ProductStatus);
    }
  };
  
  // 체크박스 변경 처리
  const handleCheckboxChange = (id: number, checked: boolean) => {
    setSelectedIds(prev => ({ ...prev, [id]: checked }));
  };

  // 전체 선택/해제 처리
  const handleSelectAllChange = (checked: boolean) => {
    setSelectAll(checked);
    
    if (checked) {
      // 현재 활성 탭의 모든 제품 선택
      const productsToSelect = activeTab === ProductStatus.INTERESTED ? interestedProducts : maybeProducts;
      
      const newSelectedIds: Record<number, boolean> = {};
      productsToSelect.forEach(product => {
        newSelectedIds[product.id] = true;
      });
      setSelectedIds(newSelectedIds);
    } else {
      // 모두 선택 해제
      setSelectedIds({});
    }
  };

  // 대량 삭제 처리
  const handleBatchDelete = () => {
    const ids = Object.entries(selectedIds)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => parseInt(id));
    
    if (ids.length > 0) {
      batchDelete.mutate(ids);
    }
  };

  // 대량 상태 변경 처리
  const handleBatchChangeStatus = (newStatus: ProductStatus) => {
    const ids = Object.entries(selectedIds)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => parseInt(id));
    
    if (ids.length > 0) {
      batchChangeStatus.mutate({ ids, status: newStatus });
    }
  };

  // 현재 선택된 항목 수 계산
  const selectedCount = Object.values(selectedIds).filter(Boolean).length;

  // Render content for a tab
  const renderTabContent = (products: ExtendedUserProduct[], status: ProductStatus) => {
    if (isLoading) {
      return (
        <div className="p-8 text-center text-neutral">
          <p>목록을 불러오는 중...</p>
        </div>
      );
    }
    
    if (products.length === 0) {
      let emptyMessage = "";
      let emptyIcon = null;
      
      switch (status) {
        case ProductStatus.INTERESTED:
          emptyMessage = "관심 있는 상품들이 여기에 표시됩니다.";
          emptyIcon = <Heart className="w-16 h-16 mb-4 opacity-20" />;
          break;
        case ProductStatus.MAYBE:
          emptyMessage = "나중에 볼 상품들이 여기에 표시됩니다.";
          emptyIcon = <Bookmark className="w-16 h-16 mb-4 opacity-20" />;
          break;
      }
      
      return (
        <div className="p-8 text-center text-neutral">
          {emptyIcon}
          <p>{emptyMessage}</p>
        </div>
      );
    }
    
    // 선택 관련 버튼 렌더링
    const renderActionButtons = () => {
      if (products.length === 0) return null;
      
      return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 border-b pb-3 gap-3">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="select-all" 
              checked={selectAll}
              onCheckedChange={handleSelectAllChange}
            />
            <label htmlFor="select-all" className="text-sm cursor-pointer select-none">
              전체 선택 {selectedCount > 0 && `(${selectedCount}/${products.length})`}
            </label>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* 고민중 탭에서 관심으로 이동하는 전용 버튼 */}
            {status === ProductStatus.MAYBE && products.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-8 flex-grow sm:flex-grow-0 text-red-500 border-red-200 hover:bg-red-50"
                onClick={() => batchChangeStatus.mutate({ 
                  ids: products.map(p => p.id), 
                  status: ProductStatus.INTERESTED 
                })}
                disabled={batchChangeStatus.isPending}
              >
                <Heart className="h-3 w-3 mr-1 sm:mr-2" />
                모두 관심으로
              </Button>
            )}

            {selectedCount > 0 && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs h-8 flex-grow sm:flex-grow-0">
                      <RefreshCw className="h-3 w-3 mr-1 sm:mr-2" />
                      분류변경
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-40">
                    {status !== ProductStatus.INTERESTED && (
                      <DropdownMenuItem onClick={() => handleBatchChangeStatus(ProductStatus.INTERESTED)}>
                        <Heart className="h-4 w-4 mr-2 text-red-500" />
                        관심
                      </DropdownMenuItem>
                    )}
                    {status !== ProductStatus.MAYBE && (
                      <DropdownMenuItem onClick={() => handleBatchChangeStatus(ProductStatus.MAYBE)}>
                        <Triangle className="h-4 w-4 mr-2 text-gray-600" />
                        나중에
                      </DropdownMenuItem>
                    )}

                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-8 flex-grow sm:flex-grow-0 text-red-500 border-red-200 hover:bg-red-500 hover:text-white"
                  onClick={handleBatchDelete}
                >
                  <Trash2 className="h-3 w-3 mr-1 sm:mr-2" />
                  선택 삭제
                </Button>
              </>
            )}
            
            {products.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-8 flex-grow sm:flex-grow-0 text-red-500 border-red-200 hover:bg-red-500 hover:text-white"
                onClick={() => batchDelete.mutate(products.map(p => p.id))}
              >
                <Trash2 className="h-3 w-3 mr-1 sm:mr-2" />
                전체 삭제
              </Button>
            )}
          </div>
        </div>
      );
    };
    
    return (
      <div>
        {renderActionButtons()}
        
        <div className="grid grid-cols-1 gap-4">
          {products.map((userProduct: ExtendedUserProduct) => (
            <div key={userProduct.id} className="flex items-start space-x-2">
              <div className="pt-3 md:pt-8">
                <Checkbox 
                  checked={!!selectedIds[userProduct.id]} 
                  onCheckedChange={(checked) => handleCheckboxChange(userProduct.id, !!checked)}
                />
              </div>
              <div className="flex-1">
                <ProductListItem
                  product={userProduct.product as any}
                  userProduct={userProduct}
                  onSuccessfulAction={refetch}
                  travelStartDate={travelStartDate}
                  travelEndDate={travelEndDate}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="w-full max-w-3xl mx-auto pb-20">
      {/* 메인 헤더 아래 위치하도록 top 값 조정 (헤더 높이 + 여백) */}
      <div className="sticky top-[60px] md:top-[68px] z-40 bg-gray-50 pt-2 pb-2 border-b border-gray-100 shadow-sm">
        {/* 환율 정보와 여행 날짜 선택 - 한 줄에 두 칸으로 배치 */}
        <div className="bg-white rounded-lg p-2 mb-2 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            {/* 환율 정보 */}
            {exchangeRate && (
              <div className="flex items-center text-xs text-gray-600">
                <div className="flex items-center whitespace-nowrap">
                  <span className="font-medium mr-1">100{selectedCountry.currency === "JPY" ? "엔" : selectedCountry.currency} =</span>
                  <span className="font-semibold text-red-500">
                    {(exchangeRate * 100).toFixed(0)}원
                  </span>
                  <span className="ml-1 px-1 bg-green-50 text-green-600 rounded text-[10px]">LIVE</span>
                </div>
              </div>
            )}
            
            {/* 여행 날짜 선택 */}
            <div className="flex items-center">
              <TravelDateSelector
                startDate={travelStartDate}
                endDate={travelEndDate}
                onDatesChange={(start, end) => {
                  // 날짜 변경 시 쿼리 무효화하여 새로운 데이터 로드
                  queryClient.invalidateQueries({ 
                    queryKey: [`${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}&travelDateId=${selectedTravelDateId || ''}`, selectedCountry.id, selectedTravelDateId] 
                  });
                  refetch();
                }}
                mode="select"
              />
            </div>

          </div>
        </div>

        {/* 탭 리스트 영역 - 스크롤해도 고정 */}
        <div className="bg-white rounded-lg shadow-sm w-full">
          <Tabs
            defaultValue={ProductStatus.INTERESTED}
            onValueChange={(value) => {
              if (value === "location" || Object.values(ProductStatus).includes(value as ProductStatus)) {
                setActiveTab(value as ProductStatus | "location");
              }
            }}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-3 bg-white rounded-lg mb-2">
              <TabsTrigger
                value={ProductStatus.INTERESTED}
                className="flex items-center justify-center"
              >
                <span className="text-red-500">관심</span> {getCountBadge(interestedProducts.length)}
              </TabsTrigger>
              <TabsTrigger
                value={ProductStatus.MAYBE}
                className="flex items-center justify-center"
              >
                <span className="text-gray-600">고민중</span> {getCountBadge(maybeProducts.length)}
              </TabsTrigger>
              <TabsTrigger
                value="location"
                className="flex items-center justify-center"
              >
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-blue-600">위치</span>
              </TabsTrigger>

            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* 탭 컨텐츠 영역 - 스크롤 가능 */}
      <div className="mt-2">
        <Tabs
          defaultValue={ProductStatus.INTERESTED}
          value={activeTab}
          className="w-full"
        >
          <TabsContent value={ProductStatus.INTERESTED}>
            <div>
              {/* 메인 컨텐츠 */}
              <div className="w-full">
                {renderTabContent(interestedProducts, ProductStatus.INTERESTED)}
              </div>
            </div>
            
            {interestedProducts.length > 0 && (
              <div className="mt-6 text-center">
                {user ? (
                  <Button
                    onClick={handleShare}
                    className="bg-primary text-white w-full sm:w-auto py-3 px-6 rounded-full font-medium shadow-md hover:bg-opacity-90 transition-colors"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    관심 목록 공유하기
                  </Button>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Button
                      onClick={() => window.location.href = "/auth"}
                      className="bg-primary text-white w-full sm:w-auto py-3 px-6 rounded-full font-medium shadow-md hover:bg-opacity-90 transition-colors"
                    >
                      <User className="mr-2 h-4 w-4" />
                      회원가입하여 목록 유지 및 공유하기
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2 p-2 bg-yellow-50 rounded-md border border-yellow-200 max-w-md">
                      <AlertTriangle className="inline-block mr-1 h-3 w-3 text-yellow-500" />
                      비회원은 페이지 이탈 시 저장된 상품이 모두 사라집니다.
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value={ProductStatus.MAYBE}>
            <div>
              {/* 메인 컨텐츠 */}
              <div className="w-full">
                {renderTabContent(maybeProducts, ProductStatus.MAYBE)}
              </div>
            </div>
          </TabsContent>



          <TabsContent value="location">
            <div className="w-full">
              <LocationSearch />
            </div>
          </TabsContent>


        </Tabs>
      </div>
    </div>
  );
}