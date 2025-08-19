import { Plus, Minus, Check, Phone } from "lucide-react";
import { Link } from "wouter";
import { type Product } from "@shared/schema";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { AuthDialog } from "@/components/AuthDialog";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { isAuthenticated } = useAuth();
  const { cartItems, addToCart, updateCartItem, isAddingToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Find current quantity of this product in cart
  const cartItem = cartItems.find(item => item.productId === product.id);
  const currentQuantity = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    if (!isAuthenticated) return;
    
    addToCart(
      { productId: product.id, quantity: 1 },
      {
        onSuccess: () => {
          setIsAdded(true);
          setTimeout(() => setIsAdded(false), 1000);
        }
      }
    );
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (!isAuthenticated || !cartItem) return;
    
    updateCartItem({ itemId: cartItem.id, quantity: newQuantity });
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02]">
      {/* Product Image */}
      <div className="relative mb-3">
        {!product.imageUrl || imageError ? (
          <div className="w-full h-32 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <div className="text-gray-400 dark:text-gray-600 text-center">
              <div className="text-3xl mb-2">📦</div>
              <div className="text-xs">Фото товара</div>
            </div>
          </div>
        ) : (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-32 object-cover rounded-xl"
            onError={handleImageError}
            loading="lazy"
          />
        )}
      </div>

      {/* Product Info */}
      <Link href={`/product/${product.id}`}>
        <div className="cursor-pointer">
          <h3 className="font-medium text-gray-900 text-sm leading-tight mb-1 line-clamp-2 hover:text-agent-purple transition-colors">
            {product.name}
          </h3>
          {product.weight && (
            <p className="text-xs text-gray-500 mb-2">{product.weight}</p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900">
              {parseFloat(product.price).toFixed(0)} с.
            </span>
          </div>
        </div>
      </Link>

      {/* Add to Cart Button */}
      <div className="mt-3">
        {!isAuthenticated ? (
          <AuthDialog>
            <button 
              className="w-full bg-gray-100 text-gray-600 py-2 px-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center space-x-2"
              data-testid={`button-login-add-${product.id}`}
            >
              <Phone className="w-4 h-4" />
              <span>Войти</span>
            </button>
          </AuthDialog>
        ) : currentQuantity === 0 ? (
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className="w-full bg-agent-purple text-white py-2 px-3 rounded-xl text-sm font-medium hover:bg-agent-purple/90 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            data-testid={`button-add-to-cart-${product.id}`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span>Добавлено</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>В корзину</span>
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-2">
            <button
              onClick={() => handleQuantityChange(currentQuantity - 1)}
              className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center"
              data-testid={`button-decrease-cart-${product.id}`}
            >
              <Minus className="w-4 h-4 text-gray-600" />
            </button>
            <span className="font-medium text-gray-900" data-testid={`quantity-cart-${product.id}`}>
              {currentQuantity}
            </span>
            <button
              onClick={() => handleQuantityChange(currentQuantity + 1)}
              className="w-8 h-8 rounded-lg bg-agent-purple flex items-center justify-center"
              data-testid={`button-increase-cart-${product.id}`}
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Badge/Tag if needed */}
      {product.isPopular && (
        <div className="absolute top-2 left-2 bg-agent-purple text-white text-xs px-2 py-1 rounded-lg">
          Хит
        </div>
      )}
    </div>
  );
}