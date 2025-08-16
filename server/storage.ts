import { type User, type InsertUser, type Category, type InsertCategory, type Product, type InsertProduct, type CartItem, type InsertCartItem, type Order, type InsertOrder } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;

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
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private categories: Map<string, Category> = new Map();
  private products: Map<string, Product> = new Map();
  private cartItems: Map<string, CartItem> = new Map();
  private orders: Map<string, Order> = new Map();

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
    ];

    categories.forEach(cat => {
      const id = randomUUID();
      this.categories.set(id, { ...cat, id });
    });

    // Seed products
    const products = [
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
        name: "Молоко 3.2%", 
        description: "Домик в деревне", 
        price: "75.00", 
        weight: "1л", 
        imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", 
        categoryId: Array.from(this.categories.values()).find(c => c.slug === "dairy")?.id, 
        isPopular: true,
        ingredients: "Молоко цельное пастеризованное",
        manufacturer: "ООО \"Домик в деревне\"",
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
        categoryId: Array.from(this.categories.values()).find(c => c.slug === "meat")?.id,
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

    products.forEach(prod => {
      const id = randomUUID();
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
      weight: insertProduct.weight || null
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
      status: insertOrder.status || "pending"
    };
    this.orders.set(id, order);
    return order;
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }
}

export const storage = new MemStorage();
