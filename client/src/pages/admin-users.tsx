import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  ArrowLeft,
  Shield,
  User,
  Users,
  UserCheck,
  UserX,
  Filter,
  Search,
  RefreshCw,
  Eye,
  MoreHorizontal,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Settings,
  TrendingUp,
  Activity,
  Star,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  Crown,
  Ban,
  Unlock
} from "lucide-react";
import { type User as UserType, type PaginatedUsersResponse, type UserStats } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";

const roleConfig = {
  admin: {
    label: "Админ",
    color: "bg-gradient-to-r from-purple-500 to-indigo-500",
    textColor: "text-white",
    icon: Crown,
    bgLight: "bg-purple-50 dark:bg-purple-900/20",
    borderColor: "border-purple-200 dark:border-purple-800"
  },
  user: {
    label: "Пользователь",
    color: "bg-gradient-to-r from-blue-500 to-cyan-500",
    textColor: "text-white",
    icon: User,
    bgLight: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-200 dark:border-blue-800"
  }
};

const statusConfig = {
  active: {
    label: "Активен",
    color: "bg-gradient-to-r from-green-500 to-emerald-500",
    textColor: "text-white",
    icon: CheckCircle,
    bgLight: "bg-green-50 dark:bg-green-900/20",
    borderColor: "border-green-200 dark:border-green-800"
  },
  blocked: {
    label: "Заблокирован",
    color: "bg-gradient-to-r from-red-500 to-pink-500",
    textColor: "text-white",
    icon: Ban,
    bgLight: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-200 dark:border-red-800"
  }
};

