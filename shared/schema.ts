import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  address: text("address"),
  role: text("role").notNull().default("user"), // Values: "admin", "user"
  status: text("status").notNull().default("active"), // Values: "active", "blocked"
  createdAt: text("created_at").default(sql`now()`),
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
  promoCode: text("promo_code"), // Добавляем поле для промокода
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

export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  theme: text("theme").notNull().default("light"), // light, dark, system
  primaryColor: text("primary_color").default("#6366f1"), // CSS color value
  accentColor: text("accent_color").default("#10b981"), // CSS color value
  backgroundColor: text("background_color"), // Custom background color
  customCss: text("custom_css"), // Custom CSS overrides
  updatedAt: text("updated_at").default(sql`now()`),
  createdAt: text("created_at").default(sql`now()`),
});

export const errors = pgTable("errors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  message: text("message").notNull(),
  stack: text("stack"), // Error stack trace
  type: text("type").notNull().default("js_error"), // js_error, api_error, boundary_error, network_error, etc.
  source: text("source").notNull().default("frontend"), // frontend, backend
  url: text("url"), // Page/endpoint where error occurred
  userAgent: text("user_agent"), // Browser information
  userId: varchar("user_id").references(() => users.id), // Optional: user who experienced the error
  level: text("level").notNull().default("error"), // error, warning, info
  metadata: text("metadata"), // JSON string with additional context
  resolved: boolean("resolved").default(false), // Whether error has been addressed
  resolvedAt: text("resolved_at"), // When error was marked as resolved
  resolvedBy: varchar("resolved_by").references(() => users.id), // Admin who resolved the error
  createdAt: text("created_at").default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  role: true, // Server controls role assignment
  status: true, // Server controls status changes
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
  totalAmount: true, // Сервер вычислит сумму сам для безопасности
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

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertErrorSchema = createInsertSchema(errors).omit({
  id: true,
  resolvedAt: true, // Server controls resolution timing
  resolvedBy: true, // Server controls who resolved it
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
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type Error = typeof errors.$inferSelect;
export type InsertError = z.infer<typeof insertErrorSchema>;

// Enhanced profile and statistics types
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  phone?: string;
  address?: string;
  avatar?: string;
  preferences: UserPreferences;
  statistics: UserStatistics;
  metadata: UserMetadata;
}

export interface UserStatistics {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  favoriteCategories: string[];
  lastOrderDate?: string;
  loyaltyLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
  deliveryAddresses: number;
  completedOrders: number;
  cancelledOrders: number;
}

export interface UserMetadata {
  createdAt: string;
  lastLoginAt?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  onboardingCompleted: boolean;
  hasProfilePhoto: boolean;
}

// Enhanced user preferences with detailed settings
export interface ExtendedUserPreferences extends UserPreferences {
  // Notification preferences
  notifications: {
    orderUpdates: boolean;
    promotions: boolean;
    recommendations: boolean;
    newsletters: boolean;
    pushEnabled: boolean;
    emailEnabled: boolean;
  };
  // Delivery preferences
  delivery: {
    defaultAddress?: string;
    preferredTimeSlots: string[];
    contactlessDelivery: boolean;
    leaveAtDoor: boolean;
    callOnArrival: boolean;
  };
  // App preferences
  app: {
    language: 'ru' | 'en' | 'tj';
    currency: 'TJS' | 'USD' | 'RUB';
    measurementUnit: 'metric' | 'imperial';
    compactView: boolean;
    showPrices: boolean;
    autoRefresh: boolean;
  };
  // Privacy preferences
  privacy: {
    shareStatistics: boolean;
    allowAnalytics: boolean;
    showOnlineStatus: boolean;
    dataCollection: boolean;
  };
}

// Form validation schemas
export const updateProfileSchema = z.object({
  username: z.string().min(2, 'Имя должно содержать минимум 2 символа').max(50, 'Имя слишком длинное'),
  email: z.string().email('Некорректный email').optional(),
  phone: z.string().min(10, 'Некорректный номер телефона').optional(),
  address: z.string().max(200, 'Адрес слишком длинный').optional(),
  avatar: z.string().url('Некорректная ссылка на изображение').optional(),
});

export const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Некорректный цвет').optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Некорректный цвет').optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Некорректный цвет').optional(),
  notifications: z.object({
    orderUpdates: z.boolean().optional(),
    promotions: z.boolean().optional(),
    recommendations: z.boolean().optional(),
    newsletters: z.boolean().optional(),
    pushEnabled: z.boolean().optional(),
    emailEnabled: z.boolean().optional(),
  }).optional(),
  delivery: z.object({
    defaultAddress: z.string().optional(),
    preferredTimeSlots: z.array(z.string()).optional(),
    contactlessDelivery: z.boolean().optional(),
    leaveAtDoor: z.boolean().optional(),
    callOnArrival: z.boolean().optional(),
  }).optional(),
  app: z.object({
    language: z.enum(['ru', 'en', 'tj']).optional(),
    currency: z.enum(['TJS', 'USD', 'RUB']).optional(),
    measurementUnit: z.enum(['metric', 'imperial']).optional(),
    compactView: z.boolean().optional(),
    showPrices: z.boolean().optional(),
    autoRefresh: z.boolean().optional(),
  }).optional(),
  privacy: z.object({
    shareStatistics: z.boolean().optional(),
    allowAnalytics: z.boolean().optional(),
    showOnlineStatus: z.boolean().optional(),
    dataCollection: z.boolean().optional(),
  }).optional(),
});

