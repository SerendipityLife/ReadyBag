import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SwipeDirection } from "@/lib/constants";
import { Heart, X, HelpCircle } from "lucide-react";

interface ActionButtonsProps {
  onActionClick: (direction: SwipeDirection) => void;
}

export function ActionButtons({ onActionClick }: ActionButtonsProps) {
  const [activeButton, setActiveButton] = useState<SwipeDirection | null>(null);
  // 반대 방향 hover 효과용 상태
  const [hoverButton, setHoverButton] = useState<SwipeDirection | null>(null);
  // 버튼 활성화 효과 클래스
  const [showActive, setShowActive] = useState(false);
  
  // 효과 애니메이션
  useEffect(() => {
    if (activeButton) {
      // 즉시 활성화 표시
      setShowActive(true);
      
      // 애니메이션 종료 후 제거
      const timer = setTimeout(() => {
        setShowActive(false);
      }, 700);
      
      return () => clearTimeout(timer);
    }
  }, [activeButton]);
  
  const handleButtonClick = (direction: SwipeDirection) => {
    // 이미 활성화된 버튼이 있으면 무시
    if (activeButton !== null) return;
    
    // 버튼 활성화 상태 설정
    setActiveButton(direction);
    
    // 카드 액션 트리거 - 아이콘 애니메이션과 카드 효과를 동시에 적용
    // @ts-ignore
    if (window.triggerCardAction && typeof window.triggerCardAction === 'function') {
      try {
        // @ts-ignore
        window.triggerCardAction(direction, 0); // 현재 최상단 카드에만 효과 적용
      } catch (e) {
        console.error('Card action trigger failed', e);
      }
    }
    
    // 애니메이션 지연 시간 단축 - 더 빠른 반응성을 위해
    const animationDelay = 200;
    
    // 짧은 지연 후 실제 액션 실행 (스와이프 처리)
    setTimeout(() => {
      onActionClick(direction);
    }, 50); // 버튼 애니메이션과 카드 애니메이션을 거의 동시에 시작
    
    // 카드 애니메이션이 완료된 후 버튼 상태 초기화
    setTimeout(() => {
      setActiveButton(null);
    }, animationDelay + 500);
  };
  
  // 버튼 상태에 따른 스타일 클래스 결정
  const getButtonStyles = (direction: SwipeDirection) => {
    const base = "transition-all duration-200 relative";
    const size = "w-16 h-16 md:w-18 md:h-18"; // 더 큰 버튼 사이즈
    const isActive = activeButton === direction;
    
    // 각 방향별 기본 스타일
    let styles = "";
    
    switch (direction) {
      case SwipeDirection.LEFT: // 건너뛰기 (회색)
        styles = `${base} ${size} rounded-full border-3 
          ${isActive 
            ? "border-gray-500 bg-gray-500 shadow-xl scale-110 animate-pulse-strong" 
            : "border-gray-400 hover:border-gray-500 hover:bg-gray-500 hover:scale-105"}
          ${isActive ? "text-white" : "text-gray-500 hover:text-white"} shadow-lg mb-1 bg-white`;
        break;
        
      case SwipeDirection.UP: // 고민중 (블루 그레이)
        styles = `${base} ${size} rounded-full border-3 
          ${isActive 
            ? "border-blue-500 bg-blue-500 shadow-xl scale-110 animate-pulse-strong" 
            : "border-blue-400 hover:border-blue-500 hover:bg-blue-500 hover:scale-105"}
          ${isActive ? "text-white" : "text-blue-500 hover:text-white"} shadow-lg mb-1 bg-white`;
        break;
        
      case SwipeDirection.RIGHT: // 관심 (밝은 블루)
        styles = `${base} ${size} rounded-full border-3 
          ${isActive 
            ? "border-blue-600 bg-blue-600 shadow-xl scale-110 animate-pulse-strong" 
            : "border-blue-500 hover:border-blue-600 hover:bg-blue-600 hover:scale-105"}
          ${isActive ? "text-white" : "text-blue-600 hover:text-white"} shadow-lg mb-1 bg-white`;
        break;
    }
    
    // hover 상태 추가
    if (hoverButton === direction) {
      styles += " scale-105 shadow-lg";
    }
    
    // 진동 애니메이션 추가
    if (isActive && showActive) {
      styles += " animate-wiggle";
    }
    
    return styles;
  };
  
  // 아이콘 크기 결정
  const getIconStyles = (direction: SwipeDirection) => {
    const isActive = activeButton === direction;
    return isActive 
      ? "w-7 h-7 md:w-8 md:h-8 transition-all duration-200 scale-110" 
      : "w-6 h-6 md:w-7 md:h-7 transition-all duration-200";
  };
  
  return (
    <div className="action-buttons flex flex-col items-center mt-8 px-4 py-4 w-full max-w-sm mx-auto bg-white backdrop-blur-sm rounded-2xl border-2 border-blue-200 shadow-lg">
      <div className="flex justify-between items-center w-full">
        {/* 건너뛰기 버튼 */}
        <div className="flex flex-col items-center">
          <Button
            id="skipBtn"
            variant="outline"
            size="icon"
            className={getButtonStyles(SwipeDirection.LEFT)}
            onClick={() => handleButtonClick(SwipeDirection.LEFT)}
            disabled={activeButton !== null}
            aria-label="건너뛰기"
            onMouseEnter={() => setHoverButton(SwipeDirection.LEFT)}
            onMouseLeave={() => setHoverButton(null)}
          >
            <X 
              className={getIconStyles(SwipeDirection.LEFT)} 
              strokeWidth={3} 
            />
          </Button>
          <span className="text-sm font-medium text-gray-600 mt-1">건너뛰기</span>
        </div>
        
        {/* 고민중 버튼 */}
        <div className="flex flex-col items-center">
          <Button
            id="maybeBtn"
            variant="outline"
            size="icon"
            className={getButtonStyles(SwipeDirection.UP)}
            onClick={() => handleButtonClick(SwipeDirection.UP)}
            disabled={activeButton !== null}
            aria-label="고민중"
            onMouseEnter={() => setHoverButton(SwipeDirection.UP)}
            onMouseLeave={() => setHoverButton(null)}
          >
            <HelpCircle 
              className={getIconStyles(SwipeDirection.UP)} 
              strokeWidth={2.5} 
            />
          </Button>
          <span className="text-sm font-medium text-[#7B5E57] mt-1">고민중</span>
        </div>
        
        {/* 관심 버튼 */}
        <div className="flex flex-col items-center">
          <Button
            id="likeBtn"
            variant="outline"
            size="icon"
            className={getButtonStyles(SwipeDirection.RIGHT)}
            onClick={() => handleButtonClick(SwipeDirection.RIGHT)}
            disabled={activeButton !== null}
            aria-label="관심"
            onMouseEnter={() => setHoverButton(SwipeDirection.RIGHT)}
            onMouseLeave={() => setHoverButton(null)}
          >
            <Heart 
              className={getIconStyles(SwipeDirection.RIGHT)} 
              fill={activeButton === SwipeDirection.RIGHT ? "currentColor" : "#f87171"}
              strokeWidth={2} 
            />
          </Button>
          <span className="text-sm font-medium text-red-600 mt-1">관심</span>
        </div>
      </div>
    </div>
  );
}
