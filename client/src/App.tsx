import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useTranslation } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import DishDetailPage from "@/pages/dish-detail";
import CookProfilePage from "@/pages/cook-profile";
import CartPage from "@/pages/cart";
import CheckoutPage from "@/pages/checkout";
import OrdersPage from "@/pages/orders";
import FavoritesPage from "@/pages/favorites";
import BecomeCookPage from "@/pages/become-cook";
import CookDashboardPage from "@/pages/cook-dashboard";
import ModeratorPage from "@/pages/moderator";
import AdminPage from "@/pages/admin";
import { AuthModal } from "@/components/auth-modal";
import { useState, useEffect, useCallback, createContext, useContext } from "react";

interface AuthModalContextType {
  openLogin: () => void;
  openRegister: () => void;
}

const AuthModalContext = createContext<AuthModalContextType>({
  openLogin: () => { },
  openRegister: () => { },
});

export function useAuthModal() {
  return useContext(AuthModalContext);
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { openLogin } = useAuthModal();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      openLogin();
    }
  }, [isLoading, isAuthenticated, openLogin]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <Component />;
}

function AppRouter() {
  const { isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/cooks/:id" component={CookProfilePage} />
      <Route path="/dish/:id" component={DishDetailPage} />
      <Route path="/cart">{() => <ProtectedRoute component={CartPage} />}</Route>
      <Route path="/checkout">{() => <ProtectedRoute component={CheckoutPage} />}</Route>
      <Route path="/orders">{() => <ProtectedRoute component={OrdersPage} />}</Route>
      <Route path="/favorites">{() => <ProtectedRoute component={FavoritesPage} />}</Route>
      <Route path="/become-cook">{() => <ProtectedRoute component={BecomeCookPage} />}</Route>
      <Route path="/dashboard">{() => <ProtectedRoute component={CookDashboardPage} />}</Route>
      <Route path="/dashboard/:tab">{() => <ProtectedRoute component={CookDashboardPage} />}</Route>
      <Route path="/moderator">{() => <ProtectedRoute component={ModeratorPage} />}</Route>
      <Route path="/admin">{() => <ProtectedRoute component={AdminPage} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const openLogin = useCallback(() => { setAuthMode("login"); setAuthOpen(true); }, []);
  const openRegister = useCallback(() => { setAuthMode("register"); setAuthOpen(true); }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <AuthModalContext.Provider value={{ openLogin, openRegister }}>
            <Toaster />
            <AppRouter />
            <AuthModal open={authOpen} onOpenChange={setAuthOpen} defaultMode={authMode} />
          </AuthModalContext.Provider>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
