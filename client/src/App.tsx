import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { lazy, Suspense } from "react";
import MobileNavigation from "@/components/mobile-navigation";
import { PWAStatus } from "@/components/pwa-status";
import { ErrorBoundary } from "@/components/error-boundary";

const Home = lazy(() => import("@/pages/home"));
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

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-agent-purple"></div>
    </div>
  );
}

function Router() {
  return (
    <div className="max-w-md mx-auto bg-background min-h-screen relative">
      <PWAStatus />
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={Home} />
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
        </Switch>
      </Suspense>
      <MobileNavigation />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" storageKey="ducharkha-ui-theme">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;