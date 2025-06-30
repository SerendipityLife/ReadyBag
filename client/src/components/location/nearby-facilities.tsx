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

const normalizeBrandName = (name) => {
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
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [error, setError] = useState(null);
  const [savedAccommodationAddress, setSavedAccommodationAddress] = useState(null);

  const { data: userProducts } = useQuery({
    queryKey: ['user-products', selectedCountry?.id, selectedTravelDateId || 'no-date'],
    queryFn: async () => {
      if (!user || !selectedCountry?.id) {
        const storageKey = `userProducts_${selectedCountry.id}`;
        const storedData = localStorage.getItem(storageKey);
        if (!storedData) return [];
        const localData = JSON.parse(storedData);
        return selectedTravelDateId 
          ? localData.filter((item) => item.travelDateId === selectedTravelDateId)
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
      const found = userProducts.find(p => p.accommodationAddress?.trim());
      setSavedAccommodationAddress(found?.accommodationAddress || null);
    } else {
      setSavedAccommodationAddress(null);
    }
  }, [accommodationLocation, userProducts, selectedTravelDateId]);

  const handleFacilitySearchWithOverrideTravelMode = async (overrideMode) => {
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
      setError("숙박지 주소 필요");
      return;
    }

    setIsLoadingPlaces(true);
    setError(null);
    try {
      const origin = { lat: searchLocation.lat, lng: searchLocation.lng };
      const facilityType = FACILITY_TYPES.find(f => f.value === selectedFacilityType);
      if (!facilityType) return;

      let keywords = [];
      let radius = 300;

      if (selectedSubType !== "all_brands") {
        const sub = facilityType.subTypes.find(s => s.value === selectedSubType);
        if (sub) {
          keywords = sub.keywords;
          radius = 5000; // 확장된 반경
        }
      } else {
        keywords = facilityType.subTypes.length
          ? facilityType.subTypes.flatMap(st => st.keywords)
          : facilityType.keywords;
        radius = selectedFacilityType === "store" ? 10000 : 300;
      }

      let allResults = [];
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
          return subKeywords.some(k => name.includes(k) || name.replace(/[-\s]/g, '').includes(k.replace(/[-\s]/g, '')));
        });
      }

      const travelModeToUse = selectedFacilityType === "store" ? overrideMode ?? selectedTravelMode : "walking";

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

  // 기존 컴포넌트의 렌더링 및 UI 부분은 동일하게 유지하되, 위 함수가 핵심 개선 로직입니다.
  // 필요 시 전체 JSX 렌더링 부분도 추가로 제공해 드릴 수 있습니다.
  return null; // 예시 목적이므로 렌더링 생략
}
