import {
  users,
  userProfiles,
  cookProfiles,
  categories,
  dishes,
  orders,
  orderItems,
  reviews,
  favorites,
  cartItems,
  notifications,
  type User,
  type UpsertUser,
  type UserProfile,
  type InsertUserProfile,
  type CookProfile,
  type InsertCookProfile,
  type Category,
  type InsertCategory,
  type Dish,
  type InsertDish,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type Review,
  type InsertReview,
  type Favorite,
  type InsertFavorite,
  type CartItem,
  type InsertCartItem,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, count, gte, lte, ilike, or } from "drizzle-orm";

export interface IStorage {
  // Users
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  upsertUserProfile(data: InsertUserProfile): Promise<UserProfile>;
  getAllUsers(): Promise<any[]>;

  // Cook profiles
  getCookProfile(id: number): Promise<CookProfile | undefined>;
  getCookProfileByUserId(userId: string): Promise<CookProfile | undefined>;
  createCookProfile(data: InsertCookProfile): Promise<CookProfile>;
  updateCookProfile(id: number, data: Partial<CookProfile>): Promise<CookProfile | undefined>;
  getCookProfileWithDetails(id: number): Promise<any>;
  getPendingCooks(): Promise<any[]>;
  getAllCooks(): Promise<any[]>;
  getApprovedCooksWithPreviews(filters?: { q?: string; cuisine?: string; minRating?: string; sort?: string }): Promise<any[]>;
  getCookStats(cookProfileId: number): Promise<any>;

  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(data: InsertCategory): Promise<Category>;

  // Dishes
  getDishes(filters?: { q?: string; category?: string; cuisine?: string; minPrice?: string; maxPrice?: string; sort?: string }): Promise<any[]>;
  getDish(id: number): Promise<any>;
  getDishReviews(dishId: number): Promise<any[]>;
  getDishesByCook(cookProfileId: number): Promise<Dish[]>;
  createDish(data: InsertDish): Promise<Dish>;
  updateDish(id: number, data: Partial<Dish>): Promise<Dish | undefined>;
  deleteDish(id: number): Promise<void>;

