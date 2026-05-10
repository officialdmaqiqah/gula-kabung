import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Truck, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatRupiah } from '../../utils/format';

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
    hargaBeliTotal: 0,
    rekeningId: '',
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
        hargaBeliTotal: purchase.harga_beli_total,
        rekeningId: purchase.rekening_id,
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
        hargaBeliTotal: 0,
        rekeningId: accounts.length > 0 ? accounts[0].id : '',
        catatan: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.produkId) return alert('Pilih produk!');
    
    try {
      setSubmitting(true);
      
      const payload = {
        tanggal: formData.tanggal,
        supplier_id: formData.supplierId,
        nama_petani: formData.namaPetani,
        produk_id: formData.produkId,
        nama_produk: formData.namaProduk,
        jumlah_beli: Number(formData.jumlahBeli),
        harga_beli_total: Number(formData.hargaBeliTotal),
        rekening_id: formData.rekeningId,
        catatan: formData.catatan
      };

      if (editingId) {
        const oldPurchase = purchases.find(p => p.id === editingId);
        const { error } = await supabase.from('kabung_purchases').update(payload).eq('id', editingId);
        if (error) throw error;

        // Update Stock
        const diff = Number(formData.jumlahBeli) - (oldPurchase ? oldPurchase.jumlah_beli : 0);
        if (diff !== 0) {
          const product = products.find(p => p.id.toString() === formData.produkId);
          if (product) {
            await supabase.from('kabung_products').update({ 
              stok: product.stok + diff 
            }).eq('id', formData.produkId);
          }
        }
      } else {
        const { error } = await supabase.from('kabung_purchases').insert([payload]);
        if (error) throw error;

        // Add Stock
        const product = products.find(p => p.id.toString() === formData.produkId);
        if (product) {
          await supabase.from('kabung_products').update({ 
            stok: product.stok + Number(formData.jumlahBeli) 
          }).eq('id', formData.produkId);
        }
      }

      await fetchInitialData();
      setIsModalOpen(false);
    } catch (error) {
      alert('Gagal menyimpan: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus pembelian ini? Stok produk akan dikurangi.')) {
      try {
        setLoading(true);
        const purchaseToDelete = purchases.find(p => p.id === id);
        
        if (purchaseToDelete) {
          const product = products.find(p => p.id.toString() === purchaseToDelete.produk_id);
          if (product) {
            await supabase.from('kabung_products').update({ 
              stok: Math.max(0, product.stok - purchaseToDelete.jumlah_beli) 
            }).eq('id', purchaseToDelete.produk_id);
          }
        }

        const { error } = await supabase.from('kabung_purchases').delete().eq('id', id);
        if (error) throw error;
        
        await fetchInitialData();
      } catch (error) {
        alert('Gagal menghapus: ' + error.message);
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
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-brand-brown">Pembelian Stok (Restock)</h1>
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
                <th className="px-6 py-4 text-sm font-semibold text-brand-brown">Tanggal</th>
                <th className="px-6 py-4 text-sm font-semibold text-brand-brown">Petani/Supplier</th>
                <th className="px-6 py-4 text-sm font-semibold text-brand-brown">Produk Masuk</th>
                <th className="px-6 py-4 text-sm font-semibold text-brand-brown">Total Biaya</th>
                <th className="px-6 py-4 text-sm font-semibold text-brand-brown text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-brown/10">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-brand-gold animate-spin mx-auto mb-2" />
                    <span className="text-sm text-brand-brown/40">Memuat data...</span>
                  </td>
                </tr>
              ) : filteredPurchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-brand-brown/[0.02]">
                  <td className="px-6 py-4 text-sm text-brand-brown">{purchase.tanggal}</td>
                  <td className="px-6 py-4 font-medium text-brand-brown">{purchase.nama_petani}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-emerald-600">+{purchase.jumlah_beli}</span> {purchase.nama_produk}
                  </td>
                  <td className="px-6 py-4 font-bold text-rose-600">{formatRupiah(purchase.harga_beli_total)}</td>
                  <td className="px-6 py-4 flex justify-end gap-2">
                    <button onClick={() => handleOpenModal(purchase)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(purchase.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filteredPurchases.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-brand-brown/40">Belum ada data pembelian stok.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-brand-brown/10 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-brand-brown">{editingId ? 'Edit Pembelian' : 'Input Pembelian Stok'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tanggal *</label>
                  <input required type="date" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pilih Supplier/Petani *</label>
                  <select required value={formData.supplierId} onChange={e => {
                    const sup = suppliers.find(s => s.id === e.target.value);
                    setFormData({...formData, supplierId: e.target.value, namaPetani: sup ? sup.nama_petani : ''});
                  }} className="w-full px-3 py-2 border rounded-xl">
                    <option value="">-- Pilih Supplier --</option>
                    {suppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.nama_petani}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Produk yang Dibeli *</label>
                  <select required value={formData.produkId} onChange={handleProductSelect} className="w-full px-3 py-2 border rounded-xl">
                    <option value="">-- Pilih Produk --</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.nama_produk}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Jumlah Dibeli (Masuk Stok) *</label>
                  <input required type="number" min="1" value={formData.jumlahBeli} onChange={e => setFormData({...formData, jumlahBeli: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total Biaya Pembelian (Rp) *</label>
                  <input required type="number" min="0" value={formData.hargaBeliTotal} onChange={e => setFormData({...formData, hargaBeliTotal: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
                  <p className="text-xs text-brown-400 mt-1">Total uang yang Anda bayarkan ke petani</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bayar Menggunakan Rekening/Kas *</label>
                  <select required value={formData.rekeningId} onChange={e => setFormData({...formData, rekeningId: e.target.value})} className="w-full px-3 py-2 border rounded-xl">
                    <option value="">-- Pilih Rekening --</option>
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.nama_rekening}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Catatan</label>
                  <textarea rows="2" value={formData.catatan} onChange={e => setFormData({...formData, catatan: e.target.value})} className="w-full px-3 py-2 border rounded-xl"></textarea>
                </div>
              </div>
              <div className="pt-4 border-t border-brand-brown/10 mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 hover:bg-brand-brown/5 rounded-xl text-brand-brown" disabled={submitting}>Batal</button>
                <button type="submit" className="px-4 py-2 bg-brand-gold text-white rounded-xl font-medium flex items-center gap-2" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {submitting ? 'Menyimpan...' : 'Simpan Pembelian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
