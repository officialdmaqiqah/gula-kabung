import React from 'react';
import { Building2, ShieldCheck, Truck, Users } from 'lucide-react';

import { useLocalStorage } from '../hooks/useLocalStorage';

export default function B2BPage() {
  const [siteSettings] = useLocalStorage('kabungmart_settings', { whatsapp: '6281234567890' });
  const SELLER_NUMBER = siteSettings.whatsapp || '6281234567890';
  const b2bChatUrl = `https://wa.me/${SELLER_NUMBER}?text=${encodeURIComponent('Halo, saya tertarik untuk kerjasama B2B / Reseller Gula Kabung.')}`;

  return (
    <div className="min-h-screen bg-brand-cream font-sans pt-32 pb-24">
      <div className="w-full max-w-[1400px] mx-auto px-6 md:px-16 xl:px-24">
        
        {/* Header Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center gap-2 py-1.5 px-4 rounded-full bg-brand-brown/5 border border-brand-brown/10 text-brand-brown text-xs font-bold tracking-widest uppercase mb-6">
            <Building2 className="w-3.5 h-3.5 text-brand-gold" /> B2B & Reseller
          </div>
          <h1 className="text-4xl md:text-6xl font-heading font-black text-brand-brown mb-6 tracking-tight">
            Bertumbuh <span className="text-brand-gold italic font-light">Bersama Kami.</span>
          </h1>
          <p className="text-brand-brown/70 text-lg font-medium max-w-2xl mx-auto">
            Dapatkan harga khusus dan jaminan pasokan Gula Kabung berkualitas premium untuk bisnis kuliner atau jaringan retail Anda.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {[
            { icon: <ShieldCheck />, title: 'Jaminan Kualitas', desc: 'Produk diproses secara higienis dengan standar kualitas yang ketat.' },
            { icon: <Truck />, title: 'Pasokan Stabil', desc: 'Kapasitas produksi besar dari gabungan petani aren lokal di Belitung.' },
            { icon: <Users />, title: 'Dukungan Bisnis', desc: 'Materi promosi dan edukasi produk khusus untuk jaringan reseller kami.' },
          ].map((benefit, i) => (
            <div key={i} className="bg-white rounded-[2rem] p-8 shadow-sm border border-black/5 hover:border-brand-brown/20 transition-all text-center">
              <div className="w-16 h-16 bg-brand-brown/5 text-brand-gold rounded-2xl flex items-center justify-center mx-auto mb-6">
                {React.cloneElement(benefit.icon, { className: 'w-8 h-8' })}
              </div>
              <h3 className="font-bold text-brand-brown text-xl mb-3">{benefit.title}</h3>
              <p className="text-gray-500 text-sm">{benefit.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-brand-brown rounded-[3rem] p-12 md:p-20 text-center text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-heading font-black mb-6">Mulai Kerjasama</h2>
            <p className="text-white/70 max-w-2xl mx-auto mb-10 text-lg">
              Diskusikan kebutuhan volume dan skema harga bersama tim B2B kami. Kami siap melayani pengiriman ke seluruh Indonesia.
            </p>
            <a 
              href={b2bChatUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 h-14 px-10 bg-brand-gold text-white font-bold uppercase tracking-widest text-sm rounded-xl hover:bg-brand-gold/90 transition-all"
            >
              Hubungi Tim B2B Sekarang
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
