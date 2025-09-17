import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  ArrowLeft,
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  Package,
  DollarSign,
  Star,
  AlertCircle,
  CheckCircle,
  Save,
  X,
  MoreHorizontal,
  TrendingUp,
  Users,
  Activity,
  ShoppingBag
} from "lucide-react";
import { type Product, type InsertProduct, type Category } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema } from "@shared/schema";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const productFormSchema = insertProductSchema.extend({
  price: z.string().min(1, "Цена обязательна"),
  calories: z.string().optional(),
  proteins: z.string().optional(),
  fats: z.string().optional(),
  carbs: z.string().optional(),
  fiber: z.string().optional(),
  sugar: z.string().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function AdminProducts() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check admin authentication
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      setLocation("/admin/login");
      return;
    }
  }, [setLocation]);

  // Fetch products
  const { data: products = [], isLoading: productsLoading, refetch: refetchProducts } = useQuery<Product[]>({
    queryKey: ["/api/admin/products", searchQuery, categoryFilter],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      
      const res = await fetch(`/api/admin/products?${params}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) {
        if (res.status === 401) {
          setLocation("/admin/login");
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch products");
      }
      return res.json();
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData: ProductFormData) => {
      const token = localStorage.getItem("adminToken");
      
      // Convert string numbers to proper types
      const processedData = {
        ...productData,
        price: productData.price,
        calories: productData.calories ? parseInt(productData.calories) : null,
        proteins: productData.proteins ? parseFloat(productData.proteins) : null,
        fats: productData.fats ? parseFloat(productData.fats) : null,
        carbs: productData.carbs ? parseFloat(productData.carbs) : null,
        fiber: productData.fiber ? parseFloat(productData.fiber) : null,
        sugar: productData.sugar ? parseFloat(productData.sugar) : null,
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(processedData),
      });
      if (!res.ok) throw new Error("Failed to create product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Продукт создан",
        description: "Продукт успешно добавлен в каталог",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать продукт",
        variant: "destructive",
      });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProductFormData }) => {
      const token = localStorage.getItem("adminToken");
      
      // Convert string numbers to proper types
      const processedData = {
        ...data,
        price: data.price,
        calories: data.calories ? parseInt(data.calories) : null,
        proteins: data.proteins ? parseFloat(data.proteins) : null,
        fats: data.fats ? parseFloat(data.fats) : null,
        carbs: data.carbs ? parseFloat(data.carbs) : null,
        fiber: data.fiber ? parseFloat(data.fiber) : null,
        sugar: data.sugar ? parseFloat(data.sugar) : null,
      };

      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(processedData),
      });
      if (!res.ok) throw new Error("Failed to update product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      toast({
        title: "Продукт обновлен",
        description: "Изменения успешно сохранены",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить продукт",
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        },
      });
      if (!res.ok) throw new Error("Failed to delete product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Продукт удален",
        description: "Продукт успешно удален из каталога",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить продукт",
        variant: "destructive",
      });
    },
  });

  // Form for creating products
  const createForm = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      weight: "",
      imageUrl: "",
      categoryId: "",
      inStock: true,
      isPopular: false,
      ingredients: "",
      manufacturer: "",
      countryOfOrigin: "",
      storageConditions: "",
      shelfLife: "",
      calories: "",
      proteins: "",
      fats: "",
      carbs: "",
      fiber: "",
      sugar: "",
    },
  });

  // Form for editing products
  const editForm = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
  });

  // Update edit form when editing product changes
  useEffect(() => {
    if (editingProduct) {
      editForm.reset({
        name: editingProduct.name,
        description: editingProduct.description || "",
        price: editingProduct.price,
        weight: editingProduct.weight || "",
        imageUrl: editingProduct.imageUrl || "",
        categoryId: editingProduct.categoryId || "",
        inStock: editingProduct.inStock,
        isPopular: editingProduct.isPopular,
        ingredients: editingProduct.ingredients || "",
        manufacturer: editingProduct.manufacturer || "",
        countryOfOrigin: editingProduct.countryOfOrigin || "",
        storageConditions: editingProduct.storageConditions || "",
        shelfLife: editingProduct.shelfLife || "",
        calories: editingProduct.calories?.toString() || "",
        proteins: editingProduct.proteins?.toString() || "",
        fats: editingProduct.fats?.toString() || "",
        carbs: editingProduct.carbs?.toString() || "",
        fiber: editingProduct.fiber?.toString() || "",
        sugar: editingProduct.sugar?.toString() || "",
      });
    }
  }, [editingProduct, editForm]);

  // Statistics
  const stats = useMemo(() => {
    const total = products.length;
    const inStock = products.filter(p => p.inStock).length;
    const outOfStock = total - inStock;
    const popular = products.filter(p => p.isPopular).length;
    const averagePrice = products.length > 0 
      ? products.reduce((sum, p) => sum + parseFloat(p.price), 0) / products.length 
      : 0;
    
    return { total, inStock, outOfStock, popular, averagePrice };
  }, [products]);

  const onCreateSubmit = (data: ProductFormData) => {
    createProductMutation.mutate(data);
  };

  const onEditSubmit = (data: ProductFormData) => {
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (productId: string) => {
    deleteProductMutation.mutate(productId);
  };

  const ProductForm = ({ form, onSubmit, isSubmitting, submitText }: {
    form: any;
    onSubmit: (data: ProductFormData) => void;
    isSubmitting: boolean;
    submitText: string;
  }) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Основная информация</h3>
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название продукта</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-product-name" placeholder="Введите название продукта" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea {...field} data-testid="textarea-product-description" placeholder="Описание продукта" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Цена (₽)</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-product-price" placeholder="0.00" type="number" step="0.01" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Вес/Объем</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-product-weight" placeholder="1 кг, 500 мл" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL изображения</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-product-image" placeholder="https://example.com/image.jpg" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Категория</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-product-category">
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center space-x-6">
              <FormField
                control={form.control}
                name="inStock"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Switch
                        data-testid="switch-product-instock"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm">В наличии</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPopular"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Switch
                        data-testid="switch-product-popular"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm">Популярный</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Дополнительная информация</h3>
            
            <FormField
              control={form.control}
              name="ingredients"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Состав</FormLabel>
                  <FormControl>
                    <Textarea {...field} data-testid="textarea-product-ingredients" placeholder="Список ингредиентов" rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="manufacturer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Производитель</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-product-manufacturer" placeholder="Название производителя" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="countryOfOrigin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Страна происхождения</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-product-country" placeholder="Россия" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="storageConditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Условия хранения</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-product-storage" placeholder="При температуре +2 до +6°C" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shelfLife"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Срок годности</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-product-shelf-life" placeholder="30 дней" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nutrition Information */}
            <h4 className="text-md font-medium text-slate-800 dark:text-slate-200 pt-2">Пищевая ценность (на 100г)</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="calories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Калории (ккал)</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-product-calories" type="number" placeholder="0" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="proteins"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Белки (г)</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-product-proteins" type="number" step="0.1" placeholder="0.0" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fats"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Жиры (г)</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-product-fats" type="number" step="0.1" placeholder="0.0" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="carbs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Углеводы (г)</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-product-carbs" type="number" step="0.1" placeholder="0.0" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fiber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Клетчатка (г)</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-product-fiber" type="number" step="0.1" placeholder="0.0" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sugar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Сахар (г)</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-product-sugar" type="number" step="0.1" placeholder="0.0" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            data-testid="button-submit-product"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isSubmitting ? "Сохранение..." : submitText}
          </Button>
        </div>
      </form>
    </Form>
  );

  if (productsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/50 sticky top-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
            <div className="flex items-center h-16 lg:h-20">
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/admin")}
                className="mr-4 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                data-testid="button-back-admin"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                  Управление продуктами
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Загрузка данных...
                </p>
              </div>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/admin")}
                className="mr-4 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                data-testid="button-back-admin"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                  Управление продуктами
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Всего продуктов: {stats.total}
                </p>
              </div>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  data-testid="button-create-product"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить продукт
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Добавить новый продукт</DialogTitle>
                </DialogHeader>
                <ProductForm 
                  form={createForm}
                  onSubmit={onCreateSubmit}
                  isSubmitting={createProductMutation.isPending}
                  submitText="Создать продукт"
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Всего продуктов</p>
                  <p className="text-3xl font-bold" data-testid="text-total-products">{stats.total}</p>
                </div>
                <Package className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">В наличии</p>
                  <p className="text-3xl font-bold" data-testid="text-instock-products">{stats.inStock}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-pink-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100">Нет в наличии</p>
                  <p className="text-3xl font-bold" data-testid="text-outofstock-products">{stats.outOfStock}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100">Популярные</p>
                  <p className="text-3xl font-bold" data-testid="text-popular-products">{stats.popular}</p>
                </div>
                <Star className="h-8 w-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Средняя цена</p>
                  <p className="text-3xl font-bold" data-testid="text-average-price">{stats.averagePrice.toFixed(0)}₽</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Поиск продуктов..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-products"
                  />
                </div>
              </div>
              <div className="lg:w-64">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger data-testid="select-filter-category">
                    <SelectValue placeholder="Фильтр по категории" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все категории</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Список продуктов
            </CardTitle>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Продукты не найдены
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  {searchQuery || categoryFilter !== "all" 
                    ? "Попробуйте изменить параметры поиска"
                    : "Добавьте первый продукт в каталог"
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-4 px-2">Продукт</th>
                      <th className="text-left py-4 px-2">Категория</th>
                      <th className="text-left py-4 px-2">Цена</th>
                      <th className="text-left py-4 px-2">Статус</th>
                      <th className="text-right py-4 px-2">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const category = categories.find(c => c.id === product.categoryId);
                      return (
                        <tr key={product.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-4 px-2">
                            <div className="flex items-center space-x-3">
                              {product.imageUrl && (
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.name}
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                              )}
                              <div>
                                <p className="font-medium text-slate-900 dark:text-slate-100" data-testid={`text-product-name-${product.id}`}>
                                  {product.name}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  {product.weight}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-2">
                            <span className="text-sm text-slate-600 dark:text-slate-300">
                              {category?.name || "Без категории"}
                            </span>
                          </td>
                          <td className="py-4 px-2">
                            <span className="font-medium text-slate-900 dark:text-slate-100" data-testid={`text-product-price-${product.id}`}>
                              {product.price}₽
                            </span>
                          </td>
                          <td className="py-4 px-2">
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant={product.inStock ? "default" : "destructive"}
                                data-testid={`badge-product-stock-${product.id}`}
                              >
                                {product.inStock ? "В наличии" : "Нет в наличии"}
                              </Badge>
                              {product.isPopular && (
                                <Badge variant="secondary" data-testid={`badge-product-popular-${product.id}`}>
                                  <Star className="h-3 w-3 mr-1" />
                                  Популярный
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-2">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(product)}
                                data-testid={`button-edit-product-${product.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    data-testid={`button-delete-product-${product.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Удалить продукт?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Вы уверены, что хотите удалить "{product.name}"? Это действие нельзя отменить.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel data-testid={`button-cancel-delete-${product.id}`}>Отмена</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDelete(product.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                      data-testid={`button-confirm-delete-${product.id}`}
                                    >
                                      Удалить
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Редактировать продукт: {editingProduct?.name}
            </DialogTitle>
          </DialogHeader>
          <ProductForm 
            form={editForm}
            onSubmit={onEditSubmit}
            isSubmitting={updateProductMutation.isPending}
            submitText="Сохранить изменения"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}