import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Calendar, Clock, Star, ShoppingCart, Package, Heart } from "lucide-react";
import { type Order } from "@shared/schema";
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from "date-fns";
import { ru } from "date-fns/locale";
import { useMemo } from "react";

interface UserInsightsProps {
  orders: Order[];
  isLoading?: boolean;
  className?: string;
}

export function UserInsights({ orders, isLoading = false, className = "" }: UserInsightsProps) {
  const insights = useMemo(() => {
    if (!orders.length) {
      return {
        thisMonth: { count: 0, total: 0 },
        lastMonth: { count: 0, total: 0 },
        averageDeliveryTime: 0,
        favoriteTimeSlots: [],
        monthlyTrend: 0,
        spendingTrend: 0,
        topCategories: [],
        recentActivity: [],
      };
    }

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // This month's orders
    const thisMonthOrders = orders.filter(order => 
      isWithinInterval(new Date(order.createdAt || ''), { start: thisMonthStart, end: thisMonthEnd })
    );
    
    // Last month's orders
    const lastMonthOrders = orders.filter(order => 
      isWithinInterval(new Date(order.createdAt || ''), { start: lastMonthStart, end: lastMonthEnd })
    );

    const thisMonthTotal = thisMonthOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount || '0'), 0);
    const lastMonthTotal = lastMonthOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount || '0'), 0);

    // Calculate trends
    const monthlyTrend = lastMonthOrders.length > 0 
      ? ((thisMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100 
      : 0;
    const spendingTrend = lastMonthTotal > 0 
      ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 
      : 0;

    // Mock data for demonstration
    const favoriteTimeSlots = ["09:00-12:00", "15:00-18:00"];
    const topCategories = ["Овощи и фрукты", "Молочные продукты", "Хлебобулочные"];
    const recentActivity = orders.slice(0, 5).map(order => ({
      id: order.id,
      action: "Заказ оформлен",
      date: order.createdAt,
      amount: parseFloat(order.totalAmount || '0'),
    }));

    return {
      thisMonth: { count: thisMonthOrders.length, total: thisMonthTotal },
      lastMonth: { count: lastMonthOrders.length, total: lastMonthTotal },
      averageDeliveryTime: 45, // Mock data
      favoriteTimeSlots,
      monthlyTrend,
      spendingTrend,
      topCategories,
      recentActivity,
    };
  }, [orders]);

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`} data-testid="user-insights">
      {/* Monthly Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Активность за месяц</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Заказов в этом месяце</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-2xl font-bold" data-testid="text-orders-this-month">
                  {insights.thisMonth.count}
                </span>
                {insights.monthlyTrend !== 0 && (
                  <Badge 
                    variant={insights.monthlyTrend > 0 ? "default" : "secondary"}
                    className={insights.monthlyTrend > 0 ? "text-green-600" : "text-red-600"}
                  >
                    {insights.monthlyTrend > 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {Math.abs(insights.monthlyTrend).toFixed(1)}%
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Прошлый месяц: {insights.lastMonth.count}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Потрачено в этом месяце</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-2xl font-bold" data-testid="text-spent-this-month">
                  {insights.thisMonth.total.toLocaleString('ru-RU')} ₽
                </span>
                {insights.spendingTrend !== 0 && (
                  <Badge 
                    variant={insights.spendingTrend > 0 ? "default" : "secondary"}
                    className={insights.spendingTrend > 0 ? "text-green-600" : "text-red-600"}
                  >
                    {insights.spendingTrend > 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {Math.abs(insights.spendingTrend).toFixed(1)}%
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Прошлый месяц: {insights.lastMonth.total.toLocaleString('ru-RU')} ₽
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-base">
              <Clock className="w-4 h-4" />
              <span>Время доставки</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <span className="text-2xl font-bold text-green-600" data-testid="text-avg-delivery">
                {insights.averageDeliveryTime} мин
              </span>
              <p className="text-sm text-gray-500 mt-1">Среднее время</p>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Быстро</span>
                <span>Стандарт</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-base">
              <Star className="w-4 h-4" />
              <span>Любимое время</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.favoriteTimeSlots.map((slot, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm" data-testid={`text-time-slot-${index}`}>
                    {slot}
                  </span>
                  <Badge variant="outline">Часто</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5" />
            <span>Любимые категории</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.topCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="font-medium" data-testid={`text-top-category-${index}`}>
                  {category}
                </span>
                <div className="flex items-center space-x-2">
                  <Progress value={85 - index * 20} className="w-20 h-2" />
                  <span className="text-sm text-gray-500">{85 - index * 20}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Последняя активность</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.recentActivity.map((activity, index) => (
              <div key={activity.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium" data-testid={`text-activity-${index}`}>
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.date && format(new Date(activity.date), 'dd MMM, HH:mm', { locale: ru })}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium">
                  {activity.amount.toLocaleString('ru-RU')} ₽
                </span>
              </div>
            ))}
          </div>
          
          {insights.recentActivity.length === 0 && (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Пока нет активности</p>
              <p className="text-sm text-gray-400">Ваши заказы будут отображаться здесь</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}