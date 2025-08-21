import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import MobileNavigation from "@/components/mobile-navigation";

// Test component to verify app loads
function TestHome() {
  return (
    <div className="min-h-screen bg-white p-4">
      <h1 className="text-2xl font-bold text-black">ДУЧАРХА работает!</h1>
      <p className="mt-4 text-gray-600">Приложение загружено успешно.</p>
      <a href="/catalog" className="mt-4 inline-block bg-purple-600 text-white px-4 py-2 rounded">
        Перейти в каталог
      </a>
    </div>
  );
}

// Import other pages
import Catalog from "@/pages/catalog";
import Cart from "@/pages/cart";

function Router() {
  return (
    <div className="max-w-md mx-auto bg-background min-h-screen relative">
      <Switch>
        <Route path="/" component={TestHome} />
        <Route path="/catalog" component={Catalog} />
        <Route path="/cart" component={Cart} />
        <Route>
          <div className="p-4">Страница не найдена</div>
        </Route>
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