import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Truck, Loader2, CheckCircle2, Clock, AlertCircle, Receipt } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatRupiah } from '../../utils/format';
import { toast } from 'react-hot-toast';

export default function AdminPurchases() {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    supplierId: '',
    namaPetani: '',
    produkId: '',
    namaProduk: '',
    jumlahBeli: 1,
    jumlahDiterima: 0,
    hargaBeliTotal: 0,
    rekeningId: '',
    statusPenerimaan: 'Pending',
    buktiPembayaran: '',
    catatan: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('kabung_purchases')
        .select('*')
        .order('tanggal', { ascending: false });
      if (purchasesError) throw purchasesError;

      const { data: productsData, error: productsError } = await supabase
        .from('kabung_products')
        .select('id, nama_produk, stok');
      if (productsError) throw productsError;

      const { data: accountsData, error: accountsError } = await supabase
        .from('kabung_accounts')
        .select('*');
      if (accountsError) throw accountsError;

      const { data: suppliersData, error: suppliersError } = await supabase
        .from('kabung_suppliers')
        .select('*');
      if (suppliersError) throw suppliersError;

      setPurchases(purchasesData || []);
      setProducts(productsData || []);
      setAccounts(accountsData || []);
      setSuppliers(suppliersData || []);

      if (accountsData?.length > 0 && !formData.rekeningId) {
        setFormData(prev => ({ ...prev, rekeningId: accountsData[0].id }));
      }
    } catch (error) {
      console.error('Error fetching data:', error.message);
      toast.error('Gagal memuat data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File terlalu besar. Maksimal 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, buktiPembayaran: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductSelect = (e) => {
    const selectedProd = products.find(p => p.id.toString() === e.target.value);
    setFormData({
      ...formData,
      produkId: e.target.value,
      namaProduk: selectedProd ? selectedProd.nama_produk : ''
    });
  };

  const handleOpenModal = (purchase = null) => {
    if (purchase) {
      setEditingId(purchase.id);
      setFormData({
        tanggal: purchase.tanggal,
        supplierId: purchase.supplier_id,
        namaPetani: purchase.nama_petani,
        produkId: purchase.produk_id,
        namaProduk: purchase.nama_produk,
        jumlahBeli: purchase.jumlah_beli,
        jumlahDiterima: purchase.jumlah_diterima || 0,
        hargaBeliTotal: purchase.harga_beli_total,
        rekeningId: purchase.rekening_id,
        statusPenerimaan: purchase.status_penerimaan || 'Pending',
        buktiPembayaran: purchase.bukti_pembayaran || '',
        catatan: purchase.catatan || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        tanggal: new Date().toISOString().split('T')[0],
        supplierId: '', 
        namaPetani: '', 
        produkId: '', 
        namaProduk: '',
        jumlahBeli: 1, 
        jumlahDiterima: 0,
        hargaBeliTotal: 0,
        rekeningId: accounts.length > 0 ? accounts[0].id : '',
        statusPenerimaan: 'Pending',
        buktiPembayaran: '',
        catatan: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.produkId) return toast.error('Pilih produk!');
    
    try {
      setSubmitting(true);
      
      const payload = {
        tanggal: formData.tanggal,
        supplier_id: formData.supplierId,
        nama_petani: formData.namaPetani,
        produk_id: formData.produkId,
        nama_produk: formData.namaProduk,
        jumlah_beli: Number(formData.jumlahBeli),
        jumlah_diterima: Number(formData.jumlahDiterima),
        harga_beli_total: Number(formData.hargaBeliTotal),
        rekening_id: formData.rekeningId,
        status_penerimaan: formData.statusPenerimaan,
        bukti_pembayaran: formData.buktiPembayaran,
        catatan: formData.catatan
      };

      if (editingId) {
        const { error } = await supabase.from('kabung_purchases').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Data pesanan diperbarui!');
      } else {
        const { error } = await supabase.from('kabung_purchases').insert([payload]);
        if (error) throw error;
        toast.success('Pesanan berhasil dicatat sebagai Pre-Order.');
      }

      await fetchInitialData();
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Gagal menyimpan: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus data pesanan ini?')) {
      try {
        setLoading(true);
        const { error } = await supabase.from('kabung_purchases').delete().eq('id', id);
        if (error) throw error;
        
        await fetchInitialData();
        toast.success('Data pesanan berhasil dihapus.');
      } catch (error) {
        toast.error('Gagal menghapus: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredPurchases = useMemo(() => {
    if (!filterDate) return purchases;
    return purchases.filter(p => p.tanggal === filterDate);
  }, [purchases, filterDate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-brown">Pesanan Stok (PO)</h1>
          <p className="text-sm text-brand-brown/50">Kelola pemesanan barang dan bukti pembayaran ke petani.</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="date" 
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 border border-brand-brown/20 rounded-xl outline-none" 
          />
          <button 
            onClick={() => handleOpenModal()}
            className="bg-brand-gold text-white hover:bg-brand-gold/90 px-4 py-2 rounded-xl flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" /> Buat PO Baru
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-brand-brown/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-brand-brown/5 border-b border-brand-brown/10">
              <tr>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-brand-brown">Tanggal</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-brand-brown">Supplier & Produk</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-brand-brown text-center">Status Kirim</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-brand-brown text-right">Total Biaya</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-brand-brown text-center">Bukti</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-brand-brown text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-brown/10">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-brand-gold animate-spin mx-auto mb-2" />
                    <span className="text-sm text-brand-brown/40">Memuat data...</span>
                  </td>
                </tr>
              ) : filteredPurchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-brand-brown/[0.02] transition-colors">
                  <td className="px-6 py-4 text-sm text-brand-brown">{purchase.tanggal}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-brand-brown">{purchase.nama_petani}</div>
                    <div className="text-[10px] uppercase font-black text-brand-brown/30">{purchase.nama_produk} ({purchase.jumlah_beli} pcs)</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      purchase.status_penerimaan === 'Selesai' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : purchase.status_penerimaan === 'Parsial'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}>
                      {purchase.status_penerimaan || 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-brand-brown">{formatRupiah(purchase.harga_beli_total)}</td>
                  <td className="px-6 py-4 text-center">
                    {purchase.bukti_pembayaran ? (
                      <button 
                        onClick={() => {
                          const win = window.open();
                          win.document.write(`<img src="${purchase.bukti_pembayaran}" style="max-width:100%">`);
                        }}
                        className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                        title="Lihat Bukti"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-brand-brown/20 italic">Belum Ada</span>
                    )}
                  </td>
                  <td className="px-6 py-4 flex justify-end gap-2">
                    <button onClick={() => handleOpenModal(purchase)} className="p-2 text-brand-brown hover:bg-brand-brown/5 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(purchase.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-brand-brown/5 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10">
              <h2 className="text-xl font-bold text-brand-brown flex items-center gap-3">
                <Receipt className="w-6 h-6 text-brand-gold" />
                {editingId ? 'Update Pesanan (PO)' : 'Buat Pesanan Baru (PO)'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-brand-brown/50 mb-2">Tanggal PO *</label>
                  <input required type="date" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-brand-brown/10 focus:border-brand-gold outline-none font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-brand-brown/50 mb-2">Supplier/Petani *</label>
                  <select required value={formData.supplierId} onChange={e => {
                    const sup = suppliers.find(s => s.id === e.target.value);
                    setFormData({...formData, supplierId: e.target.value, namaPetani: sup ? sup.nama_petani : ''});
                  }} className="w-full px-4 py-3 rounded-2xl border border-brand-brown/10 focus:border-brand-gold outline-none font-bold">
                    <option value="">-- Pilih Supplier --</option>
                    {suppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.nama_petani}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-brand-brown/50 mb-2">Produk yang Dipesan *</label>
                  <select required value={formData.produkId} onChange={handleProductSelect} className="w-full px-4 py-3 rounded-2xl border border-brand-brown/10 focus:border-brand-gold outline-none font-bold">
                    <option value="">-- Pilih Produk --</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.nama_produk}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-brand-brown/50 mb-2">Jumlah Pesanan (Pcs) *</label>
                  <input required type="number" min="1" value={formData.jumlahBeli} onChange={e => setFormData({...formData, jumlahBeli: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-brand-brown/10 focus:border-brand-gold outline-none font-black" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-brand-brown/50 mb-2">Total Biaya (Rp) *</label>
                  <input required type="number" min="0" value={formData.hargaBeliTotal} onChange={e => setFormData({...formData, hargaBeliTotal: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-brand-brown/10 focus:border-brand-gold outline-none font-black" />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-brand-brown/50 mb-2">Rekening Pembayar *</label>
                  <select required value={formData.rekeningId} onChange={e => setFormData({...formData, rekeningId: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-brand-brown/10 focus:border-brand-gold outline-none font-bold">
                    <option value="">-- Pilih Rekening --</option>
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.nama_rekening}</option>)}
                  </select>
                </div>

                {/* Upload Bukti Pembayaran */}
                <div className="md:col-span-2 space-y-3">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-brand-brown/50">Upload Bukti Pembayaran (Maks 2MB)</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange}
                      className="hidden" 
                      id="bukti-upload"
                    />
                    <label 
                      htmlFor="bukti-upload"
                      className="px-6 py-3 bg-brand-brown/5 border-2 border-dashed border-brand-brown/20 rounded-2xl cursor-pointer hover:bg-brand-brown/10 transition-all flex items-center gap-2 text-xs font-bold text-brand-brown"
                    >
                      <Plus className="w-4 h-4" /> Pilih Foto Bukti
                    </label>
                    {formData.buktiPembayaran && (
                      <div className="relative group">
                        <img src={formData.buktiPembayaran} alt="Preview" className="w-12 h-12 rounded-xl object-cover border border-brand-brown/10" />
                        <button 
                          type="button"
                          onClick={() => setFormData({ ...formData, buktiPembayaran: '' })}
                          className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-brand-brown/50 mb-2">Catatan Pesanan</label>
                  <textarea rows="2" value={formData.catatan} onChange={e => setFormData({...formData, catatan: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-brand-brown/10 focus:border-brand-gold outline-none font-bold" placeholder="Misal: Sudah dibayar via transfer BCA..."></textarea>
                </div>
              </div>

              <div className="pt-6 border-t border-brand-brown/5 flex justify-end gap-4 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-brand-brown/40 font-black uppercase tracking-widest text-xs hover:bg-brand-brown/5 rounded-2xl transition-all" disabled={submitting}>Batal</button>
                <button type="submit" className="px-10 py-4 bg-brand-gold text-brand-brown rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-brand-brown transition-all shadow-xl shadow-brand-gold/20" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {submitting ? 'Menyimpan...' : 'Simpan Pesanan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
