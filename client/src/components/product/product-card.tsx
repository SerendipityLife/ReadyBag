import { useState, useRef, useEffect } from "react";
import { useSpring, animated } from "@react-spring/web";
import { useAppContext } from "@/contexts/AppContext";
import { Card } from "@/components/ui/card";
import { SwipeDirection } from "@/lib/constants";
import { Loader2, Heart, X, HelpCircle } from "lucide-react";
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
  // 액션 트리거 함수를 외부에서 사용할 수 있도록 설정
  // @ts-ignore
  window.triggerCardAction = (direction: SwipeDirection, productId: number) => {
    if (productId === product.id && index === 0) {
      triggerAction(direction);
    }
  };
  const { exchangeRate } = useAppContext();
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [activeDirection, setActiveDirection] = useState<SwipeDirection | null>(null);
  const [showFeedbackIcon, setShowFeedbackIcon] = useState(false);
  const [buttonShake, setButtonShake] = useState(false);
  const isDragging = useRef(false);
  const swipeThreshold = 120; // 의도적 스와이프를 위해 임계값 증가 (100 -> 120)
  
  // Calculate styles based on position in the stack
  const styles = {
    zIndex: index === 0 ? 10 : 10 - index,
    opacity: index === 0 ? 1 : 1 - index * 0.2,
  };
  
  const isTopCard = index === 0;
  
  // Animation for the card movement including border and background color
  const [{ x, y, rotate, filter, borderColor, borderWidth, boxShadow }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotate: 0,
    filter: 'blur(0px)',
    borderColor: 'rgba(255,255,255,0)',
    borderWidth: '0px',
    boxShadow: '0 0 0 0 rgba(0,0,0,0)',
    config: { tension: 300, friction: 20 }
  }));
  
  // 피드백 아이콘 표시 로직
  useEffect(() => {
    if (showFeedbackIcon) {
      const timer = setTimeout(() => {
        setShowFeedbackIcon(false);
      }, 800); // 0.8초 후 아이콘 숨김
      
      return () => clearTimeout(timer);
    }
  }, [showFeedbackIcon]);
  
  // 버튼 진동 효과 로직
  useEffect(() => {
    if (buttonShake) {
      const timer = setTimeout(() => {
        setButtonShake(false);
      }, 300); // 0.3초 후 진동 효과 중단
      
      return () => clearTimeout(timer);
    }
  }, [buttonShake]);
  
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
    
    // 활성화된 방향 결정
    let newActiveDirection = null;
    
    // 수평 스와이프 분석
    if (absX > 50) {
      if (deltaX > 0) {
        // 오른쪽 방향 (건너뛰기)
        newActiveDirection = SwipeDirection.RIGHT;
      } else {
        // 왼쪽 방향 (관심)
        newActiveDirection = SwipeDirection.LEFT;
      }
    } 
    // 위로 스와이프 분석
    else if (absY > 50 && deltaY < 0) {
      newActiveDirection = SwipeDirection.UP;
    }
    
    // 액션 방향이 변경된 경우
    if (newActiveDirection !== activeDirection) {
      setActiveDirection(newActiveDirection);
      
      // 방향에 따른 버튼 진동 효과
      if (newActiveDirection) {
        setButtonShake(true);
      }
    }
    
    // 블러 효과 계산 (스와이프 거리에 따라 증가)
    const maxDistance = Math.max(swipeThreshold, 50);
    const maxBlur = 3; // 최대 블러 수준 (px)
    const blurAmount = Math.min(Math.max(absX, absY) / maxDistance * maxBlur, maxBlur);
    
    // 수평 스와이프가 우선시되는 경우에만 애니메이션 적용
    if (absX > 10) {
      // 테두리 색상 결정 - 방향에 따라 다른 색상 적용
      let borderColorValue = 'rgba(255,255,255,0)';
      let shadowColor = 'rgba(0,0,0,0)';
      
      // 오른쪽 스와이프 (관심)
      if (deltaX > swipeThreshold / 2) {
        // 빨간색 테두리 (관심)
        borderColorValue = 'rgba(239, 68, 68, 0.8)'; // 빨간색
        shadowColor = 'rgba(239, 68, 68, 0.4)';
      } 
      // 왼쪽 스와이프 (건너뛰기)
      else if (deltaX < -swipeThreshold / 2) {
        // 회색 테두리 (건너뛰기)
        borderColorValue = 'rgba(156, 163, 175, 0.8)'; // 회색
        shadowColor = 'rgba(156, 163, 175, 0.4)';
      }
      
      // 테두리 두께 계산 (스와이프 거리에 비례) - 더 두껍게 조정
      const maxBorderWidth = 12; // 최대 테두리 두께 (px) - 더 강조
      
      // 최소 테두리 두께를 보장하여 더 빨리 표시되도록 함
      let borderWidthValue = 0;
      if (absX > swipeThreshold * 0.2) {
        // 최소 4px부터 시작하여 최대 12px까지
        const ratio = Math.min((absX - (swipeThreshold * 0.2)) / (swipeThreshold * 0.8), 1);
        borderWidthValue = 4 + (ratio * 8);
      }
      
      // 테두리 투명도 조정 (더 선명하게)
      borderColorValue = borderColorValue.replace(/[^,]+(?=\))/, '0.95');
      shadowColor = shadowColor.replace(/[^,]+(?=\))/, '0.7');
      
      // Update the animation - 블러 효과 제거
      api.start({
        x: deltaX,
        y: 0, // 수평 스와이프 시 수직 이동 제한
        rotate: deltaX * 0.1, // Slight rotation based on drag distance
        filter: 'blur(0px)', // 블러 효과 제거
        borderColor: borderColorValue,
        borderWidth: `${borderWidthValue}px`,
        boxShadow: `0 0 25px 10px ${shadowColor}`,
      });
      
      // 수평 스와이프 시에만 스크롤 방지
      if (absX > 30) {
        e.preventDefault?.();
      }
    } else if (absY > 50 && absY > absX * 2) {
      // 명확한 상하 스와이프 의도가 있을 때만 수직 이동 허용 (위로 향하는 경우만)
      if (deltaY < 0) {
        // 위로 스와이프 (고민중) - 노란색 테두리 (강화)
        // 최대 테두리 두께 (px) - 더 강조
        const maxBorderWidth = 12;
        
        // 최소 테두리 두께를 보장하여 더 빨리 표시되도록 함
        let borderWidthValue = 0;
        if (absY > swipeThreshold * 0.2) {
          // 최소 4px부터 시작하여 최대 12px까지
          const ratio = Math.min((absY - (swipeThreshold * 0.2)) / (swipeThreshold * 0.8), 1);
          borderWidthValue = 4 + (ratio * 8);
        }
        
        // 테두리 색상 및 그림자 (더 선명하게)
        const borderColor = 'rgba(245, 158, 11, 0.95)'; // 노란색 (고민중) - 더 불투명하게
        const shadowColor = 'rgba(245, 158, 11, 0.7)'; // 그림자도 더 강하게
        
        api.start({
          x: 0,
          y: deltaY,
          rotate: 0,
          filter: 'blur(0px)', // 블러 효과 제거
          borderColor: borderColor,
          borderWidth: `${borderWidthValue}px`,
          boxShadow: `0 0 25px 10px ${shadowColor}`,
        });
        
        // 확실한 위쪽 스와이프인 경우만 스크롤 방지
        if (absY > 70) {
          e.preventDefault?.();
        }
      }
    }
  };
  
  // 외부에서 액션 트리거 함수 (버튼 클릭에 사용)
  const triggerAction = (direction: SwipeDirection) => {
    // 액션 방향 설정
    setActiveDirection(direction);
    setShowFeedbackIcon(true);
    
    // 방향에 따른 테두리 색상 설정
    let borderColorValue = 'rgba(255,255,255,0)';
    let shadowColor = 'rgba(0,0,0,0)';
    
    switch (direction) {
      case SwipeDirection.LEFT: // 건너뛰기 (왼쪽) - 회색
        borderColorValue = 'rgba(156, 163, 175, 0.8)';
        shadowColor = 'rgba(156, 163, 175, 0.4)';
        break;
      case SwipeDirection.RIGHT: // 관심 (오른쪽) - 빨간색
        borderColorValue = 'rgba(239, 68, 68, 0.8)';
        shadowColor = 'rgba(239, 68, 68, 0.4)';
        break;
      case SwipeDirection.UP: // 고민중 (위로) - 노란색
        borderColorValue = 'rgba(245, 158, 11, 0.8)';
        shadowColor = 'rgba(245, 158, 11, 0.4)';
        break;
    }
    
    // 즉각적인 테두리 효과 적용 (더 두껍고 선명하게)
    api.start({
      filter: 'blur(0px)', // 블러 효과 제거
      borderColor: borderColorValue.replace(/[^,]+(?=\))/, '0.95'), // 더 선명하게
      borderWidth: '10px', // 더 두껍게
      boxShadow: `0 0 25px 15px ${shadowColor.replace(/[^,]+(?=\))/, '0.7')}`, // 그림자 강화
    });
    
    // 방향에 따른 애니메이션 적용
    setTimeout(() => {
      if (direction === SwipeDirection.LEFT) {
        // 왼쪽 (건너뛰기) - 방향 변경됨
        api.start({
          x: -window.innerWidth - 200,
          rotate: -30,
          filter: 'blur(8px)',
          borderColor: borderColorValue,
          borderWidth: '8px',
          boxShadow: `0 0 30px 10px ${shadowColor}`,
          onRest: () => onSwipe(direction, product.id),
        });
      } else if (direction === SwipeDirection.RIGHT) {
        // 오른쪽 (관심) - 방향 변경됨
        api.start({
          x: window.innerWidth + 200,
          rotate: 30,
          filter: 'blur(8px)',
          borderColor: borderColorValue,
          borderWidth: '8px',
          boxShadow: `0 0 30px 10px ${shadowColor}`,
          onRest: () => onSwipe(direction, product.id),
        });
      } else if (direction === SwipeDirection.UP) {
        // 위쪽 (고민중) - 그대로 유지
        api.start({
          y: -window.innerHeight - 200,
          filter: 'blur(8px)',
          borderColor: borderColorValue,
          borderWidth: '8px',
          boxShadow: `0 0 30px 10px ${shadowColor}`,
          onRest: () => onSwipe(direction, product.id),
        });
      }
    }, 100);
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
    
    // 스와이프 방향에 따른 아이콘 표시 - 명확하게 큰 아이콘으로 표시
    setShowFeedbackIcon(true);
    
    // 효과 시간 이후 아이콘 숨기기 자동화
    setTimeout(() => {
      if (!isDragging.current) {
        setShowFeedbackIcon(false);
      }
    }, 1500);
    
    // 일정 거리 이상의 명확한 수평 스와이프만 처리
    if (isHorizontalSwipe) {
      if (currentX > swipeThreshold) {
        // 오른쪽 스와이프 -> 관심 상품으로 변경 (빨간색)
        const borderColorValue = 'rgba(239, 68, 68, 0.9)'; // 빨간색
        const shadowColor = 'rgba(239, 68, 68, 0.5)';
        
        api.start({
          x: window.innerWidth + 200,
          rotate: 30,
          filter: 'blur(0px)', // 블러 효과 제거
          borderColor: borderColorValue,
          borderWidth: '10px', // 더 굵게
          boxShadow: `0 0 35px 15px ${shadowColor}`,
          onRest: () => onSwipe(SwipeDirection.RIGHT, product.id),
        });
      } else if (currentX < -swipeThreshold) {
        // 왼쪽 스와이프 -> 건너뛰기로 변경 (회색)
        const borderColorValue = 'rgba(156, 163, 175, 0.9)'; // 회색
        const shadowColor = 'rgba(156, 163, 175, 0.5)';
        
        api.start({
          x: -window.innerWidth - 200,
          rotate: -30,
          filter: 'blur(0px)', // 블러 효과 제거
          borderColor: borderColorValue,
          borderWidth: '10px', // 더 굵게
          boxShadow: `0 0 35px 15px ${shadowColor}`,
          onRest: () => onSwipe(SwipeDirection.LEFT, product.id),
        });
      } else {
        // 스와이프 거리가 충분하지 않음 - 원래 상태로 복원
        api.start({ 
          x: 0, 
          y: 0, 
          rotate: 0, 
          filter: 'blur(0px)',
          borderColor: 'rgba(255,255,255,0)',
          borderWidth: '0px',
          boxShadow: '0 0 0 0 rgba(0,0,0,0)'
        });
        setShowFeedbackIcon(false);
      }
    } 
    // 명확한 위쪽 방향 스와이프만 처리 (위로 향하는 제스처와 충분한 거리)
    else if (isVerticalSwipe && currentY < -swipeThreshold) {
      // 위로 스와이프 -> 고민중 (노란색)
      const borderColorValue = 'rgba(245, 158, 11, 0.9)'; // 노란색
      const shadowColor = 'rgba(245, 158, 11, 0.5)';
      
      api.start({
        y: -window.innerHeight - 200,
        filter: 'blur(0px)', // 블러 효과 제거
        borderColor: borderColorValue,
        borderWidth: '10px', // 더 굵게
        boxShadow: `0 0 35px 15px ${shadowColor}`,
        onRest: () => onSwipe(SwipeDirection.UP, product.id),
      });
    } 
    // 기타 모든 제스처는 리셋
    else {
      api.start({ 
        x: 0, 
        y: 0, 
        rotate: 0, 
        filter: 'blur(0px)',
        borderColor: 'rgba(255,255,255,0)',
        borderWidth: '0px',
        boxShadow: '0 0 0 0 rgba(0,0,0,0)'
      });
      setShowFeedbackIcon(false);
    }
    
    // 방향 초기화
    setActiveDirection(null);
  };
  
  // 방향에 따른 피드백 아이콘 결정 - 수정된 스와이프 방향 적용
  const getFeedbackIcon = () => {
    // 스와이프 강도에 따라 아이콘 크기와 투명도 결정
    // 임계값의 20%부터 아이콘이 조금씩 나타나기 시작
    const minThreshold = swipeThreshold * 0.2;
    const swipeIntensity = Math.max(
      Math.abs(currentX) > minThreshold ? (Math.abs(currentX) - minThreshold) / (swipeThreshold - minThreshold) : 0,
      currentY < -minThreshold ? (Math.abs(currentY) - minThreshold) / (swipeThreshold - minThreshold) : 0
    );
    
    const shouldShowIcon = swipeIntensity > 0 || activeDirection !== null;
    if (!shouldShowIcon) return null;
    
    // 화면 정중앙에 위치하는 아이콘 스타일 (포인터 이벤트 무시)
    const baseStyles = "fixed inset-0 z-[100] flex items-center justify-center pointer-events-none transition-all duration-200";
    
    // 버튼 클릭 시 activeDirection 사용, 스와이프 시 현재 위치 사용
    const isButtonAction = activeDirection !== null;
    
    // 아이콘 투명도 및 크기 계산 (스와이프 강도에 비례)
    const getOpacity = () => {
      // 버튼 클릭인 경우 완전 불투명
      if (isButtonAction) return 1;
      
      // 스와이프 강도에 비례 (0.2~1)
      return Math.min(0.2 + swipeIntensity * 0.8, 1);
    };
    
    // 아이콘 크기 계산 (스와이프 강도에 비례) - 실제 스타일에 적용될 크기
    const getSize = () => {
      // 최소 크기에서 시작해서 강도에 따라 증가
      const minSize = 32; // 최소 크기 (px)
      const maxSize = 120; // 최대 크기 (px)
      
      // 버튼 클릭이거나 최대 임계값을 넘으면 최대 크기
      if (isButtonAction || swipeIntensity >= 1) {
        return maxSize;
      }
      
      // 스와이프 강도에 비례하여 크기 결정 (부드러운 전환)
      return minSize + (maxSize - minSize) * swipeIntensity;
    };
    
    // 컨테이너 크기 계산 (아이콘 크기보다 약간 더 큼)
    const getContainerSize = () => {
      const iconSize = getSize();
      return iconSize * 1.5; // 아이콘보다 50% 더 큰 컨테이너
    };
    
    // 아이콘 컨테이너 크기와 아이콘 크기를 동적으로 계산
    const containerSize = getContainerSize();
    const iconSize = getSize();
    
    // 현재 활성화된 방향 확인
    let direction = activeDirection;
    if (!direction) {
      // 스와이프 방향에 따라 활성화 방향 결정
      if (currentX > minThreshold) {
        direction = SwipeDirection.RIGHT;
      } else if (currentX < -minThreshold) {
        direction = SwipeDirection.LEFT;
      } else if (currentY < -minThreshold) {
        direction = SwipeDirection.UP;
      }
    }
    
    // 방향에 따른 아이콘 스타일 결정
    let iconElement = null;
    let containerStyle = {};
    
    switch (direction) {
      case SwipeDirection.LEFT:
        // 건너뛰기 (왼쪽) - 회색
        containerStyle = {
          width: `${containerSize}px`,
          height: `${containerSize}px`,
          backgroundColor: 'rgba(243, 244, 246, 0.9)',
          borderRadius: '50%',
          border: '8px solid rgba(156, 163, 175, 0.95)',
          boxShadow: '0 0 30px 10px rgba(156, 163, 175, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease-in-out'
        };
        iconElement = (
          <X
            width={iconSize}
            height={iconSize}
            className="text-gray-600 transition-all duration-200"
            strokeWidth={3}
          />
        );
        break;
        
      case SwipeDirection.RIGHT:
        // 관심 (오른쪽) - 빨간색
        containerStyle = {
          width: `${containerSize}px`,
          height: `${containerSize}px`,
          backgroundColor: 'rgba(254, 242, 242, 0.9)',
          borderRadius: '50%',
          border: '8px solid rgba(239, 68, 68, 0.95)',
          boxShadow: '0 0 30px 10px rgba(239, 68, 68, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease-in-out'
        };
        iconElement = (
          <Heart
            width={iconSize}
            height={iconSize}
            className="text-red-600 fill-red-500 transition-all duration-200"
            strokeWidth={2.5}
          />
        );
        break;
        
      case SwipeDirection.UP:
        // 고민중 (위로) - 노란색
        containerStyle = {
          width: `${containerSize}px`,
          height: `${containerSize}px`,
          backgroundColor: 'rgba(255, 251, 235, 0.9)',
          borderRadius: '50%',
          border: '8px solid rgba(245, 158, 11, 0.95)',
          boxShadow: '0 0 30px 10px rgba(245, 158, 11, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease-in-out'
        };
        iconElement = (
          <HelpCircle
            width={iconSize}
            height={iconSize}
            className="text-amber-600 transition-all duration-200"
            strokeWidth={2.5}
          />
        );
        break;
        
      default:
        return null;
    }
    
    // 버튼 클릭 시 맥동 효과 추가
    const animation = isButtonAction ? 'animate-pulse-strong' : '';
    
    return (
      <div 
        className={baseStyles} 
        style={{ opacity: getOpacity(), transition: 'opacity 0.2s ease-in-out' }}
      >
        <div 
          className={animation}
          style={containerStyle}
        >
          {iconElement}
        </div>
      </div>
    );
  };
  
  // 방향에 따른 버튼 진동 효과 클래스
  const getButtonShakeClass = (forDirection: SwipeDirection) => {
    if (buttonShake && activeDirection === forDirection) {
      return "animate-wiggle";
    }
    return "";
  };

  return (
    <animated.div
      className={`card absolute inset-0 will-change-transform ${isProcessing ? 'pointer-events-none' : ''}`}
      style={{
        ...styles,
        x,
        y,
        rotate,
        filter,
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
      <Card className="h-full overflow-hidden max-h-[650px] relative card-content transition-all duration-200">
        {/* 피드백 아이콘 */}
        {getFeedbackIcon()}
        
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
