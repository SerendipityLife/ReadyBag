import { FilterButton } from "@/components/filter/filter-button";
import { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { format } from "date-fns";

export function FilterCurrencyBar() {
  const { exchangeRate, lastUpdated, selectedCountry } = useAppContext();

  // 환율 정보가 없을 때 표시할 내용
  if (!exchangeRate) {
    return (
      <div className="w-full max-w-md flex justify-between items-center mb-4 bg-white rounded-lg shadow-sm p-3">
        <div className="flex-1"></div>
        <FilterButton />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md flex justify-between items-center mb-4 bg-white rounded-lg shadow-sm p-3">
      <div className="flex items-center">
        <div>
          <div className="flex items-center">
            <span className="text-sm font-medium">현재 환율</span>
            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full">LIVE</span>
          </div>
          <div className="font-semibold text-xl mt-1">
            100{selectedCountry.currency === "JPY" ? "엔" : selectedCountry.currency} = <span className="text-red-500">{(exchangeRate * 100).toFixed(0)}원</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            ({lastUpdated ? new Date(lastUpdated).toLocaleString('ko-KR', {
              month: 'numeric',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : ''} 기준)
          </div>
        </div>
      </div>
      
      <FilterButton />
    </div>
  );
}