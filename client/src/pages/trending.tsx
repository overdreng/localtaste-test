import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft, Star, ChefHat, Flame, TrendingUp, Award,
  Package, ArrowRight, Utensils,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { CookCard, type CookWithPreview } from "@/components/cook-card";
import { useState } from "react";

const MEDALS = [
  { bg: "from-amber-400 to-yellow-300", text: "text-amber-900", label: "🥇" },
  { bg: "from-slate-400 to-slate-300", text: "text-slate-800", label: "🥈" },
  { bg: "from-orange-400 to-amber-300", text: "text-orange-900", label: "🥉" },
];

function TopCookCard({ cook, rank }: { cook: CookWithPreview; rank: number }) {
  const { lang } = useTranslation();
  const medal = MEDALS[rank] || MEDALS[2];
  const cookName =
    cook.user?.firstName && cook.user?.lastName
      ? `${cook.user.firstName} ${cook.user.lastName}`
      : cook.displayName;

  return (
    <Link href={`/cooks/${cook.id}`}>
      <Card
        className="cursor-pointer group hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden h-full"
        data-testid={`card-trending-cook-${cook.id}`}
      >
        {/* Gradient top bar */}
        <div className={`h-2 bg-gradient-to-r ${medal.bg}`} />
        <CardContent className="p-5">
          <div className="flex items-start gap-4 mb-4">
            <div className="relative flex-shrink-0">
              <Avatar className="h-16 w-16 border-2 border-background shadow-md">
                <AvatarImage src={cook.profileImage || cook.user?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-primary/10">
                  <ChefHat className="h-7 w-7 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br ${medal.bg} flex items-center justify-center shadow-sm text-sm`}>
                {medal.label}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base truncate mb-0.5">{cookName}</h3>
              {cook.specialization && (
                <p className="text-xs text-muted-foreground truncate mb-2">{cook.specialization}</p>
              )}
              <div className="flex items-center gap-3">
                {cook.rating && Number(cook.rating) > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-sm">{Number(cook.rating).toFixed(1)}</span>
                  </div>
                )}
                {cook.totalOrders && cook.totalOrders > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Package className="h-3.5 w-3.5" />
                    {cook.totalOrders} {lang === "ru" ? "заказов" : "orders"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {cook.cuisineTypes && cook.cuisineTypes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {cook.cuisineTypes.map((c) => (
                <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
              ))}
            </div>
          )}

          {cook.dishPreviews && cook.dishPreviews.length > 0 && (
            <div className="flex gap-2 mb-4">
              {cook.dishPreviews.slice(0, 3).map((photo, i) => (
                <div key={i} className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={photo}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
              {cook.dishCount > 3 && (
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                  +{cook.dishCount - 3}
                </div>
              )}
            </div>
          )}

          <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Utensils className="h-3.5 w-3.5 mr-1.5" />
            {lang === "ru" ? "Посмотреть меню" : "View Menu"}
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function TrendingPage() {
  const { t, lang } = useTranslation();
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);

  const { data: cooks, isLoading } = useQuery<CookWithPreview[]>({
    queryKey: ["/api/cooks"],
  });

  const sortedCooks = [...(cooks || [])].sort((a, b) => {
    const ratingDiff = Number(b.rating || 0) - Number(a.rating || 0);
    if (ratingDiff !== 0) return ratingDiff;
    return (b.totalOrders || 0) - (a.totalOrders || 0);
  });

  const top3 = sortedCooks.slice(0, 3);
  const rest = sortedCooks.slice(3);

  const allCuisines = Array.from(
    new Set(cooks?.flatMap((c) => c.cuisineTypes || []).filter(Boolean) || [])
  );

  const filteredRest = selectedCuisine
    ? rest.filter((c) => (c.cuisineTypes || []).includes(selectedCuisine))
    : rest;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/">
            <Button size="icon" variant="ghost" data-testid="button-back-home">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <h1 className="font-semibold">{t("trending_page_title")}</h1>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-12 bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 dark:from-orange-950/20 dark:via-amber-950/20 dark:to-rose-950/20 border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full px-4 py-1.5 text-sm font-medium mb-5">
            <Flame className="h-4 w-4" />
            {lang === "ru" ? "Обновляется каждую неделю" : "Updated every week"}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">{t("trending_page_title")}</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">{t("trending_page_desc")}</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Top 3 Podium */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Award className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-bold">{t("top_rated_cooks")}</h2>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-5">
                    <Skeleton className="h-2 w-full mb-4 -mx-5 -mt-5" />
                    <div className="flex gap-4 mb-4">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-16 w-16 rounded-lg" />
                      <Skeleton className="h-16 w-16 rounded-lg" />
                      <Skeleton className="h-16 w-16 rounded-lg" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : top3.length > 0 ? (
            <div className="grid sm:grid-cols-3 gap-5">
              {top3.map((cook, rank) => (
                <TopCookCard key={cook.id} cook={cook} rank={rank} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <ChefHat className="mx-auto h-12 w-12 opacity-30 mb-3" />
              <p>{lang === "ru" ? "Поваров пока нет" : "No cooks yet"}</p>
            </div>
          )}
        </div>

        {/* All other cooks */}
        {(rest.length > 0 || isLoading) && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">{t("all_cooks_ranked")}</h2>
              </div>
            </div>

            {/* Cuisine filter */}
            {allCuisines.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge
                  variant={selectedCuisine === null ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCuisine(null)}
                  data-testid="badge-filter-all"
                >
                  {t("all")}
                </Badge>
                {allCuisines.map((c) => (
                  <Badge
                    key={c}
                    variant={selectedCuisine === c ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => setSelectedCuisine(selectedCuisine === c ? null : c)}
                    data-testid={`badge-filter-${c}`}
                  >
                    {c}
                  </Badge>
                ))}
              </div>
            )}

            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex gap-3 mb-3">
                        <Skeleton className="h-14 w-14 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-5 w-3/4 mb-2" />
                          <Skeleton className="h-3 w-1/2" />
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
            ) : filteredRest.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRest.map((cook) => (
                  <CookCard key={cook.id} cook={cook} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <p className="text-sm">{lang === "ru" ? "Поваров с такой кухней нет" : "No cooks found for this cuisine"}</p>
                <Button variant="ghost" size="sm" className="mt-3" onClick={() => setSelectedCuisine(null)}>
                  {lang === "ru" ? "Показать всех" : "Show all"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Back to home */}
        <div className="text-center pt-10">
          <Link href="/">
            <Button variant="outline" data-testid="button-back-to-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {lang === "ru" ? "Назад на главную" : "Back to Home"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
