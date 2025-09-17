import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  ArrowLeft,
  TrendingUp, 
  Users, 
  ShoppingCart,
  DollarSign,
  Package,
  Target,
  Clock,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Star,
  Award,
  Gift,
  Filter,
  Download,
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  Crown,
  Percent,
  Tag,
  ShoppingBag,
  Globe,
  Smartphone,
  Coffee,
  Sun,
  Moon
} from "lucide-react";
import { type AnalyticsOverview, type ProductStats, type CategoryStats, type PromoCodeStats } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export default function AdminAnalytics() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [dateFilter, setDateFilter] = useState<string>("7");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Проверка авторизации
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      setLocation("/admin/login");
      return;
    }
  }, [setLocation]);

  // Calculate date range based on filter
  const getDateRange = () => {
    const today = new Date();
    const days = parseInt(dateFilter);
    const fromDate = new Date(today);
    fromDate.setDate(fromDate.getDate() - days);
    
    return {
      dateFrom: fromDate.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0]
    };
  };

  const { dateFrom, dateTo } = getDateRange();

  // Fetch analytics overview
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useQuery<AnalyticsOverview>({
    queryKey: ["/api/admin/analytics/overview", dateFrom, dateTo, refreshKey],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      
      const res = await fetch(`/api/admin/analytics/overview?${params.toString()}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) {
        if (res.status === 401) {
          setLocation("/admin/login");
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch analytics overview");
      }
      return res.json();
    },
  });

  // Fetch product stats
  const { data: productStats, isLoading: productLoading } = useQuery<ProductStats>({
    queryKey: ["/api/admin/analytics/products", dateFrom, dateTo, refreshKey],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      
      const res = await fetch(`/api/admin/analytics/products?${params.toString()}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch product stats");
      return res.json();
    },
  });

  // Fetch category stats
  const { data: categoryStats, isLoading: categoryLoading } = useQuery<CategoryStats>({
    queryKey: ["/api/admin/analytics/categories", dateFrom, dateTo, refreshKey],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      
      const res = await fetch(`/api/admin/analytics/categories?${params.toString()}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch category stats");
      return res.json();
    },
  });

  // Fetch promo code stats
  const { data: promoStats, isLoading: promoLoading } = useQuery<PromoCodeStats>({
    queryKey: ["/api/admin/analytics/promo-codes", dateFrom, dateTo, refreshKey],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      
      const res = await fetch(`/api/admin/analytics/promo-codes?${params.toString()}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch promo stats");
      return res.json();
    },
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetchOverview();
    toast({
      title: "Данные обновлены",
      description: "Аналитика успешно обновлена",
    });
  };

  const isLoading = overviewLoading || productLoading || categoryLoading || promoLoading;

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    });
  };

  // Format time for peak hours
  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  if (isLoading && !overview) {
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
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const orderStats = overview?.orderStats;
  const userStats = overview?.userStats;
  const peakHours = overview?.peakHoursStats?.slice(0, 6) || [];
  const growthMetrics = overview?.growthMetrics;

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
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-75 animate-pulse"></div>
                  <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-xl">
                    <BarChart3 className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    Аналитика и статистика
                  </h1>
                  <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400">
                    Комплексный анализ бизнес-показателей • {dateFilter === "7" ? "7 дней" : dateFilter === "30" ? "30 дней" : "90 дней"}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-32 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700" data-testid="select-date-filter">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 дней</SelectItem>
                  <SelectItem value="30">30 дней</SelectItem>
                  <SelectItem value="90">90 дней</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                data-testid="button-refresh"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Обновить</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 lg:py-8">
        {/* Growth Metrics */}
        {growthMetrics && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
            <Card className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-6 h-6 lg:w-8 lg:h-8 text-green-100" />
                  <Badge className="bg-white/20 text-white border-white/30 text-xs">
                    {growthMetrics.orderGrowth >= 0 ? '+' : ''}{growthMetrics.orderGrowth.toFixed(1)}%
                  </Badge>
                </div>
                <p className="text-2xl lg:text-3xl font-bold mb-1">{orderStats?.totalOrders || 0}</p>
                <p className="text-green-100 text-sm">Рост заказов</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-6 h-6 lg:w-8 lg:h-8 text-blue-100" />
                  <Badge className="bg-white/20 text-white border-white/30 text-xs">
                    {growthMetrics.revenueGrowth >= 0 ? '+' : ''}{growthMetrics.revenueGrowth.toFixed(1)}%
                  </Badge>
                </div>
                <p className="text-2xl lg:text-3xl font-bold mb-1">{orderStats?.totalRevenue.toFixed(0) || 0}₽</p>
                <p className="text-blue-100 text-sm">Рост выручки</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-6 h-6 lg:w-8 lg:h-8 text-purple-100" />
                  <Badge className="bg-white/20 text-white border-white/30 text-xs">
                    {growthMetrics.userGrowth >= 0 ? '+' : ''}{growthMetrics.userGrowth.toFixed(1)}%
                  </Badge>
                </div>
                <p className="text-2xl lg:text-3xl font-bold mb-1">{userStats?.totalUsers || 0}</p>
                <p className="text-purple-100 text-sm">Рост пользователей</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-8">
          <Card className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-2">
                <ShoppingCart className="w-6 h-6 lg:w-8 lg:h-8 text-orange-100" />
                <Activity className="w-4 h-4 text-orange-100 animate-pulse" />
              </div>
              <p className="text-2xl lg:text-3xl font-bold mb-1">{orderStats?.statusCounts.pending || 0}</p>
              <p className="text-orange-100 text-sm">Новых заказов</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-6 h-6 lg:w-8 lg:h-8 text-blue-100" />
                <Badge className="bg-white/20 text-white border-white/30 text-xs">Всего</Badge>
              </div>
              <p className="text-2xl lg:text-3xl font-bold mb-1">{productStats?.totalProducts || 0}</p>
              <p className="text-blue-100 text-sm">Товаров</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-6 h-6 lg:w-8 lg:h-8 text-emerald-100" />
                <Star className="w-4 h-4 text-emerald-100" />
              </div>
              <p className="text-2xl lg:text-3xl font-bold mb-1">{userStats?.activeUsers || 0}</p>
              <p className="text-emerald-100 text-sm">Активных</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-6 h-6 lg:w-8 lg:h-8 text-violet-100" />
                <Crown className="w-4 h-4 text-violet-100" />
              </div>
              <p className="text-2xl lg:text-3xl font-bold mb-1">{categoryStats?.totalCategories || 0}</p>
              <p className="text-violet-100 text-sm">Категорий</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-500 via-rose-600 to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-2">
                <Gift className="w-6 h-6 lg:w-8 lg:h-8 text-pink-100" />
                <Percent className="w-4 h-4 text-pink-100" />
              </div>
              <p className="text-2xl lg:text-3xl font-bold mb-1">{promoStats?.activePromoCodes || 0}</p>
              <p className="text-pink-100 text-sm">Промокодов</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-white/20 dark:border-slate-700/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span>Выручка по дням</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderStats?.revenueByDay?.map((day, index) => {
                  const maxRevenue = Math.max(...(orderStats.revenueByDay?.map(d => d.revenue) || [1]));
                  const width = (day.revenue / maxRevenue) * 100;
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">{formatDate(day.date)}</span>
                        <span className="font-medium">{day.revenue.toFixed(0)}₽ ({day.orders} заказов)</span>
                      </div>
                      <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Peak Hours */}
          <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-white/20 dark:border-slate-700/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span>Пиковые часы</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {peakHours.map((hour, index) => {
                  const maxOrders = Math.max(...peakHours.map(h => h.orderCount), 1);
                  const width = (hour.orderCount / maxOrders) * 100;
                  const IconComponent = hour.hour >= 6 && hour.hour < 12 ? Sun : 
                                     hour.hour >= 12 && hour.hour < 18 ? Coffee : 
                                     Moon;
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center space-x-2">
                          <IconComponent className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-600 dark:text-slate-400">{formatHour(hour.hour)}</span>
                        </div>
                        <span className="font-medium">{hour.orderCount} заказов ({hour.revenue.toFixed(0)}₽)</span>
                      </div>
                      <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-cyan-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Products & Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Products */}
          <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-white/20 dark:border-slate-700/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-yellow-600" />
                <span>Топ товары</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productStats?.topSellingProducts?.slice(0, 8).map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{product.productName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Продано: {product.totalSold} шт.</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{product.revenue.toFixed(0)}₽</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Category Performance */}
          <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-white/20 dark:border-slate-700/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="w-5 h-5 text-purple-600" />
                <span>Топ категории</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryStats?.categoryPerformance?.slice(0, 6).map((category, index) => {
                  const maxScore = Math.max(...(categoryStats.categoryPerformance?.map(c => c.popularityScore) || [1]));
                  const width = (category.popularityScore / maxScore) * 100;
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">{category.categoryName}</span>
                        <div className="text-right">
                          <p className="font-bold text-purple-600">{category.revenue.toFixed(0)}₽</p>
                          <p className="text-xs text-slate-500">{category.totalSales} продаж</p>
                        </div>
                      </div>
                      <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Statistics & Promo Codes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Registration Trend */}
          <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-white/20 dark:border-slate-700/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Регистрации по дням</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userStats?.registrationsByDay?.map((day, index) => {
                  const maxRegistrations = Math.max(...(userStats.registrationsByDay?.map(d => d.count) || [1]));
                  const width = (day.count / maxRegistrations) * 100;
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">{formatDate(day.date)}</span>
                        <span className="font-medium">{day.count} новых пользователей</span>
                      </div>
                      <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Promo Codes */}
          <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-white/20 dark:border-slate-700/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Tag className="w-5 h-5 text-pink-600" />
                <span>Популярные промокоды</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {promoStats?.mostPopularPromos?.slice(0, 6).map((promo, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full text-xs font-bold">
                        -{promo.discount}%
                      </div>
                      <div>
                        <p className="font-medium text-sm">{promo.code}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Использован: {promo.usageCount} раз</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-pink-600">{promo.revenue.toFixed(0)}₽</p>
                      <p className="text-xs text-slate-500">экономия</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Customers */}
        <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-white/20 dark:border-slate-700/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-yellow-600" />
              <span>Топ клиенты</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userStats?.topCustomers?.map((customer, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{customer.username}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{customer.orderCount} заказов</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-yellow-600">{customer.totalSpent.toFixed(0)}₽</p>
                    <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">VIP</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}