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
    <div className="relative w-full md:w-auto" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center space-x-2 py-1.5 px-3 w-full md:w-auto rounded-full bg-white border border-gray-200 hover:border-primary transition-colors font-medium text-sm"
      >
        <img
          src={selectedCountry.flagUrl}
          alt={`${selectedCountry.name} 국기`}
          className="w-4 h-4 md:w-5 md:h-5 rounded-full object-cover"
        />
        <span className="text-sm">{selectedCountry.name}</span>
        <ChevronDown className="w-3 h-3 md:w-4 md:h-4 text-neutral" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 md:right-0 mt-1 w-full md:w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-50">
          <div className="py-2 px-3 md:py-3 md:px-4">
            <div className="flex items-center justify-center md:justify-start text-sm text-neutral">
              <span className="text-xs italic">더 많은 국가가 제공 예정입니다</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
