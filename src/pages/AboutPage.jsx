import React from 'react';
import { Leaf, Award, Shield, Users, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-brand-cream font-sans pt-40 pb-32 overflow-x-hidden">
      <div className="w-full max-w-[1200px] mx-auto px-6 md:px-16 xl:px-24">
        
        {/* Header Section */}
        <div className="text-center mb-24 animate-fade-in">
          <div className="inline-flex items-center justify-center gap-3 py-2 px-5 rounded-full bg-brand-brown/5 border border-brand-brown/10 text-brand-brown text-[10px] font-black tracking-[0.4em] uppercase mb-10">
            <Leaf className="w-4 h-4 text-brand-gold" /> Cerita Dari Belitung
          </div>
          <h1 className="text-6xl md:text-8xl font-heading font-black text-brand-brown mb-10 tracking-tighter leading-none">
            Dedikasi Untuk <br className="hidden md:block"/> <span className="text-brand-gold italic font-light">Kemurnian.</span>
          </h1>
          <p className="text-brand-brown/60 text-xl font-medium max-w-3xl mx-auto leading-relaxed italic">
            "Lebih dari sekadar pemanis, ini adalah tentang merawat tradisi, menjaga alam, dan memberdayakan masyarakat lokal Belitung Selatan."
          </p>
        </div>

        {/* Hero Image Section */}
        <div className="relative mb-32 group animate-slide-up">
          <div className="w-full aspect-[21/9] rounded-[3rem] overflow-hidden shadow-2xl border-[12px] border-white">
            <img 
              src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=2000" 
              alt="Hutan Aren Belitung" 
              className="w-full h-full object-cover grayscale-[0.2] group-hover:scale-105 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-brand-brown/20 mix-blend-overlay" />
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-gold rounded-full flex items-center justify-center text-brand-brown shadow-2xl border-8 border-white animate-bounce-subtle z-10">
            <Award className="w-16 h-16" />
          </div>
        </div>

        {/* Content Section */}
        <div className="grid lg:grid-cols-2 gap-20 items-start mb-32">
          <div className="space-y-10 animate-slide-up">
            <div>
              <h3 className="text-xs font-black text-brand-gold uppercase tracking-[0.5em] mb-6">Warisan Budaya</h3>
              <h2 className="text-4xl font-heading font-black text-brand-brown leading-tight tracking-tight mb-8">Lahir Dari Tanah <br/> Laskar Pelangi.</h2>
              <p className="text-brand-brown/70 text-lg leading-relaxed font-medium">
                Berawal dari Gunung Riting, Membalong, kami tumbuh bersama alam Belitung yang eksotis. Gula Kabung (Gula Aren Belitung) adalah permata tersembunyi yang diproses dengan cara yang tidak berubah selama puluhan tahun.
              </p>
            </div>
            <p className="text-brand-brown/70 text-lg leading-relaxed font-medium">
              Kami percaya bahwa kualitas terbaik hanya bisa didapat melalui kesabaran. Setiap tetes nira dikumpulkan secara manual oleh para penderes lokal, dipanaskan di atas kayu bakar selama berjam-jam hingga mengental dan menciptakan aroma karamel yang surgawi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-slide-up animation-delay-200">
            {[
              { title: '100% Organik', desc: 'Tanpa pupuk kimia atau pestisida buatan.', icon: Leaf },
              { title: 'Local Pride', desc: 'Memberdayakan keluarga penderes lokal.', icon: Users },
              { title: 'Zero Waste', desc: 'Proses produksi yang ramah lingkungan.', icon: Heart },
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-[2rem] border border-brand-brown/5 shadow-sm hover:shadow-xl hover:border-brand-gold/30 transition-all group">
                <div className="w-12 h-12 bg-brand-brown/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-gold transition-colors">
                  <feature.icon className="w-6 h-6 text-brand-brown group-hover:text-white transition-colors" />
                </div>
                <h4 className="font-heading font-black text-brand-brown mb-3 tracking-tight">{feature.title}</h4>
                <p className="text-brand-brown/40 text-xs font-bold leading-relaxed tracking-wide uppercase">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Vision Section */}
        <div className="bg-brand-brown rounded-[4rem] p-16 md:p-24 text-center text-white relative overflow-hidden animate-slide-up">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-gold/10 via-transparent to-transparent pointer-events-none" />
          <div className="max-w-3xl mx-auto relative z-10">
            <h2 className="text-4xl md:text-6xl font-heading font-black mb-10 leading-tight tracking-tight">Misi Kami Adalah <span className="text-brand-gold italic font-light">Kesejahteraan.</span></h2>
            <p className="text-xl text-white/60 font-medium leading-relaxed mb-12">
              Kami tidak hanya menjual produk; kami membangun ekosistem di mana setiap pembelian Anda berkontribusi langsung pada kesejahteraan penderes dan kelestarian hutan Belitung.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <div className="px-10 py-5 bg-white/10 rounded-2xl border border-white/20">
                <Heart className="w-8 h-8 text-brand-gold mx-auto mb-1" />
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Petani Mitra Lokal</p>
              </div>
              <div className="px-10 py-5 bg-white/10 rounded-2xl border border-white/20">
                <p className="text-2xl font-black text-brand-gold mb-1">100%</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Tanpa Campuran</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce-subtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        .animate-fade-in { animation: fade-in 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-up { animation: slide-up 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .animate-bounce-subtle { animation: bounce-subtle 4s ease-in-out infinite; }
        .animation-delay-200 { animation-delay: 200ms; }
      `}} />
    </div>
  );
}
