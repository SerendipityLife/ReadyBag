import { Button } from "@/components/ui/button";
import { SwipeDirection } from "@/lib/constants";
import { Heart, X, Triangle } from "lucide-react";

interface ActionButtonsProps {
  onActionClick: (direction: SwipeDirection) => void;
}

export function ActionButtons({ onActionClick }: ActionButtonsProps) {
  return (
    <div className="action-buttons flex flex-col items-center mt-6">
      <div className="flex justify-center items-center space-x-4">
        <div className="flex flex-col items-center">
          <Button
            id="likeBtn"
            variant="outline"
            size="icon"
            className="w-16 h-16 rounded-full border-2 border-red-500 text-red-500 shadow-md hover:bg-red-50 mb-1"
            onClick={() => onActionClick(SwipeDirection.LEFT)}
          >
            <Heart className="w-6 h-6 fill-red-500" />
          </Button>
          <span className="text-xs font-medium text-red-500">관심</span>
        </div>
        
        <div className="flex flex-col items-center">
          <Button
            id="maybeBtn"
            variant="outline"
            size="icon"
            className="w-16 h-16 rounded-full border-2 border-gray-600 text-gray-600 shadow-md hover:bg-gray-50 mb-1"
            onClick={() => onActionClick(SwipeDirection.UP)}
          >
            <Triangle className="w-6 h-6 fill-gray-600" />
          </Button>
          <span className="text-xs font-medium text-gray-600">고민중</span>
        </div>
        
        <div className="flex flex-col items-center">
          <Button
            id="dislikeBtn"
            variant="outline"
            size="icon"
            className="w-16 h-16 rounded-full border-2 border-orange-500 text-orange-500 shadow-md hover:bg-orange-50 mb-1"
            onClick={() => onActionClick(SwipeDirection.RIGHT)}
          >
            <X className="w-6 h-6 font-bold" strokeWidth={3} />
          </Button>
          <span className="text-xs font-medium text-orange-500">관심없음</span>
        </div>
      </div>
    </div>
  );
}
