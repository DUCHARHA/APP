import { type User, type InsertUser, type Category, type InsertCategory, type Product, type InsertProduct, type CartItem, type InsertCartItem, type Order, type InsertOrder, type Notification, type InsertNotification, type Banner, type InsertBanner, type UserPreferences, type InsertUserPreferences } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;

  // User Preferences
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: string, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined>;

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

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private categories: Map<string, Category> = new Map();
  private products: Map<string, Product> = new Map();
  private cartItems: Map<string, CartItem> = new Map();
  private orders: Map<string, Order> = new Map();
  private notifications: Map<string, Notification> = new Map();
  private banners: Map<string, Banner> = new Map();
  private userPreferences: Map<string, UserPreferences> = new Map();

  constructor() {
    this.seedData();
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
        imageUrl: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", 
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
        id: randomUUID(),
        title: "Доставка продуктов быстрее, чем поход в магазин",
        subtitle: "Экспресс доставка",
        message: "Свежие продукты к вашему столу за 10-15 минут",
        type: "promo",
        backgroundColor: "#22c55e",
        textColor: "#ffffff",
        buttonText: "",
        buttonLink: "",
        isActive: true,
        priority: 0,
        startDate: null,
        endDate: null,
        createdAt: new Date().toISOString()
      },
      {
        id: randomUUID(),
        title: "RC Cola - Освежись сейчас!",
        subtitle: "Партнерская акция",
        message: "Получи RC Cola бесплатно при заказе от 50 сомони",
        type: "partnership",
        backgroundColor: "#f97316",
        textColor: "#ffffff",
        buttonText: "Получить колу",
        buttonLink: "/catalog",
        isActive: true,
        priority: 1,
        startDate: null,
        endDate: null,
        createdAt: new Date().toISOString()
      },
      {
        id: randomUUID(),
        title: "Скидка 20% на первый заказ",
        subtitle: "Промокод\n",
        message: "Используйте промокод при оформлении заказа и получите скидку 20%",
        type: "promo",
        backgroundColor: "#3b82f6",
        textColor: "#ffffff",
        buttonText: "Скопировать промокод",
        buttonLink: "/catalog",
        isActive: true,
        priority: 2,
        startDate: null,
        endDate: null,
        createdAt: new Date().toISOString()
      }
    ];

    sampleBanners.forEach(banner => {
      this.banners.set(banner.id, banner);
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
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      }
    ];

    sampleOrders.forEach(order => {
      this.orders.set(order.id, order);
    });
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
      address: insertUser.address || null
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

  async searchProducts(query: string): Promise<Product[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.products.values()).filter(p => 
      p.inStock && (
        p.name.toLowerCase().includes(lowercaseQuery) ||
        p.description?.toLowerCase().includes(lowercaseQuery)
      )
    );
  }

  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    const userCartItems = Array.from(this.cartItems.values()).filter(item => item.userId === userId);
    return userCartItems.map(item => {
      const product = this.products.get(item.productId!);
      return { ...item, product: product! };
    }).filter(item => item.product);
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
    const order: Order = { 
      ...insertOrder, 
      id, 
      createdAt: new Date().toISOString(),
      userId: insertOrder.userId || null,
      status: insertOrder.status || "pending",
      comment: insertOrder.comment || null,
      packerComment: insertOrder.packerComment || null
    };
    this.orders.set(id, order);
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

  async getOrderById(orderId: string): Promise<Order | undefined> {
    return this.orders.get(orderId);
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
}

// Use memory storage instead of database
export const storage = new MemStorage();