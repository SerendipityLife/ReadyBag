import { FilterButton } from "@/components/filter/filter-button";
import { useAppContext } from "@/contexts/AppContext";

export function FilterCurrencyBar() {
  const { selectedCountry } = useAppContext();

  return (
    <div className="w-full max-w-md flex justify-between items-center mb-4 bg-white rounded-lg shadow-sm p-3">
      <div className="flex items-center">
        <div className="flex items-center space-x-2">
          <img
            src={selectedCountry.flagUrl}
            alt={`${selectedCountry.name} 국기`}
            className="w-5 h-5 rounded-full object-cover"
          />
          <span className="text-sm font-medium">{selectedCountry.name} 상품</span>
        </div>
      </div>
      
      <FilterButton />
    </div>
  );
}