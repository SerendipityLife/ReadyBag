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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Home className="h-4 w-4" /> 숙박지 주소
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="영문 숙소 주소 입력"
            value={locationAddress}
            onChange={(e) => setLocationAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch()}
            className="flex-1"
          />
          <Button 
            onClick={handleLocationSearch}
            disabled={isSearching}
            size="sm"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "검색"
            )}
          </Button>
        </div>
        
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        
        {accommodationLocation && (
          <div className="p-2 bg-green-50 rounded-md">
            <p className="text-sm text-green-800">
              ✓ 숙박지가 설정되었습니다
            </p>
            <p className="text-xs text-green-600 mt-1">
              {accommodationLocation.address}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}