import { Plus, Minus, Check } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { type Product } from "@shared/schema";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { toast } = useToast();
  const { cartItems } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const userId = "demo-user"; // In real app, get from auth

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 1000);
      toast({
        title: "Товар добавлен",
        description: `${product.name} добавлен в корзину`,
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить товар в корзину",
        variant: "destructive",
      });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ quantity }: { quantity: number }) => {
      if (!cartItem) throw new Error("Item not in cart");
      const response = await fetch(`/api/cart/${cartItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (!response.ok) throw new Error("Failed to update cart item");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить количество товара",
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async () => {
      if (!cartItem) throw new Error("Item not in cart");
      const response = await fetch(`/api/cart/${cartItem.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to remove cart item");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Товар удален",
        description: "Товар удален из корзины",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить товар из корзины",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCartMutation.mutate();
  };

  const handleIncreaseQuantity = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentQuantity === 0) {
      addToCartMutation.mutate();
    } else {
      updateQuantityMutation.mutate({ quantity: currentQuantity + 1 });
    }
  };

  const handleDecreaseQuantity = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentQuantity === 1) {
      removeItemMutation.mutate();
    } else {
      updateQuantityMutation.mutate({ quantity: currentQuantity - 1 });
    }
  };

  return (
    <Link href={`/product/${product.id}`}>
      <div className="bg-white dark:bg-card rounded-xl shadow-sm overflow-hidden card-hover cursor-pointer" data-testid={`card-product-${product.id}`}>
        <img
          src={product.imageUrl || ""}
          alt={product.name}
          className="w-full h-32 object-cover"
          data-testid="img-product"
        />
        <div className="p-3">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-1 line-clamp-2" data-testid="text-product-name">
            {product.name}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2" data-testid="text-product-weight">{product.weight}</p>
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-900 dark:text-gray-100" data-testid="text-product-price">
              {parseFloat(product.price).toFixed(0)} ₽
            </span>
            
            {currentQuantity === 0 ? (
              // Show simple add button when item not in cart
              <button
                onClick={handleAddToCart}
                disabled={addToCartMutation.isPending}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  isAdded
                    ? "bg-electric-green"
                    : "bg-agent-purple hover:bg-agent-purple/90"
                }`}
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
                  disabled={updateQuantityMutation.isPending || removeItemMutation.isPending}
                  className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
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
                  disabled={addToCartMutation.isPending || updateQuantityMutation.isPending}
                  className="w-7 h-7 rounded-lg bg-agent-purple hover:bg-agent-purple/90 flex items-center justify-center transition-colors"
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
