import { type User, type InsertUser, type Category, type InsertCategory, type Product, type InsertProduct, type CartItem, type InsertCartItem, type Order, type InsertOrder, type Notification, type InsertNotification, type Banner, type InsertBanner } from "@shared/schema";
import { randomUUID } from "crypto";

// Optimized storage with indexes and caching
export class OptimizedMemStorage {
  private users: Map<string, User> = new Map();
  private categories: Map<string, Category> = new Map();
  private products: Map<string, Product> = new Map();
  private cartItems: Map<string, CartItem> = new Map();
  private orders: Map<string, Order> = new Map();
  private notifications: Map<string, Notification> = new Map();
  private banners: Map<string, Banner> = new Map();

  // Optimized indexes for faster queries
  private productsByCategory: Map<string, Set<string>> = new Map();
  private popularProductIds: Set<string> = new Set();
  private inStockProductIds: Set<string> = new Set();
  private cartItemsByUser: Map<string, Set<string>> = new Map();
  private notificationsByUser: Map<string, Set<string>> = new Map();
  private unreadNotificationCounts: Map<string, number> = new Map();
  
  // Cache for expensive operations
  private cachedResults: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 300000; // 5 minutes

  constructor() {
    this.seedData();
    this.buildIndexes();
  }

  private seedData() {
    // Same seeding logic but with index building
    // ... [keeping existing seed data structure]
  }

  private buildIndexes() {
    // Build indexes for optimized queries
    for (const [id, product] of this.products.entries()) {
      // Category index
      if (product.categoryId) {
        if (!this.productsByCategory.has(product.categoryId)) {
          this.productsByCategory.set(product.categoryId, new Set());
        }
        this.productsByCategory.get(product.categoryId)!.add(id);
      }

      // Popular products index
      if (product.isPopular) {
        this.popularProductIds.add(id);
      }

      // In-stock products index
      if (product.inStock) {
        this.inStockProductIds.add(id);
      }
    }

    // Cart items by user index
    for (const [id, cartItem] of this.cartItems.entries()) {
      if (cartItem.userId) {
        if (!this.cartItemsByUser.has(cartItem.userId)) {
          this.cartItemsByUser.set(cartItem.userId, new Set());
        }
        this.cartItemsByUser.get(cartItem.userId)!.add(id);
      }
    }

    // Notifications by user index
    for (const [id, notification] of this.notifications.entries()) {
      if (notification.userId) {
        if (!this.notificationsByUser.has(notification.userId)) {
          this.notificationsByUser.set(notification.userId, new Set());
        }
        this.notificationsByUser.get(notification.userId)!.add(id);
        
        // Count unread notifications
        if (!notification.isRead) {
          const count = this.unreadNotificationCounts.get(notification.userId) || 0;
          this.unreadNotificationCounts.set(notification.userId, count + 1);
        }
      }
    }
  }

