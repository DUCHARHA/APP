import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ProfileAvatarProps {
  name: string;
  email?: string;
  avatarUrl?: string;
  size?: "sm" | "md" | "lg" | "xl";
  editable?: boolean;
  onAvatarChange?: (file: File) => void;
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-12 h-12 text-sm", 
  lg: "w-16 h-16 text-base",
  xl: "w-24 h-24 text-lg"
};

const iconSizes = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5", 
  xl: "w-6 h-6"
};

function getInitials(name: string, email?: string): string {
  if (name && name.trim()) {
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return words[0].slice(0, 2).toUpperCase();
  }
  
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  
  return "ГО"; // "Гость" (Guest) in Russian
}

function getGradientFromName(name: string): string {
  const colors = [
    "from-red-400 to-red-600",
    "from-blue-400 to-blue-600", 
    "from-green-400 to-green-600",
    "from-purple-400 to-purple-600",
    "from-pink-400 to-pink-600",
    "from-indigo-400 to-indigo-600",
    "from-orange-400 to-orange-600",
    "from-teal-400 to-teal-600",
    "from-yellow-400 to-yellow-600",
    "from-cyan-400 to-cyan-600"
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

export function ProfileAvatar({ 
  name, 
  email, 
  avatarUrl, 
  size = "lg", 
  editable = false, 
  onAvatarChange,
  className 
}: ProfileAvatarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { toast } = useToast();
  
  const initials = getInitials(name, email);
  const gradient = getGradientFromName(name);
  const hasValidImage = avatarUrl && !imageError;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, выберите изображение",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Ошибка",
        description: "Размер файла не должен превышать 5MB",
        variant: "destructive",
      });
      return;
    }

    onAvatarChange?.(file);
    
    toast({
      title: "Фото обновлено",
      description: "Аватар успешно изменен",
    });
  };

  if (editable) {
    return (
      <div className={cn("relative inline-block", className)}>
        <div
          className="relative cursor-pointer group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          data-testid="profile-avatar-editable"
        >
          <Avatar className={cn(sizeClasses[size], "transition-all duration-200")}>
            <AvatarImage 
              src={hasValidImage ? avatarUrl : undefined}
              alt={`${name} avatar`}
              onError={() => setImageError(true)}
            />
            <AvatarFallback 
              className={cn(
                `bg-gradient-to-br ${gradient} text-white font-semibold`,
                "transition-all duration-200 group-hover:scale-105"
              )}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          
          {/* Upload Overlay */}
          <div 
            className={cn(
              "absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-200",
              isHovered ? "opacity-100" : "opacity-0"
            )}
          >
            <Camera className={cn("text-white", iconSizes[size])} />
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          data-testid="input-avatar-upload"
        />
      </div>
    );
  }

  return (
    <Avatar className={cn(sizeClasses[size], className)} data-testid="profile-avatar">
      <AvatarImage 
        src={hasValidImage ? avatarUrl : undefined}
        alt={`${name} avatar`}
        onError={() => setImageError(true)}
      />
      <AvatarFallback className={cn(`bg-gradient-to-br ${gradient} text-white font-semibold`)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

// Enhanced ProfileAvatarCard for profile editing
interface ProfileAvatarCardProps {
  name: string;
  email?: string;
  avatarUrl?: string;
  onAvatarChange?: (file: File) => void;
  onAvatarRemove?: () => void;
  className?: string;
}

export function ProfileAvatarCard({
  name,
  email,
  avatarUrl,
  onAvatarChange,
  onAvatarRemove,
  className
}: ProfileAvatarCardProps) {
  const { toast } = useToast();
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, выберите изображение",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Ошибка", 
        description: "Размер файла не должен превышать 5MB",
        variant: "destructive",
      });
      return;
    }

    onAvatarChange?.(file);
    
    toast({
      title: "Фото обновлено",
      description: "Аватар успешно изменен",
    });
  };

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <ProfileAvatar 
            name={name}
            email={email}
            avatarUrl={avatarUrl}
            size="xl"
          />
          
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-lg">{name}</h3>
            {email && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{email}</p>
            )}
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
                data-testid="button-upload-avatar"
                onClick={() => document.getElementById('avatar-upload')?.click()}
              >
                <Upload className="w-4 h-4" />
                <span>Загрузить фото</span>
              </Button>
              
              {avatarUrl && onAvatarRemove && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAvatarRemove}
                  className="flex items-center space-x-2 text-red-600 hover:text-red-700"
                  data-testid="button-remove-avatar"
                >
                  <X className="w-4 h-4" />
                  <span>Удалить</span>
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Hidden File Input */}
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          data-testid="input-avatar-file"
        />
      </CardContent>
    </Card>
  );
}