import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Star, Clock, ChefHat } from "lucide-react";
import { DishCard } from "@/components/dish-card";
import { useTranslation } from "@/lib/i18n";
import { useState } from "react";
import type { CookProfile, Dish, Review, User, Category } from "@shared/schema";

type CookWithDishes = CookProfile & {
  dishes: (Dish & { cookProfile: CookProfile })[];
  reviews: (Review & { client: User })[];
  user: User;
};

export default function CookProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const { data: cook, isLoading } = useQuery<CookWithDishes>({
    queryKey: ["/api/cooks", id],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="flex gap-4 mb-6">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (!cook) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">{t("cook_not_found")}</p>
        <Link href="/">
          <Button variant="outline" className="mt-4">{t("back_to_menu")}</Button>
        </Link>
      </div>
    );
  }

  const cookCategoryIds = Array.from(
    new Set(cook.dishes?.map((d) => d.categoryId).filter(Boolean) || [])
  );
  const cookCategories = categories?.filter((c) => cookCategoryIds.includes(c.id)) || [];

  const filteredDishes = selectedCategory
    ? cook.dishes?.filter((d) => d.categoryId === selectedCategory)
    : cook.dishes;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/">
            <Button size="icon" variant="ghost" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold truncate">{cook.displayName}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Avatar className="h-20 w-20 flex-shrink-0">
            <AvatarImage src={cook.profileImage || cook.user?.profileImageUrl || undefined} />
            <AvatarFallback><ChefHat className="h-8 w-8" /></AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1" data-testid="text-cook-name">
              {cook.user?.firstName && cook.user?.lastName
                ? `${cook.user.firstName} ${cook.user.lastName}`
                : cook.displayName}
            </h2>
            {cook.specialization && (
              <p className="text-muted-foreground mb-2">{cook.specialization}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 mb-3">
              {cook.rating && Number(cook.rating) > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="font-medium">{Number(cook.rating).toFixed(1)}</span>
                </div>
              )}
              {cook.totalOrders && cook.totalOrders > 0 && (
                <span className="text-sm text-muted-foreground">
                  {cook.totalOrders} {t("orders_count")}
                </span>
              )}
              {cook.workingHoursStart && cook.workingHoursEnd && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {cook.workingHoursStart} - {cook.workingHoursEnd}
                </div>
              )}
            </div>
            {cook.cuisineTypes && cook.cuisineTypes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {cook.cuisineTypes.map((c) => (
                  <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                ))}
              </div>
            )}
          </div>
          <div>
            <Badge variant={cook.isAvailable ? "default" : "secondary"}>
              {cook.isAvailable ? t("available") : t("unavailable")}
            </Badge>
          </div>
        </div>

        {cook.bio && (
          <div className="mb-8">
            <h3 className="font-medium mb-2">{t("about")}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{cook.bio}</p>
          </div>
        )}

        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4">{t("menu")}</h3>

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
            <p className="text-muted-foreground text-sm">{t("no_dishes_available")}</p>
          )}
        </div>

        {cook.reviews && cook.reviews.length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-4">{t("reviews")}</h3>
            <div className="space-y-3">
              {cook.reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={review.client?.profileImageUrl || undefined} />
                        <AvatarFallback>{review.client?.firstName?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {review.client?.firstName || t("default_user")}
                      </span>
                      <div className="flex items-center gap-0.5 ml-auto">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < review.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
