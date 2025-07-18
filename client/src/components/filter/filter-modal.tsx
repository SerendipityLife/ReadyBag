import { useState, useEffect, useCallback } from "react";
import { useAppContext } from "../../contexts/AppContext";
import { ArrowLeft, X } from "lucide-react";
import { API_ROUTES, View, ProductStatus } from "../../lib/constants";
import { useQuery } from "@tanstack/react-query";
import type { Product, UserProduct } from "@shared/schema";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { CategoryFilter } from "./category-filter-new";

export interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  scope?: View; // 필터가 적용될 범위 (EXPLORE 또는 LISTS)
}

// 카테고리 타입 정의
export type ProductCategory = {
  id: string;
  name: string;
  count: number;
  icon?: string;
};

// 가격 범위 타입 정의
interface PriceRange {
  min: number;
  max: number;
}

export function FilterModal({ isOpen, onClose, scope = View.EXPLORE }: FilterModalProps) {
  const { 
    selectedCountry, 
    selectedCategories,
    setSelectedCategories,
    priceRange: contextPriceRange,
    setPriceRange: setContextPriceRange,
    tags: contextTags,
    setTags: setContextTags,
    applyFilters: applyContextFilters,
    currentView
  } = useAppContext();
  
  // 현재 필터 범위가 lists 페이지이면서 scope가 EXPLORE인 경우, 또는 그 반대인 경우 다른 필터 설정을 사용
  const isFilteringDifferentView = (currentView === View.LISTS && scope === View.EXPLORE) || 
                                 (currentView === View.EXPLORE && scope === View.LISTS);
  
  // 필터링 대상 결정 (내 목록 또는 둘러보기)
  const isFilteringLists = scope === View.LISTS;
  
  // 모든 상품 데이터 가져오기 (내 목록에서도 필요함)
  const { data: exploreProducts = [] } = useQuery<Product[]>({
    queryKey: [API_ROUTES.PRODUCTS, selectedCountry.id],
    enabled: !!selectedCountry.id && isOpen, // 항상 활성화
  });
  
  // 로컬 스토리지에서 사용자 제품 가져오기
  const [userProducts, setUserProducts] = useState<UserProduct[]>([]);
  const [myListProducts, setMyListProducts] = useState<Product[]>([]);
  
  // 로컬 스토리지 데이터를 가져오는 함수
  const getLocalStorageData = useCallback(() => {
    if (!selectedCountry?.id) return [];
    
    try {
      const storageKey = `userProducts_${selectedCountry.id}`;
      const storedData = localStorage.getItem(storageKey);
      
      if (!storedData) {
        console.log("⚠️ 로컬 스토리지에 데이터가 없습니다:", storageKey);
        return [];
      }
      
      const localData = JSON.parse(storedData);
      
      if (!Array.isArray(localData)) {
        console.log("⚠️ 로컬 스토리지 데이터가 배열이 아닙니다:", typeof localData);
        return [];
      }
      
      return localData;
    } catch (e) {
      console.error("⚠️ 로컬 스토리지 데이터 파싱 오류:", e);
      return [];
    }
  }, [selectedCountry]);
  
  // 로컬 스토리지 이벤트 리스너
  useEffect(() => {
    const handleStorageChange = () => {
      if (isOpen && scope === View.LISTS) {
        // 로컬 스토리지 변경 시 데이터 다시 로드
        const items = getLocalStorageData();
        setUserProducts(items);
        
        // 제품 목록 필터링
        if (items.length > 0 && exploreProducts.length > 0) {
          const productIds = items.map((item: UserProduct) => item.productId);
          const filteredProducts = exploreProducts.filter(p => productIds.includes(p.id));
          setMyListProducts(filteredProducts);
        } else {
          setMyListProducts([]);
        }
      }
    };
    
    // 모달이 열릴 때 초기 데이터 로드
    if (isOpen && scope === View.LISTS) {
      handleStorageChange();
    }
    
    // 이벤트 리스너 등록
    window.addEventListener('localStorageChange', handleStorageChange);
    
    return () => {
      window.removeEventListener('localStorageChange', handleStorageChange);
    };
  }, [isOpen, scope, selectedCountry, exploreProducts, getLocalStorageData]);
  
  // 모달이 열릴 때 데이터 로드
  useEffect(() => {
    if (isOpen && scope === View.LISTS) {
      // 로컬 스토리지에서 데이터 가져오기
      const items = getLocalStorageData();
      
      // 상태별 필터링 (관련 통계용)
      const interestedItems = items.filter((item: UserProduct) => item.status === ProductStatus.INTERESTED);
      const maybeItems = items.filter((item: UserProduct) => item.status === ProductStatus.MAYBE);
      
      console.log("✅ 내 목록 정보:", {
        총상품수: items.length,
        관심상품: interestedItems.length,
        고민중: maybeItems.length
      });
      
      // 사용자 상품 목록 설정
      setUserProducts(items);
      
      // 상품 필터링
      if (items.length > 0 && exploreProducts.length > 0) {
        // 사용자 상품 ID 목록 추출
        const productIds = items.map((item: UserProduct) => item.productId);
        
        // 전체 상품에서 사용자 상품만 필터링
        const filteredProducts = exploreProducts.filter(p => productIds.includes(p.id));
        
        console.log("✅ 내 목록 필터링 결과:", {
          요청ID수: productIds.length,
          찾은상품수: filteredProducts.length,
          카테고리: filteredProducts.map(p => p.category)
        });
        
        setMyListProducts(filteredProducts);
      } else {
        setMyListProducts([]);
      }
    }
  }, [isOpen, scope, exploreProducts, getLocalStorageData]);
  
  // 현재 필터링할 제품 목록 결정 - 결과 표시용
  const products = isFilteringLists ? myListProducts : exploreProducts;
  
  // 카테고리 생성에 사용할 제품 목록 - 모든 제품을 보여주되, 내 목록의 제품 카운트만 정확히 표시
  const categoriesSource = exploreProducts;

  // 로컬 상태 - 필터 변경 사항을 임시로 저장
  const [localCategories, setLocalCategories] = useState<string[]>(selectedCategories);
  const [localPriceRange, setLocalPriceRange] = useState<PriceRange>({ min: 0, max: 50000 });
  const [localTags, setLocalTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>("");
  
  // 카테고리 목록 생성
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  
  // 모달이 열릴 때 해당 탭의 필터 설정으로 초기화
  useEffect(() => {
    if (isOpen) {
      // 카테고리 초기화
      setLocalCategories(selectedCategories);
      
      // 가격 범위 초기화
      setLocalPriceRange(contextPriceRange || { min: 0, max: 50000 });
      
      // 태그 초기화
      setLocalTags(contextTags || []);
      
      // 선택된 카테고리에 맞는 가격 범위로 업데이트
      updatePriceRangeForCategories(selectedCategories);
    }
  }, [isOpen, scope, selectedCategories, contextPriceRange, contextTags]);
  
  // 상품 최대/최소 가격 계산
  const [maxPrice, setMaxPrice] = useState<number>(50000);
  const [minPrice, setMinPrice] = useState<number>(0);
  
  // 모달이 열릴 때 로컬 상태 초기화
  useEffect(() => {
    if (isOpen) {
      // 카테고리 초기화
      setLocalCategories([...selectedCategories]);
      
      // 가격 범위 초기화: 컨텍스트 값이 있으면 사용, 없으면 제품 데이터에서 계산
      if (contextPriceRange && 
          (contextPriceRange.min !== 0 || contextPriceRange.max !== 50000)) {
        setLocalPriceRange(contextPriceRange);
      } else if (products && products.length > 0) {
        const prices = products.map(p => p.price);
        const max = Math.max(...prices);
        const min = Math.min(...prices);
        setMaxPrice(max);
        setMinPrice(min);
        setLocalPriceRange({
          min: min,
          max: max
        });
      }
      
      // 태그 초기화
      if (contextTags && contextTags.length > 0) {
        setLocalTags([...contextTags]);
      }
    }
  }, [isOpen, products, selectedCategories, contextPriceRange, contextTags]);
  
  // 카테고리 목록 생성 (isOpen이 변경될 때만 실행)
  useEffect(() => {
    if (!isOpen) return; // 모달이 열려있을 때만 실행
  
    // 카테고리 정보 설정 (통합됨)
    const categoryNames: Record<string, string> = {
      "BEAUTY": "화장품/뷰티",
      "LIQUOR": "주류",
      "HEALTH": "의약품/건강",
      "FOOD": "식품/간식",
      "FASHION": "의류/잡화",
      "ELECTRONICS": "전자제품/가전", // IT 제품 포함됨
      "TOYS": "장난감", // 캐릭터 굿즈 포함됨
    };
    
    // 새로운 두단계 카테고리 시스템을 위한 설정
    const allCategoriesSet = new Set<string>();
    
    // 기본 카테고리 목록 (호환성을 위해 유지)
    const defaultCategories = ['food', 'cosmetic', 'etc', 'clothing'];
    defaultCategories.forEach(categoryId => {
      allCategoriesSet.add(categoryId);
    });
    
    // 내 목록의 상품에 해당하는 카테고리별 카운트 계산
    const myCategoryCounts: Record<string, number> = {};
    
    if (isFilteringLists) {
      // 로컬 스토리지에서 직접 데이터 가져오기
      const storageKey = `userProducts_${selectedCountry.id}`;
      const storedData = localStorage.getItem(storageKey);
      
      console.log("📊 필터 모달: 내 목록 모드, 스토리지 키:", storageKey);
      
      if (storedData) {
        try {
          // 로컬 스토리지에서 사용자 상품 정보 파싱
          const localItems: UserProduct[] = JSON.parse(storedData);
          
          // 상품 ID 목록 추출
          const productIds = localItems.map((item: UserProduct) => item.productId);
          
          if (productIds.length > 0) {
            console.log("📊 필터 모달: 내 목록 상품 ID 개수:", productIds.length);
            
            // 전체 상품 목록에서 해당 ID에 해당하는 상품 찾기
            if (exploreProducts.length > 0) {
              const userProductDetails = exploreProducts.filter(p => productIds.includes(p.id));
              
              console.log("📊 필터 모달: 찾은 상품 수:", userProductDetails.length);
              
              // 카테고리별 카운트 생성 (통합된 카테고리 적용)
              userProductDetails.forEach(product => {
                if (product.category) {
                  // 원래 카테고리를 통합된 카테고리로 변환
                  const normalizedCategory = normalizeCategory(product.category);
                  myCategoryCounts[normalizedCategory] = (myCategoryCounts[normalizedCategory] || 0) + 1;
                }
              });
            }
          }
        } catch (err) {
          console.error("📊 필터 모달: 로컬 스토리지 데이터 파싱 오류:", err);
        }
      } else {
        console.log("📊 필터 모달: 로컬 스토리지 데이터 없음");
      }
    } else {
      // 둘러보기 탭에 있는 상품들의 카테고리 카운트 (통합된 카테고리 적용)
      if (categoriesSource && categoriesSource.length > 0) {
        categoriesSource.forEach(product => {
          if (product.category) {
            // 원래 카테고리를 통합된 카테고리로 변환
            const normalizedCategory = normalizeCategory(product.category);
            myCategoryCounts[normalizedCategory] = (myCategoryCounts[normalizedCategory] || 0) + 1;
          }
        });
      }
    }
    
    // 전체 카테고리 옵션 - 선택된 필터에 맞는 상품 수
    const totalCount = isFilteringLists
      ? Object.values(myCategoryCounts).reduce((sum, count) => sum + count, 0)
      : (categoriesSource?.length || 0);
    
    const allCategory: ProductCategory = { 
      id: "ALL", 
      name: "전체", 
      count: totalCount
    };
    
    // 모든 가능한 카테고리 목록 생성 (제품 유무와 상관없이)
    const categoryList = Array.from(allCategoriesSet).map(categoryId => ({
      id: categoryId,
      name: categoryNames[categoryId] || categoryId,
      // 해당 탭에 맞는 카운트 사용
      count: myCategoryCounts[categoryId] || 0,
      icon: CATEGORIES[categoryId as keyof typeof CATEGORIES] || "🛍️"
    }));
    
    // 전체 카테고리를 맨 앞에 추가하고 나머지 카테고리는 이름 순으로 정렬
    setCategories([
      allCategory,
      ...categoryList.sort((a, b) => a.name.localeCompare(b.name))
    ]);
    
    console.log("📊 필터 모달: 카테고리 생성 완료 - 총 상품 수:", totalCount);
  }, [isOpen, selectedCountry.id, exploreProducts, isFilteringLists]);
  
  // 가격 범위 업데이트 함수
  const updatePriceRangeForCategories = async (categories: string[]) => {
    try {
      const params = new URLSearchParams();
      params.append('countryId', selectedCountry.id);
      
      // 전체가 아닌 경우에만 카테고리 필터 추가
      if (!categories.includes("ALL") && categories.length > 0) {
        params.append('purposeCategories', categories.join(','));
      }
      
      const response = await fetch(`/api/products/price-range?${params.toString()}`);
      
      if (response.ok) {
        const priceRange = await response.json();
        console.log('가격 범위 업데이트:', priceRange);
        setLocalPriceRange(priceRange);
        setMaxPrice(priceRange.max);
        setMinPrice(priceRange.min);
      }
    } catch (error) {
      console.error('가격 범위 업데이트 실패:', error);
    }
  };

  // 카테고리 변경 핸들러
  const handleCategoryChange = async (categoryId: string) => {
    let newCategories: string[];
    
    if (categoryId === "ALL") {
      newCategories = ["ALL"];
    } else {
      const withoutAll = localCategories.filter(c => c !== "ALL");
      const hasCategory = withoutAll.includes(categoryId);
      
      if (hasCategory) {
        // 이미 선택된 카테고리라면 제거
        const result = withoutAll.filter(c => c !== categoryId);
        newCategories = result.length === 0 ? ["ALL"] : result;
      } else {
        // 선택되지 않은 카테고리라면 추가
        newCategories = [...withoutAll, categoryId];
      }
    }
    
    setLocalCategories(newCategories);
    
    // 카테고리 변경 시 가격 범위 업데이트
    await updatePriceRangeForCategories(newCategories);
  };
  
  // 태그 추가 핸들러
  const handleAddTag = () => {
    if (newTag.trim() && !localTags.includes(newTag.trim())) {
      setLocalTags(prev => [...prev, newTag.trim()]);
      setNewTag("");
    }
  };
  
  // 태그 삭제 핸들러
  const handleRemoveTag = (tag: string) => {
    setLocalTags(prev => prev.filter(t => t !== tag));
  };
  
  // 필터 적용 핸들러
  const handleApplyFilters = () => {
    // 카테고리 필터 업데이트
    setSelectedCategories(localCategories);
    
    // 가격 범위 필터 업데이트
    setContextPriceRange(localPriceRange);
    
    // 태그 필터 업데이트
    setContextTags(localTags);
    
    // 필터 적용 함수 호출 (현재 스코프를 전달하여 같은 탭에 머물도록 함)
    applyContextFilters(scope);
    
    // 모달 닫기
    onClose();
  };
  
  // 상품 카테고리 정규화 함수 (통합된 카테고리로 매핑)
  const normalizeCategory = (category: string): string => {
    // 타입 안전을 위한 더 안전한 접근법
    return category in CATEGORY_MAPPING 
      ? CATEGORY_MAPPING[category as keyof typeof CATEGORY_MAPPING] 
      : category;
  };

  // 선택된 카테고리에 해당하는 제품 개수 계산
  const getFilteredProductCount = (): number => {
    // 현재 필터링 대상 제품 목록 결정 - 내 목록 또는 둘러보기
    const targetProducts = isFilteringLists ? myListProducts : products;
    
    // 1. 전체 카테고리가 선택된 경우 전체 제품 수 반환
    if (localCategories.includes("ALL")) {
      return targetProducts.length;
    }
    
    // 2. 특정 카테고리가 선택된 경우, 해당 카테고리에 속한 제품의 수 계산
    let count = 0;
    
    // 선택된 모든 카테고리에 대해 제품 수 합산
    localCategories.forEach(categoryId => {
      // 해당 카테고리에 속한 제품 필터링 (원래 카테고리와 매핑된 카테고리 모두 고려)
      const filteredProducts = targetProducts.filter(product => 
        normalizeCategory(product.category) === categoryId || product.category === categoryId
      );
      count += filteredProducts.length;
    });
    
    return count;
  };
  
  // 필터 초기화 핸들러
  const handleResetFilters = () => {
    // 로컬 상태 초기화
    setLocalCategories(["ALL"]);
    
    // 가격 범위 기본값으로 초기화 (상품의 min/max 가격 범위)
    if (products && products.length > 0) {
      const prices = products.map(p => p.price);
      const max = Math.max(...prices);
      const min = Math.min(...prices);
      setLocalPriceRange({ min, max });
    } else {
      setLocalPriceRange({ min: 0, max: 50000 });
    }
    
    // 태그 초기화
    setLocalTags([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-md max-h-[90vh] overflow-y-auto p-6 bg-white rounded-xl shadow-lg" 
        onEscapeKeyDown={onClose}
        onInteractOutside={onClose}
        onPointerDownOutside={onClose}
        forceMount={true}
        hideDefaultCloseButton={true}
      >
        <DialogHeader className="sticky top-0 z-10 bg-background pb-2 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold">
                필터 설정
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-1">
                {scope === View.EXPLORE ? '둘러보기' : '내 목록'} 탭의 상품 필터링
              </DialogDescription>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              aria-label="닫기"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          {/* 카테고리 섹션 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">카테고리</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((category) => (
                <div 
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`
                    flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer border
                    ${localCategories.includes(category.id) 
                      ? 'border-primary bg-primary/10' 
                      : 'border-gray-200 hover:border-gray-300 bg-background'}
                  `}
                >
                  <span className="text-xl mb-1">{category.icon || "🛍️"}</span>
                  <span className="text-xs font-medium text-center">{category.name}</span>
                  <span className="text-xs text-gray-500">({category.count})</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* 가격 범위 슬라이더 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">가격 범위</h3>
            <div className="px-2">
              <Slider
                value={[localPriceRange.min, localPriceRange.max]}
                min={minPrice}
                max={maxPrice}
                step={100}
                onValueChange={(values) => {
                  setLocalPriceRange({ min: values[0], max: values[1] });
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="w-[45%]">
                <label className="text-xs text-gray-500 mb-1 block">최소</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">₩</span>
                  <Input
                    type="number"
                    value={localPriceRange.min}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setLocalPriceRange({ ...localPriceRange, min: value });
                    }}
                    className="pl-7"
                  />
                </div>
              </div>
              <span className="text-gray-400">~</span>
              <div className="w-[45%]">
                <label className="text-xs text-gray-500 mb-1 block">최대</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">₩</span>
                  <Input
                    type="number"
                    value={localPriceRange.max}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setLocalPriceRange({ ...localPriceRange, max: value });
                    }}
                    className="pl-7"
                  />
                </div>
              </div>
            </div>
          </div>
          

        </div>
        
        <DialogFooter className="sticky bottom-0 z-10 bg-background pt-2 border-t">
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={handleResetFilters}>
              초기화
            </Button>
            <Button onClick={handleApplyFilters}>
              {scope === View.EXPLORE ? '둘러보기' : '내 목록'} 필터 적용 
              <span className="ml-1 text-xs opacity-80">({getFilteredProductCount()}개)</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}