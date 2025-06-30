import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MapPin, Clock, Navigation, Loader2, AlertTriangle, Home } from "lucide-react";
import { googleMapsService, type PlaceResult } from "@/lib/google-maps";
import { useAppContext } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/use-auth";
import { API_ROUTES } from "@/lib/constants";
import type { UserProduct } from "@shared/schema";

const FACILITY_TYPES = [
  {
    value: "convenience_store",
    label: "편의점",
    keywords: ["convenience store", "コンビニ", "편의점"],
    subTypes: [
      { value: "seven_eleven", label: "세븐일레븐", keywords: ["7-Eleven", "セブンイレブン", "세븐일레븐", "seven eleven", "7eleven"] },
      { value: "lawson", label: "로손", keywords: ["Lawson", "ローソン", "로손"] },
      { value: "family_mart", label: "패밀리마트", keywords: ["FamilyMart", "ファミリーマート", "패밀리마트"] }
    ]
  },
  {
    value: "store",
    label: "돈키호테",
    keywords: ["don quijote", "ドン・キホーテ", "donki", "mega don quijote", "メガドン・キホーテ", "ドンキ", "don", "mega donki"],
    subTypes: []
  }
];

const normalizeBrandName = (name: string): string => {
  const lowered = name.toLowerCase();
  if (lowered.includes("7-eleven") || lowered.includes("セブン") || lowered.includes("seven")) return "세븐일레븐";
  if (lowered.includes("familymart") || lowered.includes("ファミリーマート") || lowered.includes("family mart")) return "패밀리마트";
  if (lowered.includes("lawson") || lowered.includes("ローソン")) return "로손";
  return name;
};

