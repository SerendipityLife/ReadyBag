import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProductCard } from "@/components/product/product-card";
import { ActionButtons } from "@/components/product/action-buttons";
import { useAppContext } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { API_ROUTES, ProductStatus, SwipeDirection, SWIPE_TO_STATUS } from "@/lib/constants";
import { X } from "lucide-react";
import type { Product, UserProduct } from "@shared/schema";

export function ProductCardStack() {
  const queryClient = useQueryClient();
  const { 
    selectedCountry, 
    selectedStoreTypes,
    selectedPurposeCategories,
    isAllStoreTypesSelected,
    isAllPurposeCategoriesSelected,
    setCurrentProductIndex,
    priceRange,
    tags,
    selectedTravelDateId,
    travelStartDate,
    travelEndDate,
    setShowTravelDateSelector
  } = useAppContext();
  const { user } = useAuth();
  const { toast } = useToast();

  // 상태들 선언
  const [visibleProducts, setVisibleProducts] = useState<Product[]>([]);
  const [originalTotalProducts, setOriginalTotalProducts] = useState(0);
  const [processingProductIds, setProcessingProductIds] = useState<Set<number>>(new Set());
  const [forceReset, setForceReset] = useState(false);
  const [pendingReset, setPendingReset] = useState(false);
  const [currentProductPosition, setCurrentProductPosition] = useState(1);



  // API 요청을 위한 필터 파라미터 구성 (새로운 두단계 시스템)
  const filterParams = useMemo(() => {
    const params: Record<string, string> = { countryId: selectedCountry.id };

    // 판매처 필터링 (상위 카테고리)
    if (!isAllStoreTypesSelected && selectedStoreTypes.length > 0) {
      params.storeTypes = selectedStoreTypes.join(',');
    }

    // 용도 카테고리 필터링 (하위 카테고리)
    if (!isAllPurposeCategoriesSelected && selectedPurposeCategories.length > 0) {
      params.purposeCategories = selectedPurposeCategories.join(',');
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
  }, [selectedCountry.id, selectedStoreTypes, selectedPurposeCategories, isAllStoreTypesSelected, isAllPurposeCategoriesSelected, priceRange, tags]);

  // Fetch products for the selected country with filters
  const { data: allProducts = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: [API_ROUTES.PRODUCTS, filterParams],
    queryFn: async () => {
      // URL 파라미터 구성
      const queryParams = new URLSearchParams();
      Object.entries(filterParams).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });

      const url = `${API_ROUTES.PRODUCTS}?${queryParams.toString()}`;
      console.log('[ProductCardStack] API 요청 URL:', url);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const products = await response.json();
      console.log('[ProductCardStack] 받은 상품 개수:', products.length);
      return products;
    },
    enabled: !!selectedCountry && !!selectedCountry.id,
  });

  // 로컬 스토리지에서 사용자 상품 데이터 가져오기 (여행 날짜로 필터링)
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

        // 선택된 여행 날짜 ID로 필터링
        const filteredData = selectedTravelDateId 
          ? parsedData.filter((item: any) => item.travelDateId === selectedTravelDateId)
          : parsedData.filter((item: any) => !item.travelDateId); // 날짜 ID가 없는 기존 데이터

        console.log(`[ProductCardStack] 여행 날짜 ${selectedTravelDateId}로 필터링: ${parsedData.length} → ${filteredData.length}`);

        return filteredData;
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
  const { data: userProducts = [], isLoading: userProductsLoading, refetch: refetchUserProducts } = useQuery<UserProduct[]>({
    queryKey: ['user-products', selectedCountry.id, selectedTravelDateId || 'no-date'],
    queryFn: async () => {
      // 비회원일 경우 로컬 스토리지에서 가져옴
      if (!user) {
        return getLocalUserProducts();
      }

      // 로그인한 사용자는 API 호출
      if (!selectedCountry?.id) return [];

      const url = `${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}${selectedTravelDateId ? `&travelDateId=${selectedTravelDateId}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) return [];
      return await response.json();
    },
    enabled: !!selectedCountry && !!selectedCountry.id,
    staleTime: 0, // Always get fresh data
    gcTime: 0, // Don't cache
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
        setPendingReset(true);
      } else {
        // 일반 변경일 경우 단순 쿼리 무효화 (여행 날짜 포함)
        queryClient.invalidateQueries({ 
          queryKey: ['user-products', selectedCountry.id, selectedTravelDateId || 'no-date'] 
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
      setCurrentProductPosition(1);

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

  // 펜딩 리셋 처리
  useEffect(() => {
    if (pendingReset) {
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

      // 사용자 상품 데이터 강제 리페치
      refetchUserProducts();

      setPendingReset(false);
    }
  }, [pendingReset, selectedCountry.id, queryClient, setCurrentProductIndex]);

  // Get product IDs that should be excluded from exploration (only interested/maybe for current travel date)
  const excludedProductIds = useMemo(() => {
    if (forceReset) return []; // 강제 리셋 모드면 빈 배열 반환

    console.log(`[ProductCardStack] 제외 상품 계산 - 선택된 날짜: ${selectedTravelDateId}`);
    console.log(`[ProductCardStack] 전체 사용자 상품 수: ${userProducts.length}`);

    // Only exclude products that are saved for the CURRENT selected travel date
    const excluded = userProducts
      .filter(up => {
        const isInterestedOrMaybe = up.status === ProductStatus.INTERESTED || up.status === ProductStatus.MAYBE;

        // If no travel date is selected, exclude products without travel date
        if (!selectedTravelDateId) {
          const shouldExclude = isInterestedOrMaybe && !up.travelDateId;
          if (shouldExclude) {
            console.log(`[ProductCardStack] 날짜 없음 - 제외: 상품 ${up.productId}`);
          }
          return shouldExclude;
        }

        // If travel date is selected, only exclude products for this specific travel date
        const shouldExclude = isInterestedOrMaybe && up.travelDateId === selectedTravelDateId;
        if (shouldExclude) {
          console.log(`[ProductCardStack] 현재 날짜 일치 - 제외: 상품 ${up.productId} (날짜: ${up.travelDateId})`);
        }
        return shouldExclude;
      })
      .map(up => up.productId);

    console.log(`[ProductCardStack] 최종 제외 상품 ID들:`, excluded);
    return excluded;
  }, [userProducts, forceReset, selectedTravelDateId]);

  // Calculate total number of products in the selected filters
  const totalCategoryCount = useMemo(() => {
    if (isAllStoreTypesSelected && isAllPurposeCategoriesSelected) {
      return allProducts.filter(p => !excludedProductIds.includes(p.id)).length;
    } else {
      return allProducts.filter(p => {
        if (excludedProductIds.includes(p.id)) return false;

        // 판매처 필터 확인
        const storeTypeMatch = isAllStoreTypesSelected || selectedStoreTypes.includes(p.storeType);
        // 용도 카테고리 필터 확인
        const purposeCategoryMatch = isAllPurposeCategoriesSelected || selectedPurposeCategories.includes(p.purposeCategory);

        return storeTypeMatch && purposeCategoryMatch;
      }).length;
    }
  }, [allProducts, excludedProductIds, selectedStoreTypes, selectedPurposeCategories, isAllStoreTypesSelected, isAllPurposeCategoriesSelected]);

  // Filter products by selected filters AND exclude already categorized products
  const filteredProducts = useMemo(() => {
    let filtered = allProducts;

    // 강제 리셋 상태가 아닐 때만 관심상품/고민중 상품 제외 (구매완료는 다시 노출)
    if (!forceReset) {
      filtered = filtered.filter(product => !excludedProductIds.includes(product.id));
    }

    // 필터가 전체 선택이 아닌 경우에만 필터링 적용
    if (!isAllStoreTypesSelected || !isAllPurposeCategoriesSelected) {
      filtered = filtered.filter(product => {
        // 판매처 필터 확인
        const storeTypeMatch = isAllStoreTypesSelected || selectedStoreTypes.includes(product.storeType);
        // 용도 카테고리 필터 확인  
        const purposeCategoryMatch = isAllPurposeCategoriesSelected || selectedPurposeCategories.includes(product.purposeCategory);

        return storeTypeMatch && purposeCategoryMatch;
      });
    }

    return filtered;
  }, [allProducts, excludedProductIds, selectedStoreTypes, selectedPurposeCategories, isAllStoreTypesSelected, isAllPurposeCategoriesSelected, forceReset, userProducts]);

  // totalCategoryCount 변경 처리 - 필터 변경 시에만 위치 리셋
  useEffect(() => {
    if (totalCategoryCount !== originalTotalProducts) {
      // 현재 상품이 제외된 경우인지 확인 (excludedProductIds 변경으로 인한 것)
      const currentProduct = visibleProducts[0];
      const isCurrentProductExcluded = currentProduct && excludedProductIds.includes(currentProduct.id);

      setOriginalTotalProducts(totalCategoryCount);

      // 현재 상품이 제외되지 않았다면 위치 유지, 제외되었다면 다음 상품으로 이동
      if (!isCurrentProductExcluded) {
        // 위치 유지 - 총 개수만 업데이트
        const currentPosition = Math.min(currentProductPosition, totalCategoryCount);
        setCurrentProductPosition(currentPosition);
      } else {
        // 현재 상품이 제외된 경우, 다음 상품으로 자연스럽게 이동
        // 위치는 그대로 유지하되 총 개수만 줄어듦
      }
    }
  }, [totalCategoryCount, originalTotalProducts, excludedProductIds, visibleProducts, currentProductPosition]);

  // 강제 리셋 모드 관리
  useEffect(() => {
    if (filteredProducts.length > 0 && forceReset) {
      const timer = setTimeout(() => {
        setForceReset(false);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [filteredProducts.length, forceReset]);

  const isLoading = productsLoading || userProductsLoading;

  // Update user product status mutation with optimistic updates
  const updateProductStatus = useMutation({
    mutationFn: async ({ productId, status }: { productId: number, status: ProductStatus }) => {
      // 상품 저장 시점에서 localStorage에서 직접 최신 여행 날짜 정보 가져오기
      let finalTravelDateId = null;
      let finalStartDate = null;
      let finalEndDate = null;

      if (typeof window !== 'undefined') {
        // localStorage에서 현재 선택된 여행 날짜 ID 가져오기
        const currentTravelDateId = localStorage.getItem('selectedTravelDateId');

        if (currentTravelDateId) {
          finalTravelDateId = currentTravelDateId;

          // 저장된 여행 날짜 목록에서 해당 날짜 정보 찾기
          const savedDatesStr = localStorage.getItem('savedTravelDates');
          if (savedDatesStr) {
            try {
              const savedDates = JSON.parse(savedDatesStr);
              const matchingDate = savedDates.find((date: any) => date.id === currentTravelDateId);

              if (matchingDate) {
                finalStartDate = new Date(matchingDate.startDate);
                finalEndDate = new Date(matchingDate.endDate);
                console.log(`[ProductSave] localStorage 여행 날짜 정보 찾음: ${matchingDate.label}`);
              }
            } catch (error) {
              console.error('[ProductSave] 저장된 날짜 파싱 오류:', error);
            }
          }
        }
      }

      console.log(`[ProductSave] 최종 저장 여행 날짜 ID: ${finalTravelDateId}`);
      console.log(`[ProductSave] 최종 저장 날짜 범위: ${finalStartDate} ~ ${finalEndDate}`);

      const requestBody: any = { 
        productId, 
        status,
        travelDateId: finalTravelDateId,
        travelStartDate: finalStartDate,
        travelEndDate: finalEndDate
      };

      const response = await apiRequest(
        "POST",
        `${API_ROUTES.USER_PRODUCTS}`,
        requestBody
      );
      return response.json();
    },
    onMutate: async ({ productId, status }) => {
      // localStorage에서 현재 여행 날짜 ID 가져오기
      const currentTravelDateId = typeof window !== 'undefined' 
        ? localStorage.getItem('selectedTravelDateId') 
        : null;

      console.log(`[ProductSave] 캐시 무효화 대상 여행 날짜: ${currentTravelDateId}`);

      // 즉시 UI 반영을 위한 캐시 무효화
      queryClient.invalidateQueries({ 
        queryKey: ['user-products', selectedCountry.id, currentTravelDateId || 'no-date'] 
      });

      return { currentTravelDateId };
    },
    onError: (error, variables, context) => {
      // 에러 시 컨텍스트에서 여행 날짜 ID 가져오기
      const travelDateId = context?.currentTravelDateId || selectedTravelDateId;

      // 에러 시 다시 캐시 무효화
      queryClient.invalidateQueries({ 
        queryKey: ['user-products', selectedCountry.id, travelDateId || 'no-date'] 
      });
    },
    onSettled: (data, error, variables, context) => {
      // 최종 동기화 시 올바른 여행 날짜 ID 사용
      const travelDateId = context?.currentTravelDateId || selectedTravelDateId;

      // 성공/실패와 관계없이 최종적으로 서버 데이터와 동기화
      queryClient.invalidateQueries({ 
        queryKey: ['user-products', selectedCountry.id, travelDateId || 'no-date'] 
      });

      // 모든 user products 관련 쿼리 무효화 (bottom navigation 업데이트용)
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === API_ROUTES.USER_PRODUCTS || 
                             (Array.isArray(query.queryKey[0]) && query.queryKey[0].includes('user-products'))
      });
    }
  });

  // 필터링된 제품 목록이 변경되었거나 가시적인 제품이 없을 때 초기화
  const visibleProductsToShow = useMemo(() => {
    console.log('[ProductCardStack] visibleProductsToShow 계산:');
    console.log('- filteredProducts.length:', filteredProducts.length);
    console.log('- visibleProducts.length:', visibleProducts.length);
    console.log('- forceReset:', forceReset);

    // 필터링된 상품이 있으면 항상 표시
    if (filteredProducts.length > 0) {
      const productsToShow = filteredProducts.slice(0, 3);
      console.log('- 표시할 상품들:', productsToShow.map(p => `${p.id}: ${p.name}`));
      return productsToShow;
    }

    console.log('- 표시할 상품 없음');
    return [];
  }, [filteredProducts, forceReset]);

  // visibleProductsToShow가 변경될 때만 업데이트
  useEffect(() => {
    // 깊은 비교를 통해 실제 내용이 다를 때만 업데이트
    const currentIds = visibleProducts.map(p => p.id).sort().join(',');
    const newIds = visibleProductsToShow.map(p => p.id).sort().join(',');

    console.log('[ProductCardStack] 상품 목록 업데이트 체크:');
    console.log('- currentIds:', currentIds);
    console.log('- newIds:', newIds);

    if (currentIds !== newIds) {
      console.log('[ProductCardStack] 상품 목록 업데이트 실행');
      setVisibleProducts(visibleProductsToShow);
    }
  }, [visibleProductsToShow]);

  // 비회원일 경우 로컬 스토리지에 상품 상태 저장
  const saveToLocalStorage = (productId: number, status: ProductStatus) => {
    try {
      // localStorage에서 현재 여행 날짜 정보 직접 가져오기
      let finalTravelDateId = null;
      let finalStartDate = null;
      let finalEndDate = null;

      const currentTravelDateId = localStorage.getItem('selectedTravelDateId');
      if (currentTravelDateId) {
        finalTravelDateId = currentTravelDateId;

        // 저장된 여행 날짜 목록에서 해당 날짜 정보 찾기
        const savedDatesStr = localStorage.getItem('savedTravelDates');
        if (savedDatesStr) {
          try {
            const savedDates = JSON.parse(savedDatesStr);
            const matchingDate = savedDates.find((date: any) => date.id === currentTravelDateId);

            if (matchingDate) {
              finalStartDate = new Date(matchingDate.startDate);
              finalEndDate = new Date(matchingDate.endDate);
              console.log(`[SaveToLocalStorage] 여행 날짜 정보 찾음: ${matchingDate.label}`);
            }
          } catch (error) {
            console.error('[SaveToLocalStorage] 저장된 날짜 파싱 오류:', error);
          }
        }
      }

      console.log(`[SaveToLocalStorage] 최종 저장 여행 날짜 ID: ${finalTravelDateId}`);

      const storageKey = `userProducts_${selectedCountry.id}`;
      let localProducts = [];

      // 기존 데이터 가져오기
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        localProducts = JSON.parse(storedData);
      }

      // 동일한 상품이 같은 여행 날짜에 이미 있는지 확인 (중복 방지)
      const existingIndex = localProducts.findIndex((item: any) => 
        item.productId === productId && item.travelDateId === finalTravelDateId
      );

      if (existingIndex >= 0) {
        // 같은 상품이 같은 여행 날짜에 이미 있으면 상태만 업데이트
        localProducts[existingIndex].status = status;
        localProducts[existingIndex].updatedAt = new Date().toISOString();
        console.log(`[SaveToLocalStorage] 기존 상품 상태 업데이트: ${productId} (${finalTravelDateId})`);
      } else {
        // 같은 상품이라도 다른 여행 날짜면 새로 추가 (중복 허용)
        localProducts.push({
          id: Date.now() + Math.random(), // 고유 id 생성
          productId,
          status,
          travelDateId: finalTravelDateId,
          travelStartDate: finalStartDate?.toISOString(),
          travelEndDate: finalEndDate?.toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        console.log(`[SaveToLocalStorage] 새 상품 추가: ${productId} (${finalTravelDateId})`);
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

    const status = SWIPE_TO_STATUS[direction];

    // 관심/나중에 액션일 때 여행 날짜 확인
    if ((status === ProductStatus.INTERESTED || status === ProductStatus.MAYBE) && !selectedTravelDateId) {
      console.log("여행 날짜가 선택되지 않음, 여행 날짜 선택기 표시");
      setShowTravelDateSelector(true);
      return;
    }

    // 모든 액션을 바로 처리
    executeProductAction(productId, status);
  };

  // 실제 상품 액션 실행 함수
  const executeProductAction = (productId: number, status: ProductStatus) => {
    // 처리 중인 제품으로 표시
    setProcessingProductIds(prev => {
      const newSet = new Set(prev);
      newSet.add(productId);
      return newSet;
    });

    // 즉시 카드 제거 및 다음 카드 표시 (UI 반응성 향상)
    setVisibleProducts(prev => {
      const remaining = prev.filter(p => p.id !== productId);
      const currentIndex = filteredProducts.findIndex(p => p.id === productId);
      const nextIndex = currentIndex + 3;

      // Update the current product index
      setCurrentProductIndex(currentIndex + 1);

      // Update progress position
      setCurrentProductPosition(prev => prev + 1);

      if (nextIndex < filteredProducts.length) {
        return [...remaining, filteredProducts[nextIndex]];
      }

      return remaining;
    });

    // 왼쪽 스와이프 (건너뛰기)는 DB에 저장하지 않고 스킵처리
    if (status === ProductStatus.SKIP) {
      console.log(`[Swipe] 건너뛰기 처리: 제품 ID ${productId}`);

      // 처리 완료 후 처리 중인 제품 목록에서 제거
      setTimeout(() => {
        setProcessingProductIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
      }, 300);
    }
    // 관심 또는 고민중은 저장
    else {
      // 여행 날짜가 선택되지 않은 경우에도 일단 저장하고 날짜 선택 UI 표시
      if (!selectedTravelDateId) {
        setShowTravelDateSelector(true);
      }

      // 로그인 상태에 따라 저장 방식 결정
      if (user) {
        // 로그인한 사용자는 서버 API 호출
        updateProductStatus.mutate({ productId, status }, {
          onError: () => {
            // 에러 시에도 처리 중인 제품 목록에서 제거
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
        setTimeout(() => {
          setProcessingProductIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(productId);
            return newSet;
          });
        }, 100);
      }
    }
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

    // 현재 보이는 상품이 있다면 전체 상품 목록에서의 실제 위치 계산
    if (visibleProducts.length > 0 && allProducts.length > 0) {
      const currentProduct = visibleProducts[0];
      const actualIndex = allProducts.findIndex(p => p.id === currentProduct.id);

      if (actualIndex >= 0) {
        // 실제 인덱스를 기반으로 제외된 상품들을 고려한 위치 계산
        let adjustedPosition = actualIndex + 1;

        // 현재 상품 이전에 있는 제외된 상품들의 개수만큼 빼기
        const excludedBeforeCurrent = excludedProductIds.filter(excludedId => {
          const excludedIndex = allProducts.findIndex(p => p.id === excludedId);
          return excludedIndex >= 0 && excludedIndex < actualIndex;
        }).length;

        adjustedPosition -= excludedBeforeCurrent;

        return Math.max(1, adjustedPosition);
      }
    }

    // 기본값으로 현재 위치 사용
    return currentProductPosition;
  }, [currentProductPosition, forceReset, visibleProducts, allProducts, excludedProductIds]);

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
        if (excludedProductIds.includes(p.id)) return false;

        // 판매처 필터 확인
        const storeTypeMatch = isAllStoreTypesSelected || selectedStoreTypes.includes(p.storeType);
        // 용도 카테고리 필터 확인
        const purposeCategoryMatch = isAllPurposeCategoriesSelected || selectedPurposeCategories.includes(p.purposeCategory);

        return storeTypeMatch && purposeCategoryMatch;
      }).length === 0;

    if (noProductsInCategory && excludedProductIds.length === 0) {
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
    <div className="w-full max-w-md mx-auto flex flex-col min-h-0 lg:max-w-[420px] md:max-w-[400px]">
      <div className="card-stack relative h-[460px] w-full mb-1 lg:h-[520px] md:h-[500px]">
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
      </div>

      {/* 진행상황 표시 - 카드와 버튼 사이에 배치 */}
      {filteredProducts.length > 0 && (
        <div className="flex justify-center mb-1">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-md border border-blue-200/50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-700 tabular-nums">
                {currentPosition}
              </span>
              <span className="text-sm text-blue-400">/</span>
              <span className="text-sm font-medium text-blue-600 tabular-nums">
                {Math.max(originalTotalProducts, filteredProducts.length)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 액션 버튼 - 항상 표시 */}
      <div className="w-full relative z-50">
        <ActionButtons onActionClick={handleActionClick} />
      </div>

      {/* 비회원 사용자일 경우 안내 메시지 */}
      {!user && (
        <div className="w-full max-w-md mx-auto text-center text-gray-500 text-xs leading-tight px-4 mt-2">
          <p>비회원으로 이용 중입니다. 목록이 브라우저에 임시 저장됩니다.</p>
          <p>로그인 후 이용하시면 데이터가 안전하게 보관됩니다.</p>
        </div>
      )}

    </div>
  );
}