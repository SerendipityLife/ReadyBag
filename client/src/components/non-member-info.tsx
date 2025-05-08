import { Button } from "@/components/ui/button";
import { Info, LogIn } from "lucide-react";
import { Link } from "wouter";

export function NonMemberInfo() {
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex flex-col">
        <div className="flex items-start mb-2">
          <Info className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
          <h3 className="font-medium text-base">비회원 이용 안내</h3>
        </div>
        
        <p className="text-sm text-neutral mb-3">
          회원 가입 없이도 상품을 둘러보고 관심 상품을 저장할 수 있습니다.
          하지만 기기를 변경하거나 브라우저 데이터를 삭제하면 저장된 정보가 사라질 수 있습니다.
        </p>
        
        <div className="flex justify-end">
          <Link href="/login">
            <Button size="sm" variant="outline" className="text-xs flex items-center">
              <LogIn className="w-3.5 h-3.5 mr-1" />
              로그인하기
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}