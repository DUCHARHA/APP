import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  ArrowLeft,
  AlertCircle, 
  AlertTriangle,
  Info,
  Bug,
  Network,
  Code,
  Filter,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  Calendar,
  Clock,
  Server,
  Monitor,
  Globe,
  Activity,
  TrendingUp,
  XCircle,
  CheckCircle,
  Download,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { type ErrorRecord } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";

interface ErrorStats {
  total: number;
  byLevel: Record<string, number>;
  byType: Record<string, number>;
  bySource: Record<string, number>;
  recent24h: number;
  recentHour: number;
}

const errorTypeConfig = {
  boundary_error: {
    label: "React Boundary",
    icon: Bug,
    color: "bg-red-500",
    bgLight: "bg-red-50 dark:bg-red-900/20"
  },
  js_error: {
    label: "JavaScript",
    icon: Code,
    color: "bg-orange-500",
    bgLight: "bg-orange-50 dark:bg-orange-900/20"
  },
  promise_rejection: {
    label: "Promise Rejection",
    icon: XCircle,
    color: "bg-purple-500",
    bgLight: "bg-purple-50 dark:bg-purple-900/20"
  },
  network_error: {
    label: "Network",
    icon: Network,
    color: "bg-blue-500",
    bgLight: "bg-blue-50 dark:bg-blue-900/20"
  },
  api_error: {
    label: "API Error",
    icon: Server,
    color: "bg-cyan-500",
    bgLight: "bg-cyan-50 dark:bg-cyan-900/20"
  }
};

const levelConfig = {
  error: {
    label: "Error",
    icon: AlertCircle,
    color: "bg-red-500",
    textColor: "text-red-700 dark:text-red-400"
  },
  warning: {
    label: "Warning",
    icon: AlertTriangle,
    color: "bg-yellow-500",
    textColor: "text-yellow-700 dark:text-yellow-400"
  },
  info: {
    label: "Info",
    icon: Info,
    color: "bg-blue-500",
    textColor: "text-blue-700 dark:text-blue-400"
  }
};

