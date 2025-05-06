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
      
      if (storedData) {
        return JSON.parse(storedData);
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
      const handleStorageChange = () => {
        // 로컬 스토리지 변경 시 쿼리 무효화
        queryClient.invalidateQueries({ 
          queryKey: [`${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}`, selectedCountry.id] 
        });
      };
      
      window.addEventListener('storage', handleStorageChange);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [user, queryClient, selectedCountry?.id]);
  
  // Get already categorized product IDs
  const categorizedProductIds = useMemo(() => {
    return userProducts.map(up => up.productId);
  }, [userProducts]);
  
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

  // Reset visible products and update original total when categories change
  useEffect(() => {
    setVisibleProducts([]);
    setOriginalTotalProducts(totalCategoryCount);
  }, [selectedCategories, isAllCategoriesSelected, totalCategoryCount]);
  
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
  
  // 필터링된 제품이 변경되었고, 가시적인 제품이 없을 때만 초기화
  const visibleProductsToShow = useMemo(() => {
    if (filteredProducts.length > 0 && visibleProducts.length === 0) {
      // useEffect 대신 즉시 리턴하여 사용
      setTimeout(() => {
        setCurrentProductIndex(0);
      }, 0);
      return filteredProducts.slice(0, 3);
    }
    return visibleProducts;
  }, [filteredProducts, visibleProducts, setCurrentProductIndex]);
  
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
      
      // storage 이벤트 발생시키기 (다른 컴포넌트에 알림용)
      window.dispatchEvent(new Event('storage'));
      
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
  const currentPosition = originalTotalProducts > 0 ? 
    Math.max(1, originalTotalProducts - filteredProducts.length + 1) : 0;
  
  // Calculate progress percentage
  const progressPercentage = originalTotalProducts > 0 ? 
    ((currentPosition - 1) / originalTotalProducts) * 100 : 0;
  
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
    if (totalCategoryCount === 0 && categorizedProductIds.length === 0) {
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