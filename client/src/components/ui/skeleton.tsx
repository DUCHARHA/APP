import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton rounded-md bg-muted", className)}
      {...props}
    />
  );
}

// Product Card Skeleton
function ProductCardSkeleton() {
  return (
    <div className="bg-card rounded-lg border p-4 space-y-3 stagger-item">
      <Skeleton className="h-40 w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>
    </div>
  );
}

// Category Button Skeleton
function CategoryButtonSkeleton() {
  return (
    <div className="flex flex-col items-center space-y-2 stagger-item">
      <Skeleton className="h-16 w-16 rounded-xl" />
      <Skeleton className="h-3 w-12" />
    </div>
  );
}

// List Item Skeleton
function ListItemSkeleton() {
  return (
    <div className="flex items-center space-x-3 p-3 stagger-item">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

// Order Card Skeleton
function OrderCardSkeleton() {
  return (
    <div className="bg-card rounded-lg border p-4 space-y-3 stagger-item">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
    </div>
  );
}

// Grid Skeletons
function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

function CategoryGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {Array.from({ length: count }, (_, i) => (
        <CategoryButtonSkeleton key={i} />
      ))}
    </div>
  );
}

export { 
  Skeleton, 
  ProductCardSkeleton,
  CategoryButtonSkeleton,
  ListItemSkeleton,
  OrderCardSkeleton,
  ProductGridSkeleton,
  CategoryGridSkeleton
};
