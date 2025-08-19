import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertCartItemSchema, insertOrderSchema, insertNotificationSchema, insertBannerSchema } from "@shared/schema";
import crypto from "crypto";

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

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Admin routes
  app.get("/api/admin/orders", async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch all orders" });
    }
  });

  app.patch("/api/admin/orders/:orderId/status", async (req, res) => {
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
      const cacheKey = 'banners_active';
      
      // Long cache for banners (10 minutes)
      if (isCacheValid(cacheKey, 600000)) {
        const cached = dataCache.get(cacheKey)!;
        
        if (req.get('If-None-Match') === cached.etag) {
          return res.status(304).end();
        }
        
        res.set('ETag', cached.etag);
        res.set('Cache-Control', 'public, max-age=600');
        return res.json(cached.data);
      }
      
      const banners = await storage.getActiveBanners();
      const etag = generateETag(banners);
      
      dataCache.set(cacheKey, { etag, data: banners, timestamp: Date.now() });
      
      if (req.get('If-None-Match') === etag) {
        return res.status(304).end();
      }
      
      res.set('ETag', etag);
      res.set('Cache-Control', 'public, max-age=600');
      res.json(banners);
    } catch (error) {
      logError(error, 'GET /api/banners', req);
      res.status(500).json({ error: "Failed to fetch banners", requestId: crypto.randomUUID().slice(0, 8) });
    }
  });

  app.get("/api/admin/banners", async (req, res) => {
    try {
      const banners = await storage.getAllBanners();
      res.json(banners);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch all banners" });
    }
  });

  app.post("/api/admin/banners", async (req, res) => {
    try {
      const bannerData = insertBannerSchema.parse(req.body);
      const banner = await storage.createBanner(bannerData);
      res.status(201).json(banner);
    } catch (error) {
      res.status(400).json({ error: "Invalid banner data" });
    }
  });

  app.put("/api/admin/banners/:id", async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
