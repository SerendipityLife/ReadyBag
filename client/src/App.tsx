import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { AppProvider } from "./contexts/AppContext";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import Home from "./pages/home";
import SharedList from "./pages/shared-list";
import NotFound from "./pages/not-found";
import AuthPage from "./pages/auth-page";
import ResetPassword from "./pages/reset-password";

function Router() {
  return (
    <Switch>
      {/* 메인 홈 페이지는 비회원도 접근 가능 */}
      <ProtectedRoute path="/" component={Home} requireAuth={false} />
      
      {/* 인증 관련 페이지 */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/reset-password" component={ResetPassword} />
      
      {/* 공유 페이지는 누구나 접근 가능 */}
      <Route path="/shared/:shareId" component={SharedList} />
      
      {/* 기본 404 페이지 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <Router />
          <Toaster />
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
