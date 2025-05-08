import { useAppContext } from "@/contexts/AppContext";
import { FilterButton } from "@/components/filter/filter-button";
import { format } from "date-fns";

export function FilterCurrencyBar() {
  const { exchangeRate, lastUpdated, selectedCountry } = useAppContext();
  
  // 환율 정보가 없는 경우
  if (!exchangeRate) {
    return (
      <div className="w-full max-w-md flex justify-end mb-4">
        <FilterButton />
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-md flex justify-between items-center mb-4">
      {/* 환율 정보 */}
      <div className="flex items-center">
        <div>
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700">현재 환율</span>
            <span className="ml-1 px-1.5 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full">LIVE</span>
          </div>
          <div className="font-medium text-sm">
            100엔 = <span className="text-red-500">{(exchangeRate * 100).toFixed(0)}원</span>
          </div>
          <div className="text-xs text-gray-500">
            ({lastUpdated ? format(new Date(lastUpdated), "MM.dd HH:mm") : ''} 기준)
          </div>
        </div>
      </div>
      
      {/* 필터 버튼 */}
      <FilterButton />
    </div>
  );
}