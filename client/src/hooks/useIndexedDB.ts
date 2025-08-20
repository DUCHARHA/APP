import { useState, useEffect } from 'react';
import { indexedDBService, CartItem, Order, Address, PaymentMethod, UserProfile } from '@/lib/indexeddb';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const cartItems = await indexedDBService.getCart();
      setCart(cartItems);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (item: CartItem) => {
    try {
      await indexedDBService.addToCart(item);
      await loadCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const updateCartItem = async (productId: string, quantity: number) => {
    try {
      await indexedDBService.updateCartItem(productId, quantity);
      await loadCart();
    } catch (error) {
      console.error('Error updating cart item:', error);
    }
  };

  const clearCart = async () => {
    try {
      await indexedDBService.clearCart();
      setCart([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

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

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const ordersList = await indexedDBService.getOrders();
      setOrders(ordersList);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveOrder = async (order: Order) => {
    try {
      await indexedDBService.saveOrder(order);
      await loadOrders();
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

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

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userProfile = await indexedDBService.getProfile();
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (profile: UserProfile) => {
    try {
      await indexedDBService.saveProfile(profile);
      setProfile(profile);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

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

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const addressList = await indexedDBService.getAddresses();
      setAddresses(addressList);
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAddress = async (address: Address) => {
    try {
      await indexedDBService.saveAddress(address);
      await loadAddresses();
    } catch (error) {
      console.error('Error saving address:', error);
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      await indexedDBService.deleteAddress(id);
      await loadAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  };

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

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const methods = await indexedDBService.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Error loading payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePaymentMethod = async (method: PaymentMethod) => {
    try {
      await indexedDBService.savePaymentMethod(method);
      await loadPaymentMethods();
    } catch (error) {
      console.error('Error saving payment method:', error);
    }
  };

  const deletePaymentMethod = async (id: string) => {
    try {
      await indexedDBService.deletePaymentMethod(id);
      await loadPaymentMethods();
    } catch (error) {
      console.error('Error deleting payment method:', error);
    }
  };

  return {
    paymentMethods,
    loading,
    savePaymentMethod,
    deletePaymentMethod,
    refetch: loadPaymentMethods
  };
}