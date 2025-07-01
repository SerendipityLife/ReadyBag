import { useState } from "react";
import { useAppContext } from "../contexts/AppContext.tsx";
import { COUNTRIES } from "../lib/constants.ts";
import { Button } from "./ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu.tsx";
import { ChevronDown } from "lucide-react";

export function CountrySelector() {
  const { selectedCountry, setSelectedCountry } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);

  const handleCountrySelect = (country: typeof COUNTRIES[0]) => {
    setSelectedCountry(country);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          className="bg-sky-400 hover:bg-sky-500 text-white border-sky-400 h-8 px-3 gap-2 font-medium shadow-md"
        >
          <img
            src={selectedCountry.flagUrl}
            alt={`${selectedCountry.name} 국기`}
            className="w-4 h-4 rounded-sm object-cover"
          />
          <span className="text-sm font-semibold">{selectedCountry.name}</span>
          <ChevronDown className="h-3 w-3 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {COUNTRIES.map((country) => (
          <DropdownMenuItem
            key={country.id}
            onClick={() => handleCountrySelect(country)}
            className="gap-2"
          >
            <img
              src={country.flagUrl}
              alt={`${country.name} 국기`}
              className="w-4 h-4 rounded-sm object-cover"
            />
            <span className="text-sm">{country.name}</span>
          </DropdownMenuItem>
        ))}
        <div className="px-2 py-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 font-medium text-center">
            더 많은 국가가 곧 추가될 예정입니다
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}