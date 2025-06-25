import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppContext } from "@/contexts/AppContext";
import { COUNTRIES, API_ROUTES } from "@/lib/constants";
import { ChevronDown } from "lucide-react";
import type { Country } from "@shared/schema";
import { FilterButton } from "@/components/filter/filter-button";
import { format } from "date-fns";

export function CountrySelector() {
  const { 
    selectedCountry, 
    setSelectedCountry, 
    exchangeRate, 
    lastUpdated 
  } = useAppContext();
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
  
  // 간단한 환율 표시
  const renderExchangeRate = () => {
    if (!exchangeRate) return null;
    
    return (
      <div className="flex items-center ml-2 text-xs text-gray-500 whitespace-nowrap">
        <span className="hidden md:inline">
          100엔 = <span className="text-red-500 font-semibold">{(exchangeRate * 100).toFixed(0)}원</span>
        </span>
      </div>
    );
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 p-1 rounded-full hover:bg-gray-50"
      >
        <img
          src="/images/logo-readybag.png"
          alt="레디백 로고"
          className="w-5 h-5 rounded-sm object-cover"
        />
        <span className="text-xs md:text-sm font-medium">{selectedCountry.name}</span>
        <ChevronDown className="w-3 h-3 text-gray-500" />
      </button>
      {isOpen && (
        <div className="absolute left-0 mt-1 w-36 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1 px-2">
            <div className="flex items-center justify-center text-sm text-gray-500">
              <span className="text-xs italic">추가 국가 준비중</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
