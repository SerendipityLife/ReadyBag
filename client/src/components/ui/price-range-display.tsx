
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
    <div className={`space-y-1.5 ${className}`}>
      {/* 엔화 가격 구간 */}
      <div className="text-xs">
        <div className="text-gray-500 mb-0.5">엔화 가격 구간(최저가 ~ +20%)</div>
        <div className="font-semibold text-green-600">
          ¥{formatPrice(priceInfo.rakutenMinPrice)} ~ ¥{formatPrice(priceInfo.rakutenMaxPrice)}
        </div>
      </div>
      
      {/* 원화 가격 구간 */}
      {priceInfo.rakutenMinPriceKrw && priceInfo.rakutenMaxPriceKrw && (
        <div className="text-xs">
          <div className="text-gray-500 mb-0.5">한화 가격 구간(최저가 ~ +20%)</div>
          <div className="font-semibold text-blue-600">
            ₩{formatPrice(priceInfo.rakutenMinPriceKrw)} ~ ₩{formatPrice(priceInfo.rakutenMaxPriceKrw)}
          </div>
        </div>
      )}
    </div>
  );
}
