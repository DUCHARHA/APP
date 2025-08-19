import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phone: text("phone").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  address: text("address"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").default(0),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  weight: text("weight"),
  imageUrl: text("image_url"),
  categoryId: varchar("category_id").references(() => categories.id),
  inStock: boolean("in_stock").default(true),
  isPopular: boolean("is_popular").default(false),
  // Detailed product information
  ingredients: text("ingredients"),
  manufacturer: text("manufacturer"),
  countryOfOrigin: text("country_of_origin"),
  storageConditions: text("storage_conditions"),
  shelfLife: text("shelf_life"),
  // Nutrition facts (per 100g)
  calories: integer("calories"),
  proteins: decimal("proteins", { precision: 5, scale: 2 }),
  fats: decimal("fats", { precision: 5, scale: 2 }),
  carbs: decimal("carbs", { precision: 5, scale: 2 }),
  fiber: decimal("fiber", { precision: 5, scale: 2 }),
  sugar: decimal("sugar", { precision: 5, scale: 2 }),
});

export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  productId: varchar("product_id").references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  deliveryAddress: text("delivery_address").notNull(),
  comment: text("comment"),
  packerComment: text("packer_comment"),
  createdAt: text("created_at").default(sql`now()`),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"), // info, success, warning, error, order
  isRead: boolean("is_read").default(false),
  relatedOrderId: varchar("related_order_id").references(() => orders.id),
  createdAt: text("created_at").default(sql`now()`),
});

export const banners = pgTable("banners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"), // info, promo, announcement, partnership
  backgroundColor: text("background_color").default("#6366f1"), // Default gradient start color
  textColor: text("text_color").default("#ffffff"),
  buttonText: text("button_text"),
  buttonLink: text("button_link"),
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0), // Higher priority shows first
  startDate: text("start_date"),
  endDate: text("end_date"),
  createdAt: text("created_at").default(sql`now()`),
});

// Telegram authentication tables
export const verificationCodes = pgTable("verification_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phone: text("phone").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  attempts: integer("attempts").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_verification_codes_phone").on(table.phone),
  index("idx_verification_codes_expires_at").on(table.expiresAt),
]);

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_sessions_token").on(table.token),
  index("idx_sessions_user_id").on(table.userId),
]);

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertBannerSchema = createInsertSchema(banners).omit({
  id: true,
  createdAt: true,
});

export const insertVerificationCodeSchema = createInsertSchema(verificationCodes).omit({
  id: true,
  createdAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Banner = typeof banners.$inferSelect;
export type InsertBanner = z.infer<typeof insertBannerSchema>;
export type VerificationCode = typeof verificationCodes.$inferSelect;
export type InsertVerificationCode = z.infer<typeof insertVerificationCodeSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

// Custom validation schemas for auth
export const phoneAuthSchema = z.object({
  phone: z.string().min(10, "Номер телефона должен содержать минимум 10 цифр")
    .regex(/^\+?[1-9]\d{1,14}$/, "Неверный формат номера телефона"),
});

export const verifyCodeSchema = z.object({
  phone: z.string().min(10, "Номер телефона обязателен"),
  code: z.string().length(6, "Код должен содержать 6 цифр")
    .regex(/^\d{6}$/, "Код должен содержать только цифры"),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1, "Имя обязательно").optional(),
  lastName: z.string().optional(),
  address: z.string().optional(),
});
