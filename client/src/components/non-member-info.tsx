import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { Link } from "wouter";

export function NonMemberInfo() {
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex flex-col">
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