import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Dish, Order, OrderItem, User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Package, Clock, MapPin, User as UserIcon, ChefHat } from "lucide-react";

type OrderWithDetails = Order & {
  items: (OrderItem & { dish: Dish })[];
  client: User;
};

const statuses = ["confirmed", "preparing", "ready", "delivering", "delivered"];

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "New Order", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  preparing: { label: "Preparing", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  ready: { label: "Ready", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" },
  delivering: { label: "Delivering", color: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300" },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
};

export function OrdersTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: orders, isLoading } = useQuery<OrderWithDetails[]>({ queryKey: ["/api/cook/orders"] });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/cook/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cook/orders"] });
      toast({ title: "Order status updated" });
    },
    onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
  });

  const activeOrders = orders?.filter((o) => !["delivered", "cancelled"].includes(o.status)) || [];
  const pastOrders = orders?.filter((o) => ["delivered", "cancelled"].includes(o.status)) || [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
      </div>
    );
  }

  if (!orders?.length) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-xl">
        <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
        <p className="font-medium text-muted-foreground">No orders yet</p>
        <p className="text-sm text-muted-foreground/60 mt-1">New orders will appear here</p>
      </div>
    );
  }

  const OrderCard = ({ order }: { order: OrderWithDetails }) => {
    const status = statusConfig[order.status] || statusConfig.pending;
    const isFinished = ["delivered", "cancelled"].includes(order.status);

    return (
      <Card key={order.id} className="rounded-xl" data-testid={`card-order-${order.id}`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="font-semibold">Order #{order.id}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>
              {order.paymentStatus === "paid" && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Paid</span>
              )}
            </div>
            <span className="font-semibold text-lg">{Number(order.totalAmount).toFixed(0)} ₸</span>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <UserIcon className="h-3 w-3" />
              {order.client?.firstName || order.client?.email || "Client"}
            </span>
            {order.deliveryAddress && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {order.deliveryAddress}
              </span>
            )}
            {order.createdAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(order.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>

          <div className="space-y-1">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span>{item.dish?.name || "Dish"} <span className="text-muted-foreground">×{item.quantity}</span></span>
                <span className="text-muted-foreground">{(Number(item.priceAtOrder) * item.quantity).toFixed(0)} ₸</span>
              </div>
            ))}
          </div>

          {order.comment && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1.5">💬 {order.comment}</p>
          )}

          {!isFinished && (
            <Select
              value={order.status}
              onValueChange={(value) => updateStatus.mutate({ id: order.id, status: value })}
            >
              <SelectTrigger className="w-full" data-testid={`select-status-${order.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>{statusConfig[s]?.label || s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {activeOrders.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Active Orders ({activeOrders.length})
          </h3>
          {activeOrders.map((order) => <OrderCard key={order.id} order={order} />)}
        </div>
      )}

      {pastOrders.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Past Orders ({pastOrders.length})
          </h3>
          {pastOrders.map((order) => <OrderCard key={order.id} order={order} />)}
        </div>
      )}
    </div>
  );
}
