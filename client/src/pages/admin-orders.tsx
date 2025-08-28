import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  ArrowLeft,
  Clock, 
  Package, 
  Truck, 
  Check, 
  AlertCircle, 
  Filter,
  Search,
  RefreshCw,
  Eye,
  MoreHorizontal,
  Calendar,
  MapPin,
  DollarSign,
  User,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  PlayCircle,
  PauseCircle,
  Zap,
  TrendingUp,
  Users,
  Activity,
  Star,
  ShoppingBag
} from "lucide-react";
import { type Order } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useState, useEffect, useMemo } from "react";

const statusConfig = {
  pending: {
    label: "Новый заказ",
    color: "bg-gradient-to-r from-amber-500 to-orange-500",
    textColor: "text-white",
    icon: AlertCircle,
    bgLight: "bg-amber-50 dark:bg-amber-900/20",
    borderColor: "border-amber-200 dark:border-amber-800"
  },
  processing: {
    label: "В обработке",
    color: "bg-gradient-to-r from-blue-500 to-cyan-500",
    textColor: "text-white",
    icon: PlayCircle,
    bgLight: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-200 dark:border-blue-800"
  },
  delivering: {
    label: "Доставляется",
    color: "bg-gradient-to-r from-purple-500 to-indigo-500",
    textColor: "text-white",
    icon: Truck,
    bgLight: "bg-purple-50 dark:bg-purple-900/20",
    borderColor: "border-purple-200 dark:border-purple-800"
  },
  completed: {
    label: "Выполнен",
    color: "bg-gradient-to-r from-green-500 to-emerald-500",
    textColor: "text-white",
    icon: CheckCircle,
    bgLight: "bg-green-50 dark:bg-green-900/20",
    borderColor: "border-green-200 dark:border-green-800"
  },
  cancelled: {
    label: "Отменен",
    color: "bg-gradient-to-r from-red-500 to-pink-500",
    textColor: "text-white",
    icon: XCircle,
    bgLight: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-200 dark:border-red-800"
  },
};

