import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Navigation, Loader2, Home } from "lucide-react";
import { googleMapsService, type PlaceResult, type HotelLocation } from "@/lib/google-maps";

interface LocationSearchProps {
  onLocationSelect?: (location: HotelLocation) => void;
}

const FACILITY_TYPES = [
  { 
    value: "convenience_store", 
    label: "편의점", 
    keywords: ["convenience store", "コンビニ", "편의점"],
    subTypes: [
      { value: "seven_eleven", label: "세븐일레븐", keywords: ["7-Eleven", "セブンイレブン", "세븐일레븐"] },
      { value: "lawson", label: "로손", keywords: ["Lawson", "ローソン", "로손"] },
      { value: "family_mart", label: "패밀리마트", keywords: ["FamilyMart", "ファミリーマート", "패밀리마트"] }
    ]
  },
  { 
    value: "store", 
    label: "돈키호테", 
    keywords: ["돈키호테", "don quijote", "ドン・キホーテ"],
    subTypes: []
  },
  { 
    value: "pharmacy", 
    label: "드럭스토어", 
    keywords: ["drugstore", "pharmacy", "matsumoto", "마츠모토키요시", "ドラッグストア"],
    subTypes: []
  }
];

export function LocationSearch({ onLocationSelect }: LocationSearchProps) {
  const [locationAddress, setLocationAddress] = useState("");
  const [selectedFacilityType, setSelectedFacilityType] = useState("convenience_store");
  const [selectedSubType, setSelectedSubType] = useState<string>("all_brands"); // 하위 브랜드 선택
  const [currentLocation, setCurrentLocation] = useState<HotelLocation | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setCurrentLocation(location);
        onLocationSelect?.(location);
        setError(null);
        setNearbyPlaces([]); // 새 위치 검색 시 이전 결과 초기화
      } else {
        setError("주소를 찾을 수 없습니다. 더 구체적인 주소를 입력해주세요.");
      }
    } catch (error) {
      console.error("주소 검색 오류:", error);
      setError("주소 검색 중 오류가 발생했습니다.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleFacilitySearch = async () => {
    if (!currentLocation) {
      setError("먼저 숙박지 주소를 설정해주세요.");
      return;
    }

    setIsLoadingPlaces(true);
    setError(null);

    try {
      const facilityType = FACILITY_TYPES.find(f => f.value === selectedFacilityType);
      if (!facilityType) return;

      let searchKeywords: string[] = [];
      
      // 하위 브랜드가 선택된 경우 해당 브랜드만 검색 ("all_brands"가 아닌 경우)
      if (selectedSubType && selectedSubType !== "all_brands") {
        const subType = facilityType.subTypes.find(st => st.value === selectedSubType);
        if (subType) {
          searchKeywords = subType.keywords;
        }
      } else {
        // 상위 카테고리만 선택된 경우 (모든 브랜드)
        if (facilityType.subTypes.length > 0) {
          // 편의점의 경우 통합 검색 수행
          const allBrandResults = await googleMapsService.findAllConvenienceStores(
            { lat: currentLocation.lat, lng: currentLocation.lng }
          );
          
          // 거리 계산하여 가장 가까운 TOP 3만 선택
          const resultsWithDistance = await googleMapsService.calculateDistances(
            { lat: currentLocation.lat, lng: currentLocation.lng },
            allBrandResults.slice(0, 3)
          );

          setNearbyPlaces(resultsWithDistance);
          setIsLoadingPlaces(false);
          return;
        } else {
          searchKeywords = facilityType.keywords;
        }
      }

      let allResults: PlaceResult[] = [];

      // 각 키워드로 검색하여 결과 수집
      for (const keyword of searchKeywords) {
        const results = await googleMapsService.findNearbyPlaces(
          { lat: currentLocation.lat, lng: currentLocation.lng },
          selectedFacilityType,
          keyword
        );
        allResults = [...allResults, ...results];
      }

      // 중복 제거 (같은 placeId나 매우 가까운 위치)
      const uniqueResults = allResults.filter((result, index, arr) => {
        return !arr.slice(0, index).some(prev => 
          prev.placeId === result.placeId ||
          (Math.abs(prev.lat - result.lat) < 0.0001 && Math.abs(prev.lng - result.lng) < 0.0001)
        );
      });

      // 거리 계산 - TOP 3로 제한
      const resultsWithDistance = await googleMapsService.calculateDistances(
        { lat: currentLocation.lat, lng: currentLocation.lng },
        uniqueResults.slice(0, 3) // TOP 3만
      );

      setNearbyPlaces(resultsWithDistance);
    } catch (error) {
      console.error("주변 시설 검색 오류:", error);
      setError("주변 시설 검색 중 오류가 발생했습니다.");
    } finally {
      setIsLoadingPlaces(false);
    }
  };

  const handleNavigate = (place: PlaceResult) => {
    if (currentLocation) {
      const mapsUrl = googleMapsService.generateMapsUrl(
        { lat: currentLocation.lat, lng: currentLocation.lng },
        { lat: place.lat, lng: place.lng }
      );
      window.open(mapsUrl, '_blank');
    }
  };

  const getFacilityLabel = () => {
    const facilityType = FACILITY_TYPES.find(f => f.value === selectedFacilityType);
    if (!facilityType) return "시설";
    
    if (selectedSubType && selectedSubType !== "all_brands") {
      const subType = facilityType.subTypes.find(st => st.value === selectedSubType);
      return subType ? subType.label : facilityType.label;
    }
    
    return facilityType.label;
  };

  return (
    <div className="space-y-6">
      {/* 숙박지 주소 입력 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            숙박지 주소
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="상세한 주소를 영어로 입력하세요"
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleLocationSearch} 
              disabled={isSearching}
              className="min-w-[80px]"
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "검색"}
            </Button>
          </div>

          <div className="text-sm text-gray-500 space-y-2">
            <p className="font-medium">영어 주소 예시 (더 정확한 결과를 위해):</p>
            <div className="space-y-1 text-xs">
              <p>• "2-1-1 Shibuya, Shibuya City, Tokyo, Japan"</p>
              <p>• "1-1-1 Namba, Chuo Ward, Osaka, Japan"</p>
              <p>• "Shibuya Sky Building, Tokyo"</p>
              <p>• "Tokyo Station Hotel, Marunouchi"</p>
            </div>
          </div>

          {currentLocation && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-green-600 mt-1" />
                <div>
                  <p className="font-medium text-green-800">설정된 위치</p>
                  <p className="text-sm text-green-600">{currentLocation.address}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 주변 시설 검색 */}
      {currentLocation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              주변 편의시설 검색
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Select 
                  value={selectedFacilityType} 
                  onValueChange={(value) => {
                    setSelectedFacilityType(value);
                    setSelectedSubType("all_brands"); // 상위 카테고리 변경 시 하위 선택 초기화
                    setNearbyPlaces([]); // 이전 검색 결과 초기화
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FACILITY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleFacilitySearch} 
                  disabled={isLoadingPlaces}
                  className="min-w-[80px]"
                >
                  {isLoadingPlaces ? <Loader2 className="h-4 w-4 animate-spin" /> : "찾기"}
                </Button>
              </div>

              {/* 하위 브랜드 선택 (편의점의 경우에만) */}
              {(() => {
                const currentFacility = FACILITY_TYPES.find(f => f.value === selectedFacilityType);
                return currentFacility && currentFacility.subTypes.length > 0 ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      브랜드 선택 (선택사항)
                    </label>
                    <Select value={selectedSubType} onValueChange={setSelectedSubType}>
                      <SelectTrigger>
                        <SelectValue placeholder="모든 브랜드" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_brands">모든 브랜드</SelectItem>
                        {currentFacility.subTypes.map((subType) => (
                          <SelectItem key={subType.value} value={subType.value}>
                            {subType.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null;
              })()}
            </div>

            {nearbyPlaces.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">
                  도보로 가까운 {getFacilityLabel()} TOP {nearbyPlaces.length}
                </h4>
                
                {nearbyPlaces.map((place, index) => (
                  <div 
                    key={`${place.lat}-${place.lng}-${index}`}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-1">
                          {index + 1}
                        </Badge>
                        <div>
                          <h5 className="font-medium text-gray-900">{place.name}</h5>
                          <p className="text-sm text-gray-600">{place.address}</p>
                          {place.distance && place.duration && (
                            <div className="flex items-center gap-4 mt-1">
                              <span className="flex items-center gap-1 text-sm text-blue-600">
                                <MapPin className="h-3 w-3" />
                                {place.distance}
                              </span>
                              <span className="flex items-center gap-1 text-sm text-green-600">
                                <Clock className="h-3 w-3" />
                                {place.duration}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      size="sm" 
                      onClick={() => handleNavigate(place)}
                      className="ml-2"
                    >
                      <Navigation className="h-4 w-4 mr-1" />
                      길찾기
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {isLoadingPlaces && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-gray-600">주변 {getFacilityLabel()}를 검색하고 있습니다...</span>
              </div>
            )}

            {nearbyPlaces.length === 0 && !isLoadingPlaces && selectedFacilityType && currentLocation && (
              <div className="text-center py-4 text-gray-500">
                주변에 {getFacilityLabel()}가 없거나 검색 결과가 없습니다.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}