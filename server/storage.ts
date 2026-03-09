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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, count } from "drizzle-orm";

export interface IStorage {
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  upsertUserProfile(data: InsertUserProfile): Promise<UserProfile>;

  getCookProfile(id: number): Promise<CookProfile | undefined>;
  getCookProfileByUserId(userId: string): Promise<CookProfile | undefined>;
  createCookProfile(data: InsertCookProfile): Promise<CookProfile>;
  updateCookProfile(id: number, data: Partial<CookProfile>): Promise<CookProfile | undefined>;
  getCookProfileWithDetails(id: number): Promise<any>;
  getPendingCooks(): Promise<any[]>;
  getAllCooks(): Promise<any[]>;

  getApprovedCooksWithPreviews(): Promise<any[]>;

  getCategories(): Promise<Category[]>;
  createCategory(data: InsertCategory): Promise<Category>;

  getDishes(): Promise<any[]>;
  getDish(id: number): Promise<any>;
  getDishReviews(dishId: number): Promise<any[]>;
  getDishesByCook(cookProfileId: number): Promise<Dish[]>;
  createDish(data: InsertDish): Promise<Dish>;
  updateDish(id: number, data: Partial<Dish>): Promise<Dish | undefined>;

  getCartItems(userId: string): Promise<any[]>;
  getCartCount(userId: string): Promise<number>;
  addToCart(data: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem | undefined>;
  removeCartItem(id: number): Promise<void>;
  clearCart(userId: string): Promise<void>;

  createOrder(data: InsertOrder): Promise<Order>;
  createOrderItem(data: InsertOrderItem): Promise<OrderItem>;
  getOrdersByClient(clientId: string): Promise<any[]>;
  getOrdersByCook(cookProfileId: number): Promise<any[]>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;

  createReview(data: InsertReview): Promise<Review>;
  getReviewsByCook(cookProfileId: number): Promise<any[]>;

  getUserFavorites(userId: string): Promise<any[]>;
  toggleFavorite(userId: string, dishId: number): Promise<void>;

  getStats(): Promise<{ totalUsers: number; totalCooks: number; totalOrders: number; totalRevenue: number }>;
  updateCookRating(cookProfileId: number): Promise<void>;
  getAllUsers(): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile || undefined;
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

  async getCookProfile(id: number): Promise<CookProfile | undefined> {
    const [profile] = await db.select().from(cookProfiles).where(eq(cookProfiles.id, id));
    return profile || undefined;
  }

  async getCookProfileByUserId(userId: string): Promise<CookProfile | undefined> {
    const [profile] = await db.select().from(cookProfiles).where(eq(cookProfiles.userId, userId));
    return profile || undefined;
  }

  async createCookProfile(data: InsertCookProfile): Promise<CookProfile> {
    const [profile] = await db.insert(cookProfiles).values(data).returning();
    return profile;
  }

  async updateCookProfile(id: number, data: Partial<CookProfile>): Promise<CookProfile | undefined> {
    const [updated] = await db.update(cookProfiles).set(data).where(eq(cookProfiles.id, id)).returning();
    return updated || undefined;
  }

  async getCookProfileWithDetails(id: number): Promise<any> {
    const [cook] = await db.select().from(cookProfiles).where(eq(cookProfiles.id, id));
    if (!cook) return undefined;

    const [rawUser] = await db.select().from(users).where(eq(users.id, cook.userId));
    const { password: _, ...user } = rawUser || {} as any;
    const cookDishes = await db.select().from(dishes).where(and(eq(dishes.cookProfileId, id), eq(dishes.isAvailable, true)));
    const cookReviews = await this.getReviewsByCook(id);

    const dishesWithCook = cookDishes.map((d) => ({ ...d, cookProfile: cook }));

    return { ...cook, user, dishes: dishesWithCook, reviews: cookReviews };
  }

  async getPendingCooks(): Promise<any[]> {
    const cooks = await db.select().from(cookProfiles).where(eq(cookProfiles.status, "pending"));
    const result = [];
    for (const cook of cooks) {
      const [rawUser] = await db.select().from(users).where(eq(users.id, cook.userId));
      const { password: _, ...user } = rawUser || {} as any;
      result.push({ ...cook, user });
    }
    return result;
  }

  async getAllCooks(): Promise<any[]> {
    const cooks = await db.select().from(cookProfiles).orderBy(desc(cookProfiles.id));
    const result = [];
    for (const cook of cooks) {
      const [rawUser] = await db.select().from(users).where(eq(users.id, cook.userId));
      const { password: _, ...user } = rawUser || {} as any;
      result.push({ ...cook, user });
    }
    return result;
  }

  async getApprovedCooksWithPreviews(): Promise<any[]> {
    const cooks = await db
      .select()
      .from(cookProfiles)
      .where(eq(cookProfiles.status, "approved"))
      .orderBy(desc(cookProfiles.rating));

    const result = [];
    for (const cook of cooks) {
      const [rawUser] = await db.select().from(users).where(eq(users.id, cook.userId));
      const { password: _, ...user } = rawUser || {} as any;
      const cookDishes = await db
        .select()
        .from(dishes)
        .where(and(eq(dishes.cookProfileId, cook.id), eq(dishes.isAvailable, true)));

      const dishPreviews: string[] = [];
      for (const d of cookDishes.slice(0, 3)) {
        if (d.photos && d.photos.length > 0) {
          dishPreviews.push(d.photos[0]);
        }
      }

      result.push({
        ...cook,
        user,
        dishCount: cookDishes.length,
        dishPreviews,
      });
    }
    return result;
  }

  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(categories.sortOrder);
  }