export default function AdminOrders() {
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
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
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update order status");
      return res.json();
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

  // Фильтрация и сортировка заказов
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders;

    // Фильтрация по статусу
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Поиск
    if (searchQuery) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
order.userId?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Сортировка
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
        case "oldest":
          return new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime();
        case "amount_high":
          return parseFloat(b.totalAmount) - parseFloat(a.totalAmount);
        case "amount_low":
          return parseFloat(a.totalAmount) - parseFloat(b.totalAmount);
        default:
          return 0;
      }
    });
  }, [orders, statusFilter, searchQuery, sortBy]);

  // Статистика
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    const delivering = orders.filter(o => o.status === 'delivering').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
    
    return { total, pending, processing, delivering, completed, totalRevenue };
  }, [orders]);

  const updateOrderStatus = (orderId: string, status: string) => {
    updateOrderStatusMutation.mutate({ orderId, status });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/50 sticky top-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
            <div className="flex items-center h-16 lg:h-20">
              <Button
                variant="ghost"
                onClick={() => setLocation("/admin")}
                className="mr-3 p-2 -ml-2"
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8">
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/admin")}
                className="mr-3 p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors duration-200"
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl blur opacity-75 animate-pulse"></div>
                  <div className="relative bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-xl">
                    <ShoppingBag className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    Управление заказами
                  </h1>
                  <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400">
                    {filteredAndSortedOrders.length} из {orders.length} заказов
                  </p>
                </div>
              </div>
            </div>
            
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
              data-testid="button-refresh"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Обновить</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 lg:py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-6 h-6 lg:w-8 lg:h-8 text-blue-100" />
                <Badge className="bg-white/20 text-white border-white/30 text-xs">Всего</Badge>
              </div>
              <p className="text-2xl lg:text-3xl font-bold mb-1">{stats.total}</p>
              <p className="text-blue-100 text-sm">Всех заказов</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="w-6 h-6 lg:w-8 lg:h-8 text-orange-100" />
                {stats.pending > 0 && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
              </div>
              <p className="text-2xl lg:text-3xl font-bold mb-1">{stats.pending}</p>
              <p className="text-orange-100 text-sm">Новых</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-2">
                <Truck className="w-6 h-6 lg:w-8 lg:h-8 text-purple-100" />
                {stats.delivering > 0 && <Activity className="w-4 h-4 text-purple-100 animate-pulse" />}
              </div>
              <p className="text-2xl lg:text-3xl font-bold mb-1">{stats.delivering}</p>
              <p className="text-purple-100 text-sm">В доставке</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-6 h-6 lg:w-8 lg:h-8 text-green-100" />
                <Star className="w-4 h-4 text-green-100" />
              </div>
              <p className="text-2xl lg:text-3xl font-bold mb-1">{stats.completed}</p>
              <p className="text-green-100 text-sm">Выполнено</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-6 h-6 lg:w-8 lg:h-8 text-emerald-100" />
                <TrendingUp className="w-4 h-4 text-emerald-100" />
              </div>
              <p className="text-2xl lg:text-3xl font-bold mb-1">{stats.totalRevenue.toFixed(0)}₽</p>
              <p className="text-emerald-100 text-sm">Выручка</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-white/20 dark:border-slate-700/50 shadow-lg mb-6">
          <CardContent className="p-4 lg:p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Поиск по номеру, адресу, пользователю..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                    data-testid="input-search"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700" data-testid="select-status-filter">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Все статусы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="pending">Новые заказы</SelectItem>
                    <SelectItem value="processing">В обработке</SelectItem>
                    <SelectItem value="delivering">Доставляются</SelectItem>
                    <SelectItem value="completed">Выполненные</SelectItem>
                    <SelectItem value="cancelled">Отмененные</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-48 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700" data-testid="select-sort">
                    <SelectValue placeholder="Сортировка" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Сначала новые</SelectItem>
                    <SelectItem value="oldest">Сначала старые</SelectItem>
                    <SelectItem value="amount_high">По сумме (убыв.)</SelectItem>
                    <SelectItem value="amount_low">По сумме (возр.)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="space-y-4 lg:space-y-6">
          {filteredAndSortedOrders.length === 0 ? (
            <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-white/20 dark:border-slate-700/50 shadow-lg">
              <CardContent className="p-8 lg:p-12 text-center">
                <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  {searchQuery || statusFilter !== "all" ? "Заказы не найдены" : "Нет заказов"}
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  {searchQuery || statusFilter !== "all" 
                    ? "Попробуйте изменить фильтры поиска" 
                    : "Пока нет ни одного заказа в системе"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedOrders.map((order) => {
              const status = statusConfig[order.status as keyof typeof statusConfig];
              const StatusIcon = status.icon;
              
              return (
                <Card 
                  key={order.id} 
                  className={`bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group`}
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col lg:flex-row">
                      {/* Left side - Order Info */}
                      <div className="flex-1 p-4 lg:p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${status.color} shadow-lg`}>
                              <StatusIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg lg:text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                                Заказ №{order.id.slice(-6)}
                              </h3>
                              <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(order.createdAt!)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <Badge className={`${status.color} ${status.textColor} border-0 shadow-md text-sm px-3 py-1`}>
                              {status.label}
                            </Badge>
                            <p className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                              {parseFloat(order.totalAmount).toFixed(0)}₽
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-start space-x-2">
                            <MapPin className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Адрес доставки:</p>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{order.deliveryAddress}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-2">
                            <User className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Пользователь:</p>
                              <p className="text-sm text-slate-600 dark:text-slate-400 font-mono">{order.userId?.slice(-8) || 'Неизвестно'}</p>
                            </div>
                          </div>
                        </div>
                        
                        {order.comment && (
                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 mb-4">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Комментарий к заказу:</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{order.comment}</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Right side - Actions */}
                      <div className="lg:w-64 bg-slate-50/50 dark:bg-slate-800/30 p-4 lg:p-6 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-700">
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Действия</h4>
                        
                        <div className="space-y-2">
                          {order.status === "pending" && (
                            <>
                              <Button
                                onClick={() => updateOrderStatus(order.id, "processing")}
                                disabled={updateOrderStatusMutation.isPending}
                                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                                data-testid={`button-accept-${order.id}`}
                              >
                                <PlayCircle className="w-4 h-4 mr-2" />
                                Принять в работу
                              </Button>
                              <Button
                                onClick={() => updateOrderStatus(order.id, "cancelled")}
                                disabled={updateOrderStatusMutation.isPending}
                                variant="outline"
                                className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                                data-testid={`button-cancel-${order.id}`}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Отменить
                              </Button>
                            </>
                          )}
                          
                          {order.status === "processing" && (
                            <>
                              <Button
                                onClick={() => updateOrderStatus(order.id, "delivering")}
                                disabled={updateOrderStatusMutation.isPending}
                                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                                data-testid={`button-deliver-${order.id}`}
                              >
                                <Truck className="w-4 h-4 mr-2" />
                                Отправить
                              </Button>
                              <Button
                                onClick={() => updateOrderStatus(order.id, "cancelled")}
                                disabled={updateOrderStatusMutation.isPending}
                                variant="outline"
                                className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                                data-testid={`button-cancel-${order.id}`}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Отменить
                              </Button>
                            </>
                          )}
                          
                          {order.status === "delivering" && (
                            <Button
                              onClick={() => updateOrderStatus(order.id, "completed")}
                              disabled={updateOrderStatusMutation.isPending}
                              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                              data-testid={`button-complete-${order.id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Завершить
                            </Button>
                          )}
                          
                          {(order.status === "completed" || order.status === "cancelled") && (
                            <div className="text-center py-4">
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {order.status === "completed" ? "Заказ выполнен" : "Заказ отменен"}
                              </p>
                            </div>
                          )}
                          
                          <Button
                            variant="outline"
                            className="w-full mt-2 border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                            data-testid={`button-details-${order.id}`}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Подробности
                          </Button>
                        </div>
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