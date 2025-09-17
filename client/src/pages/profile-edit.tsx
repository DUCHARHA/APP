import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, User, Phone, Mail, MapPin, Save, CheckCircle, AlertCircle, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { updateProfileSchema, type UpdateProfileData } from "@shared/schema";
import { getAuthState, loginUser } from "@/utils/auth-state";
import { getCurrentUserId } from "@/utils/user-session";
import { ProfileAvatarCard } from "@/components/profile/profile-avatar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import AppHeader from "@/components/app-header";
import { useDebounce } from "@/hooks/use-debounce";

export default function ProfileEdit() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const userId = getCurrentUserId();
  const queryClient = useQueryClient();
  const [authState, setAuthState] = useState(() => getAuthState());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Form setup with validation
  const form = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      username: authState?.name || "",
      email: authState?.isGuest ? "" : "Ducharha@gmail.com",
      phone: authState?.phone || "",
      address: "",
      avatar: "",
    },
    mode: "onChange",
  });

  const { watch, formState: { errors, isDirty } } = form;
  const watchedValues = watch();
  const debouncedValues = useDebounce(watchedValues, 1000);

  // Load user profile data
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/users", userId],
    enabled: !!userId && !authState?.isGuest,
  });

  // Initialize form with loaded data
  useEffect(() => {
    if (userProfile) {
      form.reset({
        username: userProfile.username || authState?.name || "",
        email: userProfile.email || "",
        phone: userProfile.phone || authState?.phone || "",
        address: userProfile.address || "",
        avatar: userProfile.avatar || "",
      });
    } else {
      // Fallback to localStorage for guest mode
      const savedProfile = localStorage.getItem("userProfile");
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        form.reset({
          username: parsed.name || authState?.name || "",
          email: parsed.email || "",
          phone: parsed.phone || authState?.phone || "",
          address: parsed.address || "",
          avatar: parsed.avatar || "",
        });
      }
    }
  }, [userProfile, authState, form]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      if (authState?.isGuest || !userId) {
        // For guests, save to localStorage
        const profileData = {
          name: data.username,
          email: data.email,
          phone: data.phone,
          address: data.address,
          avatar: data.avatar,
        };
        localStorage.setItem("userProfile", JSON.stringify(profileData));
        
        // Update auth state if name or phone changed
        if (data.username !== authState?.name || data.phone !== authState?.phone) {
          loginUser(data.username, data.phone || "");
        }
        
        return profileData;
      } else {
        // For authenticated users, save to backend
        return await apiRequest(`/api/users/${userId}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
      }
    },
    onSuccess: (data) => {
      setAutoSaveStatus('saved');
      setHasUnsavedChanges(false);
      
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId] });
      
      // Update auth state
      const currentAuthState = getAuthState();
      if (currentAuthState) {
        setAuthState({
          ...currentAuthState,
          name: data.name || data.username || currentAuthState.name,
          phone: data.phone || currentAuthState.phone,
        });
      }
      
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    },
    onError: (error) => {
      setAutoSaveStatus('error');
      console.error('Profile update error:', error);
      toast({
        title: "Ошибка сохранения",
        description: "Не удалось сохранить изменения профиля",
        variant: "destructive",
      });
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    },
  });

  // Auto-save functionality
  useEffect(() => {
    if (isDirty && !Object.keys(errors).length && autoSaveStatus !== 'saving') {
      setAutoSaveStatus('saving');
      setHasUnsavedChanges(true);
      updateProfileMutation.mutate(debouncedValues);
    }
  }, [debouncedValues, isDirty, errors, autoSaveStatus, updateProfileMutation]);

  // Manual save
  const handleSave = () => {
    if (Object.keys(errors).length > 0) {
      toast({
        title: "Ошибка валидации",
        description: "Пожалуйста, исправьте ошибки в форме",
        variant: "destructive",
      });
      return;
    }

    setAutoSaveStatus('saving');
    updateProfileMutation.mutate(form.getValues());
  };

  // Avatar upload handler
  const handleAvatarChange = useCallback((file: File) => {
    // In a real app, this would upload to a storage service
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      form.setValue('avatar', result, { shouldDirty: true });
      toast({
        title: "Фото загружено",
        description: "Аватар будет сохранен автоматически",
      });
    };
    reader.readAsDataURL(file);
  }, [form, toast]);

  // Avatar remove handler
  const handleAvatarRemove = useCallback(() => {
    form.setValue('avatar', '', { shouldDirty: true });
    toast({
      title: "Фото удалено",
      description: "Изменения будут сохранены автоматически",
    });
  }, [form, toast]);

  const getAutoSaveIndicator = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return (
          <div className="flex items-center space-x-2 text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Сохранение...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Сохранено</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Ошибка сохранения</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (profileLoading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        <AppHeader
          title="Редактирование профиля"
          showBack={true}
          onBack={() => setLocation("/profile")}
        />
        <div className="p-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <AppHeader
        title="Редактирование профиля"
        showBack={true}
        onBack={() => setLocation("/profile")}
        actions={
          <div className="flex items-center space-x-4">
            {getAutoSaveIndicator()}
            {hasUnsavedChanges && autoSaveStatus !== 'saving' && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-600">
                Несохранено
              </Badge>
            )}
          </div>
        }
      />

      <div className="p-4 space-y-6">
        {/* Avatar Section */}
        <ProfileAvatarCard
          name={form.watch('username') || "Пользователь"}
          email={form.watch('email')}
          avatarUrl={form.watch('avatar')}
          onAvatarChange={handleAvatarChange}
          onAvatarRemove={handleAvatarRemove}
        />

        {/* Form */}
        <Form {...form}>
          <form className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Личная информация</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Имя *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Введите ваше имя"
                          data-testid="input-username"
                        />
                      </FormControl>
                      <FormDescription>
                        Ваше имя будет отображаться в профиле и заказах
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Телефон</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="+992 XX XXX XX XX"
                          disabled={!authState?.isGuest}
                          className={!authState?.isGuest ? "bg-gray-100 cursor-not-allowed" : ""}
                          data-testid="input-phone"
                        />
                      </FormControl>
                      <FormDescription>
                        {authState?.isGuest 
                          ? "Номер телефона для связи и уведомлений"
                          : "Для изменения номера обратитесь в поддержку"
                        }
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="example@email.com"
                          disabled={!authState?.isGuest}
                          className={!authState?.isGuest ? "bg-gray-100 cursor-not-allowed" : ""}
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormDescription>
                        {authState?.isGuest 
                          ? "Email для уведомлений и восстановления доступа"
                          : "Для изменения email обратитесь в поддержку"
                        }
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Адрес по умолчанию</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Адрес</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Введите ваш адрес доставки по умолчанию"
                          className="min-h-[80px]"
                          data-testid="textarea-address"
                        />
                      </FormControl>
                      <FormDescription>
                        Этот адрес будет использоваться по умолчанию для доставки
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col space-y-3">
              <Button
                type="button"
                onClick={handleSave}
                disabled={!isDirty || Object.keys(errors).length > 0 || updateProfileMutation.isPending}
                className="w-full"
                data-testid="button-save-profile"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Сохранить изменения
                  </>
                )}
              </Button>

              <p className="text-sm text-gray-500 text-center">
                💡 Изменения сохраняются автоматически
              </p>
            </div>
          </form>
        </Form>

        {/* Guest Mode Notice */}
        {authState?.isGuest && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800 dark:text-amber-200">
                    Гостевой режим
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Ваши данные сохраняются локально. Создайте аккаунт для синхронизации между устройствами.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}