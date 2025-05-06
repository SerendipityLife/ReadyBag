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
            {isFresh && (
              <span className="ml-1 text-xs bg-green-50 text-green-700 px-1 rounded">LIVE</span>
            )}
          </div>
          {relativeTime && (
            <div className="text-[10px] text-gray-500">
              ({relativeTime} 환율기준)
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CurrencyInfoPanel() {
  const { exchangeRate, lastUpdated, selectedCountry } = useAppContext();
  
  if (!exchangeRate) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-3 mb-4 flex justify-between items-center">
        <div className="text-sm text-neutral">
          <div className="font-medium">환율 정보 로딩 중...</div>
        </div>
      </div>
    );
  }
  
  // 마지막 업데이트 시간과 현재 시간의 차이를 분 단위로 계산
  const minutesAgo = lastUpdated 
    ? Math.floor((new Date().getTime() - new Date(lastUpdated).getTime()) / (60 * 1000)) 
    : null;
  
  // 업데이트 시간 표시 텍스트
  const updatedText = minutesAgo !== null
    ? minutesAgo < 1 
      ? "방금 업데이트됨" 
      : minutesAgo < 60 
        ? `${minutesAgo}분 전 업데이트됨` 
        : lastUpdated ? format(new Date(lastUpdated), "yyyy.MM.dd HH:mm") : ""
    : "";
  
  // 정확한 날짜 및 시간 표시
  const formattedDateTime = lastUpdated 
    ? format(new Date(lastUpdated), "yyyy.MM.dd HH:mm:ss") 
    : "";
  
  // 환율 API 소스
  const exchangeApiSource = "open.er-api.com";
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-3 mb-4 flex flex-col">
      <div className="flex justify-between items-center">
        <div className="text-sm">
          <div className="flex items-center">
            <span className="font-medium">실시간 환율</span>
            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full">LIVE</span>
          </div>
          <div className="font-accent font-semibold text-lg mt-1">
            1{selectedCountry.currency === "JPY" ? "엔" : selectedCountry.currency} = <span className="text-accent">{exchangeRate.toFixed(2)}원</span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex flex-col">
            <div className="text-xs font-medium text-neutral">{updatedText}</div>
            <div className="text-[10px] text-gray-500">{formattedDateTime}</div>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center mt-2 text-xs">
        <div className="text-gray-500">
          *실시간 환율 정보는 30분마다 업데이트되며, 쇼핑 가격 계산에 자동 반영됩니다.
        </div>
        <div className="text-gray-400 text-[10px]">
          출처: {exchangeApiSource}
        </div>
      </div>
    </div>
  );
}
