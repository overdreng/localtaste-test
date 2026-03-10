import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Dish, Order, OrderItem, User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";

type OrderWithDetails = Order & {
    items: (OrderItem & { dish: Dish })[];
    client: User;
};

const statuses = ["confirmed", "preparing", "ready", "delivering", "delivered"];

export function OrdersTab() {
    const queryClient = useQueryClient();
    const { data: orders, isLoading } = useQuery<OrderWithDetails[]>({ queryKey: ["/api/cook/orders"] });

    const updateStatus = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) =>
            apiRequest("PATCH", `/api/cook/orders/${id}/status`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/cook/orders"] });
        },
    });

    return (
        <Card className="rounded-xl shadow-sm">
            <CardHeader>
                <CardTitle>Orders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading && <p>Loading orders...</p>}
                {orders?.map((order) => (
                    <div key={order.id} className="rounded-xl border p-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold">Order #{order.id}</h4>
                            <Select value={order.status} onValueChange={(value) => updateStatus.mutate({ id: order.id, status: value })}>
                                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {statuses.map((status) => (
                                        <SelectItem key={status} value={status}>{status}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-sm text-muted-foreground">Client: {order.client?.firstName || order.client?.email}</p>
                        <div className="space-y-1">
                            {order.items?.map((item) => (
                                <p className="text-sm" key={item.id}>{item.dish?.name} x {item.quantity}</p>
                            ))}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
