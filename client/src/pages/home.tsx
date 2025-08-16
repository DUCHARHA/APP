import { useQuery } from "@tanstack/react-query";
import { Clock, Search, Zap, Truck, Shield, Check } from "lucide-react";
import { Link } from "wouter";
import { type Category, type Product } from "@shared/schema";
import CategoryButton from "@/components/category-button";
import ProductCard from "@/components/product-card";
import PWAInstallPrompt from "@/components/pwa-install-prompt";
import { ThemeToggle } from "@/components/theme-toggle";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useCart } from "@/hooks/use-cart";
import { useState, useEffect } from "react";
import { Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePromo } from "@/hooks/use-promo";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedPromo, setCopiedPromo] = useState(false);
  const [isSearchSticky, setIsSearchSticky] = useState(false);
  const { location, error: locationError } = useGeolocation();
  const { totalItems } = useCart();
  const { appliedPromo } = usePromo();
  const { toast } = useToast();

  const copyPromoCode = async () => {
    const promoCode = "ПЕРВЫЙ";
    try {
      await navigator.clipboard.writeText(promoCode);
      setCopiedPromo(true);
      setTimeout(() => setCopiedPromo(false), 2000);
      toast({
        title: "Промокод скопирован!",
        description: `Код ${promoCode} скопирован в буфер обмена`,
      });
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = promoCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      
      setCopiedPromo(true);
      setTimeout(() => setCopiedPromo(false), 2000);
      toast({
        title: "Промокод скопирован!",
        description: `Код ${promoCode} скопирован в буфер обмена`,
      });
    }
  };

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: popularProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products", "popular"],
    queryFn: () => fetch("/api/products?popular=true").then(res => res.json()),
  });

  const { data: searchResults = [] } = useQuery<Product[]>({
    queryKey: ["/api/products", "search", searchQuery],
    queryFn: () => fetch(`/api/products?search=${encodeURIComponent(searchQuery)}`).then(res => res.json()),
    enabled: searchQuery.length > 0,
  });

  const quickCategories = categories.slice(0, 4);
  const displayProducts = searchQuery ? searchResults : popularProducts;

  // Sticky search scroll detection
  useEffect(() => {
    const handleScroll = () => {
      // Make search sticky when scrolled past the search bar in hero section
      const searchBar = document.querySelector('#main-search');
      
      if (searchBar) {
        const searchRect = searchBar.getBoundingClientRect();
        // When the search bar would disappear from view (top goes above header), make it sticky
        setIsSearchSticky(searchRect.top <= 80); // 80px to account for header height + some padding
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="pb-20 bg-background">
      {/* Floating Search Bar */}
      <div className={`fixed top-16 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4 z-50 transition-all duration-500 ${
        isSearchSticky ? 'translate-y-0 opacity-100' : 'translate-y-[-100px] opacity-0 pointer-events-none'
      }`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Поиск продуктов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 shadow-lg focus:outline-none focus:ring-2 focus:ring-agent-purple/50 focus:border-agent-purple transition-all"
          />
        </div>
      </div>

      {/* Header */}
      <header className="bg-white dark:bg-card shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-agent-purple p-2 rounded-lg">
              <Zap className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">ДУЧАРХА</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {location ? "Определяем зону доставки..." : "ул. Пушкина, 25"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <button className="relative p-2">
              <div className="fas fa-bell text-gray-600 dark:text-gray-300 text-lg" />
              <span className="absolute -top-1 -right-1 bg-bright-orange text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </button>
            <Link href="/profile">
              <button className="p-2">
                <div className="fas fa-user-circle text-gray-600 dark:text-gray-300 text-xl" />
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="gradient-hero text-white p-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className={`transition-all duration-300 ${isSearchSticky ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`}>
            <div className="flex items-center mb-4">
              <div className="delivery-pulse bg-electric-green text-white px-3 py-1 rounded-full text-sm font-semibold mr-3 flex items-center">
                <Clock className="mr-1 w-4 h-4" />
                10-15 мин
              </div>
              <span className="text-white/80 text-sm">Экспресс доставка</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">
              Доставка продуктов быстрее, чем поход в магазин
            </h2>
            <p className="text-white/90 mb-4">
              Свежие продукты к вашему столу за 10-15 минут
            </p>
          </div>
          
          {/* Search Bar */}
          <div className={`relative transition-all duration-500 ${
            isSearchSticky 
              ? 'transform scale-75 opacity-0 pointer-events-none' 
              : 'transform scale-100 opacity-100'
          }`} id="main-search">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск продуктов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-gray-900 bg-white/95 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white transition-all"
            />
          </div>
        </div>
        <div className={`absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 floating-elements transition-opacity duration-300 ${isSearchSticky ? 'opacity-0' : 'opacity-100'}`}></div>
        <div className={`absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 floating-elements transition-opacity duration-300 ${isSearchSticky ? 'opacity-0' : 'opacity-100'}`} style={{ animationDelay: '2s' }}></div>
        <div className={`absolute top-1/2 right-1/4 w-16 h-16 bg-white/5 rounded-full floating-elements transition-opacity duration-300 ${isSearchSticky ? 'opacity-0' : 'opacity-100'}`} style={{ animationDelay: '4s' }}></div>
      </section>

      {/* Quick Actions */}
      {!searchQuery && (
        <section className="p-4 -mt-6 relative z-20">
          <div className="grid grid-cols-4 gap-3">
            {quickCategories.map((category) => (
              <CategoryButton key={category.id} category={category} />
            ))}
          </div>
        </section>
      )}

      {/* Promo Banner */}
      {!searchQuery && (
        <section className="p-4">
          <div className="bg-gradient-to-r from-electric-green via-emerald-400 to-teal-400 rounded-xl p-6 text-white relative overflow-hidden card-hover">
            <div className="relative z-10">
              <div className="flex items-center mb-2">
                <div className="bg-white/20 p-2 rounded-full mr-3">
                  <div className="text-lg">🎉</div>
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-1">Скидка 20% на первый заказ</h3>
                  <p className="text-green-100 text-sm">
                    Используйте промокод <span className="font-semibold bg-white/20 px-2 py-1 rounded">ПЕРВЫЙ</span> при оформлении
                  </p>
                </div>
              </div>
              <button 
                onClick={copyPromoCode}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all mt-4 ${
                  copiedPromo 
                    ? "bg-green-600 text-white scale-105" 
                    : "bg-white text-electric-green hover:bg-gray-50 hover:scale-105 active:scale-95"
                }`}
                data-testid="button-copy-promo"
              >
                {copiedPromo ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Скопировано!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Скопировать код</span>
                  </>
                )}
              </button>
            </div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full floating-elements"></div>
            <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/5 rounded-full floating-elements" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/3 right-1/4 w-8 h-8 bg-white/10 rounded-full floating-elements" style={{ animationDelay: '3s' }}></div>
          </div>
        </section>
      )}

      {/* Products Section */}
      <section className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {searchQuery ? `Результаты поиска (${displayProducts.length})` : "Популярные товары"}
          </h3>
          {!searchQuery && (
            <Link href="/catalog">
              <button className="text-agent-purple font-medium text-sm">
                Все товары
              </button>
            </Link>
          )}
        </div>
        
        {displayProducts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? "Товары не найдены" : "Загрузка товаров..."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {displayProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Categories Section */}
      {!searchQuery && categories.length > 4 && (
        <section className="p-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Все категории</h3>
          
          <div className="space-y-3">
            {categories.slice(4).map((category) => (
              <Link key={category.id} href={`/catalog/${category.id}`}>
                <button className="w-full bg-white dark:bg-card rounded-xl p-4 shadow-sm flex items-center card-hover">
                  <img
                    src={category.imageUrl || ""}
                    alt={category.name}
                    className="w-12 h-9 rounded-lg object-cover mr-4"
                  />
                  <div className="flex-1 text-left">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{category.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Широкий выбор товаров</p>
                  </div>
                  <div className="fas fa-chevron-right text-gray-400 dark:text-gray-500" />
                </button>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Delivery Info */}
      {!searchQuery && (
        <section className="p-4 mb-4">
          <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm card-hover">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">Условия доставки</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="bg-agent-purple/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Clock className="text-agent-purple w-6 h-6" />
                </div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-200">10-15 минут</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Быстрая доставка</p>
              </div>
              <div>
                <div className="bg-electric-green/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Truck className="text-electric-green w-6 h-6" />
                </div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-200">Бесплатно от 1000₽</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Минимальный заказ</p>
              </div>
              <div>
                <div className="bg-bright-orange/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Shield className="text-bright-orange w-6 h-6" />
                </div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-200">Качество</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Гарантия свежести</p>
              </div>
            </div>
          </div>
        </section>
      )}

      <PWAInstallPrompt />
    </main>
  );
}
