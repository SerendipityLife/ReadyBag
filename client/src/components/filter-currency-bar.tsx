import { useAppContext } from "@/contexts/AppContext";
import { FilterButton } from "@/components/filter/filter-button";

export function FilterCurrencyBar() {
  const { exchangeRate, selectedCountry } = useAppContext();
  
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
      {/* 환율 정보 - 한 줄로 간결하게 */}
      <div className="flex items-center">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-700">현재 환율</span>
          <span className="ml-1 px-1.5 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full">LIVE</span>
          <span className="ml-2 font-medium text-sm">
            100엔 = <span className="text-red-500">{(exchangeRate * 100).toFixed(0)}원</span>
          </span>
        </div>
      </div>
      
      {/* 필터 버튼 */}
      <FilterButton />
    </div>
  );
}