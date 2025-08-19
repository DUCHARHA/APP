import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { type CartItem, type Product } from "@shared/schema";

type CartItemWithProduct = CartItem & { product: Product };

export function useCart() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get cart data - only if user is authenticated
  const { data: cartItems = [], isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
    enabled: isAuthenticated,
    staleTime: 30000, // Cache cart data for 30 seconds
    refetchInterval: false, // Disable automatic refetching
  });

  // Add item to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string, quantity?: number }) => {
      if (!isAuthenticated) {
        throw new Error("Необходимо войти в систему");
      }

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ducharha_auth_token')}`,
        },
        body: JSON.stringify({ productId, quantity }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Добавлено в корзину",
        description: "Товар успешно добавлен в вашу корзину",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось добавить товар в корзину",
      });
    },
  });

  // Update cart item mutation
  const updateCartMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string, quantity: number }) => {
      if (!isAuthenticated) {
        throw new Error("Необходимо войти в систему");
      }

      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ducharha_auth_token')}`,
        },
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось обновить количество",
      });
    },
  });

  // Remove item from cart mutation
  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!isAuthenticated) {
        throw new Error("Необходимо войти в систему");
      }

      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('ducharha_auth_token')}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Удалено из корзины",
        description: "Товар удален из корзины",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось удалить товар",
      });
    },
  });

  // Clear entire cart mutation
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error("Необходимо войти в систему");
      }

      const response = await fetch(`/api/cart/user/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('ducharha_auth_token')}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Корзина очищена",
        description: "Все товары удалены из корзины",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось очистить корзину",
      });
    },
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
    isAuthenticated,
    addToCart: addToCartMutation.mutate,
    updateCartItem: updateCartMutation.mutate,
    removeFromCart: removeFromCartMutation.mutate,
    clearCart: clearCartMutation.mutate,
    isAddingToCart: addToCartMutation.isPending,
    isUpdatingCart: updateCartMutation.isPending,
    isRemovingFromCart: removeFromCartMutation.isPending,
    isClearingCart: clearCartMutation.isPending,
  };
}