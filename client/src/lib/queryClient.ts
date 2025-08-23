import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Network error or other fetch failure
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Ошибка сети. Проверьте интернет-соединение.');
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const res = await fetch(queryKey.join("/") as string, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // Network error or other fetch failure
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Ошибка сети. Проверьте интернет-соединение.');
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      staleTime: 1000 * 60 * 10, // Увеличиваем до 10 минут для лучшего кеширования
      gcTime: 1000 * 60 * 30, // Кеш хранится 30 минут в памяти
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Не перезагружать при монтировании если данные свежие
      refetchOnReconnect: false, // Не перезагружать при восстановлении соединения
      retry: (failureCount, error: any) => {
        // Не повторять попытки для 4xx ошибок
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 2; // Уменьшаем количество попыток для быстрой отдачи
      },
      retryDelay: 500, // Уменьшаем задержку между попытками
    },
    mutations: {
      onError: (error: any) => {
        console.error('Mutation error:', error);
        // Здесь можно добавить уведомления об ошибках
      },
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error && typeof error === 'object' && 'message' in error) {
          const errorMessage = error.message as string;
          if (errorMessage.startsWith('4')) return false;
        }
        // Retry network errors up to 1 time for mutations
        return failureCount < 1;
      },
      retryDelay: 1000,
    },
  },
});