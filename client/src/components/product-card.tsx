import { Plus, Check } from "lucide-react";
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
  const [isAdded, setIsAdded] = useState(false);
  const userId = "demo-user"; // In real app, get from auth

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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCartMutation.mutate();
  };

  return (
    <Link href={`/product/${product.id}`}>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer" data-testid={`card-product-${product.id}`}>
        <img
          src={product.imageUrl || ""}
          alt={product.name}
          className="w-full h-32 object-cover"
          data-testid="img-product"
        />
        <div className="p-3">
          <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2" data-testid="text-product-name">
            {product.name}
          </h4>
          <p className="text-xs text-gray-500 mb-2" data-testid="text-product-weight">{product.weight}</p>
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-900" data-testid="text-product-price">
              {parseFloat(product.price).toFixed(0)} ₽
            </span>
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
          </div>
        </div>
      </div>
    </Link>
  );
}
