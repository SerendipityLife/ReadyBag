import { cn } from "@/lib/utils";

export function ExchangeFilterTabs() {
  return (
    <div className="w-full max-w-md mx-auto mb-4">
      <div className="grid grid-cols-2 gap-4">
        <button
          className="py-4 rounded-lg font-medium text-center transition-all shadow-sm
            bg-white border border-gray-200 text-gray-700"
        >
          환율
        </button>
        
        <button
          className="py-4 rounded-lg font-medium text-center transition-all flex items-center justify-center shadow-sm
            bg-white border border-gray-200 text-gray-700"
        >
          필터 아이콘
        </button>
      </div>
    </div>
  );
}