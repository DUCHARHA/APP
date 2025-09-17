import { Link } from "wouter";
import { ArrowLeft, Shield, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  return (
    <main className="pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-card shadow-sm sticky top-0 z-40">
        <div className="flex items-center p-4">
          <Link href="/profile">
            <button className="mr-3 p-2 -ml-2" data-testid="button-back">
              <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-privacy-title">
            Политика конфиденциальности
          </h1>
        </div>
      </header>

      {/* Privacy Policy Content */}
      <section className="p-4">
        <div className="bg-gradient-to-r from-agent-purple to-purple-600 rounded-xl p-4 text-white mb-6">
          <h3 className="font-bold text-lg mb-2 flex items-center">
            <Shield className="w-6 h-6 mr-2" />
            Защита ваших данных
          </h3>
          <p className="text-purple-100 text-sm">
            Мы серьезно относимся к защите вашей личной информации и придерживаемся высоких стандартов конфиденциальности.
          </p>
        </div>
      </section>

      {/* Placeholder Content */}
      <section className="p-4">
        <div className="bg-white dark:bg-card rounded-xl p-6 shadow-sm">
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <Shield className="w-16 h-16 mx-auto opacity-50" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2" data-testid="text-placeholder-title">
              PrivacyPolicyPlaceholder
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
              Здесь будет размещен полный текст политики конфиденциальности приложения ДУЧАРХА.
            </p>
            
            <Button
              onClick={() => window.open('https://example.com/privacy', '_blank')}
              className="bg-agent-purple hover:bg-purple-700 text-white"
              data-testid="button-external-privacy"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Читать полную версию
            </Button>
          </div>
        </div>
      </section>

      {/* Additional Info */}
      <section className="p-4">
        <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">
            Основные принципы
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-agent-purple rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Прозрачность</div>
                <div className="text-gray-600 dark:text-gray-400">
                  Мы ясно объясняем, какие данные собираем и как их используем
                </div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-agent-purple rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Безопасность</div>
                <div className="text-gray-600 dark:text-gray-400">
                  Используем современные методы защиты для обеспечения безопасности ваших данных
                </div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-agent-purple rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Контроль</div>
                <div className="text-gray-600 dark:text-gray-400">
                  Вы можете управлять своими данными и настройками конфиденциальности
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="p-4">
        <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">
            Вопросы по конфиденциальности
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
            Если у вас есть вопросы о нашей политике конфиденциальности, свяжитесь с нами:
          </p>
          <Button
            variant="outline"
            onClick={() => window.open('mailto:Ducharha@gmail.com')}
            className="w-full"
            data-testid="button-contact-privacy"
          >
            Связаться с нами
          </Button>
        </div>
      </section>
    </main>
  );
}