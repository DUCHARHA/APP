import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, CreditCard, Plus, Trash2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface PaymentMethod {
  id: string;
  type: "card" | "wallet";
  title: string;
  details: string;
  isDefault: boolean;
}

export default function PaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: "1",
      type: "card",
      title: "Visa •••• 4242",
      details: "Истекает 12/28",
      isDefault: true,
    },
    {
      id: "2",
      type: "wallet",
      title: "SberPay",
      details: "+7 (999) 123-45-67",
      isDefault: false,
    },
  ]);

  const [isAddingMethod, setIsAddingMethod] = useState(false);
  const [newMethod, setNewMethod] = useState({
    type: "card" as "card" | "wallet",
    cardNumber: "",
    expiryDate: "",
    holderName: "",
    walletPhone: "",
  });

  const handleAddMethod = () => {
    let method: PaymentMethod;
    
    if (newMethod.type === "card" && newMethod.cardNumber && newMethod.expiryDate && newMethod.holderName) {
      const maskedNumber = `•••• ${newMethod.cardNumber.slice(-4)}`;
      method = {
        id: Date.now().toString(),
        type: "card",
        title: `Visa ${maskedNumber}`,
        details: `Истекает ${newMethod.expiryDate}`,
        isDefault: paymentMethods.length === 0,
      };
    } else if (newMethod.type === "wallet" && newMethod.walletPhone) {
      method = {
        id: Date.now().toString(),
        type: "wallet",
        title: "SberPay",
        details: newMethod.walletPhone,
        isDefault: paymentMethods.length === 0,
      };
    } else {
      return;
    }

    setPaymentMethods([...paymentMethods, method]);
    setNewMethod({
      type: "card",
      cardNumber: "",
      expiryDate: "",
      holderName: "",
      walletPhone: "",
    });
    setIsAddingMethod(false);
  };

  const handleDeleteMethod = (id: string) => {
    setPaymentMethods(paymentMethods.filter(method => method.id !== id));
  };

  const handleSetDefault = (id: string) => {
    setPaymentMethods(paymentMethods.map(method => ({
      ...method,
      isDefault: method.id === id,
    })));
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case "card": return CreditCard;
      case "wallet": return Smartphone;
      default: return CreditCard;
    }
  };

  return (
    <main className="pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <Link href="/profile">
              <button className="mr-3 p-2 -ml-2">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Способы оплаты</h1>
              <p className="text-sm text-gray-500">{paymentMethods.length} способов</p>
            </div>
          </div>
          
          <Dialog open={isAddingMethod} onOpenChange={setIsAddingMethod}>
            <DialogTrigger asChild>
              <button className="bg-agent-purple text-white p-2 rounded-lg">
                <Plus className="w-5 h-5" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>Добавить способ оплаты</DialogTitle>
                <DialogDescription>
                  Добавьте новую банковскую карту или электронный кошелек для оплаты заказов
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Тип оплаты</Label>
                  <RadioGroup
                    value={newMethod.type}
                    onValueChange={(value) => 
                      setNewMethod({ ...newMethod, type: value as "card" | "wallet" })
                    }
                    className="flex flex-row space-x-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="card" id="card-type" />
                      <Label htmlFor="card-type">Банковская карта</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="wallet" id="wallet-type" />
                      <Label htmlFor="wallet-type">Кошелек</Label>
                    </div>
                  </RadioGroup>
                </div>

                {newMethod.type === "card" ? (
                  <>
                    <div>
                      <Label htmlFor="card-number">Номер карты</Label>
                      <Input
                        id="card-number"
                        placeholder="1234 5678 9012 3456"
                        value={newMethod.cardNumber}
                        onChange={(e) => setNewMethod({ ...newMethod, cardNumber: e.target.value })}
                        maxLength={19}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="expiry">Срок действия</Label>
                        <Input
                          id="expiry"
                          placeholder="MM/YY"
                          value={newMethod.expiryDate}
                          onChange={(e) => setNewMethod({ ...newMethod, expiryDate: e.target.value })}
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          maxLength={3}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="holder">Имя владельца</Label>
                      <Input
                        id="holder"
                        placeholder="IVAN IVANOV"
                        value={newMethod.holderName}
                        onChange={(e) => setNewMethod({ ...newMethod, holderName: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <Label htmlFor="wallet-phone">Номер телефона</Label>
                    <Input
                      id="wallet-phone"
                      placeholder="+7 (999) 123-45-67"
                      value={newMethod.walletPhone}
                      onChange={(e) => setNewMethod({ ...newMethod, walletPhone: e.target.value })}
                    />
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingMethod(false)}
                    className="flex-1"
                  >
                    Отмена
                  </Button>
                  <Button
                    onClick={handleAddMethod}
                    className="flex-1 bg-agent-purple hover:bg-agent-purple/90"
                    disabled={
                      newMethod.type === "card" 
                        ? !newMethod.cardNumber || !newMethod.expiryDate || !newMethod.holderName
                        : !newMethod.walletPhone
                    }
                  >
                    Добавить
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Payment Methods List */}
      <section className="p-4 space-y-3">
        {paymentMethods.map((method) => {
          const MethodIcon = getMethodIcon(method.type);
          return (
            <div key={method.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-agent-purple/10 p-2 rounded-lg">
                    <MethodIcon className="w-5 h-5 text-agent-purple" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{method.title}</h3>
                      {method.isDefault && (
                        <span className="bg-agent-purple text-white text-xs px-2 py-1 rounded-full">
                          По умолчанию
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{method.details}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!method.isDefault && (
                    <button
                      onClick={() => handleSetDefault(method.id)}
                      className="text-agent-purple text-sm font-medium"
                    >
                      По умолчанию
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteMethod(method.id)}
                    className="text-red-500 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Safety Note */}
      <section className="p-4">
        <div className="bg-green-50 p-4 rounded-xl">
          <h3 className="font-semibold text-green-900 mb-2">Безопасность</h3>
          <p className="text-sm text-green-700">
            Все данные карт шифруются и хранятся в соответствии со стандартами PCI DSS. 
            Мы не сохраняем CVV-коды и используем токенизацию для безопасных платежей.
          </p>
        </div>
      </section>
    </main>
  );
}