import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChefHat, Star, Clock, ShoppingCart, Heart, ArrowLeft, Flame, Weight, Wheat,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import type { Dish, CookProfile, Review, User } from "@shared/schema";

type DishWithCook = Dish & { cookProfile: CookProfile };
type ReviewWithUser = Review & { client: User };

export default function DishDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, lang } = useTranslation();
  const [quantity, setQuantity] = useState(1);

  const { data: dish, isLoading } = useQuery<DishWithCook>({
    queryKey: ["/api/dishes", id],
  });

  const { data: reviews } = useQuery<ReviewWithUser[]>({
    queryKey: ["/api/dishes", id, "reviews"],
  });

  const addToCart = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/cart", { dishId: Number(id), quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cart/count"] });
      toast({ title: t("added_to_cart"), description: `${dish?.name} x${quantity}` });
    },
    onError: () => {
      toast({ title: t("error"), description: t("sign_in_to_cart"), variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-80 rounded-md mb-6" />
        <Skeleton className="h-8 w-2/3 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!dish) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">{t("dish_not_found")}</p>
        <Link href="/">
          <Button variant="outline" className="mt-4">{t("back_to_menu")}</Button>
        </Link>
      </div>
    );
  }

  const photo = dish.photos?.[0] || "/images/dish-pelmeni.png";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/">
            <Button size="icon" variant="ghost" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold truncate">{dish.name}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="aspect-square rounded-md overflow-hidden bg-muted">
              <img src={photo} alt={dish.name} className="w-full h-full object-cover" />
            </div>
            {dish.photos && dish.photos.length > 1 && (
              <div className="flex gap-2 mt-3">
                {dish.photos.map((p, i) => (
                  <div key={i} className="w-16 h-16 rounded-md overflow-hidden bg-muted">
                    <img src={p} alt={`${dish.name} ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {dish.cuisineType && <Badge variant="secondary">{dish.cuisineType}</Badge>}
              {dish.dietaryTags?.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
              ))}
              {!dish.isAvailable && <Badge variant="destructive">{t("sold_out")}</Badge>}
            </div>

            <h2 className="text-2xl font-bold mb-2" data-testid="text-dish-title">
              {dish.name}
            </h2>

            {dish.description && (
              <p className="text-muted-foreground mb-4 leading-relaxed">{dish.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 mb-5 text-sm text-muted-foreground">
              {dish.cookingTime && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {dish.cookingTime} {t("min")}
                </div>
              )}
              {dish.weight && (
                <div className="flex items-center gap-1">
                  <Weight className="h-4 w-4" />
                  {dish.weight}g
                </div>
              )}
              {dish.portions && dish.portions > 1 && (
                <span>{dish.portions} {t("portions")}</span>
              )}
            </div>

            {(dish.calories || dish.protein || dish.fat || dish.carbs) && (
              <Card className="mb-5">
                <CardContent className="py-3 px-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {t("nutritional_info")}
                  </p>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    {dish.calories && (
                      <div>
                        <Flame className="h-4 w-4 mx-auto mb-1 text-orange-500" />
                        <p className="font-semibold text-sm">{dish.calories}</p>
                        <p className="text-xs text-muted-foreground">kcal</p>
                      </div>
                    )}
                    {dish.protein && (
                      <div>
                        <p className="font-semibold text-sm">{dish.protein}g</p>
                        <p className="text-xs text-muted-foreground">{t("protein")}</p>
                      </div>
                    )}
                    {dish.fat && (
                      <div>
                        <p className="font-semibold text-sm">{dish.fat}g</p>
                        <p className="text-xs text-muted-foreground">{t("fat")}</p>
                      </div>
                    )}
                    {dish.carbs && (
                      <div>
                        <Wheat className="h-4 w-4 mx-auto mb-1 text-amber-600" />
                        <p className="font-semibold text-sm">{dish.carbs}g</p>
                        <p className="text-xs text-muted-foreground">{t("carbs")}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {dish.ingredients && (
              <div className="mb-5">
                <h3 className="font-medium text-sm mb-2">{t("ingredients")}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{dish.ingredients}</p>
              </div>
            )}

            <div className="flex items-center gap-4 mb-5 p-3 rounded-md bg-card border">
              <span className="text-3xl font-bold" data-testid="text-dish-price">
                {Number(dish.price).toFixed(0)} {t("rub")}
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <Button size="icon" variant="outline" onClick={() => setQuantity(Math.max(1, quantity - 1))} data-testid="button-qty-minus">-</Button>
                <span className="w-8 text-center font-medium" data-testid="text-quantity">{quantity}</span>
                <Button size="icon" variant="outline" onClick={() => setQuantity(quantity + 1)} data-testid="button-qty-plus">+</Button>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => addToCart.mutate()}
              disabled={addToCart.isPending || !dish.isAvailable}
              data-testid="button-add-to-cart"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {t("add_to_cart")} - {(Number(dish.price) * quantity).toFixed(0)} {t("rub")}
            </Button>

            {dish.cookProfile && (
              <Link href={`/cooks/${dish.cookProfile.id}`}>
                <Card className="mt-5 hover-elevate cursor-pointer">
                  <CardContent className="flex items-center gap-3 py-3 px-4">
                    <Avatar>
                      <AvatarImage src={dish.cookProfile.profileImage || undefined} />
                      <AvatarFallback><ChefHat className="h-5 w-5" /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{dish.cookProfile.displayName}</p>
                      {dish.cookProfile.specialization && (
                        <p className="text-xs text-muted-foreground truncate">{dish.cookProfile.specialization}</p>
                      )}
                    </div>
                    {dish.cookProfile.rating && Number(dish.cookProfile.rating) > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-medium">{Number(dish.cookProfile.rating).toFixed(1)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )}
          </div>
        </div>

        {reviews && reviews.length > 0 && (
          <div className="mt-10">
            <h3 className="text-lg font-bold mb-4">{t("reviews")}</h3>
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} data-testid={`card-review-${review.id}`}>
                  <CardContent className="py-4 px-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={review.client?.profileImageUrl || undefined} />
                        <AvatarFallback>{review.client?.firstName?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{review.client?.firstName || t("default_user")}</p>
                        <div className="flex items-center gap-1">
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
                      <span className="text-xs text-muted-foreground">
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US") : ""}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                    )}
                    {review.cookReply && (
                      <div className="mt-3 pl-4 border-l-2 border-primary/30">
                        <p className="text-xs font-medium text-primary mb-1">{t("cooks_reply")}</p>
                        <p className="text-sm text-muted-foreground">{review.cookReply}</p>
                      </div>
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
