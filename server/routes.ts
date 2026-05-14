import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, getUserId } from "./auth";
import { z } from "zod";
import bcrypt from "bcrypt";
import { db } from "./db";
import { users, userProfiles } from "@shared/schema";
import { eq } from "drizzle-orm";

// ─── WebSocket helpers ────────────────────────────────────────────────────────
const clients = new Map<string, Set<WebSocket>>();

function broadcastToUser(userId: string, payload: object) {
  const sockets = clients.get(userId);
  if (!sockets) return;
  const msg = JSON.stringify(payload);
  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  }
}

function broadcastToAll(payload: object) {
  const msg = JSON.stringify(payload);
  for (const sockets of clients.values()) {
    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    }
  }
}

// ─── Role guard ───────────────────────────────────────────────────────────────
const requireRole = (...roles: string[]): RequestHandler => {
  return async (req: any, res, next) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const profile = await storage.getUserProfile(userId);
      if (!profile || !roles.includes(profile.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      next();
    } catch {
      res.status(500).json({ message: "Authorization failed" });
    }
  };
};

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // ─── Auth setup ──────────────────────────────────────────────────────────
  await setupAuth(app);

  // ─── WebSocket server ─────────────────────────────────────────────────────
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const userId = url.searchParams.get("userId");
    if (userId) {
      if (!clients.has(userId)) clients.set(userId, new Set());
      clients.get(userId)!.add(ws);
      ws.on("close", () => clients.get(userId)?.delete(ws));
    }
  });

  // ─── Auth user endpoint ───────────────────────────────────────────────────
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ─── Register ─────────────────────────────────────────────────────────────
  const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    role: z.enum(["client", "cook"]).default("client"),
    phone: z.string().optional(),
    address: z.string().optional(),
  });

  app.post("/api/auth/register", async (req: any, res) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }
      const { email, password, firstName, lastName, role, phone, address } = parsed.data;

      const [existing] = await db.select().from(users).where(eq(users.email, email));
      if (existing) return res.status(409).json({ message: "Email already registered" });

      const hashedPassword = await bcrypt.hash(password, 12);
      const [newUser] = await db.insert(users).values({ email, password: hashedPassword, firstName, lastName }).returning();

      await db.insert(userProfiles).values({
        userId: newUser.id,
        role: role as any,
        phone: phone || null,
        address: address || null,
      });

      req.login({ localAuth: true, userId: newUser.id }, (err: any) => {
        if (err) return res.status(500).json({ message: "Login after registration failed" });
        req.session.userId = newUser.id;
        const { password: _, ...safeUser } = newUser;
        res.status(201).json(safeUser);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // ─── Login ────────────────────────────────────────────────────────────────
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });

  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
      const { email, password } = parsed.data;

      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user || !user.password) return res.status(401).json({ message: "Invalid email or password" });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ message: "Invalid email or password" });

      req.login({ localAuth: true, userId: user.id }, (err: any) => {
        if (err) return res.status(500).json({ message: "Login failed" });
        req.session.userId = user.id;
        const { password: _, ...safeUser } = user;
        res.json(safeUser);
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // ─── Logout ───────────────────────────────────────────────────────────────
  app.post("/api/auth/logout", (req: any, res) => {
    req.logout(() => {
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.json({ message: "Logged out" });
      });
    });
  });

  // ─── User profile ─────────────────────────────────────────────────────────
  app.get("/api/user/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      let profile = await storage.getUserProfile(userId!);
      if (!profile) profile = await storage.upsertUserProfile({ userId: userId!, role: "client" });
      res.json(profile);
    } catch {
      res.status(500).json({ message: "Failed to get profile" });
    }
  });

  // ─── Categories ───────────────────────────────────────────────────────────
  app.get("/api/categories", async (_req, res) => {
    try {
      res.json(await storage.getCategories());
    } catch {
      res.status(500).json({ message: "Failed to get categories" });
    }
  });

  // ─── Dishes ───────────────────────────────────────────────────────────────
  app.get("/api/dishes", async (req, res) => {
    try {
      const { q, category, cuisine, minPrice, maxPrice, sort } = req.query as Record<string, string>;
      const allDishes = await storage.getDishes({ q, category, cuisine, minPrice, maxPrice, sort });
      res.json(allDishes);
    } catch {
      res.status(500).json({ message: "Failed to get dishes" });
    }
  });

  app.get("/api/dishes/:id", async (req, res) => {
    try {
      const dish = await storage.getDish(Number(req.params.id));
      if (!dish) return res.status(404).json({ message: "Dish not found" });
      res.json(dish);
    } catch {
      res.status(500).json({ message: "Failed to get dish" });
    }
  });

  app.get("/api/dishes/:id/reviews", async (req, res) => {
    try {
      res.json(await storage.getDishReviews(Number(req.params.id)));
    } catch {
      res.status(500).json({ message: "Failed to get reviews" });
    }
  });

  // ─── Cart ─────────────────────────────────────────────────────────────────
  app.get("/api/cart", isAuthenticated, async (req: any, res) => {
    try {
      res.json(await storage.getCartItems(getUserId(req)!));
    } catch {
      res.status(500).json({ message: "Failed to get cart" });
    }
  });

  app.get("/api/cart/count", isAuthenticated, async (req: any, res) => {
    try {
      const cnt = await storage.getCartCount(getUserId(req)!);
      res.json({ count: cnt });
    } catch {
      res.json({ count: 0 });
    }
  });

  const addToCartSchema = z.object({
    dishId: z.number().int().positive(),
    quantity: z.number().int().min(1).max(99).default(1),
  });

  app.post("/api/cart", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = addToCartSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
      const item = await storage.addToCart({ userId: getUserId(req)!, dishId: parsed.data.dishId, quantity: parsed.data.quantity });
      res.json(item);
    } catch {
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  app.patch("/api/cart/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const cartId = Number(req.params.id);
      const quantity = z.number().int().min(1).max(99).parse(req.body.quantity);
      const items = await storage.getCartItems(userId);
      if (!items.find((i: any) => i.id === cartId)) return res.status(404).json({ message: "Cart item not found" });
      res.json(await storage.updateCartItem(cartId, quantity));
    } catch {
      res.status(500).json({ message: "Failed to update cart" });
    }
  });

  app.delete("/api/cart/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const cartId = Number(req.params.id);
      const items = await storage.getCartItems(userId);
      if (!items.find((i: any) => i.id === cartId)) return res.status(404).json({ message: "Cart item not found" });
      await storage.removeCartItem(cartId);
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  // ─── Orders ───────────────────────────────────────────────────────────────
  const createOrderSchema = z.object({
    deliveryAddress: z.string().min(1, "Delivery address is required"),
    deliveryTime: z.string().optional(),
    comment: z.string().optional(),
    paymentMethod: z.enum(["card", "cash"]).default("card"),
  });

  app.post("/api/orders", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = createOrderSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.message });

      const userId = getUserId(req)!;
      const cartItemsList = await storage.getCartItems(userId);
      if (cartItemsList.length === 0) return res.status(400).json({ message: "Cart is empty" });

      const byCook: Record<number, typeof cartItemsList> = {};
      for (const item of cartItemsList) {
        const cookId = item.dish.cookProfileId;
        if (!byCook[cookId]) byCook[cookId] = [];
        byCook[cookId].push(item);
      }

      const createdOrders = [];
      for (const [cookId, items] of Object.entries(byCook)) {
        const total = items.reduce((sum: number, item: any) => sum + Number(item.dish.price) * item.quantity, 0);
        const order = await storage.createOrder({
          clientId: userId,
          cookProfileId: Number(cookId),
          totalAmount: String(total),
          deliveryAddress: parsed.data.deliveryAddress,
          deliveryTime: (() => {
            if (!parsed.data.deliveryTime) return undefined;
            const d = new Date(parsed.data.deliveryTime);
            return isNaN(d.getTime()) ? undefined : d;
          })(),
          comment: parsed.data.comment,
          status: "pending",
          paymentMethod: parsed.data.paymentMethod,
          paymentStatus: parsed.data.paymentMethod === "card" ? "paid" : "pending",
        });

        for (const item of items) {
          await storage.createOrderItem({
            orderId: order.id,
            dishId: item.dishId,
            quantity: item.quantity,
            priceAtOrder: String(item.dish.price),
          });
        }

        // Create notification for cook
        const cookProfile = await storage.getCookProfile(Number(cookId));
        if (cookProfile) {
          const notif = await storage.createNotification({
            userId: cookProfile.userId,
            type: "new_order",
            title: "New order received",
            message: `Order #${order.id} — ${Number(total).toFixed(0)} ₸`,
            orderId: order.id,
          });
          broadcastToUser(cookProfile.userId, { type: "notification", notification: notif });
        }

        // Notify the client too
        const clientNotif = await storage.createNotification({
          userId,
          type: "order_confirmed",
          title: "Order placed",
          message: `Your order #${order.id} has been placed. Total: ${Number(total).toFixed(0)} ₸`,
          orderId: order.id,
        });
        broadcastToUser(userId, { type: "notification", notification: clientNotif });

        createdOrders.push(order);
      }

      await storage.clearCart(userId);
      res.json(createdOrders);
    } catch (error) {
      console.error("Order creation error:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/orders", isAuthenticated, async (req: any, res) => {
    try {
      res.json(await storage.getOrdersByClient(getUserId(req)!));
    } catch {
      res.status(500).json({ message: "Failed to get orders" });
    }
  });

  app.patch("/api/orders/:id/cancel", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const orderId = Number(req.params.id);
      const clientOrders = await storage.getOrdersByClient(userId);
      const order = clientOrders.find((o: any) => o.id === orderId);
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (order.status !== "pending") return res.status(400).json({ message: "Can only cancel pending orders" });

      const updated = await storage.updateOrderStatus(orderId, "cancelled");
      broadcastToAll({ type: "order_status", orderId, status: "cancelled" });
      res.json(updated);
    } catch {
      res.status(500).json({ message: "Failed to cancel order" });
    }
  });

  // ─── Reviews ──────────────────────────────────────────────────────────────
  const createReviewSchema = z.object({
    cookProfileId: z.number().int().positive(),
    orderId: z.number().int().positive().optional(),
    dishId: z.number().int().positive().optional(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().optional(),
    photos: z.array(z.string()).optional(),
  });

  app.post("/api/reviews", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = createReviewSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.message });

      const userId = getUserId(req)!;
      const review = await storage.createReview({
        clientId: userId,
        cookProfileId: parsed.data.cookProfileId,
        orderId: parsed.data.orderId || null,
        dishId: parsed.data.dishId || null,
        rating: parsed.data.rating,
        comment: parsed.data.comment || null,
        photos: parsed.data.photos || null,
      });

      // Notify cook
      const cookProfile = await storage.getCookProfile(parsed.data.cookProfileId);
      if (cookProfile) {
        const notif = await storage.createNotification({
          userId: cookProfile.userId,
          type: "new_review",
          title: "New review received",
          message: `${parsed.data.rating}★ review — "${parsed.data.comment?.slice(0, 60) || ""}"`,
        });
        broadcastToUser(cookProfile.userId, { type: "notification", notification: notif });
      }

      res.json(review);
    } catch {
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // ─── Favorites ────────────────────────────────────────────────────────────
  app.get("/api/favorites", isAuthenticated, async (req: any, res) => {
    try {
      res.json(await storage.getUserFavorites(getUserId(req)!));
    } catch {
      res.status(500).json({ message: "Failed to get favorites" });
    }
  });

  app.post("/api/favorites/toggle", isAuthenticated, async (req: any, res) => {
    try {
      const dishId = z.number().int().positive().parse(req.body.dishId);
      await storage.toggleFavorite(getUserId(req)!, dishId);
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "Failed to toggle favorite" });
    }
  });

  // ─── Cook profile application ─────────────────────────────────────────────
  const createCookProfileSchema = z.object({
    displayName: z.string().min(1).max(100),
    bio: z.string().optional(),
    specialization: z.string().optional(),
    cuisineTypes: z.array(z.string()).optional(),
    experience: z.string().optional(),
    profileImage: z.string().optional(),
  });

  app.post("/api/cook-profiles", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = createCookProfileSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.message });

      const userId = getUserId(req)!;
      const existing = await storage.getCookProfileByUserId(userId);
      if (existing) return res.status(400).json({ message: "Cook profile already exists" });

      const profile = await storage.createCookProfile({
        userId,
        displayName: parsed.data.displayName,
        bio: parsed.data.bio,
        specialization: parsed.data.specialization,
        cuisineTypes: parsed.data.cuisineTypes,
        experience: parsed.data.experience,
        profileImage: parsed.data.profileImage,
        status: "pending",
      });

      await storage.upsertUserProfile({ userId, role: "cook" });
      res.json(profile);
    } catch (error) {
      console.error("Cook profile creation error:", error);
      res.status(500).json({ message: "Failed to create cook profile" });
    }
  });

  // ─── Cook dashboard ───────────────────────────────────────────────────────
  app.get("/api/cook/profile", isAuthenticated, async (req: any, res) => {
    try {
      const profile = await storage.getCookProfileByUserId(getUserId(req)!);
      if (!profile) return res.status(404).json({ message: "No cook profile" });
      res.json(profile);
    } catch {
      res.status(500).json({ message: "Failed to get cook profile" });
    }
  });

  app.patch("/api/cook/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const profile = await storage.getCookProfileByUserId(userId);
      if (!profile) return res.status(404).json({ message: "No cook profile" });
      const updated = await storage.updateCookProfile(profile.id, {
        displayName: req.body.displayName,
        bio: req.body.bio,
        specialization: req.body.specialization,
        isAvailable: req.body.isAvailable,
        minOrderAmount: req.body.minOrderAmount,
        workingHoursStart: req.body.workingHoursStart,
        workingHoursEnd: req.body.workingHoursEnd,
      });
      res.json(updated);
    } catch {
      res.status(500).json({ message: "Failed to update cook profile" });
    }
  });

  app.get("/api/cook/dishes", isAuthenticated, async (req: any, res) => {
    try {
      const profile = await storage.getCookProfileByUserId(getUserId(req)!);
      if (!profile) return res.json([]);
      res.json(await storage.getDishesByCook(profile.id));
    } catch {
      res.status(500).json({ message: "Failed to get dishes" });
    }
  });

  app.post("/api/cook/dishes", isAuthenticated, async (req: any, res) => {
    try {
      const profile = await storage.getCookProfileByUserId(getUserId(req)!);
      if (!profile) return res.status(403).json({ message: "Not a cook" });
      const dish = await storage.createDish({
        cookProfileId: profile.id,
        name: req.body.name,
        description: req.body.description,
        ingredients: req.body.ingredients,
        photos: req.body.photos,
        price: req.body.price,
        cookingTime: req.body.cookingTime,
        weight: req.body.weight,
        calories: req.body.calories,
        protein: req.body.protein,
        fat: req.body.fat,
        carbs: req.body.carbs,
        cuisineType: req.body.cuisineType,
        categoryId: req.body.categoryId,
        portions: req.body.portions,
        availablePortions: req.body.availablePortions,
        dietaryTags: req.body.dietaryTags,
      });
      res.json(dish);
    } catch (error) {
      console.error("Dish creation error:", error);
      res.status(500).json({ message: "Failed to create dish" });
    }
  });

  app.patch("/api/cook/dishes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const profile = await storage.getCookProfileByUserId(getUserId(req)!);
      if (!profile) return res.status(403).json({ message: "Not a cook" });
      const dishId = Number(req.params.id);
      const existing = await storage.getDish(dishId);
      if (!existing || existing.cookProfileId !== profile.id) return res.status(403).json({ message: "Not your dish" });
      res.json(await storage.updateDish(dishId, req.body));
    } catch {
      res.status(500).json({ message: "Failed to update dish" });
    }
  });

  app.delete("/api/cook/dishes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const profile = await storage.getCookProfileByUserId(getUserId(req)!);
      if (!profile) return res.status(403).json({ message: "Not a cook" });
      const dishId = Number(req.params.id);
      const existing = await storage.getDish(dishId);
      if (!existing || existing.cookProfileId !== profile.id) return res.status(403).json({ message: "Not your dish" });
      await storage.deleteDish(dishId);
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "Failed to delete dish" });
    }
  });

  app.get("/api/cook/orders", isAuthenticated, async (req: any, res) => {
    try {
      const profile = await storage.getCookProfileByUserId(getUserId(req)!);
      if (!profile) return res.json([]);
      res.json(await storage.getOrdersByCook(profile.id));
    } catch {
      res.status(500).json({ message: "Failed to get orders" });
    }
  });

  app.get("/api/cook/stats", isAuthenticated, async (req: any, res) => {
    try {
      const profile = await storage.getCookProfileByUserId(getUserId(req)!);
      if (!profile) return res.json({ totalRevenue: 0, totalOrders: 0, avgRating: 0, pendingOrders: 0 });
      res.json(await storage.getCookStats(profile.id));
    } catch {
      res.status(500).json({ message: "Failed to get cook stats" });
    }
  });

  const validOrderStatuses = ["confirmed", "preparing", "ready", "delivering", "delivered", "cancelled"];

  app.patch("/api/cook/orders/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const profile = await storage.getCookProfileByUserId(getUserId(req)!);
      if (!profile) return res.status(403).json({ message: "Not a cook" });

      const orderId = Number(req.params.id);
      const { status } = req.body;
      if (!validOrderStatuses.includes(status)) return res.status(400).json({ message: "Invalid status" });

      const cookOrders = await storage.getOrdersByCook(profile.id);
      const order = cookOrders.find((o: any) => o.id === orderId);
      if (!order) return res.status(404).json({ message: "Order not found" });

      const updated = await storage.updateOrderStatus(orderId, status);

      if (status === "delivered") {
        await storage.updateCookProfile(profile.id, { totalOrders: (profile.totalOrders || 0) + 1 });
      }

      // Notify the client
      const statusMessages: Record<string, string> = {
        confirmed: "Your order has been confirmed by the cook",
        preparing: "Your order is being prepared",
        ready: "Your order is ready for pickup/delivery",
        delivering: "Your order is on its way",
        delivered: "Your order has been delivered. Enjoy!",
        cancelled: "Your order has been cancelled",
      };

      const notif = await storage.createNotification({
        userId: order.clientId,
        type: "order_status",
        title: `Order #${orderId} — ${status}`,
        message: statusMessages[status] || `Order status changed to ${status}`,
        orderId,
      });
      broadcastToUser(order.clientId, { type: "notification", notification: notif });
      broadcastToAll({ type: "order_status", orderId, status });

      res.json(updated);
    } catch {
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // ─── Public cooks ─────────────────────────────────────────────────────────
  app.get("/api/cooks", async (req, res) => {
    try {
      const { q, cuisine, minRating, sort } = req.query as Record<string, string>;
      res.json(await storage.getApprovedCooksWithPreviews({ q, cuisine, minRating, sort }));
    } catch {
      res.status(500).json({ message: "Failed to get cooks" });
    }
  });

  app.get("/api/cooks/:id", async (req, res) => {
    try {
      const cook = await storage.getCookProfileWithDetails(Number(req.params.id));
      if (!cook) return res.status(404).json({ message: "Cook not found" });
      res.json(cook);
    } catch {
      res.status(500).json({ message: "Failed to get cook" });
    }
  });

  // ─── Notifications ────────────────────────────────────────────────────────
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      res.json(await storage.getNotifications(getUserId(req)!));
    } catch {
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      await storage.markNotificationRead(Number(req.params.id));
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "Failed to mark notification" });
    }
  });

  app.patch("/api/notifications/read-all", isAuthenticated, async (req: any, res) => {
    try {
      await storage.markAllNotificationsRead(getUserId(req)!);
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "Failed to mark all notifications" });
    }
  });

  // ─── Admin routes ─────────────────────────────────────────────────────────
  app.get("/api/admin/cooks/pending", isAuthenticated, requireRole("admin", "moderator"), async (_req, res) => {
    try {
      res.json(await storage.getPendingCooks());
    } catch {
      res.status(500).json({ message: "Failed to get pending cooks" });
    }
  });

  app.get("/api/admin/cooks", isAuthenticated, requireRole("admin", "moderator"), async (_req, res) => {
    try {
      res.json(await storage.getAllCooks());
    } catch {
      res.status(500).json({ message: "Failed to get cooks" });
    }
  });

  app.patch("/api/admin/cooks/:id/status", isAuthenticated, requireRole("admin", "moderator"), async (req, res) => {
    try {
      const status = z.enum(["approved", "rejected", "pending"]).parse(req.body.status);
      const cook = await storage.updateCookProfile(Number(req.params.id), { status: status as any });

      // Notify the cook
      if (cook) {
        const notif = await storage.createNotification({
          userId: cook.userId,
          type: status === "approved" ? "cook_approved" : "cook_rejected",
          title: status === "approved" ? "Application approved!" : "Application rejected",
          message: status === "approved"
            ? "Congratulations! Your cook application has been approved. You can now list dishes."
            : "Your cook application was rejected. Contact support for more information.",
        });
        broadcastToUser(cook.userId, { type: "notification", notification: notif });
      }

      res.json(cook);
    } catch {
      res.status(500).json({ message: "Failed to update cook status" });
    }
  });

  app.get("/api/admin/orders", isAuthenticated, requireRole("admin", "moderator"), async (_req, res) => {
    try {
      res.json(await storage.getAllOrders());
    } catch {
      res.status(500).json({ message: "Failed to get orders" });
    }
  });

  app.get("/api/admin/stats", isAuthenticated, requireRole("admin", "moderator"), async (_req, res) => {
    try {
      res.json(await storage.getStats());
    } catch {
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  app.get("/api/admin/users", isAuthenticated, requireRole("admin"), async (_req, res) => {
    try {
      res.json(await storage.getAllUsers());
    } catch {
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.patch("/api/admin/users/:id/role", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const role = z.enum(["client", "cook", "moderator", "admin", "support"]).parse(req.body.role);
      const updated = await storage.upsertUserProfile({ userId: req.params.id, role });
      res.json(updated);
    } catch {
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  return httpServer;
}
