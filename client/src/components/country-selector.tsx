import { useAppContext } from "@/contexts/AppContext";

export function CountrySelector() {
  const { selectedCountry } = useAppContext();
  
  return (
    <div className="flex items-center space-x-2 py-2 px-3 rounded-full bg-white border border-gray-200 font-medium text-sm">
      <img
        src={selectedCountry.flagUrl}
        alt={`${selectedCountry.name} 국기`}
        className="w-5 h-5 rounded-full object-cover"
      />
      <span>{selectedCountry.name}</span>
    </div>
  );
}