export type UpdateProfileData = z.infer<typeof updateProfileSchema>;
export type UpdatePreferencesData = z.infer<typeof updatePreferencesSchema>;

// Order filtering and pagination types
export interface OrderFilterOptions {
  status?: string;
  search?: string;
  sortBy?: 'createdAt' | 'totalAmount' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedOrdersResponse {
  orders: Order[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface OrderWithDetails extends Order {
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    productPrice: string;
    quantity: number;
    totalPrice: string;
  }>;
  user?: {
    id: string;
    username: string;
    email: string;
    phone?: string;
  };
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  statusCounts: {
    pending: number;
    processing: number;
    delivering: number;
    completed: number;
    cancelled: number;
  };
  averageOrderValue: number;
  revenueByDay: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
}

// Admin user management schemas and types
export const updateUserRoleSchema = z.object({
  role: z.enum(['admin', 'user']).refine(
    (role) => role === 'admin' || role === 'user',
    { message: 'Role must be either "admin" or "user"' }
  )
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'blocked']).refine(
    (status) => status === 'active' || status === 'blocked',
    { message: 'Status must be either "active" or "blocked"' }
  )
});

export const adminUpdateUserSchema = z.object({
  username: z.string().min(2, 'Username must be at least 2 characters').max(50).optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().min(10, 'Phone must be at least 10 characters').optional(),
  address: z.string().max(200, 'Address is too long').optional(),
  role: z.enum(['admin', 'user']).optional(),
  status: z.enum(['active', 'blocked']).optional()
});

export type UpdateUserRole = z.infer<typeof updateUserRoleSchema>;
export type UpdateUserStatus = z.infer<typeof updateUserStatusSchema>;
export type AdminUpdateUser = z.infer<typeof adminUpdateUserSchema>;

// User filtering and pagination types for admin
export interface UserFilterOptions {
  role?: 'admin' | 'user' | 'all';
  status?: 'active' | 'blocked' | 'all';
  search?: string;
  sortBy?: 'createdAt' | 'username' | 'email' | 'role' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedUsersResponse {
  users: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: {
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    adminUsers: number;
    regularUsers: number;
  };
}

export interface UserWithStats extends User {
  totalOrders: number;
  totalSpent: number;
  lastLoginAt?: string;
  lastOrderAt?: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  adminUsers: number;
  regularUsers: number;
  activeUsersWithOrders: number;
  registrationsByDay: Array<{
    date: string;
    count: number;
  }>;
  topCustomers: Array<{
    userId: string;
    username: string;
    email: string;
    orderCount: number;
    totalSpent: number;
  }>;
}

export interface ProductStats {
  totalProducts: number;
  outOfStockProducts: number;
  popularProducts: number;
  averagePrice: number;
  totalInventoryValue: number;
  productsByCategory: Array<{
    categoryId: string;
    categoryName: string;
    count: number;
    averagePrice: number;
  }>;
  topSellingProducts: Array<{
    productId: string;
    productName: string;
    totalSold: number;
    revenue: number;
    averageRating?: number;
  }>;
  priceDistribution: Array<{
    range: string;
    count: number;
  }>;
  salesByDay: Array<{
    date: string;
    productsSold: number;
    revenue: number;
  }>;
}

export interface CategoryStats {
  totalCategories: number;
  categoriesWithProducts: number;
  averageProductsPerCategory: number;
  categoryPerformance: Array<{
    categoryId: string;
    categoryName: string;
    totalProducts: number;
    totalSales: number;
    revenue: number;
    averageProductPrice: number;
    popularityScore: number;
  }>;
  salesByCategory: Array<{
    categoryId: string;
    categoryName: string;
    salesByDay: Array<{
      date: string;
      sales: number;
      revenue: number;
    }>;
  }>;
}

export interface PromoCodeStats {
  totalPromoCodes: number;
  activePromoCodes: number;
  usageStats: Array<{
    code: string;
    description: string;
    discount: number;
    timesUsed: number;
    totalDiscount: number;
    isActive: boolean;
  }>;
  discountsByDay: Array<{
    date: string;
    totalDiscounts: number;
    ordersWithPromo: number;
  }>;
  mostPopularPromos: Array<{
    code: string;
    discount: number;
    usageCount: number;
    revenue: number;
  }>;
}

export interface AnalyticsOverview {
  orderStats: OrderStats;
  userStats: UserStats;
  productStats: ProductStats;
  categoryStats: CategoryStats;
  promoCodeStats: PromoCodeStats;
  peakHoursStats: Array<{
    hour: number;
    orderCount: number;
    revenue: number;
  }>;
  growthMetrics: {
    orderGrowth: number; // percentage
    revenueGrowth: number; // percentage
    userGrowth: number; // percentage
  };
}
