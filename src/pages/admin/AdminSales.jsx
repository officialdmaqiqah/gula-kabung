import React, { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { formatRupiah } from '../../utils/format';

export default function AdminSales() {
  const [sales, setSales] = useLocalStorage('kabungmart_sales', []);
  const [products, setProducts] = useLocalStorage('kabungmart_products', []);
  const [accounts] = useLocalStorage('kabungmart_accounts', [{ id: 'kas-tunai', namaRekening: 'Kas Tunai', saldoAwal: 0 }]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    namaPembeli: '',
    produkId: '',
    jumlah: 1,
    hargaSatuan: 0,
    hargaSatuan: 0,
    metodePembayaran: 'Transfer bank',
    rekeningId: 'kas-tunai',
    statusPembayaran: 'Sudah bayar',
    channelPenjualan: 'WhatsApp',
    catatan: ''
  });

  const handleProductSelect = (e) => {
    const selectedProd = products.find(p => p.id.toString() === e.target.value);
    setFormData({
      ...formData,
      produkId: e.target.value,
      hargaSatuan: selectedProd ? selectedProd.hargaJual : 0,
      namaProduk: selectedProd ? selectedProd.namaProduk : ''
    });
  };

  const handleOpenModal = (sale = null) => {
    if (sale) {
      setEditingId(sale.id);
      setFormData(sale);
    } else {
      setEditingId(null);
      setFormData({
        tanggal: new Date().toISOString().split('T')[0],
        namaPembeli: '', produkId: '', jumlah: 1, hargaSatuan: 0,
        metodePembayaran: 'Transfer bank', rekeningId: accounts.length > 0 ? accounts[0].id : 'kas-tunai',
        statusPembayaran: 'Sudah bayar',
        channelPenjualan: 'WhatsApp', catatan: '', namaProduk: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.produkId) return alert('Pilih produk!');
    
    const newSale = {
      ...formData,
      jumlah: Number(formData.jumlah),
      hargaSatuan: Number(formData.hargaSatuan),
      totalPenjualan: Number(formData.jumlah) * Number(formData.hargaSatuan),
    };

    let updatedProducts = [...products];
    const productIndex = updatedProducts.findIndex(p => p.id.toString() === formData.produkId);

    if (productIndex === -1) return alert('Produk tidak ditemukan!');

    if (editingId) {
      const oldSale = sales.find(s => s.id === editingId);
      setProducts(prevProducts => {
        const updated = [...prevProducts];
        const idx = updated.findIndex(p => p.id.toString() === formData.produkId);
        if (idx !== -1) {
          if (oldSale && oldSale.produkId === formData.produkId) {
            const diff = newSale.jumlah - oldSale.jumlah;
            updated[idx] = { ...updated[idx], stok: updated[idx].stok - diff };
          } else if (oldSale) {
            const oldIdx = updated.findIndex(p => p.id.toString() === oldSale.produkId);
            if (oldIdx !== -1) updated[oldIdx] = { ...updated[oldIdx], stok: updated[oldIdx].stok + oldSale.jumlah };
            updated[idx] = { ...updated[idx], stok: updated[idx].stok - newSale.jumlah };
          }
        }
        return updated;
      });
      setSales(sales.map(s => s.id === editingId ? { ...newSale, id: editingId } : s));
    } else {
      setProducts(prevProducts => {
        const updated = [...prevProducts];
        const idx = updated.findIndex(p => p.id.toString() === formData.produkId);
        if (idx !== -1) updated[idx] = { ...updated[idx], stok: updated[idx].stok - newSale.jumlah };
        return updated;
      });
      setSales([{ ...newSale, id: Date.now() }, ...sales]);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Yakin ingin menghapus transaksi ini? Stok produk akan dikembalikan.')) {
      const saleToDelete = sales.find(s => s.id === id);
      if (saleToDelete) {
        setProducts(prevProducts => {
          const updated = [...prevProducts];
          const idx = updated.findIndex(p => p.id.toString() === saleToDelete.produkId);
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], stok: updated[idx].stok + saleToDelete.jumlah };
          }
          return updated;
        });
      }
      setSales(sales.filter(s => s.id !== id));
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
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-brand-brown/[0.02]">
                  <td className="px-6 py-4 text-sm text-brand-brown">{sale.tanggal}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-brand-brown">{sale.namaPembeli}</div>
                    <div className="text-sm text-brand-brown/50">{sale.jumlah}x {sale.namaProduk}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-brand-brown">{formatRupiah(sale.totalPenjualan)}</div>
                    <div className="text-xs text-brand-brown/40">{sale.metodePembayaran}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                      sale.statusPembayaran === 'Sudah bayar' ? 'bg-green-100 text-green-700' :
                      sale.statusPembayaran === 'Batal' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {sale.statusPembayaran}
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
              {filteredSales.length === 0 && (
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
                    {products.map(p => <option key={p.id} value={p.id}>{p.namaProduk}</option>)}
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
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.namaRekening}</option>)}
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
              </div>
              <div className="pt-4 border-t border-brand-brown/10 mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 hover:bg-brand-brown/5 rounded-xl text-brand-brown">Batal</button>
                <button type="submit" className="px-4 py-2 bg-brand-gold text-white rounded-xl font-medium">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
