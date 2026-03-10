import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChefHat,
  Clock,
  Star,
  Shield,
  Utensils,
  Heart,
  ArrowRight,
  Search,
  ShoppingCart,
  Package,
  Settings,
  LogOut,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { LanguageToggle } from "@/components/language-toggle";
import { CookCard, type CookWithPreview } from "@/components/cook-card";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { AuthModal } from "@/components/auth-modal";
import { useState } from "react";
import { Link } from "wouter";
const heroFoodPath = "/images/hero-food.png";

export default function LandingPage() {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  const openLogin = () => { setAuthMode("login"); setAuthOpen(true); };
  const openRegister = () => { setAuthMode("register"); setAuthOpen(true); };

  const { data: cooks, isLoading: cooksLoading } = useQuery<CookWithPreview[]>({
    queryKey: ["/api/cooks"],
  });

  const { data: profile } = useQuery<{ role: string } | null>({
    queryKey: ["/api/user/profile"],
    enabled: isAuthenticated,
  });

  const { data: cartCount } = useQuery<{ count: number }>({
    queryKey: ["/api/cart/count"],
    enabled: isAuthenticated,
  });

  const filteredCooks = cooks?.filter((cook) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const cookName = cook.user?.firstName && cook.user?.lastName
        ? `${cook.user.firstName} ${cook.user.lastName}`.toLowerCase()
        : cook.displayName.toLowerCase();
      const cuisines = cook.cuisineTypes?.join(" ").toLowerCase() || "";
      const spec = cook.specialization?.toLowerCase() || "";
      if (!cookName.includes(q) && !cuisines.includes(q) && !spec.includes(q)) {
        return false;
      }
    }
    if (selectedCuisine && !(cook.cuisineTypes || []).includes(selectedCuisine)) {
      return false;
    }
    if (ratingFilter && Number(cook.rating || 0) < ratingFilter) {
      return false;
    }
    return true;
  });

  const allCuisineTypes = Array.from(
    new Set(cooks?.flatMap((c) => c.cuisineTypes || []).filter(Boolean) || [])
  );

  const isCook = profile?.role === "cook";
  const isAdmin = profile?.role === "admin";
  const isModerator = profile?.role === "moderator";

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <img src="/images/logo.jpg" alt="Local Taste" className="h-8 w-auto" />
                <span className="text-xl font-bold tracking-tight hidden sm:inline">
                  {t("brand")}
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <a href="#cooks" className="text-sm text-muted-foreground transition-colors" data-testid="link-cooks">
                {t("our_cooks")}
              </a>
              <a href="#features" className="text-sm text-muted-foreground transition-colors" data-testid="link-features">
                {t("features")}
              </a>
              <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors" data-testid="link-how-it-works">
                {t("how_it_works")}
              </a>
            </div>

            <div className="flex items-center gap-2">
              <LanguageToggle />

              {isAuthenticated ? (
                <>
                  <Link href="/favorites">
                    <Button size="icon" variant="ghost" data-testid="button-favorites">
                      <Heart className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/cart">
                    <Button size="icon" variant="ghost" className="relative" data-testid="button-cart">
                      <ShoppingCart className="h-5 w-5" />
                      {cartCount && cartCount.count > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                          {cartCount.count}
                        </span>
                      )}
                    </Button>
                  </Link>
                  {isCook && (
                    <Link href="/dashboard">
                      <Button size="sm" variant="outline" data-testid="button-cook-dashboard">
                        <ChefHat className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">{t("dashboard")}</span>
                      </Button>
                    </Link>
                  )}
                  {isModerator && (
                    <Link href="/moderator">
                      <Button size="sm" variant="outline" data-testid="button-moderator">
                        <Settings className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">{t("moderator_panel")}</span>
                      </Button>
                    </Link>
                  )}
                  {isAdmin && (
                    <Link href="/admin">
                      <Button size="sm" variant="outline" data-testid="button-admin">
                        <Settings className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">{t("admin")}</span>
                      </Button>
                    </Link>
                  )}
                  <Link href="/orders">
                    <Button size="icon" variant="ghost" data-testid="button-orders">
                      <Package className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Avatar className="h-8 w-8 cursor-pointer" data-testid="button-avatar-dashboard">
                      <AvatarImage src={user?.profileImageUrl || undefined} />
                      <AvatarFallback>
                        {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <Button size="icon" variant="ghost" onClick={() => logout()} data-testid="button-logout">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={openLogin} data-testid="button-login">
                    {t("login")}
                  </Button>
                  <Button size="sm" onClick={openRegister} data-testid="button-register">
                    {t("register")}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <section className="relative pt-16">
        <div className="relative h-[50vh] min-h-[350px] overflow-hidden">
          <img
            src={heroFoodPath}
            alt="Homemade food spread"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
            <div className="max-w-xl">
              <Badge variant="secondary" className="mb-4 bg-white/10 text-white border-white/20">
                {t("landing_badge")}
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                {t("landing_title_1")}
                <br />
                <span className="text-primary">{t("landing_title_2")}</span>
              </h1>
              <p className="text-base text-white/80 mb-6 leading-relaxed">
                {t("landing_desc")}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a href="#cooks">
                  <Button size="lg" data-testid="button-hero-order">
                    <Utensils className="mr-2 h-5 w-5" />
                    {t("order_now")}
                  </Button>
                </a>
                {!isAuthenticated && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-white/10 text-white border-white/30 backdrop-blur-sm"
                    onClick={openRegister}
                    data-testid="button-hero-register"
                  >
                    {t("get_started")}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <div className="flex items-center gap-1 text-white/70 text-sm">
                  <Shield className="h-4 w-4" />
                  {t("verified_cooks")}
                </div>
                <div className="flex items-center gap-1 text-white/70 text-sm">
                  <Star className="h-4 w-4" />
                  {t("rated_customers")}
                </div>
                <div className="flex items-center gap-1 text-white/70 text-sm">
                  <Clock className="h-4 w-4" />
                  {t("fast_delivery")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="cooks" className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">{t("our_cooks")}</h2>
              <p className="text-muted-foreground text-sm">{t("choose_cook")}</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder={t("search_cooks_placeholder")}
                className="w-full h-9 pl-9 pr-4 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
              />
            </div>
          </div>

          {!isAuthenticated && !isCook && (
            <Card className="mb-6 bg-primary/5 border-primary/20">
              <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4">
                <div className="flex items-center gap-3">
                  <ChefHat className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{t("love_cooking")}</p>
                    <p className="text-sm text-muted-foreground">{t("become_cook_desc")}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    if (isAuthenticated) {
                      window.location.href = "/become-cook";
                    } else {
                      openRegister();
                    }
                  }}
                  data-testid="button-become-cook"
                >
                  {t("become_cook_btn")}
                </Button>
              </CardContent>
            </Card>
          )}

          {allCuisineTypes.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={selectedCuisine === null ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCuisine(null)}
                  data-testid="badge-cuisine-all"
                >
                  {t("all")}
                </Badge>
                {allCuisineTypes.map((c) => (
                  <Badge
                    key={c}
                    variant={selectedCuisine === c ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => setSelectedCuisine(selectedCuisine === c ? null : c)}
                    data-testid={`badge-cuisine-${c}`}
                  >
                    {c}
                  </Badge>
                ))}
                <Badge
                  variant={ratingFilter === null ? "default" : "secondary"}
                  className="cursor-pointer ml-3"
                  onClick={() => setRatingFilter(null)}
                  data-testid="badge-rating-any"
                >
                  <Star className="h-3 w-3 mr-1" />
                  {t("rating_any")}
                </Badge>
                <Badge
                  variant={ratingFilter === 4 ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => setRatingFilter(ratingFilter === 4 ? null : 4)}
                  data-testid="badge-rating-4plus"
                >
                  <Star className="h-3 w-3 mr-1" />
                  {t("rating_4_plus")}
                </Badge>
              </div>
            </div>
          )}

          {cooksLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <Skeleton className="h-14 w-14 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2 mb-1" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <Skeleton className="h-16 w-16 rounded-md" />
                      <Skeleton className="h-16 w-16 rounded-md" />
                      <Skeleton className="h-16 w-16 rounded-md" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCooks && filteredCooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCooks.map((cook) => (
                <CookCard key={cook.id} cook={cook} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <ChefHat className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">{t("no_cooks_found")}</h3>
              <p className="text-muted-foreground text-sm">
                {searchQuery ? t("no_cooks_search") : t("no_cooks_later")}
              </p>
            </div>
          )}
        </div>
      </section>

      <section id="features" className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">{t("why_choose")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm">{t("why_choose_desc")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center p-6">
              <CardContent className="pt-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                  <ChefHat className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t("feat_verified_title")}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{t("feat_verified_desc")}</p>
              </CardContent>
            </Card>
            <Card className="text-center p-6">
              <CardContent className="pt-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                  <Heart className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t("feat_love_title")}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{t("feat_love_desc")}</p>
              </CardContent>
            </Card>
            <Card className="text-center p-6">
              <CardContent className="pt-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                  <Utensils className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t("feat_cuisine_title")}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{t("feat_cuisine_desc")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">{t("how_it_works")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm">{t("how_works_desc")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: t("step1_title"), desc: t("step1_desc") },
              { step: "2", title: t("step2_title"), desc: t("step2_desc") },
              { step: "3", title: t("step3_title"), desc: t("step3_desc") },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-5">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {!isAuthenticated && (
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold mb-4">{t("cta_title")}</h2>
            <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto text-sm">{t("cta_desc")}</p>
            <Button
              size="lg"
              variant="secondary"
              onClick={openRegister}
              data-testid="button-cta-signup"
            >
              {t("get_started_free")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>
      )}

      <footer className="py-8 border-t bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/images/logo.jpg" alt="Local Taste" className="h-6 w-auto" />
              <span className="font-semibold">{t("brand")}</span>
            </div>
            <p className="text-sm text-muted-foreground">{t("footer_rights")}</p>
          </div>
        </div>
      </footer>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} defaultMode={authMode} />
    </div>
  );
}
