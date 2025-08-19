import { Link } from "wouter";
import { ArrowLeft, MessageCircle, Phone, Mail, Clock, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Help() {
  const faqItems = [
    {
      question: "Сколько времени занимает доставка?",
      answer: "Мы доставляем заказы в течение 10-15 минут с момента оформления. В часы пик время доставки может увеличиться до 20 минут.",
    },
    {
      question: "Какая минимальная сумма заказа?",
      answer: "Минимальной суммы заказа нет. Доставка всегда бесплатная для всех заказов.",
    },
    {
      question: "Можно ли отменить заказ?",
      answer: "Да, вы можете отменить заказ до того, как он передан в сборку. Обычно это первые 2-3 минуты после оформления.",
    },
    {
      question: "Какие способы оплаты доступны?",
      answer: "Мы принимаем оплату картой онлайн (Visa, MasterCard, МИР) и наличными курьеру при получении заказа.",
    },
    {
      question: "Что делать, если товар не подошел?",
      answer: "Если товар не соответствует описанию или имеет дефекты, сообщите об этом курьеру или свяжитесь с поддержкой. Мы заменим товар или вернем деньги.",
    },
    {
      question: "Как использовать промокоды?",
      answer: "Введите промокод в специальное поле при оформлении заказа. Скидка применится автоматически к общей сумме заказа.",
    },
  ];

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
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Помощь</h1>
        </div>
      </header>

      {/* Contact Support */}
      <section className="p-4">
        <div className="bg-gradient-to-r from-agent-purple to-purple-600 rounded-xl p-4 text-white mb-6">
          <h3 className="font-bold text-lg mb-2">Нужна помощь?</h3>
          <p className="text-purple-100 text-sm mb-3">
            Наша служба поддержки готова помочь 24/7
          </p>
          <div className="flex space-x-2">
            <Button 
              className="bg-white text-agent-purple hover:bg-gray-100 flex-1"
              onClick={() => window.open('tel:+992971844884')}
            >
              <Phone className="w-4 h-4 mr-2" />
              Позвонить
            </Button>
            <Button 
              className="bg-white/20 hover:bg-white/30 text-white flex-1"
              onClick={() => window.open('https://t.me/DilovarAkhi')}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Чат
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="p-4">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <HelpCircle className="w-5 h-5 mr-2 text-agent-purple" />
          Частые вопросы
        </h3>
        <div className="space-y-3">
          {faqItems.map((item, index) => (
            <details key={index} className="bg-white dark:bg-card rounded-xl shadow-sm">
              <summary className="p-4 cursor-pointer font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl">
                {item.question}
              </summary>
              <div className="px-4 pb-4 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Working Hours */}
      <section className="p-4">
        <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-electric-green" />
            Время работы
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Доставка</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">c 7:00 до 23:00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Поддержка</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">Круглосуточно</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="p-4">
        <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">Контакты</h3>
          <div className="space-y-3 text-sm">
            <button 
              onClick={() => window.open('tel:+992971844884')}
              className="flex items-center space-x-3 w-full p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Phone className="w-4 h-4 text-gray-400" />
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-gray-100">+992 971 84 48 84</div>
                <div className="text-gray-500 dark:text-gray-400">Горячая линия</div>
              </div>
            </button>
            <button 
              onClick={() => window.open('mailto:Ducharha@gmail.com')}
              className="flex items-center space-x-3 w-full p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Mail className="w-4 h-4 text-gray-400" />
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-gray-100">Ducharha@gmail.com</div>
                <div className="text-gray-500 dark:text-gray-400">Почта поддержки</div>
              </div>
            </button>
            <button 
              onClick={() => window.open('https://t.me/DilovarAkhi')}
              className="flex items-center space-x-3 w-full p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-gray-400" />
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-gray-100">@DilovarAkhi</div>
                <div className="text-gray-500 dark:text-gray-400">Telegram</div>
              </div>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}