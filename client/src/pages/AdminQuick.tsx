import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Palette, RefreshCw, Save } from "lucide-react";
import type { Banner } from "@shared/schema";

export default function AdminQuick() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { data: banners = [] } = useQuery<Banner[]>({
    queryKey: ['/api/banners/all'],
    staleTime: 0, // Always fresh
    gcTime: 0, // No cache
  });

  const updateBannerMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => fetch(`/api/banners/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/banners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/banners/all'] });
      toast({ title: "Обновлено", description: "Баннер успешно обновлен" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось обновить баннер", variant: "destructive" });
    }
  });

  const forceRefresh = () => {
    setIsLoading(true);
    // Invalidate all banner-related queries
    queryClient.invalidateQueries({ queryKey: ['/api/banners'] });
    queryClient.invalidateQueries({ queryKey: ['/api/banners/all'] });
    
    // Force reload the page after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const updateBannerColor = (bannerId: string, color: string) => {
    updateBannerMutation.mutate({ id: bannerId, backgroundColor: color });
  };

  const firstBanner = banners.find(b => b.priority === 0);
  const secondBanner = banners.find(b => b.priority === 1);
  const thirdBanner = banners.find(b => b.priority === 2);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Быстрое управление баннерами</h1>
        <Button onClick={forceRefresh} disabled={isLoading} data-testid="button-refresh">
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? "Обновление..." : "Обновить страницу"}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* First Banner */}
        {firstBanner && (
          <Card data-testid="card-first-banner">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Первый баннер (Доставка)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Текущий цвет</Label>
                  <div 
                    className="w-full h-12 rounded border-2 border-gray-300 flex items-center justify-center text-white text-sm font-semibold"
                    style={{ backgroundColor: firstBanner.backgroundColor || "#22c55e" }}
                  >
                    {firstBanner.backgroundColor || "#22c55e"}
                  </div>
                </div>
                <div>
                  <Label htmlFor="first-color">Новый цвет</Label>
                  <div className="flex gap-2">
                    <Input
                      id="first-color"
                      type="color"
                      defaultValue={firstBanner.backgroundColor || "#22c55e"}
                      className="w-16 h-10 p-1"
                      data-testid="input-first-banner-color"
                      onChange={(e) => updateBannerColor(firstBanner.id, e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.getElementById('first-color') as HTMLInputElement;
                        if (input) updateBannerColor(firstBanner.id, input.value);
                      }}
                      data-testid="button-update-first-banner"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Применить
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateBannerColor(firstBanner.id, "#00539A")}
                    className="w-full"
                    data-testid="button-blue-first"
                  >
                    Синий #00539A
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateBannerColor(firstBanner.id, "#22c55e")}
                    className="w-full"
                    data-testid="button-green-first"
                  >
                    Зелёный #22c55e
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Second Banner */}
        {secondBanner && (
          <Card data-testid="card-second-banner">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Второй баннер ({secondBanner.title})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Текущий цвет</Label>
                  <div 
                    className="w-full h-12 rounded border-2 border-gray-300 flex items-center justify-center text-white text-sm font-semibold"
                    style={{ backgroundColor: secondBanner.backgroundColor || "#f97316" }}
                  >
                    {secondBanner.backgroundColor || "#f97316"}
                  </div>
                </div>
                <div>
                  <Label htmlFor="second-color">Новый цвет</Label>
                  <div className="flex gap-2">
                    <Input
                      id="second-color"
                      type="color"
                      defaultValue={secondBanner.backgroundColor || "#f97316"}
                      className="w-16 h-10 p-1"
                      data-testid="input-second-banner-color"
                      onChange={(e) => updateBannerColor(secondBanner.id, e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.getElementById('second-color') as HTMLInputElement;
                        if (input) updateBannerColor(secondBanner.id, input.value);
                      }}
                      data-testid="button-update-second-banner"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Применить
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateBannerColor(secondBanner.id, "#dc2626")}
                    className="w-full"
                    data-testid="button-red-second"
                  >
                    Красный #dc2626
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateBannerColor(secondBanner.id, "#f97316")}
                    className="w-full"
                    data-testid="button-orange-second"
                  >
                    Оранжевый #f97316
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Third Banner */}
        {thirdBanner && (
          <Card data-testid="card-third-banner">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Третий баннер ({thirdBanner.title})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Текущий цвет</Label>
                  <div 
                    className="w-full h-12 rounded border-2 border-gray-300 flex items-center justify-center text-white text-sm font-semibold"
                    style={{ backgroundColor: thirdBanner.backgroundColor || "#3b82f6" }}
                  >
                    {thirdBanner.backgroundColor || "#3b82f6"}
                  </div>
                </div>
                <div>
                  <Label htmlFor="third-color">Новый цвет</Label>
                  <div className="flex gap-2">
                    <Input
                      id="third-color"
                      type="color"
                      defaultValue={thirdBanner.backgroundColor || "#3b82f6"}
                      className="w-16 h-10 p-1"
                      data-testid="input-third-banner-color"
                      onChange={(e) => updateBannerColor(thirdBanner.id, e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.getElementById('third-color') as HTMLInputElement;
                        if (input) updateBannerColor(thirdBanner.id, input.value);
                      }}
                      data-testid="button-update-third-banner"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Применить
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateBannerColor(thirdBanner.id, "#7c3aed")}
                    className="w-full"
                    data-testid="button-purple-third"
                  >
                    Фиолетовый #7c3aed
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateBannerColor(thirdBanner.id, "#3b82f6")}
                    className="w-full"
                    data-testid="button-blue-third"
                  >
                    Синий #3b82f6
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Инструкция:</h3>
        <ul className="text-sm space-y-1">
          <li>1. Выберите цвет с помощью палитры или нажмите готовые кнопки</li>
          <li>2. Нажмите "Применить" для сохранения изменений</li>
          <li>3. Если изменения не видны на главной странице, нажмите "Обновить страницу"</li>
          <li>4. Все изменения сохраняются в базе данных навсегда</li>
        </ul>
      </div>
    </div>
  );
}