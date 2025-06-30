import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
      { value: "seven_eleven", label: "세븐일레븐", keywords: ["7-Eleven", "セブンイレブン", "세븐일레븐"] },
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
  const [selectedTravelMode, setSelectedTravelMode] = useState<'walking' | 'driving' | 'transit'>('transit');
  const [nearbyPlaces, setNearbyPlaces] = useState<PlaceResult[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAccommodationAddress, setSavedAccommodationAddress] = useState<string | null>(null);

  // 선택된 여행 날짜의 상품들에서 숙박지 주소 가져오기
  const { data: userProducts } = useQuery<UserProduct[]>({
    queryKey: ['user-products', selectedCountry.id, selectedTravelDateId || 'no-date'],
    queryFn: async () => {
      if (!user || !selectedCountry?.id) {
        // 비회원 사용자의 경우 로컬 스토리지에서 가져오기
        const storageKey = `userProducts_${selectedCountry.id}`;
        const storedData = localStorage.getItem(storageKey);
        if (!storedData) return [];

        const localData = JSON.parse(storedData);
        if (!Array.isArray(localData)) return [];

        // 선택된 여행 날짜에 해당하는 상품들만 필터링
        return selectedTravelDateId 
          ? localData.filter((item: any) => item.travelDateId === selectedTravelDateId)
          : localData;
      }

      // 로그인한 사용자는 API 호출
      const url = `${API_ROUTES.USER_PRODUCTS}?countryId=${selectedCountry.id}${selectedTravelDateId ? `&travelDateId=${selectedTravelDateId}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) return [];
      return await response.json();
    },
    enabled: !!selectedCountry?.id,
  });

  // AppContext에서 설정한 숙박지 주소 사용
  useEffect(() => {
    if (accommodationLocation && accommodationLocation.address) {
      setSavedAccommodationAddress(accommodationLocation.address);
      console.log('컨텍스트에서 가져온 숙박지 주소:', accommodationLocation.address);
    } else {
      // 컨텍스트에 없으면 상품에서 추출 시도 (기존 로직 유지)
      if (userProducts && userProducts.length > 0) {
        const productWithAccommodation = userProducts.find(
          (product: any) => product.accommodationAddress && product.accommodationAddress.trim() !== ""
        );

        if (productWithAccommodation) {
          setSavedAccommodationAddress(productWithAccommodation.accommodationAddress);
          console.log('상품에서 추출한 숙박지 주소:', productWithAccommodation.accommodationAddress);
        } else {
          setSavedAccommodationAddress(null);
          console.log('현재 여행 날짜에 저장된 숙박지 주소가 없습니다');
        }
      } else {
        setSavedAccommodationAddress(null);
      }
    }
  }, [accommodationLocation, userProducts, selectedTravelDateId]);

  const handleFacilitySearch = () => {
    handleFacilitySearchWithOverrideTravelMode();
  };

  const handleFacilitySearchWithOverrideTravelMode = async (overrideMode?: 'walking' | 'driving' | 'transit') => {
    let searchLocation = accommodationLocation;

    // accommodationLocation이 없지만 저장된 주소가 있으면 지오코딩 수행
    if (!accommodationLocation && savedAccommodationAddress) {
      setIsLoadingPlaces(true);
      setError(null);

      try {
        const geocodedLocation = await googleMapsService.geocodeAddress(savedAccommodationAddress);
        if (geocodedLocation) {
          searchLocation = geocodedLocation;
        } else {
          setError("저장된 숙박지 주소의 위치를 찾을 수 없습니다.");
          setIsLoadingPlaces(false);
          return;
        }
      } catch (error) {
        setError("주소 검색 중 오류가 발생했습니다.");
        setIsLoadingPlaces(false);
        return;
      }
    }

    if (!searchLocation) {
      setError("먼저 숙박지 주소를 설정해주세요.");
      return;
    }

    setIsLoadingPlaces(true);
    setError(null);
    try {
      const origin = { lat: searchLocation.lat, lng: searchLocation.lng };
      const facilityType = FACILITY_TYPES.find(f => f.value === selectedFacilityType);
      if (!facilityType) return;

      let keywords: string[] = [];
      if (selectedFacilityType === "store") {
        keywords = facilityType.keywords;
      } else if (selectedSubType !== "all_brands") {
        const sub = facilityType.subTypes.find(s => s.value === selectedSubType);
        if (sub) keywords = sub.keywords;
      } else {
        keywords = facilityType.subTypes.flatMap(st => st.keywords);
      }

      const radius = selectedFacilityType === "store" ? 10000 : 300;

      let allResults: PlaceResult[] = [];
      for (const keyword of keywords) {
        const results = await googleMapsService.findNearbyPlacesWithRadius(origin, selectedFacilityType, keyword, radius);
        allResults = [...allResults, ...results];
      }

      const seen = new Set();
      let unique = allResults.filter(p => {
        const key = `${p.name}_${p.address}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (selectedFacilityType === "store") {
        const donkiKeywords = ["don quijote", "ドン・キホーテ", "donki", "돈키호테"];
        unique = unique.filter(p =>
          donkiKeywords.some(k => p.name.toLowerCase().includes(k))
        );
      }

      const travelModeToUse = selectedFacilityType === "store"
        ? overrideMode ?? selectedTravelMode
        : "walking";

      console.log('이동수단으로 거리 계산:', travelModeToUse, '장소 수:', unique.length);

      const resultsWithDistance = await googleMapsService.calculateDistances(
        origin,
        unique.map(p => ({ ...p, name: normalizeBrandName(p.name) })),
        travelModeToUse
      );

      console.log('거리 계산 완료, 결과 수:', resultsWithDistance.length);

      const sortedResults = resultsWithDistance.sort((a, b) => {
        const da = parseFloat(a.distance.replace(/[^\d.]/g, ""));
        const db = parseFloat(b.distance.replace(/[^\d.]/g, ""));
        return da - db;
      }).slice(0, 3);

      console.log('최종 결과:', sortedResults.map(r => `${r.name}: ${r.distance} (${r.duration})`));
      setNearbyPlaces(sortedResults);
    } catch {
      setError("시설 검색 중 오류가 발생했습니다.");
    } finally {
      setIsLoadingPlaces(false);
    }
  };

  const handleNavigate = (place: PlaceResult) => {
    if (!accommodationLocation) {
      setError("먼저 숙박지 주소를 설정해주세요.");
      return;
    }
    const travelMode = selectedFacilityType === 'store' ? selectedTravelMode : 'walking';
    googleMapsService.navigateFromAccommodation(accommodationLocation.address, {
      lat: place.lat,
      lng: place.lng,
      name: place.name
    }, travelMode);
  };

  if (!accommodationLocation) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-gray-500">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">숙박지 주소를 먼저 설정해주세요</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4" /> 주변 시설 검색
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 저장된 숙박지 주소 표시 */}
        {savedAccommodationAddress && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <Home className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-900 mb-1">
                  현재 설정된 숙박지
                </div>
                <div className="text-sm text-blue-700 break-words">
                  {savedAccommodationAddress}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 숙박지가 설정되지 않은 경우 안내 */}
        {!savedAccommodationAddress && !accommodationLocation && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-amber-900 mb-1">
                  숙박지 설정 필요
                </div>
                <div className="text-sm text-amber-700">
                  구경하기 탭에서 여행 날짜를 선택하고 상품을 저장할 때 숙박지를 설정해주세요.
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Select value={selectedFacilityType} onValueChange={(v) => {
            setSelectedFacilityType(v);
            setSelectedSubType("all_brands"); // 시설 타입 변경 시 서브타입 초기화
            setNearbyPlaces([]); // 기존 검색 결과 초기화
          }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FACILITY_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSubType} onValueChange={(v) => {
            setSelectedSubType(v);
            setNearbyPlaces([]); // 기존 검색 결과 초기화
          }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_brands">전체</SelectItem>
              {FACILITY_TYPES.find(f => f.value === selectedFacilityType)?.subTypes.map(sub => (
                <SelectItem key={sub.value} value={sub.value}>
                  {sub.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedFacilityType === "store" && (
          <Select value={selectedTravelMode} onValueChange={(v) => {
            const newMode = v as 'walking' | 'driving' | 'transit';
            setSelectedTravelMode(newMode);
            // 이동수단 변경 시 강제로 재검색 (기존 결과 초기화 후 새로 검색)
            setNearbyPlaces([]);
            setIsLoadingPlaces(true);
            setTimeout(() => {
              handleFacilitySearchWithOverrideTravelMode(newMode);
            }, 50);
          }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="walking">도보</SelectItem>
              <SelectItem value="driving">자동차</SelectItem>
              <SelectItem value="transit">대중교통</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Button 
          onClick={handleFacilitySearch}
          disabled={isLoadingPlaces}
          className="w-full"
          size="sm"
        >
          {isLoadingPlaces ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              검색 중...
            </>
          ) : (
            "주변 시설 검색"
          )}
        </Button>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {nearbyPlaces.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">검색 결과 (TOP 3)</h4>
            {nearbyPlaces.map((place, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <h5 className="font-medium text-sm">{place.name}</h5>
                  <Badge variant="secondary" className="text-xs">
                    {place.distance}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{place.address}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{place.duration || "정보 없음"}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleNavigate(place)}
                    className="h-6 px-2 text-xs"
                  >
                    <Navigation className="h-3 w-3 mr-1" />
                    길찾기
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}