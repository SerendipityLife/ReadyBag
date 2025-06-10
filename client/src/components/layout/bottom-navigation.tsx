import { useAppContext } from "@/contexts/AppContext";
import { View, ProductStatus } from "@/lib/constants";
import { Search, List, Info } from "lucide-react";
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
      label: interestedCount > 0 ? `장바구니 (${interestedCount})` : "장바구니",
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
    // 새로운 기능들을 여기에 추가하세요
  ];

  const navItems = [...coreNavItems, ...additionalNavItems];
  const gridCols = navItems.length <= 2 ? 'grid-cols-2' : 
                   navItems.length === 3 ? 'grid-cols-3' : 'grid-cols-4';
  
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-40">
      <div className="container mx-auto px-4">
        <div className={`grid ${gridCols} gap-4 h-16`}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={cn(
                "flex flex-col items-center justify-center h-full rounded-lg transition-colors",
                currentView === item.id 
                  ? "text-primary bg-primary/5" 
                  : "text-neutral hover:bg-gray-50"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
