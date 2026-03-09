import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { z } from "zod";
import bcrypt from "bcrypt";
import { db } from "./db";
import { users, userProfiles } from "@shared/schema";
import { eq } from "drizzle-orm";

function getUserId(req: any): string | null {
  if (req.session?.userId) return req.session.userId;
  return null;
}

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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);
  //registerObjectStorageRoutes(app);

  // Email/password registration
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
      if (existing) {
        return res.status(409).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const [newUser] = await db.insert(users).values({
        email,
        password: hashedPassword,
        firstName,
        lastName,
      }).returning();

      await db.insert(userProfiles).values({
        userId: newUser.id,
        role: role as any,
        phone: phone || null,
        address: address || null,
      });

      req.login({ localAuth: true, userId: newUser.id }, (err: any) => {
        if (err) {
          return res.status(500).json({ message: "Registration succeeded but login failed" });
        }
        const { password: _, ...safeUser } = newUser;
        req.session.userId = newUser.id;
        return res.status(201).json(safeUser);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Email/password login
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });

  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data" });
      }

      const { email, password } = parsed.data;
      const [user] = await db.select().from(users).where(eq(users.email, email));

      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.login({ localAuth: true, userId: user.id }, (err: any) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        const { password: _, ...safeUser } = user;
        req.session.userId = user.id;
        return res.json(safeUser);
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Local logout (for email/password users)
  app.post("/api/auth/logout", (req: any, res) => {
    req.logout(() => {
      res.json({ message: "Logged out" });
    });
  });

  // User profile
  app.get("/api/user/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      let profile = await storage.getUserProfile(userId);
      if (!profile) {
        profile = await storage.upsertUserProfile({ userId, role: "client" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to get profile" });
    }
  });

  // Categories
  app.get("/api/categories", async (_req, res) => {
    try {
      const cats = await storage.getCategories();
      res.json(cats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get categories" });
    }
  });

  // Dishes
  app.get("/api/dishes", async (_req, res) => {
    try {
      const allDishes = await storage.getDishes();
      res.json(allDishes);
    } catch (error) {
      res.status(500).json({ message: "Failed to get dishes" });
    }
  });

  app.get("/api/dishes/:id", async (req, res) => {
    try {
      const dish = await storage.getDish(Number(req.params.id));
      if (!dish) return res.status(404).json({ message: "Dish not found" });
      res.json(dish);
    } catch (error) {
      res.status(500).json({ message: "Failed to get dish" });
    }
  });

  app.get("/api/dishes/:id/reviews", async (req, res) => {
    try {
      const dishReviews = await storage.getDishReviews(Number(req.params.id));
      res.json(dishReviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to get reviews" });
    }
  });

  // Cart
  app.get("/api/cart", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const items = await storage.getCartItems(userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to get cart" });
    }
  });

  app.get("/api/cart/count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const cnt = await storage.getCartCount(userId);
      res.json({ count: cnt });
    } catch (error) {
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

      const userId = getUserId(req);
      const item = await storage.addToCart({
        userId,
        dishId: parsed.data.dishId,
        quantity: parsed.data.quantity,
      });
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  app.patch("/api/cart/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const cartId = Number(req.params.id);
      const quantity = z.number().int().min(1).max(99).parse(req.body.quantity);

      const items = await storage.getCartItems(userId);
      const item = items.find((i: any) => i.id === cartId);
      if (!item) return res.status(404).json({ message: "Cart item not found" });

      const updated = await storage.updateCartItem(cartId, quantity);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update cart" });
    }
  });

  app.delete("/api/cart/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const cartId = Number(req.params.id);

      const items = await storage.getCartItems(userId);
      const item = items.find((i: any) => i.id === cartId);
      if (!item) return res.status(404).json({ message: "Cart item not found" });

      await storage.removeCartItem(cartId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  // Orders
  const createOrderSchema = z.object({
    deliveryAddress: z.string().min(1, "Delivery address is required"),
    deliveryTime: z.string().optional(),
    comment: z.string().optional(),
  });

  app.post("/api/orders", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = createOrderSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.message });

      const userId = getUserId(req);
      const cartItemsList = await storage.getCartItems(userId);
      if (cartItemsList.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      const byCook: Record<number, typeof cartItemsList> = {};
      for (const item of cartItemsList) {
        const cookId = item.dish.cookProfileId;
        if (!byCook[cookId]) byCook[cookId] = [];
        byCook[cookId].push(item);
      }

      const createdOrders = [];
      for (const [cookId, items] of Object.entries(byCook)) {
        const total = items.reduce(
          (sum: number, item: any) => sum + Number(item.dish.price) * item.quantity,
          0
        );

        const order = await storage.createOrder({
          clientId: userId,
          cookProfileId: Number(cookId),
          totalAmount: String(total),
          deliveryAddress: parsed.data.deliveryAddress,
          deliveryTime: parsed.data.deliveryTime ? new Date(parsed.data.deliveryTime) : undefined,
          comment: parsed.data.comment,
          status: "pending",
        });

        for (const item of items) {
          await storage.createOrderItem({
            orderId: order.id,
            dishId: item.dishId,
            quantity: item.quantity,
            priceAtOrder: String(item.dish.price),
          });
        }

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
      const userId = getUserId(req);
      const clientOrders = await storage.getOrdersByClient(userId);
      res.json(clientOrders);
    } catch (error) {
      res.status(500).json({ message: "Failed to get orders" });
    }
  });

  app.patch("/api/orders/:id/cancel", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const orderId = Number(req.params.id);

      const clientOrders = await storage.getOrdersByClient(userId);
      const order = clientOrders.find((o: any) => o.id === orderId);
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (order.status !== "pending") {
        return res.status(400).json({ message: "Can only cancel pending orders" });
      }

      const updated = await storage.updateOrderStatus(orderId, "cancelled");
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to cancel order" });
    }
  });

  // Reviews
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

      const userId = getUserId(req);
      const review = await storage.createReview({
        clientId: userId,
        cookProfileId: parsed.data.cookProfileId,
        orderId: parsed.data.orderId || null,
        dishId: parsed.data.dishId || null,
        rating: parsed.data.rating,
        comment: parsed.data.comment || null,
        photos: parsed.data.photos || null,
      });
      res.json(review);
    } catch (error) {
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Favorites
  app.get("/api/favorites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const favs = await storage.getUserFavorites(userId);
      res.json(favs);
    } catch (error) {
      res.status(500).json({ message: "Failed to get favorites" });
    }
  });

  app.post("/api/favorites/toggle", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const dishId = z.number().int().positive().parse(req.body.dishId);
      await storage.toggleFavorite(userId, dishId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle favorite" });
    }
  });

  // Cook profile application
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

      const userId = getUserId(req);
      const existing = await storage.getCookProfileByUserId(userId);
      if (existing) {
        return res.status(400).json({ message: "Cook profile already exists" });
      }

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

  // Cook dashboard (cook role required)
  app.get("/api/cook/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getCookProfileByUserId(userId);
      if (!profile) return res.status(404).json({ message: "No cook profile" });
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to get cook profile" });
    }
  });

  app.get("/api/cook/dishes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getCookProfileByUserId(userId);
      if (!profile) return res.json([]);
      const cookDishes = await storage.getDishesByCook(profile.id);
      res.json(cookDishes);
    } catch (error) {
      res.status(500).json({ message: "Failed to get dishes" });
    }
  });

  app.post("/api/cook/dishes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getCookProfileByUserId(userId);
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
      });
      res.json(dish);
    } catch (error) {
      console.error("Dish creation error:", error);
      res.status(500).json({ message: "Failed to create dish" });
    }
  });

  app.patch("/api/cook/dishes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getCookProfileByUserId(userId);
      if (!profile) return res.status(403).json({ message: "Not a cook" });

      const dishId = Number(req.params.id);
      const existingDish = await storage.getDish(dishId);
      if (!existingDish || existingDish.cookProfileId !== profile.id) {
        return res.status(403).json({ message: "Not your dish" });
      }

      const dish = await storage.updateDish(dishId, req.body);
      res.json(dish);
    } catch (error) {
      res.status(500).json({ message: "Failed to update dish" });
    }
  });

  app.get("/api/cook/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getCookProfileByUserId(userId);
      if (!profile) return res.json([]);
      const cookOrders = await storage.getOrdersByCook(profile.id);
      res.json(cookOrders);
    } catch (error) {
      res.status(500).json({ message: "Failed to get orders" });
    }
  });

  const validOrderStatuses = ["confirmed", "preparing", "ready", "delivering", "delivered", "cancelled"];

  app.patch("/api/cook/orders/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getCookProfileByUserId(userId);
      if (!profile) return res.status(403).json({ message: "Not a cook" });

      const orderId = Number(req.params.id);
      const { status } = req.body;

      if (!validOrderStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const cookOrders = await storage.getOrdersByCook(profile.id);
      const order = cookOrders.find((o: any) => o.id === orderId);
      if (!order) return res.status(404).json({ message: "Order not found" });

      const updated = await storage.updateOrderStatus(orderId, status);

      if (status === "delivered" && updated) {
        await storage.updateCookProfile(profile.id, {
          totalOrders: (profile.totalOrders || 0) + 1,
        });
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // Public cooks list with previews
  app.get("/api/cooks", async (_req, res) => {
    try {
      const cooks = await storage.getApprovedCooksWithPreviews();
      res.json(cooks);
    } catch (error) {
      res.status(500).json({ message: "Failed to get cooks" });
    }
  });

  // Cook public profile
  app.get("/api/cooks/:id", async (req, res) => {
    try {
      const cook = await storage.getCookProfileWithDetails(Number(req.params.id));
      if (!cook) return res.status(404).json({ message: "Cook not found" });
      res.json(cook);
    } catch (error) {
      res.status(500).json({ message: "Failed to get cook" });
    }
  });

  // Admin routes (admin/moderator role required)
  app.get("/api/admin/cooks/pending", isAuthenticated, requireRole("admin", "moderator"), async (req: any, res) => {
    try {
      const cooks = await storage.getPendingCooks();
      res.json(cooks);
    } catch (error) {
      res.status(500).json({ message: "Failed to get pending cooks" });
    }
  });

  app.get("/api/admin/cooks", isAuthenticated, requireRole("admin", "moderator"), async (req: any, res) => {
    try {
      const cooks = await storage.getAllCooks();
      res.json(cooks);
    } catch (error) {
      res.status(500).json({ message: "Failed to get cooks" });
    }
  });

  app.patch("/api/admin/cooks/:id/status", isAuthenticated, requireRole("admin", "moderator"), async (req: any, res) => {
    try {
      const status = z.enum(["approved", "rejected", "pending"]).parse(req.body.status);
      const cook = await storage.updateCookProfile(Number(req.params.id), { status: status as any });
      res.json(cook);
    } catch (error) {
      res.status(500).json({ message: "Failed to update cook status" });
    }
  });

  app.get("/api/admin/orders", isAuthenticated, requireRole("admin", "moderator"), async (req: any, res) => {
    try {
      const allOrders = await storage.getAllOrders();
      res.json(allOrders);
    } catch (error) {
      res.status(500).json({ message: "Failed to get orders" });
    }
  });

  app.get("/api/admin/stats", isAuthenticated, requireRole("admin", "moderator"), async (req: any, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  app.get("/api/admin/users", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.patch("/api/admin/users/:id/role", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const userId = req.params.id;
      const role = z.enum(["client", "cook", "moderator", "admin", "support"]).parse(req.body.role);
      const profile = await storage.upsertUserProfile({ userId, role: role as any });
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.post("/api/admin/categories", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const schema = z.object({
        name: z.string().min(1),
        nameRu: z.string().min(1),
        icon: z.string().optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.message });

      const cat = await storage.createCategory(parsed.data);
      res.json(cat);
    } catch (error) {
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.get("/api/auth/user", async (req: any, res) => {
    res.json({
      id: "local-user",
      email: "local@localtaste.test",
      firstName: "Local",
      lastName: "User"
    });
  });

  return httpServer;

}
