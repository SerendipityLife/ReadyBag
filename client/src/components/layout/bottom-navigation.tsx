import { useAppContext } from "@/contexts/AppContext";
import { View, ProductStatus } from "@/lib/constants";
import { Search, List, Info, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

export function BottomNavigation() {
  const { currentView, setCurrentView, selectedCountry } = useAppContext();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 비회원일 경우 로컬스토리지에서 상품을 가져옴
  const getLocalUserProducts = () => {
    try {
      if (!selectedCountry?.id) return [];

      const storageKey = `userProducts_${selectedCountry.id}`;
      const localData = localStorage.getItem(storageKey);

      if (localData) {
        try {
          const parsedData = JSON.parse(localData);

          // 배열인지 확인하고 반환
          if (Array.isArray(parsedData)) {
            return parsedData;
          } else {
            console.error("로컬 스토리지 데이터가 배열이 아님:", parsedData);
            return [];
          }
        } catch (parseError) {
          console.error("로컬 스토리지 데이터 파싱 오류:", parseError);
          // 잘못된 데이터인 경우 정리
          localStorage.removeItem(storageKey);
          return [];
        }
      }
    } catch (error) {
      console.error("로컬 저장소 읽기 오류:", error);
    }
    return [];
  };

  // 로그인한 경우: API 호출로 사용자 상품 목록 가져오기
  const { data: userProducts = [], refetch } = useQuery<any[]>({
    queryKey: [`/api/user-products?countryId=${selectedCountry?.id}`, selectedCountry?.id],
    queryFn: async () => {
      // 비회원일 경우 로컬 저장소에서 가져옴
      if (!user) {
        return getLocalUserProducts();
      }

      // countryId가 있을 때만 API 요청을 보냄
      if (!selectedCountry?.id) return [];

      const response = await fetch(`/api/user-products?countryId=${selectedCountry.id}`);
      if (!response.ok) return [];
      const data = await response.json();
      console.log("[BottomNavigation] User products data:", data);
      return data;
    },
    enabled: !!selectedCountry?.id, // 국가 ID가 있을 때 조회 (비회원도 로컬스토리지 사용)
    refetchInterval: user ? 5000 : false, // 로그인한 경우 5초마다 업데이트로 단축
    refetchOnWindowFocus: false, // 윈도우 포커스 시 업데이트 비활성화
    staleTime: 0 // 즉시 stale 상태로 만들어 실시간 업데이트
  });

  // 로컬 스토리지 변경 감지 (비회원용)
  useEffect(() => {
    if (!user) {
      const handleStorageChange = () => {
        console.log("[BottomNavigation] 로컬 스토리지 변경 감지됨");
        refetch();
      };

      // 일반 storage 이벤트 (다른 탭에서 변경 시)
      window.addEventListener('storage', handleStorageChange);

      // 커스텀 이벤트 (같은 탭 내에서 변경 시)
      window.addEventListener('localStorageChange', handleStorageChange);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('localStorageChange', handleStorageChange);
      };
    }
  }, [user, refetch]);

  // 구독 대신 특정 쿼리키 변경 감지 - 무한 루프 방지
  useEffect(() => {
    if (selectedCountry?.id) {
      refetch();
    }
  }, [selectedCountry?.id, refetch]);

  // "관심" 상태의 상품만 필터링하여 개수 세기
  const interestedCount = userProducts?.filter(
    (product: any) => product.status === ProductStatus.INTERESTED
  )?.length || 0;

  console.log("[BottomNavigation] Interested count:", interestedCount);

  // 기본 네비게이션 아이템들
  const coreNavItems = [
    {
      id: View.EXPLORE,
      label: "구경하기",
      icon: Search,
    },
    {
      id: View.LISTS,
      label: "장바구니",
      icon: List,
    }
  ];

  // ============================================================================
  // 새로운 메뉴 아이템 추가 가이드
  // ============================================================================
  // 1. shared/schema.ts의 View enum에 새로운 뷰 추가
  // 2. 아래 additionalNavItems 배열에 새 항목 추가
  // 3. pages/home.tsx에 해당 뷰의 렌더링 조건 추가
  // 4. 필요시 새로운 페이지 컴포넌트 생성
  // 
  // 예시:
  // - 즐겨찾기: Heart 아이콘, 사용자가 즐겨찾는 상품 목록
  // - 최근 본: Clock 아이콘, 최근 조회한 상품 이력
  // - 알림: Bell 아이콘, 가격 변동 및 새 상품 알림
  // - 설정: Settings 아이콘, 앱 설정 및 환경설정
  // ============================================================================

  const additionalNavItems: any[] = [
    {
      id: View.HISTORY,
      label: "쇼핑기록",
      icon: Clock,
    }
  ];

  const navItems = [...coreNavItems, ...additionalNavItems];
  const gridCols = navItems.length <= 2 ? 'grid-cols-2' : 
                   navItems.length === 3 ? 'grid-cols-3' : 'grid-cols-4';

  const tabs = navItems.map(item => ({
    value: item.id,
    label: item.label,
    icon: item.icon
  }));

  const { currentView: currentViewLocal, setCurrentView: setCurrentViewLocal } = useAppContext();

  const handleTabClick = (tabValue: View) => {
      setCurrentViewLocal(tabValue);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-pb">
      <div className="flex justify-around items-center h-14 sm:h-16 px-2 sm:px-4">
        {tabs.map((tab) => {
          const isActive = currentViewLocal === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => handleTabClick(tab.value)}
              className={cn(
                "flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg transition-colors touch-manipulation",
                "min-w-0 flex-1 max-w-[80px] sm:max-w-none", // Limit max width on mobile
                isActive 
                  ? "text-primary bg-primary/5" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <tab.icon className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 sm:mb-1" />
              <span className="text-[10px] sm:text-xs font-medium truncate leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
```

```typescript
import { useAppContext } from "@/contexts/AppContext";
import { View, ProductStatus } from "@/lib/constants";
import { Search, List, Info, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

export function BottomNavigation() {
  const { currentView, setCurrentView, selectedCountry } = useAppContext();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 비회원일 경우 로컬스토리지에서 상품을 가져옴
  const getLocalUserProducts = () => {
    try {
      if (!selectedCountry?.id) return [];

      const storageKey = `userProducts_${selectedCountry.id}`;
      const localData = localStorage.getItem(storageKey);

      if (localData) {
        try {
          const parsedData = JSON.parse(localData);

          // 배열인지 확인하고 반환
          if (Array.isArray(parsedData)) {
            return parsedData;
          } else {
            console.error("로컬 스토리지 데이터가 배열이 아님:", parsedData);
            return [];
          }
        } catch (parseError) {
          console.error("로컬 스토리지 데이터 파싱 오류:", parseError);
          // 잘못된 데이터인 경우 정리
          localStorage.removeItem(storageKey);
          return [];
        }
      }
    } catch (error) {
      console.error("로컬 저장소 읽기 오류:", error);
    }
    return [];
  };

  // 로그인한 경우: API 호출로 사용자 상품 목록 가져오기
  const { data: userProducts = [], refetch } = useQuery<any[]>({
    queryKey: [`/api/user-products?countryId=${selectedCountry?.id}`, selectedCountry?.id],
    queryFn: async () => {
      // 비회원일 경우 로컬 저장소에서 가져옴
      if (!user) {
        return getLocalUserProducts();
      }

      // countryId가 있을 때만 API 요청을 보냄
      if (!selectedCountry?.id) return [];

      const response = await fetch(`/api/user-products?countryId=${selectedCountry.id}`);
      if (!response.ok) return [];
      const data = await response.json();
      console.log("[BottomNavigation] User products data:", data);
      return data;
    },
    enabled: !!selectedCountry?.id, // 국가 ID가 있을 때 조회 (비회원도 로컬스토리지 사용)
    refetchInterval: user ? 5000 : false, // 로그인한 경우 5초마다 업데이트로 단축
    refetchOnWindowFocus: false, // 윈도우 포커스 시 업데이트 비활성화
    staleTime: 0 // 즉시 stale 상태로 만들어 실시간 업데이트
  });

  // 로컬 스토리지 변경 감지 (비회원용)
  useEffect(() => {
    if (!user) {
      const handleStorageChange = () => {
        console.log("[BottomNavigation] 로컬 스토리지 변경 감지됨");
        refetch();
      };

      // 일반 storage 이벤트 (다른 탭에서 변경 시)
      window.addEventListener('storage', handleStorageChange);

      // 커스텀 이벤트 (같은 탭 내에서 변경 시)
      window.addEventListener('localStorageChange', handleStorageChange);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('localStorageChange', handleStorageChange);
      };
    }
  }, [user, refetch]);

  // 구독 대신 특정 쿼리키 변경 감지 - 무한 루프 방지
  useEffect(() => {
    if (selectedCountry?.id) {
      refetch();
    }
  }, [selectedCountry?.id, refetch]);

  // "관심" 상태의 상품만 필터링하여 개수 세기
  const interestedCount = userProducts?.filter(
    (product: any) => product.status === ProductStatus.INTERESTED
  )?.length || 0;

  console.log("[BottomNavigation] Interested count:", interestedCount);

  // 기본 네비게이션 아이템들
  const coreNavItems = [
    {
      id: View.EXPLORE,
      label: "구경하기",
      icon: Search,
    },
    {
      id: View.LISTS,
      label: "장바구니",
      icon: List,
    }
  ];

  // ============================================================================
  // 새로운 메뉴 아이템 추가 가이드
  // ============================================================================
  // 1. shared/schema.ts의 View enum에 새로운 뷰 추가
  // 2. 아래 additionalNavItems 배열에 새 항목 추가
  // 3. pages/home.tsx에 해당 뷰의 렌더링 조건 추가
  // 4. 필요시 새로운 페이지 컴포넌트 생성
  // 
  // 예시:
  // - 즐겨찾기: Heart 아이콘, 사용자가 즐겨찾는 상품 목록
  // - 최근 본: Clock 아이콘, 최근 조회한 상품 이력
  // - 알림: Bell 아이콘, 가격 변동 및 새 상품 알림
  // - 설정: Settings 아이콘, 앱 설정 및 환경설정
  // ============================================================================

  const additionalNavItems: any[] = [
    {
      id: View.HISTORY,
      label: "쇼핑기록",
      icon: Clock,
    }
  ];

  const navItems = [...coreNavItems, ...additionalNavItems];
  const gridCols = navItems.length <= 2 ? 'grid-cols-2' : 
                   navItems.length === 3 ? 'grid-cols-3' : 'grid-cols-4';

  const tabs = navItems.map(item => ({
    value: item.id,
    label: item.label,
    icon: item.icon
  }));

  const { currentView: currentViewLocal, setCurrentView: setCurrentViewLocal } = useAppContext();

  const handleTabClick = (tabValue: View) => {
      setCurrentViewLocal(tabValue);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 sm:px-4 py-2 z-40 safe-area-pb w-full bottom-nav">
      <div className="flex justify-around items-center w-full max-w-full mx-auto">
        {tabs.map((tab) => {
          const isActive = currentViewLocal === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => handleTabClick(tab.value)}
              className={cn(
                "flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg transition-colors touch-manipulation",
                "min-w-0 flex-1 max-w-[80px] sm:max-w-none", // Limit max width on mobile
                isActive 
                  ? "text-primary bg-primary/5" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <tab.icon className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 sm:mb-1" />
              <span className="text-[10px] sm:text-xs font-medium truncate leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}