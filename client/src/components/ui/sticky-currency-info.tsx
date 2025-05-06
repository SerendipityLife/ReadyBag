import { useAppContext } from "@/contexts/AppContext";

export function StickyCurrencyInfo() {
  const { selectedCountry, exchangeRate, lastUpdated } = useAppContext();

  if (!exchangeRate) return null;

  return (
    <div className="sticky top-14 z-20 bg-gray-50 pt-2 pb-1">
      <div className="bg-white rounded-lg p-2 mb-1 flex items-center justify-between text-xs text-gray-600 shadow-sm">
        <div className="flex items-center">
          <span className="font-medium">현재 환율:</span>
          <span className="ml-1 font-semibold">
            100{selectedCountry.currency === "JPY" ? "엔" : selectedCountry.currency} = {(exchangeRate * 100).toFixed(0)}원
          </span>
          <span className="ml-1 px-1 bg-green-50 text-green-600 rounded text-[10px]">LIVE</span>
        </div>
        <div className="text-gray-500 text-[10px]">
          {lastUpdated && new Date(lastUpdated).toLocaleString('ko-KR', {
            month: 'numeric',
            day: 'numeric', 
            hour: '2-digit',
            minute: '2-digit'
          })} 기준
        </div>
      </div>
    </div>
  );
}