
import { useState, useEffect } from "react";
import { Badge } from "./badge";
import { Loader2 } from "lucide-react";

interface PriceRangeDisplayProps {
  productId: number;
  className?: string;
}

interface PriceInfo {
  rakutenMinPrice?: number;
  rakutenMaxPrice?: number;
  rakutenMinPriceKrw?: number;
  rakutenMaxPriceKrw?: number;
  rakutenPriceUpdatedAt?: string;
}

export function PriceRangeDisplay({ productId, className = "" }: PriceRangeDisplayProps) {
  const [priceInfo, setPriceInfo] = useState<PriceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPriceInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/rakuten/product/${productId}/price`);
        
        if (!response.ok) {
          throw new Error('가격 정보를 가져올 수 없습니다.');
        }
        
        const data = await response.json();
        setPriceInfo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchPriceInfo();
  }, [productId]);

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-gray-500">가격 정보 로딩 중...</span>
      </div>
    );
  }

  if (error || !priceInfo) {
    return (
      <div className={className}>
        <Badge variant="secondary" className="text-xs">
          가격 정보 없음
        </Badge>
      </div>
    );
  }

  if (!priceInfo.rakutenMinPrice || !priceInfo.rakutenMaxPrice) {
    return (
      <div className={className}>
        <Badge variant="secondary" className="text-xs">
          라쿠텐 가격 미조회
        </Badge>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const isRecent = priceInfo.rakutenPriceUpdatedAt && 
    new Date(priceInfo.rakutenPriceUpdatedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000);

  return (
    <div className={`space-y-1 ${className}`}>
      {/* 엔화 가격 */}
      <div className="flex items-center space-x-2">
        <Badge variant="outline" className="text-xs font-medium">
          라쿠텐 가격
        </Badge>
        <span className="text-sm font-medium text-green-600">
          ¥{formatPrice(priceInfo.rakutenMinPrice)} - ¥{formatPrice(priceInfo.rakutenMaxPrice)}
        </span>
      </div>
      
      {/* 원화 가격 */}
      {priceInfo.rakutenMinPriceKrw && priceInfo.rakutenMaxPriceKrw && (
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            원화 환산
          </Badge>
          <span className="text-sm text-blue-600">
            ₩{formatPrice(priceInfo.rakutenMinPriceKrw)} - ₩{formatPrice(priceInfo.rakutenMaxPriceKrw)}
          </span>
        </div>
      )}
      
      {/* 업데이트 시간 */}
      {priceInfo.rakutenPriceUpdatedAt && (
        <div className="text-xs text-gray-400">
          {isRecent ? '최근 업데이트' : `${new Date(priceInfo.rakutenPriceUpdatedAt).toLocaleDateString('ko-KR')} 업데이트`}
        </div>
      )}
    </div>
  );
}
