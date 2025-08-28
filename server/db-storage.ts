import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc, sql } from "drizzle-orm";
import type { IStorage } from "./storage";
import { 
  users, categories, products, cartItems, orders, notifications, banners, userPreferences,
  type User, type InsertUser, type Category, type InsertCategory, 
  type Product, type InsertProduct, type CartItem, type InsertCartItem, 
  type Order, type InsertOrder, type Notification, type InsertNotification,
  type Banner, type InsertBanner, type UserPreferences, type InsertUserPreferences
} from "@shared/schema";
import { randomUUID } from "crypto";

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = neon(process.env.DATABASE_URL);
const db = drizzle(client);

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeWithData();
  }

  private async initializeWithData() {
    // Check if data already exists
    const existingCategories = await db.select().from(categories).limit(1);
    if (existingCategories.length > 0) return; // Data already seeded

    // Seed initial data
    await this.seedCategories();
    await this.seedProducts();
    await this.seedUsers();
    await this.seedBanners();
    await this.seedNotifications();
    await this.seedUserPreferences();
  }

  private async seedCategories() {
    const categoriesData = [
      { name: "Овощи и фрукты", slug: "vegetables", imageUrl: "https://images.unsplash.com/photo-1506976773555-b3da30a63b57?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 1 },
      { name: "Молочные продукты", slug: "dairy", imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 2 },
      { name: "Мясо и рыба", slug: "meat", imageUrl: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 3 },
      { name: "Снеки и напитки", slug: "snacks", imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 4 },
      { name: "Готовые блюда", slug: "ready-meals", imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 5 },
      { name: "Хлеб и выпечка", slug: "bakery", imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 6 },
      { name: "Крупы и макароны", slug: "cereals", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 7 },
      { name: "Консервы", slug: "canned", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 8 },
      { name: "Сладости", slug: "sweets", imageUrl: "https://images.unsplash.com/photo-1551024506-0bccd828d307?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 9 },
      { name: "Замороженные продукты", slug: "frozen", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 10 }
    ];

    await db.insert(categories).values(categoriesData);
  }

  private async seedProducts() {
    const allCategories = await db.select().from(categories);
    const categoryMap = new Map(allCategories.map(c => [c.slug, c.id]));

    const productsData = [
      {
        name: "Хлеб Бородинский",
        description: "Ржаной хлеб",
        price: "89.00",
        weight: "500г",
        imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200",
        categoryId: categoryMap.get("bakery"),
        isPopular: true,
        ingredients: "Мука ржаная обдирная, мука пшеничная в/с, вода, соль, дрожжи хлебопекарные",
        manufacturer: "Хлебозавод №1",
        countryOfOrigin: "Россия",
        calories: 208
      },
      {
        name: "Молоко Простоквашино 3.2%",
        description: "Натуральное молоко",
        price: "75.00",
        weight: "930мл",
        imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200",
        categoryId: categoryMap.get("dairy"),
        isPopular: true,
        ingredients: "Молоко цельное пастеризованное",
        manufacturer: "ООО \"Простоквашино\"",
        countryOfOrigin: "Россия",
        calories: 60
      }
    ];

    await db.insert(products).values(productsData);
  }

  private async seedUsers() {
    const userData = {
      id: "demo-user",
      username: "demo",
      email: "demo@example.com",
      phone: "+992 12 345 6789",
      address: "ул. Рудаки, 25, кв. 10, Душанбе"
    };

    await db.insert(users).values(userData).onConflictDoNothing();
  }

  private async seedBanners() {
    const bannersData = [
      {
        title: "Скидка 20% на первый заказ",
        subtitle: "Промокод",
        message: "Используйте промокод при оформлении заказа и получите скидку 20%",
        type: "promo",
        backgroundColor: "#3b82f6",
        textColor: "#ffffff",
        buttonText: "Скопировать промокод",
        buttonLink: "/catalog",
        isActive: true,
        priority: 0
      },
      {
        title: "Доставка продуктов быстрее, чем поход в магазин",
        subtitle: "Экспресс доставка",
        message: "Свежие продукты к вашему столу за 10-15 минут",
        type: "promo",
        backgroundColor: "#22c55e",
        textColor: "#ffffff",
        buttonText: "",
        buttonLink: "",
        isActive: true,
        priority: 1
      },
      {
        title: "RC Cola - Освежись сейчас!",
        subtitle: "Партнерская акция",
        message: "Получи RC Cola бесплатно при заказе от 50 сомони",
        type: "partnership",
        backgroundColor: "#f97316",
        textColor: "#ffffff",
        buttonText: "Получить колу",
        buttonLink: "/catalog",
        isActive: true,
        priority: 2
      }
    ];

    await db.insert(banners).values(bannersData);
  }

  private async seedNotifications() {
    const notificationsData = [
      {
        userId: "demo-user",
        title: "Скидка на первый заказ",
        message: "Используйте промокод ПЕРВЫЙ при оформлении заказа и получите скидку 15%",
        type: "info",
        isRead: false
      },
      {
        userId: "demo-user",
        title: "Новые продукты в каталоге",
        message: "Добавили свежие фрукты и овощи. Оформите заказ до 23:00 для доставки сегодня",
        type: "info",
        isRead: true
      }
    ];

    await db.insert(notifications).values(notificationsData);
  }

  private async seedUserPreferences() {
    const preferencesData = {
      userId: "demo-user",
      theme: "light",
      primaryColor: "#6366f1",
      language: "ru",
      notifications: true
    };

    await db.insert(userPreferences).values(preferencesData).onConflictDoNothing();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return result[0];
  }

  // User Preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    // Check if user exists, create if not
    const existingUser = await this.getUser(userId);
    if (!existingUser) {
      await this.createUser({
        id: userId,
        username: `user_${userId.slice(0, 8)}`,
        email: `${userId}@temp.local`
      });
    }
    
    const result = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
    return result[0];
  }

  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const result = await db.insert(userPreferences).values({
      ...preferences,
      updatedAt: new Date().toISOString()
    }).returning();
    return result[0];
  }

  async updateUserPreferences(userId: string, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined> {
    const result = await db.update(userPreferences)
      .set({
        ...preferences,
        updatedAt: new Date().toISOString()
      })
      .where(eq(userPreferences.userId, userId))
      .returning();
    return result[0];
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.sortOrder);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(category).returning();
    return result[0];
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.categoryId, categoryId));
  }

  async getPopularProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isPopular, true));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(product).returning();
    return result[0];
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await db.select().from(products).where(
      sql`${products.name} ILIKE ${`%${query}%`} OR ${products.description} ILIKE ${`%${query}%`}`
    );
  }

  // Cart
  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    // Check if user exists, create if not
    const existingUser = await this.getUser(userId);
    if (!existingUser) {
      await this.createUser({
        id: userId,
        username: `user_${userId.slice(0, 8)}`,
        email: `${userId}@temp.local`
      });
    }
    
    const result = await db
      .select({
        id: cartItems.id,
        userId: cartItems.userId,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        product: products
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId));
    
    return result.map(row => ({
      id: row.id,
      userId: row.userId,
      productId: row.productId,
      quantity: row.quantity,
      product: row.product!
    }));
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    // Ensure user exists before adding to cart
    if (cartItem.userId) {
      try {
        const existingUser = await this.getUser(cartItem.userId);
        if (!existingUser) {
          // Create user automatically with minimal data
          await this.createUser({
            id: cartItem.userId,
            username: `user_${cartItem.userId.slice(0, 8)}`,
            email: `${cartItem.userId}@temp.local`
          });
        }
      } catch (error) {
        // If user creation fails, try to insert anyway (user might exist due to race condition)
        console.warn('Failed to create user, attempting cart insert anyway:', error);
      }
    }
    
    try {
      const result = await db.insert(cartItems).values(cartItem).returning();
      return result[0];
    } catch (error: any) {
      // If foreign key constraint fails, try creating user again
      if (error.message?.includes('foreign key constraint') && cartItem.userId) {
        try {
          await this.createUser({
            id: cartItem.userId,
            username: `user_${cartItem.userId.slice(0, 8)}`,
            email: `${cartItem.userId}@temp.local`
          });
          // Try again after creating user
          const result = await db.insert(cartItems).values(cartItem).returning();
          return result[0];
        } catch (retryError) {
          console.error('Failed to create user and add to cart:', retryError);
          throw retryError;
        }
      }
      throw error;
    }
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    const result = await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, id)).returning();
    return result[0];
  }

  async removeFromCart(id: string): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.id, id));
    return result.rowCount > 0;
  }

  async clearCart(userId: string): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.userId, userId));
    return result.rowCount > 0;
  }

  // Orders
  async createOrder(order: InsertOrder): Promise<Order> {
    const result = await db.insert(orders).values(order).returning();
    return result[0];
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrderById(orderId: string): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    return result[0];
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order | undefined> {
    const result = await db.update(orders).set({ status }).where(eq(orders.id, orderId)).returning();
    return result[0];
  }

  async deleteOrder(orderId: string): Promise<boolean> {
    const result = await db.delete(orders).where(eq(orders.id, orderId));
    return result.rowCount > 0;
  }

  // Notifications
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(notifications)
      .where(sql`${notifications.userId} = ${userId} AND ${notifications.isRead} = false`);
    return result[0].count;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }

  async markNotificationAsRead(notificationId: string): Promise<Notification | undefined> {
    const result = await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, notificationId)).returning();
    return result[0];
  }

  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    const result = await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
    return result.rowCount > 0;
  }

  // Banners
  async getActiveBanners(): Promise<Banner[]> {
    return await db.select().from(banners).where(eq(banners.isActive, true)).orderBy(banners.priority);
  }

  async getAllBanners(): Promise<Banner[]> {
    return await db.select().from(banners).orderBy(banners.priority);
  }

  async createBanner(banner: InsertBanner): Promise<Banner> {
    const result = await db.insert(banners).values(banner).returning();
    return result[0];
  }

  async updateBanner(id: string, banner: Partial<InsertBanner>): Promise<Banner | undefined> {
    const result = await db.update(banners).set(banner).where(eq(banners.id, id)).returning();
    return result[0];
  }

  async deleteBanner(id: string): Promise<boolean> {
    const result = await db.delete(banners).where(eq(banners.id, id));
    return result.rowCount > 0;
  }


}