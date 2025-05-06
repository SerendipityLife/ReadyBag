import { useState, useRef } from "react";
import { useSpring, animated, to } from "@react-spring/web";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { useAppContext } from "@/contexts/AppContext";
import { Card } from "@/components/ui/card";
import { ProductStatus, SwipeDirection, SWIPE_TO_STATUS } from "@/lib/constants";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  isTopCard?: boolean;
  position?: number;
  onSwipe: (direction: SwipeDirection, productId: number) => void;
}

export function ProductCard({
  product,
  isTopCard = false,
  position = 0,
  onSwipe,
}: ProductCardProps) {
  const { selectedCountry } = useAppContext();
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const isDragging = useRef(false);
  const swipeThreshold = 100; // Minimum distance to trigger swipe
  
  // Calculate styles based on position in the stack
  const styles = {
    zIndex: isTopCard ? 10 : 10 - position,
    opacity: isTopCard ? 1 : 1 - position * 0.2,
  };
  
  // Animation for the card movement
  const [{ x, y, rotate }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotate: 0,
    config: { tension: 300, friction: 20 }
  }));
  
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
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
    if (!isDragging.current || !isTopCard) return;
    
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
    if (!isDragging.current || !isTopCard) return;
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
      className={`card absolute inset-0 will-change-transform`}
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
      <Card className="h-full overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-60 object-cover"
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
          
          <div className="mt-3 bg-gradient-to-r from-white to-gray-50 p-3 rounded-lg flex flex-col shadow-sm">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium text-gray-600 flex items-center">
                <span>현지 가격</span>
                <span className="inline-block w-2 h-2 rounded-full bg-gray-300 ml-1"></span>
              </div>
              <div className="font-bold text-lg">
                ¥{Math.round(product.price).toLocaleString()}
              </div>
            </div>
            <div className="border-t border-gray-100 my-2"></div>
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium text-gray-600 flex items-center">
                <span>한국 가격</span>
                <span className="inline-block w-2 h-2 rounded-full bg-green-400 ml-1"></span>
              </div>
              <CurrencyDisplay 
                amount={product.price} 
                fromCurrency={selectedCountry.currency}
                showBase={false}
                className="font-bold text-lg"
              />
            </div>
            <div className="text-xs text-gray-400 text-right mt-1 flex items-center justify-end">
              <span className="mr-1">환율</span>
              <span className="bg-green-50 px-1 rounded text-green-700">실시간 반영</span>
            </div>
          </div>
          
          <p className="mt-3 text-neutral text-sm">{product.description}</p>
          
          <div className="mt-4 text-xs text-neutral flex items-center">
            <span className="mr-1">📍</span>
            <span>{product.location}</span>
          </div>
        </div>
      </Card>
    </animated.div>
  );
}
