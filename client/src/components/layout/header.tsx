import { useState } from "react";
import { useLocation } from "wouter";
import { useAppContext } from "../../contexts/AppContext.tsx";
import { useAuth } from "../../hooks/use-auth.tsx";
import { CountrySelector } from "../country-selector.tsx";
import { FilterModal } from "../filter/filter-modal-simplified.tsx";
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
  Info,
  Calendar,
  MapPin,
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
import { AccommodationSearch } from "../location/accommodation-search.tsx";

export function Header() {
  const [location, navigate] = useLocation();
  const { currentView, setCurrentView, generateShareUrl, travelStartDate, setTravelStartDate, travelEndDate, setTravelEndDate } = useAppContext();
  const { user, logoutMutation } = useAuth();
  const isSharedList = location.startsWith("/shared");
  const isAuthPage = location === "/auth" || location.startsWith("/reset-password");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

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

  const handleInfoClick = () => {
    setCurrentView(View.INFO);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.email) return "U";

    if (user.nickname) {
      return user.nickname.charAt(0).toUpperCase();
    }

    return user.email.charAt(0).toUpperCase();
  };

  return (
    <header className="w-full bg-white/90 backdrop-blur-sm border-b border-gray-200/80 sticky top-0 z-50">
      <div className="w-full px-2 sm:px-3 py-2">
        <div className="flex items-center justify-between gap-2">

          {/* Left section - Navigation */}
          <div className="flex items-center gap-1">
            {(currentView !== View.EXPLORE || isSharedList) && (
              <button 
                className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
                onClick={handleBackClick}
                title="뒤로가기"
              >
                <ArrowLeft size={18} className="text-gray-600" />
              </button>
            )}
          </div>

          {/* Center section - Main controls */}
          {!isSharedList && !isAuthPage && currentView === View.EXPLORE && (
            <div className="flex items-center gap-1 flex-1 justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-2">
                    <Calendar className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-80">
                  <div className="p-2">
                    <TravelDateSelector
                      startDate={travelStartDate}
                      endDate={travelEndDate}
                      onDatesChange={(start, end) => {
                        setTravelStartDate(start);
                        setTravelEndDate(end);
                        window.dispatchEvent(new Event('localStorageChange'));
                      }}
                      mode="browse"
                    />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-2">
                    <MapPin className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-80">
                  <div className="p-2">
                    <AccommodationSearch />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-2">
                    <Globe className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  <div className="p-2">
                    <CountrySelector />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Right section - Action buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {!isAuthPage && (
              <>
                <button 
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
                  onClick={() => setIsFilterModalOpen(true)}
                  title="필터"
                >
                  <SlidersHorizontal size={16} className="text-gray-600" />
                </button>

                <button 
                  className={cn(
                    "p-1.5 rounded-lg transition-colors touch-manipulation",
                    currentView === View.INFO 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-gray-100 text-gray-600"
                  )}
                  onClick={handleInfoClick}
                  title="정보"
                >
                  <Info size={16} />
                </button>
              </>
            )}

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-1.5 h-auto">
                  {user ? (
                    <div className="flex items-center gap-1">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getUserInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown size={12} className="text-gray-500" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <UserCircle size={20} className="text-gray-600" />
                      <ChevronDown size={12} className="text-gray-500" />
                    </div>
                  )}
                </Button>
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
        </div>
      </div>

      <FilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} />
    </header>
  );
}