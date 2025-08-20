// IndexedDB wrapper for offline data storage
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  addresses: Address[];
  paymentMethods: PaymentMethod[];
}

export interface Address {
  id: string;
  title: string;
  address: string;
  apartment?: string;
  entrance?: string;
  floor?: string;
  intercom?: string;
  comment?: string;
  isDefault: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'cash';
  title: string;
  cardNumber?: string;
  isDefault: boolean;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'delivery' | 'delivered' | 'cancelled';
  address: Address;
  paymentMethod: PaymentMethod;
  createdAt: string;
  deliveryTime?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

class IndexedDBService {
  private dbName = 'ducharha_pwa';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // User profile store
        if (!db.objectStoreNames.contains('profile')) {
          db.createObjectStore('profile', { keyPath: 'id' });
        }

        // Orders store
        if (!db.objectStoreNames.contains('orders')) {
          const ordersStore = db.createObjectStore('orders', { keyPath: 'id' });
          ordersStore.createIndex('status', 'status', { unique: false });
          ordersStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Cart store
        if (!db.objectStoreNames.contains('cart')) {
          db.createObjectStore('cart', { keyPath: 'productId' });
        }

        // Addresses store
        if (!db.objectStoreNames.contains('addresses')) {
          db.createObjectStore('addresses', { keyPath: 'id' });
        }

        // Payment methods store
        if (!db.objectStoreNames.contains('paymentMethods')) {
          db.createObjectStore('paymentMethods', { keyPath: 'id' });
        }
      };
    });
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    if (!this.db) {
      await this.init();
    }
    const transaction = this.db!.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // Profile methods
  async saveProfile(profile: UserProfile): Promise<void> {
    const store = await this.getStore('profile', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(profile);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getProfile(): Promise<UserProfile | null> {
    const store = await this.getStore('profile');
    return new Promise((resolve, reject) => {
      const request = store.get('user');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Cart methods
  async addToCart(item: CartItem): Promise<void> {
    const store = await this.getStore('cart', 'readwrite');
    return new Promise((resolve, reject) => {
      const getRequest = store.get(item.productId);
      getRequest.onsuccess = () => {
        const existingItem = getRequest.result;
        if (existingItem) {
          existingItem.quantity += item.quantity;
          const updateRequest = store.put(existingItem);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          const addRequest = store.add(item);
          addRequest.onsuccess = () => resolve();
          addRequest.onerror = () => reject(addRequest.error);
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getCart(): Promise<CartItem[]> {
    const store = await this.getStore('cart');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateCartItem(productId: string, quantity: number): Promise<void> {
    const store = await this.getStore('cart', 'readwrite');
    return new Promise((resolve, reject) => {
      if (quantity <= 0) {
        const deleteRequest = store.delete(productId);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      } else {
        const getRequest = store.get(productId);
        getRequest.onsuccess = () => {
          const item = getRequest.result;
          if (item) {
            item.quantity = quantity;
            const updateRequest = store.put(item);
            updateRequest.onsuccess = () => resolve();
            updateRequest.onerror = () => reject(updateRequest.error);
          } else {
            resolve();
          }
        };
        getRequest.onerror = () => reject(getRequest.error);
      }
    });
  }

  async clearCart(): Promise<void> {
    const store = await this.getStore('cart', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Orders methods
  async saveOrder(order: Order): Promise<void> {
    const store = await this.getStore('orders', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(order);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getOrders(): Promise<Order[]> {
    const store = await this.getStore('orders');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const orders = request.result.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        resolve(orders);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getOrder(id: string): Promise<Order | null> {
    const store = await this.getStore('orders');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Addresses methods
  async saveAddress(address: Address): Promise<void> {
    const store = await this.getStore('addresses', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(address);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAddresses(): Promise<Address[]> {
    const store = await this.getStore('addresses');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteAddress(id: string): Promise<void> {
    const store = await this.getStore('addresses', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Payment methods
  async savePaymentMethod(paymentMethod: PaymentMethod): Promise<void> {
    const store = await this.getStore('paymentMethods', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(paymentMethod);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const store = await this.getStore('paymentMethods');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deletePaymentMethod(id: string): Promise<void> {
    const store = await this.getStore('paymentMethods', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const indexedDBService = new IndexedDBService();