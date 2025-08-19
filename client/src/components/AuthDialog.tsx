import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Phone, MessageCircle, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AuthDialog({ children, open, onOpenChange }: AuthDialogProps) {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  
  const { 
    sendCode, 
    verifyCode, 
    isLoadingSendCode, 
    isLoadingVerifyCode,
    isAuthenticated 
  } = useAuth();

  // Format phone number for display
  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.startsWith('992')) return `+${cleaned}`;
    if (cleaned.length <= 9) return `+992${cleaned}`;
    return `+${cleaned}`;
  };

  // Handle phone input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 12) {
      setPhone(value);
    }
  };

  // Send verification code
  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length >= 9) {
      const formattedPhone = formatPhone(phone);
      sendCode({ phone: formattedPhone }, {
        onSuccess: () => {
          setStep('code');
          setCountdown(300); // 5 minutes
        }
      });
    }
  };

  // Verify code
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) {
      const formattedPhone = formatPhone(phone);
      verifyCode({ phone: formattedPhone, code }, {
        onSuccess: () => {
          onOpenChange?.(false);
          setStep('phone');
          setPhone('');
          setCode('');
        }
      });
    }
  };

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Close dialog when authenticated
  useEffect(() => {
    if (isAuthenticated && open) {
      onOpenChange?.(false);
    }
  }, [isAuthenticated, open, onOpenChange]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const canResendCode = countdown === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] p-0 gap-0">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-center text-2xl font-bold">
              Вход в ДУЧАРХА
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              {step === 'phone' 
                ? 'Введите номер телефона для получения кода доступа'
                : 'Введите 6-значный код из Telegram бота @Ducharha_bot'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pb-3">
            {step === 'phone' ? (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Номер телефона
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="900123456"
                      value={phone}
                      onChange={handlePhoneChange}
                      className="pl-10 text-lg tracking-wider"
                      data-testid="input-phone"
                      autoComplete="tel"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground px-1">
                    {phone && `Номер: ${formatPhone(phone)}`}
                  </p>
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={phone.length < 9 || isLoadingSendCode}
                  data-testid="button-send-code"
                >
                  {isLoadingSendCode ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Отправляем...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Получить код
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
                    <MessageCircle className="h-8 w-8 text-blue-600 dark:text-blue-300" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Код отправлен на {formatPhone(phone)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-medium">
                    Код подтверждения
                  </Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-2xl tracking-[0.5em] font-mono"
                    data-testid="input-code"
                    maxLength={6}
                    autoComplete="one-time-code"
                    required
                  />
                  {countdown > 0 && (
                    <p className="text-xs text-amber-600 text-center">
                      Код действителен еще {formatTime(countdown)}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={code.length !== 6 || isLoadingVerifyCode}
                    data-testid="button-verify-code"
                  >
                    {isLoadingVerifyCode ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Проверяем...
                      </>
                    ) : (
                      <>
                        Войти
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-between text-sm">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStep('phone');
                        setCode('');
                        setCountdown(0);
                      }}
                      className="p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
                      data-testid="button-back-to-phone"
                    >
                      <ArrowLeft className="mr-1 h-3 w-3" />
                      Изменить номер
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const formattedPhone = formatPhone(phone);
                        sendCode({ phone: formattedPhone }, {
                          onSuccess: () => setCountdown(300)
                        });
                      }}
                      disabled={!canResendCode || isLoadingSendCode}
                      className={cn(
                        "p-0 h-auto font-normal",
                        canResendCode 
                          ? "text-blue-600 hover:text-blue-700 dark:text-blue-400" 
                          : "text-muted-foreground cursor-not-allowed"
                      )}
                      data-testid="button-resend-code"
                    >
                      {isLoadingSendCode ? (
                        <>
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          Отправка...
                        </>
                      ) : (
                        canResendCode ? 'Отправить снова' : `Повторить через ${formatTime(countdown)}`
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </CardContent>

          <CardFooter className="pt-0 pb-6">
            <p className="text-xs text-center text-muted-foreground w-full">
              Входя в систему, вы соглашаетесь с условиями использования сервиса ДУЧАРХА
            </p>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

// Simple login button component
interface LoginButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function LoginButton({ variant = "default", size = "default", className }: LoginButtonProps) {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) return null;

  return (
    <AuthDialog>
      <Button variant={variant} size={size} className={className} data-testid="button-login">
        <Phone className="mr-2 h-4 w-4" />
        Вход
      </Button>
    </AuthDialog>
  );
}