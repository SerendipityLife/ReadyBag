import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Store, Package, ShoppingCart } from "lucide-react";
import { useEffect } from "react";

interface StoreType {
  id: string;
  name: string;
  nameJapanese: string;
}

interface PurposeCategory {
  id: string;
  name: string;
  nameJapanese: string;
}

interface CategoryFilterProps {
  selectedStoreTypes: string[];
  selectedPurposeCategories: string[];
  onStoreTypesChange: (storeTypes: string[]) => void;
  onPurposeCategoriesChange: (categories: string[]) => void;
  onPriceRangeUpdate?: (priceRange: { min: number; max: number }) => void;
}

export function CategoryFilter({
  selectedStoreTypes,
  selectedPurposeCategories,
  onStoreTypesChange,
  onPurposeCategoriesChange,
  onPriceRangeUpdate,
}: CategoryFilterProps) {
  // 판매처 데이터 가져오기
  const { data: storeTypes = [] } = useQuery<StoreType[]>({
    queryKey: ["/api/categories/store-types"],
  });

  // 용도 카테고리 데이터 가져오기
  const { data: purposeCategories = [] } = useQuery<PurposeCategory[]>({
    queryKey: ["/api/categories/purpose-categories"],
  });

  // 가격 범위 업데이트 함수
  const updatePriceRange = async (storeTypes: string[], purposeCategories: string[]) => {
    if (!onPriceRangeUpdate) return;

    try {
      // API 파라미터 구성
      const params = new URLSearchParams();
      params.append('countryId', 'japan');
      
      // "ALL" 또는 빈 배열이 아닌 경우에만 필터 추가
      if (storeTypes.length > 0 && !storeTypes.includes("ALL")) {
        params.append('storeTypes', storeTypes.join(','));
      }
      
      if (purposeCategories.length > 0 && !purposeCategories.includes("ALL")) {
        params.append('purposeCategories', purposeCategories.join(','));
      }

      const response = await fetch(`/api/products/price-range?${params.toString()}`);
      
      if (response.ok) {
        const priceRange = await response.json();
        onPriceRangeUpdate(priceRange);
      }
    } catch (error) {
      console.error('가격 범위 업데이트 실패:', error);
    }
  };

  const handleStoreTypeToggle = (storeTypeId: string) => {
    let newSelection: string[];
    if (storeTypeId === "ALL") {
      newSelection = selectedStoreTypes.includes("ALL") ? [] : ["ALL"];
    } else {
      newSelection = selectedStoreTypes.includes(storeTypeId)
        ? selectedStoreTypes.filter((id) => id !== storeTypeId && id !== "ALL")
        : [...selectedStoreTypes.filter((id) => id !== "ALL"), storeTypeId];
    }
    onStoreTypesChange(newSelection);
    updatePriceRange(newSelection, selectedPurposeCategories);
  };

  const handlePurposeCategoryToggle = (categoryId: string) => {
    let newSelection: string[];
    if (categoryId === "ALL") {
      newSelection = selectedPurposeCategories.includes("ALL") ? [] : ["ALL"];
    } else {
      newSelection = selectedPurposeCategories.includes(categoryId)
        ? selectedPurposeCategories.filter((id) => id !== categoryId && id !== "ALL")
        : [...selectedPurposeCategories.filter((id) => id !== "ALL"), categoryId];
    }
    onPurposeCategoriesChange(newSelection);
    updatePriceRange(selectedStoreTypes, newSelection);
  };

  const isAllStoreTypesSelected = selectedStoreTypes.includes("ALL") || selectedStoreTypes.length === 0;
  const isAllPurposeCategoriesSelected = selectedPurposeCategories.includes("ALL") || selectedPurposeCategories.length === 0;

  const getStoreIcon = (storeTypeId: string) => {
    switch (storeTypeId) {
      case 'donkihote':
        return <ShoppingCart className="w-4 h-4" />;
      case 'convenience':
        return <Store className="w-4 h-4" />;
      default:
        return <Store className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* 판매처 필터 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-lg">판매처</h3>
        </div>
        
        <ScrollArea className="w-full">
          <div className="flex flex-wrap gap-2">
            {/* 전체 선택 */}
            <Badge
              variant={isAllStoreTypesSelected ? "default" : "outline"}
              className={`cursor-pointer transition-colors ${
                isAllStoreTypesSelected
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "hover:bg-blue-50 border-blue-200"
              }`}
              onClick={() => handleStoreTypeToggle("ALL")}
            >
              전체
            </Badge>
            
            {/* 개별 판매처 */}
            {storeTypes.map((storeType) => (
              <Badge
                key={storeType.id}
                variant={selectedStoreTypes.includes(storeType.id) ? "default" : "outline"}
                className={`cursor-pointer transition-colors flex items-center gap-1 ${
                  selectedStoreTypes.includes(storeType.id)
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "hover:bg-blue-50 border-blue-200"
                }`}
                onClick={() => handleStoreTypeToggle(storeType.id)}
              >
                {getStoreIcon(storeType.id)}
                {storeType.name}
              </Badge>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* 용도 필터 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-lg">용도</h3>
        </div>
        
        <ScrollArea className="w-full">
          <div className="flex flex-wrap gap-2">
            {/* 전체 선택 */}
            <Badge
              variant={isAllPurposeCategoriesSelected ? "default" : "outline"}
              className={`cursor-pointer transition-colors ${
                isAllPurposeCategoriesSelected
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "hover:bg-blue-50 border-blue-200"
              }`}
              onClick={() => handlePurposeCategoryToggle("ALL")}
            >
              전체
            </Badge>
            
            {/* 개별 용도 */}
            {purposeCategories.map((category) => (
              <Badge
                key={category.id}
                variant={selectedPurposeCategories.includes(category.id) ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  selectedPurposeCategories.includes(category.id)
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "hover:bg-green-50 border-green-200"
                }`}
                onClick={() => handlePurposeCategoryToggle(category.id)}
              >
                {category.name}
              </Badge>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}