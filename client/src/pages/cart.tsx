import { Plus, Minus, ShoppingBag, ArrowRight, Trash2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { getCurrentUserId } from "@/utils/user-session";
import { useState } from "react";

export default function Cart() {
  const { cartItems, totalItems, totalPrice, isLoading } = useCart();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set());
  const userId = getCurrentUserId();

  // helper: безопасно приводим цену к числу
  const toNumber = (p?: number | string | null) => {
    if (typeof p === 'number') return p;
    if (p == null) return 0;
    const v = parseFloat(String(p).replace(',', '.'));
    return Number.isFinite(v) ? v : 0;
  };

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (!response.ok) throw new Error("Failed to update cart item");
      return response.json();
    },
    onMutate: async ({ itemId, quantity }) => {
      setProcessingItems(prev => new Set(prev).add(itemId));
      await queryClient.cancelQueries({ queryKey: ["/api/cart", userId] });

      const previousCart = queryClient.getQueryData(["/api/cart", userId]);

      queryClient.setQueryData(["/api/cart", userId], (old: any) => {
        if (!old) return old || [];
        return old.map((item: any) => 
          item.id === itemId 
            ? { ...item, quantity }
            : item
        );
      });

      return { previousCart };
    },
    onSuccess: (data, { itemId }) => {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    },
    onError: (error, { itemId }, context) => {
      console.error('Update quantity error:', error);
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      if (context?.previousCart) {
        queryClient.setQueryData(["/api/cart", userId], context.previousCart);
      }
      toast({
        title: "Ошибка сети",
        description: "Проверьте интернет соединение и попробуйте снова",
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to remove cart item");
    },
    onMutate: async (itemId) => {
      setProcessingItems(prev => new Set(prev).add(itemId));
      await queryClient.cancelQueries({ queryKey: ["/api/cart", userId] });

      const previousCart = queryClient.getQueryData(["/api/cart", userId]);

      queryClient.setQueryData(["/api/cart", userId], (old: any) => {
        if (!old) return old || [];
        return old.filter((item: any) => item.id !== itemId);
      });

      return { previousCart };
    },
    onSuccess: (data, itemId) => {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    },
    onError: (error, itemId, context) => {
      console.error('Remove item error:', error);
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      if (context?.previousCart) {
        queryClient.setQueryData(["/api/cart", userId], context.previousCart);
      }
      toast({
        title: "Ошибка сети",
        description: "Проверьте интернет соединение и попробуйте снова",
        variant: "destructive",
      });
    },
  });

  const handleQuantityChange = (itemId: string, currentQuantity: number, delta: number) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity <= 0) {
      removeItemMutation.mutate(itemId);
    } else {
      updateQuantityMutation.mutate({ itemId, quantity: newQuantity });
    }
  };

  const handleCheckout = () => {
    setLocation('/checkout');
  };

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen">
        <div className="bg-white dark:bg-card shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Корзина</h1>
          </div>
        </div>
        <div className="flex items-center justify-center pt-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="bg-background min-h-screen">
        <div className="bg-white dark:bg-card shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Корзина</h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center pt-20 px-4">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <ShoppingBag className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Корзина пуста
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
            Добавьте товары из каталога, чтобы оформить заказ
          </p>
          <Link href="/catalog">
            <Button className="bg-agent-purple hover:bg-agent-purple/90" data-testid="button-go-to-catalog">
              Перейти в каталог
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-20" data-testid="page-cart">
      {/* Header */}
      <div className="bg-white dark:bg-card shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Корзина ({totalItems})
          </h1>
        </div>
      </div>

      {/* Cart Items */}
      <div className="max-w-md mx-auto px-4 py-4 space-y-3">
        {cartItems.map((item) => (
          <Card key={item.id} className="overflow-hidden" data-testid={`cart-item-${item.id}`}>
            <CardContent className="p-4">
              <div className="flex gap-3">
                {/* Product Image */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                  {item.product?.imageUrl ? (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                      data-testid={`img-cart-product-${item.id}`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-gray-400 dark:text-gray-600 text-center">
                        <div className="text-lg mb-1">📦</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm leading-tight mb-1" data-testid={`text-cart-product-name-${item.id}`}>
                    {item.product?.name || 'Неизвестный товар'}
                  </h3>
                  {item.product?.weight && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2" data-testid={`text-cart-product-weight-${item.id}`}>
                      {item.product.weight}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 dark:text-gray-100" data-testid={`text-cart-product-price-${item.id}`}>
                      {(toNumber(item.product?.price) * item.quantity).toFixed(0)} с.
                    </span>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2" data-testid={`quantity-controls-cart-${item.id}`}>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                        disabled={processingItems.has(item.id)}
                        className={`w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors ${
                          processingItems.has(item.id) ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        data-testid={`button-decrease-cart-${item.id}`}
                      >
                        {item.quantity === 1 ? (
                          <Trash2 className="w-3 h-3 text-red-500" />
                        ) : (
                          <Minus className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                        )}
                      </button>

                      <span 
                        className="w-8 text-center font-bold text-sm text-gray-900 dark:text-gray-100"
                        data-testid={`text-cart-quantity-${item.id}`}
                      >
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                        disabled={processingItems.has(item.id)}
                        className={`w-8 h-8 rounded-lg bg-agent-purple hover:bg-agent-purple/90 flex items-center justify-center transition-colors ${
                          processingItems.has(item.id) ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        data-testid={`button-increase-cart-${item.id}`}
                      >
                        <Plus className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer with Total and Checkout */}
      <div className="fixed bottom-16 left-0 right-0 bg-white dark:bg-card border-t shadow-lg">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-600 dark:text-gray-400">Итого:</span>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-cart-total">
              {totalPrice.toFixed(0)} с.
            </span>
          </div>
          <Button 
            onClick={handleCheckout}
            className="w-full bg-agent-purple hover:bg-agent-purple/90 text-white"
            data-testid="button-proceed-to-checkout"
          >
            Оформить заказ
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}