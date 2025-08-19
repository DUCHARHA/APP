import { 
  type User, 
  type InsertUser, 
  type Category, 
  type InsertCategory, 
  type Product, 
  type InsertProduct, 
  type CartItem, 
  type InsertCartItem, 
  type Order, 
  type InsertOrder, 
  type Notification, 
  type InsertNotification, 
  type Banner, 
  type InsertBanner,
  type VerificationCode,
  type InsertVerificationCode,
  type Session,
  type InsertSession,
  users,
  categories,
  products,
  cartItems,
  orders,
  notifications,
  banners,
  verificationCodes,
  sessions
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, like, gte, lte, isNull, or, lt } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;

  // Authentication
  createVerificationCode(code: InsertVerificationCode): Promise<VerificationCode>;
  getValidVerificationCode(phone: string, code: string): Promise<VerificationCode | undefined>;
  markCodeAsUsed(codeId: string): Promise<void>;
  incrementCodeAttempts(codeId: string): Promise<void>;
  cleanupExpiredCodes(): Promise<void>;

  // Sessions
  createSession(session: InsertSession): Promise<Session>;
  getSession(token: string): Promise<Session | undefined>;
  invalidateSession(token: string): Promise<void>;
  cleanupExpiredSessions(): Promise<void>;

  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Products
  getProducts(): Promise<Product[]>;
  getProductsByCategory(categoryId: string): Promise<Product[]>;
  getPopularProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  searchProducts(query: string): Promise<Product[]>;

  // Cart
  getCartItems(userId: string): Promise<(CartItem & { product: Product })[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: string): Promise<boolean>;
  clearCart(userId: string): Promise<boolean>;

  // Orders
  createOrder(order: InsertOrder): Promise<Order>;
  getUserOrders(userId: string): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  getOrderById(orderId: string): Promise<Order | undefined>;
  updateOrderStatus(orderId: string, status: string): Promise<Order | undefined>;
  deleteOrder(orderId: string): Promise<boolean>;

  // Notifications
  getUserNotifications(userId: string): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(notificationId: string): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: string): Promise<boolean>;

  // Banners
  getActiveBanners(): Promise<Banner[]>;
  getAllBanners(): Promise<Banner[]>;
  createBanner(banner: InsertBanner): Promise<Banner>;
  updateBanner(id: string, banner: Partial<InsertBanner>): Promise<Banner | undefined>;
  deleteBanner(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Authentication
  async createVerificationCode(codeData: InsertVerificationCode): Promise<VerificationCode> {
    const [code] = await db
      .insert(verificationCodes)
      .values({
        ...codeData,
        createdAt: new Date(),
      })
      .returning();
    return code;
  }

  async getValidVerificationCode(phone: string, code: string): Promise<VerificationCode | undefined> {
    const [verificationCode] = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.phone, phone),
          eq(verificationCodes.code, code),
          eq(verificationCodes.isUsed, false),
          gte(verificationCodes.expiresAt, new Date()),
          lt(verificationCodes.attempts, 3)
        )
      );
    return verificationCode;
  }

  async markCodeAsUsed(codeId: string): Promise<void> {
    await db
      .update(verificationCodes)
      .set({ isUsed: true })
      .where(eq(verificationCodes.id, codeId));
  }

  async incrementCodeAttempts(codeId: string): Promise<void> {
    await db
      .update(verificationCodes)
      .set({ 
        attempts: db.select({ attempts: verificationCodes.attempts })
          .from(verificationCodes)
          .where(eq(verificationCodes.id, codeId))
          .limit(1) as any + 1 
      })
      .where(eq(verificationCodes.id, codeId));
  }

  async cleanupExpiredCodes(): Promise<void> {
    await db
      .delete(verificationCodes)
      .where(lt(verificationCodes.expiresAt, new Date()));
  }

  // Sessions
  async createSession(sessionData: InsertSession): Promise<Session> {
    const [session] = await db
      .insert(sessions)
      .values({
        ...sessionData,
        createdAt: new Date(),
      })
      .returning();
    return session;
  }

  async getSession(token: string): Promise<Session | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.token, token),
          eq(sessions.isActive, true),
          gte(sessions.expiresAt, new Date())
        )
      );
    return session;
  }

  async invalidateSession(token: string): Promise<void> {
    await db
      .update(sessions)
      .set({ isActive: false })
      .where(eq(sessions.token, token));
  }

  async cleanupExpiredSessions(): Promise<void> {
    await db
      .delete(sessions)
      .where(lt(sessions.expiresAt, new Date()));
  }

  // Categories - seed with initial data
  async getCategories(): Promise<Category[]> {
    let categoryList = await db.select().from(categories).orderBy(categories.sortOrder);
    
    // If no categories exist, seed them
    if (categoryList.length === 0) {
      const seedCategories = [
        { name: "Овощи и фрукты", slug: "vegetables", imageUrl: "https://images.unsplash.com/photo-1506976773555-b3da30a63b57?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 1 },
        { name: "Молочные продукты", slug: "dairy", imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 2 },
        { name: "Мясо и рыба", slug: "meat", imageUrl: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 3 },
        { name: "Снеки и напитки", slug: "snacks", imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 4 },
        { name: "Готовые блюда", slug: "ready-meals", imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 5 },
        { name: "Хлеб и выпечка", slug: "bakery", imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 6 },
        { name: "Крупы и макароны", slug: "cereals", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 7 },
        { name: "Сладости", slug: "sweets", imageUrl: "https://images.unsplash.com/photo-1551024506-0bccd828d307?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 8 }
      ];
      
      categoryList = await db.insert(categories).values(seedCategories).returning();
    }
    
    return categoryList;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  // Products - seed with initial data
  async getProducts(): Promise<Product[]> {
    let productList = await db.select().from(products);
    
    // If no products exist, seed them
    if (productList.length === 0) {
      const categoryList = await this.getCategories();
      const categoryMap = Object.fromEntries(categoryList.map(cat => [cat.slug, cat.id]));
      
      const seedProducts = [
        { 
          name: "Хлеб Бородинский", 
          description: "Ржаной хлеб", 
          price: "89.00", 
          weight: "500г", 
          imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", 
          categoryId: categoryMap["bakery"], 
          isPopular: true,
          ingredients: "Мука ржаная обдирная, мука пшеничная в/с, вода, соль, дрожжи хлебопекарные, солод ржаной, кориандр",
          manufacturer: "Хлебозавод №1",
          countryOfOrigin: "Россия"
        },
        { 
          name: "Молоко Простоквашино 3.2%", 
          description: "Натуральное молоко", 
          price: "75.00", 
          weight: "930мл", 
          imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", 
          categoryId: categoryMap["dairy"], 
          isPopular: true,
          ingredients: "Молоко цельное пастеризованное",
          manufacturer: "ООО \"Простоквашино\"",
          countryOfOrigin: "Россия"
        },
        { 
          name: "Плов Душанбинский", 
          description: "Готовый плов по-таджикски", 
          price: "350.00", 
          weight: "400г", 
          imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", 
          categoryId: categoryMap["ready-meals"],
          isPopular: true,
          ingredients: "Рис, баранина, морковь, лук, масло, специи",
          manufacturer: "Вкус Востока",
          countryOfOrigin: "Таджикистан"
        },
        { 
          name: "Яблоки Гала", 
          description: "Сладкие красные яблоки", 
          price: "159.00", 
          weight: "1кг", 
          imageUrl: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", 
          categoryId: categoryMap["vegetables"], 
          isPopular: true,
          ingredients: "Яблоки свежие",
          manufacturer: "Садоводческое хозяйство \"Солнечный сад\"",
          countryOfOrigin: "Россия"
        }
      ];
      
      productList = await db.insert(products).values(seedProducts).returning();
    }
    
    return productList;
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return db.select().from(products).where(eq(products.categoryId, categoryId));
  }

  async getPopularProducts(): Promise<Product[]> {
    return db.select().from(products).where(eq(products.isPopular, true));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async searchProducts(query: string): Promise<Product[]> {
    return db.select().from(products).where(like(products.name, `%${query}%`));
  }

  // Cart
  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    const result = await db
      .select({
        id: cartItems.id,
        userId: cartItems.userId,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        product: products
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId));
    
    return result;
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    const [newCartItem] = await db.insert(cartItems).values(cartItem).returning();
    return newCartItem;
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    const [cartItem] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return cartItem;
  }

  async removeFromCart(id: string): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.id, id));
    return result.count > 0;
  }

  async clearCart(userId: string): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.userId, userId));
    return result.count > 0;
  }

  // Orders
  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  }

  async getAllOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrderById(orderId: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    return order;
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, orderId))
      .returning();
    return order;
  }

  async deleteOrder(orderId: string): Promise<boolean> {
    const result = await db.delete(orders).where(eq(orders.id, orderId));
    return result.count > 0;
  }

  // Notifications
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result.length;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(notificationId: string): Promise<Notification | undefined> {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId))
      .returning();
    return notification;
  }

  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result.count > 0;
  }

  // Banners
  async getActiveBanners(): Promise<Banner[]> {
    const now = new Date().toISOString();
    return db
      .select()
      .from(banners)
      .where(
        and(
          eq(banners.isActive, true),
          or(
            isNull(banners.startDate),
            lte(banners.startDate, now)
          ),
          or(
            isNull(banners.endDate),
            gte(banners.endDate, now)
          )
        )
      )
      .orderBy(banners.priority);
  }

  async getAllBanners(): Promise<Banner[]> {
    return db.select().from(banners).orderBy(desc(banners.createdAt));
  }

  async createBanner(banner: InsertBanner): Promise<Banner> {
    const [newBanner] = await db.insert(banners).values(banner).returning();
    return newBanner;
  }

  async updateBanner(id: string, bannerData: Partial<InsertBanner>): Promise<Banner | undefined> {
    const [banner] = await db
      .update(banners)
      .set(bannerData)
      .where(eq(banners.id, id))
      .returning();
    return banner;
  }

  async deleteBanner(id: string): Promise<boolean> {
    const result = await db.delete(banners).where(eq(banners.id, id));
    return result.count > 0;
  }
}

export const storage = new DatabaseStorage();