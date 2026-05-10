import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Truck, Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
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
        jumlahDiterima: purchase.jumlah_diterima || purchase.jumlah_beli,
        hargaBeliTotal: purchase.harga_beli_total,
        rekeningId: purchase.rekening_id,
        statusPenerimaan: purchase.status_penerimaan || 'Selesai',
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
        status_penerimaan: Number(formData.jumlahDiterima) >= Number(formData.jumlahBeli) ? 'Selesai' : 
                          Number(formData.jumlahDiterima) > 0 ? 'Parsial' : 'Pending',
        catatan: formData.catatan
      };

      if (editingId) {
        const oldPurchase = purchases.find(p => p.id === editingId);
        const { error } = await supabase.from('kabung_purchases').update(payload).eq('id', editingId);
        if (error) throw error;

        // Update Stock (Based on RECEIVED quantity)
        const diff = Number(payload.jumlah_diterima) - (oldPurchase ? (oldPurchase.jumlah_diterima || oldPurchase.jumlah_beli) : 0);
        if (diff !== 0) {
          const product = products.find(p => p.id.toString() === formData.produkId);
          if (product) {
            await supabase.from('kabung_products').update({ 
              stok: product.stok + diff 
            }).eq('id', formData.produkId);
          }
        }
        toast.success('Data pembelian diperbarui!');
      } else {
        const { error } = await supabase.from('kabung_purchases').insert([payload]);
        if (error) throw error;

        // Add Stock (Only Received)
        const product = products.find(p => p.id.toString() === formData.produkId);
        if (product) {
          await supabase.from('kabung_products').update({ 
            stok: product.stok + Number(payload.jumlah_diterima) 
          }).eq('id', formData.produkId);
        }
        toast.success('Pembelian berhasil dicatat. Stok bertambah sesuai jumlah diterima.');
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
    if (window.confirm('Yakin ingin menghapus pembelian ini? Stok produk akan dikurangi sesuai jumlah yang sudah diterima.')) {
      try {
        setLoading(true);
        const purchaseToDelete = purchases.find(p => p.id === id);
        
        if (purchaseToDelete) {
          const product = products.find(p => p.id.toString() === purchaseToDelete.produk_id);
          if (product) {
            const received = purchaseToDelete.jumlah_diterima || purchaseToDelete.jumlah_beli;
            await supabase.from('kabung_products').update({ 
              stok: Math.max(0, product.stok - received) 
            }).eq('id', purchaseToDelete.produk_id);
          }
        }

        const { error } = await supabase.from('kabung_purchases').delete().eq('id', id);
        if (error) throw error;
        
        await fetchInitialData();
        toast.success('Data berhasil dihapus.');
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
          <h1 className="text-2xl font-bold text-brand-brown">Pembelian & Penerimaan Stok</h1>
          <p className="text-sm text-brand-brown/50">Kelola pesanan ke supplier dan lacak pengiriman bertahap.</p>
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
            <Truck className="w-5 h-5" /> Beli Stok Baru
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-brand-brown/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-brand-brown/5 border-b border-brand-brown/10">
              <tr>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-brand-brown">Tanggal</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-brand-brown">Supplier</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-brand-brown">Status Kirim</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-brand-brown text-center">Diterima / Total</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-brand-brown text-right">Total Biaya</th>
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
              ) : filteredPurchases.map((purchase) => {
                const pending = purchase.jumlah_beli - (purchase.jumlah_diterima || 0);
                return (
                  <tr key={purchase.id} className="hover:bg-brand-brown/[0.02] transition-colors">
                    <td className="px-6 py-4 text-sm text-brand-brown">{purchase.tanggal}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-brand-brown">{purchase.nama_petani}</div>
                      <div className="text-[10px] uppercase font-black text-brand-brown/30">{purchase.nama_produk}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        purchase.status_penerimaan === 'Selesai' 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : purchase.status_penerimaan === 'Parsial'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}>
                        {purchase.status_penerimaan === 'Selesai' ? <CheckCircle2 className="w-3 h-3" /> : 
                         purchase.status_penerimaan === 'Parsial' ? <Clock className="w-3 h-3" /> : 
                         <AlertCircle className="w-3 h-3" />}
                        {purchase.status_penerimaan || 'Selesai'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm font-black text-brand-brown">
                        {purchase.jumlah_diterima || purchase.jumlah_beli} / {purchase.jumlah_beli}
                      </div>
                      {pending > 0 && (
                        <div className="text-[9px] font-black text-rose-500 uppercase tracking-tighter mt-0.5">
                          Kurang {pending} pcs
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-brand-brown">{formatRupiah(purchase.harga_beli_total)}</td>
                    <td className="px-6 py-4 flex justify-end gap-2">
                      <button onClick={() => handleOpenModal(purchase)} className="p-2 text-brand-brown hover:bg-brand-brown/5 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(purchase.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!loading && filteredPurchases.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-brand-brown/40 font-medium">Belum ada data pembelian stok.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-brand-brown/5 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10">
              <h2 className="text-xl font-bold text-brand-brown flex items-center gap-3">
                <Truck className="w-6 h-6 text-brand-gold" />
                {editingId ? 'Update Penerimaan Stok' : 'Input Pembelian Stok Baru'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-brand-brown/50 mb-2">Tanggal Transaksi *</label>
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
                  <label className="block text-[10px] font-black uppercase tracking-widest text-brand-brown/50 mb-2">Produk yang Dibeli *</label>
                  <select required value={formData.produkId} onChange={handleProductSelect} className="w-full px-4 py-3 rounded-2xl border border-brand-brown/10 focus:border-brand-gold outline-none font-bold">
                    <option value="">-- Pilih Produk --</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.nama_produk}</option>)}
                  </select>
                </div>
                
                <div className="bg-brand-brown/[0.02] p-6 rounded-3xl md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 border border-brand-brown/5">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-brand-brown/50 mb-2">Total Pesanan (Pcs) *</label>
                    <input required type="number" min="1" value={formData.jumlahBeli} onChange={e => setFormData({...formData, jumlahBeli: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-brand-brown/10 focus:border-brand-gold outline-none font-black text-lg" />
                    <p className="text-[9px] text-brand-brown/30 mt-2 font-bold uppercase">Jumlah total yang Anda bayar</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-brand-brown/50 mb-2 text-emerald-600">Diterima Saat Ini (Pcs) *</label>
                    <input required type="number" min="0" max={formData.jumlahBeli} value={formData.jumlahDiterima} onChange={e => setFormData({...formData, jumlahDiterima: e.target.value})} className="w-full px-4 py-3 rounded-2xl border-2 border-emerald-100 focus:border-emerald-500 outline-none font-black text-lg text-emerald-700 bg-emerald-50/30" />
                    <p className="text-[9px] text-emerald-600/60 mt-2 font-bold uppercase">Hanya jumlah ini yang menambah stok fisik</p>
                  </div>
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
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-brand-brown/50 mb-2">Catatan Internal</label>
                  <textarea rows="2" value={formData.catatan} onChange={e => setFormData({...formData, catatan: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-brand-brown/10 focus:border-brand-gold outline-none font-bold" placeholder="Misal: Kurang 25 pcs dikirim minggu depan..."></textarea>
                </div>
              </div>
              <div className="pt-6 border-t border-brand-brown/5 flex justify-end gap-4 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-brand-brown/40 font-black uppercase tracking-widest text-xs hover:bg-brand-brown/5 rounded-2xl transition-all" disabled={submitting}>Batal</button>
                <button type="submit" className="px-10 py-4 bg-brand-gold text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-brand-brown transition-all shadow-xl shadow-brand-gold/20" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {submitting ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
