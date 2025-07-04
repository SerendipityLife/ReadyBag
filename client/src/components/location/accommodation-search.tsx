import React, { useState } from 'react';
import { Button } from '../ui/button';
import { MapPin } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';

export function AccommodationSearch() {
  const { 
    accommodationLocation, 
    setAccommodationLocation,
    selectedTravelDateId,
    setAccommodationForTravelDate,
    getCurrentAccommodation
  } = useAppContext();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleAccommodationSelect = (location: any) => {
    if (selectedTravelDateId) {
      setAccommodationForTravelDate(selectedTravelDateId, location);
    } else {
      setAccommodationLocation(location);
    }
    setIsSearchOpen(false);
  };

  const currentAccommodation = getCurrentAccommodation();

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsSearchOpen(!isSearchOpen)}
        className="h-8 px-2 text-xs"
      >
        <MapPin className="h-3 w-3 mr-1" />
        {currentAccommodation ? '숙박지 설정됨' : '숙박지 검색'}
      </Button>

      {isSearchOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg p-4 z-50 min-w-[200px]">
          <p className="text-sm text-gray-600 mb-2">
            Google Maps를 이용한 숙박지 검색 기능
          </p>
          <Button 
            size="sm" 
            onClick={() => setIsSearchOpen(false)}
            className="w-full"
          >
            닫기
          </Button>
        </div>
      )}
    </div>
  );
}

export default AccommodationSearch;