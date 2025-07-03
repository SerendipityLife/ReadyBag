import { useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { X } from "lucide-react";
import { View } from "@/lib/constants";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { CategoryFilter } from "./category-filter-new";

export interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  scope?: View;
}

interface PriceRange {
  min: number;
  max: number;
}

export function FilterModal({ isOpen, onClose, scope = View.EXPLORE }: FilterModalProps) {
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

  const handleApplyFilters = () => {
    // 컨텍스트 상태 업데이트
    setSelectedStoreTypes(localStoreTypes);
    setSelectedPurposeCategories(localPurposeCategories);
    setContextPriceRange(localPriceRange);
    
    // 필터 적용
    applyFilters(scope);
    
    // 모달 닫기
    onClose();
  };

  const handleResetFilters = () => {
    const resetStoreTypes = ["ALL"];
    const resetPurposeCategories = ["ALL"];
    const resetPriceRange = { min: 100, max: 3000 };
    
    setLocalStoreTypes(resetStoreTypes);
    setLocalPurposeCategories(resetPurposeCategories);
    setLocalPriceRange(resetPriceRange);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">상품 필터</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 새로운 두단계 카테고리 필터 */}
          <CategoryFilter
            selectedStoreTypes={localStoreTypes}
            selectedPurposeCategories={localPurposeCategories}
            onStoreTypesChange={setLocalStoreTypes}
            onPurposeCategoriesChange={setLocalPurposeCategories}
            onPriceRangeUpdate={setLocalPriceRange}
          />

          {/* 가격 범위 필터 */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">가격 범위</Label>
            <div className="px-2">
              <Slider
                min={100}
                max={3000}
                step={100}
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
        </div>

        <DialogFooter className="flex flex-row gap-2 justify-end">
          <Button variant="outline" onClick={handleResetFilters}>
            초기화
          </Button>
          <Button onClick={handleApplyFilters}>
            필터 적용
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}