import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ShoppingCart, MapPin, Clock, MessageSquare,
  CreditCard, Banknote, CheckCircle2, Loader2,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import type { CartItem, Dish } from "@shared/schema";

type CartItemWithDish = CartItem & { dish: Dish };
type PaymentMethod = "card" | "cash";

type CheckoutStep = "details" | "payment" | "processing" | "success";

export default function CheckoutPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { t } = useTranslation();

  const [step, setStep] = useState<CheckoutStep>("details");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [comment, setComment] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const { data: cartItems, isLoading } = useQuery<CartItemWithDish[]>({ queryKey: ["/api/cart"] });

  const placeOrder = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/orders", { deliveryAddress, deliveryTime, comment, paymentMethod }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cart/count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setStep("success");
    },
    onError: () => {
      setStep("payment");
      toast({ title: t("error"), description: t("order_error"), variant: "destructive" });
    },
  });

  const total = cartItems?.reduce((sum, item) => sum + Number(item.dish.price) * item.quantity, 0) || 0;

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 2) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  const handlePayment = () => {
    if (paymentMethod === "card") {
      const digits = cardNumber.replace(/\s/g, "");
      if (digits.length !== 16) { toast({ title: "Please enter a valid 16-digit card number", variant: "destructive" }); return; }
      if (cardExpiry.length !== 5) { toast({ title: "Please enter a valid expiry date (MM/YY)", variant: "destructive" }); return; }
      if (cardCvv.length < 3) { toast({ title: "Please enter a valid CVV", variant: "destructive" }); return; }
    }
    setStep("processing");
    // Simulate payment processing delay
    setTimeout(() => placeOrder.mutate(), 1500);
  };

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

  // Success screen
  if (step === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Order Placed!</h2>
          <p className="text-muted-foreground mb-2">Your order has been placed successfully.</p>
          {paymentMethod === "card" && (
            <Badge variant="outline" className="mb-6">
              <CreditCard className="h-3 w-3 mr-1" /> Payment confirmed
            </Badge>
          )}
          {paymentMethod === "cash" && (
            <Badge variant="outline" className="mb-6">
              <Banknote className="h-3 w-3 mr-1" /> Pay on delivery
            </Badge>
          )}
          <div className="flex gap-3 flex-col">
            <Button onClick={() => navigate("/orders")} data-testid="button-view-orders">
              Track My Order
            </Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Processing screen
  if (step === "processing") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
          <h2 className="text-lg font-semibold mb-1">Processing payment…</h2>
          <p className="text-sm text-muted-foreground">Please wait a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
          {step === "payment" ? (
            <Button size="icon" variant="ghost" onClick={() => setStep("details")} data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <Link href="/cart">
              <Button size="icon" variant="ghost" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
          )}
          <h1 className="font-semibold">{step === "payment" ? "Payment" : t("checkout")}</h1>
          <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <span className={step === "details" ? "text-primary font-medium" : ""}>1. Details</span>
            <span>→</span>
            <span className={step === "payment" ? "text-primary font-medium" : ""}>2. Payment</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Order summary — always visible */}
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
                    <div className="w-9 h-9 rounded overflow-hidden bg-muted flex-shrink-0">
                      {item.dish.photos?.[0] && (
                        <img src={item.dish.photos[0]} alt={item.dish.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <span className="truncate">{item.dish.name} <span className="text-muted-foreground">×{item.quantity}</span></span>
                  </div>
                  <span className="font-medium whitespace-nowrap ml-2">{(Number(item.dish.price) * item.quantity).toFixed(0)} ₸</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 mt-3 border-t">
              <span className="font-medium">{t("total")}</span>
              <span className="text-xl font-bold" data-testid="text-checkout-total">{total.toFixed(0)} ₸</span>
            </div>
          </CardContent>
        </Card>

        {step === "details" && (
          <>
            <Card className="mb-6">
              <CardContent className="py-4 px-4 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 flex items-center gap-2 block">
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
                  <label className="text-sm font-medium mb-1.5 flex items-center gap-2 block">
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
                  <label className="text-sm font-medium mb-1.5 flex items-center gap-2 block">
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
              onClick={() => setStep("payment")}
              disabled={!deliveryAddress.trim()}
              data-testid="button-continue-payment"
            >
              Continue to Payment — {total.toFixed(0)} ₸
            </Button>
          </>
        )}

        {step === "payment" && (
          <>
            {/* Payment method selector */}
            <Card className="mb-4">
              <CardContent className="py-4 px-4">
                <p className="text-sm font-medium mb-3">Payment Method</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}
                    data-testid="button-pay-card"
                  >
                    <CreditCard className={`h-6 w-6 ${paymentMethod === "card" ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-sm font-medium">Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${paymentMethod === "cash" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}
                    data-testid="button-pay-cash"
                  >
                    <Banknote className={`h-6 w-6 ${paymentMethod === "cash" ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-sm font-medium">Cash</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            {paymentMethod === "card" && (
              <Card className="mb-6">
                <CardContent className="py-4 px-4 space-y-4">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Card Details
                  </p>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Card Number</label>
                    <Input
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      maxLength={19}
                      data-testid="input-card-number"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Expiry Date</label>
                      <Input
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        maxLength={5}
                        data-testid="input-card-expiry"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">CVV</label>
                      <Input
                        placeholder="123"
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        maxLength={4}
                        data-testid="input-card-cvv"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    🔒 This is a demo payment flow. No real charges are made.
                  </p>
                </CardContent>
              </Card>
            )}

            {paymentMethod === "cash" && (
              <Card className="mb-6">
                <CardContent className="py-4 px-4">
                  <div className="flex items-start gap-3">
                    <Banknote className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Pay on Delivery</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Prepare <strong>{total.toFixed(0)} ₸</strong> in cash. The courier will collect payment upon delivery.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handlePayment}
              data-testid="button-place-order"
            >
              {paymentMethod === "card" ? `Pay ${total.toFixed(0)} ₸` : `Place Order — ${total.toFixed(0)} ₸`}
            </Button>
          </>
        )}
      </main>
    </div>
  );
}
