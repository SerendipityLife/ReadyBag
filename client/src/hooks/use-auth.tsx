import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
  QueryClient
} from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "./use-toast";
import { 
  RegisterUserInput, 
  LoginUserInput,
  ResetPasswordRequestInput,
  ResetPasswordInput
} from "@shared/schema";

// 비회원 데이터 초기화 함수
const clearNonMemberData = () => {
  if (typeof window !== 'undefined') {
    // 세션별 접속 여부 확인
    const sessionKey = 'hasVisitedBefore';
    const hasVisited = sessionStorage.getItem(sessionKey);

    if (!hasVisited) {
      // 첫 방문이면 모든 사용자 데이터 관련 localStorage 항목 삭제
      const keysToRemove = [
        'savedTravelDates',
        'selectedTravelDateId',
        'userProducts_japan',
        'userProducts_korea',
        'userProducts_china'
      ];

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log('비회원 데이터가 초기화되었습니다');

      // 세션에 방문 기록 저장 (새로고침이나 탭 변경은 허용하되, 브라우저 종료 후 재접속 시에는 다시 초기화)
      sessionStorage.setItem(sessionKey, 'true');

      // 로컬 스토리지 변경 이벤트 발생
      window.dispatchEvent(new Event('localStorageChange'));
    }
  }
};

// 사용자 타입 정의
export type AuthUser = {
  id: number;
  email: string;
  nickname: string | null;
};

// 인증 컨텍스트 타입 정의
type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<AuthUser, Error, LoginUserInput>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<AuthUser, Error, RegisterUserInput>;
  resetPasswordRequestMutation: UseMutationResult<{ message: string }, Error, ResetPasswordRequestInput>;
  resetPasswordMutation: UseMutationResult<{ message: string }, Error, ResetPasswordInput>;
};

// 인증 컨텍스트 생성
export const AuthContext = createContext<AuthContextType | null>(null);

// queryClient 함수
export function invalidateAuthQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
}

// 인증 Provider 컴포넌트
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  // 현재 사용자 조회
  const { data: user, isLoading, error } = useQuery<AuthUser | null, Error>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/user", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) {
          if (res.status === 401) {
            return null;
          }
          throw new Error("인증 정보를 가져오는데 실패했습니다");
        }
        return await res.json();
      } catch (error) {
        return null;
      }
    },
    retry: false,
  });

  // 비회원일 경우 자동으로 데이터 초기화
  useEffect(() => {
    if (!isLoading && !user) {
      clearNonMemberData();
    }
  }, [user, isLoading]);

  // 로그인 mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginUserInput) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "로그인에 실패했습니다");
      }
      return await res.json();
    },
    onSuccess: () => {
      invalidateAuthQueries(queryClient);
      toast({
        title: "로그인 성공",
        description: "ReadyBag에 오신 것을 환영합니다!",
      });
    },
    onError: (error: Error) => {
      // 에러 메시지에서 상태 코드와 JSON 형태를 제거하고 사용자 친화적 메시지만 추출
      let cleanMessage = error.message;

      // "401: {"message":"..."}" 형태에서 메시지만 추출
      const jsonMatch = cleanMessage.match(/\d+:\s*\{"message":"([^"]+)"\}/);
      if (jsonMatch) {
        cleanMessage = jsonMatch[1];
      }

      // 기본적인 상태 코드 제거 (예: "401: 메시지")
      cleanMessage = cleanMessage.replace(/^\d+:\s*/, '');

      toast({
        title: "로그인 실패",
        description: cleanMessage,
        variant: "destructive",
      });
    },
  });

  // 회원가입 mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterUserInput) => {
      const res = await apiRequest("POST", "/api/auth/register", userData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "회원가입에 실패했습니다");
      }
      return await res.json();
    },
    onSuccess: () => {
      invalidateAuthQueries(queryClient);
      toast({
        title: "회원가입 성공",
        description: "ReadyBag에 오신 것을 환영합니다!",
      });
    },
    onError: (error: Error) => {
      // 에러 메시지에서 상태 코드와 JSON 형태를 제거하고 사용자 친화적 메시지만 추출
      let cleanMessage = error.message;

      // "401: {"message":"..."}" 형태에서 메시지만 추출
      const jsonMatch = cleanMessage.match(/\d+:\s*\{"message":"([^"]+)"\}/);
      if (jsonMatch) {
        cleanMessage = jsonMatch[1];
      }

      // 기본적인 상태 코드 제거 (예: "401: 메시지")
      cleanMessage = cleanMessage.replace(/^\d+:\s*/, '');

      toast({
        title: "회원가입 실패",
        description: cleanMessage,
        variant: "destructive",
      });
    },
  });

  // 로그아웃 mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "로그아웃에 실패했습니다");
      }
    },
    onSuccess: () => {
      invalidateAuthQueries(queryClient);
      toast({
        title: "로그아웃 되었습니다",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "로그아웃 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 비밀번호 재설정 요청 mutation
  const resetPasswordRequestMutation = useMutation({
    mutationFn: async (data: ResetPasswordRequestInput) => {
      const res = await apiRequest("POST", "/api/auth/reset-password-request", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "비밀번호 재설정 요청에 실패했습니다");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "비밀번호 재설정 요청 성공",
        description: "이메일로 전송된 링크를 확인해주세요.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "비밀번호 재설정 요청 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 비밀번호 재설정 mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordInput) => {
      const res = await apiRequest("POST", "/api/auth/reset-password", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "비밀번호 재설정에 실패했습니다");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "비밀번호 재설정 성공",
        description: "새 비밀번호로 로그인해주세요.",
      });
    },
    onError: (error: Error) => {
      // 에러 메시지에서 상태 코드와 JSON 형태를 제거하고 사용자 친화적 메시지만 추출
      let cleanMessage = error.message;

      // "401: {"message":"..."}" 형태에서 메시지만 추출
      const jsonMatch = cleanMessage.match(/\d+:\s*\{"message":"([^"]+)"\}/);
      if (jsonMatch) {
        cleanMessage = jsonMatch[1];
      }

      // 기본적인 상태 코드 제거 (예: "401: 메시지")
      cleanMessage = cleanMessage.replace(/^\d+:\s*/, '');

      toast({
        title: "비밀번호 재설정 실패",
        description: cleanMessage,
        variant: "destructive",
      });
    },
  });

  // Clear localStorage data for non-members on page load/refresh
  useEffect(() => {
    if (!isLoading && !user) {
      // Clear all user-related data from localStorage for non-members
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('userProducts_') || key.startsWith('travelDates_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Dispatch event to notify components of data reset
      if (keysToRemove.length > 0) {
        window.dispatchEvent(new Event('localStorageChange'));
      }
    }
  }, [user, isLoading]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        resetPasswordRequestMutation,
        resetPasswordMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// queryClient is now imported at the top of the file