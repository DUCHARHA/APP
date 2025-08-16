import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Catalog from "@/pages/catalog";
import ProductDetail from "@/pages/product-detail";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import Orders from "@/pages/orders";
import Addresses from "@/pages/addresses";
import PaymentMethods from "@/pages/payment-methods";
import Profile from "@/pages/profile";
import AdminLogin from "@/pages/admin-login";
import AdminOrders from "@/pages/admin-orders";
import NotFound from "@/pages/not-found";
import MobileNavigation from "@/components/mobile-navigation";

function Router() {
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
        <Route path="/orders" component={Orders} />
        <Route path="/addresses" component={Addresses} />
        <Route path="/payment-methods" component={PaymentMethods} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/orders" component={AdminOrders} />
        <Route component={NotFound} />
      </Switch>
      <MobileNavigation />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
