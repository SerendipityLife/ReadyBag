import { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { ArrowLeft, X } from "lucide-react";
import { API_ROUTES, CATEGORIES } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export function FilterModal({ isOpen, onClose }: FilterModalProps) {
  const { 
    selectedCountry, 
    selectedCategories,
    setSelectedCategories,
    priceRange: contextPriceRange,
    setPriceRange: setContextPriceRange,
    tags: contextTags,
    setTags: setContextTags,
    applyFilters: applyContextFilters
  } = useAppContext();
  
  // 상품 데이터 가져오기
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: [API_ROUTES.PRODUCTS, selectedCountry.id],
    enabled: !!selectedCountry.id && isOpen,
  });

  // 로컬 상태 - 필터 변경 사항을 임시로 저장
  const [localCategories, setLocalCategories] = useState<string[]>(selectedCategories);
  const [localPriceRange, setLocalPriceRange] = useState<PriceRange>({ min: 0, max: 50000 });
  const [localTags, setLocalTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>("");
  
  // 카테고리 목록 생성
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  
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
    if (products && products.length > 0) {
      // 전체 카테고리 옵션 포함
      const allCategory: ProductCategory = { 
        id: "ALL", 
        name: "전체", 
        count: products.length 
      };
      
      // 고유 카테고리 추출 및 각 카테고리별 상품 수 계산
      const categoryCounts: Record<string, number> = {};
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
      
      products.forEach(product => {
        if (product.category) {
          categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
        }
      });
      
      // 카테고리 배열 생성
      const categoryList = Object.keys(categoryCounts).map(categoryId => ({
        id: categoryId,
        name: categoryNames[categoryId] || categoryId,
        count: categoryCounts[categoryId],
        icon: CATEGORIES[categoryId as keyof typeof CATEGORIES] || "🛍️"
      }));
      
      // 전체 카테고리를 맨 앞에 추가하고 나머지 카테고리는 이름 순으로 정렬
      setCategories([
        allCategory,
        ...categoryList.sort((a, b) => a.name.localeCompare(b.name))
      ]);
    }
  }, [products]);
  
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
            <DialogTitle className="text-lg font-semibold">
              필터 설정
            </DialogTitle>
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
          
          {/* 태그/키워드 섹션 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">태그/키워드</h3>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="태그 추가..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddTag}
                disabled={!newTag.trim()}
              >
                추가
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {localTags.map(tag => (
                <Badge key={tag} variant="outline" className="flex items-center gap-1 py-1 px-2">
                  {tag}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-4 w-4 p-0 ml-1 text-gray-500 hover:text-gray-700"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    <span className="text-xs">×</span>
                  </Button>
                </Badge>
              ))}
              {localTags.length === 0 && (
                <p className="text-xs text-gray-500 italic">선택된 태그가 없습니다</p>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter className="sticky bottom-0 z-10 bg-background pt-2 border-t">
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={handleResetFilters}>
              초기화
            </Button>
            <Button onClick={handleApplyFilters}>
              필터 적용
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}