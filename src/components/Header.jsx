import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, Leaf } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { getCartCount } = useCart();
  const [siteSettings] = useLocalStorage('kabungmart_settings', { whatsapp: '6281234567890' });
  
  const cartCount = getCartCount();
  const SELLER_NUMBER = siteSettings.whatsapp || '6281234567890';

  const navLinks = [
    { name: 'Beranda', path: '/' },
    { name: 'Katalog Produk', path: '/catalog' },
    { name: 'Kisah Kami', path: '/about' },
    { name: 'Edukasi Nira', path: '/education' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on navigation
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-700 h-24 flex items-center ${
        isScrolled ? 'bg-white/80 backdrop-blur-xl shadow-2xl border-b border-brand-brown/5' : 'bg-transparent'
      }`}>
        <div className="w-full max-w-[1400px] mx-auto px-6 md:px-16 xl:px-24">
          <div className="flex justify-between items-center h-full">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-brand-brown rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-12 shadow-xl shadow-brand-brown/20">
                <Leaf className="h-6 w-6 text-brand-gold" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-black text-xl text-brand-brown leading-none tracking-tighter uppercase">Gula <span className="text-brand-gold italic">Kabung</span></span>
                <span className="text-[9px] font-bold tracking-[0.3em] text-brand-brown/40 uppercase mt-1">Heritage Belitung</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden xl:flex items-center justify-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${
                    isActive(link.path) 
                      ? 'text-brand-brown bg-brand-brown/5' 
                      : 'text-brand-brown/50 hover:text-brand-brown hover:bg-brand-brown/5'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link 
                to="/checkout" 
                className={`relative w-12 h-12 flex items-center justify-center rounded-2xl transition-all border shadow-sm group ${
                  isScrolled ? 'bg-brand-brown text-white border-brand-brown' : 'bg-white/20 border-white/30 backdrop-blur-md'
                }`}
              >
                <ShoppingCart className={`h-5 w-5 transition-transform group-hover:scale-110 ${isScrolled ? 'text-white' : 'text-brand-brown'}`} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[9px] font-black text-white bg-brand-gold rounded-full shadow-md border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </Link>
              
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`xl:hidden w-12 h-12 flex items-center justify-center rounded-2xl transition-all border ${
                  isMenuOpen ? 'bg-brand-brown text-white border-brand-brown' : 'bg-brand-brown/5 border-brand-brown/5 text-brand-brown'
                }`}
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modern Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-50 xl:hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
      }`}>
        <div className="absolute inset-0 bg-brand-brown/95 backdrop-blur-2xl" />
        <div className="relative h-full flex flex-col justify-center items-center p-10">
          <nav className="flex flex-col items-center gap-4 w-full">
            {navLinks.map((link, i) => (
              <Link
                key={link.name}
                to={link.path}
                className={`w-full max-w-sm px-10 py-6 rounded-3xl text-center text-lg font-black uppercase tracking-[0.3em] transition-all duration-500 ${
                  isActive(link.path) 
                    ? 'bg-brand-gold text-white shadow-[0_20px_50px_rgba(212,175,55,0.3)]' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="mt-16 pt-8 border-t border-white/10 w-full max-w-sm text-center">
            <p className="text-[10px] font-black text-brand-gold uppercase tracking-[0.4em] mb-4">Butuh Bantuan?</p>
            <a href={`https://wa.me/${SELLER_NUMBER}`} className="text-white/60 hover:text-white font-bold transition-colors">WhatsApp Kami</a>
          </div>
        </div>
      </div>
    </>
  );
}
