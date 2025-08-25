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

  // Диагностика (временный лог)
  console.log('cartItems:', cartItems);

  return {
    cartItems,
    totalItems,
    totalPrice,
    isLoading,
  };
}