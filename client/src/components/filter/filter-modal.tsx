import { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { ArrowLeft, X } from "lucide-react";
import { API_ROUTES, CATEGORIES, View } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import type { Product, UserProduct } from "@shared/schema";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
  
  // 내 목록에 있는 상품들 (로컬 스토리지에서 불러오기)
  const { data: userProducts = [] } = useQuery<UserProduct[]>({
    queryKey: [API_ROUTES.USER_PRODUCTS, selectedCountry.id],
    enabled: isOpen && scope === View.LISTS,
  });
  
  // 사용자 제품 정보 가져오기 (내 목록에서 필터링할 때 사용)
  const { data: listProducts = [] } = useQuery<Product[]>({
    queryKey: ['listProducts', userProducts],
    enabled: isOpen && scope === View.LISTS, // userProducts.length > 0 조건 제거 (비어있는 경우도 처리)
    queryFn: async () => {
      // userProducts에서 productId 추출하여 관련 상품 정보 가져오기
      if (userProducts.length === 0) {
        return []; // 내 목록이 비어있으면 빈 배열 반환
      }
      const productIds = userProducts.map(up => up.productId);
      return exploreProducts.filter(p => productIds.includes(p.id));
    }
  });
  
  // 내 목록 필터링 시 사용할 제품 목록
  const myListProducts = listProducts;
  
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
      
      // 카테고리 목록은 이미 별도의 useEffect에서 생성됨 (147-189라인)
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
  
  // 카테고리 목록 생성
  useEffect(() => {
    if (categoriesSource && categoriesSource.length > 0) {
      // 카테고리 정보 설정
      const categoryNames: Record<string, string> = {
        "IT": "IT 제품",
        "BEAUTY": "화장품/뷰티",
        "LIQUOR": "주류",
        "HEALTH": "의약품/건강",
        "FOOD": "식품/간식",
        "CHARACTER": "캐릭터 굿즈",
        "FASHION": "의류/잡화",
        "ELECTRONICS": "전자제품/가전",
      };
      
      // 모든 가능한 카테고리 추출 (전체 상품 기준)
      const allCategoriesSet = new Set<string>();
      categoriesSource.forEach(product => {
        if (product.category) {
          allCategoriesSet.add(product.category);
        }
      });
      
      // 내 목록의 상품에 해당하는 카테고리별 카운트 계산
      const myCategoryCounts: Record<string, number> = {};
      
      if (isFilteringLists) {
        // 내 목록에 있는 상품들의 카테고리 카운트
        myListProducts.forEach(product => {
          if (product.category) {
            myCategoryCounts[product.category] = (myCategoryCounts[product.category] || 0) + 1;
          }
        });
      } else {
        // 둘러보기 탭에 있는 상품들의 카테고리 카운트
        categoriesSource.forEach(product => {
          if (product.category) {
            myCategoryCounts[product.category] = (myCategoryCounts[product.category] || 0) + 1;
          }
        });
      }
      
      // 전체 카테고리 옵션 - 선택된 필터에 맞는 상품 수
      const allCategory: ProductCategory = { 
        id: "ALL", 
        name: "전체", 
        count: isFilteringLists ? myListProducts.length : categoriesSource.length
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
    } else {
      // 상품 정보가 아직 로드되지 않은 경우 기본값 설정
      setCategories([
        { id: "ALL", name: "전체", count: 0 }
      ]);
    }
  }, [categoriesSource, myListProducts, isFilteringLists]);
  
  // 카테고리 변경 핸들러
  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === "ALL") {
      setLocalCategories(["ALL"]);
    } else {
      setLocalCategories(prev => {
        const withoutAll = prev.filter(c => c !== "ALL");
        const hasCategory = withoutAll.includes(categoryId);
        
        if (hasCategory) {
          // 이미 선택된 카테고리라면 제거
          const result = withoutAll.filter(c => c !== categoryId);
          return result.length === 0 ? ["ALL"] : result;
        } else {
          // 선택되지 않은 카테고리라면 추가
          return [...withoutAll, categoryId];
        }
      });
    }
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
    
    // 필터 적용 함수 호출
    applyContextFilters();
    
    // 모달 닫기
    onClose();
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
      // 해당 카테고리에 속한 제품 필터링
      const filteredProducts = targetProducts.filter(product => product.category === categoryId);
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
        className="max-w-md max-h-[90vh] overflow-y-auto p-6" 
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