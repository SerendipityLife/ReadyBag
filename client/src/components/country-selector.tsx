import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppContext } from "@/contexts/AppContext";
import { COUNTRIES, API_ROUTES } from "@/lib/constants";
import { ChevronDown } from "lucide-react";
import type { Country } from "@shared/schema";

export function CountrySelector() {
  const { selectedCountry, setSelectedCountry } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Fetch available countries
  const { data: countries = COUNTRIES } = useQuery<Country[]>({
    queryKey: [API_ROUTES.COUNTRIES],
  });
  
  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const handleCountryClick = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 py-2 px-3 rounded-full bg-white border border-gray-200 hover:border-primary transition-colors font-medium text-sm"
      >
        <img
          src={selectedCountry.flagUrl}
          alt={`${selectedCountry.name} 국기`}
          className="w-5 h-5 rounded-full object-cover"
        />
        <span>{selectedCountry.name}</span>
        <ChevronDown className="w-4 h-4 text-neutral" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-50">
          <div className="py-3 px-4">
            <div className="flex items-center text-sm text-neutral">
              <span className="text-xs italic">더 많은 국가가 제공 예정입니다</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
