import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { lazy, Suspense, useState, useEffect } from "react";
import { autoFixDemoUser } from "@/utils/force-refresh";
import {
  OnboardingProvider,
  OnboardingModal,
  OnboardingTrigger,
  ReturningUserWelcome
} from "@/components/onboarding";
import AddressOnboarding from "@/components/address-onboarding";

// Lazy load pages for better initial loading performance
const Home = lazy(() => import("@/pages/home"));
const Catalog = lazy(() => import("@/pages/catalog"));
const ProductDetail = lazy(() => import("@/pages/product-detail"));
const Checkout = lazy(() => import("@/pages/checkout"));
const Orders = lazy(() => import("@/pages/orders"));
const OrderDetail = lazy(() => import("@/pages/order-detail"));
const Addresses = lazy(() => import("@/pages/addresses"));
const PaymentMethods = lazy(() => import("@/pages/payment-methods"));
const Profile = lazy(() => import("@/pages/profile"));
const ProfileAuth = lazy(() => import("@/pages/profile-auth"));
const ProfileEdit = lazy(() => import("@/pages/profile-edit"));
const Help = lazy(() => import("@/pages/help"));
const AdminLogin = lazy(() => import("@/pages/admin-login"));
const AdminOrders = lazy(() => import("@/pages/admin-orders"));
const Admin = lazy(() => import("@/pages/admin"));
const AdminBanners = lazy(() => import("@/pages/AdminBanners"));
const AdminNotifications = lazy(() => import("@/pages/admin-notifications"));
const Maps = lazy(() => import("@/pages/maps"));
const NotFound = lazy(() => import("@/pages/not-found"));

import MobileNavigation from "@/components/mobile-navigation";
import { PWAStatus } from "@/components/pwa-status";
import { ErrorBoundary } from "@/components/error-boundary";
import { DOMProtectionWrapper } from "@/components/dom-protection-wrapper";
import { StatusBarManager } from "@/utils/status-bar-manager";
import React, { useRef } from "react";
import { PWAProvider } from "./contexts/pwa-context";
import { PWADetector } from "./utils/pwa-detection";
import OperaMiniFallback from "./components/opera-mini-fallback";

// Loading component for lazy routes
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5B21B6]"></div>
  </div>
);

// Store scroll positions for each page
const scrollPositions = new Map<string, number>();

function Router() {
  const [location, setLocation] = useLocation();
  const previousLocation = useRef<string>("");
  const [showAddressOnboarding, setShowAddressOnboarding] = useState(false);
  const [isCheckingFirstVisit, setIsCheckingFirstVisit] = useState(true);

  // Check if this is user's first visit
  useEffect(() => {
    const hasSelectedAddress = localStorage.getItem('user-addresses');
    const hasCompletedAddressOnboarding = localStorage.getItem('address-onboarding-completed');

    // Show address onboarding if user hasn't selected any address and hasn't completed onboarding
    if (!hasSelectedAddress && !hasCompletedAddressOnboarding) {
      setShowAddressOnboarding(true);
    }

    setIsCheckingFirstVisit(false);
  }, []);

  useEffect(() => {
    let isStale = false;
    let rafId: number | null = null;

    // Save scroll position of previous page
    if (previousLocation.current && previousLocation.current !== location) {
      scrollPositions.set(previousLocation.current, window.scrollY);
    }

    // Управление цветом status bar в зависимости от страницы
    try {
      if (location === '/') {
        // На главной странице используем фиолетовый цвет
        StatusBarManager.getInstance().setPurple();
      } else {
        // На остальных страницах тоже фиолетовый (можно настроить по страницам)
        StatusBarManager.getInstance().setPurple();
      }
    } catch (error) {
      console.warn('Error setting status bar color for route:', error);
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

  // Handle address selection from onboarding
  const handleAddressSelected = (address: any) => {
    // Save selected address to localStorage
    const addressData = {
      id: Date.now().toString(),
      title: "Адрес из онбординга",
      address: address.address,
      coordinates: address.coordinates,
      type: "home" as const,
      isDefault: true,
      timestamp: new Date().toISOString()
    };

    const existingAddresses = localStorage.getItem('user-addresses');
    const addresses = existingAddresses ? JSON.parse(existingAddresses) : [];
    addresses.push(addressData);
    localStorage.setItem('user-addresses', JSON.stringify(addresses));

    // Mark address onboarding as completed
    localStorage.setItem('address-onboarding-completed', 'true');

    // Hide address onboarding and go to home page
    setShowAddressOnboarding(false);
    setLocation('/');
  };

  // Handle closing address onboarding without selection
  const handleCloseAddressOnboarding = () => {
    // Mark as completed even if user closed without selection
    localStorage.setItem('address-onboarding-completed', 'true');
    setShowAddressOnboarding(false);
    setLocation('/');
  };

  // Show loading while checking first visit
  if (isCheckingFirstVisit) {
    return <PageLoader />;
  }

  // Show address onboarding if needed
  if (showAddressOnboarding) {
    return (
      <OnboardingProvider>
        <div className="max-w-md mx-auto bg-background min-h-screen relative">
          <AddressOnboarding
            onAddressSelected={handleAddressSelected}
            onClose={handleCloseAddressOnboarding}
          />
        </div>
      </OnboardingProvider>
    );
  }

  return (
    <OnboardingProvider>
      <div className="max-w-md mx-auto bg-background min-h-screen relative">
        <PWAStatus />
        <Suspense fallback={<PageLoader />}>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/catalog" component={Catalog} />
            <Route path="/catalog/:categoryId" component={Catalog} />
            <Route path="/product/:productId" component={ProductDetail} />
            <Route path="/checkout" component={Checkout} />
            <Route path="/profile" component={ProfileAuth} />
            <Route path="/profile/edit" component={ProfileEdit} />
            <Route path="/help" component={Help} />
            <Route path="/orders" component={Orders} />
            <Route path="/order/:orderId" component={OrderDetail} />
            <Route path="/addresses" component={Addresses} />
            <Route path="/payment-methods" component={PaymentMethods} />
            <Route path="/maps" component={Maps} />
            <Route path="/admin/login" component={AdminLogin} />
            <Route path="/admin/orders" component={AdminOrders} />
            <Route path="/admin/banners" component={AdminBanners} />
            <Route path="/admin/notifications" component={AdminNotifications} />

            <Route path="/admin" component={Admin} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
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
  // Проверяем совместимость браузера до загрузки React приложения
  // Opera Mini не поддерживает современные веб-технологии
  if (PWADetector.isOperaMini() || !PWADetector.supportsModernFeatures()) {
    return <OperaMiniFallback />;
  }

  // Clean up old cached data on app startup
  React.useEffect(() => {
    // First, check and fix any demo-user sessions with error handling
    try {
      autoFixDemoUser();
    } catch (error) {
      console.warn('Error during app initialization cleanup:', error);
    }
  }, []);

  // Инициализируем status bar с фиолетовым цветом
  React.useEffect(() => {
    StatusBarManager.getInstance().init();
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