import { useAppContext } from "@/contexts/AppContext";
import { FilterButton } from "@/components/filter/filter-button";
import { format } from "date-fns";

export function FilterCurrencyBar() {
  const { exchangeRate, lastUpdated, selectedCountry, currentView } = useAppContext();
  
  // 환율 정보가 없는 경우
  if (!exchangeRate) {
    return (
      <div className="w-full max-w-md flex justify-end mb-1">
        <FilterButton scope={currentView} compact={true} />
      </div>
    );
  }
  
  return (
    <div className="sticky top-[48px] md:top-[52px] z-40 w-full max-w-md mx-auto bg-white rounded-md p-1.5 mb-1 flex items-center justify-between text-gray-600 shadow-sm">
      <div className="flex items-center whitespace-nowrap">
        <span className="font-medium text-[10px] md:text-xs mr-1">100{selectedCountry.currency === "JPY" ? "엔" : selectedCountry.currency}=</span>
        <span className="font-semibold text-[10px] md:text-xs text-red-500">
          {(exchangeRate * 100).toFixed(0)}원
        </span>
        <span className="ml-1 px-1 bg-green-50 text-green-600 rounded text-[8px] md:text-[10px]">LIVE</span>
      </div>
      
      {/* 필터 버튼 */}
      <FilterButton scope={currentView} compact={true} />
    </div>
  );
}