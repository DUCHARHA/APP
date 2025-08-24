import { useQuery } from "@tanstack/react-query";
import { type CartItem, type Product } from "@shared/schema";
import { getCurrentUserId } from "@/utils/user-session";

type CartItemWithProduct = CartItem & { product: Product };

export function useCart() {
  const userId = getCurrentUserId();

  const { data: cartItems = [], isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart", userId],
    staleTime: 600000, // 10 минут кэша - увеличиваем время
    gcTime: 1200000, // 20 минут в памяти
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false, // Убираем ретраи для избежания конфликтов
  });

  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  const totalPrice = cartItems.reduce((total, item) => {
    return total + (parseFloat(item.product.price) * item.quantity);
  }, 0);

  return {
    cartItems,
    totalItems,
    totalPrice,
    isLoading,
  };
}