import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Users, ChefHat, Package, CheckCircle, XCircle,
  Shield, UserCog, TrendingUp, Star, BarChart2,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import type { CookProfile, User, Order } from "@shared/schema";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

type CookWithUser = CookProfile & { user: User };
type UserWithRole = { id: string; email: string; firstName: string | null; lastName: string | null; profileImageUrl: string | null; createdAt: string; role: string | null; phone: string | null };
type Stats = {
  totalUsers: number;
  totalCooks: number;
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: { status: string; count: number }[];
  topDishes: { dishId: number; name: string; count: number }[];
  recentOrders: { date: string; count: number; revenue: number }[];
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-800" },
  preparing: { label: "Preparing", color: "bg-purple-100 text-purple-800" },
  ready: { label: "Ready", color: "bg-indigo-100 text-indigo-800" },
  delivering: { label: "Delivering", color: "bg-sky-100 text-sky-800" },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
};

const roleColors: Record<string, string> = {
  client: "bg-gray-100 text-gray-800",
  cook: "bg-amber-100 text-amber-800",
  moderator: "bg-blue-100 text-blue-800",
  admin: "bg-purple-100 text-purple-800",
  support: "bg-green-100 text-green-800",
};

const PIE_COLORS = ["#f59e0b", "#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#ef4444"];

