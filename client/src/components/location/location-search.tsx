import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Navigation, Loader2, Home } from "lucide-react";
import { googleMapsService, type PlaceResult, type HotelLocation } from "@/lib/google-maps";
import { useAppContext, type AccommodationLocation } from "@/contexts/AppContext";

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
  const { accommodationLocation, setAccommodationLocation } = useAppContext();
  const [locationAddress, setLocationAddress] = useState("");
  const [selectedFacilityType, setSelectedFacilityType] = useState("convenience_store");
  const [selectedSubType, setSelectedSubType] = useState<string>("all_brands");
  const [currentLocation, setCurrentLocation] = useState<HotelLocation | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 앱 컨텍스트의 숙박지 주소로부터 초기화
  useEffect(() => {
    if (accommodationLocation) {
      setLocationAddress(accommodationLocation.address);
      setCurrentLocation({
        name: accommodationLocation.name,
        address: accommodationLocation.address,
        lat: accommodationLocation.lat,
        lng: accommodationLocation.lng
      });
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
        setCurrentLocation(location);
        // 글로벌 앱 상태에 숙박지 주소 저장 - 사용자 입력 원본 주소 보존
        setAccommodationLocation({
          name: location.name,
          address: locationAddress, // 지오코딩된 주소가 아닌 사용자 입력 원본 사용
          lat: location.lat,
          lng: location.lng
        });
        console.log('✅ 숙박지 주소 저장 완료 (사용자 입력 원본):', locationAddress);
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
      // 항상 글로벌 숙박지 위치를 기준으로 사용 (모든 시설 타입에 적용)
      const originLocation = accommodationLocation || currentLocation;
      
      const facilityType = FACILITY_TYPES.find(f => f.value === selectedFacilityType);
      if (!facilityType) return;

      let searchKeywords: string[] = [];
      
      // 편의점 검색 키워드 설정
      if (selectedSubType && selectedSubType !== "all_brands") {
        // 특정 브랜드 선택
        const subType = facilityType.subTypes.find(st => st.value === selectedSubType);
        if (subType) {
          searchKeywords = subType.keywords;
        }
      } else {
        // 모든 브랜드 선택 - 모든 편의점 브랜드 키워드 사용
        if (facilityType.subTypes.length > 0) {
          searchKeywords = [
            // 일반 편의점 키워드
            '편의점', 'convenience store', 'コンビニ', 'konbini',
            // 세븐일레븐
            '세븐일레븐', '7-Eleven', 'Seven Eleven', 'セブンイレブン',
            // 패밀리마트  
            '패밀리마트', 'FamilyMart', 'ファミリーマート',
            // 로손
            '로손', 'Lawson', 'ローソン',
            // 기타 편의점
            'Poplar', 'ポプラ', 'MiniStop', 'ミニストップ'
          ];
        } else {
          searchKeywords = facilityType.keywords;
        }
      }

      let allResults: PlaceResult[] = [];

      const searchType = selectedSubType === 'all_brands' ? '모든 브랜드' : '특정 브랜드';
      console.log(`${searchType} 편의점 검색 시작 - 키워드:`, searchKeywords);
      console.log('검색 좌표:', { lat: currentLocation.lat, lng: currentLocation.lng });

      // 각 키워드로 검색하여 결과 수집
      for (const keyword of searchKeywords) {
        const results = await googleMapsService.findNearbyPlaces(
          { lat: currentLocation.lat, lng: currentLocation.lng },
          selectedFacilityType,
          keyword
        );
        allResults = [...allResults, ...results];
      }

      console.log('키워드 검색 결과:', allResults.length, '개');
      console.log('검색된 모든 편의점 상세:', allResults.map(store => ({
        name: store.name,
        address: store.address,
        lat: store.lat,
        lng: store.lng,
        placeId: store.placeId
      })));

      // 강화된 중복 제거 로직 (지하철역 내 같은 브랜드 매장 중복 제거)
      const uniqueResults = allResults.filter((result, index, arr) => {
        // 1차: placeId 중복 제거
        const hasSamePlace = arr.slice(0, index).some(prev => prev.placeId === result.placeId);
        if (hasSamePlace) return false;
        
        // 2차: 같은 브랜드 + 유사한 위치 중복 제거
        const brandName = result.name.toLowerCase()
          .replace(/s osl|station|home|south|north|east|west|exit|floor|flr|2nd|chuo|御堂筋線|なんば駅|2番ホーム/g, '')
          .replace(/\s+/g, ' ')
          .trim();
          
        const hasNearbyBrand = arr.slice(0, index).some(prev => {
          const prevBrandName = prev.name.toLowerCase()
            .replace(/s osl|station|home|south|north|east|west|exit|floor|flr|2nd|chuo|御堂筋線|なんば駅|2番ホーム/g, '')
            .replace(/\s+/g, ' ')
            .trim();
            
          // 브랜드명이 유사하고 100m 이내에 있는 경우
          const isSimilarBrand = brandName === prevBrandName || 
                                (brandName.includes('lawson') && prevBrandName.includes('lawson')) ||
                                (brandName.includes('familymart') && prevBrandName.includes('familymart')) ||
                                (brandName.includes('seven') && prevBrandName.includes('seven'));
                                
          const distance = Math.sqrt(
            Math.pow((prev.lat - result.lat) * 111000, 2) + 
            Math.pow((prev.lng - result.lng) * 111000, 2)
          );
          
          return isSimilarBrand && distance < 100; // 100m 이내 같은 브랜드는 중복으로 간주
        });
        
        return !hasNearbyBrand;
      });

      console.log('중복 제거 후 결과:', uniqueResults.length, '개');

      // 편의점만 필터링 (약국 등 제외)
      const convenienceStoreKeywords = [
        'familymart', 'family mart', '패밀리마트', 'ファミリーマート',
        'lawson', '로손', 'ローソン',
        '7-eleven', 'seven eleven', '세븐일레븐', 'セブンイレブン',
        'ministop', '미니스톱', 'ミニストップ',
        'convenience store', 'コンビニ'
      ];
      
      const excludeKeywords = [
        'pharmacy', '약국', '薬局', 'drug', 'ドラッグ',
        'hospital', '병원', '医院', 'clinic', 'クリニック'
      ];
      
      const filteredConvenienceStores = uniqueResults.filter(place => {
        const name = place.name.toLowerCase();
        const address = place.address.toLowerCase();
        
        // 제외할 키워드가 포함된 경우 제외
        const shouldExclude = excludeKeywords.some(keyword => 
          name.includes(keyword.toLowerCase()) || address.includes(keyword.toLowerCase())
        );
        
        if (shouldExclude) return false;
        
        // 편의점 키워드가 포함된 경우 포함
        return convenienceStoreKeywords.some(keyword => 
          name.includes(keyword.toLowerCase()) || address.includes(keyword.toLowerCase())
        );
      });
      
      console.log('편의점 필터링 결과:', filteredConvenienceStores.length, '개');
      console.log('편의점 목록:', filteredConvenienceStores.map(p => ({ name: p.name, address: p.address })));
      
      // 브랜드 필터링 로직 추가
      let finalResults = filteredConvenienceStores;
      
      if (selectedSubType && selectedSubType !== 'all_brands') {
        const brandKeywords: { [key: string]: string[] } = {
          'family_mart': ['familymart', 'family mart', '패밀리마트', 'ファミリーマート'],
          'lawson': ['lawson', '로손', 'ローソン'],
          'seven_eleven': ['7-eleven', 'seven eleven', '세븐일레븐', 'セブンイレブン']
        };
        
        const keywords = brandKeywords[selectedSubType] || [];
        finalResults = filteredConvenienceStores.filter(place => {
          const name = place.name.toLowerCase();
          return keywords.some((keyword: string) => name.includes(keyword.toLowerCase()));
        });
        
        console.log(`${selectedSubType} 브랜드 필터링 결과:`, finalResults.length, '개');
        console.log(`${selectedSubType} 매장 목록:`, finalResults.map(p => ({ name: p.name, address: p.address })));
      }
      
      const sortedByDistance = finalResults
        .map(place => ({
          ...place,
          straightDistance: googleMapsService.calculateDistance(
            originLocation.lat, originLocation.lng,
            place.lat, place.lng
          )
        }))
        .sort((a, b) => a.straightDistance - b.straightDistance)
        .slice(0, Math.min(3, finalResults.length)); // 최대 3개, 없으면 있는 만큼만
      
      console.log(`직선거리 기준 가장 가까운 ${sortedByDistance.length}개:`, sortedByDistance.map(p => ({
        name: p.name,
        distance: `${(p.straightDistance * 1000).toFixed(0)}m`,
        address: p.address
      })));
      
      const limitedResults = sortedByDistance;
      
      // Distance Matrix API로 실제 도보 거리 계산 - 항상 글로벌 숙박지 위치 사용
      const resultsWithDistance = await googleMapsService.calculateDistances(
        { lat: originLocation.lat, lng: originLocation.lng },
        limitedResults
      );

      // Distance Matrix API 실패 시 직선 거리로 대체 계산 - 항상 글로벌 숙박지 위치 사용
      const resultsWithFallbackDistance = resultsWithDistance.map(place => {
        if (!place.distance || place.distance === '거리 정보 없음' || place.distance === '계산 실패' || place.distance === '정보 없음') {
          const straightLineDistance = googleMapsService.calculateDistance(
            originLocation.lat, originLocation.lng,
            place.lat, place.lng
          );
          return {
            ...place,
            distance: `${(straightLineDistance * 1000).toFixed(0)} m`,
            duration: `${Math.ceil(straightLineDistance * 12)} 분`,
            fallback: true
          };
        }
        return { ...place, fallback: false };
      });

      console.log('Distance Matrix API + 직선거리 대체 결과:', resultsWithFallbackDistance);

      // 거리 기준으로 정렬하여 TOP 3 선택
      const sortedByActualDistance = resultsWithFallbackDistance
        .sort((a, b) => {
          const distanceA = parseFloat(a.distance.replace(/[^\d.]/g, ''));
          const distanceB = parseFloat(b.distance.replace(/[^\d.]/g, ''));
          return distanceA - distanceB;
        })
        .slice(0, 3);

      console.log(`Distance Matrix API 기준 ${searchType} TOP 3:`, sortedByActualDistance);

      setNearbyPlaces(sortedByActualDistance);
    } catch (error) {
      console.error("주변 시설 검색 오류:", error);
      setError("주변 시설 검색 중 오류가 발생했습니다.");
    } finally {
      setIsLoadingPlaces(false);
    }
  };

  const handleNavigate = (place: PlaceResult) => {
    // 항상 글로벌 앱 컨텍스트의 숙박지 주소를 출발지로 사용
    if (accommodationLocation) {
      console.log('📍 사용자 입력 원본 주소:', accommodationLocation.address);
      console.log('🎯 목적지:', place.name);
      
      // 사용자 입력 원본 주소를 직접 Google Maps에 전달
      googleMapsService.navigateFromAccommodation(
        accommodationLocation.address, // 사용자가 입력한 정확한 주소
        { lat: place.lat, lng: place.lng, name: place.name }
      );
    } else {
      console.error('숙박지 위치가 설정되지 않았습니다.');
      setError('먼저 숙박지 주소를 설정해주세요.');
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