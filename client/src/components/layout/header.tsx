import { useState } from "react";
import { useLocation } from "wouter";
import { useAppContext } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/use-auth";
import { CountrySelector } from "@/components/country-selector";
import { View } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Share2, 
  UserCircle, 
  LogOut, 
  LogIn,
  ChevronDown,
  User
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Header() {
  const [location, navigate] = useLocation();
  const { currentView, setCurrentView, generateShareUrl } = useAppContext();
  const { user, logoutMutation } = useAuth();
  const isSharedList = location.startsWith("/shared");
  const isAuthPage = location === "/auth" || location.startsWith("/reset-password");
  
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
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
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
  
  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-2 py-2 md:px-4 md:py-3 flex flex-col md:flex-row md:items-center justify-between">
        {/* Top row: Logo and action buttons */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center space-x-1 md:space-x-2">
            {(currentView === View.LISTS || isSharedList) && (
              <Button 
                variant="ghost" 
                size="sm"
                className="md:hidden text-neutral hover:text-primary p-1"
                onClick={handleBackClick}
              >
                <ArrowLeft size={18} />
              </Button>
            )}
            <h1 
              className={`text-xl md:text-2xl font-heading font-bold text-primary ${(currentView === View.LISTS || isSharedList) ? "ml-0" : "ml-1"} cursor-pointer`}
              onClick={() => navigate("/")}
            >
              <span className="md:inline">Ready</span><span className="inline font-bold">Bag</span>
            </h1>
          </div>
          
          <div className="flex items-center ml-4">
            {!isAuthPage && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-700 border-gray-200 px-3 py-2 mr-3 flex items-center rounded-md transition-colors"
                  onClick={handleShareClick}
                  title="공유하기"
                >
                  <Share2 size={18} className="text-gray-500" />
                  <span className="hidden md:inline ml-2 text-sm font-medium">공유</span>
                </Button>
                
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-white hover:bg-gray-50 border-gray-200 px-3 py-2 flex items-center rounded-md transition-colors"
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-gray-100 text-gray-700">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="hidden md:inline ml-2 text-sm font-medium text-gray-700">내 계정</span>
                        <ChevronDown className="h-4 w-4 ml-1 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="flex items-center justify-start p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                          {user.nickname && (
                            <p className="font-medium">{user.nickname}</p>
                          )}
                          <p className="text-sm text-gray-500 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-gray-700 cursor-pointer"
                        onClick={handleLogoutClick}
                      >
                        <LogOut className="mr-2 h-4 w-4 text-gray-500" />
                        <span>로그아웃</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-white hover:bg-gray-50 hover:text-gray-700 border-gray-200 px-3 py-2 flex items-center rounded-md transition-colors"
                    onClick={handleLoginClick}
                    title="로그인"
                  >
                    <LogIn size={18} className="text-gray-500" />
                    <span className="hidden md:inline ml-2 text-sm font-medium text-gray-700">로그인</span>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Bottom row: Country selector */}
        {!isSharedList && !isAuthPage && (
          <div className="mt-1 md:mt-0">
            <CountrySelector />
          </div>
        )}
      </div>
    </header>
  );
}