export default function AdminErrors() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedError, setSelectedError] = useState<ErrorRecord | null>(null);
  
  const debouncedSearch = useDebounce(searchTerm, 300);
  const pageSize = 20;

  useEffect(() => {
    // Check admin authorization
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      setLocation("/admin/login");
      return;
    }
  }, [setLocation]);

  // Fetch error statistics
  const { data: stats, isLoading: statsLoading } = useQuery<ErrorStats>({
    queryKey: ['/api/admin/errors/stats'],
    enabled: !!localStorage.getItem("adminToken"),
  });

  // Fetch errors with filters
  const { data: errorsData, isLoading: errorsLoading, refetch } = useQuery({
    queryKey: ['/api/admin/errors', {
      search: debouncedSearch,
      type: typeFilter,
      level: levelFilter,
      source: sourceFilter,
      date: dateFilter,
      page: currentPage,
      limit: pageSize
    }],
    enabled: !!localStorage.getItem("adminToken"),
  });

  // Delete errors mutation
  const deleteErrorsMutation = useMutation({
    mutationFn: async (params: { olderThan?: string; ids?: string[] }) => {
      const response = await fetch('/api/admin/errors', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem("adminToken")}`
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete errors');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Успешно",
        description: `Удалено ${data.deleted} ошибок`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/errors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/errors/stats'] });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить ошибки",
        variant: "destructive"
      });
    }
  });

  const handleDeleteOldErrors = (days: number) => {
    const olderThan = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    deleteErrorsMutation.mutate({ olderThan });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getErrorTypeIcon = (type: string) => {
    const config = errorTypeConfig[type as keyof typeof errorTypeConfig];
    return config ? config.icon : Bug;
  };

  const getErrorLevelIcon = (level: string) => {
    const config = levelConfig[level as keyof typeof levelConfig];
    return config ? config.icon : Info;
  };

  const exportErrors = () => {
    const dataStr = JSON.stringify(errorsData?.errors || [], null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `errors-export-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const errors = errorsData?.errors || [];
  const totalPages = Math.ceil((errorsData?.total || 0) / pageSize);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/admin")}
            className="flex items-center gap-2"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Логи ошибок
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Мониторинг и управление ошибками системы
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={exportErrors}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            data-testid="button-export"
          >
            <Download className="w-4 h-4" />
            Экспорт
          </Button>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            data-testid="button-refresh"
          >
            <RefreshCw className="w-4 h-4" />
            Обновить
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего ошибок</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">За 24 часа</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600" data-testid="stat-24h">{stats.recent24h}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">За час</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600" data-testid="stat-hour">{stats.recentHour}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Критические</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700" data-testid="stat-errors">{stats.byLevel.error || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <Input
                placeholder="Поиск по сообщению..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                data-testid="input-search"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger data-testid="select-type">
                <SelectValue placeholder="Тип ошибки" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                {Object.entries(errorTypeConfig).map(([type, config]) => (
                  <SelectItem key={type} value={type}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger data-testid="select-level">
                <SelectValue placeholder="Уровень" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все уровни</SelectItem>
                {Object.entries(levelConfig).map(([level, config]) => (
                  <SelectItem key={level} value={level}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger data-testid="select-source">
                <SelectValue placeholder="Источник" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все источники</SelectItem>
                <SelectItem value="frontend">Frontend</SelectItem>
                <SelectItem value="backend">Backend</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger data-testid="select-date">
                <SelectValue placeholder="Период" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Весь период</SelectItem>
                <SelectItem value="1h">Последний час</SelectItem>
                <SelectItem value="24h">24 часа</SelectItem>
                <SelectItem value="7d">7 дней</SelectItem>
                <SelectItem value="30d">30 дней</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => handleDeleteOldErrors(7)}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
              disabled={deleteErrorsMutation.isPending}
              data-testid="button-delete-7d"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить старше 7 дней
            </Button>
            <Button
              onClick={() => handleDeleteOldErrors(30)}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
              disabled={deleteErrorsMutation.isPending}
              data-testid="button-delete-30d"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить старше 30 дней
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Errors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Список ошибок</CardTitle>
        </CardHeader>
        <CardContent>
          {errorsLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-400" />
              <p className="mt-2 text-slate-600 dark:text-slate-400">Загрузка ошибок...</p>
            </div>
          ) : errors.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-8 h-8 mx-auto text-green-500" />
              <p className="mt-2 text-slate-600 dark:text-slate-400">Ошибок не найдено</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Тип</th>
                      <th className="text-left p-2 font-medium">Уровень</th>
                      <th className="text-left p-2 font-medium">Сообщение</th>
                      <th className="text-left p-2 font-medium">Источник</th>
                      <th className="text-left p-2 font-medium">Время</th>
                      <th className="text-left p-2 font-medium">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errors.map((error) => {
                      const TypeIcon = getErrorTypeIcon(error.type);
                      const LevelIcon = getErrorLevelIcon(error.level);
                      const typeConfig = errorTypeConfig[error.type as keyof typeof errorTypeConfig];
                      const levelConfig = levelConfig[error.level as keyof typeof levelConfig];

                      return (
                        <tr key={error.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2">
                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                              <TypeIcon className="w-3 h-3" />
                              {typeConfig?.label || error.type}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <Badge 
                              variant="outline" 
                              className={`flex items-center gap-1 w-fit ${levelConfig?.textColor || ''}`}
                            >
                              <LevelIcon className="w-3 h-3" />
                              {levelConfig?.label || error.level}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <div className="max-w-md">
                              <p className="truncate text-sm" title={error.message}>
                                {error.message}
                              </p>
                              {error.url && (
                                <p className="text-xs text-slate-500 truncate" title={error.url}>
                                  {error.url}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="p-2">
                            <Badge variant={error.source === 'frontend' ? 'default' : 'secondary'}>
                              {error.source === 'frontend' ? (
                                <Monitor className="w-3 h-3 mr-1" />
                              ) : (
                                <Server className="w-3 h-3 mr-1" />
                              )}
                              {error.source}
                            </Badge>
                          </td>
                          <td className="p-2 text-sm">
                            {formatDate(error.timestamp)}
                          </td>
                          <td className="p-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedError(error)}
                                  data-testid={`button-view-${error.id}`}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <TypeIcon className="w-5 h-5" />
                                    Детали ошибки
                                  </DialogTitle>
                                </DialogHeader>
                                {selectedError && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <h4 className="font-medium mb-2">Основная информация</h4>
                                        <div className="space-y-2 text-sm">
                                          <div><strong>ID:</strong> {selectedError.id}</div>
                                          <div><strong>Тип:</strong> {selectedError.type}</div>
                                          <div><strong>Уровень:</strong> {selectedError.level}</div>
                                          <div><strong>Источник:</strong> {selectedError.source}</div>
                                          <div><strong>Время:</strong> {formatDate(selectedError.timestamp)}</div>
                                          {selectedError.url && (
                                            <div><strong>URL:</strong> <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">{selectedError.url}</code></div>
                                          )}
                                          {selectedError.userAgent && (
                                            <div><strong>User Agent:</strong> <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">{selectedError.userAgent}</code></div>
                                          )}
                                        </div>
                                      </div>
                                      <div>
                                        <h4 className="font-medium mb-2">Сообщение</h4>
                                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded text-sm">
                                          {selectedError.message}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {selectedError.stack && (
                                      <div>
                                        <h4 className="font-medium mb-2">Stack Trace</h4>
                                        <pre className="bg-slate-50 dark:bg-slate-800 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                                          {selectedError.stack}
                                        </pre>
                                      </div>
                                    )}
                                    
                                    {selectedError.metadata && (
                                      <div>
                                        <h4 className="font-medium mb-2">Metadata</h4>
                                        <pre className="bg-slate-50 dark:bg-slate-800 p-3 rounded text-xs overflow-x-auto">
                                          {JSON.stringify(JSON.parse(selectedError.metadata), null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Показано {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, errorsData?.total || 0)} из {errorsData?.total || 0}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      data-testid="button-first-page"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="px-3 py-1 text-sm">
                      {currentPage} из {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      data-testid="button-next-page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      data-testid="button-last-page"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}