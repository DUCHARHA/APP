import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { lazy, Suspense, useEffect, useRef } from "react";
import MobileNavigation from "@/components/mobile-navigation";
import { PWAStatus } from "@/components/pwa-status";
// import { ErrorBoundary } from "@/components/error-boundary";

// Import Home directly to fix white screen issue
import Home from "@/pages/home";

// Lazy load other pages for code splitting
const Catalog = lazy(() => import("@/pages/catalog"));
const ProductDetail = lazy(() => import("@/pages/product-detail"));
const Cart = lazy(() => import("@/pages/cart"));
const Checkout = lazy(() => import("@/pages/checkout"));
const Orders = lazy(() => import("@/pages/orders"));
const Addresses = lazy(() => import("@/pages/addresses"));
const PaymentMethods = lazy(() => import("@/pages/payment-methods"));
const Profile = lazy(() => import("@/pages/profile"));
const ProfileEdit = lazy(() => import("@/pages/profile-edit"));
const Help = lazy(() => import("@/pages/help"));
const AdminLogin = lazy(() => import("@/pages/admin-login"));
const AdminOrders = lazy(() => import("@/pages/admin-orders"));
const Admin = lazy(() => import("@/pages/admin"));
const AdminBanners = lazy(() => import("@/pages/AdminBanners"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Store scroll positions for each page
const scrollPositions = new Map<string, number>();

// Loading component for lazy loaded routes
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-agent-purple"></div>
    </div>
  );
}

function Router() {
  const [location] = useLocation();
  const previousLocation = useRef<string>("");

  useEffect(() => {
    let isStale = false;
    
    // Save scroll position of previous page
    if (previousLocation.current && previousLocation.current !== location) {
      scrollPositions.set(previousLocation.current, window.scrollY);
    }

    // Restore scroll position or scroll to top for new pages
    const savedPosition = scrollPositions.get(location);
    if (savedPosition !== undefined) {
      // Use requestAnimationFrame to ensure DOM is ready and prevent stale state
      requestAnimationFrame(() => {
        if (!isStale) {
          window.scrollTo(0, savedPosition);
        }
      });
    } else {
      if (!isStale) {
        window.scrollTo(0, 0);
      }
    }

    previousLocation.current = location;
    
    return () => {
      isStale = true;
    };
  }, [location]);

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen relative">
      <PWAStatus />
      <Switch>
        <Route path="/" component={Home} />
        <Suspense fallback={<PageLoader />}>
          <Route path="/catalog" component={Catalog} />
          <Route path="/catalog/:categoryId" component={Catalog} />
          <Route path="/product/:productId" component={ProductDetail} />
          <Route path="/cart" component={Cart} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/profile" component={Profile} />
          <Route path="/profile/edit" component={ProfileEdit} />
          <Route path="/help" component={Help} />
          <Route path="/orders" component={Orders} />
          <Route path="/addresses" component={Addresses} />
          <Route path="/payment-methods" component={PaymentMethods} />
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/admin/orders" component={AdminOrders} />
          <Route path="/admin/banners" component={AdminBanners} />
          <Route path="/admin" component={Admin} />
          <Route component={NotFound} />
        </Suspense>
      </Switch>
      <MobileNavigation />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="ducharkha-ui-theme">
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;