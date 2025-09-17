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
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings2
} from "lucide-react";
import { type Order, type PaginatedOrdersResponse, type OrderStats } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { queryClient } from "@/lib/queryClient";
import { useState, useEffect, useCallback } from "react";

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
  const [sortBy, setSortBy] = useState<'createdAt' | 'totalAmount' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const { toast } = useToast();
  
  // Debounced search to prevent excessive API calls
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    // Проверка авторизации
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      setLocation("/admin/login");
      return;
    }
  }, [setLocation]);

  // Server-side filtered orders with pagination
  const { data: ordersData, isLoading, refetch, isFetching } = useQuery<PaginatedOrdersResponse>({
    queryKey: ["/api/admin/orders", {
      status: statusFilter,
      search: debouncedSearch,
      sortBy,
      sortOrder,
      page: currentPage,
      limit: pageSize
    }],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      params.set('page', currentPage.toString());
      params.set('limit', pageSize.toString());
      
      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
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
  
  // Order statistics
  const { data: stats } = useQuery<OrderStats>({
    queryKey: ["/api/admin/orders/stats"],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      const res = await fetch('/api/admin/orders/stats', {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const orders = ordersData?.orders || [];
  const meta = ordersData?.meta;

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

  // Bulk status update mutation
  const bulkUpdateStatusMutation = useMutation({
    mutationFn: async ({ orderIds, status }: { orderIds: string[]; status: string }) => {
      const token = localStorage.getItem("adminToken");
      const res = await fetch('/api/admin/orders/bulk-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderIds, status })
      });
      if (!res.ok) throw new Error('Failed to bulk update orders');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders/stats"] });
      setSelectedOrders([]);
      toast({
        title: "Заказы обновлены",
        description: data.message,
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить заказы",
        variant: "destructive",
      });
    },
  });
  
  // Handle filter changes
  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);
  
  const handleSortChange = useCallback((value: string) => {
    const [newSortBy, newSortOrder] = value.split('_');
    setSortBy(newSortBy as 'createdAt' | 'totalAmount' | 'status');
    setSortOrder(newSortOrder as 'asc' | 'desc');
    setCurrentPage(1);
  }, []);
  
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);
  
  const handleSelectOrder = useCallback((orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  }, []);
  
  const handleSelectAll = useCallback(() => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(order => order.id));
    }
  }, [selectedOrders.length, orders]);
  
  const handleBulkStatusUpdate = useCallback((status: string) => {
    if (selectedOrders.length > 0) {
      bulkUpdateStatusMutation.mutate({ orderIds: selectedOrders, status });
    }
  }, [selectedOrders, bulkUpdateStatusMutation]);

  const updateOrderStatus = useCallback((orderId: string, status: string) => {
    updateOrderStatusMutation.mutate({ orderId, status });
  }, [updateOrderStatusMutation]);
  
  // Pagination helper functions
  const totalPages = meta?.totalPages || 1;
  const hasNext = meta?.hasNext || false;
  const hasPrev = meta?.hasPrev || false;
  
  const renderPaginationControls = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Показано {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, meta?.total || 0)} из {meta?.total || 0} заказов
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={!hasPrev}
            data-testid="button-first-page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPrev}
            data-testid="button-prev-page"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <span className="px-3 py-1 text-sm font-medium bg-gray-100 dark:bg-gray-800 rounded">
            {currentPage} / {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNext}
            data-testid="button-next-page"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={!hasNext}
            data-testid="button-last-page"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
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
                    {meta?.total || 0} заказов • Страница {currentPage} из {totalPages}
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
                
                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
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
                
                <Select value={`${sortBy}_${sortOrder}`} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-full sm:w-48 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700" data-testid="select-sort">
                    <SelectValue placeholder="Сортировка" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt_desc">Сначала новые</SelectItem>
                    <SelectItem value="createdAt_asc">Сначала старые</SelectItem>
                    <SelectItem value="totalAmount_desc">По сумме (убыв.)</SelectItem>
                    <SelectItem value="totalAmount_asc">По сумме (возр.)</SelectItem>
                    <SelectItem value="status_asc">По статусу</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Operations */}
        {selectedOrders.length > 0 && (
          <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-white/20 dark:border-slate-700/50 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">Выбрано: {selectedOrders.length}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSelectAll}
                    data-testid="button-select-all"
                  >
                    {selectedOrders.length === orders.length ? "Снять всё" : "Выбрать все"}
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Select onValueChange={(value) => handleBulkStatusUpdate(value)}>
                    <SelectTrigger className="w-48" data-testid="select-bulk-status">
                      <SelectValue placeholder="Изменить статус" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="processing">В обработке</SelectItem>
                      <SelectItem value="delivering">Доставляется</SelectItem>
                      <SelectItem value="completed">Выполнен</SelectItem>
                      <SelectItem value="cancelled">Отменен</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orders List */}
        <div className="space-y-4 lg:space-y-6">
          {orders.length === 0 ? (
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
            orders.map((order) => {
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
                            <input
                              type="checkbox"
                              checked={selectedOrders.includes(order.id)}
                              onChange={() => handleSelectOrder(order.id)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                              data-testid={`checkbox-order-${order.id}`}
                            />
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
        
        {/* Pagination Controls */}
        {renderPaginationControls()}
      </div>
    </div>
  );
}