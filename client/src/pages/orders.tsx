import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Clock, CheckCircle, Package, Truck } from "lucide-react";
import { type Order } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Orders() {
  const userId = "demo-user"; // In real app, get from auth
  const { toast } = useToast();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders", userId],
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("Failed to cancel order");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
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
      window.location.href = "/cart";
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось повторить заказ",
        variant: "destructive",
      });
    },
  });

  const cancelOrder = (orderId: string) => {
    if (confirm("Вы уверены, что хотите отменить заказ?")) {
      cancelOrderMutation.mutate(orderId);
    }
  };

  const repeatOrder = (orderId: string) => {
    repeatOrderMutation.mutate(orderId);
  };

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete order");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Заказ удален",
        description: "Заказ успешно удален из истории",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить заказ",
        variant: "destructive",
      });
    },
  });

  const deleteOrder = (orderId: string) => {
    if (confirm("Вы уверены, что хотите удалить заказ из истории?")) {
      deleteOrderMutation.mutate(orderId);
    }
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="pb-20">
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="flex items-center p-4">
            <Link href="/profile">
              <button className="mr-3 p-2 -ml-2">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">История заказов</h1>
          </div>
        </header>
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
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
        <div className="flex items-center p-4">
          <Link href="/profile">
            <button className="mr-3 p-2 -ml-2">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">История заказов</h1>
            <p className="text-sm text-gray-500">{orders.length} заказов</p>
          </div>
        </div>
      </header>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Нет заказов
          </h3>
          <p className="text-gray-500 text-center mb-6">
            Вы еще не делали заказов в ДУЧАРКА
          </p>
          <Link href="/catalog">
            <button className="bg-agent-purple text-white px-6 py-3 rounded-lg font-semibold">
              Перейти в каталог
            </button>
          </Link>
        </div>
      ) : (
        <section className="p-4 space-y-4">
          {orders.map((order) => {
            const StatusIcon = getStatusIcon(order.status);
            return (
              <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Заказ №{order.id.slice(-6)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {order.createdAt ? formatDate(order.createdAt) : "Недавно"}
                    </p>
                  </div>
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    <StatusIcon className="w-3 h-3" />
                    <span>{getStatusText(order.status)}</span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-1">Адрес доставки:</p>
                  <p className="text-sm text-gray-900">{order.deliveryAddress}</p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">
                    {parseFloat(order.totalAmount).toFixed(0)} с.
                  </span>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => window.location.href = `/order/${order.id}`}
                      className="text-gray-500 text-sm font-medium hover:text-gray-700"
                    >
                      Подробнее
                    </button>
                    {order.status === "delivered" && (
                      <>
                        <button 
                          onClick={() => repeatOrder(order.id)}
                          className="text-agent-purple text-sm font-medium hover:text-agent-purple/80"
                        >
                          Повторить
                        </button>
                        <button 
                          onClick={() => deleteOrder(order.id)}
                          className="text-red-500 text-lg font-medium hover:text-red-600"
                          title="Удалить заказ"
                        >
                          ×
                        </button>
                      </>
                    )}
                    {order.status === "cancelled" && (
                      <button 
                        onClick={() => deleteOrder(order.id)}
                        className="text-red-500 text-lg font-medium hover:text-red-600"
                        title="Удалить заказ"
                      >
                        ×
                      </button>
                    )}
                    {(order.status === "pending" || order.status === "preparing") && (
                      <button 
                        onClick={() => cancelOrder(order.id)}
                        className="text-red-500 text-sm font-medium hover:text-red-600"
                      >
                        Отменить
                      </button>
                    )}
                  </div>
                </div>

                {order.status === "delivering" && (
                  <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center text-purple-700 mb-2">
                      <Truck className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">Курьер в пути</span>
                    </div>
                    <p className="text-xs text-purple-600">
                      Ожидаемое время прибытия: 5-8 минут
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}