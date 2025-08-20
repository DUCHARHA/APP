
import { useState } from "react";
import { Palette, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const PRESET_COLORS = {
  primary: [
    { name: "Фиолетовый", value: "#6366f1" },
    { name: "Синий", value: "#3b82f6" },
    { name: "Изумрудный", value: "#10b981" },
    { name: "Красный", value: "#ef4444" },
    { name: "Оранжевый", value: "#f97316" },
    { name: "Розовый", value: "#ec4899" },
  ],
  accent: [
    { name: "Зеленый", value: "#10b981" },
    { name: "Голубой", value: "#06b6d4" },
    { name: "Желтый", value: "#f59e0b" },
    { name: "Индиго", value: "#6366f1" },
    { name: "Лайм", value: "#84cc16" },
    { name: "Пурпурный", value: "#a855f7" },
  ],
};

export function ColorCustomizer() {
  const { preferences, updatePreferences, isLoading } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleColorChange = async (type: 'primaryColor' | 'accentColor', color: string) => {
    await updatePreferences({ [type]: color });
  };

  const resetToDefault = async () => {
    await updatePreferences({
      primaryColor: "#6366f1",
      accentColor: "#10b981",
      backgroundColor: null,
      customCss: null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Palette className="w-4 h-4" />
          Настроить цвета
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Настройка цветов</DialogTitle>
          <DialogDescription>
            Выберите цвета для персонализации интерфейса. Изменения сохраняются автоматически.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Primary Color */}
          <div>
            <h4 className="text-sm font-medium mb-3">Основной цвет</h4>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_COLORS.primary.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleColorChange('primaryColor', color.value)}
                  className={`relative w-full h-12 rounded-lg border-2 transition-all hover:scale-105 ${
                    preferences.primaryColor === color.value
                      ? 'border-gray-900 dark:border-gray-100 ring-2 ring-offset-2 ring-gray-400'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                  disabled={isLoading}
                >
                  {preferences.primaryColor === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 bg-white rounded-full shadow-lg" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <h4 className="text-sm font-medium mb-3">Акцентный цвет</h4>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_COLORS.accent.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleColorChange('accentColor', color.value)}
                  className={`relative w-full h-12 rounded-lg border-2 transition-all hover:scale-105 ${
                    preferences.accentColor === color.value
                      ? 'border-gray-900 dark:border-gray-100 ring-2 ring-offset-2 ring-gray-400'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                  disabled={isLoading}
                >
                  {preferences.accentColor === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 bg-white rounded-full shadow-lg" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Reset button */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetToDefault}
              className="gap-2"
              disabled={isLoading}
            >
              <RotateCcw className="w-4 h-4" />
              Сбросить
            </Button>
            
            {isLoading && (
              <span className="text-sm text-gray-500">Сохранение...</span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
