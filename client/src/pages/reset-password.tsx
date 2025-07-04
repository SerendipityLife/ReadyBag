import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../hooks/use-auth.tsx";
import { ResetPasswordInput } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../components/ui/button.tsx";
import { Input } from "../components/ui/input.tsx";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form.tsx";
import { Loader2, Lock } from "lucide-react";

// 비밀번호 재설정 스키마
const resetPasswordSchema = z.object({
  password: z.string().min(8, "비밀번호는 최소 8자 이상이어야 합니다"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"]
});

// URL 쿼리 파라미터에서 토큰 추출 함수
function useQueryParam(param: string): string | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  return url.searchParams.get(param);
}

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const { resetPasswordMutation } = useAuth();
  const [resetComplete, setResetComplete] = useState(false);
  const token = useQueryParam("token");
  
  // 토큰이 없으면 인증 페이지로 리디렉션
  useEffect(() => {
    if (!token) {
      navigate("/auth");
    }
  }, [token, navigate]);
  
  // 비밀번호 재설정 폼
  const form = useForm<Omit<ResetPasswordInput, "token">>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });
  
  // 제출 처리
  const onSubmit = (data: Omit<ResetPasswordInput, "token">) => {
    if (!token) return;
    
    resetPasswordMutation.mutate(
      { 
        token,
        password: data.password,
        confirmPassword: data.confirmPassword // 확인 비밀번호도 함께 전송
      },
      {
        onSuccess: () => {
          setResetComplete(true);
          // 5초 후 로그인 페이지로 이동
          setTimeout(() => {
            navigate("/auth");
          }, 5000);
        },
      }
    );
  };
  
  if (!token) {
    return null; // useEffect에서 리디렉션 처리
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 md:px-8 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">Ready<span className="font-extrabold">Bag</span></h1>
          <p className="text-sm text-gray-500">비밀번호 재설정</p>
        </div>
        
        {resetComplete ? (
          <div className="bg-green-50 p-6 rounded-lg text-center">
            <h2 className="text-xl font-semibold text-green-800 mb-4">비밀번호 재설정 완료</h2>
            <p className="text-green-700 mb-2">
              비밀번호가 성공적으로 재설정되었습니다.
            </p>
            <p className="text-green-700 mb-6">
              새 비밀번호로 로그인해주세요.
            </p>
            <div className="text-center">
              <Button 
                onClick={() => navigate("/auth")}
                className="px-6"
              >
                로그인 페이지로 이동
              </Button>
              <p className="text-sm text-gray-500 mt-4">5초 후 자동으로 로그인 페이지로 이동합니다.</p>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">새 비밀번호 설정</h2>
              <p className="text-sm text-gray-500">
                새로운 비밀번호를 입력해주세요. 비밀번호는 최소 8자 이상이어야 합니다.
              </p>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>새 비밀번호</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <Input 
                            type="password" 
                            placeholder="최소 8자 이상" 
                            className="pl-10" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>비밀번호 확인</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <Input 
                            type="password" 
                            placeholder="비밀번호 확인" 
                            className="pl-10" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full mt-6" 
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  비밀번호 재설정
                </Button>
              </form>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
}