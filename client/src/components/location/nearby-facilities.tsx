import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Navigation, Loader2, AlertTriangle } from "lucide-react";
import { googleMapsService, type PlaceResult } from "@/lib/google-maps";
import { useAppContext } from "@/contexts/AppContext";

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
  const { accommodationLocation } = useAppContext();
  const [selectedFacilityType, setSelectedFacilityType] = useState("convenience_store");
  const [selectedSubType, setSelectedSubType] = useState("all_brands");
  const [selectedTravelMode, setSelectedTravelMode] = useState<'walking' | 'driving' | 'transit'>('transit');
  const [nearbyPlaces, setNearbyPlaces] = useState<PlaceResult[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      const resultsWithDistance = await googleMapsService.calculateDistances(
        origin,
        unique.map(p => ({ ...p, name: normalizeBrandName(p.name) })),
        selectedFacilityType === "store" ? selectedTravelMode : "walking"
      );

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
        <div className="grid grid-cols-2 gap-2">
          <Select value={selectedFacilityType} onValueChange={setSelectedFacilityType}>
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

          <Select value={selectedSubType} onValueChange={setSelectedSubType}>
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
          <Select value={selectedTravelMode} onValueChange={(v) => setSelectedTravelMode(v as any)}>
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
