import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ShoppingCart, MapPin, Clock, MessageSquare } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import type { CartItem, Dish } from "@shared/schema";

type CartItemWithDish = CartItem & { dish: Dish };

export default function CheckoutPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [comment, setComment] = useState("");
  const { t } = useTranslation();

  const { data: cartItems, isLoading } = useQuery<CartItemWithDish[]>({
    queryKey: ["/api/cart"],
  });

  const placeOrder = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/orders", { deliveryAddress, deliveryTime, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cart/count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: t("order_placed"), description: t("order_sent_cook") });
      navigate("/orders");
    },
    onError: () => {
      toast({ title: t("error"), description: t("order_error"), variant: "destructive" });
    },
  });

  const total = cartItems?.reduce(
    (sum, item) => sum + Number(item.dish.price) * item.quantity,
    0
  ) || 0;

  const byCook: Record<string, CartItemWithDish[]> = {};
  cartItems?.forEach((item) => {
    const cookId = String(item.dish.cookProfileId);
    if (!byCook[cookId]) byCook[cookId] = [];
    byCook[cookId].push(item);
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-32 mb-4" />
        <Skeleton className="h-48 mb-4" />
        <Skeleton className="h-12" />
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/cart">
            <Button size="icon" variant="ghost" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold">{t("checkout")}</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardContent className="py-4 px-4">
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              {t("order_summary")}
            </h3>
            <div className="space-y-2">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm" data-testid={`checkout-item-${item.id}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                      <img src={item.dish.photos?.[0] || "/images/dish-pelmeni.png"} alt={item.dish.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="truncate">{item.dish.name} x{item.quantity}</span>
                  </div>
                  <span className="font-medium whitespace-nowrap ml-2">
                    {(Number(item.dish.price) * item.quantity).toFixed(0)} ₸
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 mt-3 border-t">
              <span className="font-medium">{t("total")}</span>
              <span className="text-xl font-bold" data-testid="text-checkout-total">{total.toFixed(0)} ₸</span>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="py-4 px-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t("delivery_address")} *
              </label>
              <Input
                placeholder={t("enter_address")}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                data-testid="input-checkout-address"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t("delivery_time")}
              </label>
              <Input
                type="datetime-local"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                data-testid="input-checkout-time"
              />
              <p className="text-xs text-muted-foreground mt-1">{t("as_soon_as_possible")}</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {t("comment_optional")}
              </label>
              <Textarea
                placeholder={t("comment_placeholder")}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="resize-none"
                data-testid="input-checkout-comment"
              />
            </div>
          </CardContent>
        </Card>

        <Button
          className="w-full"
          size="lg"
          onClick={() => placeOrder.mutate()}
          disabled={placeOrder.isPending || !deliveryAddress.trim()}
          data-testid="button-place-order"
        >
          {placeOrder.isPending ? t("placing") : `${t("place_order")} — ${total.toFixed(0)} ₸`}
        </Button>
      </main>
    </div>
  );
}
