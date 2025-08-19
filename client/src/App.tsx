import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import Home from "@/pages/home";
import Catalog from "@/pages/catalog";
import ProductDetail from "@/pages/product-detail";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import Orders from "@/pages/orders";
import Addresses from "@/pages/addresses";
import PaymentMethods from "@/pages/payment-methods";
import Profile from "@/pages/profile";
import ProfileEdit from "@/pages/profile-edit";
import Help from "@/pages/help";
import AdminLogin from "@/pages/admin-login";
import AdminOrders from "@/pages/admin-orders";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";
import MobileNavigation from "@/components/mobile-navigation";
import { useEffect, useRef } from "react";

// Store scroll positions for each page
const scrollPositions = new Map<string, number>();

function Router() {
  const [location] = useLocation();
  const previousLocation = useRef<string>("");

  useEffect(() => {
    // Save scroll position of previous page
    if (previousLocation.current && previousLocation.current !== location) {
      scrollPositions.set(previousLocation.current, window.scrollY);
    }

    // Restore scroll position or scroll to top for new pages
    const savedPosition = scrollPositions.get(location);
    if (savedPosition !== undefined) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo(0, savedPosition);
      });
    } else {
      window.scrollTo(0, 0);
    }

    previousLocation.current = location;
  }, [location]);

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen relative">
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
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
      <MobileNavigation />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ducharkha-ui-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
