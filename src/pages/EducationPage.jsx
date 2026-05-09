import React from 'react';
import { BookOpen, Zap, Droplets, Heart } from 'lucide-react';

import { useLocalStorage } from '../hooks/useLocalStorage';

export default function EducationPage() {
  const [siteSettings] = useLocalStorage('kabungmart_settings', { whatsapp: '6281234567890' });
  const SELLER_NUMBER = siteSettings.whatsapp || '6281234567890';

  return (
    <div className="min-h-screen bg-brand-cream font-sans pt-40 pb-32 overflow-x-hidden">
      <div className="w-full max-w-[1100px] mx-auto px-6 md:px-16 xl:px-24">
        
        {/* Header Section */}
        <div className="text-center mb-24 animate-fade-in">
          <div className="inline-flex items-center justify-center gap-3 py-2 px-5 rounded-full bg-brand-brown/5 border border-brand-brown/10 text-brand-brown text-[10px] font-black tracking-[0.4em] uppercase mb-10">
            <BookOpen className="w-4 h-4 text-brand-gold" /> Jurnal Kemurnian
          </div>
          <h1 className="text-6xl md:text-7xl font-heading font-black text-brand-brown mb-8 tracking-tighter leading-none">
            Pengetahuan <span className="text-brand-gold italic font-light">Nira.</span>
          </h1>
          <p className="text-brand-brown/60 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            Menyelami lebih dalam tentang filosofi, proses, dan keunggulan Gula Kabung asli tanah Belitung.
          </p>
        </div>

        {/* Knowledge Grid */}
        <div className="grid gap-12">
          {[
            {
              title: "Filosofi 'Kabung' di Belitung",
              desc: "Memahami mengapa gula aren di tanah Laskar Pelangi memiliki cita rasa yang tak tertandingi oleh daerah manapun.",
              content: "Gula Kabung adalah sebutan masyarakat lokal Belitung untuk emas cair yang dihasilkan oleh pohon aren. Keunikan utamanya terletak pada ekosistem tanah Belitung yang kaya akan mineral purba. Mineral ini diserap oleh akar pohon aren, memberikan karakteristik rasa karamel yang sangat pekat, gurih, dan memiliki aroma 'floral' yang khas saat diolah menjadi gula.",
              icon: Zap,
              color: 'brand-gold'
            },
            {
              title: "Keajaiban Glikemik Rendah",
              desc: "Alasan mengapa Gula Kabung adalah pilihan pemanis terbaik untuk gaya hidup sehat masa kini.",
              content: "Dibandingkan dengan gula tebu atau pemanis buatan, Gula Kabung memiliki Indeks Glikemik (IG) yang sangat rendah (sekitar 35). Hal ini berarti energi dilepaskan secara perlahan ke dalam aliran darah, mencegah lonjakan insulin yang drastis. Selain itu, kandungan zat besi, kalium, dan magnesium alami tetap terjaga sempurna berkat proses pemanasan suhu rendah yang kami terapkan.",
              icon: Heart,
              color: 'rose-500'
            },
            {
              title: "Ritual Penyadapan Tradisional",
              desc: "Setiap butir Gula Kabung adalah hasil dari kerja keras dan kesabaran para penderes lokal.",
              content: "Proses dimulai sebelum matahari terbit. Para penderes memanjat pohon aren setinggi 15 meter untuk mengumpulkan nira murni. Nira ini sangat sensitif; jika tidak segera dimasak dalam waktu 2 jam, ia akan berubah menjadi asam. Inilah mengapa efisiensi dan kecepatan tangan tradisional sangat menentukan kualitas akhir Gula Kabung yang Anda nikmati.",
              icon: Droplets,
              color: 'brand-brown'
            }
          ].map((article, i) => (
            <div key={i} className="group bg-white rounded-[3rem] p-10 md:p-16 shadow-xl shadow-brand-brown/5 border border-brand-brown/5 hover:border-brand-gold/20 transition-all duration-700 animate-slide-up" style={{ animationDelay: `${i * 200}ms` }}>
              <div className="flex flex-col md:flex-row gap-10 md:items-start">
                <div className={`w-16 h-16 shrink-0 rounded-2xl bg-brand-brown/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                  <article.icon className={`w-8 h-8 text-brand-brown`} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.4em] mb-4">{article.desc}</h4>
                  <h2 className="text-3xl md:text-4xl font-heading font-black text-brand-brown mb-8 tracking-tight group-hover:text-brand-gold transition-colors">{article.title}</h2>
                  <p className="text-brand-brown/60 leading-relaxed text-lg font-medium">{article.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Section */}
        <div className="mt-24 p-12 bg-brand-brown rounded-[3rem] text-center text-white relative overflow-hidden animate-slide-up">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-brand-gold/10 via-transparent to-transparent pointer-events-none" />
          <h3 className="text-2xl font-heading font-black mb-6">Ingin Tahu Lebih Lanjut?</h3>
          <p className="text-white/40 mb-8 font-medium">Tim kami siap berdiskusi tentang detail teknis atau profil rasa produk kami.</p>
          <a href={`https://wa.me/${SELLER_NUMBER}`} className="inline-flex h-14 px-10 bg-brand-gold text-brand-brown rounded-2xl text-[10px] font-black uppercase tracking-widest items-center hover:scale-105 transition-all shadow-2xl shadow-brand-gold/20">Tanya Admin</a>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-up { animation: slide-up 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
      `}} />
    </div>
  );
}
