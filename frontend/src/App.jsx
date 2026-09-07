import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import ScrollToTop from "./components/ScrollToTop";
import { AuthProvider } from "@/lib/AuthContext";
import { CartProvider } from "@/lib/CartContext";
import { WishlistProvider } from "@/lib/WishlistContext";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import Account from "./pages/Account";
import SearchResults from "./pages/SearchResults";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminProductForm = lazy(() => import("./pages/admin/AdminProductForm"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminInventory = lazy(() => import("./pages/admin/AdminInventory"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminLogs = lazy(() => import("./pages/admin/AdminLogs"));

const Loading = () => <div className="p-8 text-obsidian/50">Carregando...</div>;

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <CartProvider>
          <WishlistProvider>
            <Router>
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/produtos" element={<Shop />} />
                <Route path="/produto/:slug" element={<ProductDetail />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/pedido/sucesso" element={<PaymentSuccess />} />
                <Route path="/conta" element={<Account />} />
                <Route path="/busca" element={<SearchResults />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/admin" element={<Suspense fallback={<Loading />}><AdminLayout /></Suspense>}>
                  <Route index element={<Suspense fallback={<Loading />}><AdminDashboard /></Suspense>} />
                  <Route path="produtos" element={<Suspense fallback={<Loading />}><AdminProducts /></Suspense>} />
                  <Route path="produtos/:id" element={<Suspense fallback={<Loading />}><AdminProductForm /></Suspense>} />
                  <Route path="estoque" element={<Suspense fallback={<Loading />}><AdminInventory /></Suspense>} />
                  <Route path="pedidos" element={<Suspense fallback={<Loading />}><AdminOrders /></Suspense>} />
                  <Route path="categorias" element={<Suspense fallback={<Loading />}><AdminCategories /></Suspense>} />
                  <Route path="cupons" element={<Suspense fallback={<Loading />}><AdminCoupons /></Suspense>} />
                  <Route path="clientes" element={<Suspense fallback={<Loading />}><AdminCustomers /></Suspense>} />
                  <Route path="logs" element={<Suspense fallback={<Loading />}><AdminLogs /></Suspense>} />
                </Route>
                <Route path="*" element={<PageNotFound />} />
              </Routes>
            </Router>
            <Toaster />
          </WishlistProvider>
        </CartProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
