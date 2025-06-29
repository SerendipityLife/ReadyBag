import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LoginUserInput, RegisterUserInput, ResetPasswordRequestInput } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Mail, Lock, UserCircle, ArrowLeft } from "lucide-react";

// 회원가입 스키마
const registerSchema = z.object({
  email: z.string().email("유효한 이메일 주소를 입력해주세요"),
  password: z.string().min(8, "비밀번호는 최소 8자 이상이어야 합니다"),
  confirmPassword: z.string(),
  nickname: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"]
});

// 로그인 스키마
const loginSchema = z.object({
  email: z.string().email("유효한 이메일 주소를 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

// 비밀번호 찾기 스키마
const forgotPasswordSchema = z.object({
  email: z.string().email("유효한 이메일 주소를 입력해주세요"),
});

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation, resetPasswordRequestMutation, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot">("login");
  const [isPasswordResetSent, setIsPasswordResetSent] = useState(false);
  const [saveEmail, setSaveEmail] = useState<boolean>(() => {
    // 로컬 스토리지에서 이메일 저장 설정 가져오기
    return localStorage.getItem("saveEmail") === "true";
  });

  // 페이지 진입 시 로컬 스토리지 초기화 (비회원 데이터 리셋)
  useEffect(() => {
    if (!user) {
      // 사용자가 로그인하지 않은 경우에만 로컬 스토리지 초기화
      try {
        // "userProducts_" 로 시작하는 모든 키 찾기
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('userProducts_')) {
            localStorage.removeItem(key);
            console.log(`인증 페이지 방문 - 로컬 스토리지 항목 자동 삭제: ${key}`);
          }
        });
        
        // 로컬 스토리지 변경 이벤트 트리거
        window.dispatchEvent(new Event('localStorageChange'));
      } catch (error) {
        console.error("로컬 스토리지 초기화 오류:", error);
      }
    }
  }, [user]); // user 의존성 추가 - 로그인 상태가 변경될 때만 실행
  
  // 저장된 이메일 불러오기
  useEffect(() => {
    try {
      // 저장된 이메일 가져오기
      const savedEmail = localStorage.getItem('savedEmail');
      const rememberEmail = localStorage.getItem('rememberEmail') === 'true';
      
      if (savedEmail && rememberEmail) {
        loginForm.setValue('email', savedEmail);
        setSaveEmail(true);
      }
    } catch (error) {
      console.error("저장된 이메일 불러오기 오류:", error);
    }
  }, []); // 컴포넌트 마운트 시 한 번만 실행
  
  // 로그인 폼
  const loginForm = useForm<LoginUserInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // 회원가입 폼
  const registerForm = useForm<RegisterUserInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      nickname: "",
    },
  });
  
  // 로컬 스토리지 초기화 함수 - 비회원 데이터 정리
  const clearLocalStorage = () => {
    try {
      // "userProducts_" 로 시작하는 모든 키 찾기
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('userProducts_')) {
          localStorage.removeItem(key);
          console.log(`로컬 스토리지 항목 삭제: ${key}`);
        }
      });
      
      // 로컬 스토리지 변경 이벤트 트리거
      window.dispatchEvent(new Event('localStorageChange'));
    } catch (error) {
      console.error("로컬 스토리지 초기화 오류:", error);
    }
  };
  
  // 비회원으로 시작하기 처리
  const handleStartAsGuest = () => {
    clearLocalStorage();
    navigate("/");
  };
  
  // 이미 로그인한 사용자는 홈으로 리디렉션
  // 모든 훅이 선언된 후에 실행
  if (user) {
    navigate("/");
    return null;
  }

  // 로그인 제출 처리
  const onLoginSubmit = (data: LoginUserInput) => {
    // 이메일 저장 처리
    if (saveEmail) {
      localStorage.setItem('savedEmail', data.email);
      localStorage.setItem('rememberEmail', 'true');
    } else {
      localStorage.removeItem('savedEmail');
      localStorage.setItem('rememberEmail', 'false');
    }
    
    loginMutation.mutate(data, {
      onSuccess: () => {
        navigate("/");
      },
    });
  };

  // 회원가입 제출 처리
  const onRegisterSubmit = (data: RegisterUserInput) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        navigate("/");
      },
    });
  };
  
  // 비밀번호 찾기 폼
  const forgotPasswordForm = useForm<ResetPasswordRequestInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });
  
  // 비밀번호 찾기 제출 처리
  const onForgotPasswordSubmit = (data: ResetPasswordRequestInput) => {
    resetPasswordRequestMutation.mutate(data, {
      onSuccess: () => {
        setIsPasswordResetSent(true);
      },
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 로그인/회원가입 양식 섹션 */}
      <div className="w-full flex flex-col justify-center px-4 md:px-8 lg:px-12 py-12">
        <div className="mx-auto w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-white p-6 rounded-2xl mb-6 shadow-lg border border-gray-100">
              <img 
                src="/logo-readybag.png" 
                alt="ReadyBag" 
                className="h-32 w-auto"
                onError={(e) => {
                  console.error('Logo image failed to load');
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">ReadyBag</h1>
            <p className="text-base text-gray-600">여행 쇼핑 계획을 더 쉽게</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <Tabs 
              defaultValue="login" 
              value={activeTab} 
              onValueChange={(value) => setActiveTab(value as "login" | "register" | "forgot")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 border-0 h-12">
                <TabsTrigger 
                  value="login"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-700 font-medium text-base h-10"
                >
                  로그인
                </TabsTrigger>
                <TabsTrigger 
                  value="register"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-700 font-medium text-base h-10"
                >
                  회원가입
                </TabsTrigger>
              </TabsList>

            {/* 로그인 탭 */}
            <TabsContent value="login">
              <Form {...loginForm}>
                <form 
                  onSubmit={loginForm.handleSubmit(onLoginSubmit)} 
                  className="space-y-4"
                >
                  <FormField
                    control={loginForm.control}
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
                              autoComplete="email" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>비밀번호</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <Input 
                              type="password" 
                              placeholder="********" 
                              className="pl-10 bg-white/80 border-sand-brown-200 focus:border-sand-brown-400" 
                              autoComplete="current-password"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="rememberEmail"
                        checked={saveEmail}
                        onChange={(e) => setSaveEmail(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor="rememberEmail" className="text-sm text-gray-500 select-none">
                        이메일 저장
                      </label>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full mt-4 bg-sand-brown-600 hover:bg-sand-brown-700 text-white" 
                    disabled={loginMutation.isPending || isLoading}
                  >
                    {loginMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    로그인
                  </Button>
                </form>
              </Form>
              
              <div className="mt-6 text-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-4 text-xs text-muted-foreground">
                      또는
                    </span>
                  </div>
                </div>
                <div>
                  <Button 
                    variant="secondary" 
                    onClick={handleStartAsGuest}
                    className="w-full py-6 font-medium shadow-sm border border-gray-200"
                  >
                    비회원으로 시작하기
                  </Button>
                </div>
                <div className="flex justify-center space-x-2">
                  <Button 
                    variant="link" 
                    onClick={() => setActiveTab("register")}
                    className="text-sm text-sand-brown-600 hover:text-sand-brown-800"
                  >
                    계정이 없으신가요?
                  </Button>
                  <Button 
                    variant="link" 
                    onClick={() => setActiveTab("forgot")}
                    className="text-sm text-sand-brown-600 hover:text-sand-brown-800"
                  >
                    비밀번호를 잊으셨나요?
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {/* 비밀번호 찾기 탭 */}
            <TabsContent value="forgot">
              {isPasswordResetSent ? (
                <div className="text-center py-8">
                  <div className="bg-green-50 border border-green-200 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-medium text-green-800 mb-2">이메일 전송 완료</h3>
                    <p className="text-green-700">비밀번호 재설정 링크가 이메일로 전송되었습니다.</p>
                    <p className="text-green-700 mt-2">이메일을 확인하고 링크를 클릭하여 비밀번호를 재설정하세요.</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("login")}
                    className="mt-4 border-sand-brown-300 text-sand-brown-700 hover:bg-sand-brown-50"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    로그인으로 돌아가기
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2 text-sand-brown-800">비밀번호 재설정</h3>
                    <p className="text-sm text-sand-brown-600">
                      가입 시 사용한 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다.
                    </p>
                  </div>
                  
                  <Form {...forgotPasswordForm}>
                    <form 
                      onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} 
                      className="space-y-4"
                    >
                      <FormField
                        control={forgotPasswordForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>이메일</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                <Input 
                                  placeholder="가입한 이메일 주소" 
                                  className="pl-10 bg-white/80 border-sand-brown-200 focus:border-sand-brown-400" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-between pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setActiveTab("login")}
                          className="border-sand-brown-300 text-sand-brown-700 hover:bg-sand-brown-50"
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          돌아가기
                        </Button>
                        
                        <Button 
                          type="submit" 
                          disabled={resetPasswordRequestMutation.isPending}
                          className="bg-sand-brown-600 hover:bg-sand-brown-700 text-white"
                        >
                          {resetPasswordRequestMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          재설정 링크 보내기
                        </Button>
                      </div>
                    </form>
                  </Form>
                </>
              )}
            </TabsContent>

            {/* 회원가입 탭 */}
            <TabsContent value="register">
              <Form {...registerForm}>
                <form 
                  onSubmit={registerForm.handleSubmit(onRegisterSubmit)} 
                  className="space-y-4"
                >
                  <FormField
                    control={registerForm.control}
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
                              autoComplete="email" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="nickname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>닉네임 (선택)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <UserCircle className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <Input 
                              placeholder="닉네임" 
                              className="pl-10 bg-white/80 border-sand-brown-200 focus:border-sand-brown-400" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>비밀번호</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <Input 
                              type="password" 
                              placeholder="최소 8자 이상" 
                              className="pl-10 bg-white/80 border-sand-brown-200 focus:border-sand-brown-400"
                              autoComplete="new-password"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
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
                              className="pl-10 bg-white/80 border-sand-brown-200 focus:border-sand-brown-400"
                              autoComplete="new-password" 
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
                    className="w-full mt-6 bg-sand-brown-600 hover:bg-sand-brown-700 text-white" 
                    disabled={registerMutation.isPending || isLoading}
                  >
                    {registerMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    회원가입
                  </Button>
                </form>
              </Form>
              
              <div className="mt-6 text-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-4 text-xs text-muted-foreground">
                      또는
                    </span>
                  </div>
                </div>
                <div>
                  <Button 
                    variant="secondary" 
                    onClick={handleStartAsGuest}
                    className="w-full py-6 font-medium shadow-sm border border-gray-200"
                  >
                    비회원으로 시작하기
                  </Button>
                </div>
                <div>
                  <Button 
                    variant="link" 
                    onClick={() => setActiveTab("login")}
                    className="text-sm text-sand-brown-600 hover:text-sand-brown-800"
                  >
                    이미 계정이 있으신가요? 로그인하기
                  </Button>
                </div>
              </div>
            </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* 앱 소개 섹션 */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-sand-brown-100 to-sand-brown-200 flex flex-col justify-center items-center p-8 md:p-12 hidden md:flex">
        <div className="max-w-lg text-center">
          <h2 className="text-3xl font-bold text-sand-brown-800 mb-4">스마트한 여행 쇼핑 플래너</h2>
          <p className="text-sand-brown-700 mb-8 leading-relaxed">ReadyBag과 함께 해외 여행에서 구매할 상품들을<br/>여행 날짜별로 분류하고 관리하세요.</p>
          
          <div className="space-y-4 mt-8">
            <div className="bg-white/90 p-5 rounded-lg shadow-sm border border-sand-brown-200">
              <h3 className="font-semibold text-sand-brown-700 mb-2">날짜별 관리</h3>
              <p className="text-sm text-sand-brown-600">여행 날짜별로 상품을 분류하고 체계적인 쇼핑 계획을 세우세요.</p>
            </div>
            <div className="bg-white/90 p-5 rounded-lg shadow-sm border border-sand-brown-200">
              <h3 className="font-semibold text-sand-brown-700 mb-2">실시간 환율</h3>
              <p className="text-sm text-sand-brown-600">현지 통화와 한국 원화의 실시간 환율을 확인하세요.</p>
            </div>
            <div className="bg-white/90 p-5 rounded-lg shadow-sm border border-sand-brown-200">
              <h3 className="font-semibold text-sand-brown-700 mb-2">위치 기반 쇼핑</h3>
              <p className="text-sm text-sand-brown-600">숙소 위치 기반으로 주변 매장을 찾고 쇼핑하세요.</p>
            </div>
            <div className="bg-white/90 p-5 rounded-lg shadow-sm border border-sand-brown-200">
              <h3 className="font-semibold text-sand-brown-700 mb-2">상품 리뷰</h3>
              <p className="text-sm text-sand-brown-600">구매 상품에 리뷰를 남기고 다른 여행자 후기를 확인하세요.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}