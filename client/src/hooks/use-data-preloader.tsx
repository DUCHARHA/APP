import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import { getCurrentUserId } from "@/utils/user-session";

/**
 * Hook for preloading critical app data in the background
 * while user is going through address onboarding
 */
export function useDataPreloader() {
  useEffect(() => {
    const userId = getCurrentUserId();
    
    // Preload critical data for faster app experience
    const preloadData = async () => {
      try {
        // Core catalog data - highest priority
        await Promise.all([
          queryClient.prefetchQuery({
            queryKey: ['/api/categories'],
            staleTime: 10 * 60 * 1000, // 10 minutes like in original
          }),
          queryClient.prefetchQuery({
            queryKey: ['/api/products'],
            staleTime: 5 * 60 * 1000, // 5 minutes like popular products
          }),
          queryClient.prefetchQuery({
            queryKey: ['/api/banners'],
            staleTime: 5 * 60 * 1000, // Cache banners for 5 minutes
          }),
        ]);

        // User-specific data - medium priority
        await Promise.all([
          queryClient.prefetchQuery({
            queryKey: ['/api/cart', userId],
            staleTime: 10 * 60 * 1000, // 10 minutes like in original
          }),
          queryClient.prefetchQuery({
            queryKey: ['/api/notifications', userId, 'count'],
            staleTime: 2 * 60 * 1000, // 2 minutes for notifications
          }),
          queryClient.prefetchQuery({
            queryKey: ['/api/users', userId, 'preferences'],
            staleTime: 30 * 60 * 1000, // 30 minutes for preferences
          }),
        ]);

        // Additional data - lower priority
        await Promise.all([
          queryClient.prefetchQuery({
            queryKey: ['/api/orders', userId],
            staleTime: 5 * 60 * 1000, // 5 minutes for orders
          }),
          queryClient.prefetchQuery({
            queryKey: ['/api/config/yandex-maps'],
            staleTime: 60 * 60 * 1000, // 1 hour for API config
          }),
        ]);

        console.debug('[Preloader] ✅ Все данные предзагружены успешно');
      } catch (error) {
        // Non-critical error - app will work without prefetching
        console.warn('[Preloader] ⚠️ Предзагрузка данных частично не удалась:', error);
      }
    };

    // Start preloading immediately but don't block UI
    preloadData();
  }, []);
}