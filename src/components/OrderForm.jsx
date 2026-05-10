import React, { useState, useEffect } from 'react';
import { Send, User, Phone, MapPin, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { formatRupiah } from '../utils/format';

export default function OrderForm() {
  const { cart, getCartTotal, clearCart } = useCart();
  const [siteSettings, setSiteSettings] = useState({ whatsapp: '6281234567890' });
  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [districts, setDistricts] = useState([]);
  
  const [selectedProvince, setSelectedProvince] = useState({ id: '', name: '' });
  const [selectedRegency, setSelectedRegency] = useState({ id: '', name: '' });
  const [selectedDistrict, setSelectedDistrict] = useState({ id: '', name: '' });

  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    address: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then(response => response.json())
      .then(data => setProvinces(data));
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('kabung_settings').select('whatsapp').eq('id', 'main').single();
    if (data) setSiteSettings(data);
  };

  // Fetch Regencies when Province changes
  useEffect(() => {
    if (selectedProvince.id) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProvince.id}.json`)
        .then(response => response.json())
        .then(data => {
          setRegencies(data);
          setDistricts([]);
          setSelectedRegency({ id: '', name: '' });
          setSelectedDistrict({ id: '', name: '' });
        });
    }
  }, [selectedProvince.id]);

  // Fetch Districts when Regency changes
  useEffect(() => {
    if (selectedRegency.id) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedRegency.id}.json`)
        .then(response => response.json())
        .then(data => {
          setDistricts(data);
          setSelectedDistrict({ id: '', name: '' });
        });
    }
  }, [selectedRegency.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Nama wajib diisi';
    if (!formData.whatsapp.trim()) newErrors.whatsapp = 'Nomor WhatsApp wajib diisi';
    if (!selectedProvince.id) newErrors.province = 'Provinsi wajib dipilih';
    if (!selectedRegency.id) newErrors.regency = 'Kota/Kabupaten wajib dipilih';
    if (!selectedDistrict.id) newErrors.district = 'Kecamatan wajib dipilih';
    if (!formData.address.trim()) newErrors.address = 'Alamat lengkap wajib diisi';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert('Keranjang belanja Anda masih kosong.');

    if (validate()) {
      try {
        setSubmitting(true);
        const fullAddress = `${formData.address}, Kec. ${selectedDistrict.name}, ${selectedRegency.name}, Prov. ${selectedProvince.name}`;

        // Create Sales Records in Supabase (Pending Status)
        const salesEntries = cart.map(item => ({
          tanggal: new Date().toISOString().split('T')[0],
          nama_pembeli: formData.name,
          nama_produk: item.name,
          jumlah_terjual: item.quantity,
          total_penjualan: item.price * item.quantity,
          status_pembayaran: 'Belum bayar',
          rekening_id: null // Will be assigned by admin when paid
        }));

        const { error } = await supabase.from('kabung_sales').insert(salesEntries);
        if (error) throw error;

        // Generate WhatsApp Message
        const orderItems = cart
          .map((item) => `- ${item.name} (${item.quantity}x) = ${formatRupiah(item.price * item.quantity)}`)
          .join('\n');

        const message = `Halo Gula Kabung Belitung, saya mau order produk premium Anda.\n\nNama: ${formData.name}\nNo. WhatsApp: ${formData.whatsapp}\nAlamat: ${fullAddress}\n\nRincian Pesanan:\n${orderItems}\n\nTotal Pembayaran: ${formatRupiah(getCartTotal())}\nCatatan: ${formData.notes || '-'}`;

        const waUrl = `https://wa.me/${siteSettings.whatsapp}?text=${encodeURIComponent(message)}`;
        
        setIsSuccess(true);
        setTimeout(() => {
          window.open(waUrl, '_blank');
          clearCart();
        }, 1500);

      } catch (error) {
        alert('Gagal mengirim pesanan: ' + error.message);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const inputClass = (name) => `
    w-full px-6 py-5 rounded-2xl border transition-all duration-300 font-bold text-brand-brown bg-white
    ${errors[name] ? 'border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-100' : 'border-brand-brown/10 focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/10'}
    outline-none placeholder:text-brand-brown/30 appearance-none
  `;

  if (isSuccess) {
    return (
      <div className="p-20 text-center flex flex-col items-center animate-fade-in">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-8">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-heading font-black text-brand-brown mb-4 tracking-tight">Pesanan Terkirim!</h2>
        <p className="text-brand-brown/50 font-medium max-w-sm mb-8">Terima kasih sudah memesan. Anda akan segera diarahkan ke WhatsApp untuk konfirmasi biaya kirim.</p>
        <Loader2 className="w-8 h-8 text-brand-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-10 lg:p-16">
      <div className="flex items-center gap-4 mb-12">
        <div className="w-2 h-10 bg-brand-gold rounded-full"></div>
        <div>
          <h2 className="text-3xl font-heading font-black text-brand-brown tracking-tight">Data Penerima</h2>
          <p className="text-[10px] font-black text-brand-brown/40 uppercase tracking-widest mt-1">Lengkapi informasi untuk pengiriman</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="relative group">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-brown/60 mb-3"><User className="w-3.5 h-3.5" /> Nama Lengkap *</label>
            <input required type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass('name')} placeholder="Ketik nama lengkap..." />
            {errors.name && <p className="text-rose-500 text-[9px] font-black uppercase tracking-widest mt-2">{errors.name}</p>}
          </div>

          <div className="relative group">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-brown/60 mb-3"><Phone className="w-3.5 h-3.5" /> No. WhatsApp *</label>
            <input required type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleChange} className={inputClass('whatsapp')} placeholder="Contoh: 08123..." />
            {errors.whatsapp && <p className="text-rose-500 text-[9px] font-black uppercase tracking-widest mt-2">{errors.whatsapp}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative group">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-brown/60 mb-3 block">Provinsi *</label>
            <select className={inputClass('province')} value={selectedProvince.id} onChange={(e) => { const item = provinces.find(p => p.id === e.target.value); setSelectedProvince({ id: e.target.value, name: item ? item.name : '' }); }}>
              <option value="">-- Pilih --</option>
              {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="relative group">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-brown/60 mb-3 block">Kota/Kab *</label>
            <select disabled={!selectedProvince.id} className={inputClass('regency')} value={selectedRegency.id} onChange={(e) => { const item = regencies.find(r => r.id === e.target.value); setSelectedRegency({ id: e.target.value, name: item ? item.name : '' }); }}>
              <option value="">-- Pilih --</option>
              {regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="relative group">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-brown/60 mb-3 block">Kecamatan *</label>
            <select disabled={!selectedRegency.id} className={inputClass('district')} value={selectedDistrict.id} onChange={(e) => { const item = districts.find(d => d.id === e.target.value); setSelectedDistrict({ id: e.target.value, name: item ? item.name : '' }); }}>
              <option value="">-- Pilih --</option>
              {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        <div className="relative group">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-brown/60 mb-3"><MapPin className="w-3.5 h-3.5" /> Detail Alamat *</label>
          <textarea required name="address" value={formData.address} onChange={handleChange} rows="3" className={inputClass('address')} placeholder="Nama jalan, nomor rumah, RT/RW..."></textarea>
        </div>

        <div className="relative group">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-brown/60 mb-3"><MessageSquare className="w-3.5 h-3.5" /> Catatan Pesanan</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange} rows="2" className="w-full px-6 py-5 rounded-2xl border border-brand-brown/10 focus:border-brand-gold outline-none font-bold text-brand-brown bg-white placeholder:text-brand-brown/30" placeholder="Contoh: Packing tambahan, dll..."></textarea>
        </div>

        <div className="pt-6">
          <button type="submit" disabled={cart.length === 0 || submitting} className={`w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all duration-500 shadow-2xl ${cart.length === 0 || submitting ? 'bg-brand-brown/20 text-white/50' : 'bg-brand-brown text-white hover:bg-brand-gold hover:text-brand-brown'}`}>
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {submitting ? 'Mengirim...' : 'Pesan Sekarang'}
          </button>
        </div>
      </form>
    </div>
  );
}
