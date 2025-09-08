import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, MapPin, Plus, Trash2, Home, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Address {
  id: string;
  title: string;
  address: string;
  type: "home" | "work" | "other";
  isDefault: boolean;
}

export default function Addresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);

  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    title: "",
    address: "",
    type: "home" as "home" | "work" | "other",
  });

  const handleAddAddress = () => {
    if (newAddress.title && newAddress.address) {
      const address: Address = {
        id: Date.now().toString(),
        ...newAddress,
        isDefault: addresses.length === 0,
      };
      setAddresses([...addresses, address]);
      setNewAddress({ title: "", address: "", type: "home" });
      setIsAddingAddress(false);
    }
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses(addresses.filter(addr => addr.id !== id));
  };

  const handleSetDefault = (id: string) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id,
    })));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "home": return Home;
      case "work": return Building;
      default: return MapPin;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "home": return "Дом";
      case "work": return "Работа";
      default: return "Другое";
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
              <h1 className="text-xl font-bold text-gray-900">Адреса доставки</h1>
              <p className="text-sm text-gray-500">{addresses.length} адресов</p>
            </div>
          </div>
          
          <Dialog open={isAddingAddress} onOpenChange={setIsAddingAddress}>
            <DialogTrigger asChild>
              <button className="bg-agent-purple text-white p-2 rounded-lg">
                <Plus className="w-5 h-5" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>Добавить адрес</DialogTitle>
                <DialogDescription>
                  Добавьте новый адрес доставки для быстрого оформления заказов
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Название</Label>
                  <Input
                    id="title"
                    placeholder="Дом, Работа, Дача..."
                    value={newAddress.title}
                    onChange={(e) => setNewAddress({ ...newAddress, title: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="address">Адрес</Label>
                  <Textarea
                    id="address"
                    placeholder="Введите полный адрес"
                    value={newAddress.address}
                    onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                    className="min-h-[80px]"
                  />
                </div>

                <div>
                  <Label>Тип адреса</Label>
                  <RadioGroup
                    value={newAddress.type}
                    onValueChange={(value) => 
                      setNewAddress({ ...newAddress, type: value as "home" | "work" | "other" })
                    }
                    className="flex flex-row space-x-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="home" id="home" />
                      <Label htmlFor="home">Дом</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="work" id="work" />
                      <Label htmlFor="work">Работа</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other">Другое</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingAddress(false)}
                    className="flex-1"
                  >
                    Отмена
                  </Button>
                  <Button
                    onClick={handleAddAddress}
                    className="flex-1 bg-agent-purple hover:bg-agent-purple/90"
                    disabled={!newAddress.title || !newAddress.address}
                  >
                    Добавить
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Addresses List */}
      <section className="p-4 space-y-3">
        {addresses.map((address) => {
          const TypeIcon = getTypeIcon(address.type);
          return (
            <div key={address.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="bg-electric-green/10 p-2 rounded-lg">
                    <TypeIcon className="w-5 h-5 text-electric-green" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{address.title}</h3>
                      {address.isDefault && (
                        <span className="bg-agent-purple text-white text-xs px-2 py-1 rounded-full">
                          По умолчанию
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{address.address}</p>
                    <p className="text-xs text-gray-500">{getTypeText(address.type)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="text-agent-purple text-sm font-medium"
                    >
                      По умолчанию
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteAddress(address.id)}
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

      {/* Tip */}
      <section className="p-4">
        <div className="bg-blue-50 p-4 rounded-xl">
          <h3 className="font-semibold text-blue-900 mb-2">Совет</h3>
          <p className="text-sm text-blue-700">
            Добавьте несколько адресов для быстрого выбора при оформлении заказа. 
            Адрес по умолчанию будет автоматически выбран при оформлении.
          </p>
        </div>
      </section>
    </main>
  );
}