import React, { useState } from 'react';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { formatRupiah } from '../../utils/format';

// Start with empty products if user wants total control
const initialProducts = [];

export default function AdminProducts() {
  const [products, setProducts] = useLocalStorage('kabungmart_products', initialProducts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  const [formData, setFormData] = useState({
    namaProduk: '', deskripsi: '', kategori: '', ukuran: '', hargaJual: '', hargaModal: '', stok: 0, satuan: 'pcs', statusAktif: true, imageUrl: ''
  });

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingId(product.id);
      setFormData(product);
    } else {
      setEditingId(null);
      setFormData({
        namaProduk: '', deskripsi: '', kategori: '', ukuran: '', hargaJual: '', hargaModal: '', stok: 0, satuan: 'pcs', statusAktif: true, imageUrl: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setProducts(prevProducts => {
      const newProduct = {
        ...formData,
        hargaJual: Number(formData.hargaJual),
        hargaModal: Number(formData.hargaModal),
        stok: Number(formData.stok),
      };

      if (editingId) {
        return prevProducts.map(p => p.id === editingId ? { ...newProduct, id: editingId } : p);
      } else {
        return [...prevProducts, { ...newProduct, id: Date.now() }];
      }
    });
    setIsModalOpen(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert('File terlalu besar. Gunakan foto di bawah 2MB untuk performa terbaik.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Yakin ingin menghapus produk ini?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-brand-brown/5 pb-8">
        <div>
          <h1 className="text-4xl font-black text-brand-brown tracking-tight">Katalog <span className="italic font-light text-brand-brown/40">Produk</span></h1>
          <p className="text-sm text-brand-brown/40 font-medium mt-1">Kelola daftar produk dan informasi stok Anda.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="btn-gold px-8 py-4 flex items-center gap-3 text-sm"
        >
          <Plus className="w-5 h-5" /> Tambah Produk Baru
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-2xl border border-brand-brown/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-brand-brown text-white">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em]">Produk</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em]">Harga Jual</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em]">Stok</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em]">Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-brown/5">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-brand-brown/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-brand-brown/5 shrink-0 border border-brand-brown/5">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.namaProduk} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Plus className="w-4 h-4 text-brand-brown/10" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-brand-brown group-hover:text-brand-gold transition-colors">{product.namaProduk}</div>
                        <div className="text-[10px] font-bold text-brand-brown/30 uppercase tracking-widest mt-1">{product.ukuran} — {product.kategori}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-brand-brown font-black">{formatRupiah(product.hargaJual)}</td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      product.stok > 5 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : product.stok > 0 
                        ? 'bg-amber-50 text-amber-600 border-amber-100' 
                        : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                      {product.stok} {product.satuan}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    {product.statusAktif ? (
                      <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                        <CheckCircle className="w-4 h-4" /> Aktif
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-400">
                        <XCircle className="w-4 h-4" /> Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    {deletingId === product.id ? (
                      <div className="flex justify-end items-center gap-2 animate-fade-in">
                        <span className="text-[9px] font-black uppercase text-rose-500 mr-2">Hapus?</span>
                        <button 
                          onClick={() => {
                            setProducts(prev => prev.filter(p => p.id !== product.id));
                            setDeletingId(null);
                          }} 
                          className="px-4 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all"
                        >
                          Ya
                        </button>
                        <button 
                          onClick={() => setDeletingId(null)} 
                          className="px-4 py-2 bg-brand-brown/5 text-brand-brown rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-brown/10 transition-all"
                        >
                          Tidak
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-3 transition-opacity">
                        <button onClick={() => handleOpenModal(product)} className="p-3 text-brand-brown hover:bg-brand-brown hover:text-white rounded-xl transition-all bg-brand-brown/5">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeletingId(product.id)} className="p-4 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all bg-rose-50" title="Hapus Produk">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-brand-brown/40">
                    Belum ada data produk.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-brand-brown/10 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-brand-brown">{editingId ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-brand-brown/40 hover:text-brand-brown"><XCircle className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-brown mb-1">Nama Produk *</label>
                  <input required type="text" value={formData.namaProduk} onChange={e => setFormData(prev => ({...prev, namaProduk: e.target.value}))} className="w-full px-3 py-2 border border-brand-brown/20 rounded-xl focus:ring-brand-brown focus:border-brand-brown outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-brown mb-1">Kategori</label>
                  <input type="text" value={formData.kategori} onChange={e => setFormData(prev => ({...prev, kategori: e.target.value}))} className="w-full px-3 py-2 border border-brand-brown/20 rounded-xl focus:ring-brand-brown focus:border-brand-brown outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-brand-brown mb-1">Deskripsi</label>
                  <textarea rows="2" value={formData.deskripsi} onChange={e => setFormData(prev => ({...prev, deskripsi: e.target.value}))} className="w-full px-3 py-2 border border-brand-brown/20 rounded-xl focus:ring-brand-brown focus:border-brand-brown outline-none"></textarea>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-brown-700 mb-1">Upload Foto Produk *</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="flex-1 text-xs text-brand-brown/40 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-brand-gold file:text-white hover:file:bg-brand-gold/80 cursor-pointer" 
                    />
                    {formData.imageUrl && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-brand-brown/10">
                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-brown mb-1">Harga Jual (Rp) *</label>
                  <input required type="number" min="0" value={formData.hargaJual} onChange={e => setFormData(prev => ({...prev, hargaJual: e.target.value}))} className="w-full px-3 py-2 border border-brand-brown/20 rounded-xl focus:ring-brand-brown focus:border-brand-brown outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-brown mb-1">Harga Modal (Rp) *</label>
                  <input required type="number" min="0" value={formData.hargaModal} onChange={e => setFormData(prev => ({...prev, hargaModal: e.target.value}))} className="w-full px-3 py-2 border border-brand-brown/20 rounded-xl focus:ring-brand-brown focus:border-brand-brown outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-brown mb-1">Stok (Otomatis via Pembelian/Penjualan)</label>
                  <input readOnly type="number" value={formData.stok} className="w-full px-3 py-2 border border-brand-brown/20 rounded-xl bg-brand-brown/5 text-brand-brown/50 outline-none cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-brown mb-1">Ukuran / Satuan</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="500g" value={formData.ukuran} onChange={e => setFormData(prev => ({...prev, ukuran: e.target.value}))} className="w-1/2 px-3 py-2 border border-brand-brown/20 rounded-xl focus:ring-brand-brown outline-none" />
                    <input type="text" placeholder="pcs" value={formData.satuan} onChange={e => setFormData(prev => ({...prev, satuan: e.target.value}))} className="w-1/2 px-3 py-2 border border-brand-brown/20 rounded-xl focus:ring-brand-brown outline-none" />
                  </div>
                </div>
                <div className="md:col-span-2 flex items-center mt-2">
                  <input type="checkbox" id="statusAktif" checked={formData.statusAktif} onChange={e => setFormData(prev => ({...prev, statusAktif: e.target.checked}))} className="w-4 h-4 text-gold-500 rounded border-gray-300 focus:ring-gold-500" />
                  <label htmlFor="statusAktif" className="ml-2 block text-sm text-brown-900">Produk Aktif (Tampil di Katalog)</label>
                </div>
              </div>
              <div className="pt-4 border-t border-brand-brown/10 flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-brand-brown/60 font-medium hover:bg-brand-brown/5 rounded-xl">Batal</button>
                <button type="submit" className="px-4 py-2 bg-brand-gold text-white font-medium rounded-xl">Simpan Produk</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
