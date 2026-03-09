import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Plus, ChefHat, Package, DollarSign, Star, TrendingUp,
  LayoutDashboard, UtensilsCrossed, ClipboardList, BarChart3,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useUpload } from "@/hooks/use-upload";
import { useTranslation } from "@/lib/i18n";
import type { Dish, Order, CookProfile, OrderItem, User } from "@shared/schema";

type OrderWithDetails = Order & {
  items: (OrderItem & { dish: Dish })[];
  client: User;
};

export default function CookDashboardPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, lang } = useTranslation();
  const [, navigate] = useLocation();
  const params = useParams<{ tab?: string }>();
  const activeTab = params?.tab || "overview";
  const [showAddDish, setShowAddDish] = useState(false);
  const [dishPhotos, setDishPhotos] = useState<string[]>([]);

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: t("status_pending"), color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
    confirmed: { label: t("status_confirmed"), color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
    preparing: { label: t("status_preparing"), color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
    ready: { label: t("status_ready"), color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" },
    delivering: { label: t("status_delivering"), color: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300" },
    delivered: { label: t("status_delivered"), color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
    cancelled: { label: t("status_cancelled"), color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  };

  const { uploadFile, isUploading: photoUploading } = useUpload({
    onSuccess: (response) => {
      setDishPhotos((prev) => [...prev, response.objectPath]);
    },
  });

  const { data: cookProfile, isLoading: profileLoading } = useQuery<CookProfile>({
    queryKey: ["/api/cook/profile"],
  });

  const { data: cookDishes, isLoading: dishesLoading } = useQuery<Dish[]>({
    queryKey: ["/api/cook/dishes"],
  });

  const { data: cookOrders, isLoading: ordersLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/cook/orders"],
  });

  const [dishForm, setDishForm] = useState({
    name: "", description: "", ingredients: "", price: "",
    cookingTime: "", weight: "", calories: "", protein: "",
    fat: "", carbs: "", cuisineType: "", categoryId: "",
    portions: "1", availablePortions: "10",
  });

  const createDish = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/cook/dishes", {
        ...dishForm,
        price: dishForm.price,
        cookingTime: dishForm.cookingTime ? Number(dishForm.cookingTime) : undefined,
        weight: dishForm.weight ? Number(dishForm.weight) : undefined,
        calories: dishForm.calories ? Number(dishForm.calories) : undefined,
        protein: dishForm.protein || undefined,
        fat: dishForm.fat || undefined,
        carbs: dishForm.carbs || undefined,
        categoryId: dishForm.categoryId ? Number(dishForm.categoryId) : undefined,
        portions: Number(dishForm.portions) || 1,
        availablePortions: Number(dishForm.availablePortions) || 10,
        photos: dishPhotos.length > 0 ? dishPhotos : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cook/dishes"] });
      setShowAddDish(false);
      setDishForm({
        name: "", description: "", ingredients: "", price: "",
        cookingTime: "", weight: "", calories: "", protein: "",
        fat: "", carbs: "", cuisineType: "", categoryId: "",
        portions: "1", availablePortions: "10",
      });
      setDishPhotos([]);
      toast({ title: t("dish_created") });
    },
    onError: () => {
      toast({ title: t("error"), description: t("dish_error"), variant: "destructive" });
    },
  });

  const updateOrderStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      apiRequest("PATCH", `/api/cook/orders/${orderId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cook/orders"] });
      toast({ title: t("order_updated") });
    },
  });

  const toggleDish = useMutation({
    mutationFn: ({ dishId, isAvailable }: { dishId: number; isAvailable: boolean }) =>
      apiRequest("PATCH", `/api/cook/dishes/${dishId}`, { isAvailable }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cook/dishes"] });
    },
  });

  const nextStatus: Record<string, string> = {
    pending: "confirmed",
    confirmed: "preparing",
    preparing: "ready",
    ready: "delivering",
    delivering: "delivered",
  };

  const nextStatusLabel = (next: string) => {
    switch (next) {
      case "confirmed": return t("accept");
      case "preparing": return t("start_cooking");
      case "ready": return t("mark_ready");
      case "delivering": return t("send_delivery");
      default: return t("mark_delivered");
    }
  };

  if (profileLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-32 mb-4" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!cookProfile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <ChefHat className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">{t("no_cook_profile")}</h3>
        <p className="text-muted-foreground text-sm mb-6">{t("apply_first")}</p>
        <Link href="/become-cook">
          <Button>{t("apply_now")}</Button>
        </Link>
      </div>
    );
  }

  const totalRevenue = cookOrders
    ?.filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + Number(o.totalAmount), 0) || 0;

  const activeOrdersCount = cookOrders?.filter(
    (o) => !["delivered", "cancelled"].includes(o.status)
  ).length || 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/">
            <Button size="icon" variant="ghost" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold">{t("cook_dashboard")}</h1>
          {cookProfile.status === "pending" && (
            <Badge variant="secondary" className="ml-auto">{t("under_review")}</Badge>
          )}
          {cookProfile.status === "approved" && (
            <Badge className="ml-auto">{t("approved")}</Badge>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {[
            { key: "overview", icon: LayoutDashboard, label: t("overview") },
            { key: "orders", icon: ClipboardList, label: t("order_management") },
            { key: "menu", icon: UtensilsCrossed, label: t("menu_management") },
            { key: "stats", icon: BarChart3, label: t("statistics") },
          ].map(({ key, icon: Icon, label }) => (
            <Button
              key={key}
              variant={activeTab === key ? "default" : "outline"}
              size="sm"
              className="flex-shrink-0"
              onClick={() => navigate(key === "overview" ? "/dashboard" : `/dashboard/${key}`)}
              data-testid={`tab-${key}`}
            >
              <Icon className="h-4 w-4 mr-1" />
              {label}
            </Button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card>
                <CardContent className="py-3 px-4 text-center">
                  <Package className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-2xl font-bold">{activeOrdersCount}</p>
                  <p className="text-xs text-muted-foreground">{t("active_orders")}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-3 px-4 text-center">
                  <TrendingUp className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-2xl font-bold">{cookProfile.totalOrders || 0}</p>
                  <p className="text-xs text-muted-foreground">{t("total_orders")}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-3 px-4 text-center">
                  <DollarSign className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-2xl font-bold">{totalRevenue.toFixed(0)} ₸</p>
                  <p className="text-xs text-muted-foreground">{t("earnings")}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-3 px-4 text-center">
                  <Star className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                  <p className="text-2xl font-bold">{Number(cookProfile.rating || 0).toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">{t("rating")}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="py-4 px-4">
                <h3 className="font-medium mb-3">{t("active_orders")}</h3>
                {cookOrders?.filter(o => !["delivered", "cancelled"].includes(o.status)).slice(0, 3).map((order) => {
                  const status = statusLabels[order.status] || statusLabels.pending;
                  return (
                    <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <span className="text-sm font-medium">{t("order")} #{order.id}</span>
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>
                      </div>
                      <span className="text-sm font-medium">{Number(order.totalAmount).toFixed(0)} ₸</span>
                    </div>
                  );
                }) || null}
                {activeOrdersCount === 0 && <p className="text-sm text-muted-foreground">{t("no_orders_cook")}</p>}
                {activeOrdersCount > 3 && (
                  <Button variant="link" size="sm" className="mt-2 p-0" onClick={() => navigate("/dashboard/orders")}>
                    {t("order_management")} →
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "orders" && (
          <div>
            {ordersLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : cookOrders && cookOrders.length > 0 ? (
              <div className="space-y-3">
                {cookOrders.map((order) => {
                  const status = statusLabels[order.status] || statusLabels.pending;
                  const next = nextStatus[order.status];
                  return (
                    <Card key={order.id} data-testid={`card-cook-order-${order.id}`}>
                      <CardContent className="py-4 px-4">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{t("order")} #{order.id}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {order.createdAt ? new Date(order.createdAt).toLocaleString(lang === "ru" ? "ru-RU" : "en-US") : ""}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                          <span>{t("client_label")}: {order.client?.firstName || t("default_customer")}</span>
                        </div>

                        <div className="space-y-1 mb-3">
                          {order.items?.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>{item.dish?.name} x{item.quantity}</span>
                              <span>{(Number(item.priceAtOrder) * item.quantity).toFixed(0)} ₸</span>
                            </div>
                          ))}
                        </div>

                        {order.deliveryAddress && (
                          <p className="text-xs text-muted-foreground mb-2">
                            {t("delivery")}: {order.deliveryAddress}
                          </p>
                        )}
                        {order.comment && (
                          <p className="text-xs text-muted-foreground mb-2">
                            {t("comment")}: {order.comment}
                          </p>
                        )}

                        <div className="flex items-center justify-between gap-2 pt-2 border-t">
                          <span className="font-bold">{Number(order.totalAmount).toFixed(0)} ₸</span>
                          <div className="flex gap-2">
                            {order.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateOrderStatus.mutate({ orderId: order.id, status: "cancelled" })}
                                data-testid={`button-reject-${order.id}`}
                              >
                                {t("reject")}
                              </Button>
                            )}
                            {next && (
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus.mutate({ orderId: order.id, status: next })}
                                data-testid={`button-next-status-${order.id}`}
                              >
                                {nextStatusLabel(next)}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">{t("no_orders_cook")}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "menu" && (
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="font-medium">{t("your_dishes")}</h3>
              <Button size="sm" onClick={() => setShowAddDish(true)} data-testid="button-add-dish">
                <Plus className="h-4 w-4 mr-1" />
                {t("add_dish")}
              </Button>
            </div>

            {dishesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : cookDishes && cookDishes.length > 0 ? (
              <div className="space-y-3">
                {cookDishes.map((dish) => (
                  <Card key={dish.id} data-testid={`card-menu-dish-${dish.id}`}>
                    <CardContent className="flex items-center gap-3 py-3 px-4">
                      <div className="w-14 h-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        <img src={dish.photos?.[0] || "/images/dish-pelmeni.png"} alt={dish.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{dish.name}</p>
                        <p className="text-sm text-muted-foreground">{Number(dish.price).toFixed(0)} ₸</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {dish.isAvailable ? t("active") : t("hidden")}
                        </span>
                        <Switch
                          checked={dish.isAvailable ?? false}
                          onCheckedChange={(checked) => toggleDish.mutate({ dishId: dish.id, isAvailable: checked })}
                          data-testid={`switch-dish-${dish.id}`}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ChefHat className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground mb-3">{t("no_dishes_cook")}</p>
                <Button onClick={() => setShowAddDish(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t("add_first_dish")}
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "stats" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card>
                <CardContent className="py-3 px-4 text-center">
                  <DollarSign className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-2xl font-bold">{totalRevenue.toFixed(0)} ₸</p>
                  <p className="text-xs text-muted-foreground">{t("earnings")} ({t("all_time")})</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-3 px-4 text-center">
                  <TrendingUp className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-2xl font-bold">{cookProfile.totalOrders || 0}</p>
                  <p className="text-xs text-muted-foreground">{t("total_orders")}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-3 px-4 text-center">
                  <Star className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                  <p className="text-2xl font-bold">{Number(cookProfile.rating || 0).toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">{t("rating")}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-3 px-4 text-center">
                  <Package className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-2xl font-bold">{cookDishes?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">{t("menu_management")}</p>
                </CardContent>
              </Card>
            </div>

            {cookDishes && cookDishes.length > 0 && (
              <Card>
                <CardContent className="py-4 px-4">
                  <h3 className="font-medium mb-3">{t("top_dishes")}</h3>
                  <div className="space-y-2">
                    {cookDishes.slice(0, 5).map((dish) => (
                      <div key={dish.id} className="flex items-center justify-between text-sm">
                        <span>{dish.name}</span>
                        <span className="font-medium">{Number(dish.price).toFixed(0)} ₸</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      <Dialog open={showAddDish} onOpenChange={setShowAddDish}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("add_new_dish")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium block mb-1">{t("dish_name")} *</label>
              <Input value={dishForm.name} onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })} placeholder={t("dish_name_placeholder")} data-testid="input-dish-name" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">{t("description")}</label>
              <Textarea value={dishForm.description} onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })} placeholder={t("describe_dish")} className="resize-none" data-testid="input-dish-description" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">{t("ingredients")}</label>
              <Textarea value={dishForm.ingredients} onChange={(e) => setDishForm({ ...dishForm, ingredients: e.target.value })} placeholder={t("list_ingredients")} className="resize-none" data-testid="input-dish-ingredients" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1">{t("price_rub")} *</label>
                <Input type="number" value={dishForm.price} onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })} placeholder="350" data-testid="input-dish-price" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">{t("cooking_time")}</label>
                <Input type="number" value={dishForm.cookingTime} onChange={(e) => setDishForm({ ...dishForm, cookingTime: e.target.value })} placeholder="45" data-testid="input-dish-cooking-time" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1">{t("weight_g")}</label>
                <Input type="number" value={dishForm.weight} onChange={(e) => setDishForm({ ...dishForm, weight: e.target.value })} data-testid="input-dish-weight" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">{t("calories")}</label>
                <Input type="number" value={dishForm.calories} onChange={(e) => setDishForm({ ...dishForm, calories: e.target.value })} data-testid="input-dish-calories" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">{t("cuisine_type")}</label>
              <Input value={dishForm.cuisineType} onChange={(e) => setDishForm({ ...dishForm, cuisineType: e.target.value })} placeholder={t("cuisine_dish_placeholder")} data-testid="input-dish-cuisine" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">{t("photos")}</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {dishPhotos.map((p, i) => (
                  <div key={i} className="w-16 h-16 rounded-md overflow-hidden bg-muted">
                    <img src={p} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) uploadFile(file);
                  };
                  input.click();
                }}
                disabled={photoUploading}
                data-testid="button-upload-dish-photo"
              >
                {photoUploading ? t("uploading") : t("add_photo")}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDish(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={() => createDish.mutate()}
              disabled={createDish.isPending || !dishForm.name || !dishForm.price}
              data-testid="button-save-dish"
            >
              {createDish.isPending ? t("saving") : t("save_dish")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
