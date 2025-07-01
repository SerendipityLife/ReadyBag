
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { SwipeDirection } from "../../lib/constants";
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
    const base = "transition-all duration-200 relative flex items-center justify-center";
    const size = "w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18"; // 버튼 크기 증가
    const isActive = activeButton === direction;

    // 각 방향별 기본 스타일
    let styles = "";

    switch (direction) {
      case SwipeDirection.LEFT: // 건너뛰기 (회색)
        styles = `${base} ${size} rounded-full border-2 
          ${isActive 
            ? "border-gray-600 bg-gray-600 shadow-2xl scale-110" 
            : "border-gray-400 bg-white hover:border-gray-500 hover:bg-gray-500 hover:scale-105"}
          ${isActive ? "text-white" : "text-gray-600 hover:text-white"} shadow-lg`;
        break;

      case SwipeDirection.UP: // 고민중 (블루 그레이)
        styles = `${base} ${size} rounded-full border-2 
          ${isActive 
            ? "border-amber-500 bg-amber-500 shadow-2xl scale-110" 
            : "border-amber-400 bg-white hover:border-amber-500 hover:bg-amber-500 hover:scale-105"}
          ${isActive ? "text-white" : "text-amber-600 hover:text-white"} shadow-lg`;
        break;

      case SwipeDirection.RIGHT: // 관심 (빨간색)
        styles = `${base} ${size} rounded-full border-2 
          ${isActive 
            ? "border-red-500 bg-red-500 shadow-2xl scale-110" 
            : "border-red-400 bg-white hover:border-red-500 hover:bg-red-500 hover:scale-105"}
          ${isActive ? "text-white" : "text-red-500 hover:text-white"} shadow-lg`;
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
      ? "w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 transition-all duration-200 scale-110" 
      : "w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 transition-all duration-200";
  };

  console.log('[ActionButtons] 렌더링됨 - activeButton:', activeButton, 'showActive:', showActive);
  
  return (
    <div className="w-full">
      <div className="action-buttons flex flex-col items-center w-full max-w-sm mx-auto">
        <div className="flex justify-center items-center w-full gap-4 md:gap-6 lg:gap-8">
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
              style={{
                backgroundColor: activeButton === SwipeDirection.LEFT ? 'rgb(75, 85, 99)' : 'white',
                borderColor: activeButton === SwipeDirection.LEFT ? 'rgb(75, 85, 99)' : 'rgb(156, 163, 175)',
                color: activeButton === SwipeDirection.LEFT ? 'white' : 'rgb(75, 85, 99)',
                borderWidth: '2px',
                borderRadius: '50%',
                width: '56px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
            >
              <X 
                className={getIconStyles(SwipeDirection.LEFT)} 
                strokeWidth={3} 
              />
            </Button>
            <span className="text-xs sm:text-sm font-semibold text-gray-700 mt-1">건너뛰기</span>
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
              style={{
                backgroundColor: activeButton === SwipeDirection.UP ? 'rgb(245, 158, 11)' : 'white',
                borderColor: activeButton === SwipeDirection.UP ? 'rgb(245, 158, 11)' : 'rgb(251, 191, 36)',
                color: activeButton === SwipeDirection.UP ? 'white' : 'rgb(217, 119, 6)',
                borderWidth: '2px',
                borderRadius: '50%',
                width: '56px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
            >
              <HelpCircle 
                className={getIconStyles(SwipeDirection.UP)} 
                strokeWidth={2.5} 
              />
            </Button>
            <span className="text-xs sm:text-sm font-semibold text-amber-700 mt-1">고민중</span>
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
              style={{
                backgroundColor: activeButton === SwipeDirection.RIGHT ? 'rgb(239, 68, 68)' : 'white',
                borderColor: activeButton === SwipeDirection.RIGHT ? 'rgb(239, 68, 68)' : 'rgb(248, 113, 113)',
                color: activeButton === SwipeDirection.RIGHT ? 'white' : 'rgb(239, 68, 68)',
                borderWidth: '2px',
                borderRadius: '50%',
                width: '56px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Heart 
                className={getIconStyles(SwipeDirection.RIGHT)} 
                fill={activeButton === SwipeDirection.RIGHT ? "currentColor" : "#f87171"}
                strokeWidth={2} 
              />
            </Button>
            <span className="text-xs sm:text-sm font-semibold text-red-600 mt-1">관심</span>
          </div>
        </div>
      </div>
    </div>
  );
}
