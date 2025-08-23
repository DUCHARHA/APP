import React from 'react';
import { useOnboarding } from './onboarding-provider';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  ShoppingCart, 
  Clock, 
  MapPin, 
  Gift, 
  ChevronRight, 
  ChevronLeft, 
  X,
  Truck,
  Shield,
  Sparkles
} from 'lucide-react';

const OnboardingStep1 = () => (
  <div className="text-center space-y-6">
    <div className="w-20 h-20 bg-gradient-to-br from-[#5B21B6] to-purple-600 rounded-full flex items-center justify-center mx-auto">
      <div className="text-3xl">👋</div>
    </div>
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        Добро пожаловать в ДУЧАРХА!
      </h2>
      <p className="text-gray-600 leading-relaxed">
        Мы доставляем свежие продукты прямо к вашей двери всего за 10-15 минут. 
        Давайте познакомим вас с основными возможностями приложения.
      </p>
    </div>
  </div>
);

const OnboardingStep2 = () => (
  <div className="text-center space-y-6">
    <div className="w-20 h-20 bg-gradient-to-br from-electric-green to-emerald-500 rounded-full flex items-center justify-center mx-auto">
      <Clock className="w-10 h-10 text-white" />
    </div>
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        Экспресс-доставка
      </h2>
      <p className="text-gray-600 leading-relaxed mb-4">
        Получайте продукты за 10-15 минут! Наши курьеры работают круглосуточно.
      </p>
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <div className="flex items-center space-x-3">
          <Truck className="w-5 h-5 text-electric-green" />
          <span className="text-sm text-gray-700">Бесплатная доставка без минимальной суммы</span>
        </div>
        <div className="flex items-center space-x-3">
          <Shield className="w-5 h-5 text-electric-green" />
          <span className="text-sm text-gray-700">Гарантия качества и свежести</span>
        </div>
        <div className="flex items-center space-x-3">
          <Clock className="w-5 h-5 text-electric-green" />
          <span className="text-sm text-gray-700">Работаем 24/7</span>
        </div>
      </div>
    </div>
  </div>
);

const OnboardingStep3 = () => (
  <div className="text-center space-y-6">
    <div className="w-20 h-20 bg-gradient-to-br from-bright-orange to-orange-500 rounded-full flex items-center justify-center mx-auto">
      <ShoppingCart className="w-10 h-10 text-white" />
    </div>
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        Легкие покупки
      </h2>
      <p className="text-gray-600 leading-relaxed mb-4">
        Находите нужные продукты, добавляйте в корзину и оформляйте заказ в несколько касаний.
      </p>
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-blue-600 font-semibold">1</span>
            </div>
            <p className="text-gray-600">Выберите продукты</p>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-blue-600 font-semibold">2</span>
            </div>
            <p className="text-gray-600">Добавьте в корзину</p>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-blue-600 font-semibold">3</span>
            </div>
            <p className="text-gray-600">Укажите адрес</p>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-blue-600 font-semibold">4</span>
            </div>
            <p className="text-gray-600">Получите заказ</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const OnboardingStep4 = () => (
  <div className="text-center space-y-6">
    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
      <MapPin className="w-10 h-10 text-white" />
    </div>
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        Точная доставка
      </h2>
      <p className="text-gray-600 leading-relaxed mb-4">
        Мы доставляем по всему городу. Укажите свой адрес для расчета точного времени доставки.
      </p>
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <MapPin className="w-5 h-5 text-purple-600" />
          <span className="font-medium text-purple-800">Зоны доставки</span>
        </div>
        <p className="text-sm text-purple-700">
          Доставляем в пределах города и ближайших районов. 
          Проверим возможность доставки по вашему адресу.
        </p>
      </div>
    </div>
  </div>
);

const OnboardingStep5 = () => (
  <div className="text-center space-y-6">
    <div className="w-20 h-20 bg-gradient-to-br from-electric-green to-teal-500 rounded-full flex items-center justify-center mx-auto">
      <Gift className="w-10 h-10 text-white" />
    </div>
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        Специальное предложение!
      </h2>
      <p className="text-gray-600 leading-relaxed mb-4">
        Получите скидку 20% на первый заказ. Промокод уже активирован!
      </p>
      <div className="bg-gradient-to-r from-electric-green to-teal-400 rounded-xl p-4 text-white">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Sparkles className="w-5 h-5" />
          <span className="font-bold text-lg">ПЕРВЫЙ</span>
          <Sparkles className="w-5 h-5" />
        </div>
        <p className="text-green-100 text-sm">
          Промокод активирован автоматически для вашего первого заказа
        </p>
      </div>
      <p className="text-sm text-gray-500 mt-4">
        Готовы начать покупки в ДУЧАРХА?
      </p>
    </div>
  </div>
);

const stepComponents = [
  OnboardingStep1,
  OnboardingStep2,
  OnboardingStep3,
  OnboardingStep4,
  OnboardingStep5,
];

export const OnboardingModal: React.FC = () => {
  const {
    isOnboardingActive,
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    skipOnboarding,
  } = useOnboarding();

  if (!isOnboardingActive) return null;

  const CurrentStepComponent = stepComponents[currentStep - 1];
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex-1">
            <Progress 
              value={(currentStep / totalSteps) * 100} 
              className="h-2"
            />
          </div>
          <button
            onClick={skipOnboarding}
            className="ml-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            data-testid="button-skip-onboarding"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <CurrentStepComponent />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {currentStep} из {totalSteps}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {currentStep > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
                data-testid="button-prev-step"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            
            <Button
              onClick={nextStep}
              size="sm"
              className="bg-[#5B21B6] hover:bg-[#5B21B6]/90"
              data-testid="button-next-step"
            >
              {isLastStep ? 'Начать покупки' : 'Далее'}
              {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};