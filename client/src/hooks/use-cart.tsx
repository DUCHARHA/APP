import { useQuery } from "@tanstack/react-query";
import { type CartItem, type Product } from "@shared/schema";

type CartItemWithProduct = CartItem & { product: Product };

export function useCart() {
  const userId = "demo-user"; // In real app, get from auth context

  const { data: cartItems = [] } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart", userId],
    staleTime: 0, // Always refetch for real-time cart updates
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
