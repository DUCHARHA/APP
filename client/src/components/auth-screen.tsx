import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, User, Phone, LogIn, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loginUser, continueAsGuest } from "@/utils/auth-state";
import AppHeader from "@/components/app-header";

interface AuthScreenProps {
  onAuthComplete: () => void;
  onBack?: () => void;
}

export default function AuthScreen({ onAuthComplete, onBack }: AuthScreenProps) {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });
  const { toast } = useToast();

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, введите ваше имя",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.phone.trim()) {
      toast({
        title: "Ошибка", 
        description: "Пожалуйста, введите номер телефона",
        variant: "destructive",
      });
      return;
    }

    // Сохраняем данные пользователя
    loginUser(formData.name.trim(), formData.phone.trim());
    
    toast({
      title: "Добро пожаловать!",
      description: `Рады видеть вас, ${formData.name}`,
    });
    
    onAuthComplete();
  };

  const handleContinueAsGuest = () => {
    continueAsGuest();
    toast({
      title: "Добро пожаловать!",
      description: "Вы продолжаете как гость",
    });
    onAuthComplete();
  };

  const handleBackToOptions = () => {
    setShowLoginForm(false);
    setFormData({ name: "", phone: "" });
  };

  if (showLoginForm) {
    return (
      <main className="min-h-screen bg-background pb-20">
        <AppHeader
          title="Войти в профиль"
          showBack={true}
          onBack={handleBackToOptions}
        />
        
        <div className="p-4">
          <div className="bg-white dark:bg-card rounded-xl p-6 shadow-sm">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#5B21B6] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-[#5B21B6]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Создание профиля
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Введите ваши данные для создания персонального профиля
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Ваше имя
                </label>
                <Input
                  data-testid="input-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                  placeholder="Введите ваше имя"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Номер телефона
                </label>
                <Input
                  data-testid="input-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                  placeholder="Например: +992 XX XXX XX XX"
                  className="w-full"
                />
              </div>

              <Button
                data-testid="button-submit-login"
                type="submit"
                className="w-full bg-[#5B21B6] hover:bg-[#4C1D95] text-white"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Войти в профиль
              </Button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      <AppHeader
        title="Профиль"
        showBack={onBack ? true : false}
        onBack={onBack}
      />
      
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] p-4">
        <div className="bg-white dark:bg-card rounded-xl p-6 shadow-sm w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-[#5B21B6] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-[#5B21B6]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Добро пожаловать!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Выберите способ использования приложения
            </p>
          </div>

          <div className="space-y-4">
            <Button
              data-testid="button-login-profile"
              onClick={() => setShowLoginForm(true)}
              className="w-full bg-[#5B21B6] hover:bg-[#4C1D95] text-white h-14"
            >
              <LogIn className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Войти в профиль</div>
                <div className="text-sm opacity-90">Создать персональный аккаунт</div>
              </div>
            </Button>

            <Button
              data-testid="button-continue-guest"
              onClick={handleContinueAsGuest}
              variant="outline"
              className="w-full border-2 border-gray-200 dark:border-gray-600 h-14"
            >
              <UserPlus className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Продолжить как гость</div>
                <div className="text-sm text-gray-500">Использовать без регистрации</div>
              </div>
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Вы можете изменить это позже в настройках профиля
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}