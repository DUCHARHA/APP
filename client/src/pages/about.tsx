import { Link } from "wouter";
import { ArrowLeft, Smartphone, Mail, Globe, Star, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function About() {
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
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-about-title">
            О приложении
          </h1>
        </div>
      </header>

      {/* App Info Header */}
      <section className="p-4">
        <div className="bg-gradient-to-r from-agent-purple to-purple-600 rounded-xl p-6 text-white mb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-1" data-testid="text-app-name">
                ДУЧАРХА - Доставка продуктов
              </h2>
              <p className="text-purple-100 text-sm">
                Быстрая доставка продуктов за 15 минут
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* App Version */}
      <section className="p-4">
        <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="w-5 h-5 text-agent-purple" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Версия приложения</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Текущая установленная версия</p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-agent-purple" data-testid="text-app-version">1.0.0</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Стабильная</div>
            </div>
          </div>
        </div>
      </section>

      {/* App Features */}
      <section className="p-4">
        <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm mb-4">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">
            Возможности приложения
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-electric-green rounded-full flex-shrink-0"></div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Доставка продуктов за 15 минут
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-electric-green rounded-full flex-shrink-0"></div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Широкий ассортимент товаров
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-electric-green rounded-full flex-shrink-0"></div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Удобный интерфейс и быстрое оформление заказов
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-electric-green rounded-full flex-shrink-0"></div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Отслеживание заказа в режиме реального времени
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-electric-green rounded-full flex-shrink-0"></div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Несколько способов оплаты
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="p-4">
        <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm mb-4">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">
            Техническая поддержка
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => window.open('mailto:support@example.com')}
              className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              data-testid="button-contact-support"
            >
              <Mail className="w-5 h-5 text-gray-400" />
              <div className="text-left flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100">support@example.com</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Техническая поддержка</div>
              </div>
            </button>
            
            <button
              onClick={() => window.open('mailto:Ducharha@gmail.com')}
              className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              data-testid="button-contact-general"
            >
              <Mail className="w-5 h-5 text-gray-400" />
              <div className="text-left flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100">Ducharha@gmail.com</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Общие вопросы</div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Developer Info */}
      <section className="p-4">
        <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">
            О разработчике
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            <p className="mb-2">
              ДУЧАРХА - это современный сервис доставки продуктов, созданный для удобства наших клиентов в Таджикистане.
            </p>
            <p className="mb-4">
              Мы стремимся предоставить быстрый и качественный сервис доставки, который экономит ваше время и делает покупки максимально удобными.
            </p>
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">Сделано с ❤️ для наших клиентов</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}