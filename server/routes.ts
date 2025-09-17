import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertCartItemSchema, insertOrderSchema, insertNotificationSchema, insertBannerSchema, insertUserPreferencesSchema } from "@shared/schema";
import crypto from "crypto";
import fs from "fs";
import path from "path";

// Cache for ETag generation
const dataCache = new Map<string, { etag: string; data: any; timestamp: number }>();

// Helper function to generate ETag
function generateETag(data: any): string {
  return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
}

// Helper function to check if cache is valid (for performance optimization)
function isCacheValid(cacheKey: string, maxAge: number = 300000): boolean { // 5 minutes default
  const cached = dataCache.get(cacheKey);
  return cached ? (Date.now() - cached.timestamp) < maxAge : false;
}

// Helper function to invalidate all product cache keys
function invalidateProductCache(): void {
  // Clear all cache keys that start with 'products_' to handle all variants
  for (const [key] of dataCache) {
    if (key.startsWith('products_')) {
      dataCache.delete(key);
    }
  }
}

// Enhanced error logging
function logError(error: any, context: string, req: any) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR in ${context}:`, {
    message: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    params: req.params,
    query: req.query,
    userAgent: req.get('User-Agent')
  });
}

// Store valid admin tokens with expiration
const validAdminTokens = new Map<string, { expires: number }>();

// Helper function to generate secure token
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Helper function to verify admin credentials
function verifyAdminCredentials(username: string, password: string): boolean {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  // Require environment variables - fail securely if not provided
  if (!adminUsername || !adminPassword) {
    console.error('[SECURITY] Admin credentials not configured in environment variables');
    return false;
  }
  
  return username === adminUsername && password === adminPassword;
}

// Helper function to clean expired tokens
function cleanExpiredTokens(): void {
  const now = Date.now();
  validAdminTokens.forEach((data, token) => {
    if (data.expires < now) {
      validAdminTokens.delete(token);
    }
  });
}

// Middleware to check admin authentication
function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  const token = authHeader.substring(7);
  
  // Clean expired tokens first
  cleanExpiredTokens();
  
  // Check if token exists and is not expired
  const tokenData = validAdminTokens.get(token);
  if (!tokenData || tokenData.expires < Date.now()) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Admin login endpoint
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      
      if (verifyAdminCredentials(username, password)) {
        const token = generateSecureToken();
        const expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
        
        // Store token with expiration
        validAdminTokens.set(token, { expires });
        
        res.json({ 
          token,
          expires,
          message: "Login successful" 
        });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (error) {
      logError(error, 'POST /api/admin/login', req);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Promo codes API
  app.get("/api/promo-codes/validate/:code", async (req, res) => {
    try {
      const { code } = req.params;
      
      // Server-side promo codes validation
      const promoCodes = [
        { code: "ПЕРВЫЙ", discount: 20, description: "Скидка 20% на первый заказ", isActive: true },
        { code: "ДРУЗЬЯМ", discount: 15, description: "Скидка 15% для друзей", isActive: true },
        { code: "ЛЕТОМ", discount: 10, description: "Летняя скидка 10%", isActive: true },
      ];
      
      const promoCode = promoCodes.find(
        promo => promo.code.toUpperCase() === code.toUpperCase() && promo.isActive
      );
      
      if (promoCode) {
        res.json({ valid: true, ...promoCode });
      } else {
        res.status(404).json({ valid: false, error: "Промокод не найден или неактивен" });
      }
    } catch (error) {
      logError(error, 'GET /api/promo-codes/validate', req);
      res.status(500).json({ error: "Failed to validate promo code" });
    }
  });

  // Categories (with caching)
  app.get("/api/categories", async (req, res) => {
    try {
      const cacheKey = 'categories';
      
      // Check cache first for performance
      if (isCacheValid(cacheKey, 600000)) { // 10 minutes cache
        const cached = dataCache.get(cacheKey)!;
        
        // Check ETag for 304 Not Modified
        if (req.get('If-None-Match') === cached.etag) {
          return res.status(304).end();
        }
        
        res.set('ETag', cached.etag);
        res.set('Cache-Control', 'public, max-age=600');
        return res.json(cached.data);
      }
      
      const categories = await storage.getCategories();
      const etag = generateETag(categories);
      
      // Update cache
      dataCache.set(cacheKey, { etag, data: categories, timestamp: Date.now() });
      
      // Check ETag for 304 Not Modified
      if (req.get('If-None-Match') === etag) {
        return res.status(304).end();
      }
      
      res.set('ETag', etag);
      res.set('Cache-Control', 'public, max-age=600');
      res.json(categories);
    } catch (error) {
      logError(error, 'GET /api/categories', req);
      res.status(500).json({ error: "Failed to fetch categories", requestId: crypto.randomUUID().slice(0, 8) });
    }
  });

  // Products (with enhanced caching and performance optimization)
  app.get("/api/products", async (req, res) => {
    try {
      const { category, search, popular } = req.query;
      const cacheKey = `products_${popular || category || search || 'all'}`;
      
      // Different cache times based on query type
      let cacheTime = 300000; // 5 minutes default
      if (popular === "true") cacheTime = 600000; // 10 minutes for popular
      if (!search && !category && !popular) cacheTime = 900000; // 15 minutes for all products
      
      // Check cache first (skip for search to ensure fresh results)
      if (!search && isCacheValid(cacheKey, cacheTime)) {
        const cached = dataCache.get(cacheKey)!;
        
        if (req.get('If-None-Match') === cached.etag) {
          return res.status(304).end();
        }
        
        res.set('ETag', cached.etag);
        res.set('Cache-Control', `public, max-age=${Math.floor(cacheTime / 1000)}`);
        return res.json(cached.data);
      }
      
      let products;
      if (popular === "true") {
        products = await storage.getPopularProducts();
      } else if (category) {
        products = await storage.getProductsByCategory(category as string);
      } else if (search) {
        products = await storage.searchProducts(search as string);
        // Shorter cache for search results
        cacheTime = 60000; // 1 minute
      } else {
        products = await storage.getProducts();
      }
      
      const etag = generateETag(products);
      
      // Cache non-search results
      if (!search || (search && products.length > 0)) {
        dataCache.set(cacheKey, { etag, data: products, timestamp: Date.now() });
      }
      
      if (req.get('If-None-Match') === etag) {
        return res.status(304).end();
      }
      
      res.set('ETag', etag);
      res.set('Cache-Control', `public, max-age=${Math.floor(cacheTime / 1000)}`);
      res.json(products);
    } catch (error) {
      logError(error, 'GET /api/products', req);
      res.status(500).json({ error: "Failed to fetch products", requestId: crypto.randomUUID().slice(0, 8) });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  // Users
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, userData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  // Cart (optimized with short-term caching)
  app.get("/api/cart/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const cacheKey = `cart_${userId}`;
      
      // Short cache for cart (30 seconds)
      if (isCacheValid(cacheKey, 30000)) {
        const cached = dataCache.get(cacheKey)!;
        
        if (req.get('If-None-Match') === cached.etag) {
          return res.status(304).end();
        }
        
        res.set('ETag', cached.etag);
        res.set('Cache-Control', 'private, max-age=30');
        return res.json(cached.data);
      }
      
      const cartItems = await storage.getCartItems(userId);
      const etag = generateETag(cartItems);
      
      dataCache.set(cacheKey, { etag, data: cartItems, timestamp: Date.now() });
      
      if (req.get('If-None-Match') === etag) {
        return res.status(304).end();
      }
      
      res.set('ETag', etag);
      res.set('Cache-Control', 'private, max-age=30');
      res.json(cartItems);
    } catch (error) {
      logError(error, 'GET /api/cart/:userId', req);
      res.status(500).json({ error: "Failed to fetch cart items", requestId: crypto.randomUUID().slice(0, 8) });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const cartItemData = insertCartItemSchema.parse(req.body);
      
      // Validate quantity before adding to cart
      if (cartItemData.quantity && (cartItemData.quantity < 1 || cartItemData.quantity > 99)) {
        return res.status(400).json({ error: "Invalid quantity. Must be between 1 and 99" });
      }
      
      const cartItem = await storage.addToCart(cartItemData);
      
      // Invalidate cart cache for this user
      const cacheKey = `cart_${cartItemData.userId}`;
      dataCache.delete(cacheKey);
      
      res.status(201).json(cartItem);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        logError(error, 'POST /api/cart - Validation Error', req);
        return res.status(400).json({ error: "Invalid cart item data", details: error.errors });
      }
      logError(error, 'POST /api/cart', req);
      res.status(500).json({ error: "Failed to add item to cart", requestId: crypto.randomUUID().slice(0, 8) });
    }
  });

  app.put("/api/cart/:id", async (req, res) => {
    try {
      const { quantity } = req.body;
      
      // Validate quantity
      if (typeof quantity !== 'number' || quantity < 0 || quantity > 99) {
        return res.status(400).json({ error: "Invalid quantity. Must be between 0 and 99" });
      }
      
      const cartItem = await storage.updateCartItem(req.params.id, quantity);
      if (!cartItem) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      res.json(cartItem);
    } catch (error) {
      res.status(400).json({ error: "Invalid quantity" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const success = await storage.removeFromCart(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove cart item" });
    }
  });

  app.delete("/api/cart/user/:userId", async (req, res) => {
    try {
      await storage.clearCart(req.params.userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to clear cart" });
    }
  });

  // Orders
  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ error: "Invalid order data" });
    }
  });

  app.get("/api/orders/:userId", async (req, res) => {
    try {
      const orders = await storage.getUserOrders(req.params.userId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/detail/:orderId", async (req, res) => {
    try {
      const order = await storage.getOrderById(req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      logError(error, 'GET /api/orders/detail/:orderId', req);
      res.status(500).json({ error: "Failed to fetch order details", requestId: crypto.randomUUID().slice(0, 8) });
    }
  });

  // Admin routes
  app.get("/api/admin/orders", requireAdminAuth, async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch all orders" });
    }
  });

  app.patch("/api/admin/orders/:orderId/status", requireAdminAuth, async (req, res) => {
    try {
      const { status } = req.body;
      const order = await storage.updateOrderStatus(req.params.orderId, status);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // Admin products endpoints
  app.get("/api/admin/products", requireAdminAuth, async (req, res) => {
    try {
      const { search, category } = req.query;
      let products;
      
      if (search) {
        // For admin, search all products including out-of-stock
        products = await storage.searchAllProducts(search as string);
      } else if (category) {
        // Get all products in category, including out-of-stock
        const allProducts = await storage.getAllProducts();
        products = allProducts.filter(p => p.categoryId === category);
      } else {
        // Get all products including out-of-stock
        products = await storage.getAllProducts();
      }
      
      res.json(products);
    } catch (error) {
      logError(error, 'GET /api/admin/products', req);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/admin/products", requireAdminAuth, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      
      // Invalidate all product cache variants
      invalidateProductCache();
      
      res.status(201).json(product);
    } catch (error: any) {
      logError(error, 'POST /api/admin/products', req);
      if (error.name === 'ZodError') {
        res.status(400).json({ error: "Invalid product data", details: error.issues });
      } else {
        res.status(500).json({ error: "Failed to create product" });
      }
    }
  });

  app.put("/api/admin/products/:id", requireAdminAuth, async (req, res) => {
    try {
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, productData);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      // Invalidate all product cache variants
      invalidateProductCache();
      
      res.json(product);
    } catch (error: any) {
      logError(error, 'PUT /api/admin/products/:id', req);
      if (error.name === 'ZodError') {
        res.status(400).json({ error: "Invalid product data", details: error.issues });
      } else {
        res.status(500).json({ error: "Failed to update product" });
      }
    }
  });

  app.delete("/api/admin/products/:id", requireAdminAuth, async (req, res) => {
    try {
      const success = await storage.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      // Invalidate all product cache variants
      invalidateProductCache();
      
      res.status(204).send();
    } catch (error) {
      logError(error, 'DELETE /api/admin/products/:id', req);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  app.patch("/api/orders/:id/cancel", async (req, res) => {
    try {
      const order = await storage.updateOrderStatus(req.params.id, "cancelled");
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to cancel order" });
    }
  });

  app.post("/api/orders/:id/repeat", async (req, res) => {
    try {
      const order = await storage.getOrderById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // For now, just return success - order items functionality would need to be implemented
      res.json({ message: "Order repeated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to repeat order" });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const success = await storage.deleteOrder(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete order" });
    }
  });

  // Notifications
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.params.userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/:userId/count", async (req, res) => {
    try {
      const { userId } = req.params;
      const cacheKey = `notifications_count_${userId}`;
      
      // Cache notification count for 2 minutes
      if (isCacheValid(cacheKey, 120000)) {
        const cached = dataCache.get(cacheKey)!;
        
        if (req.get('If-None-Match') === cached.etag) {
          return res.status(304).end();
        }
        
        res.set('ETag', cached.etag);
        res.set('Cache-Control', 'private, max-age=120');
        return res.json(cached.data);
      }
      
      const count = await storage.getUnreadNotificationCount(userId);
      const result = { count };
      const etag = generateETag(result);
      
      dataCache.set(cacheKey, { etag, data: result, timestamp: Date.now() });
      
      if (req.get('If-None-Match') === etag) {
        return res.status(304).end();
      }
      
      res.set('ETag', etag);
      res.set('Cache-Control', 'private, max-age=120');
      res.json(result);
    } catch (error) {
      logError(error, 'GET /api/notifications/:userId/count', req);
      res.status(500).json({ error: "Failed to fetch notification count", requestId: crypto.randomUUID().slice(0, 8) });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(notificationData);
      res.status(201).json(notification);
    } catch (error) {
      res.status(400).json({ error: "Invalid notification data" });
    }
  });

  app.patch("/api/notifications/:notificationId/read", async (req, res) => {
    try {
      const notification = await storage.markNotificationAsRead(req.params.notificationId);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/:userId/read-all", async (req, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.params.userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // Banners (with long-term caching)
  app.get("/api/banners", async (req, res) => {
    try {
      const banners = await storage.getActiveBanners();
      
      // No caching - always get fresh data
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      res.json(banners);
    } catch (error) {
      logError(error, 'GET /api/banners', req);
      res.status(500).json({ error: "Failed to fetch banners", requestId: crypto.randomUUID().slice(0, 8) });
    }
  });

  app.get("/api/banners/all", async (req, res) => {
    try {
      const banners = await storage.getAllBanners();
      res.json(banners);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch all banners" });
    }
  });

  app.get("/api/admin/banners", requireAdminAuth, async (req, res) => {
    try {
      const banners = await storage.getAllBanners();
      res.json(banners);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch all banners" });
    }
  });

  app.post("/api/banners", async (req, res) => {
    try {
      const bannerData = insertBannerSchema.parse(req.body);
      const banner = await storage.createBanner(bannerData);
      
      // Invalidate banner cache when created
      dataCache.delete('banners_active');
      
      res.status(201).json(banner);
    } catch (error: any) {
      console.error("Banner create error:", error);
      res.status(400).json({ error: "Invalid banner data", details: error.message });
    }
  });

  app.post("/api/admin/banners", requireAdminAuth, async (req, res) => {
    try {
      const bannerData = insertBannerSchema.parse(req.body);
      const banner = await storage.createBanner(bannerData);
      res.status(201).json(banner);
    } catch (error) {
      res.status(400).json({ error: "Invalid banner data" });
    }
  });

  app.patch("/api/banners/:id", async (req, res) => {
    try {
      const bannerData = insertBannerSchema.partial().parse(req.body);
      const banner = await storage.updateBanner(req.params.id, bannerData);
      if (!banner) {
        return res.status(404).json({ error: "Banner not found" });
      }
      
      // Invalidate banner cache when updated
      dataCache.delete('banners_active');
      
      res.json(banner);
    } catch (error: any) {
      console.error("Banner update error:", error);
      res.status(400).json({ error: "Invalid banner data", details: error.message });
    }
  });

  app.put("/api/admin/banners/:id", requireAdminAuth, async (req, res) => {
    try {
      const bannerData = insertBannerSchema.partial().parse(req.body);
      const banner = await storage.updateBanner(req.params.id, bannerData);
      if (!banner) {
        return res.status(404).json({ error: "Banner not found" });
      }
      res.json(banner);
    } catch (error) {
      res.status(400).json({ error: "Invalid banner data" });
    }
  });

  app.delete("/api/banners/:id", async (req, res) => {
    try {
      const success = await storage.deleteBanner(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Banner not found" });
      }
      
      // Invalidate banner cache when deleted
      dataCache.delete('banners_active');
      
      res.status(204).send();
    } catch (error: any) {
      console.error("Banner delete error:", error);
      res.status(500).json({ error: "Failed to delete banner", details: error.message });
    }
  });

  app.delete("/api/admin/banners/:id", async (req, res) => {
    try {
      const success = await storage.deleteBanner(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Banner not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete banner" });
    }
  });

  // User Preferences
  // APK download endpoint with cache prevention
  app.get("/app-debug.apk", (req, res) => {
    const apkPath = path.join(process.cwd(), 'server', 'public', 'app-debug.apk');
    
    if (fs.existsSync(apkPath)) {
      const stats = fs.statSync(apkPath);
      
      // Если APK файл меньше 1KB, то это заглушка - отправляем информацию
      if (stats.size < 1024) {
        res.status(503).set({
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }).send(`
          <h1>🚧 APK собирается...</h1>
          <p>GitHub Actions сейчас собирает APK с вашими изменениями.</p>
          <p>Размер текущего файла: ${stats.size} байт (это заглушка)</p>
          <p>Обновите страницу через 5-10 минут</p>
          <script>
            setTimeout(() => {
              window.location.reload();
            }, 30000);
          </script>
        `);
        return;
      }
      
      // Отправляем настоящий APK без кеширования
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', 'attachment; filename=app-debug.apk');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('ETag', `"${stats.size}-${stats.mtime.getTime()}"`);
      res.sendFile(apkPath);
    } else {
      res.status(404).send('APK not found');
    }
  });

  app.get("/api/users/:userId/preferences", async (req, res) => {
    try {
      const preferences = await storage.getUserPreferences(req.params.userId);
      if (!preferences) {
        // Return default preferences if none exist
        const defaultPreferences = {
          theme: "light",
          primaryColor: "#6366f1",
          accentColor: "#10b981",
          backgroundColor: null,
          customCss: null
        };
        return res.json(defaultPreferences);
      }
      res.json(preferences);
    } catch (error) {
      logError(error, 'GET /api/users/:userId/preferences', req);
      res.status(500).json({ error: "Failed to fetch user preferences" });
    }
  });

  app.post("/api/users/:userId/preferences", async (req, res) => {
    try {
      const preferencesData = insertUserPreferencesSchema.parse({
        ...req.body,
        userId: req.params.userId
      });
      
      // Check if preferences already exist
      const existing = await storage.getUserPreferences(req.params.userId);
      if (existing) {
        // Update existing preferences
        const updated = await storage.updateUserPreferences(req.params.userId, preferencesData);
        return res.json(updated);
      }
      
      // Create new preferences
      const preferences = await storage.createUserPreferences(preferencesData);
      res.status(201).json(preferences);
    } catch (error) {
      logError(error, 'POST /api/users/:userId/preferences', req);
      res.status(400).json({ error: "Invalid preferences data" });
    }
  });

  app.put("/api/users/:userId/preferences", async (req, res) => {
    try {
      const preferencesData = insertUserPreferencesSchema.partial().parse(req.body);
      let preferences = await storage.updateUserPreferences(req.params.userId, preferencesData);
      
      // Если настройки не найдены, создаем их
      if (!preferences) {
        const newPreferencesData = {
          userId: req.params.userId,
          theme: "light",
          primaryColor: "#6366f1",
          accentColor: "#10b981",
          language: "ru",
          notifications: true,
          ...preferencesData
        };
        preferences = await storage.createUserPreferences(newPreferencesData);
      }
      
      // Clear cache for this user's preferences
      const cacheKey = `user_preferences_${req.params.userId}`;
      dataCache.delete(cacheKey);
      
      res.json(preferences);
    } catch (error) {
      logError(error, 'PUT /api/users/:userId/preferences', req);
      res.status(400).json({ error: "Invalid preferences data" });
    }
  });

  // Get Yandex Maps API key
  app.get("/api/config/yandex-maps", (req, res) => {
    try {
      const apiKey = process.env.YANDEX_MAPS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Yandex Maps API key not configured" });
      }
      res.json({ apiKey });
    } catch (error) {
      logError(error, 'GET /api/config/yandex-maps', req);
      res.status(500).json({ error: "Failed to get API key" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
