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
          className="h-8 px-3 text-sand-brown-600 border-sand-brown-200 hover:bg-sand-brown-50"
        >
          <Plus className="h-3 w-3 mr-1" />
          <span className="text-xs">숙박지 추가</span>
        </Button>
      )}

      {/* 확장된 검색 창 - 고정 위치 모달 */}
      {isExpanded && (
        <>
          {/* 배경 오버레이 */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-40" 
            onClick={() => setIsExpanded(false)}
          />
          
          {/* 모달 컨텐츠 */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-96 max-w-[90vw] bg-white border border-gray-200 rounded-lg shadow-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5 text-sand-brown-600" />
                <span className="text-base font-medium text-gray-700">숙박지 주소 설정</span>
              </div>
              <Button
                onClick={() => setIsExpanded(false)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
              >
                ×
              </Button>
            </div>

            {/* 안내 문구 추가 */}
            <div className="mb-4 p-3 bg-sand-brown-50 rounded-lg border border-sand-brown-200">
              <div className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-sand-brown-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-sand-brown-700">숙박하는 호텔이나 숙소 주소를 알려주세요</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-sand-brown-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-sand-brown-700">숙소 근처 편의점, 쇼핑몰 등 가까운 곳을 찾아드려요</p>
                </div>
              </div>
            </div>

            {accommodationLocation && (
              <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 font-medium">현재 설정된 숙박지:</p>
                <p className="text-sm text-green-600 mt-1 break-all">{accommodationLocation.address}</p>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="영문 숙소 주소 입력"
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch()}
                  className="flex-1 h-10"
                  autoFocus
                />
                <Button 
                  onClick={handleLocationSearch}
                  disabled={isSearching}
                  size="sm"
                  className="h-10 px-4"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "검색"
                  )}
                </Button>
              </div>
              
              {error && (
                <p className="text-sm text-red-500">{error}</p>
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
                  className="w-full h-10 text-sm text-red-600 border-red-200 hover:bg-red-50"
                >
                  숙박지 설정 해제
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}