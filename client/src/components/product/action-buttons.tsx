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
    
    // 부드러운 아이콘 애니메이션 및 카드 효과 적용
    
    // 1. 먼저 작은 아이콘으로 시작하여 점점 커지는 아이콘 애니메이션 시작
    // @ts-ignore
    if (window.startIconAnimation && typeof window.startIconAnimation === 'function') {
      try {
        // @ts-ignore
        window.startIconAnimation(direction);
      } catch (e) {
        console.error('Icon animation failed', e);
      }
    }
    
    // 2. 카드 액션 트리거 (전역 함수를 통해 현재 카드에 효과 적용)
    // @ts-ignore
    if (window.triggerCardAction && typeof window.triggerCardAction === 'function') {
      try {
        // @ts-ignore
        window.triggerCardAction(direction, 0); // 현재 최상단 카드에만 효과 적용
      } catch (e) {
        console.error('Card action trigger failed', e);
      }
    }
    
    // 애니메이션 지연 시간 (ms)
    const animationDelay = 500;
    
    // 애니메이션 후 액션 실행
    setTimeout(() => {
      onActionClick(direction);
      
      // 액션 후 버튼 상태 초기화 (조금 더 길게 보여주기 위해 딜레이 추가)
      setTimeout(() => {
        setActiveButton(null);
      }, 200);
    }, animationDelay);
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
            ? "border-gray-500 bg-gray-100 shadow-lg scale-110 animate-pulse-strong" 
            : "border-gray-400 hover:border-gray-500 hover:bg-gray-50 hover:scale-105"}
          text-gray-500 shadow-md mb-1`;
        break;
        
      case SwipeDirection.UP: // 고민중 (노란색)
        styles = `${base} ${size} rounded-full border-3 
          ${isActive 
            ? "border-amber-500 bg-amber-100 shadow-lg scale-110 animate-pulse-strong" 
            : "border-amber-400 hover:border-amber-500 hover:bg-amber-50 hover:scale-105"}
          text-amber-500 shadow-md mb-1`;
        break;
        
      case SwipeDirection.RIGHT: // 관심 (빨간색)
        styles = `${base} ${size} rounded-full border-3 
          ${isActive 
            ? "border-red-500 bg-red-100 shadow-lg scale-110 animate-pulse-strong" 
            : "border-red-500 hover:border-red-600 hover:bg-red-50 hover:scale-105"}
          text-red-500 shadow-md mb-1`;
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
    <div className="action-buttons flex flex-col items-center mt-8 px-2 w-full max-w-md mx-auto">
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
          <span className="text-sm font-medium text-amber-600 mt-1">고민중</span>
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
