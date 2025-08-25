import { Plus, Minus, Check } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { type Product } from "@shared/schema";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { getCurrentUserId } from "@/utils/user-session";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { toast } = useToast();
  const { cartItems } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const userId = getCurrentUserId();

  // Find current quantity of this product in cart
  const cartItem = cartItems.find(item => item.productId === product.id);
  const currentQuantity = cartItem?.quantity || 0;

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          productId: product.id,
          quantity: 1,
        }),
      });
      if (!response.ok) throw new Error("Failed to add to cart");
      return response.json();
    },
    onMutate: async () => {
      setIsAdded(true);
      await queryClient.cancelQueries({ queryKey: ["/api/cart", userId] });

      const previousCart = queryClient.getQueryData(["/api/cart", userId]);

      queryClient.setQueryData(["/api/cart", userId], (old: any) => {
        if (!old) return [];
        const existingItem = old.find((item: any) => item?.product?.id === product.id);
        if (existingItem) {
          return old.map((item: any) => 
            item?.product?.id === product.id 
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          return [...old, {
            id: `temp-${Date.now()}-${product.id}`,
            userId,
            productId: product.id,
            quantity: 1,
            product
          }];
        }
      });

      return { previousCart };
    },
    onSuccess: (data) => {
      // Обновляем кэш реальными данными с сервера
      queryClient.setQueryData(["/api/cart", userId], (old: any) => {
        if (!old) return [];
        const hasTemp = old.find((item: any) => item?.id?.startsWith('temp-'));
        if (hasTemp) {
          // Заменяем временную запись на реальную
          return old.map((item: any) => 
            item?.id?.startsWith('temp-') && item.productId === product.id
              ? { ...item, id: data.id }
              : item
          );
        }
        return old;
      });
      setTimeout(() => setIsAdded(false), 2000);
    },
    onError: (error, variables, context) => {
      console.error('Add to cart error:', error);
      if (context?.previousCart) {
        queryClient.setQueryData(["/api/cart", userId], context.previousCart);
      }
      setIsAdded(false);
      toast({
        title: "Ошибка сети",
        description: "Проверьте интернет соединение и попробуйте снова",
        variant: "destructive",
      });
    },
    // Убираем onSettled с invalidateQueries - это вызывает конфликты
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ quantity }: { quantity: number }) => {
      const response = await fetch(`/api/cart/${cartItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (!response.ok) throw new Error("Failed to update cart item");
      return response.json();
    },
    onMutate: async ({ quantity }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/cart", userId] });

      const previousCart = queryClient.getQueryData(["/api/cart", userId]);

      queryClient.setQueryData(["/api/cart", userId], (old: any) => {
        if (!old) return [];
        return old.map((item: any) => 
          item.id === cartItem.id 
            ? { ...item, quantity }
            : item
        );
      });

      return { previousCart };
    },
    onSuccess: (data) => {
      // Синхронизируем с сервером только в случае успеха
      queryClient.setQueryData(["/api/cart", userId], (old: any) => {
        if (!old) return [];
        return old.map((item: any) => 
          item.id === cartItem.id 
            ? data
            : item
        );
      });
    },
    onError: (error, variables, context) => {
      console.error('Update quantity error:', error);
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
    mutationFn: async () => {
      const response = await fetch(`/api/cart/${cartItem.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to remove cart item");
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["/api/cart", userId] });

      const previousCart = queryClient.getQueryData(["/api/cart", userId]);

      queryClient.setQueryData(["/api/cart", userId], (old: any) => {
        if (!old) return [];
        return old.filter((item: any) => item.id !== cartItem.id);
      });

      return { previousCart };
    },
    onError: (error, variables, context) => {
      console.error('Remove item error:', error);
      if (context?.previousCart) {
        queryClient.setQueryData(["/api/cart", userId], context.previousCart);
      }
      toast({
        title: "Ошибка сети",
        description: "Проверьте интернет соединение и попробуйте снова",
        variant: "destructive",
      });
    },
    // Убираем onSettled полностью - оптимистичного обновления достаточно
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isProcessing || addToCartMutation.isPending) return;
    
    setIsProcessing(true);
    addToCartMutation.mutate(undefined, {
      onSettled: () => {
        setIsProcessing(false);
      }
    });
  };

  const handleIncreaseQuantity = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    if (currentQuantity === 0) {
      addToCartMutation.mutate(undefined, {
        onSettled: () => setIsProcessing(false)
      });
    } else {
      updateQuantityMutation.mutate({ quantity: currentQuantity + 1 }, {
        onSettled: () => setIsProcessing(false)
      });
    }
  };

  const handleDecreaseQuantity = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    if (currentQuantity === 1) {
      removeItemMutation.mutate(undefined, {
        onSettled: () => setIsProcessing(false)
      });
    } else {
      updateQuantityMutation.mutate({ quantity: currentQuantity - 1 }, {
        onSettled: () => setIsProcessing(false)
      });
    }
  };

  return (
    <Link href={`/product/${product.id}`}>
      <div className="bg-white dark:bg-card rounded-xl shadow-sm overflow-hidden card-hover cursor-pointer" data-testid={`card-product-${product.id}`}>
        {imageError || !product.imageUrl ? (
          <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <div className="text-gray-400 dark:text-gray-600 text-center">
              <div className="text-2xl mb-1">📦</div>
              <div className="text-xs">Изображение</div>
            </div>
          </div>
        ) : (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-32 object-cover"
            data-testid="img-product"
            onError={() => setImageError(true)}
          />
        )}
        <div className="p-3">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-1 line-clamp-2" data-testid="text-product-name">
            {product.name}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2" data-testid="text-product-weight">{product.weight}</p>
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-900 dark:text-gray-100" data-testid="text-product-price">
              {parseFloat(product.price).toFixed(0)} с.
            </span>

            {currentQuantity === 0 ? (
              // Show simple add button when item not in cart
              <button
                onClick={handleAddToCart}
                disabled={addToCartMutation.isPending || isProcessing}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  isAdded
                    ? "bg-electric-green"
                    : "bg-agent-purple hover:bg-agent-purple/90"
                } ${(addToCartMutation.isPending || isProcessing) ? "opacity-70 cursor-not-allowed" : ""}`}
                data-testid="button-add-to-cart"
              >
                {isAdded ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <Plus className="w-4 h-4 text-white" />
                )}
              </button>
            ) : (
              // Show quantity controls when item is in cart
              <div className="flex items-center space-x-1" data-testid={`quantity-controls-${product.id}`}>
                <button
                  onClick={handleDecreaseQuantity}
                  disabled={updateQuantityMutation.isPending || removeItemMutation.isPending || isProcessing}
                  className={`w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors ${
                    (updateQuantityMutation.isPending || removeItemMutation.isPending || isProcessing) ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  data-testid={`button-decrease-${product.id}`}
                >
                  <Minus className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                </button>

                <span 
                  className="w-8 text-center font-bold text-sm text-gray-900 dark:text-gray-100"
                  data-testid={`text-quantity-${product.id}`}
                >
                  {currentQuantity}
                </span>

                <button
                  onClick={handleIncreaseQuantity}
                  disabled={addToCartMutation.isPending || updateQuantityMutation.isPending || isProcessing}
                  className={`w-7 h-7 rounded-lg bg-agent-purple hover:bg-agent-purple/90 flex items-center justify-center transition-colors ${
                    (addToCartMutation.isPending || updateQuantityMutation.isPending || isProcessing) ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  data-testid={`button-increase-${product.id}`}
                >
                  <Plus className="w-3 h-3 text-white" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}