import React, { useState, useEffect } from 'react';
import { Leaf, Search, Filter, ShoppingBag, ArrowRight, Grid, List, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatRupiah } from '../utils/format';
import { useCart } from '../context/CartContext';

export default function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('kabung_products')
        .select('*')
        .eq('status_aktif', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedData = data.map(p => ({
        id: p.id,
        name: p.nama_produk,
        price: p.harga_jual,
        formattedPrice: formatRupiah(p.harga_jual),
        label: p.stok <= 0 ? 'Habis' : (p.stok <= 5 ? 'Stok Menipis' : ''),
        category: p.kategori || 'Lainnya',
        image: p.image_url,
        description: p.deskripsi,
        stok: p.stok,
        ukuran: p.ukuran || ''
      }));

      setProducts(mappedData);
    } catch (error) {
      console.error('Error fetching catalog:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Semua', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'Semua' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-brand-cream font-sans pt-32 pb-32">
      <div className="w-full max-w-[1400px] mx-auto px-6 md:px-16 xl:px-24">
        
        {/* Header Section */}
        <div className="mb-20 text-center md:text-left animate-fade-in">
          <div className="inline-flex items-center gap-3 py-2 px-5 rounded-full bg-brand-brown/5 border border-brand-brown/10 text-brand-brown text-[10px] font-black tracking-[0.3em] uppercase mb-8">
            <Leaf className="w-4 h-4 text-brand-gold" /> Koleksi Pilihan
          </div>
          <h1 className="text-5xl md:text-7xl font-heading font-black text-brand-brown mb-8 tracking-tighter leading-none">
            Katalog <span className="text-brand-gold italic font-light">Eksklusif.</span>
          </h1>
          <p className="text-brand-brown/60 max-w-2xl text-lg font-medium leading-relaxed mx-auto md:mx-0">
            Hadirkan kelezatan alami di setiap masakan Anda dengan pilihan Gula Kabung premium yang diproses secara tradisional.
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-16">
          {/* Categories Tab */}
          <div className="flex items-center gap-3 w-full xl:w-auto overflow-x-auto pb-4 xl:pb-0 no-scrollbar">
            {categories.map((cat) => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border ${
                  activeCategory === cat 
                    ? 'bg-brand-brown text-white border-brand-brown shadow-xl shadow-brand-brown/20' 
                    : 'bg-white text-brand-brown/40 border-brand-brown/5 hover:border-brand-brown/20 hover:text-brand-brown'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full xl:w-96 group">
            <input 
              type="text" 
              placeholder="Cari rasa yang Anda inginkan..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-white border border-brand-brown/5 rounded-[1.5rem] text-sm font-medium focus:outline-none focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/5 transition-all shadow-sm group-hover:shadow-lg"
            />
            <Search className="w-5 h-5 text-brand-brown/20 absolute left-6 top-1/2 -translate-y-1/2 group-focus-within:text-brand-gold transition-colors" />
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 animate-fade-in">
            <Loader2 className="w-16 h-16 text-brand-gold animate-spin mb-6" />
            <p className="text-sm font-black uppercase tracking-[0.3em] text-brand-brown/40">Menyiapkan Koleksi...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {filteredProducts.map((product, i) => (
              <div 
                key={product.id} 
                onClick={() => setSelectedProduct(product)}
                className="group bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-[0_40px_80px_-15px_rgba(88,55,43,0.12)] border border-brand-brown/5 transition-all duration-700 flex flex-col animate-slide-up cursor-pointer"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Product Image Area */}
                <div className="relative w-full aspect-square overflow-hidden bg-brand-brown/5">
                  {product.label && (
                    <span className={`absolute top-6 left-6 text-white text-[9px] font-black uppercase tracking-widest py-2 px-5 rounded-full z-10 shadow-lg ${
                      product.label === 'Habis' ? 'bg-rose-500 shadow-rose-500/30' : 'bg-brand-gold shadow-brand-gold/30'
                    }`}>
                      {product.label}
                    </span>
                  )}
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-12">
                      <ShoppingBag className="w-16 h-16 text-brand-brown/5 group-hover:scale-110 transition-transform duration-700" />
                    </div>
                  )}
                  
                  {/* Quick View Indicator Overlay */}
                  <div className="absolute inset-0 bg-brand-brown/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-6 py-3 bg-white/90 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-brand-brown shadow-2xl">Lihat Detail</span>
                  </div>
                </div>

                {/* Product Info Area */}
                <div className="p-8 flex flex-col flex-grow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-gold">{product.category}</span>
                    {product.stok > 0 && <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Stok Ready</span>}
                  </div>
                  <h3 className="font-heading font-black text-brand-brown text-xl mb-3 tracking-tight group-hover:text-brand-gold transition-colors line-clamp-1">{product.name}</h3>
                  <p className="text-brand-brown/40 text-xs font-medium line-clamp-2 mb-6 leading-relaxed">
                    {product.description || 'Gula Kabung asli Belitung dengan kualitas premium, tanpa bahan pengawet.'}
                  </p>
                  
                  <div className="mt-auto pt-6 border-t border-brand-brown/5 flex items-center justify-between">
                    <p className="text-brand-brown font-black text-2xl tracking-tighter">{product.formattedPrice}</p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="w-12 h-12 rounded-2xl bg-brand-brown/5 text-brand-brown flex items-center justify-center hover:bg-brand-brown hover:text-white transition-all duration-500"
                    >
                      <ShoppingBag className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-[4rem] border border-brand-brown/5 shadow-sm animate-fade-in">
            <div className="w-24 h-24 bg-brand-brown/5 rounded-full flex items-center justify-center mx-auto mb-8">
              <Search className="w-10 h-10 text-brand-brown/20" />
            </div>
            <h3 className="text-3xl font-heading font-black text-brand-brown mb-4 tracking-tight">Tidak Ada Produk.</h3>
            <p className="text-brand-brown/40 mb-10 max-w-sm mx-auto font-medium">Maaf, kami tidak menemukan produk yang Anda cari. Coba ubah kata kunci atau kategori.</p>
            <button onClick={() => {setSearchQuery(''); setActiveCategory('Semua');}} className="text-brand-gold font-black uppercase tracking-widest text-[10px] hover:underline underline-offset-8">Reset Pencarian</button>
          </div>
        )}

        {/* Product Detail Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
            <div className="absolute inset-0 bg-brand-brown/80 backdrop-blur-xl" onClick={() => setSelectedProduct(null)} />
            
            <div className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-[3rem] overflow-hidden shadow-3xl flex flex-col md:flex-row animate-slide-up">
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-8 right-8 w-12 h-12 bg-white/10 hover:bg-white text-white hover:text-brand-brown rounded-2xl z-20 flex items-center justify-center transition-all border border-white/20"
              >
                <Filter className="w-5 h-5 rotate-45" /> {/* Close icon using Filter rotate */}
              </button>

              {/* Modal Image */}
              <div className="w-full md:w-1/2 aspect-square md:aspect-auto bg-brand-brown/5 overflow-hidden">
                {selectedProduct.image ? (
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-24 h-24 text-brand-brown/10" />
                  </div>
                )}
              </div>

              {/* Modal Content */}
              <div className="w-full md:w-1/2 p-10 md:p-16 overflow-y-auto flex flex-col">
                <div className="mb-10">
                  <div className="inline-flex items-center gap-3 py-2 px-5 rounded-full bg-brand-brown/5 border border-brand-brown/10 text-brand-brown text-[10px] font-black tracking-[0.3em] uppercase mb-6">
                    {selectedProduct.category}
                  </div>
                  <h2 className="text-4xl md:text-5xl font-heading font-black text-brand-brown mb-4 tracking-tighter leading-tight">
                    {selectedProduct.name}
                  </h2>
                  {selectedProduct.ukuran && (
                    <p className="text-sm font-bold text-brand-gold uppercase tracking-widest mb-6">Kemasan: {selectedProduct.ukuran}</p>
                  )}
                  <p className="text-brand-brown/60 text-lg font-medium leading-relaxed">
                    {selectedProduct.description || 'Gula Kabung asli Belitung dengan kualitas premium. Diproses secara tradisional untuk mempertahankan kemurnian rasa dan aroma nira aren yang autentik.'}
                  </p>
                </div>

                <div className="mt-auto">
                  <div className="flex items-center justify-between mb-10 pt-10 border-t border-brand-brown/5">
                    <div>
                      <p className="text-[10px] font-black text-brand-brown/30 uppercase tracking-widest mb-1">Harga Premium</p>
                      <p className="text-4xl font-black text-brand-brown tracking-tighter">{selectedProduct.formattedPrice}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-brand-brown/30 uppercase tracking-widest mb-1">Status</p>
                      <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        selectedProduct.stok > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {selectedProduct.stok > 0 ? 'Stok Ready' : 'Habis'}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      addToCart(selectedProduct);
                      setSelectedProduct(null);
                    }}
                    disabled={selectedProduct.stok <= 0}
                    className="w-full py-6 bg-brand-brown text-white rounded-[1.5rem] text-xs font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-brand-gold hover:text-brand-brown transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    {selectedProduct.stok <= 0 ? 'Stok Kosong' : 'Tambah ke Keranjang'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      
      {/* Global Style for Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-up { animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
