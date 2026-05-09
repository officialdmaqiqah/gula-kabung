import React from 'react';
import { Minus, Plus, Trash2, ShoppingCart, Tag } from 'lucide-react';
import { formatRupiah } from '../utils/format';
import { useCart } from '../context/CartContext';

export default function CartSummary() {
  const { cart, updateQuantity, removeFromCart, getCartTotal } = useCart();

  if (cart.length === 0) {
    return (
      <div className="p-16 text-center">
        <div className="w-24 h-24 bg-brand-brown/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-brand-brown/10">
          <ShoppingCart className="w-10 h-10" />
        </div>
        <p className="text-brand-brown/30 font-black uppercase tracking-[0.3em] text-[10px]">Keranjang Belum Terisi</p>
      </div>
    );
  }

  return (
    <div className="p-10 lg:p-12">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-2 h-8 bg-brand-gold rounded-full"></div>
        <div>
          <h2 className="text-2xl font-heading font-black text-brand-brown tracking-tight">Rincian Belanja</h2>
          <p className="text-[9px] font-black text-brand-brown/30 uppercase tracking-widest mt-1">Item yang Anda pilih</p>
        </div>
      </div>
      
      <div className="space-y-8 mb-12">
        {cart.map((item) => (
          <div key={item.id} className="flex flex-col gap-4 group animate-fade-in">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <h4 className="font-heading font-black text-brand-brown text-base tracking-tight group-hover:text-brand-gold transition-colors">{item.name}</h4>
                <div className="flex items-center gap-2 mt-1.5">
                  <Tag className="w-3 h-3 text-brand-gold" />
                  <span className="text-[10px] font-black text-brand-brown/30 uppercase tracking-widest">
                    {formatRupiah(item.price)} / pcs
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => removeFromCart(item.id)}
                className="w-10 h-10 flex items-center justify-center text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                title="Hapus Item"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-brand-brown/5">
              <div className="flex items-center bg-brand-brown/5 rounded-xl p-1.5 border border-brand-brown/5">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center bg-white shadow-sm hover:bg-brand-brown hover:text-white rounded-lg transition-all text-brand-brown"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center text-sm font-black text-brand-brown">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center bg-white shadow-sm hover:bg-brand-brown hover:text-white rounded-lg transition-all text-brand-brown"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="font-black text-brand-brown text-lg tracking-tighter">
                {formatRupiah(item.price * item.quantity)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-10 border-t-2 border-brand-brown/10">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-[9px] font-black text-brand-brown/30 uppercase tracking-[0.4em] block mb-2">Total Harga (Est.)</span>
            <span className="text-4xl font-heading font-black text-brand-brown tracking-tighter leading-none">
              {formatRupiah(getCartTotal())}
            </span>
          </div>
          <div className="text-[9px] font-black text-brand-gold bg-brand-gold/10 border border-brand-gold/20 px-4 py-2 rounded-xl uppercase tracking-widest">
            Excl. Ongkir
          </div>
        </div>
      </div>
    </div>
  );
}
