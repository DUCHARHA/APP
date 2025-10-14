import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { ArrowLeft, Clock, CheckCircle, Package, Truck, MapPin, CreditCard, MessageCircle, Tag, Copy } from "lucide-react";
import { type Order } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUserId } from "@/utils/user-session";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const userId = getCurrentUserId();
  const [refreshInterval, setRefreshInterval] = useState<number | undefined>(undefined);

  const { data: order, isLoading, refetch } = useQuery<Order>({
    queryKey: [`/api/orders/detail/${orderId}`],
    queryFn: async () => {
      const response = await fetch(`/api/orders/detail/${orderId}`);
      if (!response.ok) throw new Error("Заказ не найден");
      return response.json();
    },
    refetchInterval: refreshInterval,
    enabled: !!orderId,
  });

  // Автообновление статуса для активных заказов
  useEffect(() => {
    if (order && (order.status === "pending" || order.status === "preparing" || order.status === "delivering")) {
      setRefreshInterval(10000); // Обновляем каждые 10 секунд
    } else {
      setRefreshInterval(undefined); // Прекращаем обновления
    }

    return () => setRefreshInterval(undefined);
  }, [order?.status]);

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("Failed to cancel order");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${userId}`] });
      refetch();
      toast({
        title: "Заказ отменен",
        description: "Ваш заказ успешно отменен",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось отменить заказ",
        variant: "destructive",
      });
    },
  });

  const repeatOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/orders/${orderId}/repeat`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to repeat order");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Товары добавлены в корзину",
        description: "Товары из заказа добавлены в корзину",
      });
      setLocation("/checkout");
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось повторить заказ",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-orange-100 text-orange-700";
      case "preparing": return "bg-blue-100 text-blue-700";
      case "delivering": return "bg-purple-100 text-purple-700";
      case "delivered": return "bg-green-100 text-green-700";
      case "cancelled": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return Clock;
      case "preparing": return Package;
      case "delivering": return Truck;
      case "delivered": return CheckCircle;
      case "cancelled": return Clock;
      default: return Clock;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "В обработке";
      case "preparing": return "Готовится";
      case "delivering": return "В доставке";
      case "delivered": return "Доставлен";
      case "cancelled": return "Отменен";
      default: return status;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case "pending": return "Ваш заказ принят и ожидает обработки";
      case "preparing": return "Заказ собирается на складе";
      case "delivering": return "Курьер в пути к вам";
      case "delivered": return "Заказ успешно доставлен";
      case "cancelled": return "Заказ был отменен";
      default: return "";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyOrderId = () => {
    navigator.clipboard.writeText(order?.id || "");
    toast({
      title: "ID заказа скопирован",
      description: "Номер заказа скопирован в буфер обмена",
    });
  };

  if (isLoading) {
    return (
      <div className="pb-20">
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="flex items-center p-4">
            <Link href="/orders">
              <button className="mr-3 p-2 -ml-2">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Детали заказа</h1>
          </div>
        </header>
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 h-20 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="pb-20">
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="flex items-center p-4">
            <Link href="/orders">
              <button className="mr-3 p-2 -ml-2">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Заказ не найден</h1>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Заказ не найден</h3>
          <p className="text-gray-500 text-center mb-6">
            Возможно, заказ был удален или неверно указан номер
          </p>
          <Link href="/orders">
            <Button>
              Вернуться к заказам
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(order.status);

  return (
    <main className="pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="flex items-center p-4">
          <Link href="/orders">
            <button className="mr-3 p-2 -ml-2" data-testid="button-back">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Заказ №{order.id.slice(-6)}</h1>
            <p className="text-sm text-gray-500">
              {order.createdAt ? formatDate(order.createdAt) : "Недавно"}
            </p>
          </div>
        </div>
      </header>

      {/* Status Section */}
      <section className="p-4">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-center mb-4">
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              <StatusIcon className="w-4 h-4" />
              <span>{getStatusText(order.status)}</span>
            </div>
          </div>
          <p className="text-center text-gray-600 mb-4">
            {getStatusDescription(order.status)}
          </p>
          
          {/* Status Progress */}
          <div className="flex justify-between items-center text-xs text-gray-500">
            <div className={`flex flex-col items-center ${order.status !== "cancelled" ? "text-green-600" : ""}`}>
              <CheckCircle className="w-4 h-4 mb-1" />
              <span>Принят</span>
            </div>
            <div className={`flex flex-col items-center ${["preparing", "delivering", "delivered"].includes(order.status) ? "text-green-600" : ""}`}>
              <Package className="w-4 h-4 mb-1" />
              <span>Готовится</span>
            </div>
            <div className={`flex flex-col items-center ${["delivering", "delivered"].includes(order.status) ? "text-green-600" : ""}`}>
              <Truck className="w-4 h-4 mb-1" />
              <span>В пути</span>
            </div>
            <div className={`flex flex-col items-center ${order.status === "delivered" ? "text-green-600" : ""}`}>
              <CheckCircle className="w-4 h-4 mb-1" />
              <span>Доставлен</span>
            </div>
          </div>
        </div>
      </section>

      {/* Order Info */}
      <section className="p-4 space-y-4">
        {/* Order ID */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Номер заказа</h3>
              <p className="text-sm text-gray-600 font-mono">#{order.id.slice(-6)}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyOrderId}
              data-testid="button-copy-order-id"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Адрес доставки</h3>
              <p className="text-gray-600">{order.deliveryAddress}</p>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-start space-x-3">
            <CreditCard className="w-5 h-5 text-purple-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Сумма заказа</h3>
              <p className="text-2xl font-bold text-gray-900 mb-2">
                {parseFloat(order.totalAmount).toFixed(0)} с.
              </p>
              {order.promoCode && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <Tag className="w-4 h-4" />
                  <span>Промокод "{order.promoCode}" применен</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comments */}
        {(order.comment || order.packerComment) && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-start space-x-3">
              <MessageCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Комментарии</h3>
                {order.comment && (
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-700">Ваш комментарий:</p>
                    <p className="text-gray-600">{order.comment}</p>
                  </div>
                )}
                {order.packerComment && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">От сборщика:</p>
                    <p className="text-gray-600">{order.packerComment}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Actions */}
      <section className="p-4">
        <div className="space-y-3">
          {/* Live tracking for active orders */}
          {order.status === "delivering" && (
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <Truck className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-900">Курьер в пути!</h3>
              <p className="text-sm text-purple-700 mb-3">
                Ожидаемое время прибытия: 5-8 минут
              </p>
              <div className="animate-pulse">
                <div className="bg-purple-200 rounded-full h-2 mb-2">
                  <div className="bg-purple-600 h-2 rounded-full w-3/4"></div>
                </div>
                <p className="text-xs text-purple-600">Отслеживание в реальном времени</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2">
            {order.status === "delivered" && (
              <Button 
                onClick={() => repeatOrderMutation.mutate(order.id)}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={repeatOrderMutation.isPending}
                data-testid="button-repeat-order"
              >
                Повторить заказ
              </Button>
            )}

            {(order.status === "pending" || order.status === "preparing") && (
              <Button 
                onClick={() => cancelOrderMutation.mutate(order.id)}
                variant="destructive"
                className="w-full"
                disabled={cancelOrderMutation.isPending}
                data-testid="button-cancel-order"
              >
                Отменить заказ
              </Button>
            )}

            <Link href="/orders">
              <Button variant="outline" className="w-full" data-testid="button-back-to-orders">
                Вернуться к заказам
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}