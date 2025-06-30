// 전체 import 및 const 정의는 동일하므로 생략 없이 포함
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Navigation, Loader2, Home } from "lucide-react";
import { googleMapsService, type PlaceResult, type HotelLocation } from "@/lib/google-maps";
import { useAppContext } from "@/contexts/AppContext";

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
  },
  {
    value: "pharmacy",
    label: "드럭스토어",
    keywords: ["drugstore", "pharmacy", "matsumoto", "마츠모토키요시", "ドラッグストア"],
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

export function LocationSearch() {
  const { accommodationLocation, setAccommodationLocation } = useAppContext();
  const [locationAddress, setLocationAddress] = useState("");
  const [selectedFacilityType, setSelectedFacilityType] = useState("convenience_store");
  const [selectedSubType, setSelectedSubType] = useState("all_brands");
  const [currentLocation, setCurrentLocation] = useState<HotelLocation | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accommodationLocation) {
      setLocationAddress(accommodationLocation.address);
      setCurrentLocation(accommodationLocation);
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
        setAccommodationLocation({
          name: location.name,
          address: locationAddress,
          lat: location.lat,
          lng: location.lng
        });
        setNearbyPlaces([]);
      } else {
        setError("주소를 찾을 수 없습니다.");
      }
    } catch {
      setError("주소 검색 중 오류가 발생했습니다.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleFacilitySearch = async () => {
    if (!accommodationLocation) {
      setError("먼저 숙박지 주소를 설정해주세요.");
      return;
    }

    setIsLoadingPlaces(true);
    setError(null);
    try {
      const origin = { lat: accommodationLocation.lat, lng: accommodationLocation.lng };
      const facilityType = FACILITY_TYPES.find(f => f.value === selectedFacilityType);
      if (!facilityType) return;

      let keywords: string[] = [];
      let radius = 300;

      if (selectedSubType !== "all_brands") {
        const sub = facilityType.subTypes.find(s => s.value === selectedSubType);
        if (sub) {
          keywords = sub.keywords;
          radius = 5000; // 👈 브랜드 지정 시 더 넓은 반경으로
        }
      } else {
        keywords = facilityType.subTypes.length
          ? facilityType.subTypes.flatMap(st => st.keywords)
          : facilityType.keywords;

        radius = selectedFacilityType === "store" ? 20000 : 300;
      }

      let allResults: PlaceResult[] = [];
      for (const keyword of keywords) {
        const results = await googleMapsService.findNearbyPlaces({ ...origin }, selectedFacilityType, keyword, radius);
        allResults = [...allResults, ...results];
      }

      const seen = new Set();
      let unique = allResults.filter(p => {
        if (seen.has(p.placeId)) return false;
        seen.add(p.placeId);
        return true;
      });

      // 추가 필터: 브랜드 지정 시 이름 기반 필터링까지 적용
      if (selectedSubType !== "all_brands") {
        const sub = facilityType.subTypes.find(s => s.value === selectedSubType);
        const subKeywords = sub ? sub.keywords.map(k => k.toLowerCase()) : [];
        unique = unique.filter(p => {
          const name = p.name.toLowerCase();
          return subKeywords.some(k =>
            name.includes(k) ||
            name.replace(/[-\s]/g, '').includes(k.replace(/[-\s]/g, '')) ||
            name.includes(k.replace('7-eleven', '7eleven'))
          );
        });
      }

      if (selectedFacilityType === "store") {
        const donkiKeywords = ["don quijote", "ドン・キホーテ", "donki", "돈키호테"];
        unique = unique.filter(p =>
          donkiKeywords.some(k => p.name.toLowerCase().includes(k))
        );
      }

      const resultsWithDistance = await googleMapsService.calculateDistances(origin, unique.map(p => ({
        ...p,
        name: normalizeBrandName(p.name)
      })));

      setNearbyPlaces(resultsWithDistance.sort((a, b) => {
        const da = parseFloat(a.distance.replace(/[^\d.]/g, ""));
        const db = parseFloat(b.distance.replace(/[^\d.]/g, ""));
        return da - db;
      }).slice(0, 3));
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
    googleMapsService.navigateFromAccommodation(accommodationLocation.address, {
      lat: place.lat,
      lng: place.lng,
      name: place.name
    });
  };

  return (
    <div className="space-y-6">
      {/* 숙소 주소 입력 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" /> 숙박지 주소
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="영문 숙소 주소 입력"
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLocationSearch()}
            />
            <Button onClick={handleLocationSearch} disabled={isSearching}>
              {isSearching ? <Loader2 className="animate-spin" /> : "검색"}
            </Button>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </CardContent>
      </Card>

      {/* 주변 시설 검색 카드 */}
      {currentLocation && (
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

            {/* 결과 출력 */}
            {nearbyPlaces.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-medium">TOP {nearbyPlaces.length} 결과</h4>
                {nearbyPlaces.map((place, i) => (
                  <div key={i} className="flex justify-between border p-3 rounded">
                    <div>
                      <p className="font-semibold">{place.name}</p>
                      <p className="text-sm text-gray-600">{place.address}</p>
                      <p className="text-xs text-gray-500">
                        {place.distance} / {place.duration}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => handleNavigate(place)}>
                      <Navigation className="w-4 h-4 mr-1" /> 길찾기
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              !isLoadingPlaces && (
                <p className="text-sm text-gray-500 text-center">검색 결과가 없습니다.</p>
              )
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