export default function AdminUsers() {
  const [, setLocation] = useLocation();
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'createdAt' | 'username' | 'email' | 'role' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
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

  // Server-side filtered users with pagination
  const { data: usersData, isLoading, refetch, isFetching } = useQuery<PaginatedUsersResponse>({
    queryKey: ["/api/admin/users", {
      role: roleFilter,
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
      
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      params.set('page', currentPage.toString());
      params.set('limit', pageSize.toString());
      
      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          setLocation("/admin/login");
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch users");
      }
      return res.json();
    },
  });
  
  // User statistics
  const { data: stats } = useQuery<UserStats>({
    queryKey: ["/api/admin/users/stats"],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      const res = await fetch('/api/admin/users/stats', {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const users = usersData?.users || [];
  const meta = usersData?.meta;

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("Failed to update user role");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/stats"] });
      toast({
        title: "Роль обновлена",
        description: "Роль пользователя успешно изменена",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить роль пользователя",
        variant: "destructive",
      });
    },
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update user status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/stats"] });
      toast({
        title: "Статус обновлен",
        description: "Статус пользователя успешно изменен",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус пользователя",
        variant: "destructive",
      });
    },
  });

  const handleRoleChange = (userId: string, newRole: string) => {
    updateUserRoleMutation.mutate({ userId, role: newRole });
  };

  const handleStatusToggle = (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    updateUserStatusMutation.mutate({ userId, status: newStatus });
  };

  const handleRefresh = () => {
    refetch();
  };

  const resetFilters = () => {
    setRoleFilter("all");
    setStatusFilter("all");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const getRoleBadge = (role: string) => {
    const config = roleConfig[role as keyof typeof roleConfig];
    if (!config) return null;
    
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} ${config.textColor} flex items-center gap-1`} data-testid={`badge-role-${role}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;
    
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} ${config.textColor} flex items-center gap-1`} data-testid={`badge-status-${status}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/50 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="flex justify-between items-center h-16 lg:h-20">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/admin")}
                className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Назад</span>
              </Button>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-75 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
                  <Users className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Управление пользователями
                </h1>
                <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400">
                  Управление ролями и статусами пользователей
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isFetching}
                className="flex items-center space-x-2"
                data-testid="button-refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Обновить</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 lg:py-8">
        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-6 h-6 lg:w-8 lg:h-8 text-blue-100" />
                </div>
                <div>
                  <p className="text-2xl lg:text-3xl font-bold mb-1">{stats.totalUsers}</p>
                  <p className="text-blue-100 text-sm lg:text-base">Всего пользователей</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-6 h-6 lg:w-8 lg:h-8 text-green-100" />
                </div>
                <div>
                  <p className="text-2xl lg:text-3xl font-bold mb-1">{stats.activeUsers}</p>
                  <p className="text-green-100 text-sm lg:text-base">Активных</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between mb-2">
                  <Ban className="w-6 h-6 lg:w-8 lg:h-8 text-red-100" />
                </div>
                <div>
                  <p className="text-2xl lg:text-3xl font-bold mb-1">{stats.blockedUsers}</p>
                  <p className="text-red-100 text-sm lg:text-base">Заблокированных</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between mb-2">
                  <Crown className="w-6 h-6 lg:w-8 lg:h-8 text-purple-100" />
                </div>
                <div>
                  <p className="text-2xl lg:text-3xl font-bold mb-1">{stats.adminUsers}</p>
                  <p className="text-purple-100 text-sm lg:text-base">Администраторов</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-6 h-6 lg:w-8 lg:h-8 text-amber-100" />
                </div>
                <div>
                  <p className="text-2xl lg:text-3xl font-bold mb-1">{stats.activeUsersWithOrders}</p>
                  <p className="text-amber-100 text-sm lg:text-base">С заказами</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-white/20 dark:border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Фильтры</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Поиск</label>
                <Input
                  placeholder="Имя, email, телефон..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white dark:bg-slate-800"
                  data-testid="input-search"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Роль</label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="bg-white dark:bg-slate-800" data-testid="select-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все роли</SelectItem>
                    <SelectItem value="admin">Администраторы</SelectItem>
                    <SelectItem value="user">Пользователи</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Статус</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-white dark:bg-slate-800" data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="active">Активные</SelectItem>
                    <SelectItem value="blocked">Заблокированные</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Сортировка</label>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                  <SelectTrigger className="bg-white dark:bg-slate-800" data-testid="select-sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Дата регистрации</SelectItem>
                    <SelectItem value="username">Имя пользователя</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="role">Роль</SelectItem>
                    <SelectItem value="status">Статус</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                onClick={resetFilters}
                className="flex items-center space-x-2"
                data-testid="button-reset-filters"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Сбросить фильтры</span>
              </Button>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Показывать по:
                </span>
                <Select value={pageSize.toString()} onValueChange={(value) => {
                  setPageSize(parseInt(value));
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-20 bg-white dark:bg-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-white/20 dark:border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Пользователи</span>
                {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
              </div>
              
              {meta && (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Показано {((meta.page - 1) * meta.limit) + 1}-{Math.min(meta.page * meta.limit, meta.total)} из {meta.total}
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span className="ml-2">Загрузка...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-500 dark:text-slate-400">
                <Users className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Пользователи не найдены</p>
                <p className="text-sm">Попробуйте изменить параметры поиска</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-300">Пользователь</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-300">Контакты</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-300">Роль</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-300">Статус</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-300">Дата регистрации</th>
                      <th className="text-right py-3 px-4 font-medium text-slate-600 dark:text-slate-300">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user: UserType) => (
                      <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" data-testid={`row-user-${user.id}`}>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900 dark:text-white" data-testid={`text-username-${user.id}`}>
                                {user.username}
                              </div>
                              <div className="text-sm text-slate-500 dark:text-slate-400">
                                ID: {user.id.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-sm">
                              <Mail className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-600 dark:text-slate-300" data-testid={`text-email-${user.id}`}>
                                {user.email}
                              </span>
                            </div>
                            {user.phone && (
                              <div className="flex items-center space-x-2 text-sm">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <span className="text-slate-600 dark:text-slate-300">
                                  {user.phone}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <Select 
                            value={user.role} 
                            onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                            disabled={updateUserRoleMutation.isPending}
                          >
                            <SelectTrigger className="w-36" data-testid={`select-user-role-${user.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">
                                <div className="flex items-center space-x-2">
                                  <User className="w-4 h-4" />
                                  <span>Пользователь</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="admin">
                                <div className="flex items-center space-x-2">
                                  <Crown className="w-4 h-4" />
                                  <span>Админ</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </td>

                        <td className="py-4 px-4">
                          {getStatusBadge(user.status)}
                        </td>

                        <td className="py-4 px-4">
                          <div className="text-sm text-slate-600 dark:text-slate-300">
                            {formatDate(user.createdAt!)}
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusToggle(user.id, user.status)}
                              disabled={updateUserStatusMutation.isPending}
                              className={`flex items-center space-x-1 ${
                                user.status === 'active' 
                                  ? 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20' 
                                  : 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20'
                              }`}
                              data-testid={`button-toggle-status-${user.id}`}
                            >
                              {user.status === 'active' ? (
                                <>
                                  <Ban className="w-4 h-4" />
                                  <span className="hidden sm:inline">Заблокировать</span>
                                </>
                              ) : (
                                <>
                                  <Unlock className="w-4 h-4" />
                                  <span className="hidden sm:inline">Разблокировать</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Страница {meta.page} из {meta.totalPages}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={!meta.hasPrev}
                    data-testid="button-page-first"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!meta.hasPrev}
                    data-testid="button-page-prev"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 p-0"
                          data-testid={`button-page-${page}`}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!meta.hasNext}
                    data-testid="button-page-next"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(meta.totalPages)}
                    disabled={!meta.hasNext}
                    data-testid="button-page-last"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}