export function NearbyFacilities() {
  const { accommodationLocation, selectedCountry, selectedTravelDateId, getCurrentAccommodation } = useAppContext();
  const { user } = useAuth();
  const [selectedFacilityType, setSelectedFacilityType] = useState("convenience_store");
  const [selectedSubType, setSelectedSubType] = useState("all_brands");
  const [selectedTravelMode, setSelectedTravelMode] = useState("transit");
  const [nearbyPlaces, setNearbyPlaces] = useState<PlaceResult[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAccommodationAddress, setSavedAccommodationAddress] = useState<string | null>(null);

  const { data: userProducts } = useQuery({
    queryKey: ['user-products', selectedCountry?.id, selectedTravelDateId || 'no-date'],
    queryFn: async () => {
      if (!user || !selectedCountry?.id) {
        const storageKey = `userProducts_${selectedCountry.id}`;
        const storedData = localStorage.getItem(storageKey);
        if (!storedData) return [];
        const localData = JSON.parse(storedData);
        return selectedTravelDateId 
          ? localData.filter((item: any) => item.travelDateId === selectedTravelDateId)
          : localData;
      }
      const url = `${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}${selectedTravelDateId ? `&travelDateId=${selectedTravelDateId}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) return [];
      return await response.json();
    },
    enabled: !!selectedCountry?.id,
  });

  useEffect(() => {
    const currentAccommodation = getCurrentAccommodation();
    if (currentAccommodation && currentAccommodation.address) {
      setSavedAccommodationAddress(currentAccommodation.address);
    } else if (userProducts?.length) {
      const found = userProducts.find((p: any) => p.accommodationAddress?.trim());
      setSavedAccommodationAddress(found?.accommodationAddress || null);
    } else {
      setSavedAccommodationAddress(null);
    }
  }, [accommodationLocation, userProducts, selectedTravelDateId, getCurrentAccommodation]);

  const handleFacilitySearch = async () => {
    let searchLocation = getCurrentAccommodation();
    if (!accommodationLocation && savedAccommodationAddress) {
      try {
        const geo = await googleMapsService.geocodeAddress(savedAccommodationAddress);
        if (geo) searchLocation = geo;
        else throw new Error();
      } catch {
        setError("주소 확인 실패");
        return;
      }
    }
    if (!searchLocation) {
      setError("숙박지 주소가 필요합니다");
      return;
    }

    setIsLoadingPlaces(true);
    setError(null);
    try {
      const origin = { lat: searchLocation.lat, lng: searchLocation.lng };
      const facilityType = FACILITY_TYPES.find(f => f.value === selectedFacilityType);
      if (!facilityType) return;

      let keywords: string[] = [];
      let radius = 300;

      if (selectedSubType !== "all_brands") {
        const sub = facilityType.subTypes.find(s => s.value === selectedSubType);
        if (sub) {
          keywords = sub.keywords;
          radius = 5000;
        }
      } else {
        keywords = facilityType.subTypes.length
          ? facilityType.subTypes.flatMap(st => st.keywords)
          : facilityType.keywords;
        radius = selectedFacilityType === "store" ? 20000 : 300;
      }

      let allResults: PlaceResult[] = [];
      for (const keyword of keywords) {
        const results = await googleMapsService.findNearbyPlacesWithRadius(origin, selectedFacilityType, keyword, radius);
        allResults.push(...results);
      }

      const seen = new Set();
      let unique = allResults.filter(p => {
        const key = `${p.name}_${p.address}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (selectedSubType !== "all_brands") {
        const sub = facilityType.subTypes.find(s => s.value === selectedSubType);
        const subKeywords = sub?.keywords.map(k => k.toLowerCase()) || [];
        unique = unique.filter(p => {
          const name = p.name.toLowerCase();
          return subKeywords.some(k => 
            name.includes(k) || 
            name.replace(/[-\s]/g, '').includes(k.replace(/[-\s]/g, '')) ||
            name.includes(k.replace('7-eleven', '7eleven'))
          );
        });
      }

      // 돈키호테의 경우 완화된 필터링 적용
      if (selectedFacilityType === "store") {
        console.log('돈키호테 필터링 전 결과:', unique.map(p => p.name));
        
        const donkiKeywords = ["don quijote", "ドン・キホーテ", "donki", "ドンキ", "don"];
        unique = unique.filter(p => {
          const name = p.name.toLowerCase();
          const hasKeyword = donkiKeywords.some(k => name.includes(k.toLowerCase()));
          const isExcluded = name.includes("picasso") || 
                            name.includes("uny") || 
                            name.includes("eki donki") || 
                            name.includes("eki marche") || 
                            name.includes("ekidonki") || 
                            name.includes("ekimarche");
          
          console.log(`${p.name}: hasKeyword=${hasKeyword}, isExcluded=${isExcluded}`);
          return hasKeyword && !isExcluded;
        });
        
        console.log('돈키호테 필터링 후 결과:', unique.map(p => p.name));
      }

      // 편의점은 항상 도보, 돈키호테는 사용자가 선택한 이동수단 사용
      const travelModeToUse = selectedFacilityType === "store" ? selectedTravelMode : "walking";
      
      console.log('거리 계산 이동수단:', {
        facility: selectedFacilityType,
        selectedMode: selectedTravelMode,
        actualMode: travelModeToUse
      });

      const resultsWithDistance = await googleMapsService.calculateDistances(
        origin,
        unique.map(p => ({ ...p, name: normalizeBrandName(p.name) })),
        travelModeToUse as "walking" | "transit" | "driving"
      );

      console.log('거리 계산 완료:', resultsWithDistance.map(r => ({
        name: r.name,
        distance: r.distance,
        duration: r.duration,
        travelMode: travelModeToUse
      })));

      const sortedResults = resultsWithDistance.sort((a, b) => {
        const da = parseFloat(a.distance.replace(/[^0-9.]/g, ""));
        const db = parseFloat(b.distance.replace(/[^0-9.]/g, ""));
        return da - db;
      }).slice(0, 3);

      setNearbyPlaces(sortedResults);
    } catch {
      setError("시설 검색 실패");
    } finally {
      setIsLoadingPlaces(false);
    }
  };

  const handleNavigate = (place: PlaceResult) => {
    const currentAccommodation = getCurrentAccommodation();
    if (!currentAccommodation && !savedAccommodationAddress) {
      setError("먼저 숙박지 주소를 설정해주세요.");
      return;
    }
    const address = currentAccommodation?.address || savedAccommodationAddress || "";
    
    // 편의점은 항상 도보, 돈키호테는 사용자 선택 이동수단 사용
    const travelModeToUse = selectedFacilityType === "store" ? selectedTravelMode : "walking";
    
    console.log('길찾기 호출:', {
      facility: selectedFacilityType,
      selectedMode: selectedTravelMode,
      actualMode: travelModeToUse,
      place: place.name
    });
    
    googleMapsService.navigateFromAccommodation(address, {
      lat: place.lat,
      lng: place.lng,
      name: place.name
    }, travelModeToUse as "walking" | "transit" | "driving");
  };

  return (
    <div className="h-full flex flex-col max-h-[calc(100vh-200px)]">
      {/* 상단 고정 영역 - 숙소 주소 상태 */}
      <div className="flex-shrink-0 p-3 border-b bg-gray-50">
        <div className="bg-white rounded-lg p-3 shadow-sm">
          {getCurrentAccommodation()?.address || savedAccommodationAddress ? (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-700">숙박지 설정됨</p>
                <p className="text-xs text-gray-600 truncate">
                  {getCurrentAccommodation()?.address || savedAccommodationAddress}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-orange-700">숙박지 주소 미설정</p>
                <p className="text-xs text-gray-600">홈에서 주소를 설정해주세요</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 검색 컨트롤 영역 */}
      <div className="flex-shrink-0 p-3 bg-white border-b">
        <div className="space-y-3">
          {/* 시설 선택 및 검색 버튼 */}
          <div className="flex gap-2">
            <Select value={selectedFacilityType} onValueChange={(v) => {
              setSelectedFacilityType(v);
              setSelectedSubType("all_brands");
              setNearbyPlaces([]);
            }}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="시설 선택" />
              </SelectTrigger>
              <SelectContent>
                {FACILITY_TYPES.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleFacilitySearch} disabled={isLoadingPlaces} size="sm">
              {isLoadingPlaces ? <Loader2 className="animate-spin h-4 w-4" /> : "찾기"}
            </Button>
          </div>

          {/* 서브 브랜드 선택 */}
          {(() => {
            const type = FACILITY_TYPES.find(f => f.value === selectedFacilityType);
            if (!type || !type.subTypes.length) return null;
            return (
              <Select value={selectedSubType} onValueChange={setSelectedSubType}>
                <SelectTrigger>
                  <SelectValue placeholder="모든 브랜드" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_brands">모든 브랜드</SelectItem>
                  {type.subTypes.map(st => (
                    <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          })()}

          {/* 이동 수단 선택 (돈키호테일 때만) */}
          {selectedFacilityType === "store" && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700">이동 수단 (거리/시간 계산 및 길찾기에 적용)</p>
              <div className="flex gap-1">
                {[
                  { value: "walking", label: "도보", icon: "🚶" },
                  { value: "transit", label: "대중교통", icon: "🚇" },
                  { value: "driving", label: "자동차", icon: "🚗" }
                ].map(mode => (
                  <Button
                    key={mode.value}
                    variant={selectedTravelMode === mode.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedTravelMode(mode.value);
                      // 이동수단 변경시 기존 결과 초기화
                      setNearbyPlaces([]);
                    }}
                    className="text-xs h-7 px-2"
                  >
                    {mode.icon} {mode.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                현재 선택: {selectedTravelMode === 'walking' ? '🚶 도보' : selectedTravelMode === 'transit' ? '🚇 대중교통' : '🚗 자동차'}
              </p>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="h-3 w-3 text-red-500" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* 검색 결과 영역 - 스크롤 가능 */}
      <div className="flex-1 overflow-y-auto">
        {nearbyPlaces.length > 0 ? (
          <div className="p-3">
            <h4 className="font-medium text-sm mb-3 text-gray-800">
              가까운 {FACILITY_TYPES.find(f => f.value === selectedFacilityType)?.label} TOP {nearbyPlaces.length}
            </h4>
            <div className="space-y-2">
              {nearbyPlaces.map((place, i) => (
                <div key={i} className="border rounded-lg p-3 bg-white shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{place.name}</p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{place.address}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{place.distance}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{place.duration}</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleNavigate(place)} 
                      className="ml-2 h-8 px-3 text-xs"
                    >
                      <Navigation className="w-3 h-3 mr-1" /> 길찾기
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            {isLoadingPlaces ? (
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
                <p className="text-sm text-gray-500">검색 중...</p>
              </div>
            ) : (
              <div className="text-center">
                <Navigation className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-500">
                  {getCurrentAccommodation()?.address || savedAccommodationAddress 
                    ? "검색 버튼을 눌러 주변 시설을 찾아보세요"
                    : "숙박지 주소를 먼저 설정해주세요"
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}