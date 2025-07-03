import React, { useState } from 'react';
import { useLocation } from "wouter";
import { useAppContext } from "../../contexts/AppContext.tsx";
import { useAuth } from "../../hooks/use-auth.tsx";
import { CountrySelector } from "../country-selector.tsx";
import { View } from "../../lib/constants.ts";
import { Button } from "../ui/button.tsx";
import { 
  ArrowLeft, 
  UserCircle, 
  LogOut, 
  LogIn,
  ChevronDown,
  User,
  SlidersHorizontal,
  Calendar,
  MapPin,
  Star,
  Filter,
  Info,
  Globe
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu.tsx";
import { Avatar, AvatarFallback } from "../ui/avatar.tsx";
import { cn } from "../../lib/utils.ts";
import { TravelDateSelector } from "../travel-date-selector.tsx";
import { FilterModal } from "../filter/filter-modal-simplified.tsx";

export function Header() {
  const [location, navigate] = useLocation();
  const { 
    currentView, 
    setCurrentView, 
    travelStartDate, 
    travelEndDate,
    selectedTravelDateId,
    savedTravelDates,
    setShowTravelDateSelector,
    getCurrentAccommodation,
    selectedCountry,
    travelDates,
    setSelectedTravelDateId,
    setAccommodationForTravelDate,
    accommodationsByTravelDate,
    setAccommodationLocation
  } = useAppContext();
  const { user, logoutMutation } = useAuth();
  const isSharedList = location.startsWith("/shared");
  const isAuthPage = location === "/auth" || location.startsWith("/reset-password");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [showAccommodationSearch, setShowAccommodationSearch] = useState(false);
  const [accommodationAddress, setAccommodationAddress] = useState('');

  const handleBackClick = () => {
    if (isSharedList) {
      navigate("/");
    } else {
      setCurrentView(View.EXPLORE);
    }
  };

  const handleLoginClick = () => {
    navigate("/auth");
  };

  const handleLogoutClick = () => {
    // 로그아웃 진행 전에 로컬 스토리지 초기화를 위한 이벤트 발생
    const resetEvent = new CustomEvent('localStorageReset', {
      detail: { type: 'logout' }
    });
    window.dispatchEvent(resetEvent);

    // 로그아웃 API 호출
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        // 모든 상품 관련 상태 초기화 후 인증 페이지로 이동
        navigate("/auth");
      }
    });
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.email) return "U";

    if (user.nickname) {
      return user.nickname.charAt(0).toUpperCase();
    }

    return user.email.charAt(0).toUpperCase();
  };

  // Get current travel date display for desktop
  const getTravelDateDesktop = () => {
    if (selectedTravelDateId) {
      const savedDate = savedTravelDates.find(d => d.id === selectedTravelDateId);
      if (savedDate) {
        // Extract dates from savedDate.id format: "travel_YYYY-MM-DD_YYYY-MM-DD"
        const dateMatch = savedDate.id.match(/travel_(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          const startDate = new Date(dateMatch[1]);
          const endDate = new Date(dateMatch[2]);
          return `${startDate.getFullYear()}.${(startDate.getMonth() + 1).toString().padStart(2, '0')}.${startDate.getDate().toString().padStart(2, '0')} - ${endDate.getFullYear()}.${(endDate.getMonth() + 1).toString().padStart(2, '0')}.${endDate.getDate().toString().padStart(2, '0')}`;
        }
      }
    }
    return "여행 일정";
  };

  // Get current travel date display for mobile
  const getTravelDateMobile = () => {
    if (selectedTravelDateId) {
      const savedDate = savedTravelDates.find(d => d.id === selectedTravelDateId);
      if (savedDate) {
        // Extract dates from savedDate.id format: "travel_YYYY-MM-DD_YYYY-MM-DD"
        const dateMatch = savedDate.id.match(/travel_(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          const startDate = new Date(dateMatch[1]);
          const endDate = new Date(dateMatch[2]);
          return `${(startDate.getMonth() + 1).toString().padStart(2, '0')}.${startDate.getDate().toString().padStart(2, '0')} - ${(endDate.getMonth() + 1).toString().padStart(2, '0')}.${endDate.getDate().toString().padStart(2, '0')}`;
        }
      }
    }
    return "일정";
  };

  const getTravelDateDisplay = () => {
    if (!selectedTravelDateId) return '날짜';

    const travelDate = travelDates.find(td => td.id === selectedTravelDateId);
    if (!travelDate) return '날짜';

    const startDate = new Date(travelDate.startDate);
    const endDate = new Date(travelDate.endDate);

    // 같은 달인지 확인
    if (startDate.getMonth() === endDate.getMonth()) {
      return `${startDate.getMonth() + 1}/${startDate.getDate()}-${endDate.getDate()}`;
    } else {
      return `${startDate.getMonth() + 1}/${startDate.getDate()}-${endDate.getMonth() + 1}/${endDate.getDate()}`;
    }
  };

  const getTravelDateMobile2 = () => {
    if (!selectedTravelDateId) return '날짜 선택';

    const travelDate = travelDates.find(td => td.id === selectedTravelDateId);
    if (!travelDate) return '날짜 선택';

    const startDate = new Date(travelDate.startDate);
    const endDate = new Date(travelDate.endDate);

    if (startDate.getMonth() === endDate.getMonth()) {
      return `${startDate.getMonth() + 1}/${startDate.getDate()}-${endDate.getDate()}`;
    } else {
      return `${startDate.getMonth() + 1}/${startDate.getDate()}-${endDate.getMonth() + 1}/${endDate.getDate()}`;
    }
  };

  // Get current accommodation display
  const getCurrentAccommodationDisplay = () => {
    const currentAccommodation = getCurrentAccommodation();
    if (currentAccommodation?.name) {
      return currentAccommodation.name.length > 6 
        ? `${currentAccommodation.name.substring(0, 6)}...` 
        : currentAccommodation.name;
    }
    return '숙박지';
  };

  const handleAccommodationSave = () => {
    if (!accommodationAddress.trim()) return;

    const accommodationData = {
      name: accommodationAddress,
      address: accommodationAddress,
      lat: 0, // 실제 구현시 Google Places API로 좌표 획득
      lng: 0
    };

    if (selectedTravelDateId) {
      setAccommodationForTravelDate(selectedTravelDateId, accommodationData);
    } else {
      setAccommodationLocation(accommodationData);
    }

    setAccommodationAddress('');
    setShowAccommodationSearch(false);
  };

  return (
    <>
      <header className={cn("w-full bg-white/90 backdrop-blur-sm border-b border-gray-200/80 sticky top-0 z-50",
      "bg-sky-400 text-white p-3 sm:p-4")}>
        <div className="w-full px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-4">

            {/* Left section */}
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              {/* Back button */}
              {(currentView !== View.EXPLORE || isSharedList) && (
                <button 
                  className="flex-shrink-0 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
                  onClick={handleBackClick}
                  title="뒤로가기"
                >
                  <ArrowLeft size={18} className="text-gray-600 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>

            {/* Center section - Country/Date/Location/Login (only on explore view) */}
            {!isSharedList && !isAuthPage && currentView === View.EXPLORE && (
              <div className="flex items-center justify-center gap-1 sm:gap-2 flex-1">
                {/* Country Selector */}
                {/* <CountrySelector /> */}
                 <button 
                  className="flex items-center gap-1 p-1.5 sm:p-2 rounded-lg hover:bg-sky-500 transition-colors touch-manipulation"
                  onClick={() => {
                    const event = new CustomEvent('openCountrySelector');
                    window.dispatchEvent(event);
                  }}
                  title={`국가: ${selectedCountry?.name || '일본'}`}
                >
                  <Globe size={16} className="text-white sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm font-medium hidden sm:inline">
                    {selectedCountry?.name || '일본'}
                  </span>
                  <span className="text-xs text-gray-100 sm:hidden">
                    일본
                  </span>
                </button>
                
                {/* Travel Date Selector */}
                {/* <button 
                  className="flex items-center gap-1 p-1.5 sm:p-2 rounded-lg bg-white hover:bg-gray-100 transition-colors touch-manipulation border border-gray-200"
                  onClick={() => setShowTravelDateSelector(true)}
                  title={`여행 날짜: ${getTravelDateDesktop()}`}
                >
                  <CalendarIcon size={16} className="text-gray-600 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs text-gray-600 hidden sm:inline">
                    {getTravelDateDesktop()}
                  </span>
                  <span className="text-xs text-gray-600 sm:hidden">
                    {getTravelDateMobile()}
                  </span>
                </button> */}

                <button 
                  className="flex items-center gap-1 p-1.5 sm:p-2 rounded-lg hover:bg-sky-500 transition-colors touch-manipulation"
                  onClick={() => {
                    const event = new CustomEvent('openTravelDateSelector');
                    window.dispatchEvent(event);
                  }}
                  title={`여행 날짜: ${getTravelDateDisplay()}`}
                >
                  <Calendar size={16} className="text-white sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm font-medium hidden sm:inline">
                    {getTravelDateDisplay()}
                  </span>
                  <span className="text-xs text-gray-100 sm:hidden">
                    날짜
                  </span>
                </button>

                {/* Accommodation Search */}
                {/* <button 
                  className="flex items-center gap-1 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
                  onClick={() => setShowAccommodationSearch(true)}
                  title={`숙박지: ${getCurrentAccommodationDisplay()}`}
                >
                  <MapPin size={16} className="text-gray-600 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs text-gray-600 hidden sm:inline">
                    {getCurrentAccommodationDisplay()}
                  </span>
                </button> */}

                <button 
                  className="flex items-center gap-1 p-1.5 sm:p-2 rounded-lg hover:bg-sky-500 transition-colors touch-manipulation"
                  onClick={() => setShowAccommodationSearch(true)}
                  title={`숙박지: ${getCurrentAccommodationDisplay()}`}
                >
                  <MapPin size={16} className="text-white sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm font-medium hidden sm:inline">
                    {getCurrentAccommodationDisplay()}
                  </span>
                  <span className="text-xs text-gray-100 sm:hidden">
                    숙박지
                  </span>
                </button>

                {/* User menu - moved to center */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation">
                      {user ? (
                        <>
                          <Avatar className="h-4 w-4 sm:h-5 sm:w-5">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getUserInitials()}
                            </AvatarFallback>
                          </Avatar>
                          <ChevronDown size={12} className="text-gray-500" />
                        </>
                      ) : (
                        <>
                          <UserCircle size={16} className="text-gray-600 sm:w-[18px] sm:h-[18px]" />
                          <ChevronDown size={12} className="text-gray-500" />
                        </>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {user ? (
                      <>
                        <DropdownMenuItem disabled className="flex items-center cursor-default">
                          <User className="mr-2 h-4 w-4" />
                          <span className="text-sm text-gray-600">{user.email}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogoutClick} className="flex items-center text-red-600">
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>로그아웃</span>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem onClick={handleLoginClick} className="flex items-center">
                        <LogIn className="mr-2 h-4 w-4" />
                        <span>로그인</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Spacer for non-explore views */}
            {(isSharedList || isAuthPage || currentView !== View.EXPLORE) && (
              <div className="flex-1"></div>
            )}

            {/* Right section - Empty for now */}
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <button 
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-sky-500 transition-colors touch-manipulation" 
                  onClick={() => setIsFilterModalOpen(true)}
                  title="필터"
                >
                  <Filter size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>

                <button 
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-sky-500 transition-colors touch-manipulation" 
                  onClick={() => {
                    const event = new CustomEvent('openInfoPanel');
                    window.dispatchEvent(event);
                  }}
                  title="정보"
                >
                  <Info size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>

                <button 
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-sky-500 transition-colors touch-manipulation" 
                  onClick={() => {
                    const event = new CustomEvent('openAuthModal');
                    window.dispatchEvent(event);
                  }}
                  title="로그인"
                >
                  <User size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <FilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} />
      </header>

      {/* Travel Date Selector Modal */}
      <TravelDateSelector />

      {/* Accommodation Search Modal */}
      {showAccommodationSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">숙박지 검색</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAccommodationSearch(false)}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                숙박지 이름이나 주소를 입력해주세요.
              </p>

              <div className="space-y-2">
                <label className="text-sm font-medium">숙박지 정보</label>
                <input 
                  type="text" 
                  placeholder="숙박지 이름 또는 주소를 입력하세요"
                  value={accommodationAddress}
                  onChange={(e) => setAccommodationAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAccommodationSearch(false)}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleAccommodationSave}
                disabled={!accommodationAddress.trim()}
                className="flex-1 bg-sky-500 hover:bg-sky-600"
              >
                저장
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;