  async createCategory(data: InsertCategory): Promise<Category> {
    const [cat] = await db.insert(categories).values(data).returning();
    return cat;
  }

  async getDishes(): Promise<any[]> {
    const allDishes = await db
      .select()
      .from(dishes)
      .where(eq(dishes.isAvailable, true))
      .orderBy(desc(dishes.id));

    const result = [];
    for (const dish of allDishes) {
      const [cook] = await db.select().from(cookProfiles).where(
        and(eq(cookProfiles.id, dish.cookProfileId), eq(cookProfiles.status, "approved"))
      );
      if (cook) {
        result.push({ ...dish, cookProfile: cook });
      }
    }
    return result;
  }

  async getDish(id: number): Promise<any> {
    const [dish] = await db.select().from(dishes).where(eq(dishes.id, id));
    if (!dish) return undefined;
    const [cook] = await db.select().from(cookProfiles).where(eq(cookProfiles.id, dish.cookProfileId));
    return { ...dish, cookProfile: cook };
  }

  async getDishReviews(dishId: number): Promise<any[]> {
    const dishReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.dishId, dishId))
      .orderBy(desc(reviews.createdAt));

    const result = [];
    for (const review of dishReviews) {
      const [rawClient] = await db.select().from(users).where(eq(users.id, review.clientId));
      const { password: _, ...client } = rawClient || {} as any;
      result.push({ ...review, client });
    }
    return result;
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
    return updated || undefined;
  }

  async getCartItems(userId: string): Promise<any[]> {
    const items = await db.select().from(cartItems).where(eq(cartItems.userId, userId));
    const result = [];
    for (const item of items) {
      const [dish] = await db.select().from(dishes).where(eq(dishes.id, item.dishId));
      result.push({ ...item, dish });
    }
    return result;
  }

  async getCartCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(cartItems)
      .where(eq(cartItems.userId, userId));
    return result?.count || 0;
  }

  async addToCart(data: InsertCartItem): Promise<CartItem> {
    const existing = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, data.userId), eq(cartItems.dishId, data.dishId)));

    if (existing.length > 0) {
      const [updated] = await db
        .update(cartItems)
        .set({ quantity: existing[0].quantity + (data.quantity || 1) })
        .where(eq(cartItems.id, existing[0].id))
        .returning();
      return updated;
    }

    const [item] = await db.insert(cartItems).values(data).returning();
    return item;
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const [updated] = await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, id)).returning();
    return updated || undefined;
  }

  async removeCartItem(id: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  async createOrder(data: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(data).returning();
    return order;
  }

  async createOrderItem(data: InsertOrderItem): Promise<OrderItem> {
    const [item] = await db.insert(orderItems).values(data).returning();
    return item;
  }

  async getOrdersByClient(clientId: string): Promise<any[]> {
    const clientOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.clientId, clientId))
      .orderBy(desc(orders.createdAt));

    const result = [];
    for (const order of clientOrders) {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      const itemsWithDishes = [];
      for (const item of items) {
        const [dish] = await db.select().from(dishes).where(eq(dishes.id, item.dishId));
        itemsWithDishes.push({ ...item, dish });
      }
      const [cook] = await db.select().from(cookProfiles).where(eq(cookProfiles.id, order.cookProfileId));
      result.push({ ...order, items: itemsWithDishes, cookProfile: cook });
    }
    return result;
  }

  async getOrdersByCook(cookProfileId: number): Promise<any[]> {
    const cookOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.cookProfileId, cookProfileId))
      .orderBy(desc(orders.createdAt));

    const result = [];
    for (const order of cookOrders) {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      const itemsWithDishes = [];
      for (const item of items) {
        const [dish] = await db.select().from(dishes).where(eq(dishes.id, item.dishId));
        itemsWithDishes.push({ ...item, dish });
      }
      const [rawClient] = await db.select().from(users).where(eq(users.id, order.clientId));
      const { password: _, ...client } = rawClient || {} as any;
      result.push({ ...order, items: itemsWithDishes, client });
    }
    return result;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updated] = await db
      .update(orders)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updated || undefined;
  }

  async getAllOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async createReview(data: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews).values(data).returning();
    await this.updateCookRating(data.cookProfileId);
    return review;
  }

  async getReviewsByCook(cookProfileId: number): Promise<any[]> {
    const cookReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.cookProfileId, cookProfileId))
      .orderBy(desc(reviews.createdAt));

    const result = [];
    for (const review of cookReviews) {
      const [rawClient] = await db.select().from(users).where(eq(users.id, review.clientId));
      const { password: _, ...client } = rawClient || {} as any;
      result.push({ ...review, client });
    }
    return result;
  }

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
    const existing = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.dishId, dishId)));

    if (existing.length > 0) {
      await db.delete(favorites).where(eq(favorites.id, existing[0].id));
    } else {
      await db.insert(favorites).values({ userId, dishId });
    }
  }

  async getStats() {
    const [userCount] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
    const [cookCount] = await db.select({ count: sql<number>`count(*)::int` }).from(cookProfiles);
    const [orderCount] = await db.select({ count: sql<number>`count(*)::int` }).from(orders);
    const [revenueResult] = await db
      .select({ total: sql<number>`coalesce(sum(total_amount::numeric), 0)` })
      .from(orders)
      .where(eq(orders.status, "delivered"));

    return {
      totalUsers: userCount?.count || 0,
      totalCooks: cookCount?.count || 0,
      totalOrders: orderCount?.count || 0,
      totalRevenue: Number(revenueResult?.total || 0),
    };
  }

  async updateCookRating(cookProfileId: number): Promise<void> {
    const [result] = await db
      .select({ avg: sql<number>`coalesce(avg(rating), 0)` })
      .from(reviews)
      .where(eq(reviews.cookProfileId, cookProfileId));

    if (result) {
      await db
        .update(cookProfiles)
        .set({ rating: String(Number(result.avg).toFixed(2)) })
        .where(eq(cookProfiles.id, cookProfileId));
    }
  }
  async getAllUsers(): Promise<any[]> {
    const result = await db
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
    return result;
  }
}

export const storage = new DatabaseStorage();
