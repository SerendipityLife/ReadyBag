import { useAppContext } from "@/contexts/AppContext";
import { View } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { 
  X, 
  Mail, 
  Star, 
  ShieldCheck, 
  FileText, 
  ChevronRight 
} from "lucide-react";
import { cn } from "@/lib/utils";

export function InfoPanel() {
  const { currentView, setCurrentView } = useAppContext();
  
  const isOpen = currentView === View.INFO;
  
  const handleClose = () => {
    setCurrentView(View.EXPLORE);
  };
  
  return (
    <div 
      className={cn(
        "fixed inset-0 bg-white z-50 transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="h-screen overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-heading font-bold">About ReadyBag</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-neutral"
            onClick={handleClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <p className="text-neutral mb-4">
          ReadyBag은 여행자들이 방문 국가에서의 쇼핑을 미리 계획할 수 있도록 도와주는 앱입니다. 
          해당 국가에서 인기있는 상품들을 쉽게 탐색하고 관리하세요.
        </p>
        
        <h3 className="text-lg font-heading font-semibold mb-2 mt-6">사용 방법</h3>
        <ul className="list-disc pl-5 text-neutral space-y-2 mb-6">
          <li>방문할 국가를 선택하세요.</li>
          <li>카드를 좌우로 스와이프하여 상품을 분류하세요.</li>
          <li>오른쪽으로 스와이프: 관심 있는 상품</li>
          <li>왼쪽으로 스와이프: 관심 없는 상품</li>
          <li>위로 스와이프: 나중에 다시 볼 상품</li>
          <li>분류한 상품 목록은 언제든 '내 목록'에서 확인하고 관리할 수 있습니다.</li>
        </ul>
        
        <hr className="my-6 border-gray-200" />
        
        <div className="flex flex-col space-y-4">
          <Button
            variant="ghost"
            className="text-left justify-start py-3 px-4 bg-neutral-light rounded-lg flex items-center h-auto"
          >
            <Mail className="mr-3 text-neutral w-5 h-5" />
            <span>문의하기</span>
            <ChevronRight className="ml-auto text-neutral w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            className="text-left justify-start py-3 px-4 bg-neutral-light rounded-lg flex items-center h-auto"
          >
            <Star className="mr-3 text-neutral w-5 h-5" />
            <span>앱 평가하기</span>
            <ChevronRight className="ml-auto text-neutral w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            className="text-left justify-start py-3 px-4 bg-neutral-light rounded-lg flex items-center h-auto"
          >
            <ShieldCheck className="mr-3 text-neutral w-5 h-5" />
            <span>개인정보 처리방침</span>
            <ChevronRight className="ml-auto text-neutral w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            className="text-left justify-start py-3 px-4 bg-neutral-light rounded-lg flex items-center h-auto"
          >
            <FileText className="mr-3 text-neutral w-5 h-5" />
            <span>이용약관</span>
            <ChevronRight className="ml-auto text-neutral w-4 h-4" />
          </Button>
        </div>
        
        <div className="mt-8 text-center text-sm text-neutral">
          <p>ReadyBag v1.0.0</p>
          <p className="mt-1">© 2023 ReadyBag. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
