import { Button } from "@/components/ui/button";
import { SwipeDirection } from "@/lib/constants";
import { Heart, X, Bookmark } from "lucide-react";

interface ActionButtonsProps {
  onActionClick: (direction: SwipeDirection) => void;
}

export function ActionButtons({ onActionClick }: ActionButtonsProps) {
  return (
    <div className="action-buttons flex justify-center items-center mt-6 space-x-4">
      <Button
        id="dislikeBtn"
        variant="outline"
        size="icon"
        className="w-16 h-16 rounded-full border-status-notInterested text-status-notInterested shadow-md"
        onClick={() => onActionClick(SwipeDirection.LEFT)}
      >
        <X className="w-6 h-6" />
      </Button>
      
      <Button
        id="maybeBtn"
        variant="outline"
        size="icon"
        className="w-14 h-14 rounded-full border-status-maybe text-status-maybe shadow-md"
        onClick={() => onActionClick(SwipeDirection.UP)}
      >
        <Bookmark className="w-5 h-5" />
      </Button>
      
      <Button
        id="likeBtn"
        variant="outline"
        size="icon"
        className="w-16 h-16 rounded-full border-status-interested text-status-interested shadow-md"
        onClick={() => onActionClick(SwipeDirection.RIGHT)}
      >
        <Heart className="w-6 h-6" />
      </Button>
    </div>
  );
}
