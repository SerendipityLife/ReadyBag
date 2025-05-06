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

  // Format the last updated time
  const formatLastUpdated = () => {
    if (!lastUpdated) return "";
    
    try {
      const date = new Date(lastUpdated);
      return format(date, "yyyy.MM.dd HH:mm");
    } catch (error) {
      return "";
    }
  };

  // Show loading state if exchange rate is not available
  if (exchangeRate === null) {
    return (
      <div className={`text-sm text-neutral ${className}`}>
        <div className="font-medium">환율 정보 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className={`text-sm text-neutral ${className}`}>
      {showBase && (
        <div className="font-medium">
          {formatCurrency(amount, fromCurrency)}
        </div>
      )}
      {showConverted && convertedAmount !== null && (
        <div className="font-accent font-semibold">
          약 {formatCurrency(convertedAmount, "KRW")}
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
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-3 mb-4 flex justify-between items-center">
      <div className="text-sm text-neutral">
        <div className="font-medium">실시간 환율</div>
        <div className="font-accent font-semibold">
          1{selectedCountry.currency === "JPY" ? "엔" : selectedCountry.currency} = <span className="text-accent">{exchangeRate.toFixed(2)}원</span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm text-neutral">최종 업데이트</div>
        <div className="text-xs text-neutral">{lastUpdated ? format(new Date(lastUpdated), "yyyy.MM.dd HH:mm") : ""}</div>
      </div>
    </div>
  );
}
