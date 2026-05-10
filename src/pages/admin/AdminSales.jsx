import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatRupiah } from '../../utils/format';
import { toast } from 'react-hot-toast';

export default function AdminSales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    namaPembeli: '',
    produkId: '',
    jumlah: 1,
    hargaSatuan: 0,
    metodePembayaran: 'Transfer bank',
    rekeningId: '',
    statusPembayaran: 'Sudah bayar',
    channelPenjualan: 'WhatsApp',
    catatan: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch Sales
      const { data: salesData, error: salesError } = await supabase
        .from('kabung_sales')
        .select('*')
        .order('tanggal', { ascending: false });
      if (salesError) throw salesError;

      // Fetch Products
      const { data: productsData, error: productsError } = await supabase
        .from('kabung_products')
        .select('id, nama_produk, harga_jual, stok');
      if (productsError) throw productsError;

      // Fetch Accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('kabung_accounts')
        .select('*');
      if (accountsError) throw accountsError;

      setSales(salesData || []);
      setProducts(productsData || []);
      setAccounts(accountsData || []);
      
      if (accountsData && accountsData.length > 0) {
        setFormData(prev => ({ ...prev, rekeningId: accountsData[0].id }));
      }
    } catch (error) {
      console.error('Error fetching sales data:', error.message);
      toast.error('Gagal mengambil data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (e) => {
    const selectedProd = products.find(p => p.id.toString() === e.target.value);
    setFormData({
      ...formData,
      produkId: e.target.value,
      hargaSatuan: selectedProd ? selectedProd.harga_jual : 0,
      namaProduk: selectedProd ? selectedProd.nama_produk : ''
    });
  };

  const handleOpenModal = (sale = null) => {
    if (sale) {
      setEditingId(sale.id);
      setFormData({
        tanggal: sale.tanggal,
        namaPembeli: sale.nama_pembeli,
        produkId: sale.produk_id,
        jumlah: sale.jumlah,
        hargaSatuan: sale.harga_satuan,
        metodePembayaran: sale.metode_pembayaran,
        rekening_id: sale.rekening_id, // Gunakan rekening_id
        rekeningId: sale.rekening_id, // Alias untuk form
        statusPembayaran: sale.status_pembayaran,
        channelPenjualan: sale.channel_penjualan,
        catatan: sale.catatan || '',
        namaProduk: sale.nama_produk
      });
    } else {
      setEditingId(null);
      setFormData({
        tanggal: new Date().toISOString().split('T')[0],
        namaPembeli: '', 
        produkId: '', 
        jumlah: 1, 
        hargaSatuan: 0,
        metodePembayaran: 'Transfer bank', 
        rekeningId: accounts.length > 0 ? accounts[0].id : '',
        statusPembayaran: 'Sudah bayar',
        channelPenjualan: 'WhatsApp', 
        catatan: '', 
        namaProduk: ''
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
        nama_pembeli: formData.namaPembeli,
        produk_id: formData.produkId,
        nama_produk: formData.namaProduk,
        jumlah: Number(formData.jumlah),
        harga_satuan: Number(formData.hargaSatuan),
        total_penjualan: Number(formData.jumlah) * Number(formData.hargaSatuan),
        metode_pembayaran: formData.metodePembayaran,
        rekening_id: formData.rekeningId,
        status_pembayaran: formData.statusPembayaran,
        channel_penjualan: formData.channelPenjualan,
        catatan: formData.catatan
      };

      if (editingId) {
        const oldSale = sales.find(s => s.id === editingId);
        const { error } = await supabase.from('kabung_sales').update(payload).eq('id', editingId);
        if (error) throw error;

        // Update Stock in DB
        const diff = Number(formData.jumlah) - (oldSale ? oldSale.jumlah : 0);
        if (diff !== 0) {
          const product = products.find(p => p.id.toString() === formData.produkId);
          if (product) {
            await supabase.from('kabung_products').update({ 
              stok: product.stok - diff 
            }).eq('id', formData.produkId);
          }
        }
        toast.success('Transaksi diperbarui!');
      } else {
        const { error } = await supabase.from('kabung_sales').insert([payload]);
        if (error) throw error;

        // Decrease Stock in DB
        const product = products.find(p => p.id.toString() === formData.produkId);
        if (product) {
          await supabase.from('kabung_products').update({ 
            stok: product.stok - Number(formData.jumlah) 
          }).eq('id', formData.produkId);
        }
        toast.success('Transaksi penjualan berhasil dicatat!');
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
    if (window.confirm('Yakin ingin menghapus transaksi ini? Stok produk akan dikembalikan.')) {
      try {
        setLoading(true);
        const saleToDelete = sales.find(s => s.id === id);
        
        if (saleToDelete) {
          // Return stock
          const product = products.find(p => p.id.toString() === saleToDelete.produk_id);
          if (product) {
            await supabase.from('kabung_products').update({ 
              stok: product.stok + saleToDelete.jumlah 
            }).eq('id', saleToDelete.produk_id);
          }
        }

        const { error } = await supabase.from('kabung_sales').delete().eq('id', id);
        if (error) throw error;
        
        await fetchInitialData();
        toast.success('Transaksi berhasil dihapus dan stok dikembalikan.');
      } catch (error) {
        toast.error('Gagal menghapus: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredSales = useMemo(() => {
    if (!filterDate) return sales;
    return sales.filter(s => s.tanggal === filterDate);
  }, [sales, filterDate]);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-brand-brown">Pencatatan Penjualan</h1>
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
            <Plus className="w-5 h-5" /> Tambah Transaksi
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-brand-brown/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-brand-brown/5 border-b border-brand-brown/10">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-brand-brown">Tanggal</th>
                <th className="px-6 py-4 text-sm font-semibold text-brand-brown">Pembeli & Produk</th>
                <th className="px-6 py-4 text-sm font-semibold text-brand-brown">Total Transaksi</th>
                <th className="px-6 py-4 text-sm font-semibold text-brand-brown">Status</th>
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
              ) : filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-brand-brown/[0.02]">
                  <td className="px-6 py-4 text-sm text-brand-brown">{sale.tanggal}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-brand-brown">{sale.nama_pembeli}</div>
                    <div className="text-sm text-brand-brown/50">{sale.jumlah}x {sale.nama_produk}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-brand-brown">{formatRupiah(sale.total_penjualan)}</div>
                    <div className="text-xs text-brand-brown/40">{sale.metode_pembayaran}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                      sale.status_pembayaran === 'Sudah bayar' ? 'bg-green-100 text-green-700' :
                      sale.status_pembayaran === 'Batal' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {sale.status_pembayaran}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex justify-end gap-2">
                    <button onClick={() => handleOpenModal(sale)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(sale.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filteredSales.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-brand-brown/40">Belum ada data transaksi.</td>
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
              <h2 className="text-xl font-bold text-brand-brown">{editingId ? 'Edit Transaksi' : 'Tambah Transaksi'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tanggal *</label>
                  <input required type="date" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nama Pembeli *</label>
                  <input required type="text" value={formData.namaPembeli} onChange={e => setFormData({...formData, namaPembeli: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Produk *</label>
                  <select required value={formData.produkId} onChange={handleProductSelect} className="w-full px-3 py-2 border rounded-xl">
                    <option value="">-- Pilih Produk --</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.nama_produk} (Stok: {p.stok})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Jumlah</label>
                    <input required type="number" min="1" value={formData.jumlah} onChange={e => setFormData({...formData, jumlah: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Harga Satuan</label>
                    <input required type="number" value={formData.hargaSatuan} onChange={e => setFormData({...formData, hargaSatuan: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Metode Pembayaran</label>
                  <select value={formData.metodePembayaran} onChange={e => setFormData({...formData, metodePembayaran: e.target.value})} className="w-full px-3 py-2 border rounded-xl">
                    {['Cash', 'Transfer bank', 'QRIS', 'COD', 'Marketplace'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status Pembayaran</label>
                  <select value={formData.statusPembayaran} onChange={e => setFormData({...formData, statusPembayaran: e.target.value})} className="w-full px-3 py-2 border rounded-xl">
                    {['Belum bayar', 'Sudah bayar', 'DP', 'Batal'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Uang Masuk ke Rekening *</label>
                  <select required value={formData.rekeningId} onChange={e => setFormData({...formData, rekeningId: e.target.value})} className="w-full px-3 py-2 border rounded-xl">
                    <option value="">-- Pilih Rekening --</option>
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.nama_rekening}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Channel Penjualan</label>
                  <select value={formData.channelPenjualan} onChange={e => setFormData({...formData, channelPenjualan: e.target.value})} className="w-full px-3 py-2 border rounded-xl">
                    {['WhatsApp', 'Instagram', 'Facebook', 'Offline', 'Reseller', 'Marketplace'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Total (Otomatis)</label>
                  <div className="w-full px-3 py-2 bg-gray-50 border rounded-xl font-bold">{formatRupiah(formData.jumlah * formData.hargaSatuan)}</div>
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
