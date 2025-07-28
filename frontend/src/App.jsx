import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import ProtectedRoute from "./components/routes/ProtectedRoute";
import PublicRoute from "./components/routes/PublicRoute";
import Home from "./pages/Home";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Cart from "./pages/Cart";
import Payment from "./pages/Payment";
import PaymentManager from "./pages/PaymentManager";
import DiscountsPage from "./pages/DiscountsPage";
import ProductDetail from "./pages/ProductDetail";
import SellerProfile from "./pages/SellerProfile";
import BodyScan from "./pages/BodyScan";
// Importing the AdminD
import AdminDashboard from "./admin/AdminDashboard";
import AdminGraphs from "./admin/AdminGraphs";
import UserTable from "./admin/UserTable";
import ProductTable from "./admin/ProductTable";
import SellerTable from "./admin/SellerTable";
import OrdersTable from "./admin/OrdersTable";

const theme = createTheme();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <CartProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products"
                element={
                  <ProtectedRoute>
                    <Products />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cart"
                element={
                  <ProtectedRoute>
                    <Cart />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment"
                element={
                  <ProtectedRoute>
                    <Payment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment-manager"
                element={
                  <ProtectedRoute>
                    <PaymentManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/discounts"
                element={
                  <ProtectedRoute>
                    <DiscountsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bodyscan"
                element={
                  <ProtectedRoute>
                    <BodyScan />
                  </ProtectedRoute>
                }
              />
              <Route path="/products/:productId" element={<ProductDetail />} />
              <Route path="/seller/:sellerId" element={<SellerProfile />} />

              <Route
                path="/admin/dashboard"
                element={
                <ProtectedRoute isAdmin={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/graphs"
                element={
                  <ProtectedRoute>
                    <AdminGraphs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute>
                    <UserTable />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/products"
                element={
                  <ProtectedRoute>
                    <ProductTable />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/sellers"
                element={
                  <ProtectedRoute>
                    <SellerTable />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/orders"
                element={
                  <ProtectedRoute>
                    <OrdersTable />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
