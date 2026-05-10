import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Leaf, ChevronRight, Award, Zap, Star, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatRupiah } from '../utils/format';

export default function LandingPage() {
  const [products, setProducts] = useState([]);
  const [siteSettings, setSiteSettings] = useState({ hero_image: '', whatsapp: '6281234567890' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLandingData();
  }, []);

  const fetchLandingData = async () => {
    try {
      setLoading(true);
      const { data: productsData } = await supabase
        .from('kabung_products')
        .select('*')
        .eq('status_aktif', true)
        .order('created_at', { ascending: false });
      
      const { data: settingsData } = await supabase
        .from('kabung_settings')
        .select('*')
        .eq('id', 'main')
        .single();

      if (productsData) setProducts(productsData);
      if (settingsData) setSiteSettings(settingsData);
    } catch (error) {
      console.error('Error fetching landing data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const SELLER_NUMBER = siteSettings.whatsapp || '6281234567890';
  const chatUrl = `https://wa.me/${SELLER_NUMBER}?text=${encodeURIComponent('Halo, saya ingin bertanya tentang Gula Kabung Belitung.')}`;

  const featuredProducts = products.slice(0, 3).map(p => ({
    id: p.id,
    name: p.nama_produk,
    price: formatRupiah(p.harga_jual),
    label: p.stok <= 0 ? 'Habis' : (p.stok <= 5 ? 'Stok Menipis' : ''),
    image: p.image_url
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center">
        <Loader2 className="w-16 h-16 text-brand-gold animate-spin mb-6" />
        <p className="text-sm font-black uppercase tracking-[0.3em] text-brand-brown/40">Menyambut Anda...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-brand-cream font-sans overflow-x-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-[140px] lg:pt-[180px] pb-20 lg:pb-32 px-6 md:px-16 xl:px-24 max-w-[1400px] mx-auto w-full">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          
          {/* TEXT CONTENT */}
          <div className="w-full lg:w-3/5 flex flex-col justify-center text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2 py-2 px-5 rounded-full bg-brand-brown/5 border border-brand-brown/10 text-brand-brown text-[10px] font-black tracking-[0.3em] uppercase mb-10 self-center lg:self-start animate-fade-in">
              <Star className="w-3 h-3 text-brand-gold fill-brand-gold" /> Terpercaya Sejak 1985
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-black text-brand-brown mb-8 leading-[1] tracking-tight animate-slide-up">
              Manisnya <br className="hidden md:block"/>
              <span className="text-brand-gold italic font-light">Warisan</span> Alam.
            </h1>
            
            <p className="text-lg md:text-xl text-brand-brown/70 mb-12 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium animate-slide-up animation-delay-200">
              Gula Kabung premium yang diproses secara tradisional dari pedalaman Belitung. Kemurnian nira aren asli tanpa campuran bahan kimia.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-slide-up animation-delay-400">
              <Link
                to="/catalog"
                className="w-full sm:w-auto h-16 px-10 bg-brand-brown text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-brand-gold hover:text-brand-brown transition-all duration-500 shadow-2xl shadow-brand-brown/20 group"
              >
                Eksplor Produk <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </Link>
              <Link
                to="/about"
                className="w-full sm:w-auto h-16 px-10 bg-white/50 backdrop-blur-md text-brand-brown border border-brand-brown/10 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-white transition-all flex items-center justify-center"
              >
                Kisah Kami
              </Link>
            </div>
          </div>

          {/* IMAGE CONTENT */}
          <div className="w-full lg:w-2/5 relative flex justify-center lg:justify-end animate-fade-in animation-delay-600">
            <div className="relative w-full max-w-[450px] aspect-[4/5] rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(88,55,43,0.3)] border-[12px] border-white group">
              <img 
                src={siteSettings.hero_image || "https://images.unsplash.com/photo-1596450514735-30089f28941f?auto=format&fit=crop&q=80&w=1000"} 
                alt="Gula Kabung Belitung" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-brown/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            
            {/* Floating Badges */}
            <div className="absolute -bottom-8 -left-8 md:bottom-12 md:-left-12 bg-white p-6 rounded-3xl shadow-2xl border border-brand-brown/5 flex items-start gap-4 max-w-[260px] animate-bounce-subtle">
              <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-brand-gold" />
              </div>
              <div>
                <p className="text-[10px] font-black text-brand-brown uppercase tracking-widest mb-1">Warisan Belitung</p>
                <p className="text-[10px] text-brand-brown/50 leading-snug font-bold">Diproses secara higienis & 100% Alami.</p>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* 2. STATS SECTION */}
      <section className="py-20 bg-white relative">
        <div className="absolute inset-0 bg-brand-brown/[0.02] pointer-events-none" />
        <div className="w-full max-w-[1400px] mx-auto px-6 md:px-16 xl:px-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8 divide-x-0 md:divide-x divide-brand-brown/10">
            {[
              { label: '100%', desc: 'Alami & Murni', icon: Leaf },
              { label: '0%', desc: 'Bahan Pengawet', icon: ShieldCheck },
              { label: '35+', desc: 'Tahun Pengalaman', icon: Award },
              { label: 'Pro', desc: 'Higiene Terjamin', icon: Zap },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center justify-center text-center px-4 group">
                <div className="w-12 h-12 rounded-2xl bg-brand-brown/5 flex items-center justify-center mb-4 group-hover:bg-brand-gold transition-colors duration-500">
                  <stat.icon className="w-5 h-5 text-brand-brown group-hover:text-white transition-colors" />
                </div>
                <span className="text-4xl font-heading font-black text-brand-brown mb-1 tracking-tighter">{stat.label}</span>
                <span className="text-[10px] font-black text-brand-brown/30 uppercase tracking-[0.2em]">{stat.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS */}
      {featuredProducts.length > 0 && (
        <section className="py-32 bg-brand-cream/50 overflow-hidden">
          <div className="w-full max-w-[1400px] mx-auto px-6 md:px-16 xl:px-24">
            <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
              <div className="max-w-xl text-center md:text-left">
                <div className="text-brand-gold font-black tracking-[0.4em] text-[10px] uppercase mb-4">Edisi Terbatas</div>
                <h2 className="text-5xl md:text-6xl font-heading font-black text-brand-brown leading-tight">Produk <span className="italic font-light">Pilihan.</span></h2>
              </div>
              <Link to="/catalog" className="group flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-brand-brown hover:text-brand-gold transition-all">
                Buka Katalog Lengkap <div className="w-10 h-10 rounded-full border border-brand-brown/10 flex items-center justify-center group-hover:border-brand-gold group-hover:bg-brand-gold group-hover:text-white transition-all"><ChevronRight className="w-4 h-4" /></div>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              {featuredProducts.map((product) => (
                <Link key={product.id} to="/catalog" className="group relative bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-[0_40px_80px_-15px_rgba(88,55,43,0.15)] border border-brand-brown/5 transition-all duration-700">
                  <div className="relative w-full aspect-[4/3] overflow-hidden bg-brand-brown/5">
                    {product.label && (
                      <span className="absolute top-6 left-6 bg-brand-gold text-brand-brown text-[9px] font-black uppercase tracking-widest py-2 px-5 rounded-full z-10 shadow-xl shadow-brand-gold/20">
                        {product.label}
                      </span>
                    )}
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    ) : (
                      <Award className="w-16 h-16 text-brand-brown opacity-10 absolute inset-0 m-auto group-hover:scale-125 transition-transform duration-700" />
                    )}
                  </div>
                  <div className="p-10">
                    <h3 className="font-heading font-black text-brand-brown text-xl mb-3 tracking-tight group-hover:text-brand-gold transition-colors">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <p className="text-brand-brown/40 font-black text-[10px] uppercase tracking-widest">Harga Mulai</p>
                      <p className="text-brand-brown font-black text-2xl tracking-tighter">{product.price}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. BANNER / CTA */}
      <section className="py-32 px-6">
        <div className="w-full max-w-[1200px] mx-auto relative rounded-[3rem] overflow-hidden bg-brand-brown p-12 md:p-24 text-center border border-white/10 shadow-3xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-gold/20 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-heading font-black text-white mb-8 leading-tight">Sehat Dimulai dari <span className="text-brand-gold italic font-light">Pilihan Tepat.</span></h2>
            <p className="text-lg text-white/60 mb-12 font-medium leading-relaxed">Bergabunglah dengan ribuan keluarga yang telah beralih ke pemanis alami asli Belitung.</p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
              <a href={chatUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto h-16 px-10 bg-brand-gold text-brand-brown rounded-2xl text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:scale-105 transition-all shadow-2xl shadow-brand-gold/20">
                Hubungi via WhatsApp
              </a>
              <Link to="/catalog" className="text-white text-xs font-black uppercase tracking-[0.3em] hover:text-brand-gold transition-colors">
                Lihat Koleksi Produk
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-24 bg-brand-brown text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-gold/30 to-transparent" />
        <div className="w-full max-w-[1400px] mx-auto px-6 md:px-16 xl:px-24">
          <div className="grid md:grid-cols-12 gap-16 mb-24">
            <div className="md:col-span-5">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
                  <Leaf className="h-7 w-7 text-brand-gold" />
                </div>
                <div>
                  <span className="font-heading font-black text-3xl tracking-tighter block leading-none">GULA KABUNG</span>
                  <span className="text-[10px] font-black text-brand-gold uppercase tracking-[0.4em] mt-2 block">Heritage Belitung</span>
                </div>
              </div>
              <p className="text-white/40 text-lg leading-relaxed max-w-md font-medium italic">
                "Melestarikan tradisi, menghadirkan kemurnian nira aren terbaik dari bumi Laskar Pelangi langsung ke meja Anda."
              </p>
            </div>
            
            <div className="md:col-span-2 md:col-start-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-gold mb-10">Navigasi</h4>
              <ul className="space-y-6 text-xs font-black uppercase tracking-[0.2em] text-white/50">
                <li><Link to="/catalog" className="hover:text-white transition-colors">Katalog Produk</Link></li>
                <li><Link to="/about" className="hover:text-white transition-colors">Kisah Kami</Link></li>
                <li><Link to="/education" className="hover:text-white transition-colors">Edukasi Nira</Link></li>
              </ul>
            </div>
            
            <div className="md:col-span-3">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-gold mb-10">Kontak Kami</h4>
              <ul className="space-y-6 text-xs font-black uppercase tracking-[0.2em] text-white/50">
                <li className="flex items-start gap-4">
                  <span className="text-brand-gold">Lokasi:</span>
                  <span>Gunung Riting, Membalong, Belitung Selatan</span>
                </li>
                <li className="flex items-center gap-4">
                  <span className="text-brand-gold">Social:</span>
                  <div className="flex gap-4">
                    <a href="#" className="hover:text-white transition-colors underline decoration-brand-gold underline-offset-4">IG</a>
                    <a href="#" className="hover:text-white transition-colors underline decoration-brand-gold underline-offset-4">WA</a>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
            <p>&copy; {new Date().getFullYear()} Gula Kabung Belitung. Terdaftar sebagai Merek Premium.</p>
            <div className="flex gap-10">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Global CSS for animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-fade-in { animation: fade-in 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-up { animation: slide-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .animate-bounce-subtle { animation: bounce-subtle 4s ease-in-out infinite; }
        .animation-delay-200 { animation-delay: 200ms; }
        .animation-delay-400 { animation-delay: 400ms; }
        .animation-delay-600 { animation-delay: 600ms; }
      `}} />
    </div>
  );
}
