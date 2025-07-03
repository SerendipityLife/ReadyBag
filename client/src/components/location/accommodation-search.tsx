
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
  const [accommodationInput, setAccommodationInput] = useState('');

  const handleAccommodationSelect = () => {
    if (!accommodationInput.trim()) return;
    
    const location = {
      name: accommodationInput,
      address: accommodationInput,
      lat: 0, // 실제 구현시 Google Places API로 좌표 획득
      lng: 0
    };
    
    if (selectedTravelDateId) {
      setAccommodationForTravelDate(selectedTravelDateId, location);
    } else {
      setAccommodationLocation(location);
    }
    
    setAccommodationInput('');
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
        <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg p-4 z-50 min-w-[300px]">
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              숙박지 이름이나 주소를 입력해주세요.
            </p>
            
            <input
              type="text"
              placeholder="숙박지 이름 또는 주소"
              value={accommodationInput}
              onChange={(e) => setAccommodationInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
            />
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                size="sm" 
                onClick={() => setIsSearchOpen(false)}
                className="flex-1"
              >
                닫기
              </Button>
              <Button 
                size="sm" 
                onClick={handleAccommodationSelect}
                disabled={!accommodationInput.trim()}
                className="flex-1 bg-sky-500 hover:bg-sky-600"
              >
                저장
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccommodationSearch;
