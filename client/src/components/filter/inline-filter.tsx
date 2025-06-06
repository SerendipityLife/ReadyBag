import { useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { View } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  const handleStoreTypeSelectFromDropdown = (value: string) => {
    if (value === 'ALL') {
      setLocalStoreTypes(['ALL']);
    } else {
      setLocalStoreTypes([value]);
    }
  };

  const handlePurposeCategorySelectFromDropdown = (value: string) => {
    if (value === 'ALL') {
      setLocalPurposeCategories(['ALL']);
    } else {
      setLocalPurposeCategories([value]);
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border p-2 mb-3">
      {/* 필터 헤더와 컨트롤을 한 줄로 */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* 판매처 드롭다운 */}
        <div className="flex items-center gap-1">
          <Label className="text-xs text-blue-600 font-medium">🏪</Label>
          <Select value={localStoreTypes[0] || 'ALL'} onValueChange={handleStoreTypeSelectFromDropdown}>
            <SelectTrigger className="w-20 h-7 text-xs">
              <SelectValue>{getStoreTypeDisplayValue()}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체</SelectItem>
              {storeTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 용도 드롭다운 */}
        <div className="flex items-center gap-1">
          <Label className="text-xs text-green-600 font-medium">📦</Label>
          <Select value={localPurposeCategories[0] || 'ALL'} onValueChange={handlePurposeCategorySelectFromDropdown}>
            <SelectTrigger className="w-20 h-7 text-xs">
              <SelectValue>{getPurposeCategoryDisplayValue()}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체</SelectItem>
              {purposeCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 가격 범위 - 인라인 */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <Label className="text-xs text-gray-600 font-medium">가격</Label>
          <div className="flex-1 min-w-0">
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
          </div>
          <div className="text-xs text-gray-500 whitespace-nowrap">
            ¥{localPriceRange.min === 0 && localPriceRange.max === 50000 
              ? "전체" 
              : `${localPriceRange.min.toLocaleString()}~${localPriceRange.max.toLocaleString()}`}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-1">
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