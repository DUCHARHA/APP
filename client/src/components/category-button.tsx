import { Link } from "wouter";
import { type Category } from "@shared/schema";

interface CategoryButtonProps {
  category: Category;
}

export default function CategoryButton({ category }: CategoryButtonProps) {
  return (
    <Link href={`/catalog/${category.id}`}>
      <button className="bg-white dark:bg-card rounded-xl p-4 shadow-sm text-center card-hover w-full">
        <img
          src={category.imageUrl || ""}
          alt={category.name}
          className="w-12 h-9 mx-auto mb-2 rounded-lg object-cover"
        />
        <span className="text-xs font-medium text-gray-700 dark:text-gray-200 line-clamp-1">
          {category.name}
        </span>
      </button>
    </Link>
  );
}
