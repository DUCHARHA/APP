import { Link } from "wouter";
import { type Category } from "@shared/schema";
import { useState } from "react";

interface CategoryButtonProps {
  category: Category;
}

export default function CategoryButton({ category }: CategoryButtonProps) {
  const [imageError, setImageError] = useState(false);
  
  return (
    <Link href={`/catalog/${category.id}`}>
      <button className="bg-white dark:bg-card rounded-xl p-4 shadow-sm text-center card-hover w-full">
        {imageError || !category.imageUrl ? (
          <div className="w-12 h-9 mx-auto mb-2 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-gray-400 dark:text-gray-500 text-xs">📋</span>
          </div>
        ) : (
          <img
            src={category.imageUrl}
            alt={category.name}
            className="w-12 h-9 mx-auto mb-2 rounded-lg object-cover"
            onError={() => setImageError(true)}
          />
        )}
        <span className="text-xs font-medium text-gray-700 dark:text-gray-200 line-clamp-1">
          {category.name}
        </span>
      </button>
    </Link>
  );
}
