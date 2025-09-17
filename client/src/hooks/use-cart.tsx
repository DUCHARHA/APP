import { useQuery } from "@tanstack/react-query";
import { type CartItem, type Product } from "@shared/schema";
import { getCurrentUserId } from "@/utils/user-session";

type CartItemWithProduct = CartItem & { product: Product };

export function useCart() {
  const userId = getCurrentUserId();

  const { data: cartItems = [], isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart", userId],
    queryFn: async ({ queryKey }) => {
      const [, userId] = queryKey;
      if (!userId) throw new Error("User ID is required");
      
      const response = await fetch(`/api/cart/${userId}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch cart: ${response.status}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 60000, // 1 minute cache for cart data
    gcTime: 300000, // 5 minutes in memory
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: (failureCount, error: any) => {
      // Don't retry 4xx errors
      if (error?.message?.includes('4')) return false;
      return failureCount < 2;
    },
    enabled: !!userId, // Only run query if we have a userId
  });

  const totalItems = (cartItems ?? [])
    .filter((i) => i && Number.isFinite(i.quantity) && i.quantity > 0)
    .reduce((total, item) => total + item.quantity, 0);

  // helper: безопасно приводим цену к числу
  const toNumber = (p?: number | string | null) => {
    if (typeof p === 'number') return p;
    if (p == null) return 0;
    const v = parseFloat(String(p).replace(',', '.'));
    return Number.isFinite(v) ? v : 0;
  };

  const totalPrice = (cartItems ?? [])
    .filter((i) => i && i.product && Number.isFinite(i.quantity) && i.quantity > 0)
    .reduce((total, item) => total + toNumber(item.product.price) * item.quantity, 0);


  return {
    cartItems,
    totalItems,
    totalPrice,
    isLoading,
  };
}