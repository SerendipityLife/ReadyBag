import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Home, Plus, Check } from "lucide-react";
import { googleMapsService, type HotelLocation } from "@/lib/google-maps";
import { useAppContext } from "@/contexts/AppContext";

export function AccommodationSearch() {
  const { accommodationLocation, setAccommodationLocation } = useAppContext();
  const [locationAddress, setLocationAddress] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

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
    <div className="relative">
      {accommodationLocation ? (
        // 숙박지가 설정된 경우 - 컴팩트한 표시
        <Button
          onClick={() => setIsExpanded(true)}
          variant="outline"
          size="sm"
          className="h-8 px-3 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
        >
          <Check className="h-3 w-3 mr-1" />
          <span className="text-xs">숙박지 설정됨</span>
        </Button>
      ) : (
        // 숙박지가 설정되지 않은 경우 - 설정 버튼
        <Button
          onClick={() => setIsExpanded(true)}
          variant="outline"
          size="sm"
          className="h-8 px-3 text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <Plus className="h-3 w-3 mr-1" />
          <span className="text-xs">숙박지 추가</span>
        </Button>
      )}

      {/* 확장된 검색 창 */}
      {isExpanded && (
        <div className="absolute top-10 left-0 z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">숙박지 주소 설정</span>
            </div>
            <Button
              onClick={() => setIsExpanded(false)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            >
              ×
            </Button>
          </div>

          {accommodationLocation && (
            <div className="mb-3 p-2 bg-green-50 rounded border border-green-200">
              <p className="text-xs text-green-700 font-medium">현재 설정된 숙박지:</p>
              <p className="text-xs text-green-600 mt-1">{accommodationLocation.address}</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="영문 숙소 주소 입력"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch()}
                className="flex-1 h-8 text-sm"
                autoFocus
              />
              <Button 
                onClick={handleLocationSearch}
                disabled={isSearching}
                size="sm"
                className="h-8 px-3"
              >
                {isSearching ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "검색"
                )}
              </Button>
            </div>
            
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}

            {accommodationLocation && (
              <Button
                onClick={() => {
                  setLocationAddress("");
                  setAccommodationLocation(null);
                  setIsExpanded(false);
                }}
                variant="outline"
                size="sm"
                className="w-full h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
              >
                숙박지 설정 해제
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 배경 클릭시 닫기 */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}