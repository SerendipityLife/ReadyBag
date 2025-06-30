
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
    keywords: ["돈키호테", "don quijote", "ドン・キホーテ", "donki"],
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
  const { accommodationLocation, selectedCountry, selectedTravelDateId } = useAppContext();
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
    if (accommodationLocation && accommodationLocation.address) {
      setSavedAccommodationAddress(accommodationLocation.address);
    } else if (userProducts?.length) {
      const found = userProducts.find((p: any) => p.accommodationAddress?.trim());
      setSavedAccommodationAddress(found?.accommodationAddress || null);
    } else {
      setSavedAccommodationAddress(null);
    }
  }, [accommodationLocation, userProducts, selectedTravelDateId]);

  const handleFacilitySearch = async () => {
    let searchLocation = accommodationLocation;
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
        radius = selectedFacilityType === "store" ? 10000 : 300;
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

      const travelModeToUse = selectedFacilityType === "store" ? selectedTravelMode : "walking";

      const resultsWithDistance = await googleMapsService.calculateDistances(
        origin,
        unique.map(p => ({ ...p, name: normalizeBrandName(p.name) })),
        travelModeToUse
      );

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
    if (!accommodationLocation && !savedAccommodationAddress) {
      setError("먼저 숙박지 주소를 설정해주세요.");
      return;
    }
    const address = accommodationLocation?.address || savedAccommodationAddress || "";
    googleMapsService.navigateFromAccommodation(address, {
      lat: place.lat,
      lng: place.lng,
      name: place.name
    });
  };

  return (
    <div className="space-y-6 p-4">
      {/* 숙소 주소 상태 표시 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" /> 숙박지 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          {accommodationLocation?.address || savedAccommodationAddress ? (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-1 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-700">
                  설정된 숙박지 주소
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {accommodationLocation?.address || savedAccommodationAddress}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-1 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-orange-700">
                  숙박지 주소가 설정되지 않았습니다
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  홈 화면에서 숙박지 주소를 먼저 설정해주세요.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 주변 시설 검색 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" /> 주변 시설 검색
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <Button onClick={handleFacilitySearch} disabled={isLoadingPlaces}>
              {isLoadingPlaces ? <Loader2 className="animate-spin" /> : "찾기"}
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
              <p className="text-sm font-medium">이동 수단</p>
              <div className="flex gap-2">
                {[
                  { value: "walking", label: "도보", icon: "🚶" },
                  { value: "transit", label: "대중교통", icon: "🚇" },
                  { value: "driving", label: "자동차", icon: "🚗" }
                ].map(mode => (
                  <Button
                    key={mode.value}
                    variant={selectedTravelMode === mode.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTravelMode(mode.value)}
                    className="text-xs"
                  >
                    {mode.icon} {mode.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* 검색 결과 */}
          {nearbyPlaces.length > 0 ? (
            <div className="space-y-3">
              <h4 className="font-medium">가까운 {FACILITY_TYPES.find(f => f.value === selectedFacilityType)?.label} TOP {nearbyPlaces.length}</h4>
              {nearbyPlaces.map((place, i) => (
                <div key={i} className="flex justify-between items-start border p-3 rounded-lg bg-white">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{place.name}</p>
                    <p className="text-sm text-gray-600 mt-1">{place.address}</p>
                    <div className="flex items-center gap-4 mt-2">
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
                  <Button size="sm" onClick={() => handleNavigate(place)} className="ml-3">
                    <Navigation className="w-4 h-4 mr-1" /> 길찾기
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            !isLoadingPlaces && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">
                  {accommodationLocation?.address || savedAccommodationAddress 
                    ? "검색 버튼을 눌러 주변 시설을 찾아보세요"
                    : "숙박지 주소를 먼저 설정해주세요"
                  }
                </p>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
