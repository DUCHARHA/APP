import { useQuery } from "@tanstack/react-query";
import { type CartItem, type Product } from "@shared/schema";
import { getCurrentUserId } from "@/utils/user-session";

type CartItemWithProduct = CartItem & { product: Product };

export function useCart() {
  const userId = getCurrentUserId();

  const { data: cartItems = [], isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart", userId],
    staleTime: 60000, // Увеличиваем время кэша до 1 минуты
    refetchInterval: false,
    refetchOnWindowFocus: false, // Отключаем перезагрузку при фокусе
    refetchOnMount: false, // Не перезагружаем при монтировании если есть кэш
  });

  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  const totalPrice = cartItems.reduce((total, item) => {
    return total + (parseFloat(item.product.price) * item.quantity);
  }, 0);

  return {
    cartItems,
    totalItems,
    totalPrice,
  };
}