import { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { format } from "date-fns";

interface CurrencyDisplayProps {
  amount: number;
  fromCurrency: string;
  className?: string;
  showBase?: boolean;
  showConverted?: boolean;
}

export function CurrencyDisplay({
  amount,
  fromCurrency,
  className = "",
  showBase = true,
  showConverted = true,
}: CurrencyDisplayProps) {
  const { exchangeRate, lastUpdated } = useAppContext();
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  
  useEffect(() => {
    if (exchangeRate !== null && amount !== null) {
      setConvertedAmount(amount * exchangeRate);
    }
  }, [amount, exchangeRate]);

  // Format currency based on code
  const formatCurrency = (value: number, currencyCode: string) => {
    if (currencyCode === "JPY") {
      return `¥${Math.round(value).toLocaleString()}`;
    }
    return `${Math.round(value).toLocaleString()}원`;
  };

  // Format the last updated time as a relative string
  const formatRelativeTime = () => {
    if (!lastUpdated) return null;
    
    const minutesAgo = Math.floor((new Date().getTime() - new Date(lastUpdated).getTime()) / (60 * 1000));
    
    if (minutesAgo < 1) return "방금 전";
    if (minutesAgo < 60) return `${minutesAgo}분 전`;
    
    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo < 24) return `${hoursAgo}시간 전`;
    
    return format(new Date(lastUpdated), "MM.dd HH:mm");
  };

  // Show loading state if exchange rate is not available
  if (exchangeRate === null) {
    return (
      <div className={`text-sm text-neutral ${className}`}>
        <div className="font-medium">환율 정보 로딩 중...</div>
      </div>
    );
  }

  // 마지막 업데이트 시간으로부터 몇 분 지났는지 계산
  const minutesAgo = lastUpdated 
    ? Math.floor((new Date().getTime() - new Date(lastUpdated).getTime()) / (60 * 1000)) 
    : null;
  
  // 환율 새로고침 상태 표시
  const isFresh = minutesAgo !== null && minutesAgo < 30;
  const relativeTime = formatRelativeTime();

  return (
    <div className={`text-neutral ${className}`}>
      {showBase && (
        <div className="font-medium">
          {formatCurrency(amount, fromCurrency)}
        </div>
      )}
      {showConverted && convertedAmount !== null && (
        <div className="flex flex-col">
          <div className="flex items-center">
            <span className="font-accent font-semibold text-primary">
              {formatCurrency(convertedAmount, "KRW")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
