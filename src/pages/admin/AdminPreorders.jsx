import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Loader2, MessageSquare, Trash2, Check, X, Clock, HelpCircle, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

export default function AdminPreorders() {
  const [preorders, setPreorders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Modal & Form State for manual entry
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    namaKonsumen: '',
    whatsapp: '',
    produkId: '',
    jumlah: 1,
    catatan: ''
  });
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchPreorders();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('kabung_products')
        .select('id, nama_produk')
        .order('nama_produk', { ascending: true });
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err.message);
    }
  };

  const fetchPreorders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('kabung_preorders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPreorders(data || []);
    } catch (err) {
      console.error('Error fetching pre-orders:', err.message);
      toast.error('Gagal memuat data pre-order: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      setUpdatingId(id);
      const { error } = await supabase
        .from('kabung_preorders')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setPreorders(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
      toast.success(`Status berhasil diubah menjadi ${newStatus}`);
    } catch (err) {
      console.error('Error updating status:', err.message);
      toast.error('Gagal memperbarui status: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('kabung_preorders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPreorders(prev => prev.filter(item => item.id !== id));
      setDeletingId(null);
      toast.success('Pendaftaran waiting list berhasil dihapus');
    } catch (err) {
      console.error('Error deleting preorder:', err.message);
      toast.error('Gagal menghapus data: ' + err.message);
    }
  };

  const handleContactWhatsApp = (item) => {
    const formattedWa = item.whatsapp.startsWith('0') 
      ? '62' + item.whatsapp.substring(1) 
      : item.whatsapp.startsWith('+') 
      ? item.whatsapp.substring(1) 
      : item.whatsapp;

    const message = `Halo ${item.nama_konsumen}, kami dari Gula Kabung Belitung.\n\nIngin mengabarkan bahwa produk *Gula Kabung: ${item.nama_produk}* yang Anda daftarkan di Waiting List sebanyak *${item.jumlah} pcs* saat ini sudah tersedia!\n\nApakah Anda ingin melanjutkan transaksi dan memproses pengiriman? Silakan konfirmasi alamat lengkap pengiriman Anda ya. Terima kasih!`;
    
    const waUrl = `https://wa.me/${formattedWa}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  // Filtered & Searched List
  const filteredPreorders = useMemo(() => {
    return preorders.filter(item => {
      const matchesSearch = 
        item.nama_konsumen.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nama_produk.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [preorders, searchQuery, statusFilter]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Waiting':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Dihubungi':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Selesai':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Batal':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-brand-brown/5 pb-8">
        <div>
          <h1 className="text-4xl font-black text-brand-brown tracking-tight">Waiting <span className="italic font-light text-brand-brown/40">List</span></h1>
          <p className="text-sm text-brand-brown/40 font-medium mt-1">Kelola antrean pesanan konsumen yang tidak kebagian stok.</p>
        </div>
        <button 
          onClick={() => {
            setFormData({
              namaKonsumen: '',
              whatsapp: '',
              produkId: '',
              jumlah: 1,
              catatan: ''
            });
            setIsModalOpen(true);
          }}
          className="btn-gold px-6 py-3.5 flex items-center gap-2 text-xs font-black uppercase tracking-wider shadow-lg shadow-brand-gold/10"
        >
          <Plus className="w-4 h-4" /> Tambah Manual
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-3xl border border-brand-brown/5 shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-80 group">
          <input 
            type="text" 
            placeholder="Cari konsumen / produk..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-brand-cream/10 border border-brand-brown/10 rounded-2xl text-xs font-semibold focus:outline-none focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/5 transition-all text-brand-brown"
          />
          <Search className="w-4 h-4 text-brand-brown/30 absolute left-4 top-1/2 -translate-y-1/2" />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar py-1">
          {['All', 'Waiting', 'Dihubungi', 'Selesai', 'Batal'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border whitespace-nowrap ${
                statusFilter === tab 
                  ? 'bg-brand-brown text-white border-brand-brown shadow-md' 
                  : 'bg-white text-brand-brown/50 border-brand-brown/10 hover:border-brand-brown/20'
              }`}
            >
              {tab === 'All' ? 'Semua' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[2rem] shadow-2xl border border-brand-brown/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="bg-brand-brown text-white">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Tanggal</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Konsumen</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Produk & Qty</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Catatan</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-brown/5">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-10 h-10 text-brand-gold animate-spin" />
                      <p className="text-xs font-bold text-brand-brown/40 uppercase tracking-widest">Memuat Waiting List...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredPreorders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-brand-brown/40 text-sm font-medium">
                    Tidak ada data pre-order / waiting list yang cocok.
                  </td>
                </tr>
              ) : (
                filteredPreorders.map((item) => (
                  <tr key={item.id} className="hover:bg-brand-brown/[0.01] transition-colors group">
                    <td className="px-6 py-5 text-xs text-brand-brown/60 font-semibold">{item.tanggal}</td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-brand-brown">{item.nama_konsumen}</div>
                      <div className="text-[10px] font-bold text-brand-gold tracking-wider mt-0.5">{item.whatsapp}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-brand-brown">{item.nama_produk}</div>
                      <div className="text-[10px] font-black text-brand-brown/30 mt-1 uppercase tracking-wider">Jumlah: {item.jumlah} pcs</div>
                    </td>
                    <td className="px-6 py-5 text-xs text-brand-brown/60 max-w-[200px] truncate" title={item.catatan}>
                      {item.catatan || '-'}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${getStatusBadgeClass(item.status)}`}>
                          {item.status}
                        </span>
                        {updatingId === item.id && <Loader2 className="w-3.5 h-3.5 text-brand-gold animate-spin" />}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      {deletingId === item.id ? (
                        <div className="flex justify-end items-center gap-2 animate-fade-in">
                          <span className="text-[9px] font-black uppercase text-rose-500 mr-1">Hapus?</span>
                          <button 
                            onClick={() => handleDelete(item.id)} 
                            className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-rose-600 transition-all"
                          >
                            Ya
                          </button>
                          <button 
                            onClick={() => setDeletingId(null)} 
                            className="px-3 py-1.5 bg-brand-brown/5 text-brand-brown rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-brand-brown/10 transition-all"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end items-center gap-2">
                          {/* Quick Status Dropdown / Action Buttons */}
                          <div className="flex items-center bg-brand-brown/5 rounded-xl p-1 gap-1">
                            <button
                              onClick={() => handleUpdateStatus(item.id, 'Waiting')}
                              disabled={updatingId !== null}
                              title="Set status Waiting"
                              className={`p-1.5 rounded-lg transition-all ${item.status === 'Waiting' ? 'bg-amber-500 text-white shadow-md' : 'text-brand-brown/40 hover:bg-brand-brown/10'}`}
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(item.id, 'Dihubungi')}
                              disabled={updatingId !== null}
                              title="Set status Dihubungi"
                              className={`p-1.5 rounded-lg transition-all ${item.status === 'Dihubungi' ? 'bg-blue-500 text-white shadow-md' : 'text-brand-brown/40 hover:bg-brand-brown/10'}`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(item.id, 'Selesai')}
                              disabled={updatingId !== null}
                              title="Set status Selesai"
                              className={`p-1.5 rounded-lg transition-all ${item.status === 'Selesai' ? 'bg-emerald-500 text-white shadow-md' : 'text-brand-brown/40 hover:bg-brand-brown/10'}`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(item.id, 'Batal')}
                              disabled={updatingId !== null}
                              title="Set status Batal"
                              className={`p-1.5 rounded-lg transition-all ${item.status === 'Batal' ? 'bg-rose-500 text-white shadow-md' : 'text-brand-brown/40 hover:bg-brand-brown/10'}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Contact via WA */}
                          <button
                            onClick={() => handleContactWhatsApp(item)}
                            title="Hubungi via WhatsApp"
                            className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-all border border-emerald-100"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeletingId(item.id)}
                            title="Hapus Waiting List"
                            className="p-2.5 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all border border-rose-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Waiting List Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto p-4 flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-up p-8 border border-brand-brown/5">
            <div className="flex justify-between items-center pb-6 border-b border-brand-brown/10 mb-6">
              <h2 className="text-lg font-black text-brand-brown uppercase tracking-wide">Tambah Waiting List Manual</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-brand-brown/40 hover:text-brand-brown text-xl font-light">×</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!formData.produkId) return toast.error('Silakan pilih produk!');
              
              try {
                setIsSubmitting(true);
                const selectedProd = products.find(p => p.id === formData.produkId);
                const { error } = await supabase.from('kabung_preorders').insert([
                  {
                    nama_konsumen: formData.namaKonsumen,
                    whatsapp: formData.whatsapp,
                    produk_id: formData.produkId,
                    nama_produk: selectedProd ? selectedProd.nama_produk : '',
                    jumlah: Number(formData.jumlah),
                    catatan: formData.catatan || '',
                    status: 'Waiting'
                  }
                ]);

                if (error) throw error;
                
                toast.success('Pendaftaran manual berhasil ditambahkan!');
                await fetchPreorders();
                setIsModalOpen(false);
              } catch (err) {
                console.error('Error saving preorder:', err.message);
                toast.error('Gagal menyimpan: ' + err.message);
              } finally {
                setIsSubmitting(false);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-brand-brown/60 mb-1.5">Nama Konsumen *</label>
                <input 
                  required 
                  type="text" 
                  value={formData.namaKonsumen}
                  onChange={e => setFormData({ ...formData, namaKonsumen: e.target.value })}
                  className="w-full px-4 py-3.5 border border-brand-brown/10 rounded-xl outline-none focus:border-brand-gold font-bold text-xs text-brand-brown"
                  placeholder="Ketik nama lengkap..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-brand-brown/60 mb-1.5">No. WhatsApp *</label>
                <input 
                  required 
                  type="tel" 
                  value={formData.whatsapp}
                  onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full px-4 py-3.5 border border-brand-brown/10 rounded-xl outline-none focus:border-brand-gold font-bold text-xs text-brand-brown"
                  placeholder="Contoh: 0812345678..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-brand-brown/60 mb-1.5">Produk Gula Kabung *</label>
                <select
                  required
                  value={formData.produkId}
                  onChange={e => setFormData({ ...formData, produkId: e.target.value })}
                  className="w-full px-4 py-3.5 border border-brand-brown/10 rounded-xl outline-none focus:border-brand-gold font-bold text-xs text-brand-brown bg-white"
                >
                  <option value="">-- Pilih Produk --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.nama_produk}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-brand-brown/60 mb-1.5">Jumlah (Pcs) *</label>
                  <input 
                    required 
                    type="number" 
                    min="1"
                    value={formData.jumlah}
                    onChange={e => setFormData({ ...formData, jumlah: e.target.value })}
                    className="w-full px-4 py-3.5 border border-brand-brown/10 rounded-xl outline-none focus:border-brand-gold font-bold text-xs text-brand-brown"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-brand-brown/60 mb-1.5">Tanggal (Otomatis)</label>
                  <input 
                    readOnly 
                    type="text" 
                    value={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3.5 bg-brand-brown/5 border border-brand-brown/10 rounded-xl outline-none text-brand-brown/50 font-bold text-xs cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-brand-brown/60 mb-1.5">Catatan</label>
                <textarea 
                  rows="2"
                  value={formData.catatan}
                  onChange={e => setFormData({ ...formData, catatan: e.target.value })}
                  className="w-full px-4 py-3.5 border border-brand-brown/10 rounded-xl outline-none focus:border-brand-gold font-bold text-xs text-brand-brown"
                  placeholder="Ketik catatan jika ada..."
                />
              </div>

              <div className="pt-4 border-t border-brand-brown/10 flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-xs font-black uppercase tracking-wider text-brand-brown/60 hover:bg-brand-brown/5 rounded-xl" disabled={isSubmitting}>Batal</button>
                <button type="submit" className="px-5 py-2.5 bg-brand-brown text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-2" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Simpan Pemesanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
