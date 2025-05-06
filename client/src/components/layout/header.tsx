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
          
          <div className="flex items-center space-x-2">
            {!isAuthPage && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-neutral hover:text-primary p-1"
                  onClick={handleShareClick}
                >
                  <Share2 size={18} />
                </Button>
                
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-1">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <ChevronDown className="h-4 w-4 ml-1" />
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
                        className="text-red-500 focus:text-red-500 cursor-pointer"
                        onClick={handleLogoutClick}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>로그아웃</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-neutral hover:text-primary p-1"
                    onClick={handleLoginClick}
                  >
                    <LogIn size={18} />
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
