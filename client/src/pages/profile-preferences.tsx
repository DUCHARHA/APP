import { useLocation } from "wouter";
import { ArrowLeft, Palette, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppHeader from "@/components/app-header";
import { ThemePreferences } from "@/components/profile/theme-preferences";

export default function ProfilePreferences() {
  const [, setLocation] = useLocation();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <AppHeader
        title="Настройки и предпочтения"
        showBack={true}
        onBack={() => setLocation("/profile")}
      />

      <div className="p-4">
        <Tabs defaultValue="theme" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="theme" className="flex items-center space-x-2" data-testid="tab-theme">
              <Palette className="w-4 h-4" />
              <span>Тема</span>
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center space-x-2" data-testid="tab-general">
              <Settings className="w-4 h-4" />
              <span>Общие</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="theme" className="space-y-6">
            <ThemePreferences />
          </TabsContent>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Дополнительные настройки</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Дополнительные настройки приложения будут добавлены в будущих обновлениях.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}