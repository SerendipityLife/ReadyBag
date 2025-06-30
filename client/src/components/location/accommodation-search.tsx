import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Home, Plus, Check, Info } from "lucide-react";
import { googleMapsService, type HotelLocation } from "@/lib/google-maps";
import { useAppContext } from "@/contexts/AppContext";

export function AccommodationSearch() {
  const { 
    accommodationLocation, 
    setAccommodationLocation, 
    selectedTravelDateId, 
    setAccommodationForTravelDate, 
    getCurrentAccommodation 
  } = useAppContext();
  const [locationAddress, setLocationAddress] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const currentAccommodation = getCurrentAccommodation();
    if (currentAccommodation) {
      setLocationAddress(currentAccommodation.address);
    }
  }, [accommodationLocation, selectedTravelDateId, getCurrentAccommodation]);

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
        const accommodationData = {
          name: location.name,
          address: locationAddress,
          lat: location.lat,
          lng: location.lng
        };
        
        // 여행 날짜가 선택된 경우 해당 날짜에 숙박지 설정
        if (selectedTravelDateId) {
          setAccommodationForTravelDate(selectedTravelDateId, accommodationData);
        } else {
          // 여행 날짜가 선택되지 않은 경우 전역 숙박지 설정
          setAccommodationLocation(accommodationData);
        }
      } else {
        setError("주소를 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error('주소 검색 오류:', error);
      setError("주소 검색 중 오류가 발생했습니다. 정확한 주소를 영문으로 입력해주세요.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="relative">
      <TooltipProvider>
        {getCurrentAccommodation() ? (
          // 숙박지가 설정된 경우 - 컴팩트한 표시
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setIsExpanded(true)}
                variant="default"
                size="sm"
                className="bg-sky-500 hover:bg-sky-600 text-white border-sky-500 h-8 px-3 shadow-md"
              >
                <Check className="h-3 w-3 mr-1" />
                <span className="text-xs">숙박지 설정됨</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">숙박지 근처 편의점, 쇼핑몰 등을 찾을 수 있어요</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          // 숙박지가 설정되지 않은 경우 - 설정 버튼
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setIsExpanded(true)}
                  variant="default"
                  size="sm"
                  className="bg-sky-500 hover:bg-sky-600 text-white border-sky-500 h-8 px-3 shadow-md"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  <span className="text-xs">숙박지 추가</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">구글 맵스 연동으로 주변 시설을 쉽게 찾아보세요</p>
              </TooltipContent>
            </Tooltip>
            
            {/* 정보 아이콘 - 팝오버로 설명 표시 */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                  <Info className="h-3 w-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" side="bottom" align="start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-blue-100 rounded-full">
                      <Home className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-800">숙박지 추가 기능</span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>• 숙소 주소를 설정하면 주변 시설을 자동으로 찾아드려요</p>
                    <p>• 편의점, 드럭스토어, 쇼핑몰 등을 구글 맵스로 검색</p>
                    <p>• 장바구니 탭에서 길찾기 기능으로 바로 이동 가능</p>
                    <p>• 구글 맵스 연동으로 실시간 경로 안내 제공</p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </TooltipProvider>

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
                <Home className="h-5 w-5 text-blue-600" />
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

            {/* 향상된 안내 문구 */}
            <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-blue-100 rounded-full">
                  <Home className="h-3 w-3 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-blue-800">구글 맵스 연동 기능</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-blue-700">숙박하는 호텔이나 숙소 주소를 설정하면</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-blue-700">주변 편의점, 드럭스토어, 쇼핑몰을 자동으로 찾아드려요</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-green-700">구글 맵스에서 바로 길찾기도 가능해요!</p>
                </div>
              </div>
            </div>

            {getCurrentAccommodation() && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 font-medium">현재 설정된 숙박지:</p>
                <p className="text-sm text-blue-600 mt-1 break-all">{getCurrentAccommodation()!.address}</p>
                {selectedTravelDateId && (
                  <p className="text-xs text-blue-500 mt-1">현재 여행 날짜에 설정됨</p>
                )}
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
                  className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white"
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

              {getCurrentAccommodation() && (
                <Button
                  onClick={() => {
                    setLocationAddress("");
                    if (selectedTravelDateId) {
                      setAccommodationForTravelDate(selectedTravelDateId, null);
                    } else {
                      setAccommodationLocation(null);
                    }
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