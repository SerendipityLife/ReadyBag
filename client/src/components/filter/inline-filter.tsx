import { useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { View } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Filter } from "lucide-react";

interface PriceRange {
  min: number;
  max: number;
}

export function InlineFilter() {
  const { 
    selectedStoreTypes,
    setSelectedStoreTypes,
    selectedPurposeCategories,
    setSelectedPurposeCategories,
    priceRange: contextPriceRange,
    setPriceRange: setContextPriceRange,
    applyFilters
  } = useAppContext();
  
  // 로컬 상태
  const [localStoreTypes, setLocalStoreTypes] = useState<string[]>(selectedStoreTypes);
  const [localPurposeCategories, setLocalPurposeCategories] = useState<string[]>(selectedPurposeCategories);
  const [localPriceRange, setLocalPriceRange] = useState<PriceRange>(contextPriceRange);

  // 판매처 데이터 로드
  const { data: storeTypes = [] } = useQuery<Array<{id: string, name: string}>>({
    queryKey: ['/api/categories/store-types']
  });

  // 용도 카테고리 데이터 로드
  const { data: purposeCategories = [] } = useQuery<Array<{id: string, name: string}>>({
    queryKey: ['/api/categories/purpose-categories']
  });

  const handleApplyFilters = () => {
    // 컨텍스트 상태 업데이트
    setSelectedStoreTypes(localStoreTypes);
    setSelectedPurposeCategories(localPurposeCategories);
    setContextPriceRange(localPriceRange);
    
    // 필터 적용
    applyFilters(View.EXPLORE);
  };

  const handleResetFilters = () => {
    setLocalStoreTypes(['ALL']);
    setLocalPurposeCategories(['ALL']);
    setLocalPriceRange({ min: 0, max: 50000 });
    
    // 즉시 적용
    setSelectedStoreTypes(['ALL']);
    setSelectedPurposeCategories(['ALL']);
    setContextPriceRange({ min: 0, max: 50000 });
    
    applyFilters(View.EXPLORE);
  };

  // 판매처 선택 처리
  const handleStoreTypeSelect = (typeId: string) => {
    if (typeId === 'ALL') {
      setLocalStoreTypes(['ALL']);
    } else {
      setLocalStoreTypes(prev => {
        const newTypes = prev.filter(t => t !== 'ALL');
        if (newTypes.includes(typeId)) {
          const filtered = newTypes.filter(t => t !== typeId);
          return filtered.length === 0 ? ['ALL'] : filtered;
        } else {
          return [...newTypes, typeId];
        }
      });
    }
  };

  // 용도 카테고리 선택 처리
  const handlePurposeCategorySelect = (categoryId: string) => {
    if (categoryId === 'ALL') {
      setLocalPurposeCategories(['ALL']);
    } else {
      setLocalPurposeCategories(prev => {
        const newCategories = prev.filter(c => c !== 'ALL');
        if (newCategories.includes(categoryId)) {
          const filtered = newCategories.filter(c => c !== categoryId);
          return filtered.length === 0 ? ['ALL'] : filtered;
        } else {
          return [...newCategories, categoryId];
        }
      });
    }
  };

  // Helper functions for display values
  const getStoreTypeDisplayValue = () => {
    if (localStoreTypes.includes('ALL') || localStoreTypes.length === 0) return "전체";
    if (localStoreTypes.length === 1) {
      const store = storeTypes.find(s => s.id === localStoreTypes[0]);
      return store?.name || "전체";
    }
    return `${localStoreTypes.length}개 선택`;
  };

  const getPurposeCategoryDisplayValue = () => {
    if (localPurposeCategories.includes('ALL') || localPurposeCategories.length === 0) return "전체";
    if (localPurposeCategories.length === 1) {
      const category = purposeCategories.find(c => c.id === localPurposeCategories[0]);
      return category?.name || "전체";
    }
    return `${localPurposeCategories.length}개 선택`;
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border p-2 mb-3">
      {/* 필터 헤더와 컨트롤을 한 줄로 */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* 판매처 다중 선택 */}
        <div className="flex items-center gap-1">
          <Label className="text-xs text-blue-600 font-medium">🏪</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-20 h-7 text-xs justify-between">
                {getStoreTypeDisplayValue()}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-2">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="store-all"
                    checked={localStoreTypes.includes('ALL')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setLocalStoreTypes(['ALL']);
                      } else {
                        setLocalStoreTypes([]);
                      }
                    }}
                  />
                  <Label htmlFor="store-all" className="text-xs">전체</Label>
                </div>
                {storeTypes.map((type) => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`store-${type.id}`}
                      checked={localStoreTypes.includes(type.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          const newTypes = localStoreTypes.filter(t => t !== 'ALL');
                          setLocalStoreTypes([...newTypes, type.id]);
                        } else {
                          setLocalStoreTypes(localStoreTypes.filter(t => t !== type.id));
                        }
                      }}
                    />
                    <Label htmlFor={`store-${type.id}`} className="text-xs">{type.name}</Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* 용도 다중 선택 */}
        <div className="flex items-center gap-1">
          <Label className="text-xs text-green-600 font-medium">📦</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-20 h-7 text-xs justify-between">
                {getPurposeCategoryDisplayValue()}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-2">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="purpose-all"
                    checked={localPurposeCategories.includes('ALL')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setLocalPurposeCategories(['ALL']);
                      } else {
                        setLocalPurposeCategories([]);
                      }
                    }}
                  />
                  <Label htmlFor="purpose-all" className="text-xs">전체</Label>
                </div>
                {purposeCategories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`purpose-${category.id}`}
                      checked={localPurposeCategories.includes(category.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          const newCategories = localPurposeCategories.filter(c => c !== 'ALL');
                          setLocalPurposeCategories([...newCategories, category.id]);
                        } else {
                          setLocalPurposeCategories(localPurposeCategories.filter(c => c !== category.id));
                        }
                      }}
                    />
                    <Label htmlFor={`purpose-${category.id}`} className="text-xs">{category.name}</Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* 가격 범위 - 더 사용하기 쉽게 */}
        <div className="flex items-center gap-2">
          <Label className="text-xs text-gray-600 font-medium">가격범위</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-7 px-2 text-xs">
                ¥{localPriceRange.min === 0 && localPriceRange.max === 50000 
                  ? "전체" 
                  : `${localPriceRange.min.toLocaleString()}~${localPriceRange.max.toLocaleString()}`}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="space-y-3">
                <Label className="text-sm font-medium">가격 범위 설정</Label>
                <Slider
                  min={0}
                  max={50000}
                  step={1000}
                  value={[localPriceRange.min, localPriceRange.max]}
                  onValueChange={([min, max]) => 
                    setLocalPriceRange({ min, max })
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>¥{localPriceRange.min.toLocaleString()}</span>
                  <span>¥{localPriceRange.max.toLocaleString()}</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-1 ml-auto">
          <Button variant="outline" onClick={handleResetFilters} className="h-7 px-2 text-xs">
            초기화
          </Button>
          <Button onClick={handleApplyFilters} className="h-7 px-3 text-xs">
            적용
          </Button>
        </div>
      </div>
    </div>
  );
}