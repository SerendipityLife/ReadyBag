import { useAppContext } from "../contexts/AppContext.tsx";
import { View } from "../lib/constants.ts";
import { Button } from "./ui/button.tsx";
import { 
  X, 
  Mail, 
  Star, 
  ShieldCheck, 
  FileText, 
  ChevronRight 
} from "lucide-react";
import { cn } from "../lib/utils.ts";

export function InfoPanel() {
  const { currentView, setCurrentView } = useAppContext();
  
  const isOpen = currentView === View.INFO;
  
  const handleClose = () => {
    setCurrentView(View.EXPLORE);
  };
  
  return (
    <div 
      className={cn(
        "fixed inset-0 bg-gradient-to-br from-blue-50 to-blue-100 z-50 transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="h-screen overflow-y-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-6 mx-auto max-w-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">About ReadyBag</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              onClick={handleClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <p className="text-gray-700 mb-4 leading-relaxed">
            ReadyBag은 여행자들이 방문 국가에서의 쇼핑을 미리 계획할 수 있도록 도와주는 앱입니다. 
            해당 국가에서 인기있는 상품들을 쉽게 탐색하고 관리하세요.
          </p>
          
          <h3 className="text-lg font-semibold mb-3 mt-6 text-gray-800">사용 방법</h3>
          <ul className="list-disc pl-5 text-gray-700 space-y-2 mb-6 leading-relaxed">
            <li>여행 날짜를 설정하세요.</li>
            <li>숙박지 주소를 등록하여 주변 시설을 찾아보세요.</li>
            <li>상품 카드 하단의 버튼을 눌러 상품을 분류하세요.</li>
            <li>하트 버튼(❤️): 관심 있는 상품으로 저장</li>
            <li>고민중 버튼(?): 고민중인 상품으로 분류</li>
            <li>건너뛰기 버튼(❌): 건너뛰기 (저장하지 않음)</li>
            <li>분류한 상품 목록은 '장바구니'에서 확인하고 관리할 수 있습니다.</li>
            <li>구매 완료한 상품은 '쇼핑기록'에서 관리됩니다.</li>
            <li>카테고리와 가격 범위로 상품을 필터링할 수 있습니다.</li>
            <li>장바구니에서 숙박지 주변의 편의점, 마트, 백화점을 검색할 수 있습니다.</li>
          </ul>
          
          <hr className="my-6 border-gray-200" />
          
          <div className="flex flex-col space-y-3">
            <Button
              variant="ghost"
              className="text-left justify-start py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center h-auto text-gray-700"
            >
              <Mail className="mr-3 text-gray-600 w-5 h-5" />
              <span>문의하기</span>
              <ChevronRight className="ml-auto text-gray-400 w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              className="text-left justify-start py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center h-auto text-gray-700"
            >
              <Star className="mr-3 text-gray-600 w-5 h-5" />
              <span>앱 평가하기</span>
              <ChevronRight className="ml-auto text-gray-400 w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              className="text-left justify-start py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center h-auto text-gray-700"
            >
              <ShieldCheck className="mr-3 text-gray-600 w-5 h-5" />
              <span>개인정보 처리방침</span>
              <ChevronRight className="ml-auto text-gray-400 w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              className="text-left justify-start py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center h-auto text-gray-700"
            >
              <FileText className="mr-3 text-gray-600 w-5 h-5" />
              <span>이용약관</span>
              <ChevronRight className="ml-auto text-gray-400 w-4 h-4" />
            </Button>
          </div>
          
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>ReadyBag v1.0.0</p>
            <p className="mt-1">© 2025 ReadyBag. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}