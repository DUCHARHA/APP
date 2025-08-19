import { Link } from "wouter";
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag, Phone } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { AuthDialog } from "@/components/AuthDialog";
import { Button } from "@/components/ui/button";
import { usePromo } from "@/hooks/use-promo";
import { X } from "lucide-react";

export default function Cart() {
  const { isAuthenticated, user } = useAuth();
  const {
    cartItems,
    totalItems,
    totalPrice,
    isLoading,
    updateCartItem,
    removeFromCart,
    clearCart,
    isUpdatingCart,
    isRemovingFromCart,
    isClearingCart,
  } = useCart();
  
  const { appliedPromo, removePromoCode, calculateDiscount, calculateTotal } = usePromo();

  // If user is not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <main className="pb-20">
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="flex items-center p-4">
            <Link href="/catalog">
              <button className="mr-3 p-2 -ml-2" data-testid="button-back">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Корзина</h1>
          </div>
        </header>

        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <Phone className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Войдите для просмотра корзины
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm">
            Чтобы добавлять товары в корзину и оформлять заказы, необходимо войти в систему
          </p>
          <AuthDialog>
            <Button className="bg-agent-purple hover:bg-agent-purple/90" data-testid="button-login-cart">
              <Phone className="mr-2 h-4 w-4" />
              Войти
            </Button>
          </AuthDialog>
        </div>
      </main>
    );
  }

  const handleQuantityChange = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
    } else {
      updateCartItem({ itemId: id, quantity });
    }
  };

  const subtotal = totalPrice;
  const promoDiscount = appliedPromo ? calculateDiscount(subtotal) : 0;
  const totalAfterPromo = subtotal - promoDiscount;
  const deliveryFee = 0; // Всегда бесплатная доставка
  const finalTotal = totalAfterPromo + deliveryFee;

  if (isLoading) {
    return (
      <div className="pb-20">
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="flex items-center p-4">
            <Link href="/catalog">
              <button className="mr-3 p-2 -ml-2" data-testid="button-back">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Корзина</h1>
          </div>
        </header>
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 h-20 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <Link href="/catalog">
              <button className="mr-3 p-2 -ml-2" data-testid="button-back">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Корзина</h1>
              <p className="text-sm text-gray-500">{cartItems.length} товаров</p>
            </div>
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={() => clearCart()}
              className="text-gray-500 p-2"
              disabled={isClearingCart}
              data-testid="button-clear-cart"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {cartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Корзина пуста
          </h3>
          <p className="text-gray-500 text-center mb-6">
            Добавьте товары в корзину, чтобы оформить заказ
          </p>
          <Link href="/catalog">
            <Button className="bg-agent-purple hover:bg-agent-purple/90" data-testid="button-go-shopping">
              Перейти в каталог
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Cart Items */}
          <section className="p-4 space-y-3">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm" data-testid={`cart-item-${item.id}`}>
                <div className="flex items-center space-x-3">
                  {!item.product.imageUrl ? (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <div className="text-gray-400 dark:text-gray-600 text-center">
                        <div className="text-lg">📦</div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-16 h-16 rounded-lg object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const placeholder = target.nextElementSibling as HTMLDivElement;
                        if (placeholder) placeholder.style.display = 'flex';
                      }}
                    />
                  )}
                  <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 items-center justify-center" style={{display: 'none'}}>
                    <div className="text-gray-400 dark:text-gray-600 text-center">
                      <div className="text-lg">📦</div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-sm text-gray-500">{item.product.weight}</p>
                    <p className="font-bold text-gray-900">
                      {parseFloat(item.product.price).toFixed(0)} с.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"
                      disabled={isUpdatingCart}
                      data-testid={`button-decrease-${item.id}`}
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="w-8 text-center font-medium" data-testid={`quantity-${item.id}`}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-lg bg-agent-purple flex items-center justify-center"
                      disabled={isUpdatingCart}
                      data-testid={`button-increase-${item.id}`}
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Promo Code Section */}
          {appliedPromo && (
            <section className="px-4 pb-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-sm">%</span>
                    </div>
                    <div>
                      <p className="font-medium text-green-800">{appliedPromo.name}</p>
                      <p className="text-sm text-green-600">
                        Скидка {appliedPromo.discountPercent}%
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removePromoCode}
                    className="text-green-600 hover:text-green-800"
                    data-testid="button-remove-promo"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Order Summary */}
          <section className="p-4">
            <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
              <h3 className="font-bold text-gray-900 mb-3">Итого</h3>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Товары ({cartItems.length})</span>
                <span className="font-medium">{subtotal.toFixed(0)} с.</span>
              </div>
              
              {appliedPromo && promoDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Скидка ({appliedPromo.discountPercent}%)</span>
                  <span>-{promoDiscount.toFixed(0)} с.</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Доставка</span>
                <span className="font-medium text-green-600">Бесплатно</span>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">К оплате:</span>
                  <span className="text-2xl font-bold text-agent-purple" data-testid="total-price">
                    {finalTotal.toFixed(0)} с.
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Checkout Button */}
          <section className="p-4">
            <Link href="/checkout">
              <Button className="w-full bg-agent-purple hover:bg-agent-purple/90 py-4 text-lg" data-testid="button-checkout">
                Оформить заказ • {finalTotal.toFixed(0)} с.
              </Button>
            </Link>
          </section>
        </>
      )}
    </main>
  );
}