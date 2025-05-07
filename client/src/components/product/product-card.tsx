import { useState, useRef } from "react";
import { useSpring, animated } from "@react-spring/web";
import { useAppContext } from "@/contexts/AppContext";
import { Card } from "@/components/ui/card";
import { SwipeDirection } from "@/lib/constants";
import { Loader2 } from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  index: number;
  total: number;
  isProcessing?: boolean;
  onSwipe: (direction: SwipeDirection, productId: number) => void;
}

export function ProductCard({
  product,
  index,
  total,
  isProcessing = false,
  onSwipe,
}: ProductCardProps) {
  const { exchangeRate } = useAppContext();
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const isDragging = useRef(false);
  const swipeThreshold = 100; // Minimum distance to trigger swipe
  
  // Calculate styles based on position in the stack
  const styles = {
    zIndex: index === 0 ? 10 : 10 - index,
    opacity: index === 0 ? 1 : 1 - index * 0.2,
  };
  
  const isTopCard = index === 0;
  
  // Animation for the card movement
  const [{ x, y, rotate }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotate: 0,
    config: { tension: 300, friction: 20 }
  }));
  
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (isProcessing) return;
    
    if ("touches" in e) {
      setStartX(e.touches[0].clientX);
      setStartY(e.touches[0].clientY);
    } else {
      setStartX(e.clientX);
      setStartY(e.clientY);
    }
    setCurrentX(0);
    setCurrentY(0);
    isDragging.current = true;
    setSwiping(true);
  };
  
  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging.current || !isTopCard || isProcessing) return;
    
    let posX, posY;
    if ("touches" in e) {
      posX = e.touches[0].clientX;
      posY = e.touches[0].clientY;
    } else {
      posX = e.clientX;
      posY = e.clientY;
    }
    
    const deltaX = posX - startX;
    const deltaY = posY - startY;
    
    setCurrentX(deltaX);
    setCurrentY(deltaY);
    
    // Update the animation
    api.start({
      x: deltaX,
      y: deltaY,
      rotate: deltaX * 0.1, // Slight rotation based on drag distance
    });
    
    // Prevent scrolling when swiping cards
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      e.preventDefault?.();
    }
  };
  
  const handleTouchEnd = () => {
    if (!isDragging.current || !isTopCard || isProcessing) return;
    isDragging.current = false;
    setSwiping(false);
    
    // Determine swipe direction based on stored state values
    if (currentX > swipeThreshold) {
      // 요청대로 바꿈: 오른쪽 스와이프 -> 관심 없음
      api.start({
        x: window.innerWidth + 200,
        rotate: 30,
        onRest: () => onSwipe(SwipeDirection.RIGHT, product.id),
      });
    } else if (currentX < -swipeThreshold) {
      // 요청대로 바꿈: 왼쪽 스와이프 -> 관심 상품
      api.start({
        x: -window.innerWidth - 200,
        rotate: -30,
        onRest: () => onSwipe(SwipeDirection.LEFT, product.id),
      });
    } else if (currentY < -swipeThreshold) {
      // 위로 스와이프 -> 나중에 (변경 없음)
      api.start({
        y: -window.innerHeight - 200,
        onRest: () => onSwipe(SwipeDirection.UP, product.id),
      });
    } else {
      // Reset position if not swiped far enough
      api.start({ x: 0, y: 0, rotate: 0 });
    }
  };
  
  return (
    <animated.div
      className={`card absolute inset-0 will-change-transform ${isProcessing ? 'pointer-events-none' : ''}`}
      style={{
        ...styles,
        x,
        y,
        rotate,
        touchAction: "none"
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      <Card className="h-full overflow-hidden max-h-[650px] relative">
        {/* 내비게이션 표시: 현재 위치 / 전체 */}
        <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs font-medium px-2 py-1 rounded-full z-10">
          {index + 1} / {total}
        </div>
        
        {/* 로딩 표시 */}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-20">
            <Loader2 className="h-10 w-10 text-white animate-spin" />
          </div>
        )}
        
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-52 object-cover"
        />
        
        <div className="p-5">
          <div className="flex flex-col">
            <h3 className="text-xl font-heading font-bold">{product.name}</h3>
            {product.nameJapanese && (
              <p className="text-sm text-gray-600 mt-1 font-medium">
                {product.nameJapanese}
              </p>
            )}
          </div>
          
          <div className="mt-3 bg-gradient-to-r from-white to-gray-50 p-3 rounded-lg shadow-sm">
            <div className="grid grid-cols-2 gap-x-4">
              <div className="text-sm font-medium text-gray-600">
                <div className="flex items-center mb-1">
                  <span>현지 가격</span>
                </div>
                <div className="font-bold text-lg">
                  ¥{Math.round(product.price).toLocaleString()}
                </div>
              </div>
              
              <div className="text-sm font-medium text-gray-600">
                <div className="flex items-center mb-1">
                  <span>원화 환산</span>
                </div>
                <div className="font-bold text-lg text-primary">
                  {Math.round(product.price * (exchangeRate || 9.57)).toLocaleString()}원
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-3 border-t border-gray-100 pt-3">
            <p className="text-neutral text-sm line-clamp-5">{product.description}</p>
          </div>
          
          <div className="mt-4 text-xs text-neutral flex items-center">
            <span className="mr-1">📍</span>
            <span>{product.location}</span>
          </div>
        </div>
      </Card>
    </animated.div>
  );
}
