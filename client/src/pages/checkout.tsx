import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, ShoppingCart, MapPin, Clock, MessageSquare,
  CreditCard, Banknote, CheckCircle2, Loader2, QrCode, Smartphone,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import type { CartItem, Dish } from "@shared/schema";

type CartItemWithDish = CartItem & { dish: Dish };
type PaymentMethod = "card" | "cash" | "kaspi";
type CheckoutStep = "details" | "payment" | "processing" | "success";

const PLATFORM_FEE_RATE = 0.10;
const DELIVERY_FEE = 299;

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
  const [kaspiPhone, setKaspiPhone] = useState("");
  const [kaspiConfirmed, setKaspiConfirmed] = useState(false);

  const { data: cartItems, isLoading } = useQuery<CartItemWithDish[]>({ queryKey: ["/api/cart"] });

  const subtotal = cartItems?.reduce((sum, item) => sum + Number(item.dish.price) * item.quantity, 0) || 0;
  const platformFee = Math.round(subtotal * PLATFORM_FEE_RATE);
  const deliveryFee = subtotal > 0 ? DELIVERY_FEE : 0;
  const grandTotal = subtotal + platformFee + deliveryFee;

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

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 2) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 11);
    if (digits.startsWith("7") && digits.length > 1) {
      return "+" + digits;
    }
    return digits ? "+" + digits : "";
  };

  const handlePayment = () => {
    if (paymentMethod === "card") {
      const digits = cardNumber.replace(/\s/g, "");
      if (digits.length !== 16) { toast({ title: "Введите корректный номер карты (16 цифр)", variant: "destructive" }); return; }
      if (cardExpiry.length !== 5) { toast({ title: "Введите срок действия (ММ/ГГ)", variant: "destructive" }); return; }
      if (cardCvv.length < 3) { toast({ title: "Введите CVV код", variant: "destructive" }); return; }
    }
    if (paymentMethod === "kaspi") {
      if (!kaspiConfirmed) { toast({ title: "Подтвердите оплату в Kaspi", variant: "destructive" }); return; }
    }
    setStep("processing");
    setTimeout(() => placeOrder.mutate(), paymentMethod === "kaspi" ? 2000 : 1500);
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

  useEffect(() => {
    if (!isLoading && cartItems && cartItems.length === 0 && step !== "success") {
      navigate("/cart");
    }
  }, [isLoading, cartItems, step, navigate]);

  if (!isLoading && (!cartItems || cartItems.length === 0) && step !== "success") {
    return null;
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Заказ оформлен!</h2>
          <p className="text-muted-foreground mb-3">Ваш заказ принят и передан повару.</p>
          <div className="bg-muted/50 rounded-xl p-4 mb-6 text-sm text-left space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Сумма заказа</span>
              <span>{subtotal.toFixed(0)} ₸</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Комиссия платформы</span>
              <span>{platformFee.toFixed(0)} ₸</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Доставка</span>
              <span>{deliveryFee.toFixed(0)} ₸</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between font-bold">
              <span>Итого оплачено</span>
              <span className="text-primary">{grandTotal.toFixed(0)} ₸</span>
            </div>
          </div>
          <div className="flex gap-2 mb-4 justify-center">
            {paymentMethod === "card" && (
              <Badge variant="outline" className="gap-1">
                <CreditCard className="h-3 w-3" /> Карта — оплачено
              </Badge>
            )}
            {paymentMethod === "kaspi" && (
              <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
                <Smartphone className="h-3 w-3" /> Kaspi — оплачено
              </Badge>
            )}
            {paymentMethod === "cash" && (
              <Badge variant="outline" className="gap-1">
                <Banknote className="h-3 w-3" /> Наличные при доставке
              </Badge>
            )}
          </div>
          <div className="flex gap-3 flex-col">
            <Button onClick={() => navigate("/orders")} data-testid="button-view-orders">
              Отслеживать заказ
            </Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              Продолжить покупки
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "processing") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          {paymentMethod === "kaspi" ? (
            <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Smartphone className="h-7 w-7 text-amber-600 animate-pulse" />
            </div>
          ) : (
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
          )}
          <h2 className="text-lg font-semibold mb-1">
            {paymentMethod === "kaspi" ? "Kaspi подтверждает оплату…" : "Обработка платежа…"}
          </h2>
          <p className="text-sm text-muted-foreground">Пожалуйста, подождите</p>
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
          <h1 className="font-semibold">{step === "payment" ? "Оплата" : t("checkout")}</h1>
          <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <span className={step === "details" ? "text-primary font-medium" : ""}>1. Детали</span>
            <span>→</span>
            <span className={step === "payment" ? "text-primary font-medium" : ""}>2. Оплата</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Order summary */}
        <Card className="mb-6">
          <CardContent className="py-4 px-4">
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              {t("order_summary")}
            </h3>
            <div className="space-y-2 mb-3">
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

            {/* Price breakdown */}
            <div className="bg-muted/40 rounded-xl p-3 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Сумма блюд</span>
                <span>{subtotal.toFixed(0)} ₸</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Комиссия платформы (10%)</span>
                <span>+{platformFee.toFixed(0)} ₸</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Доставка</span>
                <span>+{deliveryFee.toFixed(0)} ₸</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>{t("total")}</span>
                <span className="text-primary" data-testid="text-checkout-total">{grandTotal.toFixed(0)} ₸</span>
              </div>
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
              Перейти к оплате — {grandTotal.toFixed(0)} ₸
            </Button>
          </>
        )}

        {step === "payment" && (
          <>
            {/* Payment method selector */}
            <Card className="mb-4">
              <CardContent className="py-4 px-4">
                <p className="text-sm font-medium mb-3">Способ оплаты</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}
                    data-testid="button-pay-card"
                  >
                    <CreditCard className={`h-5 w-5 ${paymentMethod === "card" ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-xs font-medium">Карта</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPaymentMethod("kaspi"); setKaspiConfirmed(false); }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${paymentMethod === "kaspi" ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20" : "border-border hover:border-muted-foreground/30"}`}
                    data-testid="button-pay-kaspi"
                  >
                    <div className={`h-5 w-5 flex items-center justify-center ${paymentMethod === "kaspi" ? "text-amber-600" : "text-muted-foreground"}`}>
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <span className={`text-xs font-medium ${paymentMethod === "kaspi" ? "text-amber-700" : ""}`}>Kaspi QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${paymentMethod === "cash" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}
                    data-testid="button-pay-cash"
                  >
                    <Banknote className={`h-5 w-5 ${paymentMethod === "cash" ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-xs font-medium">Наличные</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Card payment form */}
            {paymentMethod === "card" && (
              <Card className="mb-6">
                <CardContent className="py-4 px-4 space-y-4">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Данные карты
                  </p>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Номер карты</label>
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
                      <label className="text-xs text-muted-foreground mb-1 block">Срок действия</label>
                      <Input
                        placeholder="ММ/ГГ"
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
                    🔒 Демонстрационная оплата. Реальных списаний не происходит.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Kaspi QR payment */}
            {paymentMethod === "kaspi" && (
              <Card className="mb-6 border-amber-200 dark:border-amber-800">
                <CardContent className="py-4 px-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center">
                      <QrCode className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Kaspi QR</p>
                      <p className="text-xs text-muted-foreground">Оплатите через приложение Kaspi.kz</p>
                    </div>
                  </div>

                  {/* Fake QR Code */}
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=kaspi://pay?amount=${grandTotal}&merchant=LocalTaste&order=LT${Date.now()}`}
                        alt="Kaspi QR Code"
                        className="rounded-xl border-4 border-amber-100 dark:border-amber-900"
                        width={160}
                        height={160}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-8 w-8 bg-white rounded-md flex items-center justify-center shadow">
                          <span className="text-amber-600 font-black text-xs">K</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center mb-4">
                    <p className="text-xl font-bold text-amber-600">{grandTotal.toFixed(0)} ₸</p>
                    <p className="text-xs text-muted-foreground mt-1">Сканируйте QR-код в приложении Kaspi.kz</p>
                  </div>

                  <div className="mb-4">
                    <label className="text-xs text-muted-foreground mb-1 block">Ваш номер телефона Kaspi</label>
                    <Input
                      placeholder="+7 777 123 45 67"
                      value={kaspiPhone}
                      onChange={(e) => setKaspiPhone(formatPhone(e.target.value))}
                      maxLength={12}
                      data-testid="input-kaspi-phone"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setKaspiConfirmed(!kaspiConfirmed)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${kaspiConfirmed ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20" : "border-border"}`}
                    data-testid="button-kaspi-confirm"
                  >
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${kaspiConfirmed ? "border-amber-500 bg-amber-500" : "border-muted-foreground"}`}>
                      {kaspiConfirmed && <CheckCircle2 className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-sm">Я подтверждаю оплату {grandTotal.toFixed(0)} ₸ через Kaspi</span>
                  </button>

                  <p className="text-xs text-center text-muted-foreground mt-3">
                    🔒 Демонстрационная оплата. Реальных списаний не происходит.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Cash payment info */}
            {paymentMethod === "cash" && (
              <Card className="mb-6">
                <CardContent className="py-4 px-4">
                  <div className="flex items-start gap-3">
                    <Banknote className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Оплата наличными</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Подготовьте <strong>{grandTotal.toFixed(0)} ₸</strong> наличными. Курьер примет оплату при доставке.
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
              {paymentMethod === "card" && `Оплатить ${grandTotal.toFixed(0)} ₸`}
              {paymentMethod === "kaspi" && `Подтвердить оплату Kaspi — ${grandTotal.toFixed(0)} ₸`}
              {paymentMethod === "cash" && `Оформить заказ — ${grandTotal.toFixed(0)} ₸`}
            </Button>
          </>
        )}
      </main>
    </div>
  );
}
