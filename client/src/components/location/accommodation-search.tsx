import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Home } from "lucide-react";
import { googleMapsService, type HotelLocation } from "@/lib/google-maps";
import { useAppContext } from "@/contexts/AppContext";

export function AccommodationSearch() {
  const { accommodationLocation, setAccommodationLocation } = useAppContext();
  const [locationAddress, setLocationAddress] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accommodationLocation) {
      setLocationAddress(accommodationLocation.address);
    }
  }, [accommodationLocation]);

  const handleLocationSearch = async () => {
    if (!locationAddress.trim()) {
      setError("주소를 입력해주세요.");
      return;
    }
    setIsSearching(true);
    setError(null);
    try {
      const location = await googleMapsService.geocodeAddress(locationAddress);
      if (location) {
        setAccommodationLocation({
          name: location.name,
          address: locationAddress,
          lat: location.lat,
          lng: location.lng
        });
      } else {
        setError("주소를 찾을 수 없습니다.");
      }
    } catch {
      setError("주소 검색 중 오류가 발생했습니다.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full bg-blue-50 rounded-md p-2 border border-blue-200">
      {accommodationLocation ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <Home className="h-3 w-3 text-blue-600 flex-shrink-0" />
            <p className="text-xs text-blue-700 truncate">
              {accommodationLocation.address}
            </p>
          </div>
          <Button 
            onClick={() => {
              setLocationAddress("");
              setAccommodationLocation(null);
            }}
            variant="ghost"
            size="sm"
            className="h-5 px-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-100"
          >
            변경
          </Button>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center gap-1 mb-1">
            <Home className="h-3 w-3 text-gray-600" />
            <span className="text-xs font-medium text-gray-700">숙박지 주소 설정</span>
          </div>
          <div className="flex gap-1">
            <Input
              placeholder="영문 숙소 주소"
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch()}
              className="flex-1 h-7 text-xs"
            />
            <Button 
              onClick={handleLocationSearch}
              disabled={isSearching}
              size="sm"
              className="h-7 px-2 text-xs"
            >
              {isSearching ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "검색"
              )}
            </Button>
          </div>
          
          {error && (
            <p className="text-xs text-red-500 mt-1">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}