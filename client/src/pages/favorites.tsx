import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Heart } from "lucide-react";
import { DishCard } from "@/components/dish-card";
import { useTranslation } from "@/lib/i18n";
import type { Dish, CookProfile, Favorite } from "@shared/schema";

type FavoriteWithDish = Favorite & { dish: Dish & { cookProfile: CookProfile } };

export default function FavoritesPage() {
  const { t } = useTranslation();
  const { data: favorites, isLoading } = useQuery<FavoriteWithDish[]>({
    queryKey: ["/api/favorites"],
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/">
            <Button size="icon" variant="ghost" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold">{t("favorites")}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : favorites && favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map(
              (fav) =>
                fav.dish && (
                  <DishCard key={fav.id} dish={fav.dish as Dish & { cookProfile: CookProfile }} />
                )
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <Heart className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">{t("no_favorites")}</h3>
            <p className="text-muted-foreground text-sm mb-6">
              {t("no_favorites_desc")}
            </p>
            <Link href="/">
              <Button data-testid="button-browse">{t("browse_menu")}</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
