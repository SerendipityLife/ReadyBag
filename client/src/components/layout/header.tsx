import { useState } from "react";
import { useLocation } from "wouter";
import { useAppContext } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/use-auth";
import { CountrySelector } from "@/components/country-selector";
import { FilterModal } from "@/components/filter/filter-modal-simplified";
import { View } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Share2, 
  UserCircle, 
  LogOut, 
  LogIn,
  ChevronDown,
  User,
  SlidersHorizontal,
  Info
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function Header() {
  const [location, navigate] = useLocation();
  const { currentView, setCurrentView, generateShareUrl } = useAppContext();
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

  const handleShareClick = () => {
    // 로그인한 경우에만 공유 가능
    if (user) {
      generateShareUrl();
    } else {
      // 비회원인 경우 로그인 안내
      if (window.confirm('회원가입 후 목록을 저장하고 공유할 수 있습니다. 로그인 페이지로 이동하시겠습니까?')) {
        navigate('/auth');
      }
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-md border-b border-blue-200 w-full">
      <div className="flex items-center justify-between min-h-[40px] sm:min-h-[44px] md:min-h-[48px] px-2 sm:px-3 md:px-4 py-1 w-full max-w-full overflow-hidden">
        {/* Logo & Country Selector */}
        <div className="flex items-center flex-shrink-0">
          {/* 공유된 목록에만 뒤로가기 버튼 표시 (내 목록 탭에서는 제거) */}
          {isSharedList && (
            <button 
              className="p-1.5 sm:p-2 mr-1 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors md:hidden"
              onClick={handleBackClick}
            >
              <ArrowLeft size={16} className="sm:w-4 sm:h-4" />
            </button>
          )}


          {/* Country selector */}
          {!isSharedList && !isAuthPage && (
            <div className="flex-shrink-0">
              <CountrySelector />
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 max-w-fit overflow-hidden">
          {!isAuthPage && (
            <>
              <button 
                className="p-1 sm:p-1.5 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
                onClick={() => setIsFilterModalOpen(true)}
                title="필터"
              >
                <SlidersHorizontal 
                  size={16} 
                  className="text-gray-600 sm:w-[18px] sm:h-[18px]" 
                />
              </button>

              <button 
                className={cn(
                  "p-1 sm:p-1.5 rounded-lg transition-colors touch-manipulation",
                  currentView === View.INFO 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-gray-100 text-gray-600"
                )}
                onClick={handleInfoClick}
                title="정보"
              >
                <Info 
                  size={16} 
                  className="sm:w-[18px] sm:h-[18px]" 
                />
              </button>

              <button 
                className="p-1 sm:p-1.5 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
                onClick={handleShareClick}
                title="공유하기"
              >
                <Share2 
                  size={16} 
                  className="text-gray-600 sm:w-[18px] sm:h-[18px]" 
                />
              </button>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 sm:p-1.5 rounded-full hover:bg-gray-100 touch-manipulation">
                      <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                        <AvatarFallback className="text-xs bg-gray-100 text-gray-700">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center p-2">
                      <div className="flex flex-col">
                        {user.nickname && (
                          <p className="font-medium">{user.nickname}</p>
                        )}
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-sm cursor-pointer"
                      onClick={handleLogoutClick}
                    >
                      <LogOut className="mr-2 h-3.5 w-3.5 text-gray-500" />
                      <span>로그아웃</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button 
                  className="p-1 sm:p-1.5 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
                  onClick={handleLoginClick}
                  title="로그인"
                >
                  <LogIn 
                    size={16} 
                    className="text-gray-600 sm:w-[18px] sm:h-[18px]" 
                  />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 필터 모달 */}
      <FilterModal 
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        scope={currentView}
      />
    </header>
  );
}