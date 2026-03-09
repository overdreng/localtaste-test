import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Clock, ShoppingCart, Heart } from "lucide-react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import type { Dish, CookProfile } from "@shared/schema";

type DishWithCook = Dish & { cookProfile: CookProfile };

export function DishCard({ dish }: { dish: DishWithCook }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const addToCart = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/cart", { dishId: dish.id, quantity: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cart/count"] });
      toast({ title: t("added_to_cart"), description: dish.name });
    },
    onError: () => {
      toast({
        title: t("error"),
        description: t("add_to_cart_error"),
        variant: "destructive",
      });
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/favorites/toggle", { dishId: dish.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
  });

  const photo =
    dish.photos && dish.photos.length > 0
      ? dish.photos[0]
      : "/images/dish-pelmeni.png";

  return (
    <Card className="group hover-elevate" data-testid={`card-dish-${dish.id}`}>
      <Link href={`/dish/${dish.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-md">
          <img
            src={photo}
            alt={dish.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {dish.cuisineType && (
            <Badge
              variant="secondary"
              className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm text-xs"
            >
              {dish.cuisineType}
            </Badge>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 bg-background/60 backdrop-blur-sm h-8 w-8"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite.mutate();
            }}
            data-testid={`button-fav-${dish.id}`}
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={`/dish/${dish.id}`}>
          <h3
            className="font-semibold text-sm mb-1 line-clamp-1 cursor-pointer"
            data-testid={`text-dish-name-${dish.id}`}
          >
            {dish.name}
          </h3>
        </Link>
        {dish.description && (
          <p className="text-muted-foreground text-xs line-clamp-2 mb-3">
            {dish.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {dish.cookProfile && (
            <Link href={`/cooks/${dish.cookProfile.id}`}>
              <span className="text-xs text-muted-foreground cursor-pointer">
                {t("by_cook")}{" "}
                <span className="font-medium text-foreground">
                  {dish.cookProfile.displayName}
                </span>
              </span>
            </Link>
          )}
          {dish.cookProfile?.rating && Number(dish.cookProfile.rating) > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              <span className="text-xs text-muted-foreground">
                {Number(dish.cookProfile.rating).toFixed(1)}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-muted-foreground">
          {dish.cookingTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {dish.cookingTime} {t("min")}
            </div>
          )}
          {dish.weight && <span>{dish.weight}g</span>}
          {dish.calories && <span>{dish.calories} kcal</span>}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-lg" data-testid={`text-price-${dish.id}`}>
            {Number(dish.price).toFixed(0)} {t("rub")}
          </span>
          <Button
            size="sm"
            onClick={() => addToCart.mutate()}
            disabled={addToCart.isPending || !dish.isAvailable}
            data-testid={`button-add-cart-${dish.id}`}
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            {dish.isAvailable ? t("add") : t("sold_out")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
