import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, ShoppingBag, Leaf } from 'lucide-react';
import CartSummary from '../components/CartSummary';
import OrderForm from '../components/OrderForm';
import { useCart } from '../context/CartContext';

export default function CheckoutPage() {
  const { cart } = useCart();

  return (
    <div className="min-h-screen bg-brand-cream font-sans pt-32 pb-32">
      <div className="w-full max-w-[1400px] mx-auto px-6 md:px-16 xl:px-24">
        
        {/* Header Section */}
        <div className="mb-16 flex flex-col md:flex-row items-center justify-between gap-8 animate-fade-in">
          <div className="flex items-center gap-8">
            <Link 
              to="/catalog" 
              className="w-14 h-14 flex items-center justify-center bg-white rounded-2xl text-brand-brown shadow-sm border border-brand-brown/5 hover:border-brand-gold hover:text-brand-gold transition-all duration-500 group"
            >
              <ArrowLeft className="w-6 h-6 group-hover:-translate-x-2 transition-transform" />
            </Link>
            <div>
              <div className="flex items-center gap-3 text-brand-gold font-black text-[10px] uppercase tracking-[0.4em] mb-2">
                <Leaf className="w-4 h-4" /> Finalisasi Pesanan
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black text-brand-brown tracking-tighter">Checkout.</h1>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4 px-6 py-3 bg-white/50 backdrop-blur-md rounded-2xl border border-brand-brown/5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-brand-brown/40 uppercase tracking-widest">Enkripsi Aman via WhatsApp</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-16 items-start">
          {/* Form Section */}
          <div className="lg:col-span-8 animate-slide-up">
            <div className="bg-white rounded-[3rem] p-2 md:p-4 shadow-xl shadow-brand-brown/5 border border-brand-brown/5 overflow-hidden">
              <OrderForm />
            </div>
          </div>

          {/* Sidebar Section */}
          <div className="lg:col-span-4 lg:sticky lg:top-32 space-y-8 animate-slide-up animation-delay-200">
            <div className="bg-white rounded-[3rem] p-4 shadow-xl shadow-brand-brown/5 border border-brand-brown/5 overflow-hidden">
              <CartSummary />
            </div>
            
            {cart.length > 0 && (
              <div className="bg-brand-brown rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border border-white/5 group">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-gold/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-brand-gold">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black font-heading tracking-tight">Panduan Aman</h3>
                    <p className="text-[10px] font-black text-brand-gold uppercase tracking-widest">Pemesanan Personal</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <p className="text-sm text-white/50 leading-relaxed font-medium">
                    Pesanan Anda akan diteruskan langsung ke tim admin kami via WhatsApp untuk perhitungan ongkos kirim yang akurat.
                  </p>
                  
                  <div className="pt-6 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/80">Konfirmasi Manual</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/80">Pembayaran Transfer/COD</p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-10 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-[9px] font-black text-brand-gold uppercase tracking-[0.2em]">Jam Operasional</div>
                    <div className="text-sm font-bold mt-1">08:00 — 20:00 WIB</div>
                  </div>
                  <ShoppingBag className="w-8 h-8 text-white/5" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-up { animation: slide-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .animation-delay-200 { animation-delay: 200ms; }
      `}} />
    </div>
  );
}
