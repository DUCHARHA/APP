import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface PromoCode {
  code: string;
  discount: number; // percentage
  description: string;
  isActive: boolean;
}

const promoCodes: PromoCode[] = [
  {
    code: "ПЕРВЫЙ",
    discount: 20,
    description: "Скидка 20% на первый заказ",
    isActive: true,
  },
  {
    code: "ДРУЗЬЯМ",
    discount: 15,
    description: "Скидка 15% для друзей",
    isActive: true,
  },
  {
    code: "ЛЕТОМ",
    discount: 10,
    description: "Летняя скидка 10%",
    isActive: true,
  },
];

export function usePromo() {
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const { toast } = useToast();

  const applyPromoCode = (code: string): boolean => {
    const promoCode = promoCodes.find(
      promo => promo.code.toUpperCase() === code.toUpperCase() && promo.isActive
    );

    if (promoCode) {
      setAppliedPromo(promoCode);
      toast({
        title: "Промокод применен!",
        description: `${promoCode.description}. Скидка ${promoCode.discount}%`,
      });
      return true;
    } else {
      toast({
        title: "Ошибка",
        description: "Промокод не найден или неактивен",
        variant: "destructive",
      });
      return false;
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    toast({
      title: "Промокод удален",
      description: "Скидка отменена",
    });
  };

  const calculateDiscount = (amount: number): number => {
    if (!appliedPromo) return 0;
    return (amount * appliedPromo.discount) / 100;
  };

  const calculateTotal = (amount: number): number => {
    return amount - calculateDiscount(amount);
  };

  return {
    appliedPromo,
    applyPromoCode,
    removePromoCode,
    calculateDiscount,
    calculateTotal,
  };
}