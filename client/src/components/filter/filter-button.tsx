import { useState } from "react";
import { FilterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilterModal } from "@/components/filter/filter-modal";
import { useAppContext } from "@/contexts/AppContext";

export function FilterButton() {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const { selectedCategories, isAllCategoriesSelected } = useAppContext();
  
  // 필터가 적용된 상태인지 확인 (전체 카테고리가 아닌 경우)
  const isFiltered = !isAllCategoriesSelected;
  
  // 적용된 필터 수 계산
  const activeFilterCount = isAllCategoriesSelected 
    ? 0 
    : selectedCategories.length;
  
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={`flex items-center gap-2 ${isFiltered ? 'border-primary text-primary' : ''}`}
        onClick={() => setIsFilterModalOpen(true)}
      >
        <FilterIcon className="h-4 w-4" />
        <span>필터</span>
        {activeFilterCount > 0 && (
          <Badge className="bg-primary text-white h-5 w-5 flex items-center justify-center p-0 rounded-full text-xs">
            {activeFilterCount}
          </Badge>
        )}
      </Button>
      
      <FilterModal 
        isOpen={isFilterModalOpen} 
        onClose={() => setIsFilterModalOpen(false)} 
      />
    </>
  );
}