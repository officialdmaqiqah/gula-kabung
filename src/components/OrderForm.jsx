import React, { useState } from 'react';
import { Send, User, Phone, MapPin, MessageSquare, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { formatRupiah } from '../utils/format';

export default function OrderForm() {
  const { cart, getCartTotal } = useCart();
  const [siteSettings] = useLocalStorage('kabungmart_settings', { whatsapp: '6281234567890' });
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

  const SELLER_NUMBER = siteSettings.whatsapp || '6281234567890'; 

  // Fetch Provinces on mount
  React.useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then(response => response.json())
      .then(data => setProvinces(data));
  }, []);

  // Fetch Regencies when Province changes
  React.useEffect(() => {
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
  React.useEffect(() => {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      alert('Keranjang belanja Anda masih kosong.');
      return;
    }

    if (validate()) {
      const orderItems = cart
        .map((item) => `- ${item.name} (${item.quantity}x) = ${formatRupiah(item.price * item.quantity)}`)
        .join('\n');

      const fullAddress = `${formData.address}, Kec. ${selectedDistrict.name}, ${selectedRegency.name}, Prov. ${selectedProvince.name}`;

      const message = `Halo Gula Kabung Belitung, saya mau order produk premium Anda.
 
 Nama: ${formData.name}
 No. WhatsApp: ${formData.whatsapp}
 Alamat: ${fullAddress}
 
 Rincian Pesanan:
 ${orderItems}
 
 Total Pembayaran: ${formatRupiah(getCartTotal())}
 Catatan: ${formData.notes || '-'}`;

      const encodedMessage = encodeURIComponent(message);
      const waUrl = `https://wa.me/${SELLER_NUMBER}?text=${encodedMessage}`;
      
      window.open(waUrl, '_blank');
    }
  };

  const inputClass = (name) => `
    w-full px-6 py-5 rounded-2xl border transition-all duration-300 font-bold text-brand-brown bg-white
    ${errors[name] ? 'border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-100' : 'border-brand-brown/10 focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/10'}
    outline-none placeholder:text-brand-brown/30 appearance-none
  `;

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
          {/* Name Input */}
          <div className="relative group">
            <label htmlFor="name" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-brown/60 mb-3 group-focus-within:text-brand-gold transition-colors">
              <User className="w-3.5 h-3.5" /> Nama Lengkap <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={inputClass('name')}
              placeholder="Ketik nama lengkap..."
            />
            {errors.name && <p className="text-rose-500 text-[9px] font-black uppercase tracking-widest mt-2 ml-1">{errors.name}</p>}
          </div>

          {/* WhatsApp Input */}
          <div className="relative group">
            <label htmlFor="whatsapp" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-brown/60 mb-3 group-focus-within:text-brand-gold transition-colors">
              <Phone className="w-3.5 h-3.5" /> Nomor WhatsApp <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              id="whatsapp"
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleChange}
              className={inputClass('whatsapp')}
              placeholder="Contoh: 08123..."
            />
            {errors.whatsapp && <p className="text-rose-500 text-[9px] font-black uppercase tracking-widest mt-2 ml-1">{errors.whatsapp}</p>}
          </div>
        </div>

        {/* Region Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative group">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-brown/60 mb-3">Provinsi *</label>
            <select 
              className={inputClass('province')}
              value={selectedProvince.id}
              onChange={(e) => {
                const item = provinces.find(p => p.id === e.target.value);
                setSelectedProvince({ id: e.target.value, name: item ? item.name : '' });
              }}
            >
              <option value="">-- Pilih Provinsi --</option>
              {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {errors.province && <p className="text-rose-500 text-[9px] font-black uppercase tracking-widest mt-2 ml-1">{errors.province}</p>}
          </div>

          <div className="relative group">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-brown/60 mb-3">Kota / Kabupaten *</label>
            <select 
              className={inputClass('regency')}
              value={selectedRegency.id}
              disabled={!selectedProvince.id}
              onChange={(e) => {
                const item = regencies.find(r => r.id === e.target.value);
                setSelectedRegency({ id: e.target.value, name: item ? item.name : '' });
              }}
            >
              <option value="">-- Pilih Kota/Kab --</option>
              {regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            {errors.regency && <p className="text-rose-500 text-[9px] font-black uppercase tracking-widest mt-2 ml-1">{errors.regency}</p>}
          </div>

          <div className="relative group">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-brown/60 mb-3">Kecamatan *</label>
            <select 
              className={inputClass('district')}
              value={selectedDistrict.id}
              disabled={!selectedRegency.id}
              onChange={(e) => {
                const item = districts.find(d => d.id === e.target.value);
                setSelectedDistrict({ id: e.target.value, name: item ? item.name : '' });
              }}
            >
              <option value="">-- Pilih Kecamatan --</option>
              {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {errors.district && <p className="text-rose-500 text-[9px] font-black uppercase tracking-widest mt-2 ml-1">{errors.district}</p>}
          </div>
        </div>

        {/* Address Input */}
        <div className="relative group">
          <label htmlFor="address" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-brown/60 mb-3 group-focus-within:text-brand-gold transition-colors">
            <MapPin className="w-3.5 h-3.5" /> Nama Jalan / Detail Alamat <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows="3"
            className={inputClass('address')}
            placeholder="Contoh: Jl. Merdeka No. 12, RT 01/RW 02..."
          ></textarea>
          {errors.address && <p className="text-rose-500 text-[9px] font-black uppercase tracking-widest mt-2 ml-1">{errors.address}</p>}
        </div>

        {/* Notes Input */}
        <div className="relative group">
          <label htmlFor="notes" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-brown/60 mb-3 group-focus-within:text-brand-gold transition-colors">
            <MessageSquare className="w-3.5 h-3.5" /> Pesan Khusus (Opsional)
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="2"
            className="w-full px-6 py-5 rounded-2xl border border-brand-brown/10 focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/10 outline-none transition-all duration-300 font-bold text-brand-brown bg-white placeholder:text-brand-brown/30"
            placeholder="Contoh: Tolong bungkus lebih tebal..."
          ></textarea>
        </div>

        <div className="pt-6">
          <button
            type="submit"
            disabled={cart.length === 0}
            className={`w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all duration-500 group shadow-2xl ${
              cart.length === 0
                ? 'bg-brand-brown/5 text-brand-brown/20 cursor-not-allowed shadow-none border border-brand-brown/5'
                : 'bg-brand-brown text-white hover:bg-brand-gold hover:text-brand-brown hover:scale-[1.02] active:scale-95 shadow-brand-brown/20'
            }`}
          >
            <Send className="w-5 h-5 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
            Lanjut ke WhatsApp
          </button>
          
          <p className="text-center mt-6 text-[9px] font-black text-brand-brown/20 uppercase tracking-[0.4em]">
            Klik tombol di atas untuk konfirmasi biaya kirim
          </p>
        </div>
      </form>
    </div>
  );
}
