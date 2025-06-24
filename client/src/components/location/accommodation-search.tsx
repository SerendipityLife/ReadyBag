import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Search, Loader2, Building, Home, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/AppContext";
import { googleMapsService } from "@/lib/google-maps";

interface Hotel {
  placeId: string;
  name: string;
  address: string;
  rating?: number;
  types: string[];
}

export function AccommodationSearch() {
  const { accommodationAddress, setAccommodationAddress } = useAppContext();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [accommodationType, setAccommodationType] = useState<"hotel" | "airbnb">("hotel");
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [isSearchingHotels, setIsSearchingHotels] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const searchHotels = async (address: string) => {
    if (!address.trim()) return;

    setIsSearchingHotels(true);
    try {
      const hotels = await googleMapsService.searchNearbyHotels(address);
      console.log('Found hotels:', hotels);
      
      if (hotels.length === 0) {
        toast({
          title: "검색 결과가 없습니다",
          description: "해당 지역에서 호텔을 찾을 수 없습니다. 다른 지역을 시도해보세요.",
        });
      }
      
      const hotelList: Hotel[] = hotels.map(hotel => ({
        placeId: hotel.placeId || '',
        name: hotel.name || '',
        address: hotel.address || '',
        rating: hotel.rating,
        types: hotel.types || []
      })).filter(hotel => hotel.name && hotel.placeId);

      setHotels(hotelList);
    } catch (error) {
      console.error("Hotel search error:", error);
      toast({
        variant: "destructive",
        title: "호텔 검색 실패",
        description: "호텔 검색 중 오류가 발생했습니다. 다시 시도해주세요.",
      });
      setHotels([]);
    } finally {
      setIsSearchingHotels(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        variant: "destructive",
        title: "검색어를 입력해주세요",
        description: "숙박지 주소나 이름을 입력해주세요.",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      if (accommodationType === "hotel") {
        // 호텔 검색
        await searchHotels(searchQuery);
        setIsLoading(false);
      } else {
        // 에어비앤비 - 기존 주소 검색 방식
        const location = await googleMapsService.geocodeAddress(searchQuery);
        if (location) {
          setAccommodationAddress(location.address);
          setIsOpen(false);
          setSearchQuery("");
          setHotels([]);
          
          toast({
            title: "숙박지가 설정되었습니다",
            description: location.address,
          });
        } else {
          throw new Error("주소를 찾을 수 없습니다");
        }
      }
    } catch (error) {
      console.error("Accommodation search error:", error);
      toast({
        variant: "destructive",
        title: "주소 검색 실패",
        description: "주소를 찾을 수 없습니다. 다시 시도해주세요.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleHotelSelect = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    // 호텔명을 주소로 설정
    setAccommodationAddress(hotel.name);
    setIsOpen(false);
    setSearchQuery("");
    setHotels([]);
    
    toast({
      title: "호텔이 선택되었습니다",
      description: hotel.name,
    });
  };

  const resetForm = () => {
    setSearchQuery("");
    setHotels([]);
    setSelectedHotel(null);
    setIsLoading(false);
    setIsSearchingHotels(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        resetForm();
      }
    }}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs border-sand-brown-200 text-sand-brown-700 hover:bg-sand-brown-50"
        >
          <Plus className="h-3 w-3 mr-1" />
          숙박지 설정
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sand-brown-800">
            <MapPin className="h-5 w-5" />
            숙박지 검색
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 숙박 유형 선택 */}
          <div className="space-y-3">
            <Label>숙박 유형</Label>
            <RadioGroup 
              value={accommodationType} 
              onValueChange={(value: "hotel" | "airbnb") => {
                setAccommodationType(value);
                setHotels([]);
                setSelectedHotel(null);
              }}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hotel" id="hotel" />
                <Label htmlFor="hotel" className="flex items-center gap-2 cursor-pointer">
                  <Building className="h-4 w-4" />
                  호텔
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="airbnb" id="airbnb" />
                <Label htmlFor="airbnb" className="flex items-center gap-2 cursor-pointer">
                  <Home className="h-4 w-4" />
                  에어비앤비/기타
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* 검색 입력 */}
          <div className="space-y-2">
            <Label htmlFor="accommodation-search">
              {accommodationType === "hotel" ? "지역 또는 주소" : "정확한 주소"}
            </Label>
            <div className="flex gap-2">
              <Input
                ref={searchInputRef}
                id="accommodation-search"
                placeholder={
                  accommodationType === "hotel" 
                    ? "예: 도쿄역, 시부야, 신주쿠 근처" 
                    : "예: 도쿄도 시부야구 시부야 1-1-1"
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                className="flex-1"
              />
              <Button 
                onClick={handleSearch} 
                disabled={isLoading}
                className="bg-sand-brown-600 hover:bg-sand-brown-700 text-white"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              {accommodationType === "hotel" 
                ? "지역을 입력하면 근처 호텔 목록을 보여드립니다" 
                : "정확한 주소를 입력해주세요"}
            </p>
          </div>

          {/* 호텔 검색 결과 */}
          {accommodationType === "hotel" && (
            <div className="space-y-3">
              {isSearchingHotels && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-sand-brown-600" />
                  <span className="ml-2 text-sand-brown-600">호텔 검색 중...</span>
                </div>
              )}
              
              {hotels.length > 0 && (
                <div className="space-y-2">
                  <Label>검색된 호텔 ({hotels.length}개)</Label>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {hotels.map((hotel) => (
                      <Card 
                        key={hotel.placeId} 
                        className="cursor-pointer hover:bg-sand-brown-50 transition-colors"
                        onClick={() => handleHotelSelect(hotel)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-sand-brown-800">{hotel.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{hotel.address}</p>
                              {hotel.rating && (
                                <div className="flex items-center mt-1">
                                  <span className="text-xs text-yellow-600">★ {hotel.rating}</span>
                                </div>
                              )}
                            </div>
                            <Building className="h-4 w-4 text-sand-brown-500" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              {hotels.length === 0 && searchQuery && !isLoading && !isSearchingHotels && (
                <p className="text-sm text-gray-500 text-center py-4">
                  해당 지역에서 호텔을 찾을 수 없습니다
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}