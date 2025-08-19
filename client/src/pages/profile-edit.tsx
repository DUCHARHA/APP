import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, User, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function ProfileEdit() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // В реальном приложении данные получаются из auth context
  const [formData, setFormData] = useState({
    name: "Анна Иванова",
    email: "anna@example.com", 
    phone: "+7 (999) 123-45-67",
  });

  const handleSave = () => {
    // В реальном приложении здесь будет API вызов для обновления данных
    localStorage.setItem("userProfile", JSON.stringify(formData));
    toast({
      title: "Данные обновлены",
      description: "Ваш профиль успешно обновлен",
    });
    setLocation("/profile");
  };

  return (
    <main className="pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-card shadow-sm sticky top-0 z-40">
        <div className="flex items-center p-4">
          <Link href="/profile">
            <button className="mr-3 p-2 -ml-2">
              <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Редактировать профиль</h1>
        </div>
      </header>

      {/* Form */}
      <section className="p-4 space-y-4">
        <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Имя
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
              placeholder="Введите ваше имя"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Phone className="w-4 h-4 inline mr-2" />
              Телефон
            </label>
            <Input
              value={formData.phone}
              disabled
              className="bg-gray-100 cursor-not-allowed"
              placeholder="Номер телефона нельзя изменять"
            />
            <p className="text-xs text-gray-500 mt-1">Для изменения номера обратитесь в поддержку</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email
            </label>
            <Input
              value={formData.email}
              disabled
              className="bg-gray-100 cursor-not-allowed"
              placeholder="Email нельзя изменять"
              type="email"
            />
            <p className="text-xs text-gray-500 mt-1">Для изменения email обратитесь в поддержку</p>
          </div>
        </div>

        <Button 
          onClick={handleSave}
          className="w-full bg-agent-purple hover:bg-agent-purple/90 text-white"
        >
          Сохранить изменения
        </Button>
      </section>
    </main>
  );
}