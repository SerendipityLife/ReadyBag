import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SwipeDirection } from "@/lib/constants";
import { Heart, X, HelpCircle } from "lucide-react";

interface ActionButtonsProps {
  onActionClick: (direction: SwipeDirection) => void;
}

export function ActionButtons({ onActionClick }: ActionButtonsProps) {
  const [activeButton, setActiveButton] = useState<SwipeDirection | null>(null);
  
  const handleButtonClick = (direction: SwipeDirection) => {
    // 버튼 활성화 상태 설정
    setActiveButton(direction);
    
    // 카드 액션 트리거 (전역 함수를 통해 현재 카드에 효과 적용)
    // @ts-ignore
    if (window.triggerCardAction && typeof window.triggerCardAction === 'function') {
      try {
        // @ts-ignore
        window.triggerCardAction(direction, 0); // 현재 최상단 카드에만 효과 적용
      } catch (e) {
        console.error('Card action trigger failed', e);
      }
    }
    
    // 아이콘 효과 지연 시간 (ms)
    const animationDelay = 300;
    
    // 애니메이션 후 액션 실행
    setTimeout(() => {
      onActionClick(direction);
      
      // 액션 후 버튼 상태 초기화 (조금 더 길게 보여주기 위해 딜레이 추가)
      setTimeout(() => {
        setActiveButton(null);
      }, 200);
    }, animationDelay);
  };
  
  // 버튼 애니메이션 클래스 결정
  const getButtonAnimationClass = (direction: SwipeDirection) => {
    return activeButton === direction ? "animate-wiggle" : "";
  };
  
  return (
    <div className="action-buttons flex flex-col items-center mt-6 px-2 w-full max-w-md mx-auto">
      <div className="flex justify-between items-center w-full">
        <div className="flex flex-col items-center">
          <Button
            id="skipBtn"
            variant="outline"
            size="icon"
            className={`w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-gray-400 text-gray-500 shadow-md hover:bg-gray-50 mb-1 ${getButtonAnimationClass(SwipeDirection.LEFT)}`}
            onClick={() => handleButtonClick(SwipeDirection.LEFT)}
            disabled={activeButton !== null}
            aria-label="건너뛰기"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" strokeWidth={3} />
          </Button>
          <span className="text-xs font-medium text-gray-500">건너뛰기</span>
        </div>
        
        <div className="flex flex-col items-center">
          <Button
            id="maybeBtn"
            variant="outline"
            size="icon"
            className={`w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-amber-400 text-amber-500 shadow-md hover:bg-amber-50 mb-1 ${getButtonAnimationClass(SwipeDirection.UP)}`}
            onClick={() => handleButtonClick(SwipeDirection.UP)}
            disabled={activeButton !== null}
            aria-label="고민중"
          >
            <HelpCircle className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2} />
          </Button>
          <span className="text-xs font-medium text-amber-500">고민중</span>
        </div>
        
        <div className="flex flex-col items-center">
          <Button
            id="likeBtn"
            variant="outline"
            size="icon"
            className={`w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-red-500 text-red-500 shadow-md hover:bg-red-50 mb-1 ${getButtonAnimationClass(SwipeDirection.RIGHT)}`}
            onClick={() => handleButtonClick(SwipeDirection.RIGHT)}
            disabled={activeButton !== null}
            aria-label="관심"
          >
            <Heart className="w-5 h-5 md:w-6 md:h-6 fill-red-500" strokeWidth={2} />
          </Button>
          <span className="text-xs font-medium text-red-500">관심</span>
        </div>
      </div>
    </div>
  );
}
