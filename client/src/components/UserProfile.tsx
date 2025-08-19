import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { User, Phone, LogOut, Edit3, Save, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { UpdateProfileData } from "@/hooks/use-auth";

const profileSchema = z.object({
  firstName: z.string().min(1, "Имя обязательно").max(50, "Имя слишком длинное"),
  lastName: z.string().max(50, "Фамилия слишком длинная").optional(),
  address: z.string().max(200, "Адрес слишком длинный").optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface UserProfileProps {
  children?: React.ReactNode;
}

export function UserProfile({ children }: UserProfileProps) {
  const { user, logout, updateProfile, isLoadingLogout, isLoadingProfile } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      address: "",
    },
  });

  const handleSaveProfile = (data: ProfileFormData) => {
    updateProfile(data, {
      onSuccess: () => {
        setIsEditMode(false);
        setIsProfileDialogOpen(false);
      }
    });
  };

  const handleCancel = () => {
    form.reset({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      address: "",
    });
    setIsEditMode(false);
  };

  if (!user) return null;

  // Format phone for display
  const formatPhone = (phone: string) => {
    if (phone.startsWith('+7')) {
      const digits = phone.slice(2);
      return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
    }
    return phone;
  };

  const displayName = user.firstName 
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
    : 'Пользователь';

  const ProfileContent = () => (
    <Card className="border-0 shadow-none">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <User className="h-8 w-8" />
          </div>
          <div>
            <CardTitle className="text-xl">{displayName}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <Phone className="h-3 w-3 mr-1" />
              {formatPhone(user.phone)}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(handleSaveProfile)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Имя *</Label>
            <div className="relative">
              <Input
                id="firstName"
                placeholder="Введите ваше имя"
                disabled={!isEditMode}
                className={cn(
                  "transition-colors",
                  !isEditMode && "bg-muted/50 cursor-default"
                )}
                data-testid="input-first-name"
                {...form.register("firstName")}
              />
              {form.formState.errors.firstName && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Фамилия</Label>
            <Input
              id="lastName"
              placeholder="Введите вашу фамилию"
              disabled={!isEditMode}
              className={cn(
                "transition-colors",
                !isEditMode && "bg-muted/50 cursor-default"
              )}
              data-testid="input-last-name"
              {...form.register("lastName")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Адрес доставки</Label>
            <Input
              id="address"
              placeholder="Укажите адрес для доставки"
              disabled={!isEditMode}
              className={cn(
                "transition-colors",
                !isEditMode && "bg-muted/50 cursor-default"
              )}
              data-testid="input-address"
              {...form.register("address")}
            />
          </div>

          {isEditMode && (
            <div className="flex space-x-2 pt-2">
              <Button
                type="submit"
                disabled={isLoadingProfile}
                className="flex-1"
                data-testid="button-save-profile"
              >
                {isLoadingProfile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Сохранить
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoadingProfile}
                data-testid="button-cancel-edit"
              >
                <X className="mr-2 h-4 w-4" />
                Отмена
              </Button>
            </div>
          )}
        </form>
      </CardContent>

      <CardFooter className="flex justify-between">
        {!isEditMode && (
          <Button
            variant="outline"
            onClick={() => setIsEditMode(true)}
            data-testid="button-edit-profile"
          >
            <Edit3 className="mr-2 h-4 w-4" />
            Редактировать
          </Button>
        )}
        
        <Button
          variant="outline"
          onClick={() => logout()}
          disabled={isLoadingLogout}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          data-testid="button-logout"
        >
          {isLoadingLogout ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Выход...
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              Выйти
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );

  // If children are provided, render as dialog trigger
  if (children) {
    return (
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Профиль пользователя</DialogTitle>
            <DialogDescription>
              Управляйте своими личными данными и настройками
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 pt-0">
            <ProfileContent />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Render as standalone component
  return <ProfileContent />;
}

// User menu component for navigation
interface UserMenuProps {
  compact?: boolean;
}

export function UserMenu({ compact = false }: UserMenuProps) {
  const { user, logout, isLoadingLogout } = useAuth();

  if (!user) return null;

  const displayName = user.firstName || 'Пользователь';
  const initials = user.firstName 
    ? `${user.firstName.charAt(0)}${user.lastName?.charAt(0) || ''}`
    : 'П';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={cn(
            "relative h-10 w-10 rounded-full",
            !compact && "w-auto px-3"
          )}
          data-testid="button-user-menu"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
            {initials}
          </div>
          {!compact && (
            <span className="ml-2 text-sm font-medium hidden sm:inline-block">
              {displayName}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center space-x-2 p-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
            {initials}
          </div>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground">
              {user.phone}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <UserProfile>
          <DropdownMenuItem 
            className="cursor-pointer" 
            onSelect={(e) => e.preventDefault()}
            data-testid="menu-item-profile"
          >
            <User className="mr-2 h-4 w-4" />
            Профиль
          </DropdownMenuItem>
        </UserProfile>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={() => logout()}
          disabled={isLoadingLogout}
          data-testid="menu-item-logout"
        >
          {isLoadingLogout ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}