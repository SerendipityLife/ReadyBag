import { useAppContext } from "@/contexts/AppContext";
import { FilterButton } from "@/components/filter/filter-button";
import { format } from "date-fns";

export function FilterCurrencyBar() {
  const { exchangeRate, lastUpdated, selectedCountry } = useAppContext();
  
  // 환율 정보가 없는 경우
  if (!exchangeRate) {
    return (
      <div className="w-full max-w-md flex justify-end mb-4">
        <FilterButton compact={true} />
      </div>
    );
  }
  
  return (
    <div className="sticky top-[60px] md:top-[68px] z-40 w-full max-w-md mx-auto bg-white rounded-lg p-2 mb-1 flex items-center justify-between text-gray-600 shadow-sm">
      <div className="flex items-center">
        <span className="font-medium text-xs">현재 환율:</span>
        <span className="ml-1 font-semibold text-xs">
          100엔 = <span className="text-red-500">{(exchangeRate * 100).toFixed(0)}원</span>
        </span>
        <span className="ml-1 px-1 bg-green-50 text-green-600 rounded text-[10px]">LIVE</span>
        <span className="ml-2 text-gray-500 text-[10px]">
          {lastUpdated && format(new Date(lastUpdated), "MM.dd HH:mm")} 기준
        </span>
      </div>
      
      {/* 필터 버튼 */}
      <FilterButton compact={true} />
    </div>
  );
}