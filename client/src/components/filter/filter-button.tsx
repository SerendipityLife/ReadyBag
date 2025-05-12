import { useState } from "react";
import { FilterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilterModal } from "@/components/filter/filter-modal";
import { useAppContext } from "@/contexts/AppContext";
import { useSpring, animated } from '@react-spring/web';

import { View } from "@/lib/constants";

interface FilterButtonProps {
  compact?: boolean;
  scope?: View; // 필터가 적용될 범위 (EXPLORE 또는 LISTS)
}

export function FilterButton({ compact = false, scope = View.EXPLORE }: FilterButtonProps) {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { 
    selectedCategories, 
    isAllCategoriesSelected, 
    priceRange,
    tags 
  } = useAppContext();
  
  // 필터가 적용된 상태인지 확인
  const isFilteredByCategory = !isAllCategoriesSelected;
  const isFilteredByPrice = priceRange && (priceRange.min > 0 || priceRange.max < 50000);
  const isFilteredByTags = tags && tags.length > 0;
  
  const isFiltered = isFilteredByCategory || isFilteredByPrice || isFilteredByTags;
  
  // 적용된 필터 수 계산
  let activeFilterCount = 0;
  
  // 카테고리 필터 카운트
  if (isFilteredByCategory) {
    activeFilterCount += selectedCategories.length;
  }
  
  // 가격 필터 카운트 (적용된 경우 +1)
  if (isFilteredByPrice) {
    activeFilterCount += 1;
  }
  
  // 태그 필터 카운트 (각 태그당 +1)
  if (isFilteredByTags) {
    activeFilterCount += tags.length;
  }
  
  // 애니메이션 효과 설정
  const buttonAnimation = useSpring({
    scale: isHovered ? 1.05 : 1,
    boxShadow: isHovered 
      ? '0 4px 8px rgba(0, 0, 0, 0.1)' 
      : '0 1px 2px rgba(0, 0, 0, 0.05)',
    config: { tension: 300, friction: 20 }
  });
  
  // 배지 애니메이션 효과
  const badgeAnimation = useSpring({
    opacity: activeFilterCount > 0 ? 1 : 0,
    transform: activeFilterCount > 0 
      ? 'scale(1) translateY(0)' 
      : 'scale(0.6) translateY(-8px)',
    config: { tension: 400, friction: 22 }
  });
  
  if (compact) {
    return (
      <>
        <animated.div
          style={buttonAnimation}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Button
            variant="ghost"
            size="sm"
            className={`p-1 h-7 w-7 rounded-full ${isFiltered ? 'text-primary' : ''}`}
            onClick={() => setIsFilterModalOpen(true)}
          >
            <FilterIcon className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <animated.div style={badgeAnimation} className="absolute -top-1 -right-1">
                <Badge className="bg-primary text-white h-4 w-4 flex items-center justify-center p-0 rounded-full text-[10px]">
                  {activeFilterCount}
                </Badge>
              </animated.div>
            )}
          </Button>
        </animated.div>
        
        <FilterModal 
          isOpen={isFilterModalOpen} 
          onClose={() => setIsFilterModalOpen(false)} 
          scope={scope}
        />
      </>
    );
  }
  
  return (
    <>
      <animated.div
        style={buttonAnimation}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Button
          variant="outline"
          size="sm"
          className={`flex items-center gap-2 ${isFiltered ? 'border-primary text-primary' : ''}`}
          onClick={() => setIsFilterModalOpen(true)}
        >
          <FilterIcon className="h-4 w-4" />
          <span>필터</span>
          {activeFilterCount > 0 && (
            <animated.div style={badgeAnimation}>
              <Badge className="bg-primary text-white h-5 w-5 flex items-center justify-center p-0 rounded-full text-xs">
                {activeFilterCount}
              </Badge>
            </animated.div>
          )}
        </Button>
      </animated.div>
      
      <FilterModal 
        isOpen={isFilterModalOpen} 
        onClose={() => setIsFilterModalOpen(false)}
        scope={scope}
      />
    </>
  );
}