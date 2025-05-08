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
  const swipeThreshold = 120; // 의도적 스와이프를 위해 임계값 증가 (100 -> 120)
  
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
    
    // 제스처 의도 분석: 수직 스크롤 vs 수평 스와이프
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    // 명확한 수직 스크롤 의도가 있으면 카드 이동을 중단 (수직 이동이 수평보다 1.5배 이상 큰 경우)
    if (absY > absX * 1.5 && absY < 40) {
      // 일반 스크롤 의도로 간주, 카드 이동 차단
      return;
    }
    
    setCurrentX(deltaX);
    setCurrentY(deltaY);
    
    // 수평 스와이프가 우선시되는 경우에만 애니메이션 적용
    if (absX > 10) {
      // Update the animation
      api.start({
        x: deltaX,
        y: 0, // 수평 스와이프 시 수직 이동 제한
        rotate: deltaX * 0.1, // Slight rotation based on drag distance
      });
      
      // 수평 스와이프 시에만 스크롤 방지
      if (absX > 30) {
        e.preventDefault?.();
      }
    } else if (absY > 50 && absY > absX * 2) {
      // 명확한 상하 스와이프 의도가 있을 때만 수직 이동 허용 (위로 향하는 경우만)
      if (deltaY < 0) {
        api.start({
          x: 0,
          y: deltaY,
          rotate: 0
        });
        
        // 확실한 위쪽 스와이프인 경우만 스크롤 방지
        if (absY > 70) {
          e.preventDefault?.();
        }
      }
    }
  };
  
  const handleTouchEnd = () => {
    if (!isDragging.current || !isTopCard || isProcessing) return;
    isDragging.current = false;
    setSwiping(false);
    
    const absX = Math.abs(currentX);
    const absY = Math.abs(currentY);
    
    // 스와이프 제스처의 방향 의도를 분석
    const isHorizontalSwipe = absX > absY && absX > 30;
    const isVerticalSwipe = absY > absX * 1.5 && currentY < 0 && absY > 50;
    
    // 작은 움직임은 스와이프로 간주하지 않음 (일반 터치/클릭)
    const isMinorMovement = absX < 20 && absY < 20;
    
    // 일정 거리 이상의 명확한 수평 스와이프만 처리
    if (isHorizontalSwipe) {
      if (currentX > swipeThreshold) {
        // 오른쪽 스와이프 -> 관심 없음
        api.start({
          x: window.innerWidth + 200,
          rotate: 30,
          onRest: () => onSwipe(SwipeDirection.RIGHT, product.id),
        });
      } else if (currentX < -swipeThreshold) {
        // 왼쪽 스와이프 -> 관심 상품
        api.start({
          x: -window.innerWidth - 200,
          rotate: -30,
          onRest: () => onSwipe(SwipeDirection.LEFT, product.id),
        });
      } else {
        // 스와이프 거리가 충분하지 않음
        api.start({ x: 0, y: 0, rotate: 0 });
      }
    } 
    // 명확한 위쪽 방향 스와이프만 처리 (위로 향하는 제스처와 충분한 거리)
    else if (isVerticalSwipe && currentY < -swipeThreshold) {
      // 위로 스와이프 -> 나중에 (변경 없음)
      api.start({
        y: -window.innerHeight - 200,
        onRest: () => onSwipe(SwipeDirection.UP, product.id),
      });
    } 
    // 기타 모든 제스처는 리셋
    else {
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
        touchAction: "pan-y" // 수직 스크롤은 허용
      }}
      onTouchStart={(e) => {
        // 터치 타겟이 이미지나 정보 영역인 경우만 스와이프 허용
        const target = e.target as HTMLElement;
        if (target.tagName === 'IMG' || 
            target.closest('.card-content') || 
            target.closest('.product-info')) {
          handleTouchStart(e);
        }
      }}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      <Card className="h-full overflow-hidden max-h-[650px] relative card-content">
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
        
        <div className="p-5 product-info">
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