  // Cart
  getCartItems(userId: string): Promise<any[]>;
  getCartCount(userId: string): Promise<number>;
  addToCart(data: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem | undefined>;
  removeCartItem(id: number): Promise<void>;
  clearCart(userId: string): Promise<void>;

  // Orders
  createOrder(data: InsertOrder): Promise<Order>;
  createOrderItem(data: InsertOrderItem): Promise<OrderItem>;
  getOrdersByClient(clientId: string): Promise<any[]>;
  getOrdersByCook(cookProfileId: number): Promise<any[]>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  getAllOrders(): Promise<any[]>;

  // Reviews
  createReview(data: InsertReview): Promise<Review>;
  getReviewsByCook(cookProfileId: number): Promise<any[]>;

  // Favorites
  getUserFavorites(userId: string): Promise<any[]>;
  toggleFavorite(userId: string, dishId: number): Promise<void>;

  // Notifications
  createNotification(data: InsertNotification): Promise<Notification>;
  getNotifications(userId: string): Promise<Notification[]>;
  markNotificationRead(id: number): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;

  // Stats
  getStats(): Promise<any>;
  updateCookRating(cookProfileId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // ─── Users ────────────────────────────────────────────────────────────────

  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }

  async upsertUserProfile(data: InsertUserProfile): Promise<UserProfile> {
    const existing = await this.getUserProfile(data.userId);
    if (existing) {
      const [updated] = await db.update(userProfiles).set(data).where(eq(userProfiles.userId, data.userId)).returning();
      return updated;
    }
    const [profile] = await db.insert(userProfiles).values(data).returning();
    return profile;
  }

  async getAllUsers(): Promise<any[]> {
    return db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        createdAt: users.createdAt,
        role: userProfiles.role,
        phone: userProfiles.phone,
      })
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .orderBy(desc(users.createdAt));
  }

  // ─── Cook profiles ────────────────────────────────────────────────────────

  async getCookProfile(id: number): Promise<CookProfile | undefined> {
    const [profile] = await db.select().from(cookProfiles).where(eq(cookProfiles.id, id));
    return profile;
  }

  async getCookProfileByUserId(userId: string): Promise<CookProfile | undefined> {
    const [profile] = await db.select().from(cookProfiles).where(eq(cookProfiles.userId, userId));
    return profile;
  }

  async createCookProfile(data: InsertCookProfile): Promise<CookProfile> {
    const [profile] = await db.insert(cookProfiles).values(data).returning();
    return profile;
  }

  async updateCookProfile(id: number, data: Partial<CookProfile>): Promise<CookProfile | undefined> {
    const [updated] = await db.update(cookProfiles).set(data).where(eq(cookProfiles.id, id)).returning();
    return updated;
  }

  async getCookProfileWithDetails(id: number): Promise<any> {
    const [cook] = await db.select().from(cookProfiles).where(eq(cookProfiles.id, id));
    if (!cook) return undefined;
    const [rawUser] = await db.select().from(users).where(eq(users.id, cook.userId));
    const { password: _, ...user } = rawUser || ({} as any);
    const cookDishes = await db.select().from(dishes).where(and(eq(dishes.cookProfileId, id), eq(dishes.isAvailable, true)));
    const cookReviews = await this.getReviewsByCook(id);
    return { ...cook, user, dishes: cookDishes.map((d) => ({ ...d, cookProfile: cook })), reviews: cookReviews };
  }

  async getPendingCooks(): Promise<any[]> {
    const cooks = await db.select().from(cookProfiles).where(eq(cookProfiles.status, "pending"));
    return Promise.all(
      cooks.map(async (cook) => {
        const [rawUser] = await db.select().from(users).where(eq(users.id, cook.userId));
        const { password: _, ...user } = rawUser || ({} as any);
        return { ...cook, user };
      })
    );
  }

  async getAllCooks(): Promise<any[]> {
    const cooks = await db.select().from(cookProfiles).orderBy(desc(cookProfiles.id));
    return Promise.all(
      cooks.map(async (cook) => {
        const [rawUser] = await db.select().from(users).where(eq(users.id, cook.userId));
        const { password: _, ...user } = rawUser || ({} as any);
        return { ...cook, user };
      })
    );
  }

  async getApprovedCooksWithPreviews(filters: { q?: string; cuisine?: string; minRating?: string; sort?: string } = {}): Promise<any[]> {
    let query = db.select().from(cookProfiles).where(eq(cookProfiles.status, "approved")).$dynamic();

    const cooks = await query.orderBy(desc(cookProfiles.rating));

    let result = await Promise.all(
      cooks.map(async (cook) => {
        const [rawUser] = await db.select().from(users).where(eq(users.id, cook.userId));
        const { password: _, ...user } = rawUser || ({} as any);
        const cookDishes = await db.select().from(dishes).where(and(eq(dishes.cookProfileId, cook.id), eq(dishes.isAvailable, true)));
        const dishPreviews = cookDishes.slice(0, 3).flatMap((d) => d.photos?.[0] ? [d.photos[0]] : []);
        return { ...cook, user, dishCount: cookDishes.length, dishPreviews };
      })
    );

    if (filters.q) {
      const q = filters.q.toLowerCase();
      result = result.filter((c) => {
        const name = `${c.user?.firstName || ""} ${c.user?.lastName || ""} ${c.displayName}`.toLowerCase();
        const cuisine = (c.cuisineTypes || []).join(" ").toLowerCase();
        const spec = (c.specialization || "").toLowerCase();
        return name.includes(q) || cuisine.includes(q) || spec.includes(q);
      });
    }
    if (filters.cuisine) {
      result = result.filter((c) => (c.cuisineTypes || []).includes(filters.cuisine!));
    }
    if (filters.minRating) {
      const min = Number(filters.minRating);
      result = result.filter((c) => Number(c.rating || 0) >= min);
    }
    if (filters.sort === "orders") {
      result.sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0));
    } else if (filters.sort === "rating") {
      result.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }

    return result;
  }

  async getCookStats(cookProfileId: number): Promise<any> {
    const cookOrders = await db.select().from(orders).where(eq(orders.cookProfileId, cookProfileId));
    const totalRevenue = cookOrders
      .filter((o) => o.status === "delivered")
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const pendingOrders = cookOrders.filter((o) => o.status === "pending" || o.status === "confirmed" || o.status === "preparing").length;

    const [ratingResult] = await db
      .select({ avg: sql<number>`coalesce(avg(rating)::numeric, 0)` })
      .from(reviews)
      .where(eq(reviews.cookProfileId, cookProfileId));

    const reviewCount = await db.select({ count: sql<number>`count(*)::int` }).from(reviews).where(eq(reviews.cookProfileId, cookProfileId));

    return {
      totalRevenue,
      totalOrders: cookOrders.length,
      deliveredOrders: cookOrders.filter((o) => o.status === "delivered").length,
      pendingOrders,
      avgRating: Number(ratingResult?.avg || 0).toFixed(2),
      reviewCount: reviewCount[0]?.count || 0,
    };
  }

  // ─── Categories ───────────────────────────────────────────────────────────

  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(categories.sortOrder);
  }

  async createCategory(data: InsertCategory): Promise<Category> {
    const [cat] = await db.insert(categories).values(data).returning();
    return cat;
  }

  // ─── Dishes ───────────────────────────────────────────────────────────────

  async getDishes(filters: { q?: string; category?: string; cuisine?: string; minPrice?: string; maxPrice?: string; sort?: string } = {}): Promise<any[]> {
    const allDishes = await db.select().from(dishes).where(eq(dishes.isAvailable, true)).orderBy(desc(dishes.id));

    let result = (
      await Promise.all(
        allDishes.map(async (dish) => {
          const [cook] = await db
            .select()
            .from(cookProfiles)
            .where(and(eq(cookProfiles.id, dish.cookProfileId), eq(cookProfiles.status, "approved")));
          return cook ? { ...dish, cookProfile: cook } : null;
        })
      )
    ).filter(Boolean);

    if (filters.q) {
      const q = filters.q.toLowerCase();
      result = result.filter((d) => d!.name.toLowerCase().includes(q) || (d!.description || "").toLowerCase().includes(q));
    }
    if (filters.cuisine) {
      result = result.filter((d) => d!.cuisineType === filters.cuisine);
    }
    if (filters.minPrice) {
      result = result.filter((d) => Number(d!.price) >= Number(filters.minPrice));
    }
    if (filters.maxPrice) {
      result = result.filter((d) => Number(d!.price) <= Number(filters.maxPrice));
    }
    if (filters.sort === "price_asc") {
      result.sort((a, b) => Number(a!.price) - Number(b!.price));
    } else if (filters.sort === "price_desc") {
      result.sort((a, b) => Number(b!.price) - Number(a!.price));
    } else if (filters.sort === "newest") {
      result.sort((a, b) => b!.id - a!.id);
    }

    return result as any[];
  }

  async getDish(id: number): Promise<any> {
    const [dish] = await db.select().from(dishes).where(eq(dishes.id, id));
    if (!dish) return undefined;
    const [cook] = await db.select().from(cookProfiles).where(eq(cookProfiles.id, dish.cookProfileId));
    return { ...dish, cookProfile: cook };
  }

  async getDishReviews(dishId: number): Promise<any[]> {
    const dishReviews = await db.select().from(reviews).where(eq(reviews.dishId, dishId)).orderBy(desc(reviews.createdAt));
    return Promise.all(
      dishReviews.map(async (review) => {
        const [rawClient] = await db.select().from(users).where(eq(users.id, review.clientId));
        const { password: _, ...client } = rawClient || ({} as any);
        return { ...review, client };
      })
    );
  }

  async getDishesByCook(cookProfileId: number): Promise<Dish[]> {
    return db.select().from(dishes).where(eq(dishes.cookProfileId, cookProfileId)).orderBy(desc(dishes.id));
  }

  async createDish(data: InsertDish): Promise<Dish> {
    const [dish] = await db.insert(dishes).values(data).returning();
    return dish;
  }

  async updateDish(id: number, data: Partial<Dish>): Promise<Dish | undefined> {
    const [updated] = await db.update(dishes).set(data).where(eq(dishes.id, id)).returning();
    return updated;
  }

  async deleteDish(id: number): Promise<void> {
    await db.update(dishes).set({ isAvailable: false }).where(eq(dishes.id, id));
  }

  // ─── Cart ─────────────────────────────────────────────────────────────────

  async getCartItems(userId: string): Promise<any[]> {
    const items = await db.select().from(cartItems).where(eq(cartItems.userId, userId));
    return Promise.all(
      items.map(async (item) => {
        const [dish] = await db.select().from(dishes).where(eq(dishes.id, item.dishId));
        return { ...item, dish };
      })
    );
  }

  async getCartCount(userId: string): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(cartItems).where(eq(cartItems.userId, userId));
    return result?.count || 0;
  }

  async addToCart(data: InsertCartItem): Promise<CartItem> {
    const [existing] = await db.select().from(cartItems).where(and(eq(cartItems.userId, data.userId), eq(cartItems.dishId, data.dishId)));
    if (existing) {
      const [updated] = await db.update(cartItems).set({ quantity: existing.quantity + (data.quantity || 1) }).where(eq(cartItems.id, existing.id)).returning();
      return updated;
    }
    const [item] = await db.insert(cartItems).values(data).returning();
    return item;
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const [updated] = await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, id)).returning();
    return updated;
  }

  async removeCartItem(id: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  // ─── Orders ───────────────────────────────────────────────────────────────

  async createOrder(data: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(data).returning();
    return order;
  }

  async createOrderItem(data: InsertOrderItem): Promise<OrderItem> {
    const [item] = await db.insert(orderItems).values(data).returning();
    return item;
  }

  async getOrdersByClient(clientId: string): Promise<any[]> {
    const clientOrders = await db.select().from(orders).where(eq(orders.clientId, clientId)).orderBy(desc(orders.createdAt));
    return Promise.all(
      clientOrders.map(async (order) => {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
        const itemsWithDishes = await Promise.all(
          items.map(async (item) => {
            const [dish] = await db.select().from(dishes).where(eq(dishes.id, item.dishId));
            return { ...item, dish };
          })
        );
        const [cook] = await db.select().from(cookProfiles).where(eq(cookProfiles.id, order.cookProfileId));
        return { ...order, items: itemsWithDishes, cookProfile: cook };
      })
    );
  }

  async getOrdersByCook(cookProfileId: number): Promise<any[]> {
    const cookOrders = await db.select().from(orders).where(eq(orders.cookProfileId, cookProfileId)).orderBy(desc(orders.createdAt));
    return Promise.all(
      cookOrders.map(async (order) => {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
        const itemsWithDishes = await Promise.all(
          items.map(async (item) => {
            const [dish] = await db.select().from(dishes).where(eq(dishes.id, item.dishId));
            return { ...item, dish };
          })
        );
        const [rawClient] = await db.select().from(users).where(eq(users.id, order.clientId));
        const { password: _, ...client } = rawClient || ({} as any);
        return { ...order, items: itemsWithDishes, client };
      })
    );
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set({ status: status as any, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
    return updated;
  }

  async getAllOrders(): Promise<any[]> {
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    return Promise.all(
      allOrders.map(async (order) => {
        const [cook] = await db.select().from(cookProfiles).where(eq(cookProfiles.id, order.cookProfileId));
        return { ...order, cookProfile: cook };
      })
    );
  }

  // ─── Reviews ──────────────────────────────────────────────────────────────

  async createReview(data: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews).values(data).returning();
    await this.updateCookRating(data.cookProfileId);
    return review;
  }

  async getReviewsByCook(cookProfileId: number): Promise<any[]> {
    const cookReviews = await db.select().from(reviews).where(eq(reviews.cookProfileId, cookProfileId)).orderBy(desc(reviews.createdAt));
    return Promise.all(
      cookReviews.map(async (review) => {
        const [rawClient] = await db.select().from(users).where(eq(users.id, review.clientId));
        const { password: _, ...client } = rawClient || ({} as any);
        return { ...review, client };
      })
    );
  }

  // ─── Favorites ────────────────────────────────────────────────────────────

  async getUserFavorites(userId: string): Promise<any[]> {
    const favs = await db.select().from(favorites).where(eq(favorites.userId, userId));
    const result = [];
    for (const fav of favs) {
      if (fav.dishId) {
        const [dish] = await db.select().from(dishes).where(eq(dishes.id, fav.dishId));
        if (dish) {
          const [cook] = await db.select().from(cookProfiles).where(eq(cookProfiles.id, dish.cookProfileId));
          result.push({ ...fav, dish: { ...dish, cookProfile: cook } });
        }
      }
    }
    return result;
  }

  async toggleFavorite(userId: string, dishId: number): Promise<void> {
    const [existing] = await db.select().from(favorites).where(and(eq(favorites.userId, userId), eq(favorites.dishId, dishId)));
    if (existing) {
      await db.delete(favorites).where(eq(favorites.id, existing.id));
    } else {
      await db.insert(favorites).values({ userId, dishId });
    }
  }

  // ─── Notifications ────────────────────────────────────────────────────────

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [notif] = await db.insert(notifications).values(data).returning();
    return notif;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
  }

  async markNotificationRead(id: number): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  async getStats(): Promise<any> {
    const [userCount] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
    const [cookCount] = await db.select({ count: sql<number>`count(*)::int` }).from(cookProfiles).where(eq(cookProfiles.status, "approved"));
    const [orderCount] = await db.select({ count: sql<number>`count(*)::int` }).from(orders);
    const [revenueResult] = await db
      .select({ total: sql<number>`coalesce(sum(total_amount::numeric), 0)` })
      .from(orders)
      .where(eq(orders.status, "delivered"));

    // Platform commission revenue (from all paid orders)
    const [platformFeeResult] = await db
      .select({ total: sql<number>`coalesce(sum(platform_fee::numeric), 0)` })
      .from(orders)
      .where(eq(orders.paymentStatus, "paid"));

    // Cook earnings (subtotal from delivered orders = what cooks earn after fee)
    const [cookEarningsResult] = await db
      .select({ total: sql<number>`coalesce(sum(subtotal::numeric), 0)` })
      .from(orders)
      .where(eq(orders.status, "delivered"));

    // Total GMV (gross merchandise value = all order totals)
    const [gmvResult] = await db
      .select({ total: sql<number>`coalesce(sum(total_amount::numeric), 0)` })
      .from(orders);

    // Orders by status
    const ordersByStatus = await db
      .select({ status: orders.status, count: sql<number>`count(*)::int` })
      .from(orders)
      .groupBy(orders.status);

    // Top dishes by order count
    const topDishes = await db
      .select({
        dishId: orderItems.dishId,
        name: dishes.name,
        count: sql<number>`count(*)::int`,
      })
      .from(orderItems)
      .leftJoin(dishes, eq(orderItems.dishId, dishes.id))
      .groupBy(orderItems.dishId, dishes.name)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    // Recent orders (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOrders = await db
      .select({
        date: sql<string>`date_trunc('day', created_at)::date::text`,
        count: sql<number>`count(*)::int`,
        revenue: sql<number>`coalesce(sum(total_amount::numeric), 0)`,
        commission: sql<number>`coalesce(sum(platform_fee::numeric), 0)`,
      })
      .from(orders)
      .where(gte(orders.createdAt, thirtyDaysAgo))
      .groupBy(sql`date_trunc('day', created_at)`)
      .orderBy(sql`date_trunc('day', created_at)`);

    return {
      totalUsers: userCount?.count || 0,
      totalCooks: cookCount?.count || 0,
      totalOrders: orderCount?.count || 0,
      totalRevenue: Number(revenueResult?.total || 0),
      platformRevenue: Number(platformFeeResult?.total || 0),
      cookEarnings: Number(cookEarningsResult?.total || 0),
      totalGMV: Number(gmvResult?.total || 0),
      ordersByStatus,
      topDishes,
      recentOrders,
    };
  }

  async updateCookRating(cookProfileId: number): Promise<void> {
    const [result] = await db
      .select({ avg: sql<number>`coalesce(avg(rating)::numeric, 0)` })
      .from(reviews)
      .where(eq(reviews.cookProfileId, cookProfileId));
    if (result) {
      await db.update(cookProfiles).set({ rating: String(Number(result.avg).toFixed(2)) }).where(eq(cookProfiles.id, cookProfileId));
    }
  }
}

export const storage = new DatabaseStorage();
