import { useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { View } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";

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

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border p-4 space-y-4 mb-6">
      {/* 판매처 필터 */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-blue-600 flex items-center gap-2">
          🏪 판매처
        </Label>
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant={localStoreTypes.includes('ALL') ? "default" : "outline"}
            className={`cursor-pointer transition-colors ${
              localStoreTypes.includes('ALL') 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
            }`}
            onClick={() => handleStoreTypeSelect('ALL')}
          >
            전체
          </Badge>
          {storeTypes.map((type) => (
            <Badge 
              key={type.id}
              variant={localStoreTypes.includes(type.id) ? "default" : "outline"}
              className={`cursor-pointer transition-colors ${
                localStoreTypes.includes(type.id) 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
              }`}
              onClick={() => handleStoreTypeSelect(type.id)}
            >
              {type.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* 용도 카테고리 필터 */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-green-600 flex items-center gap-2">
          📦 용도
        </Label>
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant={localPurposeCategories.includes('ALL') ? "default" : "outline"}
            className={`cursor-pointer transition-colors ${
              localPurposeCategories.includes('ALL') 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
            }`}
            onClick={() => handlePurposeCategorySelect('ALL')}
          >
            전체
          </Badge>
          {purposeCategories.map((category) => (
            <Badge 
              key={category.id}
              variant={localPurposeCategories.includes(category.id) ? "default" : "outline"}
              className={`cursor-pointer transition-colors ${
                localPurposeCategories.includes(category.id) 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
              }`}
              onClick={() => handlePurposeCategorySelect(category.id)}
            >
              {category.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* 가격 범위 필터 */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-gray-700">가격 범위</Label>
        <div className="px-2">
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
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>¥{localPriceRange.min.toLocaleString()}</span>
            <span>¥{localPriceRange.max.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={handleResetFilters} className="flex-1">
          초기화
        </Button>
        <Button onClick={handleApplyFilters} className="flex-1">
          필터 적용
        </Button>
      </div>
    </div>
  );
}