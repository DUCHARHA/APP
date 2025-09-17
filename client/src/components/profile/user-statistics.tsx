import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, ShoppingBag, Clock, Star, MapPin, Heart } from "lucide-react";
import { type UserStatistics } from "@shared/schema";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface UserStatisticsProps {
  statistics: UserStatistics;
  isLoading?: boolean;
  className?: string;
}

const loyaltyLevels = {
  bronze: { 
    name: "Бронза", 
    color: "bg-orange-500", 
    description: "Первые шаги",
    minOrders: 0,
    nextLevel: "silver"
  },
  silver: { 
    name: "Серебро", 
    color: "bg-gray-400", 
    description: "Постоянный клиент",
    minOrders: 10,
    nextLevel: "gold"
  },
  gold: { 
    name: "Золото", 
    color: "bg-yellow-500", 
    description: "VIP клиент",
    minOrders: 25,
    nextLevel: "platinum"
  },
  platinum: { 
    name: "Платина", 
    color: "bg-purple-500", 
    description: "Элитный статус",
    minOrders: 50,
    nextLevel: null
  }
};

export function UserStatistics({ statistics, isLoading = false, className = "" }: UserStatisticsProps) {
  if (isLoading) {
    return <UserStatisticsSkeleton className={className} />;
  }

  const loyaltyInfo = loyaltyLevels[statistics.loyaltyLevel];
  const nextLevelInfo = loyaltyInfo.nextLevel ? loyaltyLevels[loyaltyInfo.nextLevel] : null;
  const progressToNextLevel = nextLevelInfo 
    ? Math.min(100, (statistics.totalOrders / nextLevelInfo.minOrders) * 100)
    : 100;

  const ordersToNextLevel = nextLevelInfo 
    ? Math.max(0, nextLevelInfo.minOrders - statistics.totalOrders)
    : 0;

  return (
    <div className={`space-y-4 ${className}`} data-testid="user-statistics">
      {/* Loyalty Status Card */}
      <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${loyaltyInfo.color}`}></div>
              <div>
                <h3 className="font-semibold text-lg" data-testid="text-loyalty-level">
                  {loyaltyInfo.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {loyaltyInfo.description}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-white dark:bg-gray-800">
              <Star className="w-3 h-3 mr-1" />
              {statistics.totalOrders} заказов
            </Badge>
          </div>

          {nextLevelInfo && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>До уровня {nextLevelInfo.name}</span>
                <span>{ordersToNextLevel} заказов</span>
              </div>
              <Progress 
                value={progressToNextLevel} 
                className="h-2"
                data-testid="progress-loyalty"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Spent */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Потрачено</span>
            </div>
            <p className="text-2xl font-bold" data-testid="text-total-spent">
              {statistics.totalSpent.toLocaleString('ru-RU')} ₽
            </p>
            <p className="text-xs text-gray-500">
              Средний чек: {statistics.averageOrderValue.toLocaleString('ru-RU')} ₽
            </p>
          </CardContent>
        </Card>

        {/* Order Stats */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Заказы</span>
            </div>
            <p className="text-2xl font-bold" data-testid="text-total-orders">
              {statistics.totalOrders}
            </p>
            <p className="text-xs text-gray-500">
              Выполнено: {statistics.completedOrders}
            </p>
          </CardContent>
        </Card>

        {/* Delivery Addresses */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium">Адреса</span>
            </div>
            <p className="text-2xl font-bold" data-testid="text-delivery-addresses">
              {statistics.deliveryAddresses}
            </p>
            <p className="text-xs text-gray-500">Сохранено</p>
          </CardContent>
        </Card>

        {/* Last Order */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium">Последний</span>
            </div>
            <p className="text-sm font-bold" data-testid="text-last-order">
              {statistics.lastOrderDate 
                ? format(new Date(statistics.lastOrderDate), 'dd MMM', { locale: ru })
                : 'Никогда'
              }
            </p>
            <p className="text-xs text-gray-500">заказ</p>
          </CardContent>
        </Card>
      </div>

      {/* Favorite Categories */}
      {statistics.favoriteCategories.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Heart className="w-4 h-4 text-red-500" />
              <span>Любимые категории</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {statistics.favoriteCategories.map((category, index) => (
                <Badge 
                  key={index} 
                  variant="outline"
                  data-testid={`badge-favorite-category-${index}`}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function UserStatisticsSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Loyalty Status Skeleton */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Skeleton className="w-3 h-3 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid Skeleton */}
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Skeleton className="w-4 h-4" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-8 w-20 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Favorite Categories Skeleton */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Skeleton className="w-4 h-4" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-6 w-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}