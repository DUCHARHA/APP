import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Clock, 
  Package, 
  Truck, 
  Check, 
  AlertCircle, 
  Filter,
  LogOut,
  RefreshCw,
  Eye
} from "lucide-react";
import { type Order } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  processing: "bg-blue-100 text-blue-800 border-blue-200", 
  delivering: "bg-purple-100 text-purple-800 border-purple-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const statusLabels = {
  pending: "Новый заказ",
  processing: "В обработке", 
  delivering: "Доставляется",
  completed: "Выполнен",
  cancelled: "Отменен",
};

const statusIcons = {
  pending: AlertCircle,
  processing: Package,
  delivering: Truck,
  completed: Check,
  cancelled: AlertCircle,
};

export default function AdminOrders() {
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    // Проверка авторизации
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      setLocation("/admin/login");
      return;
    }
  }, [setLocation]);

  const { data: orders = [], isLoading, refetch } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("/api/admin/orders", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) {
        if (res.status === 401) {
          setLocation("/admin/login");
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch orders");
      }
      return res.json();
    },
    refetchInterval: 30000, // Обновление каждые 30 секунд
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        if (response.status === 401) {
          setLocation("/admin/login");
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to update order");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Статус обновлен",
        description: "Статус заказа успешно изменен",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус заказа",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setLocation("/admin/login");
  };

  const filteredOrders = statusFilter === "all" 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    processing: orders.filter(o => o.status === "processing").length,
    delivering: orders.filter(o => o.status === "delivering").length,
    completed: orders.filter(o => o.status === "completed").length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-agent-purple mx-auto mb-4"></div>
          <p className="text-gray-500">Загрузка заказов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-agent-purple p-2 rounded-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Управление заказами ДУЧАРХА
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => refetch()}
                size="sm"
                data-testid="button-refresh"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Обновить
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                size="sm"
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-gray-900">{orderStats.total}</div>
              <div className="text-sm text-gray-500">Всего заказов</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-yellow-600">{orderStats.pending}</div>
              <div className="text-sm text-gray-500">Новые</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">{orderStats.processing}</div>
              <div className="text-sm text-gray-500">В обработке</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-purple-600">{orderStats.delivering}</div>
              <div className="text-sm text-gray-500">Доставляются</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">{orderStats.completed}</div>
              <div className="text-sm text-gray-500">Выполнены</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="font-medium text-gray-700">Фильтр по статусу:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48" data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все заказы</SelectItem>
                  <SelectItem value="pending">Новые заказы</SelectItem>
                  <SelectItem value="processing">В обработке</SelectItem>
                  <SelectItem value="delivering">Доставляются</SelectItem>
                  <SelectItem value="completed">Выполнены</SelectItem>
                  <SelectItem value="cancelled">Отменены</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-gray-500">
              Показано: {filteredOrders.length} из {orders.length} заказов
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {statusFilter === "all" ? "Нет заказов" : "Нет заказов с выбранным статусом"}
                </h3>
                <p className="text-gray-500">
                  {statusFilter === "all" 
                    ? "Заказы будут появляться здесь по мере их поступления" 
                    : "Попробуйте изменить фильтр"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders
              .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
              .map((order) => {
                const StatusIcon = statusIcons[order.status as keyof typeof statusIcons];
                
                return (
                  <Card key={order.id} data-testid={`order-card-${order.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <Badge className={`${statusColors[order.status as keyof typeof statusColors]} border`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusLabels[order.status as keyof typeof statusLabels]}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              Заказ #{order.id.slice(-8)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(order.createdAt!).toLocaleString("ru-RU")}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">Адрес доставки</h4>
                              <p className="text-gray-600 text-sm" data-testid={`text-address-${order.id}`}>
                                {order.deliveryAddress}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">Сумма заказа</h4>
                              <p className="text-xl font-bold text-gray-900" data-testid={`text-amount-${order.id}`}>
                                {parseFloat(order.totalAmount).toFixed(2)} ₽
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2 ml-4">
                          <Select
                            value={order.status}
                            onValueChange={(newStatus) => 
                              updateOrderMutation.mutate({ 
                                orderId: order.id, 
                                status: newStatus 
                              })
                            }
                            disabled={updateOrderMutation.isPending}
                          >
                            <SelectTrigger className="w-36" data-testid={`select-status-${order.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Новый заказ</SelectItem>
                              <SelectItem value="processing">В обработке</SelectItem>
                              <SelectItem value="delivering">Доставляется</SelectItem>
                              <SelectItem value="completed">Выполнен</SelectItem>
                              <SelectItem value="cancelled">Отменен</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // Пока просто показываем ID заказа
                              toast({
                                title: "Детали заказа",
                                description: `ID: ${order.id}`,
                              });
                            }}
                            data-testid={`button-details-${order.id}`}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Детали
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}