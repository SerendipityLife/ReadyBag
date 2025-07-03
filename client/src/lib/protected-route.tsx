import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route, Redirect } from "wouter";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
  requireAuth?: boolean; // 인증이 필수인지 여부
}

/**
 * ProtectedRoute 컴포넌트
 * requireAuth가 true인 경우에만 인증이 필요하며, 기본값은 false입니다.
 * 즉, 기본적으로 비회원도 접근 가능하지만 requireAuth를 true로 설정한 페이지는 로그인 필요
 */
export function ProtectedRoute({ 
  path, 
  component: Component, 
  requireAuth = false 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  // 인증이 필요한 페이지이고 로그인하지 않은 경우만 리다이렉트
  if (requireAuth && !user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}