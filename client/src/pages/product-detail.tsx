import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Plus, Minus, ShoppingCart, Heart, Share2, Star } from "lucide-react";
import { type Product } from "@shared/schema";
import { useCart } from "@/hooks/use-cart";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { getCurrentUserId } from "@/utils/user-session";

export default function ProductDetail() {
  const { productId } = useParams();
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();
  const userId = getCurrentUserId();

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/products", productId],
    queryFn: () => fetch(`/api/products/${productId}`).then(res => res.json()),
  });

  const addToCartMutation = useMutation({
    mutationFn: () => {
      const requestData = {
        userId,
        productId,
        quantity,
      };
      console.log("🛒 Product Detail: Adding to cart:", {
        productFromQuery: product,
        requestData,
        productIdFromUrl: productId,
        hasProductId: !!productId,
      });
      
      return apiRequest("/api/cart", "POST", requestData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить товар в корзину",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-agent-purple mx-auto mb-4"></div>
          <p className="text-gray-500">Загрузка товара...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Товар не найден</p>
          <Link href="/catalog">
            <Button variant="outline">Вернуться в каталог</Button>
          </Link>
        </div>
      </div>
    );
  }

  const nutritionItems = [
    { label: "Калории", value: product.calories, unit: "ккал" },
    { label: "Белки", value: product.proteins, unit: "г" },
    { label: "Жиры", value: product.fats, unit: "г" },
    { label: "Углеводы", value: product.carbs, unit: "г" },
    { label: "Клетчатка", value: product.fiber, unit: "г" },
    { label: "Сахар", value: product.sugar, unit: "г" },
  ].filter(item => item.value);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, quantity + delta);
    setQuantity(newQuantity);
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <Link href="/catalog">
            <button className="p-2 -ml-2" data-testid="button-back">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
          </Link>
          <h1 className="text-lg font-semibold text-gray-900 flex-1 text-center px-4 truncate">
            {product.name}
          </h1>
          <div className="flex space-x-2">
            <button className="p-2" data-testid="button-favorite">
              <Heart className="w-5 h-5 text-gray-400" />
            </button>
            <button className="p-2" data-testid="button-share">
              <Share2 className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Product Image */}
      <section className="bg-white">
        <div className="aspect-square relative overflow-hidden">
          <img
            src={product.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"}
            alt={product.name}
            className="w-full h-full object-cover"
            data-testid="img-product"
          />
          {product.isPopular && (
            <Badge className="absolute top-4 left-4 bg-bright-orange text-white">
              <Star className="w-3 h-3 mr-1" />
              Популярное
            </Badge>
          )}
        </div>
      </section>

      {/* Product Info */}
      <section className="bg-white p-6 mt-2">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-product-name">
            {product.name}
          </h2>
          {product.weight && (
            <p className="text-gray-500 text-sm" data-testid="text-product-weight">
              {product.weight}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="text-3xl font-bold text-gray-900" data-testid="text-product-price">
            {product.price} с.
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleQuantityChange(-1)}
                className="w-8 h-8 flex items-center justify-center rounded-md bg-white shadow-sm"
                data-testid="button-decrease-quantity"
              >
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
              <span className="font-medium text-lg px-2" data-testid="text-quantity">
                {quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(1)}
                className="w-8 h-8 flex items-center justify-center rounded-md bg-white shadow-sm"
                data-testid="button-increase-quantity"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {product.description && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Описание</h3>
            <p className="text-gray-600 leading-relaxed" data-testid="text-product-description">
              {product.description}
            </p>
          </div>
        )}
      </section>

      {/* Detailed Information */}
      <div className="space-y-2 mt-2">
        {/* Composition */}
        {product.ingredients && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Состав</h3>
              <p className="text-gray-600 leading-relaxed" data-testid="text-product-ingredients">
                {product.ingredients}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Nutrition Facts */}
        {nutritionItems.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Пищевая ценность на 100г
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {nutritionItems.map((item) => (
                  <div key={item.label} className="text-center">
                    <div className="text-xl font-bold text-gray-900" data-testid={`text-nutrition-${item.label.toLowerCase()}`}>
                      {item.value}{item.unit}
                    </div>
                    <div className="text-sm text-gray-500">{item.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Product Details */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Информация о товаре</h3>
            <div className="space-y-3">
              {product.manufacturer && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Производитель</span>
                  <span className="font-medium" data-testid="text-product-manufacturer">
                    {product.manufacturer}
                  </span>
                </div>
              )}
              {product.countryOfOrigin && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Страна происхождения</span>
                  <span className="font-medium" data-testid="text-product-country">
                    {product.countryOfOrigin}
                  </span>
                </div>
              )}
              {product.shelfLife && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Срок годности</span>
                  <span className="font-medium" data-testid="text-product-shelf-life">
                    {product.shelfLife}
                  </span>
                </div>
              )}
              {product.storageConditions && (
                <>
                  <Separator />
                  <div>
                    <span className="text-gray-500 text-sm">Условия хранения:</span>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed" data-testid="text-product-storage">
                      {product.storageConditions}
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Add to Cart Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-30">
        <div className="max-w-md mx-auto">
          <Button
            onClick={() => addToCartMutation.mutate()}
            disabled={addToCartMutation.isPending}
            className="w-full bg-agent-purple hover:bg-agent-purple/90 text-white h-12 text-lg font-semibold"
            data-testid="button-add-to-cart"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            {addToCartMutation.isPending
              ? "Добавляем..."
              : `Добавить в корзину • ${(parseFloat(product.price) * quantity).toFixed(0)} с.`
            }
          </Button>
        </div>
      </div>
    </main>
  );
}