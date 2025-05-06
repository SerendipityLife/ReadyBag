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
    setCurrentProductIndex 
  } = useAppContext();
  const { user } = useAuth();
  
  // 상태들 선언
  const [visibleProducts, setVisibleProducts] = useState<Product[]>([]);
  const [originalTotalProducts, setOriginalTotalProducts] = useState(0);
  const [processingProductIds, setProcessingProductIds] = useState<Set<number>>(new Set());
  
  // Fetch products for the selected country
  const { data: allProducts = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: [API_ROUTES.PRODUCTS, selectedCountry.id],
    enabled: !!selectedCountry && !!selectedCountry.id,
  });
  
  // 로컬 스토리지에서 사용자 상품 데이터 가져오기
  const getLocalUserProducts = () => {
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
        
        // 유효한 productId를 가진 데이터만 필터링
        const validData = parsedData.filter(item => 
          item && typeof item === 'object' && Number.isInteger(item.productId)
        );
        
        // 원본 데이터와 다르면 정리된 데이터 저장
        if (validData.length !== parsedData.length) {
          console.log(`유효하지 않은 ${parsedData.length - validData.length}개 항목 제거됨`);
          localStorage.setItem(storageKey, JSON.stringify(validData));
          
          // 로컬 스토리지 변경 이벤트 트리거
          window.dispatchEvent(new Event('localStorageChange'));
        }
        
        return validData;
      } catch (parseError) {
        console.error("로컬 스토리지 데이터 파싱 오류:", parseError);
        localStorage.removeItem(storageKey);
        return [];
      }
    } catch (error) {
      console.error("로컬 스토리지 읽기 오류:", error);
    }
    return [];
  };
  
  // Fetch user products to filter out already categorized ones
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
  
  // 로컬 스토리지 변경 감지 (비회원용)
  useEffect(() => {
    if (!user) {
      const handleStorageChange = (event: Event) => {
        console.log("[ProductCardStack] 로컬 스토리지 변경 감지됨", event.type);
        
        // auth 페이지에서 전체 삭제 확인 (데이터 초기화 케이스)
        const isFullReset = event.type === 'localStorageChange' && 
                           !localStorage.getItem(`userProducts_${selectedCountry.id}`);
        
        // 1. 사용자 상품 쿼리 무효화
        queryClient.invalidateQueries({ 
          queryKey: [`${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}`, selectedCountry.id] 
        });
        
        // 2. 상품 목록 쿼리 무효화 (삭제된 상품이 다시 보이도록)
        queryClient.invalidateQueries({ 
          queryKey: [API_ROUTES.PRODUCTS, selectedCountry.id] 
        });
        
        // 3. 상태 초기화 - visible 상품들과 현재 인덱스 초기화
        setVisibleProducts([]);
        setCurrentProductIndex(0);
        
        // 4. 기존 필터링된 상품 목록 강제 리셋 (auth 페이지 방문 후 완전히 새로 보이도록)
        if (isFullReset) {
          // 지연 설정으로 쿼리 무효화 이후에 실행되도록 함
          setTimeout(() => {
            // 상품 목록의 완전한 리셋을 위해 전체 컴포넌트 리렌더링 강제
            setOriginalTotalProducts(allProducts.length);
            
            // categorizedProductIds 배열을 강제로 비우기
            setLocalCategorizedIds([]);
            
            console.log("[ProductCardStack] 로컬 스토리지 초기화 감지 - 카드 스택 완전 리셋");
            
            // 다시 현재 화면 업데이트를 위해 쿼리 재시도
            queryClient.refetchQueries({ 
              queryKey: [API_ROUTES.PRODUCTS, selectedCountry.id] 
            });
          }, 100);
        }
      };
      
      // 일반 storage 이벤트 (다른 탭에서 변경 시)
      window.addEventListener('storage', handleStorageChange);
      
      // 커스텀 이벤트 (같은 탭 내에서 변경 시)
      window.addEventListener('localStorageChange', handleStorageChange);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('localStorageChange', handleStorageChange);
      };
    }
  }, [user, queryClient, selectedCountry?.id, setCurrentProductIndex, allProducts.length]);
  
  // categorizedProductIds 컴포넌트 상태
  const [localCategorizedIds, setLocalCategorizedIds] = useState<number[]>([]);
  
  // Get already categorized product IDs
  const categorizedProductIds = useMemo(() => {
    // 로컬에서 강제로 설정한 값이 있으면 그것을 우선 사용
    if (localCategorizedIds.length > 0) {
      return localCategorizedIds;
    }
    return userProducts.map(up => up.productId);
  }, [userProducts, localCategorizedIds]);
  
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
    
    let filtered = allProducts
      // First filter out already categorized products
      .filter(product => !categorizedProductIds.includes(product.id));
    
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
  }, [allProducts, categorizedProductIds, selectedCategories, isAllCategoriesSelected]);

  // Reset visible products and update original total when categories change or userProducts change
  useEffect(() => {
    setVisibleProducts([]);
    setOriginalTotalProducts(totalCategoryCount);
    
    // 상품 목록 초기화 후 첫 번째 상품부터 다시 보여주기
    setCurrentProductIndex(0);
  }, [selectedCategories, isAllCategoriesSelected, totalCategoryCount, userProducts, setCurrentProductIndex]);
  
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
      
      // 모든 경로 관련 쿼리 무효화
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
          return typeof queryKey === 'string' && queryKey.includes('/api/user-products');
        }
      });
    }
  });
  
  // 필터링된 제품 목록이 변경되었거나 가시적인 제품이 없을 때 초기화
  const visibleProductsToShow = useMemo(() => {
    // 다음 조건 중 하나라도 해당되면 필터링된 상품 목록에서 새로 가져옴:
    // 1. 가시적인 제품이 없을 때
    // 2. 필터링된 상품 목록이 변경되었을 때 (새 상품 추가 또는 기존 상품이 제거된 경우)
    // 3. 로컬 스토리지 초기화 후 (categorizedProductIds 변경)
    if (filteredProducts.length > 0 && (
      visibleProducts.length === 0 || 
      filteredProducts.length !== originalTotalProducts
    )) {
      // useEffect 대신 즉시 리턴하여 사용
      setTimeout(() => {
        setCurrentProductIndex(0);
      }, 0);
      return filteredProducts.slice(0, 3);
    }
    return visibleProducts;
  }, [filteredProducts, visibleProducts, originalTotalProducts, setCurrentProductIndex]);
  
  // visibleProductsToShow가 변경되고 visibleProducts와 다를 때만 업데이트
  useEffect(() => {
    if (visibleProductsToShow !== visibleProducts && 
        (visibleProducts.length === 0 || 
         JSON.stringify(visibleProductsToShow) !== JSON.stringify(visibleProducts))) {
      setVisibleProducts(visibleProductsToShow);
    }
  }, [visibleProductsToShow, visibleProducts]);
    
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
  
  // Calculate position for progress indicator (로컬 스토리지 초기화 후에도 정확한 값 표시)
  const currentPosition = useMemo(() => {
    // 필터링된 상품이 없거나 모든 상품이 초기화된 상태면 처음부터 시작
    if (filteredProducts.length === allProducts.length && allProducts.length > 0) {
      return 1; // 모든 제품이 다시 보이는 상태 (초기화 후)
    }
    
    if (originalTotalProducts > 0) {
      return Math.max(1, originalTotalProducts - filteredProducts.length + 1);
    }
    
    return 0;
  }, [filteredProducts.length, originalTotalProducts, allProducts.length]);
  
  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    if (originalTotalProducts === 0 && allProducts.length > 0) {
      return 0; // 초기화 후에는 0%부터 다시 시작
    }
    
    return originalTotalProducts > 0 ? 
      ((currentPosition - 1) / originalTotalProducts) * 100 : 0;
  }, [currentPosition, originalTotalProducts, allProducts.length]);
  
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
            isTopCard={index === 0}
            position={index}
            onSwipe={handleSwipe}
          />
        ))}
      </div>
      
      <ActionButtons onActionClick={handleActionClick} />
      
      <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5">
        <div 
          className="bg-primary h-1.5 rounded-full" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <div className="text-xs text-neutral text-center mt-1 mb-4">
        {currentPosition}/{originalTotalProducts} • {isAllCategoriesSelected ? "전체" : `${selectedCategories.length}개 카테고리 선택됨`}
      </div>
    </div>
  );
}