export default function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, lang } = useTranslation();

  const { data: pendingCooks, isLoading: cooksLoading } = useQuery<CookWithUser[]>({ queryKey: ["/api/admin/cooks/pending"] });
  const { data: allCooks } = useQuery<CookWithUser[]>({ queryKey: ["/api/admin/cooks"] });
  const { data: allOrders } = useQuery<Order[]>({ queryKey: ["/api/admin/orders"] });
  const { data: allUsers } = useQuery<UserWithRole[]>({ queryKey: ["/api/admin/users"] });
  const { data: stats } = useQuery<Stats>({ queryKey: ["/api/admin/stats"] });

  const updateCookStatus = useMutation({
    mutationFn: ({ cookId, status }: { cookId: number; status: string }) =>
      apiRequest("PATCH", `/api/admin/cooks/${cookId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cooks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cooks/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: t("cook_status_updated") });
    },
    onError: () => toast({ title: t("error"), description: t("update_error"), variant: "destructive" }),
  });

  const updateUserRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: t("role_updated") });
    },
    onError: () => toast({ title: t("error"), description: t("update_error"), variant: "destructive" }),
  });

  const pieData = stats?.ordersByStatus?.map((s) => ({
    name: statusConfig[s.status]?.label || s.status,
    value: s.count,
  })) || [];

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
        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card>
            <CardContent className="py-3 px-4 text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
              <p className="text-xs text-muted-foreground">{t("total_users")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 px-4 text-center">
              <ChefHat className="h-5 w-5 mx-auto mb-1 text-amber-500" />
              <p className="text-2xl font-bold">{stats?.totalCooks || 0}</p>
              <p className="text-xs text-muted-foreground">{t("active_cooks")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 px-4 text-center">
              <Package className="h-5 w-5 mx-auto mb-1 text-purple-500" />
              <p className="text-2xl font-bold">{stats?.totalOrders || 0}</p>
              <p className="text-xs text-muted-foreground">{t("all_orders")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 px-4 text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <p className="text-2xl font-bold">{(stats?.totalRevenue || 0).toFixed(0)} ₸</p>
              <p className="text-xs text-muted-foreground">{t("platform_revenue")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts row */}
        {stats && (
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {/* Revenue over time */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart2 className="h-4 w-4" />
                  Orders (last 30 days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.recentOrders.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={stats.recentOrders} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(val: number, name: string) => [
                          name === "revenue" ? `${Number(val).toFixed(0)} ₸` : val,
                          name === "revenue" ? "Revenue" : "Orders",
                        ]}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#colorRevenue)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
                )}
              </CardContent>
            </Card>

            {/* Order status distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Orders by Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={10}>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
                )}
              </CardContent>
            </Card>

            {/* Top dishes */}
            {stats.topDishes.length > 0 && (
              <Card className="sm:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Top Dishes by Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={stats.topDishes} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="pending" data-testid="tab-pending">
              {t("pending_cooks")}
              {pendingCooks && pendingCooks.length > 0 && (
                <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-1.5">{pendingCooks.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="cooks" data-testid="tab-all-cooks">{t("all_cooks")}</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">{t("user_management")}</TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-all-orders">{t("all_orders")}</TabsTrigger>
          </TabsList>

          {/* Pending cooks */}
          <TabsContent value="pending">
            {cooksLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
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
                        <p className="text-sm text-muted-foreground truncate">{cook.user?.email}</p>
                        <p className="text-xs text-muted-foreground">{cook.specialization || t("no_specialization")}</p>
                        {cook.cuisineTypes && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {cook.cuisineTypes.map((c) => <Badge key={c} variant="outline" className="text-xs">{c}</Badge>)}
                          </div>
                        )}
                        {cook.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{cook.bio}</p>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm" onClick={() => updateCookStatus.mutate({ cookId: cook.id, status: "approved" })} data-testid={`button-approve-${cook.id}`}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {t("approve")}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateCookStatus.mutate({ cookId: cook.id, status: "rejected" })} data-testid={`button-reject-${cook.id}`}>
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

          {/* All cooks */}
          <TabsContent value="cooks">
            {allCooks && allCooks.length > 0 ? (
              <div className="space-y-2">
                {allCooks.map((cook) => (
                  <Card key={cook.id} data-testid={`card-cook-${cook.id}`}>
                    <CardContent className="flex items-center gap-4 py-3 px-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={cook.profileImage || cook.user?.profileImageUrl || undefined} />
                        <AvatarFallback><ChefHat className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{cook.displayName}</p>
                        <p className="text-xs text-muted-foreground">{cook.user?.email}</p>
                        {cook.specialization && <p className="text-xs text-muted-foreground">{cook.specialization}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{cook.totalOrders || 0} orders</span>
                        {Number(cook.rating) > 0 && (
                          <span className="flex items-center gap-0.5 text-xs text-amber-500">
                            <Star className="h-3 w-3 fill-amber-500" />
                            {Number(cook.rating).toFixed(1)}
                          </span>
                        )}
                        <Badge variant={cook.status === "approved" ? "default" : cook.status === "rejected" ? "destructive" : "secondary"}>
                          {cook.status}
                        </Badge>
                      </div>
                      {cook.status !== "approved" && (
                        <Button size="sm" variant="outline" onClick={() => updateCookStatus.mutate({ cookId: cook.id, status: "approved" })}>
                          Approve
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center py-12 text-muted-foreground">{t("no_cooks")}</p>
            )}
          </TabsContent>

          {/* User management */}
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
                      <Select value={u.role || "client"} onValueChange={(newRole) => updateUserRole.mutate({ userId: u.id, role: newRole })}>
                        <SelectTrigger className="w-28 h-8 text-xs" data-testid={`select-role-${u.id}`}>
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

          {/* All orders */}
          <TabsContent value="orders">
            {allOrders && allOrders.length > 0 ? (
              <div className="space-y-2">
                {allOrders.map((order: any) => {
                  const status = statusConfig[order.status] || statusConfig.pending;
                  return (
                    <Card key={order.id}>
                      <CardContent className="flex items-center justify-between gap-4 py-3 px-4">
                        <div className="min-w-0">
                          <span className="font-medium text-sm">Order #{order.id}</span>
                          {order.cookProfile && (
                            <p className="text-xs text-muted-foreground">{order.cookProfile.displayName}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US") : ""}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${status.color}`}>
                          {status.label}
                        </span>
                        <span className="font-semibold flex-shrink-0">{Number(order.totalAmount).toFixed(0)} ₸</span>
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