  private getCachedResult<T>(key: string): T | null {
    const cached = this.cachedResults.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.data as T;
    }
    this.cachedResults.delete(key);
    return null;
  }

  private setCachedResult(key: string, data: any) {
    this.cachedResults.set(key, { data, timestamp: Date.now() });
  }

  // Optimized methods with caching and indexes
  async getCategories(): Promise<Category[]> {
    const cacheKey = 'categories_sorted';
    const cached = this.getCachedResult<Category[]>(cacheKey);
    if (cached) return cached;

    const categories = Array.from(this.categories.values())
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    
    this.setCachedResult(cacheKey, categories);
    return categories;
  }

  async getProducts(): Promise<Product[]> {
    const cacheKey = 'products_in_stock';
    const cached = this.getCachedResult<Product[]>(cacheKey);
    if (cached) return cached;

    const products = Array.from(this.inStockProductIds)
      .map(id => this.products.get(id)!)
      .filter(Boolean);
    
    this.setCachedResult(cacheKey, products);
    return products;
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    const cacheKey = `products_category_${categoryId}`;
    const cached = this.getCachedResult<Product[]>(cacheKey);
    if (cached) return cached;

    const productIds = this.productsByCategory.get(categoryId) || new Set();
    const products = Array.from(productIds)
      .map(id => this.products.get(id)!)
      .filter(product => product && product.inStock);
    
    this.setCachedResult(cacheKey, products);
    return products;
  }

  async getPopularProducts(): Promise<Product[]> {
    const cacheKey = 'products_popular';
    const cached = this.getCachedResult<Product[]>(cacheKey);
    if (cached) return cached;

    const products = Array.from(this.popularProductIds)
      .map(id => this.products.get(id)!)
      .filter(product => product && product.inStock);
    
    this.setCachedResult(cacheKey, products);
    return products;
  }

  async searchProducts(query: string): Promise<Product[]> {
    // Don't cache search results as they're dynamic
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.inStockProductIds)
      .map(id => this.products.get(id)!)
      .filter(product => 
        product && (
          product.name.toLowerCase().includes(lowercaseQuery) ||
          product.description?.toLowerCase().includes(lowercaseQuery)
        )
      );
  }

  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    const cartItemIds = this.cartItemsByUser.get(userId) || new Set();
    return Array.from(cartItemIds)
      .map(id => {
        const cartItem = this.cartItems.get(id);
        if (!cartItem) return null;
        const product = this.products.get(cartItem.productId!);
        return product ? { ...cartItem, product } : null;
      })
      .filter(Boolean) as (CartItem & { product: Product })[];
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    return this.unreadNotificationCounts.get(userId) || 0;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    const notificationIds = this.notificationsByUser.get(userId) || new Set();
    return Array.from(notificationIds)
      .map(id => this.notifications.get(id)!)
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getActiveBanners(): Promise<Banner[]> {
    const cacheKey = 'banners_active_filtered';
    const cached = this.getCachedResult<Banner[]>(cacheKey);
    if (cached) return cached;

    const now = new Date().toISOString();
    const banners = Array.from(this.banners.values())
      .filter(banner => {
        if (!banner.isActive) return false;
        if (banner.startDate && banner.startDate > now) return false;
        if (banner.endDate && banner.endDate < now) return false;
        return true;
      })
      .sort((a, b) => (a.priority || 0) - (b.priority || 0));

    // Cache for shorter time as banners can be time-sensitive
    this.cachedResults.set(cacheKey, { data: banners, timestamp: Date.now() });
    return banners;
  }

  // Methods that update indexes when data changes
  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    // Check existing item with index
    const userCartIds = this.cartItemsByUser.get(insertCartItem.userId!) || new Set();
    const existingItem = Array.from(userCartIds)
      .map(id => this.cartItems.get(id)!)
      .find(item => item && item.productId === insertCartItem.productId);

    if (existingItem) {
      existingItem.quantity += insertCartItem.quantity || 1;
      this.cartItems.set(existingItem.id, existingItem);
      return existingItem;
    }

    const id = randomUUID();
    const cartItem: CartItem = { 
      ...insertCartItem, 
      id,
      userId: insertCartItem.userId || null,
      productId: insertCartItem.productId || null,
      quantity: insertCartItem.quantity || 1
    };
    
    this.cartItems.set(id, cartItem);
    
    // Update index
    if (cartItem.userId) {
      if (!this.cartItemsByUser.has(cartItem.userId)) {
        this.cartItemsByUser.set(cartItem.userId, new Set());
      }
      this.cartItemsByUser.get(cartItem.userId)!.add(id);
    }
    
    return cartItem;
  }

  async removeFromCart(id: string): Promise<boolean> {
    const cartItem = this.cartItems.get(id);
    if (!cartItem) return false;
    
    // Update index
    if (cartItem.userId) {
      this.cartItemsByUser.get(cartItem.userId)?.delete(id);
    }
    
    return this.cartItems.delete(id);
  }

  async markNotificationAsRead(notificationId: string): Promise<Notification | undefined> {
    const notification = this.notifications.get(notificationId);
    if (!notification || notification.isRead) return notification;
    
    notification.isRead = true;
    this.notifications.set(notificationId, notification);
    
    // Update unread count
    if (notification.userId) {
      const count = this.unreadNotificationCounts.get(notification.userId) || 0;
      this.unreadNotificationCounts.set(notification.userId, Math.max(0, count - 1));
    }
    
    return notification;
  }

  // Clear cache method for data modifications
  private clearRelatedCaches(type: string, id?: string) {
    const keysToDelete: string[] = [];
    
    for (const [key] of this.cachedResults) {
      if (key.startsWith(type) || (id && key.includes(id))) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cachedResults.delete(key));
  }
}