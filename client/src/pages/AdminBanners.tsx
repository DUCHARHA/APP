import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Plus, Trash2, Eye, EyeOff, RefreshCw } from "lucide-react";
import type { Banner } from "@shared/schema";

export default function AdminBanners() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['/api/banners/all'],
    staleTime: 0, // Always refetch fresh data
    gcTime: 0, // No cache retention
    refetchOnWindowFocus: false, // Don't refetch on tab switch
    refetchOnMount: true, // Only refetch on page load/refresh
  });

  const createBannerMutation = useMutation({
    mutationFn: (bannerData: any) => fetch(`/api/banners`, {
      method: 'POST',
      body: JSON.stringify(bannerData),
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/banners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/banners/all'] });
      setIsCreateOpen(false);
      toast({ title: "Баннер создан", description: "Новый баннер успешно добавлен" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось создать баннер", variant: "destructive" });
    }
  });

  const updateBannerMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => fetch(`/api/banners/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json()),
    onSuccess: () => {
      // Force invalidate all banner caches
      queryClient.invalidateQueries({ queryKey: ['/api/banners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/banners/all'] });
      queryClient.refetchQueries({ queryKey: ['/api/banners'] });
      setEditingBanner(null);
      toast({ 
        title: "Баннер обновлен", 
        description: "Изменения сохранены. Обновите главную страницу для просмотра." 
      });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось обновить баннер", variant: "destructive" });
    }
  });

  const deleteBannerMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/banners/${id}`, { method: 'DELETE' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/banners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/banners/all'] });
      toast({ title: "Баннер удален", description: "Баннер успешно удален" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось удалить баннер", variant: "destructive" });
    }
  });

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const bannerData = {
      title: formData.get('title') as string,
      subtitle: formData.get('subtitle') as string,
      message: formData.get('message') as string,
      type: formData.get('type') as string,
      backgroundColor: formData.get('backgroundColor') as string,
      textColor: formData.get('textColor') as string,
      buttonText: formData.get('buttonText') as string || null,
      buttonLink: formData.get('buttonLink') as string || null,
      priority: parseInt(formData.get('priority') as string),
      isActive: formData.get('isActive') === 'true'
    };

    createBannerMutation.mutate(bannerData);
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingBanner) return;

    const formData = new FormData(e.currentTarget);
    
    const bannerData = {
      id: editingBanner.id,
      title: formData.get('title') as string,
      subtitle: formData.get('subtitle') as string,
      message: formData.get('message') as string,
      type: formData.get('type') as string,
      backgroundColor: formData.get('backgroundColor') as string,
      textColor: formData.get('textColor') as string,
      buttonText: formData.get('buttonText') as string || null,
      buttonLink: formData.get('buttonLink') as string || null,
      priority: parseInt(formData.get('priority') as string),
      isActive: formData.get('isActive') === 'true'
    };

    updateBannerMutation.mutate(bannerData);
  };

  const toggleBannerActive = (banner: Banner) => {
    updateBannerMutation.mutate({
      id: banner.id,
      isActive: !banner.isActive
    });
  };

  const forceRefreshCache = async () => {
    setIsRefreshing(true);
    try {
      // Invalidate all banner caches
      await queryClient.invalidateQueries({ queryKey: ['/api/banners'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/banners/all'] });
      // Force refetch
      await queryClient.refetchQueries({ queryKey: ['/api/banners'] });
      await queryClient.refetchQueries({ queryKey: ['/api/banners/all'] });
      
      toast({ 
        title: "Кеш обновлен", 
        description: "Изменения должны быть видны на главной странице" 
      });
    } catch (error) {
      toast({ 
        title: "Ошибка", 
        description: "Не удалось обновить кеш", 
        variant: "destructive" 
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const BannerForm = ({ banner, onSubmit, isLoading }: { banner?: Banner; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; isLoading: boolean }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Заголовок</Label>
          <Input
            id="title"
            name="title"
            defaultValue={banner?.title || ""}
            placeholder="Заголовок баннера"
            required
            data-testid="input-banner-title"
          />
        </div>
        <div>
          <Label htmlFor="subtitle">Подзаголовок</Label>
          <Input
            id="subtitle"
            name="subtitle"
            defaultValue={banner?.subtitle || ""}
            placeholder="Подзаголовок"
            data-testid="input-banner-subtitle"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="message">Описание</Label>
        <Textarea
          id="message"
          name="message"
          defaultValue={banner?.message || ""}
          placeholder="Описание баннера"
          required
          data-testid="textarea-banner-message"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Тип баннера</Label>
          <Select name="type" defaultValue={banner?.type || "info"}>
            <SelectTrigger data-testid="select-banner-type">
              <SelectValue placeholder="Выберите тип" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="promo">Промо</SelectItem>
              <SelectItem value="partnership">Партнерство</SelectItem>
              <SelectItem value="announcement">Объявление</SelectItem>
              <SelectItem value="info">Информация</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="priority">Приоритет</Label>
          <Input
            id="priority"
            name="priority"
            type="number"
            defaultValue={banner?.priority || 0}
            placeholder="0"
            data-testid="input-banner-priority"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="backgroundColor">Цвет фона</Label>
          <div className="flex gap-2">
            <Input
              id="backgroundColor"
              name="backgroundColor"
              type="color"
              defaultValue={banner?.backgroundColor || "#6366f1"}
              className="w-16 h-10 p-1 border rounded"
              data-testid="input-banner-bg-color"
            />
            <Input
              defaultValue={banner?.backgroundColor || "#6366f1"}
              placeholder="#6366f1"
              className="flex-1"
              onChange={(e) => {
                const colorInput = document.getElementById('backgroundColor') as HTMLInputElement;
                if (colorInput) colorInput.value = e.target.value;
              }}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="textColor">Цвет текста</Label>
          <div className="flex gap-2">
            <Input
              id="textColor"
              name="textColor"
              type="color"
              defaultValue={banner?.textColor || "#ffffff"}
              className="w-16 h-10 p-1 border rounded"
              data-testid="input-banner-text-color"
            />
            <Input
              defaultValue={banner?.textColor || "#ffffff"}
              placeholder="#ffffff"
              className="flex-1"
              onChange={(e) => {
                const colorInput = document.getElementById('textColor') as HTMLInputElement;
                if (colorInput) colorInput.value = e.target.value;
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="buttonText">Текст кнопки</Label>
          <Input
            id="buttonText"
            name="buttonText"
            defaultValue={banner?.buttonText || ""}
            placeholder="Текст кнопки (необязательно)"
            data-testid="input-banner-button-text"
          />
        </div>
        <div>
          <Label htmlFor="buttonLink">Ссылка кнопки</Label>
          <Input
            id="buttonLink"
            name="buttonLink"
            defaultValue={banner?.buttonLink || ""}
            placeholder="URL (необязательно)"
            data-testid="input-banner-button-link"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="isActive">Статус</Label>
        <Select name="isActive" defaultValue={banner?.isActive ? "true" : "false"}>
          <SelectTrigger data-testid="select-banner-status">
            <SelectValue placeholder="Выберите статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Активен</SelectItem>
            <SelectItem value="false">Неактивен</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full" data-testid="button-save-banner">
        {isLoading ? "Сохраняем..." : "Сохранить"}
      </Button>
    </form>
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
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
                onClick={() => window.history.back()}
                className="mr-3 p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors duration-200"
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-75 animate-pulse"></div>
                  <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl">
                    <Globe className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    Управление баннерами
                  </h1>
                  <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400">
                    Промо контент и объявления
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={forceRefreshCache} 
                disabled={isRefreshing}
                className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                data-testid="button-refresh-cache"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isRefreshing ? "Обновление..." : "Обновить кеш"}</span>
              </Button>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                    data-testid="button-create-banner"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Создать баннер
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Создать новый баннер</DialogTitle>
                  </DialogHeader>
                  <BannerForm
                    onSubmit={handleCreateSubmit}
                    isLoading={createBannerMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 lg:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <Card className="bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-2">
                <Globe className="w-6 h-6 lg:w-8 lg:h-8 text-purple-100" />
                <Badge className="bg-white/20 text-white border-white/30 text-xs">Всего</Badge>
              </div>
              <p className="text-2xl lg:text-3xl font-bold mb-1">{banners.length}</p>
              <p className="text-purple-100 text-sm">Всех баннеров</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-6 h-6 lg:w-8 lg:h-8 text-green-100" />
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
              <p className="text-2xl lg:text-3xl font-bold mb-1">{banners.filter((b: any) => b.active).length}</p>
              <p className="text-green-100 text-sm">Активных</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-2">
                <PauseCircle className="w-6 h-6 lg:w-8 lg:h-8 text-orange-100" />
                <Badge className="bg-white/20 text-white border-white/30 text-xs">Неактивные</Badge>
              </div>
              <p className="text-2xl lg:text-3xl font-bold mb-1">{banners.filter((b: any) => !b.active).length}</p>
              <p className="text-orange-100 text-sm">Отключено</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-2">
                <Star className="w-6 h-6 lg:w-8 lg:h-8 text-blue-100" />
                <Badge className="bg-white/20 text-white border-white/30 text-xs">Приоритет</Badge>
              </div>
              <p className="text-2xl lg:text-3xl font-bold mb-1">{Math.max(...banners.map((b: any) => b.priority || 0), 0)}</p>
              <p className="text-blue-100 text-sm">Макс приоритет</p>
            </CardContent>
          </Card>
        </div>

      <div className="grid gap-4">
        {(banners as Banner[]).map((banner: Banner) => (
          <Card key={banner.id} className={`${banner.isActive ? '' : 'opacity-60'}`} data-testid={`card-banner-${banner.id}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{banner.title}</CardTitle>
                  {banner.subtitle && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {banner.subtitle}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleBannerActive(banner)}
                    data-testid={`button-toggle-${banner.id}`}
                  >
                    {banner.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingBanner(banner)}
                    data-testid={`button-edit-${banner.id}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteBannerMutation.mutate(banner.id)}
                    data-testid={`button-delete-${banner.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div
                  className="w-16 h-16 rounded-lg border-2 border-gray-200 flex items-center justify-center text-white text-xs font-semibold"
                  style={{ backgroundColor: banner.backgroundColor || "#6366f1" }}
                >
                  Цвет
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">{banner.message}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Тип: {banner.type}</span>
                    <span>Приоритет: {banner.priority}</span>
                    <span>Статус: {banner.isActive ? 'Активен' : 'Неактивен'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingBanner} onOpenChange={() => setEditingBanner(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать баннер</DialogTitle>
          </DialogHeader>
          {editingBanner && (
            <BannerForm
              banner={editingBanner}
              onSubmit={handleEditSubmit}
              isLoading={updateBannerMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}