import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  phone: string;
  firstName?: string | null;
  lastName?: string | null;
}

interface AuthResponse {
  token: string;
  user: User;
  expiresIn: number;
}

interface SendCodeData {
  phone: string;
}

interface VerifyCodeData {
  phone: string;
  code: string;
}

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  address?: string;
}

const TOKEN_KEY = 'ducharha_auth_token';

// Token management
const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// Helper function to make authenticated requests
async function authenticatedRequest(url: string, method: string = 'GET', data?: unknown) {
  const token = getToken();
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText}`);
  }

  return response.json();
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      const token = getToken();
      if (!token) return null;
      
      try {
        return await authenticatedRequest('/api/auth/user');
      } catch (error: any) {
        if (error.message.includes('401')) {
          removeToken();
          return null;
        }
        throw error;
      }
    },
    retry: false,
    enabled: !!getToken(),
  });

  const sendCodeMutation = useMutation({
    mutationFn: async (data: SendCodeData): Promise<{ message: string; phone: string; expiresIn: number }> => {
      const response = await apiRequest('POST', '/api/auth/send-code', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Код отправлен",
        description: `Проверьте Telegram бот @Ducharha_bot. Код действителен ${Math.floor(data.expiresIn / 60)} минут.`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Ошибка отправки",
        description: error.message || "Не удалось отправить код",
      });
    },
  });

  const verifyCodeMutation = useMutation({
    mutationFn: async (data: VerifyCodeData): Promise<AuthResponse> => {
      const response = await apiRequest('POST', '/api/auth/verify-code', data);
      return response.json();
    },
    onSuccess: (data) => {
      setToken(data.token);
      
      // Update user data in cache
      queryClient.setQueryData(['/api/auth/user'], data.user);
      
      // Invalidate related queries to refetch with new auth
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      
      toast({
        title: "Добро пожаловать!",
        description: "Вы успешно вошли в систему",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Ошибка входа",
        description: error.message || "Неверный код или истекло время",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await authenticatedRequest('/api/auth/logout', 'POST');
      return response;
    },
    onSuccess: () => {
      removeToken();
      queryClient.clear();
      
      toast({
        title: "До свидания!",
        description: "Вы вышли из системы",
      });
    },
    onError: (error: any) => {
      // Still remove token even if server request fails
      removeToken();
      queryClient.clear();
      
      toast({
        title: "Выход выполнен",
        description: "Сессия завершена",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      return await authenticatedRequest('/api/auth/profile', 'PUT', data);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/auth/user'], data);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      toast({
        title: "Профиль обновлен",
        description: "Ваши данные успешно сохранены",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Ошибка обновления",
        description: error.message || "Не удалось обновить профиль",
      });
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    sendCode: sendCodeMutation.mutate,
    verifyCode: verifyCodeMutation.mutate,
    logout: logoutMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    isLoadingSendCode: sendCodeMutation.isPending,
    isLoadingVerifyCode: verifyCodeMutation.isPending,
    isLoadingLogout: logoutMutation.isPending,
    isLoadingProfile: updateProfileMutation.isPending,
  };
}

export type { User, SendCodeData, VerifyCodeData, UpdateProfileData };