import { Button } from "@/components/ui/button";
import { SwipeDirection } from "@/lib/constants";
import { Heart, X, Triangle } from "lucide-react";

interface ActionButtonsProps {
  onActionClick: (direction: SwipeDirection) => void;
}

export function ActionButtons({ onActionClick }: ActionButtonsProps) {
  return (
    <div className="action-buttons flex justify-center items-center mt-6 space-x-4">
      <Button
        id="likeBtn"
        variant="outline"
        size="icon"
        className="w-16 h-16 rounded-full border-2 border-red-500 text-red-500 shadow-md hover:bg-red-50"
        onClick={() => onActionClick(SwipeDirection.RIGHT)}
      >
        <Heart className="w-6 h-6 fill-red-500" />
      </Button>
      
      <Button
        id="maybeBtn"
        variant="outline"
        size="icon"
        className="w-14 h-14 rounded-full border-2 border-orange-500 text-orange-500 shadow-md hover:bg-orange-50"
        onClick={() => onActionClick(SwipeDirection.UP)}
      >
        <Triangle className="w-5 h-5 fill-orange-500" />
      </Button>
      
      <Button
        id="dislikeBtn"
        variant="outline"
        size="icon"
        className="w-16 h-16 rounded-full border-2 border-black text-black shadow-md hover:bg-gray-50"
        onClick={() => onActionClick(SwipeDirection.LEFT)}
      >
        <X className="w-6 h-6 font-bold" strokeWidth={3} />
      </Button>
    </div>
  );
}
