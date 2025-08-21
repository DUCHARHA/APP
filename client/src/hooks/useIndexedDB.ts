import { useState, useEffect, useCallback } from 'react';
import { indexedDBService, CartItem, Order, Address, PaymentMethod, UserProfile } from '@/lib/indexeddb';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCart = useCallback(async () => {
    try {
      const cartItems = await indexedDBService.getCart();
      setCart(cartItems);
    } catch (error) {
      console.warn('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const addToCart = useCallback(async (item: CartItem) => {
    try {
      await indexedDBService.addToCart(item);
      await loadCart();
    } catch (error) {
      console.warn('Error adding to cart:', error);
      throw error; // Re-throw for UI to handle
    }
  }, [loadCart]);

  const updateCartItem = useCallback(async (productId: string, quantity: number) => {
    try {
      await indexedDBService.updateCartItem(productId, quantity);
      await loadCart();
    } catch (error) {
      console.warn('Error updating cart item:', error);
      throw error;
    }
  }, [loadCart]);

  const clearCart = useCallback(async () => {
    try {
      await indexedDBService.clearCart();
      setCart([]);
    } catch (error) {
      console.warn('Error clearing cart:', error);
      throw error;
    }
  }, []);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cart,
    loading,
    addToCart,
    updateCartItem,
    clearCart,
    total,
    itemCount,
    refetch: loadCart
  };
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    try {
      const ordersList = await indexedDBService.getOrders();
      setOrders(ordersList);
    } catch (error) {
      console.warn('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const saveOrder = useCallback(async (order: Order) => {
    try {
      await indexedDBService.saveOrder(order);
      await loadOrders();
    } catch (error) {
      console.warn('Error saving order:', error);
      throw error;
    }
  }, [loadOrders]);

  return {
    orders,
    loading,
    saveOrder,
    refetch: loadOrders
  };
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const userProfile = await indexedDBService.getProfile();
      setProfile(userProfile);
    } catch (error) {
      console.warn('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const saveProfile = useCallback(async (profile: UserProfile) => {
    try {
      await indexedDBService.saveProfile(profile);
      setProfile(profile);
    } catch (error) {
      console.warn('Error saving profile:', error);
      throw error;
    }
  }, []);

  return {
    profile,
    loading,
    saveProfile,
    refetch: loadProfile
  };
}

export function useAddresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAddresses = useCallback(async () => {
    try {
      const addressList = await indexedDBService.getAddresses();
      setAddresses(addressList);
    } catch (error) {
      console.warn('Error loading addresses:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const saveAddress = useCallback(async (address: Address) => {
    try {
      await indexedDBService.saveAddress(address);
      await loadAddresses();
    } catch (error) {
      console.warn('Error saving address:', error);
      throw error;
    }
  }, [loadAddresses]);

  const deleteAddress = useCallback(async (id: string) => {
    try {
      await indexedDBService.deleteAddress(id);
      await loadAddresses();
    } catch (error) {
      console.warn('Error deleting address:', error);
      throw error;
    }
  }, [loadAddresses]);

  return {
    addresses,
    loading,
    saveAddress,
    deleteAddress,
    refetch: loadAddresses
  };
}

export function usePaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPaymentMethods = useCallback(async () => {
    try {
      const methods = await indexedDBService.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (error) {
      console.warn('Error loading payment methods:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPaymentMethods();
  }, [loadPaymentMethods]);

  const savePaymentMethod = useCallback(async (method: PaymentMethod) => {
    try {
      await indexedDBService.savePaymentMethod(method);
      await loadPaymentMethods();
    } catch (error) {
      console.warn('Error saving payment method:', error);
      throw error;
    }
  }, [loadPaymentMethods]);

  const deletePaymentMethod = useCallback(async (id: string) => {
    try {
      await indexedDBService.deletePaymentMethod(id);
      await loadPaymentMethods();
    } catch (error) {
      console.warn('Error deleting payment method:', error);
      throw error;
    }
  }, [loadPaymentMethods]);

  return {
    paymentMethods,
    loading,
    savePaymentMethod,
    deletePaymentMethod,
    refetch: loadPaymentMethods
  };
}