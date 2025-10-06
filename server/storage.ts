import { type User, type InsertUser, type Category, type InsertCategory, type Product, type InsertProduct, type CartItem, type InsertCartItem, type Order, type InsertOrder, type Notification, type InsertNotification, type Banner, type InsertBanner, type UserPreferences, type InsertUserPreferences, type Error, type InsertError, type OrderFilterOptions, type PaginatedOrdersResponse, type OrderWithDetails, type OrderStats, type UserFilterOptions, type PaginatedUsersResponse, type UserStats, type ProductStats, type CategoryStats, type PromoCodeStats, type AnalyticsOverview } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getAllUsersWithFiltering(filters: UserFilterOptions): Promise<PaginatedUsersResponse>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  updateUserStatus(id: string, status: string): Promise<User | undefined>;
  getUserStats(): Promise<UserStats>;

  // User Preferences
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: string, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined>;

  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Products
  getProducts(): Promise<Product[]>;
  getAllProducts(): Promise<Product[]>; // Admin only - includes out-of-stock
  getProductsByCategory(categoryId: string): Promise<Product[]>;
  getPopularProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  searchProducts(query: string): Promise<Product[]>;
  searchAllProducts(query: string): Promise<Product[]>; // Admin only - includes out-of-stock

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
  getAllOrdersWithFiltering(filters: OrderFilterOptions): Promise<PaginatedOrdersResponse>;
  getOrderById(orderId: string): Promise<Order | undefined>;
  getOrderDetails(orderId: string): Promise<OrderWithDetails | undefined>;
  getOrderItems(orderId: string): Promise<Array<{ id: string; orderId: string; productId: string; productName: string; productPrice: string; quantity: number; totalPrice: string }>>;
  updateOrderStatus(orderId: string, status: string): Promise<Order | undefined>;
  updateOrdersStatus(orderIds: string[], status: string): Promise<Order[]>;
  deleteOrder(orderId: string): Promise<boolean>;
  getOrderStats(dateFrom?: string, dateTo?: string): Promise<OrderStats>;

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

  // Analytics
  getProductStats(dateFrom?: string, dateTo?: string): Promise<ProductStats>;
  getCategoryStats(dateFrom?: string, dateTo?: string): Promise<CategoryStats>;
  getPromoCodeStats(dateFrom?: string, dateTo?: string): Promise<PromoCodeStats>;
  getAnalyticsOverview(dateFrom?: string, dateTo?: string): Promise<AnalyticsOverview>;

  // Errors
  createError(error: InsertError): Promise<Error>;
  getErrors(filters?: { type?: string; level?: string; resolved?: boolean; limit?: number; offset?: number }): Promise<Error[]>;
  getErrorById(id: string): Promise<Error | undefined>;
  updateError(id: string, updates: Partial<InsertError>): Promise<Error | undefined>;
  deleteError(id: string): Promise<boolean>;
  deleteOldErrors(daysOld: number): Promise<number>;
  markErrorResolved(id: string, resolvedBy: string): Promise<Error | undefined>;
  getErrorStats(): Promise<{ total: number; unresolved: number; byType: Record<string, number>; byLevel: Record<string, number> }>;
}

interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productPrice: string;
  quantity: number;
  totalPrice: string;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private categories: Map<string, Category> = new Map();
  private products: Map<string, Product> = new Map();
  private cartItems: Map<string, CartItem> = new Map();
  private orders: Map<string, Order> = new Map();
  private orderItems: Map<string, OrderItem[]> = new Map();
  private notifications: Map<string, Notification> = new Map();
  private banners: Map<string, Banner> = new Map();
  private userPreferences: Map<string, UserPreferences> = new Map();
  private errors: Map<string, Error> = new Map();

  constructor() {
    this.seedData();
  }

  // Автоматическое обновление статуса заказов для демонстрации отслеживания
  private scheduleOrderStatusUpdates(orderId: string) {
    const order = this.orders.get(orderId);
    if (!order) return;

    // pending -> preparing (через 2 минуты)
    setTimeout(() => {
      const currentOrder = this.orders.get(orderId);
      if (currentOrder && currentOrder.status === "pending") {
        this.updateOrderStatus(orderId, "preparing");
      }
    }, 2 * 60 * 1000); // 2 минуты

    // preparing -> delivering (через 5 минут от создания)
    setTimeout(() => {
      const currentOrder = this.orders.get(orderId);
      if (currentOrder && currentOrder.status === "preparing") {
        this.updateOrderStatus(orderId, "delivering");
      }
    }, 5 * 60 * 1000); // 5 минут

    // delivering -> delivered (через 10 минут от создания)
    setTimeout(() => {
      const currentOrder = this.orders.get(orderId);
      if (currentOrder && currentOrder.status === "delivering") {
        this.updateOrderStatus(orderId, "delivered");
      }
    }, 10 * 60 * 1000); // 10 минут
  }

  private seedData() {
    // Seed categories
    const categories = [
      { name: "Овощи и фрукты", slug: "vegetables", imageUrl: "https://images.unsplash.com/photo-1506976773555-b3da30a63b57?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 1 },
      { name: "Молочные продукты", slug: "dairy", imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 2 },
      { name: "Мясо и рыба", slug: "meat", imageUrl: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 3 },
      { name: "Снеки и напитки", slug: "snacks", imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 4 },
      { name: "Готовые блюда", slug: "ready-meals", imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 5 },
      { name: "Хлеб и выпечка", slug: "bakery", imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 6 },
      { name: "Крупы и макароны", slug: "cereals", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 7 },
      { name: "Консервы", slug: "canned", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 8 },
      { name: "Сладости", slug: "sweets", imageUrl: "https://images.unsplash.com/photo-1551024506-0bccd828d307?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 9 },
      { name: "Замороженные продукты", slug: "frozen", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 10 },
      { name: "Специи и приправы", slug: "spices", imageUrl: "https://images.unsplash.com/photo-1596040033229-a0b3b1982d00?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 11 },
      { name: "Масла и соусы", slug: "oils", imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 12 },
      { name: "Чай и кофе", slug: "tea-coffee", imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 13 },
      { name: "Детское питание", slug: "baby", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 14 },
      { name: "Товары для дома", slug: "household", imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=60", sortOrder: 15 },
    ];

    // Use fixed IDs for categories to maintain consistency
    const categoryIds = {
      "vegetables": "cat-vegetables-001",
      "dairy": "cat-dairy-002",
      "meat": "cat-meat-003",
      "snacks": "cat-snacks-004",
      "ready-meals": "cat-ready-005",
      "bakery": "cat-bakery-006",
      "cereals": "cat-cereals-007",
      "canned": "cat-canned-008",
      "sweets": "cat-sweets-009",
      "frozen": "cat-frozen-010",
      "spices": "cat-spices-011",
      "oils": "cat-oils-012",
      "tea-coffee": "cat-tea-013",
      "baby": "cat-baby-014",
      "household": "cat-household-015"
    };

    categories.forEach(cat => {
      const id = categoryIds[cat.slug as keyof typeof categoryIds];
      this.categories.set(id, { ...cat, id });
    });

    // Seed products
    const products = [
      // Популярные российские товары
      { 
        name: "Хлеб Бородинский", 
        description: "Ржаной хлеб", 
        price: "89.00", 
        weight: "500г", 
        imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", 
        categoryId: Array.from(this.categories.values()).find(c => c.slug === "bakery")?.id, 
        isPopular: true,
        ingredients: "Мука ржаная обдирная, мука пшеничная в/с, вода, соль, дрожжи хлебопекарные, солод ржаной, кориандр",
        manufacturer: "Хлебозавод №1",
        countryOfOrigin: "Россия",
        storageConditions: "При температуре от +6°C до +20°C и относительной влажности воздуха не более 75%",
        shelfLife: "72 часа",
        calories: 208,
        proteins: "6.8",
        fats: "1.3",
        carbs: "40.1",
        fiber: "5.8",
        sugar: "3.2"
      },
      { 
        name: "Молоко Простоквашино 3.2%", 
        description: "Натуральное молоко", 
        price: "75.00", 
        weight: "930мл", 
        imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", 
        categoryId: Array.from(this.categories.values()).find(c => c.slug === "dairy")?.id, 
        isPopular: true,
        ingredients: "Молоко цельное пастеризованное",
        manufacturer: "ООО \"Простоквашино\"",
        countryOfOrigin: "Россия",
        storageConditions: "При температуре от +2°C до +6°C",
        shelfLife: "5 суток",
        calories: 60,
        proteins: "2.9",
        fats: "3.2",
        carbs: "4.7",
        fiber: "0.0",
        sugar: "4.7"
      },
      { 
        name: "Гречка Мистраль", 
        description: "Гречневая крупа ядрица", 
        price: "120.00", 
        weight: "800г", 
        imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", 
        categoryId: "cat-cereals-007",
        isPopular: true,
        ingredients: "Гречневая крупа ядрица высшего сорта",
        manufacturer: "ООО \"Мистраль\"",
        countryOfOrigin: "Россия",
        storageConditions: "В сухом месте при температуре не выше +20°C",
        shelfLife: "20 месяцев",
        calories: 313,
        proteins: "12.6",
        fats: "3.3",
        carbs: "62.1",
        fiber: "11.3",
        sugar: "0.0"
      },
      { 
        name: "Макароны Barilla", 
        description: "Спагетти №5", 
        price: "185.00", 
        weight: "500г", 
        imageUrl: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", 
        categoryId: "cat-cereals-007",
        isPopular: true,
        ingredients: "Мука из твердых сортов пшеницы, вода",
        manufacturer: "Barilla",
        countryOfOrigin: "Италия",
        storageConditions: "В сухом месте при комнатной температуре",
        shelfLife: "3 года",
        calories: 360,
        proteins: "12.0",
        fats: "1.8",
        carbs: "71.0",
        fiber: "3.0",
        sugar: "3.5"
      },
      { 
        name: "Рис Краснодарский", 
        description: "Круглозерный рис", 
        price: "95.00", 
        weight: "900г", 
        imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", 
        categoryId: "cat-cereals-007",
        ingredients: "Рис шлифованный круглозерный",
        manufacturer: "Агрохолдинг \"Кубань\"",
        countryOfOrigin: "Россия",
        storageConditions: "В сухом прохладном месте",
        shelfLife: "16 месяцев",
        calories: 344,
        proteins: "7.0",
        fats: "1.0",
        carbs: "74.0",
        fiber: "0.4",
        sugar: "0.0"
      },
      { 
        name: "Колбаса \"Докторская\" Останкино", 
        description: "Вареная колбаса", 
        price: "320.00", 
        weight: "300г", 
        imageUrl: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", 
        categoryId: "cat-meat-003",
        isPopular: true,
        ingredients: "Свинина, говядина, молоко, яйца, соль, специи",
        manufacturer: "Останкино",
        countryOfOrigin: "Россия",
        storageConditions: "При температуре от 0°C до +6°C",
        shelfLife: "15 суток",
        calories: 257,
        proteins: "13.7",
        fats: "22.8",
        carbs: "1.5",
        fiber: "0.0",
        sugar: "0.0"
      },
      { 
        name: "Сметана Домик в деревне 20%", 
        description: "Густая сметана", 
        price: "135.00", 
        weight: "300г", 
        imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", 
        categoryId: Array.from(this.categories.values()).find(c => c.slug === "dairy")?.id,
        ingredients: "Сливки пастеризованные, закваска молочнокислая",
        manufacturer: "Домик в деревне",
        countryOfOrigin: "Россия",
        storageConditions: "При температуре от +2°C до +6°C",
        shelfLife: "14 суток",
        calories: 206,
        proteins: "2.8",
        fats: "20.0",
        carbs: "3.2",
        fiber: "0.0",
        sugar: "3.2"
      },
      { 
        name: "Конфеты Аленка", 
        description: "Молочный шоколад", 
        price: "250.00", 
        weight: "200г", 
        imageUrl: "https://images.unsplash.com/photo-1551024506-0bccd828d307?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", 
        categoryId: Array.from(this.categories.values()).find(c => c.slug === "sweets")?.id,
        isPopular: true,
        ingredients: "Сахар, какао-масло, молоко сухое, какао тертое, лецитин, ванилин",
        manufacturer: "Красный Октябрь",
        countryOfOrigin: "Россия",
        storageConditions: "При температуре +15°C до +21°C",
        shelfLife: "12 месяцев",
        calories: 534,
        proteins: "7.2",
        fats: "35.6",
        carbs: "50.4",
        fiber: "0.0",
        sugar: "50.4"
      },
      { 
        name: "Чай Ахмад Earl Grey", 
        description: "Черный чай с бергамотом", 
        price: "210.00", 
        weight: "100г", 
        imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", 
        categoryId: Array.from(this.categories.values()).find(c => c.slug === "tea-coffee")?.id,
        ingredients: "Чай черный, ароматизатор натуральный бергамот",
        manufacturer: "Ahmad Tea",
        countryOfOrigin: "Россия",
        storageConditions: "В сухом месте, в герметичной упаковке",
        shelfLife: "3 года",
        calories: 1,
        proteins: "0.0",
        fats: "0.0",
        carbs: "0.3",
        fiber: "0.0",
        sugar: "0.0"
      },
      { 
        name: "Кофе Жокей Классический", 
        description: "Молотый кофе", 
        price: "280.00", 
        weight: "250г", 
        imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", 
        categoryId: Array.from(this.categories.values()).find(c => c.slug === "tea-coffee")?.id,
        isPopular: true,
        ingredients: "Кофе натуральный жареный молотый",
        manufacturer: "Жокей",
        countryOfOrigin: "Россия",
        storageConditions: "В сухом прохладном месте",
        shelfLife: "18 месяцев",
        calories: 331,
        proteins: "13.9",
        fats: "14.4",
        carbs: "29.5",
        fiber: "0.0",
        sugar: "0.0"
      },
      { 
        name: "Масло подсолнечное Злато", 
        description: "Рафинированное масло", 
        price: "165.00", 
        weight: "1л", 
        imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", 
        categoryId: Array.from(this.categories.values()).find(c => c.slug === "oils")?.id,
        ingredients: "Масло подсолнечное рафинированное дезодорированное",
        manufacturer: "Злато",
        countryOfOrigin: "Россия",
        storageConditions: "В темном месте при температуре +5°C до +20°C",
        shelfLife: "18 месяцев",
        calories: 899,
        proteins: "0.0",
        fats: "99.9",
        carbs: "0.0",
        fiber: "0.0",
        sugar: "0.0"
      },
      // Таджикские продукты
      { 
        name: "Плов Душанбинский", 
        description: "Готовый плов по-таджикски", 
        price: "350.00", 
        weight: "400г", 
        imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", 
        categoryId: Array.from(this.categories.values()).find(c => c.slug === "ready-meals")?.id,
        isPopular: true,
        ingredients: "Рис, баранина, морковь, лук, масло, специи",
        manufacturer: "Вкус Востока",
        countryOfOrigin: "Таджикистан",
        storageConditions: "При температуре от +2°C до +6°C",
        shelfLife: "72 часа",
        calories: 165,
        proteins: "8.0",
        fats: "6.0",
        carbs: "20.0",
        fiber: "1.0",
        sugar: "2.0"
      },
      { 
        name: "Нан таджикский", 
        description: "Традиционная лепешка", 
        price: "45.00", 
        weight: "300г", 
        imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", 
        categoryId: Array.from(this.categories.values()).find(c => c.slug === "bakery")?.id,
        isPopular: true,
        ingredients: "Мука пшеничная, вода, соль, дрожжи, семена кунжута",
        manufacturer: "Хлебный дом Душанбе",
        countryOfOrigin: "Таджикистан",
        storageConditions: "При комнатной температуре",
        shelfLife: "24 часа",
        calories: 264,
        proteins: "8.1",
        fats: "1.0",
        carbs: "55.0",
        fiber: "2.7",
        sugar: "1.0"
      },
      { 
        name: "Курага Согдийская", 
        description: "Сушеные абрикосы", 
        price: "480.00", 
        weight: "500г", 
        imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", 
        categoryId: Array.from(this.categories.values()).find(c => c.slug === "sweets")?.id,
        isPopular: true,
        ingredients: "Абрикосы сушеные без косточек",
        manufacturer: "Согдийские сады",
        countryOfOrigin: "Таджикистан",
        storageConditions: "В сухом прохладном месте",
        shelfLife: "12 месяцев",
        calories: 215,
        proteins: "5.2",
        fats: "0.4",
        carbs: "51.0",
        fiber: "7.3",
        sugar: "48.0"
      },
      { 
        name: "Чай зеленый Истаравшан", 
        description: "Высокогорный зеленый чай", 
        price: "320.00", 
        weight: "100г", 
        imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", 
        categoryId: Array.from(this.categories.values()).find(c => c.slug === "tea-coffee")?.id,
        isPopular: true,
        ingredients: "Чай зеленый листовой высшего сорта",
        manufacturer: "Истаравшанский чай",
        countryOfOrigin: "Таджикистан",
        storageConditions: "В сухом месте, в герметичной упаковке",
        shelfLife: "3 года",
        calories: 1,
        proteins: "0.0",
        fats: "0.0",
        carbs: "0.3",
        fiber: "0.0",
        sugar: "0.0"
      },
      { 
        name: "Специи для плова", 
        description: "Традиционная смесь специй", 
        price: "85.00", 
        weight: "50г", 
        imageUrl: "https://images.unsplash.com/photo-1596040033229-a0b3b1982d00?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", 
        categoryId: Array.from(this.categories.values()).find(c => c.slug === "spices")?.id,
        ingredients: "Зира, барбарис, куркума, кориандр, красный перец",
        manufacturer: "Восточные специи",
        countryOfOrigin: "Таджикистан",
        storageConditions: "В сухом месте при комнатной температуре",
        shelfLife: "24 месяца",
        calories: 375,
        proteins: "17.8",
        fats: "22.3",
        carbs: "44.2",
        fiber: "10.5",
        sugar: "2.3"
      },
      { 
        name: "Яблоки Гала", 
        description: "Сладкие красные яблоки", 
        price: "159.00", 
        weight: "1кг", 
        imageUrl: "https://images.unsplash.com/photo-1567306757458-49563074659c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", 
        categoryId: Array.from(this.categories.values()).find(c => c.slug === "vegetables")?.id, 
        isPopular: true,
        ingredients: "Яблоки свежие",
        manufacturer: "Садоводческое хозяйство \"Солнечный сад\"",
        countryOfOrigin: "Россия",
        storageConditions: "При температуре от 0°C до +4°C и относительной влажности 85-90%",
        shelfLife: "6 месяцев",
        calories: 52,
        proteins: "0.3",
        fats: "0.2",
        carbs: "13.8",
        fiber: "2.4",
        sugar: "10.4"
      },
      { 
        name: "Яйца куриные С1", 
        description: "Свежие куриные яйца", 
        price: "98.00", 
        weight: "10шт", 
        imageUrl: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", 
        categoryId: Array.from(this.categories.values()).find(c => c.slug === "dairy")?.id, 
        isPopular: true,
        ingredients: "Яйца куриные столовые первой категории",
        manufacturer: "Птицефабрика \"Русское яйцо\"",
        countryOfOrigin: "Россия",
        storageConditions: "При температуре от 0°C до +20°C и относительной влажности 85-88%",
        shelfLife: "25 суток",
        calories: 157,
        proteins: "12.7",
        fats: "11.5",
        carbs: "0.7",
        fiber: "0.0",
        sugar: "0.7"
      },
      { 
        name: "Бананы", 
        description: "Спелые бананы", 
        price: "129.00", 
        weight: "1кг", 
        imageUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", 
        categoryId: Array.from(this.categories.values()).find(c => c.slug === "vegetables")?.id,
        ingredients: "Бананы свежие",
        manufacturer: "Тропические фрукты",
        countryOfOrigin: "Эквадор",
        storageConditions: "При температуре от +13°C до +15°C и относительной влажности 85-90%",
        shelfLife: "7 суток",
        calories: 96,
        proteins: "1.5",
        fats: "0.2",
        carbs: "21.0",
        fiber: "2.6",
        sugar: "17.2"
      },
      { 
        name: "Морковь", 
        description: "Свежая морковь", 
        price: "89.00", 
        weight: "1кг", 
        imageUrl: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", 
        categoryId: Array.from(this.categories.values()).find(c => c.slug === "vegetables")?.id,
        ingredients: "Морковь столовая свежая",
        manufacturer: "Агрофирма \"Золотая осень\"",
        countryOfOrigin: "Россия",
        storageConditions: "При температуре от 0°C до +1°C и относительной влажности 95-98%",
        shelfLife: "6 месяцев",
        calories: 35,
        proteins: "1.3",
        fats: "0.1",
        carbs: "6.9",
        fiber: "2.8",
        sugar: "4.7"
      },
      { 
        name: "Творог 9%", 
        description: "Домашний творог", 
        price: "145.00", 
        weight: "400г", 
        imageUrl: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", 
        categoryId: Array.from(this.categories.values()).find(c => c.slug === "dairy")?.id,
        ingredients: "Молоко цельное, закваска молочнокислая",
        manufacturer: "Молочный комбинат \"Простоквашино\"",
        countryOfOrigin: "Россия",
        storageConditions: "При температуре от +2°C до +6°C",
        shelfLife: "7 суток",
        calories: 169,
        proteins: "16.7",
        fats: "9.0",
        carbs: "2.0",
        fiber: "0.0",
        sugar: "2.0"
      },
      { 
        name: "Куриное филе", 
        description: "Охлажденное филе", 
        price: "299.00", 
        weight: "1кг", 
        imageUrl: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", 
        categoryId: "cat-meat-003",
        ingredients: "Филе куриное (грудка) без кости и кожи",
        manufacturer: "Птицефабрика \"Белая птица\"",
        countryOfOrigin: "Россия",
        storageConditions: "При температуре от -2°C до +2°C",
        shelfLife: "5 суток",
        calories: 113,
        proteins: "23.6",
        fats: "1.9",
        carbs: "0.4",
        fiber: "0.0",
        sugar: "0.0"
      },
    ];

    // Add fixed IDs for products to maintain consistency across server restarts
    const productFixedIds = [
      "prod-bread-001", "prod-milk-002", "prod-buckwheat-003", "prod-chicken-004"
    ];

    products.forEach((prod, index) => {
      const id = productFixedIds[index] || `prod-${index+1}-${Date.now()}`;
      this.products.set(id, { 
        ...prod, 
        id, 
        inStock: true, 
        categoryId: prod.categoryId || null,
        isPopular: prod.isPopular || null,
        imageUrl: prod.imageUrl || null,
        description: prod.description || null,
        weight: prod.weight || null,
        ingredients: prod.ingredients ?? null,
        manufacturer: prod.manufacturer ?? null,
        countryOfOrigin: prod.countryOfOrigin ?? null,
        storageConditions: prod.storageConditions ?? null,
        shelfLife: prod.shelfLife ?? null,
        calories: prod.calories ?? null,
        proteins: prod.proteins ?? null,
        fats: prod.fats ?? null,
        carbs: prod.carbs ?? null,
        fiber: prod.fiber ?? null,
        sugar: prod.sugar ?? null
      });
    });

    // Seed demo users
    const demoUsers = [
      {
        id: "demo-user",
        username: "demo",
        email: "demo@ducharha.com",
        phone: "+992123456789",
        address: "г. Душанбе, ул. Рудаки 1",
        role: "user",
        status: "active",
        createdAt: new Date().toISOString()
      },
      {
        id: "admin-user",
        username: "admin",
        email: "admin@ducharha.com",
        phone: "+992987654321",
        address: "г. Душанбе, офис",
        role: "admin",
        status: "active",
        createdAt: new Date().toISOString()
      },
      {
        id: "test-user-1",
        username: "testuser1",
        email: "test1@ducharha.com",
        phone: "+992555123456",
        address: "г. Худжанд, ул. Ленина 15",
        role: "user",
        status: "active",
        createdAt: new Date().toISOString()
      },
      {
        id: "test-user-2",
        username: "testuser2",
        email: "test2@ducharha.com",
        phone: "+992555654321",
        address: "г. Курган-Тюбе, ул. Айни 8",
        role: "user",
        status: "blocked",
        createdAt: new Date().toISOString()
      }
    ];

    demoUsers.forEach(user => {
      this.users.set(user.id, user as User);
    });

    // Seed some sample notifications for demo-user
    const sampleNotifications = [
      {
        userId: "demo-user",
        title: "Добро пожаловать в ДУЧАРХА! 🎉",
        message: "Ваша регистрация завершена. Теперь вы можете заказывать продукты с быстрой доставкой!",
        type: "success",
        isRead: false
      },
      {
        userId: "demo-user", 
        title: "Скидка 15% на первый заказ",
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

    sampleNotifications.forEach((notif, index) => {
      const id = randomUUID();
      // Make notifications very recent (1-3 minutes ago)
      const minutesAgo = 1 + (index * 1);
      this.notifications.set(id, { 
        ...notif, 
        id, 
        createdAt: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString(),
        relatedOrderId: null
      });
    });

    // Create sample banners
    const sampleBanners = [
      {
        title: "Добро пожаловать в ДУЧАРХА!",
        subtitle: "Новые возможности",
        message: "Откройте для себя мир быстрой доставки продуктов прямо к вашему дому.",
        type: "info",
        backgroundColor: "#5B21B6",
        textColor: "#ffffff",
        buttonText: "Начать покупки",
        buttonLink: "/catalog",
        isActive: true,
        priority: 0
      },
      {
        title: "Добро пожаловать в ДУЧАРХА!",
        subtitle: "Новые возможности",
        message: "Откройте для себя мир быстрой доставки продуктов прямо к вашему дому.",
        type: "promo",
        backgroundColor: "#6366f1",
        textColor: "#ffffff",
        buttonText: "Начать покупки",
        buttonLink: "/catalog",
        isActive: true,
        priority: 1
      },
      {
        title: "Скидка 20% на первый заказ",
        subtitle: "Специальное предложение",
        message: "Используйте промокод ПЕРВЫЙ при оформлении заказа",
        type: "promo",
        backgroundColor: "#dc2626",
        textColor: "#ffffff",
        buttonText: "Получить скидку",
        buttonLink: "/catalog",
        isActive: true,
        priority: 2
      },
      {
        title: "Бесплатная доставка от 1000 сом",
        subtitle: "Выгодные условия",
        message: "Доставляем бесплатно при заказе от 1000 сом",
        type: "info",
        backgroundColor: "#059669",
        textColor: "#ffffff",
        buttonText: "Заказать сейчас",
        buttonLink: "/catalog",
        isActive: true,
        priority: 3
      }
    ];

    sampleBanners.forEach((banner, index) => {
      const id = `banner-${index + 1}-${Date.now()}`;
      this.banners.set(id, { 
        ...banner, 
        id,
        createdAt: new Date().toISOString(),
        startDate: null,
        endDate: null
      });
    });

    // Seed sample orders for demo
    const sampleOrders = [
      {
        id: randomUUID(),
        userId: "demo-user",
        totalAmount: "1250.00",
        status: "delivered",
        deliveryAddress: "ул. Рудаки, 25, кв. 10",
        comment: "Домофон 15К",
        packerComment: "Бананы спелые, молоко свежее",
        promoCode: null,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: randomUUID(),
        userId: "demo-user", 
        totalAmount: "890.00",
        status: "preparing",
        deliveryAddress: "ул. Сомони, 12, офис 205",
        comment: "Звонить в офис",
        packerComment: null,
        promoCode: "ПЕРВЫЙ",
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      }
    ];

    sampleOrders.forEach(order => {
      this.orders.set(order.id, order);
    });

    // Create demo user
    const demoUser: User = {
      id: "demo-user",
      username: "demo",
      email: "demo@example.com",
      phone: "+992 12 345 6789",
      address: "ул. Рудаки, 25, кв. 10, Душанбе",
      role: "user",
      status: "active",
      createdAt: new Date().toISOString()
    };
    this.users.set(demoUser.id, demoUser);

    // Create user preferences for demo user
    const demoPreferences: UserPreferences = {
      id: randomUUID(),
      userId: "demo-user",
      theme: "light",
      primaryColor: "#6366f1",
      accentColor: "#10b981",
      backgroundColor: null,
      customCss: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.userPreferences.set(demoPreferences.id, demoPreferences);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date().toISOString(),
      phone: insertUser.phone || null,
      address: insertUser.address || null,
      role: "user",
      status: "active"
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updateData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values()).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = { 
      ...insertCategory, 
      id,
      imageUrl: insertCategory.imageUrl || null,
      sortOrder: insertCategory.sortOrder || null
    };
    this.categories.set(id, category);
    return category;
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.inStock);
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.categoryId === categoryId && p.inStock);
  }

  async getPopularProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.isPopular && p.inStock);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = { 
      ...insertProduct, 
      id, 
      inStock: true, 
      isPopular: false,
      categoryId: insertProduct.categoryId || null,
      imageUrl: insertProduct.imageUrl || null,
      description: insertProduct.description || null,
      weight: insertProduct.weight || null,
      ingredients: insertProduct.ingredients || null,
      manufacturer: insertProduct.manufacturer || null,
      countryOfOrigin: insertProduct.countryOfOrigin || null,
      storageConditions: insertProduct.storageConditions || null,
      shelfLife: insertProduct.shelfLife || null,
      calories: insertProduct.calories || null,
      proteins: insertProduct.proteins || null,
      fats: insertProduct.fats || null,
      carbs: insertProduct.carbs || null,
      fiber: insertProduct.fiber || null,
      sugar: insertProduct.sugar || null
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    const updatedProduct: Product = {
      ...product,
      ...updateData,
      id, // Keep the original ID
      // Handle optional fields properly
      categoryId: updateData.categoryId !== undefined ? updateData.categoryId : product.categoryId,
      imageUrl: updateData.imageUrl !== undefined ? updateData.imageUrl : product.imageUrl,
      description: updateData.description !== undefined ? updateData.description : product.description,
      weight: updateData.weight !== undefined ? updateData.weight : product.weight,
      ingredients: updateData.ingredients !== undefined ? updateData.ingredients : product.ingredients,
      manufacturer: updateData.manufacturer !== undefined ? updateData.manufacturer : product.manufacturer,
      countryOfOrigin: updateData.countryOfOrigin !== undefined ? updateData.countryOfOrigin : product.countryOfOrigin,
      storageConditions: updateData.storageConditions !== undefined ? updateData.storageConditions : product.storageConditions,
      shelfLife: updateData.shelfLife !== undefined ? updateData.shelfLife : product.shelfLife,
      calories: updateData.calories !== undefined ? updateData.calories : product.calories,
      proteins: updateData.proteins !== undefined ? updateData.proteins : product.proteins,
      fats: updateData.fats !== undefined ? updateData.fats : product.fats,
      carbs: updateData.carbs !== undefined ? updateData.carbs : product.carbs,
      fiber: updateData.fiber !== undefined ? updateData.fiber : product.fiber,
      sugar: updateData.sugar !== undefined ? updateData.sugar : product.sugar
    };

    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const productExists = this.products.has(id);
    if (productExists) {
      // Remove from all cart items first
      const cartItemsToRemove = Array.from(this.cartItems.entries())
        .filter(([_, item]) => item.productId === id);
      cartItemsToRemove.forEach(([cartItemId]) => this.cartItems.delete(cartItemId));
      
      // Delete the product
      this.products.delete(id);
    }
    return productExists;
  }

  async searchProducts(query: string): Promise<Product[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.products.values()).filter(p => 
      p.inStock && (
        p.name.toLowerCase().includes(lowercaseQuery) ||
        p.description?.toLowerCase().includes(lowercaseQuery)
      )
    );
  }

  async searchAllProducts(query: string): Promise<Product[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.products.values()).filter(p => 
      p.name.toLowerCase().includes(lowercaseQuery) ||
      p.description?.toLowerCase().includes(lowercaseQuery)
    );
  }

  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    const userCartItems = Array.from(this.cartItems.values()).filter(item => item.userId === userId);
    return userCartItems
      .map(item => {
        if (!item.productId) return null;
        const product = this.products.get(item.productId);
        if (!product) return null;
        return { ...item, product };
      })
      .filter((item): item is (CartItem & { product: Product }) => item !== null);
  }

  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const existingItem = Array.from(this.cartItems.values()).find(
      item => item.userId === insertCartItem.userId && item.productId === insertCartItem.productId
    );

    if (existingItem) {
      // Update quantity
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
    return cartItem;
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    const item = this.cartItems.get(id);
    if (!item) return undefined;

    if (quantity <= 0) {
      this.cartItems.delete(id);
      return undefined;
    }

    item.quantity = quantity;
    this.cartItems.set(id, item);
    return item;
  }

  async removeFromCart(id: string): Promise<boolean> {
    return this.cartItems.delete(id);
  }

  async clearCart(userId: string): Promise<boolean> {
    const userItems = Array.from(this.cartItems.entries()).filter(([_, item]) => item.userId === userId);
    userItems.forEach(([id]) => this.cartItems.delete(id));
    return true;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();

    // БЕЗОПАСНОСТЬ: Пересчитываем totalAmount на сервере на основе корзины
    if (!insertOrder.userId) {
      throw new Error("User ID is required for creating an order");
    }

    const userId = insertOrder.userId as string; // Приводим к string, так как проверили выше что не null
    const userCartItems = Array.from(this.cartItems.values()).filter(item => item.userId === userId);
    let calculatedTotal = 0;

    for (const cartItem of userCartItems) {
      if (!cartItem.productId) continue; // Пропускаем если productId null
      const product = this.products.get(cartItem.productId);
      if (product) {
        const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
        calculatedTotal += price * cartItem.quantity;
      }
    }

    // Применяем промокод если есть
    if (insertOrder.promoCode) {
      const promoCodes = [
        { code: "ПЕРВЫЙ", discount: 20, isActive: true },
        { code: "ДРУЗЬЯМ", discount: 15, isActive: true },
        { code: "ЛЕТОМ", discount: 10, isActive: true },
      ];

      const promoCode = promoCodes.find(promo => 
        promo.code.toUpperCase() === insertOrder.promoCode?.toUpperCase() && promo.isActive
      );

      if (promoCode) {
        calculatedTotal = calculatedTotal * (1 - promoCode.discount / 100);
      }
    }

    const order: Order = { 
      ...insertOrder, 
      id, 
      createdAt: new Date().toISOString(),
      userId: insertOrder.userId || null,
      status: insertOrder.status || "pending",
      comment: insertOrder.comment || null,
      packerComment: insertOrder.packerComment || null,
      totalAmount: calculatedTotal.toFixed(2), // Используем пересчитанную сумму
      promoCode: insertOrder.promoCode || null // Обрабатываем undefined
    };
    this.orders.set(id, order);
    
    // Store order items with product details
    const orderItemsArray: OrderItem[] = [];
    for (const cartItem of userCartItems) {
      if (!cartItem.productId) continue;
      const product = this.products.get(cartItem.productId);
      if (product) {
        const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
        const totalPrice = price * cartItem.quantity;
        orderItemsArray.push({
          id: randomUUID(),
          orderId: id,
          productId: product.id,
          productName: product.name,
          productPrice: price.toFixed(2),
          quantity: cartItem.quantity,
          totalPrice: totalPrice.toFixed(2)
        });
      }
    }
    this.orderItems.set(id, orderItemsArray);
    
    // Clear user's cart after creating order
    await this.clearCart(userId);
    
    // Запускаем автоматическое обновление статуса заказа
    this.scheduleOrderStatusUpdates(id);
    
    return order;
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getAllOrdersWithFiltering(filters: OrderFilterOptions): Promise<PaginatedOrdersResponse> {
    let orders = Array.from(this.orders.values());

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      orders = orders.filter(order => order.status === filters.status);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      orders = orders.filter(order => 
        order.id.toLowerCase().includes(searchTerm) ||
        order.deliveryAddress.toLowerCase().includes(searchTerm) ||
        (order.userId && order.userId.toLowerCase().includes(searchTerm))
      );
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      orders = orders.filter(order => new Date(order.createdAt!) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      orders = orders.filter(order => new Date(order.createdAt!) <= toDate);
    }

    // Sort orders
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';
    
    orders.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'createdAt':
          comparison = new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime();
          break;
        case 'totalAmount':
          comparison = parseFloat(a.totalAmount) - parseFloat(b.totalAmount);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime();
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const total = orders.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedOrders = orders.slice(startIndex, endIndex);

    return {
      orders: paginatedOrders,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  async getOrderById(orderId: string): Promise<Order | undefined> {
    return this.orders.get(orderId);
  }

  async getOrderDetails(orderId: string): Promise<OrderWithDetails | undefined> {
    const order = this.orders.get(orderId);
    if (!order) return undefined;

    const items = this.orderItems.get(orderId) || [];
    
    // Get user details
    let user = undefined;
    if (order.userId) {
      const userData = this.users.get(order.userId);
      if (userData) {
        user = {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          phone: userData.phone || undefined
        };
      }
    }

    return {
      ...order,
      items,
      user
    };
  }

  async getOrderItems(orderId: string): Promise<Array<{ id: string; orderId: string; productId: string; productName: string; productPrice: string; quantity: number; totalPrice: string }>> {
    return this.orderItems.get(orderId) || [];
  }

  async updateOrdersStatus(orderIds: string[], status: string): Promise<Order[]> {
    const updatedOrders: Order[] = [];
    
    for (const orderId of orderIds) {
      const updatedOrder = await this.updateOrderStatus(orderId, status);
      if (updatedOrder) {
        updatedOrders.push(updatedOrder);
      }
    }
    
    return updatedOrders;
  }

  async getOrderStats(dateFrom?: string, dateTo?: string): Promise<OrderStats> {
    let orders = Array.from(this.orders.values());

    // Filter by date range if provided
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      orders = orders.filter(order => new Date(order.createdAt!) >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      orders = orders.filter(order => new Date(order.createdAt!) <= toDate);
    }

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
    
    const statusCounts = {
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      delivering: orders.filter(o => o.status === 'delivering').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Revenue by day (last 7 days)
    const revenueByDay: Array<{ date: string; revenue: number; orders: number }> = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt!).toISOString().split('T')[0];
        return orderDate === dateStr;
      });
      
      const dayRevenue = dayOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
      
      revenueByDay.push({
        date: dateStr,
        revenue: dayRevenue,
        orders: dayOrders.length
      });
    }

    // Top products (mock data for now since we don't have detailed order items)
    const topProducts = [
      { productId: 'prod-1', productName: 'Хлеб Бородинский', quantity: 50, revenue: 4450 },
      { productId: 'prod-2', productName: 'Молоко Простоквашино', quantity: 35, revenue: 2625 },
      { productId: 'prod-3', productName: 'Гречка Мистраль', quantity: 25, revenue: 3000 },
    ];

    return {
      totalOrders,
      totalRevenue,
      statusCounts,
      averageOrderValue,
      revenueByDay,
      topProducts
    };
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order | undefined> {
    const order = this.orders.get(orderId);
    if (!order) return undefined;

    const updatedOrder = { ...order, status };
    this.orders.set(orderId, updatedOrder);

    // Create notification for order status change
    if (order.userId) {
      const statusMessages = {
        confirmed: 'Ваш заказ подтвержден и готовится к доставке',
        preparing: 'Заказ собирается на складе',
        out_for_delivery: 'Заказ в пути! Курьер уже едет к вам',
        delivered: 'Заказ доставлен. Спасибо за покупку!',
        cancelled: 'Заказ отменен'
      };

      const message = statusMessages[status as keyof typeof statusMessages] || `Статус заказа изменен на: ${status}`;

      await this.createNotification({
        userId: order.userId,
        title: 'Обновление заказа',
        message,
        type: 'order',
        relatedOrderId: orderId,
        isRead: false
      });
    }

    return updatedOrder;
  }

  async deleteOrder(orderId: string): Promise<boolean> {
    const orderExists = this.orders.has(orderId);
    if (orderExists) {
      this.orders.delete(orderId);
    }
    return orderExists;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.isRead)
      .length;
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = {
      ...insertNotification,
      id,
      createdAt: new Date().toISOString(),
      userId: insertNotification.userId || null,
      type: insertNotification.type || "info",
      relatedOrderId: insertNotification.relatedOrderId || null,
      isRead: insertNotification.isRead || false
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(notificationId: string): Promise<Notification | undefined> {
    const notification = this.notifications.get(notificationId);
    if (!notification) return undefined;

    const updatedNotification = { ...notification, isRead: true };
    this.notifications.set(notificationId, updatedNotification);
    return updatedNotification;
  }

  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    const userNotifications = Array.from(this.notifications.entries())
      .filter(([_, notification]) => notification.userId === userId);

    userNotifications.forEach(([id, notification]) => {
      this.notifications.set(id, { ...notification, isRead: true });
    });

    return true;
  }

  async getActiveBanners(): Promise<Banner[]> {
    const now = new Date().toISOString();
    return Array.from(this.banners.values())
      .filter(banner => {
        if (!banner.isActive) return false;
        if (banner.startDate && banner.startDate > now) return false;
        if (banner.endDate && banner.endDate < now) return false;
        return true;
      })
      .sort((a, b) => (a.priority || 0) - (b.priority || 0));
  }

  async getAllBanners(): Promise<Banner[]> {
    return Array.from(this.banners.values())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createBanner(insertBanner: InsertBanner): Promise<Banner> {
    const id = randomUUID();
    const banner: Banner = {
      ...insertBanner,
      id,
      createdAt: new Date().toISOString(),
      type: insertBanner.type || "info",
      subtitle: insertBanner.subtitle || null,
      backgroundColor: insertBanner.backgroundColor || "#6366f1",
      textColor: insertBanner.textColor || "#ffffff",
      buttonText: insertBanner.buttonText || null,
      buttonLink: insertBanner.buttonLink || null,
      isActive: insertBanner.isActive !== undefined ? insertBanner.isActive : true,
      priority: insertBanner.priority || 0,
      startDate: insertBanner.startDate || null,
      endDate: insertBanner.endDate || null
    };
    this.banners.set(id, banner);
    return banner;
  }

  async updateBanner(id: string, updateData: Partial<InsertBanner>): Promise<Banner | undefined> {
    const banner = this.banners.get(id);
    if (!banner) return undefined;

    const updatedBanner = { ...banner, ...updateData };
    this.banners.set(id, updatedBanner);
    return updatedBanner;
  }

  async deleteBanner(id: string): Promise<boolean> {
    return this.banners.delete(id);
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    return Array.from(this.userPreferences.values()).find(pref => pref.userId === userId);
  }

  async createUserPreferences(insertPreferences: InsertUserPreferences): Promise<UserPreferences> {
    const id = randomUUID();
    const preferences: UserPreferences = {
      ...insertPreferences,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: insertPreferences.userId,
      theme: insertPreferences.theme || "light",
      primaryColor: insertPreferences.primaryColor || "#6366f1",
      accentColor: insertPreferences.accentColor || "#10b981",
      backgroundColor: insertPreferences.backgroundColor || null,
      customCss: insertPreferences.customCss || null
    };
    this.userPreferences.set(id, preferences);
    return preferences;
  }

  async updateUserPreferences(userId: string, updateData: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined> {
    const existing = Array.from(this.userPreferences.entries()).find(([_, pref]) => pref.userId === userId);
    if (!existing) return undefined;

    const [id, preferences] = existing;
    const updated = {
      ...preferences,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    this.userPreferences.set(id, updated);
    return updated;
  }

  // Admin User Management Methods
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getAllUsersWithFiltering(filters: UserFilterOptions): Promise<PaginatedUsersResponse> {
    let users = Array.from(this.users.values());

    // Apply filters
    if (filters.role && filters.role !== 'all') {
      users = users.filter(user => user.role === filters.role);
    }

    if (filters.status && filters.status !== 'all') {
      users = users.filter(user => user.status === filters.status);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      users = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        (user.phone && user.phone.toLowerCase().includes(searchTerm))
      );
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      users = users.filter(user => new Date(user.createdAt!) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      users = users.filter(user => new Date(user.createdAt!) <= toDate);
    }

    // Sort users
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';
    
    users.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'createdAt':
          comparison = new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime();
          break;
        case 'username':
          comparison = a.username.localeCompare(b.username);
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'role':
          comparison = a.role.localeCompare(b.role);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime();
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const total = users.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedUsers = users.slice(startIndex, endIndex);

    // Calculate stats for the response
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.status === 'active').length;
    const blockedUsers = users.filter(user => user.status === 'blocked').length;
    const adminUsers = users.filter(user => user.role === 'admin').length;
    const regularUsers = users.filter(user => user.role === 'user').length;

    return {
      users: paginatedUsers,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      stats: {
        totalUsers,
        activeUsers,
        blockedUsers,
        adminUsers,
        regularUsers
      }
    };
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, role };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserStatus(id: string, status: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, status };
    this.users.set(id, updatedUser);

    // Create notification for status change
    if (status === 'blocked') {
      await this.createNotification({
        userId: id,
        title: 'Аккаунт заблокирован',
        message: 'Ваш аккаунт был заблокирован администратором. Обратитесь в службу поддержки для получения дополнительной информации.',
        type: 'warning',
        isRead: false
      });
    } else if (status === 'active') {
      await this.createNotification({
        userId: id,
        title: 'Аккаунт разблокирован',
        message: 'Ваш аккаунт был разблокирован. Вы снова можете пользоваться всеми функциями приложения.',
        type: 'success',
        isRead: false
      });
    }

    return updatedUser;
  }

  async getUserStats(): Promise<UserStats> {
    const users = Array.from(this.users.values());
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.status === 'active').length;
    const blockedUsers = users.filter(user => user.status === 'blocked').length;
    const adminUsers = users.filter(user => user.role === 'admin').length;
    const regularUsers = users.filter(user => user.role === 'user').length;

    // Registration stats for last 7 days
    const registrationsByDay: Array<{ date: string; count: number }> = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRegistrations = users.filter(user => {
        const userDate = new Date(user.createdAt!).toISOString().split('T')[0];
        return userDate === dateStr;
      });
      
      registrationsByDay.push({
        date: dateStr,
        count: dayRegistrations.length
      });
    }

    // Get user order statistics
    const orders = Array.from(this.orders.values());
    const usersWithOrders = new Set(orders.map(order => order.userId).filter(Boolean));
    const activeUsersWithOrders = usersWithOrders.size;
    
    // Top customers by order count
    const userOrderCounts = new Map<string, number>();
    orders.forEach(order => {
      if (order.userId) {
        userOrderCounts.set(order.userId, (userOrderCounts.get(order.userId) || 0) + 1);
      }
    });
    
    const topCustomers = Array.from(userOrderCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([userId, orderCount]) => {
        const user = users.find(u => u.id === userId);
        return {
          userId,
          username: user?.username || 'Unknown',
          email: user?.email || 'Unknown',
          orderCount,
          totalSpent: orders
            .filter(order => order.userId === userId)
            .reduce((sum, order) => sum + parseFloat(order.totalAmount), 0)
        };
      });

    return {
      totalUsers,
      activeUsers,
      blockedUsers,
      adminUsers,
      regularUsers,
      activeUsersWithOrders,
      registrationsByDay,
      topCustomers
    };
  }

  async getProductStats(dateFrom?: string, dateTo?: string): Promise<ProductStats> {
    const products = Array.from(this.products.values());
    const orders = Array.from(this.orders.values());
    const categories = Array.from(this.categories.values());

    // Filter orders by date if provided
    const filteredOrders = dateFrom || dateTo ? orders.filter(order => {
      const orderDate = new Date(order.createdAt!);
      const fromDate = dateFrom ? new Date(dateFrom) : new Date(0);
      const toDate = dateTo ? new Date(dateTo) : new Date();
      return orderDate >= fromDate && orderDate <= toDate;
    }) : orders;

    const totalProducts = products.length;
    const outOfStockProducts = products.filter(p => !p.inStock).length;
    const popularProducts = products.filter(p => p.isPopular).length;
    const averagePrice = products.reduce((sum, p) => sum + parseFloat(p.price), 0) / totalProducts;
    const totalInventoryValue = products.reduce((sum, p) => sum + parseFloat(p.price), 0);

    // Products by category
    const productsByCategory = categories.map(category => {
      const categoryProducts = products.filter(p => p.categoryId === category.id);
      const avgPrice = categoryProducts.length > 0 
        ? categoryProducts.reduce((sum, p) => sum + parseFloat(p.price), 0) / categoryProducts.length 
        : 0;
      
      return {
        categoryId: category.id,
        categoryName: category.name,
        count: categoryProducts.length,
        averagePrice: avgPrice
      };
    });

    const productSales = new Map<string, { quantity: number; revenue: number }>();
    filteredOrders.forEach(order => {
      const items = this.orderItems.get(order.id) || [];
      items.forEach((item: any) => {
        const existing = productSales.get(item.productId) || { quantity: 0, revenue: 0 };
        productSales.set(item.productId, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + (parseFloat(item.productPrice) * item.quantity)
        });
      });
    });

    // Top selling products
    const topSellingProducts = Array.from(productSales.entries())
      .sort(([, a], [, b]) => b.quantity - a.quantity)
      .slice(0, 10)
      .map(([productId, data]) => {
        const product = products.find(p => p.id === productId);
        return {
          productId,
          productName: product?.name || 'Unknown Product',
          totalSold: data.quantity,
          revenue: data.revenue
        };
      });

    // Price distribution
    const priceRanges = [
      { min: 0, max: 50, label: '0-50₽' },
      { min: 50, max: 100, label: '50-100₽' },
      { min: 100, max: 200, label: '100-200₽' },
      { min: 200, max: 500, label: '200-500₽' },
      { min: 500, max: Infinity, label: '500₽+' }
    ];

    const priceDistribution = priceRanges.map(range => ({
      range: range.label,
      count: products.filter(p => {
        const price = parseFloat(p.price);
        return price >= range.min && price < range.max;
      }).length
    }));

    // Sales by day for the last 7 days
    const salesByDay: Array<{ date: string; productsSold: number; revenue: number }> = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.createdAt!).toISOString().split('T')[0];
        return orderDate === dateStr;
      });
      
      let productsSold = 0;
      let revenue = 0;
      
      dayOrders.forEach(order => {
        const items = this.orderItems.get(order.id) || [];
        items.forEach((item: any) => {
          productsSold += item.quantity;
          revenue += parseFloat(item.productPrice) * item.quantity;
        });
      });
      
      salesByDay.push({
        date: dateStr,
        productsSold,
        revenue
      });
    }

    return {
      totalProducts,
      outOfStockProducts,
      popularProducts,
      averagePrice,
      totalInventoryValue,
      productsByCategory,
      topSellingProducts,
      priceDistribution,
      salesByDay
    };
  }

  async getCategoryStats(dateFrom?: string, dateTo?: string): Promise<CategoryStats> {
    const categories = Array.from(this.categories.values());
    const products = Array.from(this.products.values());
    const orders = Array.from(this.orders.values());

    // Filter orders by date if provided
    const filteredOrders = dateFrom || dateTo ? orders.filter(order => {
      const orderDate = new Date(order.createdAt!);
      const fromDate = dateFrom ? new Date(dateFrom) : new Date(0);
      const toDate = dateTo ? new Date(dateTo) : new Date();
      return orderDate >= fromDate && orderDate <= toDate;
    }) : orders;

    const totalCategories = categories.length;
    const categoriesWithProducts = categories.filter(cat => 
      products.some(p => p.categoryId === cat.id)
    ).length;
    const averageProductsPerCategory = totalCategories > 0 
      ? products.length / totalCategories 
      : 0;

    const categorySales = new Map<string, { sales: number; revenue: number }>();
    filteredOrders.forEach(order => {
      const items = this.orderItems.get(order.id) || [];
      items.forEach((item: any) => {
        const product = products.find(p => p.id === item.productId);
        if (product?.categoryId) {
          const existing = categorySales.get(product.categoryId) || { sales: 0, revenue: 0 };
          categorySales.set(product.categoryId, {
            sales: existing.sales + item.quantity,
            revenue: existing.revenue + (parseFloat(item.productPrice) * item.quantity)
          });
        }
      });
    });

    // Category performance
    const categoryPerformance = categories.map(category => {
      const categoryProducts = products.filter(p => p.categoryId === category.id);
      const sales = categorySales.get(category.id) || { sales: 0, revenue: 0 };
      const avgPrice = categoryProducts.length > 0
        ? categoryProducts.reduce((sum, p) => sum + parseFloat(p.price), 0) / categoryProducts.length
        : 0;
      
      // Popularity score based on sales and revenue
      const popularityScore = sales.sales * 0.7 + (sales.revenue / 100) * 0.3;

      return {
        categoryId: category.id,
        categoryName: category.name,
        totalProducts: categoryProducts.length,
        totalSales: sales.sales,
        revenue: sales.revenue,
        averageProductPrice: avgPrice,
        popularityScore
      };
    }).sort((a, b) => b.popularityScore - a.popularityScore);

    // Sales by category over time (last 7 days)
    const salesByCategory = categories.map(category => {
      const salesByDay: Array<{ date: string; sales: number; revenue: number }> = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayOrders = filteredOrders.filter(order => {
          const orderDate = new Date(order.createdAt!).toISOString().split('T')[0];
          return orderDate === dateStr;
        });
        
        let sales = 0;
        let revenue = 0;
        
        dayOrders.forEach(order => {
          const items = this.orderItems.get(order.id) || [];
          items.forEach((item: any) => {
            const product = products.find(p => p.id === item.productId);
            if (product?.categoryId === category.id) {
              sales += item.quantity;
              revenue += parseFloat(item.productPrice) * item.quantity;
            }
          });
        });
        
        salesByDay.push({
          date: dateStr,
          sales,
          revenue
        });
      }

      return {
        categoryId: category.id,
        categoryName: category.name,
        salesByDay
      };
    });

    return {
      totalCategories,
      categoriesWithProducts,
      averageProductsPerCategory,
      categoryPerformance,
      salesByCategory
    };
  }

  async getPromoCodeStats(dateFrom?: string, dateTo?: string): Promise<PromoCodeStats> {
    // Mock promo codes data since they're not stored in database
    const promoCodes = [
      { code: "ПЕРВЫЙ", discount: 20, description: "Скидка 20% на первый заказ", isActive: true },
      { code: "ДРУЗЬЯМ", discount: 15, description: "Скидка 15% для друзей", isActive: true },
      { code: "ЛЕТОМ", discount: 10, description: "Летняя скидка 10%", isActive: true },
      { code: "ЗИМА2024", discount: 25, description: "Зимняя распродажа", isActive: false },
      { code: "НОВЫЙ2025", discount: 30, description: "Новогодняя скидка", isActive: true },
    ];

    const orders = Array.from(this.orders.values());
    
    // Filter orders by date if provided
    const filteredOrders = dateFrom || dateTo ? orders.filter(order => {
      const orderDate = new Date(order.createdAt!);
      const fromDate = dateFrom ? new Date(dateFrom) : new Date(0);
      const toDate = dateTo ? new Date(dateTo) : new Date();
      return orderDate >= fromDate && orderDate <= toDate;
    }) : orders;

    // Mock usage stats - in real app this would come from order data
    const usageStats = promoCodes.map(promo => {
      // Simulate promo usage based on discount percentage
      const baseUsage = Math.floor(Math.random() * 50) + 10;
      const timesUsed = promo.isActive ? baseUsage : Math.floor(baseUsage * 0.3);
      const avgOrderValue = 1500; // Mock average order value
      const totalDiscount = timesUsed * avgOrderValue * (promo.discount / 100);

      return {
        code: promo.code,
        description: promo.description,
        discount: promo.discount,
        timesUsed,
        totalDiscount,
        isActive: promo.isActive
      };
    });

    // Discounts by day for the last 7 days
    const discountsByDay: Array<{ date: string; totalDiscounts: number; ordersWithPromo: number }> = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Mock data for discounts by day
      const ordersWithPromo = Math.floor(Math.random() * 10) + 2;
      const totalDiscounts = ordersWithPromo * 200 + Math.random() * 500;
      
      discountsByDay.push({
        date: dateStr,
        totalDiscounts,
        ordersWithPromo
      });
    }

    // Most popular promos
    const mostPopularPromos = usageStats
      .filter(stat => stat.timesUsed > 0)
      .sort((a, b) => b.timesUsed - a.timesUsed)
      .slice(0, 5)
      .map(stat => ({
        code: stat.code,
        discount: stat.discount,
        usageCount: stat.timesUsed,
        revenue: stat.totalDiscount
      }));

    return {
      totalPromoCodes: promoCodes.length,
      activePromoCodes: promoCodes.filter(p => p.isActive).length,
      usageStats,
      discountsByDay,
      mostPopularPromos
    };
  }

  async getAnalyticsOverview(dateFrom?: string, dateTo?: string): Promise<AnalyticsOverview> {
    const [orderStats, userStats, productStats, categoryStats, promoCodeStats] = await Promise.all([
      this.getOrderStats(dateFrom, dateTo),
      this.getUserStats(),
      this.getProductStats(dateFrom, dateTo),
      this.getCategoryStats(dateFrom, dateTo),
      this.getPromoCodeStats(dateFrom, dateTo)
    ]);

    const orders = Array.from(this.orders.values());
    
    // Filter orders by date if provided
    const filteredOrders = dateFrom || dateTo ? orders.filter(order => {
      const orderDate = new Date(order.createdAt!);
      const fromDate = dateFrom ? new Date(dateFrom) : new Date(0);
      const toDate = dateTo ? new Date(dateTo) : new Date();
      return orderDate >= fromDate && orderDate <= toDate;
    }) : orders;

    // Peak hours analysis
    const hourlyStats = Array.from({ length: 24 }, (_, hour) => ({ hour, orderCount: 0, revenue: 0 }));
    
    filteredOrders.forEach(order => {
      const orderHour = new Date(order.createdAt!).getHours();
      hourlyStats[orderHour].orderCount++;
      hourlyStats[orderHour].revenue += parseFloat(order.totalAmount);
    });

    const peakHoursStats = hourlyStats.sort((a, b) => b.orderCount - a.orderCount);

    // Growth metrics (compare with previous period)
    const periodLength = dateFrom && dateTo 
      ? Math.ceil((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (1000 * 60 * 60 * 24))
      : 30; // Default 30 days

    const previousPeriodStart = new Date();
    previousPeriodStart.setDate(previousPeriodStart.getDate() - (periodLength * 2));
    const previousPeriodEnd = new Date();
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - periodLength);

    const previousOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt!);
      return orderDate >= previousPeriodStart && orderDate <= previousPeriodEnd;
    });

    const currentOrderCount = filteredOrders.length;
    const previousOrderCount = previousOrders.length;
    const orderGrowth = previousOrderCount > 0 
      ? ((currentOrderCount - previousOrderCount) / previousOrderCount) * 100 
      : 0;

    const currentRevenue = filteredOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
    const previousRevenue = previousOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
    const revenueGrowth = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    // User growth is calculated differently as it's cumulative
    const userGrowth = userStats.registrationsByDay.length > 0 
      ? userStats.registrationsByDay.reduce((sum, day) => sum + day.count, 0) * 10 // Mock calculation
      : 0;

    return {
      orderStats,
      userStats,
      productStats,
      categoryStats,
      promoCodeStats,
      peakHoursStats,
      growthMetrics: {
        orderGrowth,
        revenueGrowth,
        userGrowth
      }
    };
  }

  // Error Management Methods
  async createError(error: InsertError): Promise<Error> {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    const newError: Error = {
      id,
      message: error.message,
      stack: error.stack || null,
      type: error.type || "js_error",
      source: error.source || "frontend",
      url: error.url || null,
      userAgent: error.userAgent || null,
      userId: error.userId || null,
      level: error.level || "error",
      metadata: error.metadata || null,
      resolved: error.resolved || false,
      resolvedAt: null,
      resolvedBy: null,
      createdAt: now,
    };
    
    this.errors.set(id, newError);
    return newError;
  }

  async getErrors(filters?: { 
    type?: string; 
    level?: string; 
    resolved?: boolean; 
    limit?: number; 
    offset?: number 
  }): Promise<Error[]> {
    let errors = Array.from(this.errors.values());
    
    // Apply filters
    if (filters?.type) {
      errors = errors.filter(error => error.type === filters.type);
    }
    
    if (filters?.level) {
      errors = errors.filter(error => error.level === filters.level);
    }
    
    if (filters?.resolved !== undefined) {
      errors = errors.filter(error => error.resolved === filters.resolved);
    }
    
    // Sort by creation date (newest first)
    errors.sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
    
    // Apply pagination
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 100;
    
    return errors.slice(offset, offset + limit);
  }

  async getErrorById(id: string): Promise<Error | undefined> {
    return this.errors.get(id);
  }

  async updateError(id: string, updates: Partial<InsertError>): Promise<Error | undefined> {
    const existingError = this.errors.get(id);
    if (!existingError) return undefined;
    
    const updatedError: Error = {
      ...existingError,
      ...updates,
    };
    
    this.errors.set(id, updatedError);
    return updatedError;
  }

  async deleteError(id: string): Promise<boolean> {
    return this.errors.delete(id);
  }

  async deleteOldErrors(daysOld: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const errors = Array.from(this.errors.values());
    let deletedCount = 0;
    
    for (const error of errors) {
      const errorDate = new Date(error.createdAt!);
      if (errorDate < cutoffDate) {
        this.errors.delete(error.id);
        deletedCount++;
      }
    }
    
    return deletedCount;
  }

  async markErrorResolved(id: string, resolvedBy: string): Promise<Error | undefined> {
    const error = this.errors.get(id);
    if (!error) return undefined;
    
    const updatedError: Error = {
      ...error,
      resolved: true,
      resolvedAt: new Date().toISOString(),
      resolvedBy,
    };
    
    this.errors.set(id, updatedError);
    return updatedError;
  }

  async getErrorStats(): Promise<{ 
    total: number; 
    unresolved: number; 
    byType: Record<string, number>; 
    byLevel: Record<string, number> 
  }> {
    const errors = Array.from(this.errors.values());
    
    const stats = {
      total: errors.length,
      unresolved: errors.filter(error => !error.resolved).length,
      byType: {} as Record<string, number>,
      byLevel: {} as Record<string, number>,
    };
    
    // Count by type
    errors.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
    });
    
    // Count by level
    errors.forEach(error => {
      stats.byLevel[error.level] = (stats.byLevel[error.level] || 0) + 1;
    });
    
    return stats;
  }
}

// Use memory storage instead of database
// import { DatabaseStorage } from "./db-storage";

export const storage = new MemStorage();