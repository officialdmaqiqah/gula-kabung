import React from 'react';
import { ShoppingCart, Package, Info } from 'lucide-react';
import { formatRupiah } from '../utils/format';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="group bg-white rounded-[2rem] shadow-sm hover:shadow-2xl border border-brown-50 overflow-hidden transition-all duration-500 hover:-translate-y-2 flex flex-col h-full">
      <div className="relative aspect-[4/5] overflow-hidden bg-brown-50">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <span className="glass py-1 px-3 rounded-full text-[10px] font-bold text-white tracking-widest uppercase backdrop-blur-md">
            {product.weight}
          </span>
          {product.category === 'Heritage' && (
            <span className="bg-gold-500 py-1 px-3 rounded-full text-[10px] font-bold text-brown-950 tracking-widest uppercase">
              Authentic
            </span>
          )}
        </div>
        
        {isOutOfStock && (
          <div className="absolute inset-0 bg-brown-950/60 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-white/10 glass border border-white/20 text-white px-6 py-2 rounded-full font-extrabold text-xs uppercase tracking-widest">
              Stok Habis
            </span>
          </div>
        )}
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        <div className="mb-4">
          <h3 className="text-xl font-heading font-extrabold text-brown-900 group-hover:text-gold-600 transition-colors">
            {product.name}
          </h3>
          <div className="text-[10px] font-bold text-brown-400 uppercase tracking-widest mt-1">
            Belitung Selatan • {product.category || 'Palm Sugar'}
          </div>
        </div>
        
        <p className="text-xs text-brown-500 mb-6 flex-grow line-clamp-3 leading-relaxed">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between mt-auto pt-6 border-t border-brown-50">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-brown-400 uppercase tracking-widest">Harga</span>
            <div className="text-xl font-heading font-black text-brown-900">
              {formatRupiah(product.price)}
            </div>
          </div>
          
          <button
            onClick={() => addToCart(product)}
            disabled={isOutOfStock}
            className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all ${
              isOutOfStock
                ? 'bg-brown-100 text-brown-400 cursor-not-allowed'
                : 'bg-brown-950 hover:bg-gold-500 text-white hover:text-brown-950 active:scale-95 shadow-lg hover:shadow-gold-500/20'
            }`}
            title="Tambah ke Keranjang"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
