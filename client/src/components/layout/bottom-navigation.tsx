import { useAppContext } from "@/contexts/AppContext";
import { View, ProductStatus } from "@/lib/constants";
import { Search, List, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

export function BottomNavigation() {
  const { currentView, setCurrentView, selectedCountry } = useAppContext();
  const { user } = useAuth();
  
  // 관심 상품 개수를 조회하는 쿼리
  const { data: userProducts = [] } = useQuery<any[]>({
    queryKey: ['/api/user-products', selectedCountry?.id, user?.id],
    queryFn: async () => {
      // countryId가 있을 때만 API 요청을 보냄
      if (!selectedCountry?.id) return [];
      
      const response = await fetch(`/api/user-products?countryId=${selectedCountry.id}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data;
    },
    enabled: !!user && !!selectedCountry?.id // 로그인된 사용자와 국가 ID가 있을 때만 조회
  });
  
  // "관심" 상태의 상품만 필터링하여 개수 세기
  const interestedCount = userProducts?.filter(
    (product: any) => product.status === ProductStatus.INTERESTED
  )?.length || 0;
  
  const navItems = [
    {
      id: View.EXPLORE,
      label: "둘러보기",
      icon: Search,
    },
    {
      id: View.LISTS,
      label: interestedCount > 0 ? `내 목록 (${interestedCount})` : "내 목록",
      icon: List,
    },
    {
      id: View.INFO,
      label: "정보",
      icon: Info,
    },
  ];
  
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full",
                currentView === item.id ? "text-primary" : "text-neutral"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
