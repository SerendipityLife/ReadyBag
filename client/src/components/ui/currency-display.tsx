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

  return (
    <div className={`text-neutral ${className}`}>
      {showBase && (
        <div className="font-medium">
          {formatCurrency(amount, fromCurrency)}
        </div>
      )}
      {showConverted && convertedAmount !== null && (
        <div className="flex items-center">
          <span className="font-accent font-semibold text-primary">
            {formatCurrency(convertedAmount, "KRW")}
          </span>
          {isFresh && (
            <span className="ml-1 text-xs bg-green-50 text-green-700 px-1 rounded">LIVE</span>
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
      ? "방금 업데이트" 
      : minutesAgo < 60 
        ? `${minutesAgo}분 전 업데이트` 
        : lastUpdated ? format(new Date(lastUpdated), "yyyy.MM.dd HH:mm") : ""
    : "";
  
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
          <div className="text-xs text-neutral">{updatedText}</div>
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-2">
        *실시간 환율 정보는 30분마다 업데이트되며, 쇼핑 가격 계산에 자동 반영됩니다.
      </div>
    </div>
  );
}
