import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft, Star, Clock, ChefHat, ShoppingCart, Heart,
  Award, CheckCircle, TrendingUp, Package, MessageSquare, Utensils,
} from "lucide-react";
import { DishCard } from "@/components/dish-card";
import { useTranslation } from "@/lib/i18n";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { CookProfile, Dish, Review, User, Category } from "@shared/schema";

type CookWithDishes = CookProfile & {
  dishes: (Dish & { cookProfile: CookProfile })[];
  reviews: (Review & { client: User })[];
  user: User;
};

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const sz = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${sz} ${i < Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export default function CookProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isFav, setIsFav] = useState(false);

  const { data: cook, isLoading } = useQuery<CookWithDishes>({
    queryKey: ["/api/cooks", id],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: favorites } = useQuery<any[]>({
    queryKey: ["/api/favorites"],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-48 bg-gradient-to-br from-amber-100 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20" />
        <div className="max-w-4xl mx-auto px-4 -mt-12 pb-8">
          <Skeleton className="h-24 w-24 rounded-full mb-4" />
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32 mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!cook) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t("cook_not_found")}</h2>
          <Link href="/">
            <Button variant="outline" className="mt-4">{t("back_to_menu")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const cookName = cook.user?.firstName && cook.user?.lastName
    ? `${cook.user.firstName} ${cook.user.lastName}`
    : cook.displayName;

  const cookCategoryIds = Array.from(
    new Set(cook.dishes?.map((d) => d.categoryId).filter(Boolean) || [])
  );
  const cookCategories = categories?.filter((c) => cookCategoryIds.includes(c.id)) || [];

  const filteredDishes = selectedCategory
    ? cook.dishes?.filter((d) => d.categoryId === selectedCategory)
    : cook.dishes;

  const rating = Number(cook.rating || 0);
  const isTopRated = rating >= 4.5;
  const isPopular = (cook.totalOrders || 0) >= 50;
  const reviewCount = cook.reviews?.length || 0;
  const dishCount = cook.dishes?.length || 0;

  const allDishImages = cook.dishes
    ?.flatMap((d) => (d as any).images || [])
    .filter(Boolean)
    .slice(0, 8) || [];

  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = cook.reviews?.filter((r) => r.rating === stars).length || 0;
    const pct = reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;
    return { stars, count, pct };
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button size="icon" variant="ghost" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={cook.profileImage || cook.user?.profileImageUrl || undefined} />
                <AvatarFallback className="text-xs"><ChefHat className="h-3 w-3" /></AvatarFallback>
              </Avatar>
              <h1 className="font-semibold truncate text-sm">{cookName}</h1>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant={cook.isAvailable ? "default" : "secondary"} className="text-xs">
              {cook.isAvailable ? "● " + (lang === "ru" ? "Доступен" : "Available") : (lang === "ru" ? "Недоступен" : "Unavailable")}
            </Badge>
          </div>
        </div>
      </header>

      {/* Cover Banner */}
      <div className="h-44 bg-gradient-to-br from-amber-200 via-orange-100 to-rose-100 dark:from-amber-900/40 dark:via-orange-900/30 dark:to-rose-900/30 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {["🍝", "🥘", "🍜", "🥗", "🍲", "🫕"].map((emoji, i) => (
            <span
              key={i}
              className="absolute text-4xl select-none"
              style={{
                left: `${10 + i * 16}%`,
                top: `${20 + (i % 2) * 40}%`,
                transform: `rotate(${i * 15 - 30}deg)`,
              }}
            >
              {emoji}
            </span>
          ))}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 pb-12">
        {/* Profile header overlapping cover */}
        <div className="-mt-12 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg flex-shrink-0">
              <AvatarImage src={cook.profileImage || cook.user?.profileImageUrl || undefined} />
              <AvatarFallback className="bg-primary/10">
                <ChefHat className="h-10 w-10 text-primary" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 pt-2 sm:pt-0">
              <h2 className="text-2xl font-bold mb-1" data-testid="text-cook-name">{cookName}</h2>
              {cook.specialization && (
                <p className="text-muted-foreground text-sm mb-2">{cook.specialization}</p>
              )}
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs border-green-300 text-green-700 dark:text-green-400 gap-1">
                  <CheckCircle className="h-3 w-3" />{t("badge_verified")}
                </Badge>
                {isTopRated && (
                  <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:text-amber-400 gap-1">
                    <Award className="h-3 w-3" />{t("badge_top_rated")}
                  </Badge>
                )}
                {isPopular && (
                  <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 dark:text-blue-400 gap-1">
                    <TrendingUp className="h-3 w-3" />{t("badge_popular")}
                  </Badge>
                )}
                {cook.cuisineTypes?.slice(0, 2).map((c) => (
                  <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                icon: <Star className="h-4 w-4 text-amber-500" />,
                value: rating > 0 ? rating.toFixed(1) : "—",
                label: lang === "ru" ? "Рейтинг" : "Rating",
                sub: rating > 0 ? <StarRating rating={rating} /> : null,
              },
              {
                icon: <Package className="h-4 w-4 text-primary" />,
                value: cook.totalOrders || 0,
                label: t("stat_dishes") === "Dishes" ? t("orders_count") : t("orders_count"),
                sub: <span className="text-xs text-muted-foreground">{lang === "ru" ? "заказов" : "completed"}</span>,
              },
              {
                icon: <Utensils className="h-4 w-4 text-primary" />,
                value: dishCount,
                label: t("stat_dishes"),
                sub: <span className="text-xs text-muted-foreground">{lang === "ru" ? "в меню" : "in menu"}</span>,
              },
              {
                icon: <MessageSquare className="h-4 w-4 text-primary" />,
                value: reviewCount,
                label: t("stat_reviews"),
                sub: <span className="text-xs text-muted-foreground">{lang === "ru" ? "отзывов" : "reviews"}</span>,
              },
            ].map((stat, i) => (
              <Card key={i} className="text-center">
                <CardContent className="py-3 px-2">
                  <div className="flex justify-center mb-1">{stat.icon}</div>
                  <div className="text-xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                  <div className="mt-1 flex justify-center">{stat.sub}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Working hours */}
        {cook.workingHoursStart && cook.workingHoursEnd && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 p-3 rounded-lg bg-muted/50">
            <Clock className="h-4 w-4" />
            <span>
              {lang === "ru" ? "Работает:" : "Working hours:"}{" "}
              <strong className="text-foreground">{cook.workingHoursStart} – {cook.workingHoursEnd}</strong>
            </span>
          </div>
        )}

        {/* About */}
        {cook.bio && (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-3">{t("about")}</h3>
            <p className="text-muted-foreground leading-relaxed">{cook.bio}</p>
          </div>
        )}

        {/* Food Gallery */}
        {allDishImages.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-3">{t("food_gallery")}</h3>
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
              {allDishImages.map((img, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-28 h-28 sm:w-36 sm:h-36 rounded-xl overflow-hidden bg-muted"
                >
                  <img
                    src={img}
                    alt={`Food photo ${i + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">{t("menu")}</h3>
            <span className="text-sm text-muted-foreground">{dishCount} {lang === "ru" ? "блюд" : "dishes"}</span>
          </div>

          {cookCategories.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge
                variant={selectedCategory === null ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(null)}
                data-testid="badge-category-all"
              >
                {t("all")}
              </Badge>
              {cookCategories.map((cat) => (
                <Badge
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                  data-testid={`badge-category-${cat.id}`}
                >
                  {lang === "ru" ? cat.nameRu : cat.name}
                </Badge>
              ))}
            </div>
          )}

          {filteredDishes && filteredDishes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDishes.map((dish) => (
                <DishCard key={dish.id} dish={dish} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-muted/30 rounded-xl">
              <Utensils className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground text-sm">{t("no_dishes_available")}</p>
            </div>
          )}
        </div>

        {/* Reviews */}
        {cook.reviews && cook.reviews.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{t("reviews")}</h3>
              <span className="text-sm text-muted-foreground">{reviewCount} {lang === "ru" ? "отзывов" : "reviews"}</span>
            </div>

            {/* Rating overview */}
            {reviewCount > 2 && (
              <Card className="mb-5">
                <CardContent className="py-4 px-5">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="text-center flex-shrink-0">
                      <div className="text-5xl font-bold text-amber-500 mb-1">{rating.toFixed(1)}</div>
                      <StarRating rating={rating} size="md" />
                      <p className="text-xs text-muted-foreground mt-1">{reviewCount} {lang === "ru" ? "отзывов" : "reviews"}</p>
                    </div>
                    <div className="flex-1 w-full space-y-1.5">
                      {ratingDistribution.map(({ stars, count, pct }) => (
                        <div key={stars} className="flex items-center gap-2 text-xs">
                          <span className="w-4 text-right text-muted-foreground">{stars}</span>
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-5 text-muted-foreground">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              {cook.reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="py-4 px-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9 flex-shrink-0">
                        <AvatarImage src={review.client?.profileImageUrl || undefined} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {review.client?.firstName?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {review.client?.firstName || t("default_user")}
                            {review.client?.lastName ? ` ${review.client.lastName[0]}.` : ""}
                          </span>
                          <StarRating rating={review.rating} />
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty reviews */}
        {(!cook.reviews || cook.reviews.length === 0) && (
          <div className="text-center py-10 bg-muted/30 rounded-xl">
            <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              {lang === "ru" ? "Отзывов пока нет. Будьте первым!" : "No reviews yet. Be the first!"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
