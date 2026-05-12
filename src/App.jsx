import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import CatalogPage from './pages/CatalogPage';
import CheckoutPage from './pages/CheckoutPage';
import AboutPage from './pages/AboutPage';
import EducationPage from './pages/EducationPage';

// Admin Pages
import { AuthProvider } from './context/AuthContext';
import AdminLayout from './components/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminPurchases from './pages/admin/AdminPurchases';
import AdminSales from './pages/admin/AdminSales';
import AdminFinances from './pages/admin/AdminFinances';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import AdminReceiving from './pages/admin/AdminReceiving';
import AdminMutations from './pages/admin/AdminMutations';

function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#58372B',
            color: '#fff',
            borderRadius: '16px',
            fontSize: '14px',
            fontWeight: 'bold',
            padding: '16px 24px',
            border: '1px solid rgba(223, 173, 91, 0.2)',
          },
          success: {
            iconTheme: {
              primary: '#DFAD5B',
              secondary: '#fff',
            },
          },
          error: {
            style: {
              background: '#fff',
              color: '#58372B',
              border: '1px solid #fee2e2',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          }
        }}
      />
      {!isAdmin && <Header />}
      <main className="flex-grow">
        <AuthProvider>
          <Routes>
            {/* Storefront Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/education" element={<EducationPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="purchases" element={<AdminPurchases />} />
              <Route path="receiving" element={<AdminReceiving />} />
              <Route path="sales" element={<AdminSales />} />
              <Route path="finances" element={<AdminFinances />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="mutations" element={<AdminMutations />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Routes>
        </AuthProvider>
      </main>
    </div>
  );
}

export default App;


