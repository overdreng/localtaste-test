import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  decimal,
  pgEnum,
  serial,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";
import { users } from "./models/auth";

export const userRoleEnum = pgEnum("user_role", [
  "client",
  "cook",
  "moderator",
  "admin",
  "support",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "delivering",
  "delivered",
  "cancelled",
]);

export const cookStatusEnum = pgEnum("cook_status", [
  "pending",
  "approved",
  "rejected",
]);

export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  role: userRoleEnum("role").notNull().default("client"),
  phone: varchar("phone"),
  address: text("address"),
  city: varchar("city"),
  dietaryPreferences: text("dietary_preferences").array(),
});

export const cookProfiles = pgTable("cook_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  displayName: varchar("display_name").notNull(),
  bio: text("bio"),
  specialization: varchar("specialization"),
  cuisineTypes: text("cuisine_types").array(),
  experience: text("experience"),
  profileImage: text("profile_image"),
  kitchenPhotos: text("kitchen_photos").array(),
  sanitaryBookUrl: text("sanitary_book_url"),
  status: cookStatusEnum("status").notNull().default("pending"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  totalOrders: integer("total_orders").default(0),
  isAvailable: boolean("is_available").default(true),
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }).default("0"),
  deliveryRadius: integer("delivery_radius").default(10),
  workingHoursStart: varchar("working_hours_start").default("09:00"),
  workingHoursEnd: varchar("working_hours_end").default("21:00"),
  workingDays: text("working_days").array(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  nameRu: varchar("name_ru").notNull(),
  icon: varchar("icon"),
  sortOrder: integer("sort_order").default(0),
});

export const dishes = pgTable("dishes", {
  id: serial("id").primaryKey(),
  cookProfileId: integer("cook_profile_id")
    .notNull()
    .references(() => cookProfiles.id),
  categoryId: integer("category_id").references(() => categories.id),
  name: varchar("name").notNull(),
  description: text("description"),
  ingredients: text("ingredients"),
  photos: text("photos").array(),
  weight: integer("weight"),
  portions: integer("portions").default(1),
  calories: integer("calories"),
  protein: decimal("protein", { precision: 5, scale: 1 }),
  fat: decimal("fat", { precision: 5, scale: 1 }),
  carbs: decimal("carbs", { precision: 5, scale: 1 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  cookingTime: integer("cooking_time"),
  cuisineType: varchar("cuisine_type"),
  dietaryTags: text("dietary_tags").array(),
  isAvailable: boolean("is_available").default(true),
  availablePortions: integer("available_portions").default(10),
  storageConditions: text("storage_conditions"),
  shelfLife: varchar("shelf_life"),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  clientId: varchar("client_id")
    .notNull()
    .references(() => users.id),
  cookProfileId: integer("cook_profile_id")
    .notNull()
    .references(() => cookProfiles.id),
  status: orderStatusEnum("status").notNull().default("pending"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryTime: timestamp("delivery_time"),
  comment: text("comment"),
  specialRequests: text("special_requests"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id),
  dishId: integer("dish_id")
    .notNull()
    .references(() => dishes.id),
  quantity: integer("quantity").notNull().default(1),
  priceAtOrder: decimal("price_at_order", { precision: 10, scale: 2 }).notNull(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  clientId: varchar("client_id")
    .notNull()
    .references(() => users.id),
  cookProfileId: integer("cook_profile_id")
    .notNull()
    .references(() => cookProfiles.id),
  orderId: integer("order_id").references(() => orders.id),
  dishId: integer("dish_id").references(() => dishes.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  photos: text("photos").array(),
  cookReply: text("cook_reply"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  dishId: integer("dish_id").references(() => dishes.id),
  cookProfileId: integer("cook_profile_id").references(() => cookProfiles.id),
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  dishId: integer("dish_id")
    .notNull()
    .references(() => dishes.id),
  quantity: integer("quantity").notNull().default(1),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  cookProfile: one(cookProfiles, {
    fields: [users.id],
    references: [cookProfiles.userId],
  }),
  orders: many(orders),
  reviews: many(reviews),
  favorites: many(favorites),
  cartItems: many(cartItems),
}));

export const cookProfilesRelations = relations(cookProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [cookProfiles.userId],
    references: [users.id],
  }),
  dishes: many(dishes),
  orders: many(orders),
  reviews: many(reviews),
}));

export const dishesRelations = relations(dishes, ({ one, many }) => ({
  cookProfile: one(cookProfiles, {
    fields: [dishes.cookProfileId],
    references: [cookProfiles.id],
  }),
  category: one(categories, {
    fields: [dishes.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
  reviews: many(reviews),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  client: one(users, {
    fields: [orders.clientId],
    references: [users.id],
  }),
  cookProfile: one(cookProfiles, {
    fields: [orders.cookProfileId],
    references: [cookProfiles.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  dish: one(dishes, {
    fields: [orderItems.dishId],
    references: [dishes.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  client: one(users, {
    fields: [reviews.clientId],
    references: [users.id],
  }),
  cookProfile: one(cookProfiles, {
    fields: [reviews.cookProfileId],
    references: [cookProfiles.id],
  }),
  dish: one(dishes, {
    fields: [reviews.dishId],
    references: [dishes.id],
  }),
  order: one(orders, {
    fields: [reviews.orderId],
    references: [orders.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  dish: one(dishes, {
    fields: [favorites.dishId],
    references: [dishes.id],
  }),
  cookProfile: one(cookProfiles, {
    fields: [favorites.cookProfileId],
    references: [cookProfiles.id],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  dish: one(dishes, {
    fields: [cartItems.dishId],
    references: [dishes.id],
  }),
}));

// Insert schemas
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
});
export const insertCookProfileSchema = createInsertSchema(cookProfiles).omit({
  id: true,
  rating: true,
  totalOrders: true,
});
export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});
export const insertDishSchema = createInsertSchema(dishes).omit({
  id: true,
});
export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});
export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});
export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
});
export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
});

// Types
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertCookProfile = z.infer<typeof insertCookProfileSchema>;
export type CookProfile = typeof cookProfiles.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertDish = z.infer<typeof insertDishSchema>;
export type Dish = typeof dishes.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItem = typeof cartItems.$inferSelect;
