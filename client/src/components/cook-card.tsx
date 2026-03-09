import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, ChefHat, Utensils } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "@/lib/i18n";
import type { CookProfile, User, Dish } from "@shared/schema";

export type CookWithPreview = CookProfile & {
  user: User;
  dishCount: number;
  dishPreviews: string[];
};

export function CookCard({ cook }: { cook: CookWithPreview }) {
  const { t } = useTranslation();

  const cookName =
    cook.user?.firstName && cook.user?.lastName
      ? `${cook.user.firstName} ${cook.user.lastName}`
      : cook.displayName;

  const avatar = cook.profileImage || cook.user?.profileImageUrl;

  return (
    <Link href={`/cooks/${cook.id}`}>
      <Card
        className="group hover-elevate cursor-pointer h-full"
        data-testid={`card-cook-${cook.id}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="h-14 w-14 flex-shrink-0">
              <AvatarImage src={avatar || undefined} />
              <AvatarFallback>
                <ChefHat className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3
                className="font-semibold text-base truncate"
                data-testid={`text-cook-name-${cook.id}`}
              >
                {cookName}
              </h3>
              {cook.specialization && (
                <p className="text-xs text-muted-foreground truncate">
                  {cook.specialization}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                {cook.rating && Number(cook.rating) > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-medium">
                      {Number(cook.rating).toFixed(1)}
                    </span>
                  </div>
                )}
                {cook.totalOrders && cook.totalOrders > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {cook.totalOrders} {t("orders_count")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {cook.cuisineTypes && cook.cuisineTypes.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {cook.cuisineTypes.map((c) => (
                <Badge
                  key={c}
                  variant="secondary"
                  className="text-xs px-2 py-0"
                >
                  {c}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
            <Utensils className="h-3.5 w-3.5" />
            <span>
              {cook.dishCount} {t("dishes_count")}
            </span>
          </div>

          {cook.dishPreviews && cook.dishPreviews.length > 0 && (
            <div className="flex gap-1.5">
              {cook.dishPreviews.slice(0, 3).map((photo, i) => (
                <div
                  key={i}
                  className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0"
                >
                  <img
                    src={photo}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ))}
              {cook.dishCount > 3 && (
                <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                  +{cook.dishCount - 3}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
