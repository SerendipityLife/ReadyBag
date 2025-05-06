import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { ResetPasswordInput, ResetPasswordRequestInput } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Mail, Lock, ArrowLeft, CheckCircle } from "lucide-react";

// 비밀번호 재설정 요청 스키마
const resetRequestSchema = z.object({
  email: z.string().email("유효한 이메일 주소를 입력해주세요"),
});

// 비밀번호 재설정 스키마
const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, "비밀번호는 최소 8자 이상이어야 합니다"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"]
});

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const location = useLocation()[0];
  const token = new URLSearchParams(location.split("?")[1]).get("token");
  const { resetPasswordRequestMutation, resetPasswordMutation } = useAuth();
  const [isSuccess, setIsSuccess] = useState(false);

  // 비밀번호 재설정 요청 폼
  const resetRequestForm = useForm<ResetPasswordRequestInput>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: {
      email: "",
    },
  });

  // 비밀번호 재설정 폼
  const resetPasswordForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: token || "",
      password: "",
      confirmPassword: "",
    },
  });

  // 비밀번호 재설정 요청 제출 처리
  const onResetRequestSubmit = (data: ResetPasswordRequestInput) => {
    resetPasswordRequestMutation.mutate(data, {
      onSuccess: () => {
        setIsSuccess(true);
      },
    });
  };

  // 비밀번호 재설정 제출 처리
  const onResetPasswordSubmit = (data: ResetPasswordInput) => {
    resetPasswordMutation.mutate(data, {
      onSuccess: () => {
        setIsSuccess(true);
        // 3초 후 로그인 페이지로 이동
        setTimeout(() => {
          navigate("/auth");
        }, 3000);
      },
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 md:p-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="p-0 mr-2"
            onClick={() => navigate("/auth")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-primary">비밀번호 재설정</h1>
        </div>

        {/* 토큰이 없으면 재설정 요청 폼, 있으면 비밀번호 재설정 폼 표시 */}
        {!token ? (
          isSuccess ? (
            <div className="flex flex-col items-center text-center py-6">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">이메일 발송 완료</h2>
              <p className="text-gray-600 mb-6">
                비밀번호 재설정 링크가 이메일로 전송되었습니다. 메일함을 확인해주세요.
              </p>
              <Button onClick={() => navigate("/auth")}>
                로그인 페이지로 돌아가기
              </Button>
            </div>
          ) : (
            <Form {...resetRequestForm}>
              <form 
                onSubmit={resetRequestForm.handleSubmit(onResetRequestSubmit)} 
                className="space-y-4"
              >
                <p className="text-sm text-gray-600 mb-4">
                  가입 시 사용한 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
                </p>
                
                <FormField
                  control={resetRequestForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이메일</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <Input 
                            placeholder="your@email.com" 
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
                  disabled={resetPasswordRequestMutation.isPending}
                >
                  {resetPasswordRequestMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  재설정 링크 받기
                </Button>
              </form>
            </Form>
          )
        ) : (
          isSuccess ? (
            <div className="flex flex-col items-center text-center py-6">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">비밀번호 변경 완료</h2>
              <p className="text-gray-600 mb-6">
                비밀번호가 성공적으로 변경되었습니다. 잠시 후 로그인 페이지로 이동합니다.
              </p>
              <Button onClick={() => navigate("/auth")}>
                로그인 페이지로 이동
              </Button>
            </div>
          ) : (
            <Form {...resetPasswordForm}>
              <form 
                onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)} 
                className="space-y-4"
              >
                <p className="text-sm text-gray-600 mb-4">
                  새로운 비밀번호를 입력해주세요.
                </p>

                <FormField
                  control={resetPasswordForm.control}
                  name="token"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input type="hidden" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={resetPasswordForm.control}
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
                  control={resetPasswordForm.control}
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
                  비밀번호 변경하기
                </Button>
              </form>
            </Form>
          )
        )}
      </div>
    </div>
  );
}