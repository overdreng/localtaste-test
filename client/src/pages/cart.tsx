import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import type { CartItem, Dish } from "@shared/schema";

type CartItemWithDish = CartItem & { dish: Dish };

export default function CartPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { t } = useTranslation();

  const { data: cartItems, isLoading } = useQuery<CartItemWithDish[]>({
    queryKey: ["/api/cart"],
  });

  const updateQuantity = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) =>
      apiRequest("PATCH", `/api/cart/${id}`, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cart/count"] });
    },
  });

  const removeItem = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/cart/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cart/count"] });
    },
  });

  const total = cartItems?.reduce(
    (sum, item) => sum + Number(item.dish.price) * item.quantity,
    0
  ) || 0;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 mb-3" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/">
            <Button size="icon" variant="ghost" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold">{t("cart")}</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {!cartItems || cartItems.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">{t("cart_empty")}</h3>
            <p className="text-muted-foreground text-sm mb-6">
              {t("cart_empty_desc")}
            </p>
            <Link href="/">
              <Button data-testid="button-browse">{t("browse_menu")}</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {cartItems.map((item) => (
                <Card key={item.id} data-testid={`card-cart-item-${item.id}`}>
                  <CardContent className="flex items-center gap-3 py-3 px-4">
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={item.dish.photos?.[0] || "/images/dish-pelmeni.png"}
                        alt={item.dish.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.dish.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {Number(item.dish.price).toFixed(0)} ₸
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() =>
                          updateQuantity.mutate({
                            id: item.id,
                            quantity: Math.max(1, item.quantity - 1),
                          })
                        }
                        data-testid={`button-minus-${item.id}`}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() =>
                          updateQuantity.mutate({
                            id: item.id,
                            quantity: item.quantity + 1,
                          })
                        }
                        data-testid={`button-plus-${item.id}`}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeItem.mutate(item.id)}
                      data-testid={`button-remove-${item.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="mb-4">
              <CardContent className="flex items-center justify-between py-4 px-4 gap-4">
                <span className="text-muted-foreground">{t("total")}</span>
                <span className="text-2xl font-bold" data-testid="text-total">
                  {total.toFixed(0)} ₸
                </span>
              </CardContent>
            </Card>

            <Button
              className="w-full"
              size="lg"
              onClick={() => navigate("/checkout")}
              data-testid="button-proceed-checkout"
            >
              {t("proceed_to_checkout")}
            </Button>
          </>
        )}
      </main>
    </div>
  );
}
