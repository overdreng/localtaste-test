import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Users, ChefHat, Package, CheckCircle, XCircle, Shield, UserCog,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import type { CookProfile, User, Order } from "@shared/schema";

type CookWithUser = CookProfile & { user: User };

type UserWithRole = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: string;
  role: string | null;
  phone: string | null;
};

export default function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, lang } = useTranslation();

  const { data: pendingCooks, isLoading: cooksLoading } = useQuery<CookWithUser[]>({
    queryKey: ["/api/admin/cooks/pending"],
  });

  const { data: allCooks } = useQuery<CookWithUser[]>({
    queryKey: ["/api/admin/cooks"],
  });

  const { data: allOrders } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
  });

  const { data: allUsers } = useQuery<UserWithRole[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: stats } = useQuery<{
    totalUsers: number;
    totalCooks: number;
    totalOrders: number;
    totalRevenue: number;
  }>({
    queryKey: ["/api/admin/stats"],
  });

  const updateCookStatus = useMutation({
    mutationFn: ({ cookId, status }: { cookId: number; status: string }) =>
      apiRequest("PATCH", `/api/admin/cooks/${cookId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cooks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cooks/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: t("cook_status_updated") });
    },
    onError: () => {
      toast({ title: t("error"), description: t("update_error"), variant: "destructive" });
    },
  });

  const updateUserRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: t("role_updated") });
    },
    onError: () => {
      toast({ title: t("error"), description: t("update_error"), variant: "destructive" });
    },
  });

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: t("status_pending"), color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
    confirmed: { label: t("status_confirmed"), color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
    preparing: { label: t("status_preparing"), color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
    ready: { label: t("status_ready"), color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" },
    delivering: { label: t("status_delivering"), color: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300" },
    delivered: { label: t("status_delivered"), color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
    cancelled: { label: t("status_cancelled"), color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  };

  const roleColors: Record<string, string> = {
    client: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
    cook: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    moderator: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    admin: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    support: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/">
            <Button size="icon" variant="ghost" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="font-semibold">{t("admin_panel")}</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card>
            <CardContent className="py-3 px-4 text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
              <p className="text-xs text-muted-foreground">{t("total_users")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 px-4 text-center">
              <ChefHat className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">{stats?.totalCooks || 0}</p>
              <p className="text-xs text-muted-foreground">{t("active_cooks")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 px-4 text-center">
              <Package className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">{stats?.totalOrders || 0}</p>
              <p className="text-xs text-muted-foreground">{t("all_orders")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 px-4 text-center">
              <p className="text-2xl font-bold">{(stats?.totalRevenue || 0).toFixed(0)} ₸</p>
              <p className="text-xs text-muted-foreground">{t("platform_revenue")}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="pending" data-testid="tab-pending">
              {t("pending_cooks")}
              {pendingCooks && pendingCooks.length > 0 && (
                <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-1.5">
                  {pendingCooks.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="cooks" data-testid="tab-all-cooks">{t("all_cooks")}</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">{t("user_management")}</TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-all-orders">{t("all_orders")}</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {cooksLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : pendingCooks && pendingCooks.length > 0 ? (
              <div className="space-y-3">
                {pendingCooks.map((cook) => (
                  <Card key={cook.id} data-testid={`card-pending-cook-${cook.id}`}>
                    <CardContent className="flex items-center gap-4 py-4 px-4">
                      <Avatar>
                        <AvatarImage src={cook.profileImage || cook.user?.profileImageUrl || undefined} />
                        <AvatarFallback><ChefHat className="h-5 w-5" /></AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{cook.displayName}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {cook.specialization || t("no_specialization")}
                        </p>
                        {cook.cuisineTypes && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {cook.cuisineTypes.map((c) => (
                              <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateCookStatus.mutate({ cookId: cook.id, status: "approved" })}
                          data-testid={`button-approve-${cook.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {t("approve")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCookStatus.mutate({ cookId: cook.id, status: "rejected" })}
                          data-testid={`button-reject-${cook.id}`}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          {t("reject")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">{t("no_pending")}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cooks">
            {allCooks && allCooks.length > 0 ? (
              <div className="space-y-3">
                {allCooks.map((cook) => (
                  <Card key={cook.id} data-testid={`card-cook-${cook.id}`}>
                    <CardContent className="flex items-center gap-4 py-3 px-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={cook.profileImage || cook.user?.profileImageUrl || undefined} />
                        <AvatarFallback><ChefHat className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{cook.displayName}</p>
                        <p className="text-xs text-muted-foreground">{cook.specialization}</p>
                      </div>
                      <Badge
                        variant={cook.status === "approved" ? "default" : cook.status === "rejected" ? "destructive" : "secondary"}
                      >
                        {cook.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center py-12 text-muted-foreground">{t("no_cooks")}</p>
            )}
          </TabsContent>

          <TabsContent value="users">
            {allUsers && allUsers.length > 0 ? (
              <div className="space-y-2">
                {allUsers.map((u) => (
                  <Card key={u.id} data-testid={`card-user-${u.id}`}>
                    <CardContent className="flex items-center gap-3 py-3 px-4">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={u.profileImageUrl || undefined} />
                        <AvatarFallback><UserCog className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {u.firstName || u.lastName ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : u.email}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[u.role || "client"]}`}>
                        {u.role || "client"}
                      </span>
                      <Select
                        value={u.role || "client"}
                        onValueChange={(newRole) => updateUserRole.mutate({ userId: u.id, role: newRole })}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs" data-testid={`select-role-${u.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">{t("role_client")}</SelectItem>
                          <SelectItem value="cook">{t("role_cook")}</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="support">Support</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center py-12 text-muted-foreground">{t("loading")}</p>
            )}
          </TabsContent>

          <TabsContent value="orders">
            {allOrders && allOrders.length > 0 ? (
              <div className="space-y-3">
                {allOrders.map((order) => {
                  const status = statusLabels[order.status] || statusLabels.pending;
                  return (
                    <Card key={order.id}>
                      <CardContent className="flex items-center justify-between gap-4 py-3 px-4">
                        <div>
                          <span className="font-medium text-sm">{t("order")} #{order.id}</span>
                          <p className="text-xs text-muted-foreground">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US") : ""}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                        <span className="font-medium">
                          {Number(order.totalAmount).toFixed(0)} ₸
                        </span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-12 text-muted-foreground">{t("no_orders")}</p>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
