import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Receipt, 
  BarChart3, 
  LogOut, 
  Menu, 
  X,
  Store,
  Wallet,
  Settings,
  User,
  Home,
  Truck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    // Close sidebar on route change (mobile)
    setIsSidebarOpen(false);
  }, [location.pathname]);

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Produk & Stok', path: '/admin/products', icon: Package },
    { name: 'Pembelian Stok', path: '/admin/purchases', icon: Receipt },
    { name: 'Penerimaan Barang', path: '/admin/receiving', icon: Truck },
    { name: 'Penjualan', path: '/admin/sales', icon: ShoppingCart },
    { name: 'Pencatatan Keuangan', path: '/admin/finances', icon: Wallet },
    { name: 'Laporan Laba Rugi', path: '/admin/reports', icon: BarChart3 },
    { name: 'Pengaturan', path: '/admin/settings', icon: Settings },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-brand-brown lg:rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/5">
      {/* Sidebar Header */}
      <div className="p-8 border-b border-white/5">
        <Link to="/" className="flex items-center gap-4 group">
          <div className="w-12 h-12 bg-brand-gold rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-12 shadow-xl shadow-brand-gold/20">
            <Store className="w-6 h-6 text-brand-brown" />
          </div>
          <div className="text-white">
            <h1 className="font-heading font-black text-xl leading-none tracking-tighter uppercase">Admin</h1>
            <p className="text-[10px] font-bold text-white tracking-[0.4em] uppercase mt-1">Dashboard</p>
          </div>
        </Link>
      </div>

      {/* Sidebar Nav */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-500 ${
                isActive 
                  ? 'bg-brand-gold text-white shadow-2xl scale-[1.02]' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-brand-gold'}`} />
              <span className="text-xs font-black uppercase tracking-[0.2em]">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-6 border-t border-white/5 space-y-2">
        <Link 
          to="/"
          className="flex items-center gap-4 px-8 py-4 text-white/40 hover:bg-white/5 hover:text-white rounded-2xl transition-all text-[10px] font-black uppercase tracking-[0.2em]"
        >
          <Home className="w-4 h-4" />
          <span>Ke Toko</span>
        </Link>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-4 px-8 py-4 text-rose-400 hover:bg-rose-400/5 rounded-2xl transition-all text-[10px] font-black uppercase tracking-[0.2em]"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-brand-cream flex overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-brand-brown/60 backdrop-blur-sm z-[70] lg:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div className={`fixed inset-y-0 left-0 w-[280px] z-[80] lg:hidden transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <SidebarContent />
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-80 h-full p-6">
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Simple Top Bar */}
        <header className="h-20 flex items-center justify-between px-6 lg:px-10 bg-white/60 backdrop-blur-xl border-b border-brand-brown/5">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar}
              className="lg:hidden p-2 text-brand-brown hover:bg-brand-brown/5 rounded-xl transition-all"
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h2 className="text-[10px] font-black text-brand-brown/20 uppercase tracking-[0.5em] hidden sm:block">
              {navItems.find(l => location.pathname.startsWith(l.path))?.name || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-brand-brown text-white rounded-xl shadow-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto px-6 lg:px-10 py-6 lg:py-10 bg-brand-cream/30">
          <div className="max-w-6xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
