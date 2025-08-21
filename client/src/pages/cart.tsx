import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { type CartItem, type Product } from "@shared/schema";
import { useCart } from "@/hooks/use-cart";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { usePromo } from "@/hooks/use-promo";
import { X } from "lucide-react";

type CartItemWithProduct = CartItem & { product: Product };

export default function Cart() {
  const { toast } = useToast();
  const { totalItems, totalPrice } = useCart();
  const { appliedPromo, removePromoCode, calculateDiscount, calculateTotal } = usePromo();
  const userId = "demo-user"; // In real app, get from auth

  const { data: cartItems = [], isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart", userId],
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const response = await fetch(`/api/cart/${id}`, {
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
    onError: (error) => {
      console.error('Update quantity error:', error);
      toast({
        title: "Ошибка сети",
        description: "Проверьте интернет соединение и попробуйте снова",
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/cart/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to remove cart item");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error) => {
      console.error('Remove item error:', error);
      toast({
        title: "Ошибка сети",
        description: "Проверьте интернет соединение и попробуйте снова",
        variant: "destructive",
      });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/cart/user/${userId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to clear cart");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const handleQuantityChange = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItemMutation.mutate(id);
    } else {
      updateQuantityMutation.mutate({ id, quantity });
    }
  };

  const calculateCartTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (parseFloat(item.product.price) * item.quantity);
    }, 0);
  };

  const subtotal = calculateCartTotal();
  const promoDiscount = appliedPromo ? calculateDiscount(subtotal) : 0;
  const totalAfterPromo = subtotal - promoDiscount;
  const deliveryFee = 0; // Всегда бесплатная доставка
  const finalTotal = totalAfterPromo + deliveryFee;

  if (isLoading) {
    return (
      <div className="pb-20">
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="flex items-center p-4 bg-[#5B21B6]">
            <Link href="/">
              <button className="mr-3 p-2 -ml-2">
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
            </Link>
            <h1 className="text-xl font-bold text-white">Корзина</h1>
          </div>
        </header>
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 h-20 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between p-4 bg-[#5B21B6]">
          <div className="flex items-center">
            <Link href="/catalog">
              <button className="mr-3 p-2 -ml-2">
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Корзина</h1>
              <p className="text-sm text-gray-200">{cartItems.length} товаров</p>
            </div>
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={() => clearCartMutation.mutate()}
              className="text-white p-2"
              disabled={clearCartMutation.isPending}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {cartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Корзина пуста
          </h3>
          <p className="text-gray-500 text-center mb-6">
            Добавьте товары в корзину, чтобы оформить заказ
          </p>
          <Link href="/catalog">
            <Button className="bg-agent-purple hover:bg-agent-purple/90">
              Перейти в каталог
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Cart Items */}
          <section className="p-4 space-y-3">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center space-x-3">
                  {!item.product.imageUrl ? (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <div className="text-gray-400 dark:text-gray-600 text-center">
                        <div className="text-lg">📦</div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-16 h-16 rounded-lg object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const placeholder = target.nextElementSibling as HTMLDivElement;
                        if (placeholder) placeholder.style.display = 'flex';
                      }}
                    />
                  )}
                  <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 items-center justify-center" style={{display: 'none'}}>
                    <div className="text-gray-400 dark:text-gray-600 text-center">
                      <div className="text-lg">📦</div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-sm text-gray-500">{item.product.weight}</p>
                    <p className="font-bold text-gray-900">
                      {parseFloat(item.product.price).toFixed(0)} с.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"
                      disabled={updateQuantityMutation.isPending}
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-lg bg-agent-purple flex items-center justify-center"
                      disabled={updateQuantityMutation.isPending}
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Order Summary */}
          <section className="p-4">
            <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
              <h3 className="font-bold text-gray-900 mb-3">Итого</h3>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Товары ({cartItems.length})</span>
                <span className="font-medium">{subtotal.toFixed(0)} с.</span>
              </div>
              
              {appliedPromo && (
                <div className="flex justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">Промокод {appliedPromo.code}</span>
                    <button
                      onClick={removePromoCode}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="font-medium text-green-600">-{promoDiscount.toFixed(0)} с.</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Доставка</span>
                <span className="font-medium">
                  Бесплатно
                </span>
              </div>
              
              {totalAfterPromo < 1000 && (
                <div className="bg-orange-50 p-3 rounded-lg">
                  <p className="text-sm text-orange-700">
                    Добавьте товаров на {(1000 - totalAfterPromo).toFixed(0)} с. для бесплатной доставки
                  </p>
                </div>
              )}
              
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">К оплате</span>
                  <span className="text-xl font-bold text-gray-900">
                    {finalTotal.toFixed(0)} с.
                  </span>
                </div>
              </div>
              
              <Link href="/checkout">
                <Button className="w-full bg-agent-purple hover:bg-agent-purple/90 text-white py-3 text-lg font-semibold">
                  Оформить заказ
                </Button>
              </Link>
              
              <div className="text-center">
                <div className="inline-flex items-center text-sm text-gray-600 bg-electric-green/10 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-electric-green rounded-full mr-2 animate-pulse"></div>
                  Доставка за 10-15 минут
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
