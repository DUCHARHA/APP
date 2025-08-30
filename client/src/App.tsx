import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import React, { useEffect, useRef } from "react";
import { autoFixDemoUser } from "@/utils/force-refresh";
import {
  OnboardingProvider,
  OnboardingModal,
  OnboardingTrigger,
  ReturningUserWelcome
} from "@/components/onboarding";

// Direct imports for faster loading
import Home from "@/pages/home";
import Catalog from "@/pages/catalog";
import ProductDetail from "@/pages/product-detail";
import Checkout from "@/pages/checkout";
import Orders from "@/pages/orders";
import OrderDetail from "@/pages/order-detail";
import Addresses from "@/pages/addresses";
import PaymentMethods from "@/pages/payment-methods";
import Profile from "@/pages/profile";
import ProfileEdit from "@/pages/profile-edit";
import Help from "@/pages/help";
import AdminLogin from "@/pages/admin-login";
import AdminOrders from "@/pages/admin-orders";
import Admin from "@/pages/admin";
import AdminBanners from "@/pages/AdminBanners";
import AdminNotifications from "@/pages/admin-notifications";
import NotFound from "@/pages/not-found";

import MobileNavigation from "@/components/mobile-navigation";
import { PWAStatus } from "@/components/pwa-status";
import { ErrorBoundary } from "@/components/error-boundary";
import { DOMProtectionWrapper } from "@/components/dom-protection-wrapper";
import { statusBarManager } from "@/utils/status-bar-manager";
import React, { useEffect, useRef } from "react";
import { PWAProvider } from "./contexts/pwa-context";

// Removed PageLoader as we no longer use lazy loading

// Store scroll positions for each page
const scrollPositions = new Map<string, number>();

function Router() {
  const [location] = useLocation();
  const previousLocation = useRef<string>("");

  useEffect(() => {
    let isStale = false;
    let rafId: number | null = null;

    // Save scroll position of previous page
    if (previousLocation.current && previousLocation.current !== location) {
      scrollPositions.set(previousLocation.current, window.scrollY);
    }

    // Управление цветом status bar в зависимости от страницы
    if (location === '/') {
      // На главной странице используем фиолетовый цвет
      statusBarManager.setPurple();
    } else {
      // На остальных страницах тоже фиолетовый (можно настроить по страницам)
      statusBarManager.setPurple();
    }

    // Restore scroll position or scroll to top for new pages
    const savedPosition = scrollPositions.get(location);
    if (savedPosition !== undefined) {
      // Use requestAnimationFrame to ensure DOM is ready and prevent stale state
      rafId = requestAnimationFrame(() => {
        if (!isStale && document.body) {
          try {
            window.scrollTo(0, savedPosition);
          } catch (error) {
            console.warn('Scroll position restore failed:', error);
          }
        }
        rafId = null;
      });
    } else {
      if (!isStale && document.body) {
        try {
          window.scrollTo(0, 0);
        } catch (error) {
          console.warn('Scroll to top failed:', error);
        }
      }
    }

    previousLocation.current = location;

    return () => {
      isStale = true;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [location]);

  return (
    <OnboardingProvider>
      <div className="max-w-md mx-auto bg-background min-h-screen relative">
        <PWAStatus />
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/catalog" component={Catalog} />
          <Route path="/catalog/:categoryId" component={Catalog} />
          <Route path="/product/:productId" component={ProductDetail} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/profile" component={Profile} />
          <Route path="/profile/edit" component={ProfileEdit} />
          <Route path="/help" component={Help} />
          <Route path="/orders" component={Orders} />
          <Route path="/order/:orderId" component={OrderDetail} />
          <Route path="/addresses" component={Addresses} />
          <Route path="/payment-methods" component={PaymentMethods} />
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/admin/orders" component={AdminOrders} />
          <Route path="/admin/banners" component={AdminBanners} />
          <Route path="/admin/notifications" component={AdminNotifications} />

          <Route path="/admin" component={Admin} />
          <Route component={NotFound} />
        </Switch>
        <MobileNavigation />

        {/* Onboarding Components */}
        <OnboardingModal />
        <OnboardingTrigger />
        <ReturningUserWelcome />
      </div>
    </OnboardingProvider>
  );
}

function App() {
  // Clean up old cached data on app startup
  React.useEffect(() => {
    // First, check and fix any demo-user sessions
    autoFixDemoUser();

  }, []);

  return (
    <ErrorBoundary>
      <DOMProtectionWrapper onDOMError={(error) => console.warn('DOM Error защищен:', error.message)}>
        <ThemeProvider defaultTheme="light" storageKey="ducharkha-ui-theme">
          <QueryClientProvider client={queryClient}>
            <PWAProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </PWAProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </DOMProtectionWrapper>
    </ErrorBoundary>
  );
}

export default App;