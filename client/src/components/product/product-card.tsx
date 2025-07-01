import { useState, useRef, useEffect } from "react";
import { useSpring, animated } from "@react-spring/web";
import { useAppContext } from "@/contexts/AppContext";
import { Card } from "@/components/ui/card";
import { SwipeDirection } from "@/lib/constants";
import { Loader2, Heart, X, HelpCircle, MessageSquare } from "lucide-react";
import { ReviewButton } from "./review-button";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { PriceRangeDisplay } from "@/components/ui/price-range-display";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const { travelStartDate, travelEndDate, setShouldActivateCalendar, exchangeRate } = useAppContext();
  const { toast } = useToast();

  // 아이콘 애니메이션을 위한 상태 추가
  const [animatingIcon, setAnimatingIcon] = useState(false);
  const [iconAnimation, setIconAnimation] = useState({
    direction: null as SwipeDirection | null,
    opacity: 0,
    size: 0
  });

  const [showFeedbackIcon, setShowFeedbackIcon] = useState(false);
  const [buttonShake, setButtonShake] = useState(false);

  // 상품 설명 모달 상태
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  // 버튼 트리거 여부를 추적하는 ref
  const isButtonTriggered = useRef(false);

  // 액션 트리거 함수를 외부에서 사용할 수 있도록 설정
  // @ts-ignore
  window.triggerCardAction = (direction: SwipeDirection, productId: number) => {
    if ((productId === 0 || productId === product.id) && index === 0) {
      isButtonTriggered.current = true; // 버튼에서 트리거됨을 표시
      triggerAction(direction);
    }
  };

  // 아이콘 애니메이션 함수를 외부에서 사용할 수 있도록 설정
  // @ts-ignore
  window.startIconAnimation = (direction: SwipeDirection) => {
    if (index === 0) {
      // 현재 활성화된 애니메이션이 있으면 리셋
      setAnimatingIcon(false);

      // 새 애니메이션 시작 
      setTimeout(() => {
        setAnimatingIcon(true);
        setIconAnimation({
          direction: direction,
          opacity: 0,
          size: 0
        });

        // 여러 단계로 나누어 아이콘이 부드럽게 커지도록 함
        setTimeout(() => setIconAnimation(prev => ({ ...prev, opacity: 0.3, size: 40 })), 50);
        setTimeout(() => setIconAnimation(prev => ({ ...prev, opacity: 0.6, size: 70 })), 150);
        setTimeout(() => setIconAnimation(prev => ({ ...prev, opacity: 0.9, size: 100 })), 250);
        setTimeout(() => setIconAnimation(prev => ({ ...prev, opacity: 1, size: 120 })), 350);

        // 일정 시간 후 아이콘 숨기기
        setTimeout(() => {
          setAnimatingIcon(false);
        }, 1000);
      }, 20);
    }
  };

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

  // 액션 트리거 함수 (버튼 클릭 시)
  const triggerAction = (direction: SwipeDirection) => {
    // 여행 날짜가 설정되지 않은 경우 토스트 메시지와 캘린더 활성화
    if (!travelStartDate || !travelEndDate) {
      toast({
        title: "여행 날짜를 선택해주세요",
        description: "상품을 선택하기 전에 여행 날짜를 먼저 설정해주세요.",
        variant: "destructive",
      });
      setShouldActivateCalendar(true);
      return;
    }

    if (isProcessing) return;

    // 아이콘 애니메이션과 동시에 시작
    setTimeout(() => {
      if (direction === SwipeDirection.LEFT) {
        // 왼쪽 (건너뛰기)
        api.start({
          x: -window.innerWidth - 200,
          rotate: -30,
          filter: 'blur(0px)',
          borderColor: 'rgba(156, 163, 175, 0.8)',
          borderWidth: '10px',
          boxShadow: '0 0 35px 15px rgba(156, 163, 175, 0.4)',
          config: { tension: 180, friction: 20 },
          onRest: () => {
            // 버튼에서 트리거된 경우 스와이프 처리하지 않음 (중복 방지)
            if (!isButtonTriggered.current) {
              onSwipe(direction, product.id);
            }
            isButtonTriggered.current = false; // 리셋
          },
        });
      } else if (direction === SwipeDirection.RIGHT) {
        // 오른쪽 (관심)
        api.start({
          x: window.innerWidth + 200,
          rotate: 30,
          filter: 'blur(0px)',
          borderColor: 'rgba(239, 68, 68, 0.8)',
          borderWidth: '10px',
          boxShadow: '0 0 35px 15px rgba(239, 68, 68, 0.4)',
          config: { tension: 180, friction: 20 },
          onRest: () => {
            // 버튼에서 트리거된 경우 스와이프 처리하지 않음 (중복 방지)
            if (!isButtonTriggered.current) {
              onSwipe(direction, product.id);
            }
            isButtonTriggered.current = false; // 리셋
          },
        });
      } else if (direction === SwipeDirection.UP) {
        // 위로 (고민중)
        api.start({
          y: -window.innerHeight - 200,
          filter: 'blur(0px)',
          borderColor: 'rgba(245, 158, 11, 0.8)',
          borderWidth: '10px',
          boxShadow: '0 0 35px 15px rgba(245, 158, 11, 0.4)',
          config: { tension: 180, friction: 20 },
          onRest: () => {
            // 버튼에서 트리거된 경우 스와이프 처리하지 않음 (중복 방지)
            if (!isButtonTriggered.current) {
              onSwipe(direction, product.id);
            }
            isButtonTriggered.current = false; // 리셋
          },
        });
      }
    }, 100);
  };

  // 환율을 고려한 가격 표시 (null 체크 추가)
  const priceInKRW = exchangeRate ? Math.round(product.price * exchangeRate) : 0;

  // 터치 이벤트 핸들러
  const handleDescriptionTouchStart = () => {
    const timer = setTimeout(() => {
      setIsDescriptionModalOpen(true);
    }, 100); // 0.5초 길게 누르기
    setLongPressTimer(timer);
  };

  const handleDescriptionTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  return (
    <animated.div
      className="absolute top-0 left-0 right-0 mx-auto"
      style={{
        ...styles,
        x,
        y,
        rotate,
        filter,
        borderColor,
        borderWidth,
        borderStyle: 'solid',
        boxShadow,
        borderRadius: '1rem',
      }}
    >
      <Card className="w-full h-full max-w-xs mx-auto bg-white border-2 border-blue-200 shadow-xl relative overflow-hidden">
        {/* 로딩 오버레이 */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/20 dark:bg-white/10 flex items-center justify-center z-50 rounded-lg">
            <div className="bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          </div>
        )}

        {/* 상품 이미지 */}
        <div className="relative h-64 overflow-hidden rounded-t-lg bg-blue-50">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              // pid 기반으로 다른 확장자들 시도
              const pid = product.id;
              const extensions = ['jpg', 'jpeg', 'png', 'webp'];
              const currentSrc = target.src;
              const currentExt = currentSrc.split('.').pop()?.toLowerCase();
              const currentIndex = extensions.indexOf(currentExt || 'jpg');

              if (currentIndex < extensions.length - 1) {
                const nextExt = extensions[currentIndex + 1];
                target.src = `/images/${pid}.${nextExt}`;
              } else {
                // 모든 확장자 시도 후에도 실패하면 기본 이미지 표시
                target.src = '/images/placeholder.svg';
                target.onerror = null; // 무한 루프 방지
              }
            }}
          />
        </div>

        {/* 상품 정보 - 유연한 높이 */}
        <div className="p-4 min-h-48 flex flex-col">
          <div className="space-y-3 flex-1">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight">
                {product.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {product.nameJapanese}
              </p>
            </div>

            <div 
              className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-2 cursor-pointer select-none"
              onTouchStart={handleDescriptionTouchStart}
              onTouchEnd={handleDescriptionTouchEnd}
              onMouseDown={handleDescriptionTouchStart}
              onMouseUp={handleDescriptionTouchEnd}
              onMouseLeave={handleDescriptionTouchEnd}
            >
              {product.description}
            </div>
          </div>

          {/* 가격 정보와 리뷰 버튼 */}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1 mr-3">
                <PriceRangeDisplay 
                  productId={product.id}
                  className=""
                />
              </div>
              {/* Review button - read-only mode */}
              <ReviewButton 
                productId={product.id} 
                productName={product.name}
                variant="icon"
                size="sm"
                readOnly={true}
              />
            </div>
          </div>
        </div>

        {/* 애니메이션 아이콘 오버레이 */}
        {animatingIcon && iconAnimation.direction && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
            <div
              className="flex items-center justify-center rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg"
              style={{
                width: `${iconAnimation.size}px`,
                height: `${iconAnimation.size}px`,
                opacity: iconAnimation.opacity,
                transition: 'all 0.1s ease-out',
              }}
            >
              {iconAnimation.direction === SwipeDirection.LEFT && (
                <X className="text-gray-500" style={{ fontSize: `${iconAnimation.size * 0.4}px` }} />
              )}
              {iconAnimation.direction === SwipeDirection.RIGHT && (
                <Heart className="text-red-500" style={{ fontSize: `${iconAnimation.size * 0.4}px` }} />
              )}
              {iconAnimation.direction === SwipeDirection.UP && (
                <HelpCircle className="text-yellow-500" style={{ fontSize: `${iconAnimation.size * 0.4}px` }} />
              )}
            </div>
          </div>
        )}
      </Card>

      {/* 상품 설명 모달 */}
      <Dialog open={isDescriptionModalOpen} onOpenChange={setIsDescriptionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {product.name}
            </DialogTitle>
            {product.nameJapanese && (
              <p className="text-sm text-gray-500 mt-1">
                {product.nameJapanese}
              </p>
            )}
          </DialogHeader>
          <div className="mt-4">
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </animated.div>
  );
}