import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ArrowLeft, MapPin, CreditCard, Clock, CheckCircle, Plus, Minus, Trash2 } from "lucide-react";
import { type CartItem, type Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { usePromo } from "@/hooks/use-promo";
import { X } from "lucide-react";
import { getCurrentUserId } from "@/utils/user-session";

type CartItemWithProduct = CartItem & { product: Product };

const checkoutSchema = z.object({
  deliveryAddress: z.string().min(10, "Введите полный адрес доставки"),
  paymentMethod: z.enum(["card", "cash"], { required_error: "Выберите способ оплаты" }),
  comment: z.string().optional(),
  packerComment: z.string().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const [, setLocation] = useLocation();
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string>("");
  const [promoInput, setPromoInput] = useState("");
  const { toast } = useToast();
  const { appliedPromo, removePromoCode, calculateDiscount, applyPromoCode } = usePromo();
  const userId = getCurrentUserId();

  const { data: cartItems = [], isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart", userId],
  });

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      deliveryAddress: "ул. Пушкина, 25, кв. 10",
      paymentMethod: "card",
      comment: "",
      packerComment: "",
    },
  });

  // helper: безопасно приводим цену к числу
  const toNumber = (p?: number | string | null) => {
    if (typeof p === 'number') return p;
    if (p == null) return 0;
    const v = parseFloat(String(p).replace(',', '.'));
    return Number.isFinite(v) ? v : 0;
  };

  const calculateSubtotal = () => {
    return (cartItems ?? [])
      .filter((i) => i && i.product && Number.isFinite(i.quantity) && i.quantity > 0)
      .reduce((total, item) => total + toNumber(item?.product?.price) * item.quantity, 0);
  };

  const subtotal = calculateSubtotal();
  const promoDiscount = appliedPromo ? calculateDiscount(subtotal) : 0;
  const totalAfterPromo = subtotal - promoDiscount;
  const deliveryFee = 0; // Всегда бесплатная доставка
  const finalTotal = totalAfterPromo + deliveryFee;

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: CheckoutForm) => {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          // Убираем totalAmount - сервер пересчитает сумму сам для безопасности
          deliveryAddress: orderData.deliveryAddress,
          comment: orderData.comment,
          packerComment: orderData.packerComment,
          status: "pending",
          promoCode: appliedPromo?.code || null,
        }),
      });
      if (!response.ok) throw new Error("Failed to create order");
      return response.json();
    },
    onSuccess: (order) => {
      // Clear cart after successful order
      clearCartMutation.mutate();
      setOrderId(order.id);
      setIsOrderPlaced(true);
      toast({
        title: "Заказ оформлен!",
        description: `Заказ №${order.id.slice(-6)} принят в обработку`,
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось оформить заказ. Попробуйте еще раз.",
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
      queryClient.invalidateQueries({ queryKey: ["/api/cart", userId] });
    },
    onError: (error) => {
      console.error('Failed to clear cart after order:', error);
      // Show warning but don't block the user - order was still created
      toast({
        title: "Внимание",
        description: "Заказ оформлен, но корзина не очистилась. Обновите страницу.",
        variant: "destructive",
      });
    },
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
    onMutate: async ({ id, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/cart", userId] });
      const previousCart = queryClient.getQueryData(["/api/cart", userId]);

      queryClient.setQueryData(["/api/cart", userId], (old: any) => {
        if (!old) return [];
        return old.map((item: any) => 
          item.id === id ? { ...item, quantity } : item
        );
      });

      return { previousCart };
    },
    onSuccess: (data, { id }) => {
      // Обновляем конкретный элемент реальными данными, сохраняя product
      queryClient.setQueryData(["/api/cart", userId], (old: any) => {
        if (!old) return [];
        return old.map((item: any) => 
          item.id === id ? { ...data, product: item.product } : item
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
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/cart/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to remove cart item");
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["/api/cart", userId] });
      const previousCart = queryClient.getQueryData(["/api/cart", userId]);

      queryClient.setQueryData(["/api/cart", userId], (old: any) => {
        if (!old) return [];
        return old.filter((item: any) => item.id !== id);
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
  });

  const handleQuantityChange = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItemMutation.mutate(id);
    } else {
      updateQuantityMutation.mutate({ id, quantity });
    }
  };

  const onSubmit = (data: CheckoutForm) => {
    createOrderMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="pb-20">
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="flex items-center p-4">
            <Link href="/">
              <button className="mr-3 p-2 -ml-2">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Оформление заказа</h1>
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

  if (cartItems.length === 0) {
    return (
      <div className="pb-20">
        <header className="bg-[#5B21B6] shadow-sm sticky top-0 z-40">
          <div className="flex items-center p-4">
            <Link href="/">
              <button className="mr-3 p-2 -ml-2">
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
            </Link>
            <h1 className="text-xl font-bold text-white">Оформление заказа</h1>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Корзина пуста</h3>
          <p className="text-gray-500 text-center mb-6">
            Добавьте товары в корзину для оформления заказа
          </p>
          <Link href="/catalog">
            <Button className="hover:bg-agent-purple/90 bg-[#5B21B6]">
              Перейти в каталог
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isOrderPlaced) {
    return (
      <div className="pb-20">
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="flex items-center p-4">
            <h1 className="text-xl font-bold text-gray-900">Заказ оформлен</h1>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
          <div className="w-20 h-20 bg-electric-green/10 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-electric-green" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Заказ принят!</h3>
          <p className="text-gray-600 text-center mb-2">
            Заказ №{orderId.slice(-6)} успешно оформлен
          </p>
          <p className="text-sm text-gray-500 text-center mb-6">
            Мы доставим ваш заказ в течение 10-15 минут
          </p>
          
          <div className="bg-white rounded-xl p-4 shadow-sm w-full max-w-sm mb-6">
            <div className="flex items-center justify-center space-x-2 text-electric-green">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">Готовим заказ</span>
            </div>
            <div className="mt-3 bg-electric-green/10 rounded-full h-2">
              <div className="bg-electric-green h-2 rounded-full w-1/4 animate-pulse"></div>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              Ожидаемое время доставки: 12 минут
            </p>
          </div>

          <div className="space-y-3 w-full max-w-sm">
            <Button variant="outline" className="w-full">
              Отследить заказ
            </Button>
            <Link href="/">
              <Button className="w-full bg-agent-purple hover:bg-agent-purple/90">
                На главную
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="pb-20">
      {/* Header */}
      <header className="bg-[#5B21B6] shadow-sm sticky top-0 z-40">
        <div className="flex items-center p-4">
          <Link href="/">
            <button className="mr-3 p-2 -ml-2">
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
          </Link>
          <h1 className="text-xl font-bold text-white">Оформление заказа</h1>
        </div>
      </header>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Delivery Time */}
          <section className="p-4 bg-electric-green/10">
            <div className="flex items-center justify-center space-x-2 text-electric-green">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">Доставка за 10-15 минут</span>
            </div>
          </section>

          {/* Order Items */}
          <section className="p-4">
            <h3 className="font-bold text-gray-900 mb-3">Ваш заказ</h3>
            <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-3">
                  {!item?.product?.imageUrl ? (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <div className="text-gray-400 dark:text-gray-600 text-center">
                        <div className="text-lg">📦</div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={item?.product?.imageUrl}
                      alt={item?.product?.name ?? 'Товар'}
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
                    <h4 className="font-medium text-gray-900 text-sm truncate">
                      {item?.product?.name ?? 'Товар'}
                    </h4>
                    <p className="text-xs text-gray-500">{item?.product?.weight ?? ''}</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {toNumber(item?.product?.price).toFixed(0)} с.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                      disabled={updateQuantityMutation.isPending}
                    >
                      <Minus className="w-3 h-3 text-gray-600" />
                    </button>
                    <span className="w-8 text-center font-medium text-sm">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-agent-purple flex items-center justify-center hover:bg-agent-purple/90 transition-colors"
                      disabled={updateQuantityMutation.isPending}
                    >
                      <Plus className="w-3 h-3 text-white" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItemMutation.mutate(item.id)}
                      className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center hover:bg-red-200 transition-colors ml-2"
                      disabled={removeItemMutation.isPending}
                    >
                      <Trash2 className="w-3 h-3 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Delivery Address */}
          <section className="p-4">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-electric-green" />
              Адрес доставки
            </h3>
            <FormField
              control={form.control}
              name="deliveryAddress"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Введите полный адрес доставки"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* Payment Method */}
          <section className="p-4">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-agent-purple" />
              Способ оплаты
            </h3>
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-2 bg-white p-3 rounded-lg shadow-sm">
                        <RadioGroupItem value="card" id="card" />
                        <label htmlFor="card" className="flex-1 cursor-pointer">
                          <div className="font-medium">Картой онлайн</div>
                          <div className="text-sm text-gray-500">Visa, MasterCard, МИР</div>
                        </label>
                      </div>
                      <div className="flex items-center space-x-2 bg-white p-3 rounded-lg shadow-sm">
                        <RadioGroupItem value="cash" id="cash" />
                        <label htmlFor="cash" className="flex-1 cursor-pointer">
                          <div className="font-medium">Наличными курьеру</div>
                          <div className="text-sm text-gray-500">Оплата при получении</div>
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* Promo Code */}
          <section className="p-4">
            <h3 className="font-bold text-gray-900 mb-3">Промокод</h3>
            {appliedPromo ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-700 font-medium">Промокод {appliedPromo.code} применен</span>
                  </div>
                  <button
                    onClick={removePromoCode}
                    className="text-gray-400 hover:text-red-500 p-1"
                    data-testid="button-remove-promo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-green-600 mt-1">Скидка {appliedPromo.discount}% на весь заказ</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Введите промокод"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    className="flex-1 text-center font-semibold"
                    data-testid="input-promo-code"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (applyPromoCode(promoInput)) {
                        setPromoInput("");
                        toast({
                          title: "Промокод применен",
                          description: `Скидка по промокоду ${promoInput} активирована`,
                        });
                      } else {
                        toast({
                          title: "Неверный промокод",
                          description: "Проверьте правильность ввода кода",
                          variant: "destructive",
                        });
                      }
                    }}
                    disabled={!promoInput.trim()}
                    className="bg-electric-green hover:bg-electric-green/90 text-white"
                    data-testid="button-apply-promo"
                  >
                    Применить
                  </Button>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <h4 className="font-medium text-gray-900 text-sm mb-2">Доступные промокоды:</h4>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>• ПЕРВЫЙ - Скидка 20% на первый заказ</p>
                    <p>• ДРУЗЬЯМ - Скидка 15% для друзей</p>
                    <p>• ЛЕТОМ - Летняя скидка 10%</p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Comments */}
          <section className="p-4 space-y-4">
            <h3 className="font-bold text-gray-900 mb-3">Комментарии к заказу</h3>
            
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <label className="text-sm font-medium text-gray-700">Информация для курьера</label>
                  <FormControl>
                    <Input
                      placeholder="Дополнительная информация для курьера (домофон, этаж, квартира)"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="packerComment"
              render={({ field }) => (
                <FormItem>
                  <label className="text-sm font-medium text-gray-700">Информация для сборщика</label>
                  <FormControl>
                    <Input
                      placeholder="Пожелания по сборке заказа (спелость фруктов, замены и т.д.)"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </section>

          {/* Order Total */}
          <section className="p-4">
            <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
              <h3 className="font-bold text-gray-900 mb-3">К оплате</h3>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Товары ({cartItems.length})</span>
                <span className="font-medium">{subtotal.toFixed(0)} с.</span>
              </div>
              
              {appliedPromo && (
                <div className="flex justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">Промокод {appliedPromo.code} (-{appliedPromo.discount}%)</span>
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
              
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Итого</span>
                  <span className="text-xl font-bold text-gray-900">
                    {finalTotal.toFixed(0)} с.
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Submit Button */}
          <section className="p-4">
            <Button
              type="submit"
              disabled={createOrderMutation.isPending}
              className="w-full bg-agent-purple hover:bg-agent-purple/90 text-white py-3 text-lg font-semibold"
            >
              {createOrderMutation.isPending ? "Оформляем заказ..." : "Подтвердить заказ"}
            </Button>
          </section>
        </form>
      </Form>
    </main>
  );
}