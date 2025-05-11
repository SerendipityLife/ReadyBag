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
    
    // 애니메이션 후 액션 실행 (300ms 후)
    setTimeout(() => {
      onActionClick(direction);
      // 액션 후 버튼 상태 초기화
      setActiveButton(null);
    }, 300);
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
            className={`w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-gray-400 text-gray-500 shadow-md hover:bg-gray-50 mb-1 ${getButtonAnimationClass(SwipeDirection.RIGHT)}`}
            onClick={() => handleButtonClick(SwipeDirection.RIGHT)}
            disabled={activeButton !== null}
          >
            <X className="w-5 h-5 md:w-6 md:h-6 font-bold" strokeWidth={3} />
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
          >
            <HelpCircle className="w-5 h-5 md:w-6 md:h-6" />
          </Button>
          <span className="text-xs font-medium text-amber-500">고민중</span>
        </div>
        
        <div className="flex flex-col items-center">
          <Button
            id="likeBtn"
            variant="outline"
            size="icon"
            className={`w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-red-500 text-red-500 shadow-md hover:bg-red-50 mb-1 ${getButtonAnimationClass(SwipeDirection.LEFT)}`}
            onClick={() => handleButtonClick(SwipeDirection.LEFT)}
            disabled={activeButton !== null}
          >
            <Heart className="w-5 h-5 md:w-6 md:h-6 fill-red-500" />
          </Button>
          <span className="text-xs font-medium text-red-500">관심</span>
        </div>
      </div>
    </div>
  );
}
