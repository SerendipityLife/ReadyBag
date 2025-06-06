import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Store, Package, ShoppingCart } from "lucide-react";

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
}

export function CategoryFilter({
  selectedStoreTypes,
  selectedPurposeCategories,
  onStoreTypesChange,
  onPurposeCategoriesChange,
}: CategoryFilterProps) {
  const [showAllStoreTypes, setShowAllStoreTypes] = useState(false);
  const [showAllPurposeCategories, setShowAllPurposeCategories] = useState(false);

  // 판매처 데이터 가져오기
  const { data: storeTypes = [] } = useQuery<StoreType[]>({
    queryKey: ["/api/categories/store-types"],
  });

  // 용도 카테고리 데이터 가져오기
  const { data: purposeCategories = [] } = useQuery<PurposeCategory[]>({
    queryKey: ["/api/categories/purpose-categories"],
  });

  const handleStoreTypeToggle = (storeTypeId: string) => {
    if (storeTypeId === "ALL") {
      onStoreTypesChange(selectedStoreTypes.includes("ALL") ? [] : ["ALL"]);
    } else {
      const newSelection = selectedStoreTypes.includes(storeTypeId)
        ? selectedStoreTypes.filter((id) => id !== storeTypeId && id !== "ALL")
        : [...selectedStoreTypes.filter((id) => id !== "ALL"), storeTypeId];
      onStoreTypesChange(newSelection);
    }
  };

  const handlePurposeCategoryToggle = (categoryId: string) => {
    if (categoryId === "ALL") {
      onPurposeCategoriesChange(selectedPurposeCategories.includes("ALL") ? [] : ["ALL"]);
    } else {
      const newSelection = selectedPurposeCategories.includes(categoryId)
        ? selectedPurposeCategories.filter((id) => id !== categoryId && id !== "ALL")
        : [...selectedPurposeCategories.filter((id) => id !== "ALL"), categoryId];
      onPurposeCategoriesChange(newSelection);
    }
  };

  const isAllStoreTypesSelected = selectedStoreTypes.includes("ALL") || selectedStoreTypes.length === 0;
  const isAllPurposeCategoriesSelected = selectedPurposeCategories.includes("ALL") || selectedPurposeCategories.length === 0;

  const displayedStoreTypes = showAllStoreTypes ? storeTypes : storeTypes.slice(0, 3);
  const displayedPurposeCategories = showAllPurposeCategories ? purposeCategories : purposeCategories.slice(0, 3);

  const getStoreIcon = (storeTypeId: string) => {
    switch (storeTypeId) {
      case 'donkihote':
        return <ShoppingCart className="w-4 h-4" />;
      case 'convenience':
        return <Store className="w-4 h-4" />;
      case 'drugstore':
        return <Package className="w-4 h-4" />;
      default:
        return <Store className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
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
            {displayedStoreTypes.map((storeType) => (
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
            
            {storeTypes.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllStoreTypes(!showAllStoreTypes)}
                className="text-blue-600 hover:text-blue-800"
              >
                {showAllStoreTypes ? "접기" : `+${storeTypes.length - 3}개 더`}
              </Button>
            )}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* 용도 필터 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-lg">용도</h3>
        </div>
        
        <ScrollArea className="w-full">
          <div className="flex flex-wrap gap-2">
            {/* 전체 선택 */}
            <Badge
              variant={isAllPurposeCategoriesSelected ? "default" : "outline"}
              className={`cursor-pointer transition-colors ${
                isAllPurposeCategoriesSelected
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "hover:bg-green-50 border-green-200"
              }`}
              onClick={() => handlePurposeCategoryToggle("ALL")}
            >
              전체
            </Badge>
            
            {/* 개별 용도 */}
            {displayedPurposeCategories.map((category) => (
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
            
            {purposeCategories.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllPurposeCategories(!showAllPurposeCategories)}
                className="text-green-600 hover:text-green-800"
              >
                {showAllPurposeCategories ? "접기" : `+${purposeCategories.length - 3}개 더`}
              </Button>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}