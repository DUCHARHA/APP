import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Search } from "lucide-react";
import { type Category, type Product } from "@shared/schema";
import ProductCard from "@/components/product-card";
import CategoryButton from "@/components/category-button";
import { useState } from "react";

export default function Catalog() {
  const { categoryId } = useParams();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products", categoryId || "all"],
    queryFn: () => {
      const url = categoryId ? `/api/products?category=${categoryId}` : "/api/products";
      return fetch(url).then(res => res.json());
    },
  });

  const { data: searchResults = [] } = useQuery<Product[]>({
    queryKey: ["/api/products", "search", searchQuery],
    queryFn: () => fetch(`/api/products?search=${encodeURIComponent(searchQuery)}`).then(res => res.json()),
    enabled: searchQuery.length > 0,
  });

  const currentCategory = categoryId ? categories.find(c => c.id === categoryId) : null;
  const displayProducts = searchQuery ? searchResults : products;

  return (
    <main className="pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-card shadow-sm sticky top-0 z-40">
        <div className="flex items-center p-4">
          {currentCategory && (
            <Link href="/catalog">
              <button className="mr-3 p-2 -ml-2">
                <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </button>
            </Link>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {currentCategory ? currentCategory.name : "Каталог"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {displayProducts.length} товаров
            </p>
          </div>
        </div>
      </header>

      {/* Search */}
      <section className="p-4 bg-gray-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Поиск в каталоге..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-agent-purple/50"
          />
        </div>
      </section>

      {/* Categories */}
      {!categoryId && !searchQuery && (
        <section className="p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Категории</h3>
          <div className="grid grid-cols-4 gap-3 mb-6">
            {categories.slice(0, 8).map((category) => (
              <CategoryButton key={category.id} category={category} />
            ))}
          </div>
        </section>
      )}

      {/* Products */}
      <section className="p-4">
        {searchQuery && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Результаты поиска по запросу "{searchQuery}"
            </p>
          </div>
        )}

        {displayProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? "Товары не найдены" : "Нет товаров"}
            </h3>
            <p className="text-gray-500 text-sm">
              {searchQuery 
                ? "Попробуйте изменить поисковый запрос" 
                : "В этой категории пока нет товаров"
              }
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
    </main>
  );
}
