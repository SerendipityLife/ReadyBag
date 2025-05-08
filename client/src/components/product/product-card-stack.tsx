import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProductCard } from "@/components/product/product-card";
import { ActionButtons } from "@/components/product/action-buttons";
import { CurrencyInfoPanel } from "@/components/ui/currency-display";
import { useAppContext } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { API_ROUTES, ProductStatus, SwipeDirection, SWIPE_TO_STATUS } from "@/lib/constants";
import type { Product, UserProduct } from "@shared/schema";

export function ProductCardStack() {
  const queryClient = useQueryClient();
  const { 
    selectedCountry, 
    selectedCategories,
    isAllCategoriesSelected,
    setCurrentProductIndex,
    priceRange,
    tags
  } = useAppContext();
  const { user } = useAuth();
  
  // 상태들 선언
  const [visibleProducts, setVisibleProducts] = useState<Product[]>([]);
  const [originalTotalProducts, setOriginalTotalProducts] = useState(0);
  const [processingProductIds, setProcessingProductIds] = useState<Set<number>>(new Set());
  const [forceReset, setForceReset] = useState(false);
  
  // API 요청을 위한 필터 파라미터 구성
  const filterParams = useMemo(() => {
    const params: Record<string, string> = { countryId: selectedCountry.id };
    
    // 카테고리 필터링
    if (!isAllCategoriesSelected && selectedCategories.length > 0) {
      params.categories = selectedCategories.join(',');
    }
    
    // 가격 범위 필터링
    if (priceRange) {
      if (priceRange.min > 0) {
        params.minPrice = priceRange.min.toString();
      }
      if (priceRange.max < Number.MAX_SAFE_INTEGER) {
        params.maxPrice = priceRange.max.toString();
      }
    }
    
    // 태그 필터링
    if (tags && tags.length > 0) {
      params.tags = tags.join(',');
    }
    
    return params;
  }, [selectedCountry.id, selectedCategories, isAllCategoriesSelected, priceRange, tags]);
  
  // Fetch products for the selected country with filters
  const { data: allProducts = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: [API_ROUTES.PRODUCTS, filterParams],
    queryFn: async () => {
      // URL 파라미터 구성
      const queryParams = new URLSearchParams();
      Object.entries(filterParams).forEach(([key, value]) => {
        queryParams.append(key, value);
      });
      
      // API 요청
      const response = await fetch(`${API_ROUTES.PRODUCTS}?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    },
    enabled: !!selectedCountry && !!selectedCountry.id,
  });
  
  // 로컬 스토리지에서 사용자 상품 데이터 가져오기
  const getLocalUserProducts = () => {
    // 강제 리셋 모드면 빈 배열 반환
    if (forceReset) return [];
    
    try {
      if (!selectedCountry?.id) return [];
      
      const storageKey = `userProducts_${selectedCountry.id}`;
      const storedData = localStorage.getItem(storageKey);
      
      if (!storedData) return [];
      
      try {
        const parsedData = JSON.parse(storedData);
        
        if (!Array.isArray(parsedData)) {
          console.error("로컬 스토리지 데이터가 배열이 아님:", parsedData);
          localStorage.removeItem(storageKey);
          return [];
        }
        
        return parsedData;
      } catch (e) {
        console.error("로컬 스토리지 데이터 파싱 오류:", e);
        localStorage.removeItem(storageKey);
        return [];
      }
    } catch (error) {
      console.error("로컬 스토리지 접근 오류:", error);
      return [];
    }
  };
  
  // 로그인 상태에 따라 사용자 상품 데이터 가져오기
  const { data: userProducts = [], isLoading: userProductsLoading } = useQuery<UserProduct[]>({
    queryKey: [`${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}`, selectedCountry.id],
    queryFn: async () => {
      // 비회원일 경우 로컬 스토리지에서 가져옴
      if (!user) {
        return getLocalUserProducts();
      }
      
      // 로그인한 사용자는 API 호출
      if (!selectedCountry?.id) return [];
      
      const response = await fetch(`${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}`);
      if (!response.ok) return [];
      return await response.json();
    },
    enabled: !!selectedCountry && !!selectedCountry.id,
  });
  
  // 로컬 스토리지 및 로그아웃 이벤트 감지
  useEffect(() => {
    const handleStorageChange = (event: Event) => {
      console.log("[ProductCardStack] 로컬 스토리지 변경 감지됨", event.type);
      
      // auth 페이지에서 전체 삭제 확인 (데이터 초기화 케이스)
      const isFullReset = event.type === 'localStorageChange' && 
                         !localStorage.getItem(`userProducts_${selectedCountry.id}`);
      
      if (isFullReset) {
        console.log("[ProductCardStack] 전체 초기화 감지됨 - 강제 리셋 모드 활성화");
        
        // 강제 리셋 모드 활성화
        setForceReset(true);
        
        // 모든 관련 상태 초기화
        setVisibleProducts([]);
        setCurrentProductIndex(0);
        
        // 데이터 리로드
        queryClient.invalidateQueries({ 
          queryKey: [`${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}`, selectedCountry.id] 
        });
        
        queryClient.invalidateQueries({ 
          queryKey: [API_ROUTES.PRODUCTS, selectedCountry.id] 
        });
      } else {
        // 일반 변경일 경우 단순 쿼리 무효화
        queryClient.invalidateQueries({ 
          queryKey: [`${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}`, selectedCountry.id] 
        });
      }
    };
    
    // 로그아웃 이벤트 처리
    const handleLogoutReset = (event: Event) => {
      console.log("[ProductCardStack] 로그아웃 감지 - 상품 목록 초기화");
      
      // 현재 국가의 로컬 스토리지 데이터 초기화
      if (selectedCountry?.id) {
        localStorage.removeItem(`userProducts_${selectedCountry.id}`);
      }
      
      // 모든 상태 초기화
      setForceReset(true);
      setVisibleProducts([]);
      setCurrentProductIndex(0);
      
      // 데이터 리로드
      queryClient.invalidateQueries({ 
        queryKey: [`${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}`, selectedCountry.id] 
      });
      
      queryClient.invalidateQueries({ 
        queryKey: [API_ROUTES.PRODUCTS, selectedCountry.id] 
      });
      
      // 모든 상품 상태 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: [API_ROUTES.USER_PRODUCTS]
      });
    };
    
    // 일반 storage 이벤트 (다른 탭에서 변경 시)
    window.addEventListener('storage', handleStorageChange);
    
    // 커스텀 이벤트 (같은 탭 내에서 변경 시)
    window.addEventListener('localStorageChange', handleStorageChange);
    
    // 로그아웃 이벤트 리스너 추가
    window.addEventListener('localStorageReset', handleLogoutReset);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleStorageChange);
      window.removeEventListener('localStorageReset', handleLogoutReset);
    };
  }, [queryClient, selectedCountry?.id, setCurrentProductIndex]);
  
  // Get already categorized product IDs - 간단한 계산으로 변경
  const categorizedProductIds = useMemo(() => {
    if (forceReset) return []; // 강제 리셋 모드면 빈 배열 반환
    return userProducts.map(up => up.productId);
  }, [userProducts, forceReset]);
  
  // Calculate total number of products in the selected category
  const totalCategoryCount = useMemo(() => {
    if (isAllCategoriesSelected) {
      return allProducts.filter(p => !categorizedProductIds.includes(p.id)).length;
    } else {
      return allProducts.filter(p => {
        return !categorizedProductIds.includes(p.id) && 
               selectedCategories.includes(p.category || "");
      }).length;
    }
  }, [allProducts, categorizedProductIds, selectedCategories, isAllCategoriesSelected]);
  
  // Filter products by selected categories AND exclude already categorized products
  const filteredProducts = useMemo(() => {
    // 디버깅용 로그
    console.log("Selected Categories:", selectedCategories);
    console.log("isAllCategoriesSelected:", isAllCategoriesSelected);
    console.log("Some products:", allProducts.slice(0, 3).map(p => ({id: p.id, name: p.name, category: p.category})));
    console.log("[BottomNavigation] Interested count:", userProducts.filter(p => p.status === "interested").length);
    
    let filtered = allProducts;
    
    // 강제 리셋 상태가 아닐 때만 이미 분류된 상품 필터링
    if (!forceReset) {
      filtered = filtered.filter(product => !categorizedProductIds.includes(product.id));
    }
    
    // Then filter by selected categories if ALL is not selected
    if (!isAllCategoriesSelected) {
      filtered = filtered.filter(product => {
        // Make sure the product has a category
        if (!product.category) {
          return false;
        }
        
        // Check if this product's category is in the selected categories
        const isInSelectedCategory = selectedCategories.includes(product.category);
        return isInSelectedCategory;
      });
    }
    
    return filtered;
  }, [allProducts, categorizedProductIds, selectedCategories, isAllCategoriesSelected, forceReset, userProducts]);

  // 필터링된 상품이 변경되면 visible 상품과 카운트 초기화
  useEffect(() => {
    // totalCategoryCount가 변경됐을 때만 originalTotalProducts 업데이트
    if (totalCategoryCount !== originalTotalProducts) {
      setOriginalTotalProducts(totalCategoryCount);
    }
    
    // 필터링된 상품이 비어있지 않고 visible 상품이 비어있을 때만 업데이트
    if (filteredProducts.length > 0 && visibleProducts.length === 0) {
      setVisibleProducts([]);
      setCurrentProductIndex(0);
    }
    
    // 필터링된 상품이 있으면 강제 리셋 모드 비활성화
    if (filteredProducts.length > 0 && forceReset) {
      const timer = setTimeout(() => {
        setForceReset(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [filteredProducts, totalCategoryCount, originalTotalProducts, visibleProducts.length, setCurrentProductIndex, forceReset]);
  
  const isLoading = productsLoading || userProductsLoading;
  
  // Update user product status mutation
  const updateProductStatus = useMutation({
    mutationFn: async ({ productId, status }: { productId: number, status: ProductStatus }) => {
      const response = await apiRequest(
        "POST",
        `${API_ROUTES.USER_PRODUCTS}`,
        { productId, status }
      );
      return response.json();
    },
    onSuccess: () => {
      // 여러 쿼리를 동시에 무효화
      console.log("상품 상태 업데이트 성공, 쿼리 무효화 중...");
      
      // 일반 문자열 형식 쿼리키 무효화
      queryClient.invalidateQueries({ 
        queryKey: [API_ROUTES.USER_PRODUCTS] 
      });
      
      // countryId가 포함된 상세 쿼리키 무효화
      queryClient.invalidateQueries({ 
        queryKey: [`${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}`, selectedCountry.id] 
      });
    }
  });
  
  // 필터링된 제품 목록이 변경되었거나 가시적인 제품이 없을 때 초기화
  const visibleProductsToShow = useMemo(() => {
    // 강제 리셋 상태면 무조건 필터링된 상품 표시
    if (forceReset && filteredProducts.length > 0) {
      return filteredProducts.slice(0, 3);
    }
    
    // 필터링된 상품이 있고, 원래 상품 수와 다르면 새로운 상품으로 갱신
    if (filteredProducts.length > 0 && 
        filteredProducts.length !== originalTotalProducts) {
      return filteredProducts.slice(0, 3);
    }
    
    // 필터링된 상품은 있지만 보여줄 상품이 없으면 새로 설정
    if (filteredProducts.length > 0 && visibleProducts.length === 0) {
      return filteredProducts.slice(0, 3); 
    }
    
    // 그 외에는 기존 상품 유지 (상태 변경 최소화)
    return visibleProducts;
  }, [filteredProducts, originalTotalProducts, forceReset, visibleProducts.length]);
  
  // visibleProductsToShow가 변경될 때만 업데이트
  useEffect(() => {
    // 깊은 비교를 통해 실제 내용이 다를 때만 업데이트
    const currentIds = visibleProducts.map(p => p.id).sort().join(',');
    const newIds = visibleProductsToShow.map(p => p.id).sort().join(',');
    
    if (currentIds !== newIds) {
      setVisibleProducts(visibleProductsToShow);
    }
  }, [visibleProductsToShow]);
    
  // 비회원일 경우 로컬 스토리지에 상품 상태 저장
  const saveToLocalStorage = (productId: number, status: ProductStatus) => {
    try {
      const storageKey = `userProducts_${selectedCountry.id}`;
      let localProducts = [];
      
      // 기존 데이터 가져오기
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        localProducts = JSON.parse(storedData);
      }
      
      // 기존 상품이 있는지 확인
      const existingIndex = localProducts.findIndex((item: any) => item.productId === productId);
      
      if (existingIndex >= 0) {
        // 이미 있는 상품이면 상태 업데이트
        localProducts[existingIndex].status = status;
      } else {
        // 없는 상품이면 새로 추가
        localProducts.push({
          id: Date.now(), // 임시 id 생성
          productId,
          status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      // 로컬 스토리지에 저장
      localStorage.setItem(storageKey, JSON.stringify(localProducts));
      
      // 로컬 스토리지 변경 이벤트 트리거 (다른 컴포넌트에 알림)
      window.dispatchEvent(new Event('localStorageChange'));
      
      // 쿼리 무효화하기
      queryClient.invalidateQueries({ 
        queryKey: [`${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}`, selectedCountry.id] 
      });
      
      console.log("로컬 스토리지에 저장 완료:", status);
      
    } catch (error) {
      console.error("로컬 스토리지 저장 오류:", error);
    }
  };

  // Handle swipe on cards
  const handleSwipe = (direction: SwipeDirection, productId: number) => {
    // 이미 처리 중인 제품인지 확인
    if (processingProductIds.has(productId)) {
      console.log("이미 처리 중인 제품입니다:", productId);
      return;
    }
    
    // 처리 중인 제품으로 표시
    setProcessingProductIds(prev => {
      const newSet = new Set(prev);
      newSet.add(productId);
      return newSet;
    });
    
    const status = SWIPE_TO_STATUS[direction];
    
    if (user) {
      // 로그인한 사용자: API 호출로 상태 저장
      updateProductStatus.mutate({ productId, status }, {
        onSuccess: () => {
          // 성공 후 처리 중인 제품 목록에서 제거
          setProcessingProductIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(productId);
            return newSet;
          });
        },
        onError: () => {
          // 에러 발생 시에도 처리 중인 제품 목록에서 제거
          setProcessingProductIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(productId);
            return newSet;
          });
        }
      });
    } else {
      // 비회원: 로컬 스토리지에 저장
      saveToLocalStorage(productId, status);
      
      // 처리 완료 후 처리 중인 제품 목록에서 제거
      setProcessingProductIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
    
    // Remove the swiped card and add the next one in queue
    setVisibleProducts(prev => {
      const remaining = prev.filter(p => p.id !== productId);
      const currentIndex = filteredProducts.findIndex(p => p.id === productId);
      const nextIndex = currentIndex + 3;
      
      // Update the current product index
      setCurrentProductIndex(currentIndex + 1);
      
      if (nextIndex < filteredProducts.length) {
        return [...remaining, filteredProducts[nextIndex]];
      }
      
      return remaining;
    });
  };
  
  // Handle action button clicks
  const handleActionClick = (direction: SwipeDirection) => {
    if (visibleProducts.length === 0) return;
    
    const topProductId = visibleProducts[0].id;
    handleSwipe(direction, topProductId);
  };
  
  // Calculate position for progress indicator
  const currentPosition = useMemo(() => {
    // 강제 리셋 모드일 경우 처음부터 시작
    if (forceReset) return 1;
    
    // 필터링된 상품이 없거나 모든 상품이 초기화된 상태면 처음부터 시작
    if (filteredProducts.length === allProducts.length && allProducts.length > 0) {
      return 1; // 모든 제품이 다시 보이는 상태 (초기화 후)
    }
    
    if (originalTotalProducts > 0) {
      return Math.max(1, originalTotalProducts - filteredProducts.length + 1);
    }
    
    return 0;
  }, [filteredProducts.length, originalTotalProducts, allProducts.length, forceReset]);
  
  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    if (forceReset || (originalTotalProducts === 0 && allProducts.length > 0)) {
      return 0; // 초기화 후에는 0%부터 다시 시작
    }
    
    return originalTotalProducts > 0 ? 
      ((currentPosition - 1) / originalTotalProducts) * 100 : 0;
  }, [currentPosition, originalTotalProducts, allProducts.length, forceReset]);
  
  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto flex items-center justify-center h-[500px]">
        <div className="text-center">
          <p>상품을 불러오는 중...</p>
        </div>
      </div>
    );
  }
  
  if (filteredProducts.length === 0) {
    // 두 가지 경우를 구분: 전체 상품이 없는 경우 vs 모든 상품을 이미 분류한 경우
    const noProductsInCategory = allProducts.filter(p => {
        return !categorizedProductIds.includes(p.id) && 
              (isAllCategoriesSelected || selectedCategories.includes(p.category || ""));
      }).length === 0;

    if (noProductsInCategory && categorizedProductIds.length === 0) {
      // 이 카테고리에 상품이 없는 경우
      return (
        <div className="w-full max-w-md mx-auto flex items-center justify-center h-[500px]">
          <div className="text-center">
            <p>선택한 카테고리에 등록된 상품이 없습니다.</p>
          </div>
        </div>
      );
    } else {
      // 더 이상 볼 상품이 없는 경우 (모두 분류됨)
      return (
        <div className="w-full max-w-md mx-auto flex items-center justify-center h-[500px]">
          <div className="text-center">
            <p>모든 상품을 확인했습니다! 🎉</p>
            <p className="mt-2 text-sm text-gray-500">관심 상품은 '내 목록'에서 확인할 수 있습니다.</p>
          </div>
        </div>
      );
    }
  }
  
  return (
    <div className="w-full max-w-md mx-auto px-3">
      <CurrencyInfoPanel />
      
      <div className="card-stack relative h-[540px] md:h-[580px] w-full mx-auto">
        {visibleProducts.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            index={index}
            total={visibleProducts.length}
            onSwipe={(direction) => handleSwipe(direction, product.id)}
            isProcessing={processingProductIds.has(product.id)}
          />
        ))}

        {/* 진행상황 표시 */}
        {filteredProducts.length > 0 && (
          <div className="mt-4 flex flex-col items-center gap-1">
            <div className="w-64 h-1 bg-gray-200 rounded-full">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {currentPosition} / {Math.max(originalTotalProducts, filteredProducts.length)}
            </p>
          </div>
        )}
      </div>
      
      <ActionButtons onActionClick={handleActionClick} />
      
      {/* 비회원 사용자일 경우 안내 메시지 */}
      {!user && (
        <div className="w-full max-w-md mx-auto text-center mt-6 text-gray-500 text-sm">
          <p>비회원으로 이용 중입니다. 목록이 브라우저에 임시 저장됩니다.</p>
          <p>로그인 후 이용하시면 데이터가 안전하게 보관됩니다.</p>
        </div>
      )}
    </div>
  );
}