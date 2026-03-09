import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Package, Star, ChefHat } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n";
import type { Order, OrderItem, Dish, CookProfile } from "@shared/schema";

type OrderWithDetails = Order & {
  items: (OrderItem & { dish: Dish })[];
  cookProfile: CookProfile;
};

export default function OrdersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, lang } = useTranslation();
  const [reviewOrder, setReviewOrder] = useState<OrderWithDetails | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: t("status_pending"), color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
    confirmed: { label: t("status_confirmed"), color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
    preparing: { label: t("status_preparing"), color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
    ready: { label: t("status_ready"), color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" },
    delivering: { label: t("status_delivering"), color: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300" },
    delivered: { label: t("status_delivered"), color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
    cancelled: { label: t("status_cancelled"), color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  };

  const prevOrderStatuses = useRef<Record<number, string>>({});

  const { data: orders, isLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/orders"],
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (!orders) return;
    const prev = prevOrderStatuses.current;
    orders.forEach((order) => {
      if (prev[order.id] && prev[order.id] !== order.status) {
        const statusInfo = statusLabels[order.status];
        toast({
          title: `${t("order")} #${order.id}`,
          description: statusInfo?.label || order.status,
        });
      }
      prev[order.id] = order.status;
    });
  }, [orders]);

  const cancelOrder = useMutation({
    mutationFn: (orderId: number) =>
      apiRequest("PATCH", `/api/orders/${orderId}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: t("order_cancelled") });
    },
  });

  const submitReview = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/reviews", {
        cookProfileId: reviewOrder!.cookProfileId,
        orderId: reviewOrder!.id,
        rating: reviewRating,
        comment: reviewComment,
      }),
    onSuccess: () => {
      setReviewOrder(null);
      setReviewComment("");
      setReviewRating(5);
      toast({ title: t("review_submitted"), description: t("review_thanks") });
    },
    onError: () => {
      toast({ title: t("error"), description: t("review_error"), variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 mb-3" />
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
          <h1 className="font-semibold">{t("my_orders")}</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {!orders || orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">{t("no_orders")}</h3>
            <p className="text-muted-foreground text-sm mb-6">
              {t("order_history_desc")}
            </p>
            <Link href="/">
              <Button data-testid="button-browse">{t("browse_menu")}</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = statusLabels[order.status] || statusLabels.pending;
              return (
                <Card key={order.id} data-testid={`card-order-${order.id}`}>
                  <CardContent className="py-4 px-4">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {t("order")} #{order.id}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US")
                          : ""}
                      </span>
                    </div>

                    {order.cookProfile && (
                      <div className="flex items-center gap-2 mb-3">
                        <ChefHat className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {order.cookProfile.displayName}
                        </span>
                      </div>
                    )}

                    <div className="space-y-1 mb-3">
                      {order.items?.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-muted-foreground">
                            {item.dish?.name} x{item.quantity}
                          </span>
                          <span>
                            {(Number(item.priceAtOrder) * item.quantity).toFixed(0)} {t("rub")}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t">
                      <span className="font-bold">
                        {Number(order.totalAmount).toFixed(0)} {t("rub")}
                      </span>
                      <div className="flex gap-2">
                        {order.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelOrder.mutate(order.id)}
                            disabled={cancelOrder.isPending}
                            data-testid={`button-cancel-${order.id}`}
                          >
                            {t("cancel")}
                          </Button>
                        )}
                        {order.status === "delivered" && (
                          <Button
                            size="sm"
                            onClick={() => setReviewOrder(order)}
                            data-testid={`button-review-${order.id}`}
                          >
                            <Star className="h-4 w-4 mr-1" />
                            {t("review")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={!!reviewOrder} onOpenChange={() => setReviewOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("leave_review")}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm text-muted-foreground block mb-2">
                {t("rating")}
              </label>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setReviewRating(i + 1)}
                    className="p-1"
                    data-testid={`button-star-${i + 1}`}
                  >
                    <Star
                      className={`h-6 w-6 ${
                        i < reviewRating
                          ? "text-amber-500 fill-amber-500"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-2">
                {t("comment")}
              </label>
              <Textarea
                placeholder={t("share_experience")}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="resize-none"
                data-testid="input-review-comment"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOrder(null)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={() => submitReview.mutate()}
              disabled={submitReview.isPending}
              data-testid="button-submit-review"
            >
              {t("submit_review")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
