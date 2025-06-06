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
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b">
      {/* 판매처 태그 스타일 */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-600">🏪</span>
        <div className="flex gap-1">
          <Badge 
            variant={localStoreTypes.includes('ALL') ? "default" : "outline"}
            className={`cursor-pointer text-xs h-6 px-2 ${
              localStoreTypes.includes('ALL') 
                ? 'bg-blue-500 text-white' 
                : 'text-blue-700 border-blue-200 hover:bg-blue-50'
            }`}
            onClick={() => handleStoreTypeSelect('ALL')}
          >
            전체
          </Badge>
          {storeTypes.map((type) => (
            <Badge 
              key={type.id}
              variant={localStoreTypes.includes(type.id) ? "default" : "outline"}
              className={`cursor-pointer text-xs h-6 px-2 ${
                localStoreTypes.includes(type.id) 
                  ? 'bg-blue-500 text-white' 
                  : 'text-blue-700 border-blue-200 hover:bg-blue-50'
              }`}
              onClick={() => handleStoreTypeSelect(type.id)}
            >
              {type.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* 용도 태그 스타일 */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-600">📦</span>
        <div className="flex gap-1">
          <Badge 
            variant={localPurposeCategories.includes('ALL') ? "default" : "outline"}
            className={`cursor-pointer text-xs h-6 px-2 ${
              localPurposeCategories.includes('ALL') 
                ? 'bg-green-500 text-white' 
                : 'text-green-700 border-green-200 hover:bg-green-50'
            }`}
            onClick={() => handlePurposeCategorySelect('ALL')}
          >
            전체
          </Badge>
          {purposeCategories.map((category) => (
            <Badge 
              key={category.id}
              variant={localPurposeCategories.includes(category.id) ? "default" : "outline"}
              className={`cursor-pointer text-xs h-6 px-2 ${
                localPurposeCategories.includes(category.id) 
                  ? 'bg-green-500 text-white' 
                  : 'text-green-700 border-green-200 hover:bg-green-50'
              }`}
              onClick={() => handlePurposeCategorySelect(category.id)}
            >
              {category.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* 가격 범위 - 심플하게 */}
      <div className="flex items-center gap-1 ml-auto">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-6 text-xs">
              가격범위 ¥{localPriceRange.min === 0 && localPriceRange.max === 50000 
                ? "전체" 
                : `${(localPriceRange.min/1000)}k-${(localPriceRange.max/1000)}k`}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3">
            <div className="space-y-3">
              <Label className="text-sm font-medium">가격 범위</Label>
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
        
        <Button 
          onClick={handleApplyFilters} 
          size="sm" 
          className="h-6 px-3 text-xs bg-red-500 hover:bg-red-600"
        >
          적용
        </Button>
      </div>
    </div>
  );
}