import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Clock, AlertCircle, Loader2, Package, Calendar, User, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatRupiah } from '../../utils/format';
import { toast } from 'react-hot-toast';

export default function AdminReceiving() {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [receivingHistory, setReceivingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const [formData, setFormData] = useState({
    tanggalTerima: new Date().toISOString().split('T')[0],
    jumlahTerima: 0,
    penerima: '',
    catatan: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Orders that are not fully received
      const { data: orders, error: ordersError } = await supabase
        .from('kabung_purchases')
        .select('*')
        .neq('status_penerimaan', 'Selesai')
        .order('tanggal', { ascending: false });

      if (ordersError) throw ordersError;

      // 2. Fetch all receiving logs (History)
      const { data: history, error: historyError } = await supabase
        .from('kabung_receiving')
        .select(`
          *,
          purchase:purchase_id (
            nama_produk,
            nama_petani,
            jumlah_beli
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (historyError) throw historyError;

      setPendingOrders(orders || []);
      setReceivingHistory(history || []);
    } catch (error) {
      console.error('Error fetching receiving data:', error.message);
      toast.error('Gagal memuat data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (order) => {
    setSelectedOrder(order);
    const remaining = order.jumlah_beli - (order.jumlah_diterima || 0);
    setFormData({
      tanggalTerima: new Date().toISOString().split('T')[0],
      jumlahTerima: remaining,
      penerima: '',
      catatan: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (formData.jumlahTerima <= 0) return toast.error('Jumlah diterima harus lebih dari 0');

    try {
      setSubmitting(true);
      
      const remaining = selectedOrder.jumlah_beli - (selectedOrder.jumlah_diterima || 0);
      if (formData.jumlahTerima > remaining) {
        if (!window.confirm(`Jumlah yang Anda masukkan (${formData.jumlahTerima}) melebihi sisa pesanan (${remaining}). Tetap simpan?`)) {
          setSubmitting(false);
          return;
        }
      }

      // 1. Insert into kabung_receiving
      const { error: receiveError } = await supabase
        .from('kabung_receiving')
        .insert([{
          purchase_id: selectedOrder.id,
          tanggal_terima: formData.tanggalTerima,
          jumlah_terima: Number(formData.jumlahTerima),
          penerima: formData.penerima,
          catatan: formData.catatan
        }]);

      if (receiveError) throw receiveError;

      // 2. Update kabung_purchases summary
      const newTotalReceived = (selectedOrder.jumlah_diterima || 0) + Number(formData.jumlahTerima);
      const newStatus = newTotalReceived >= selectedOrder.jumlah_beli ? 'Selesai' : 'Parsial';

      const { error: updateOrderError } = await supabase
        .from('kabung_purchases')
        .update({
          jumlah_diterima: newTotalReceived,
          status_penerimaan: newStatus
        })
        .eq('id', selectedOrder.id);

      if (updateOrderError) throw updateOrderError;

      // 3. Update Product Stock
      const { data: product, error: prodFetchError } = await supabase
        .from('kabung_products')
        .select('stok')
        .eq('id', selectedOrder.produk_id)
        .single();
      
      if (prodFetchError) throw prodFetchError;

      const { error: stockUpdateError } = await supabase
        .from('kabung_products')
        .update({ stok: (product.stok || 0) + Number(formData.jumlahTerima) })
        .eq('id', selectedOrder.produk_id);

      if (stockUpdateError) throw stockUpdateError;

      toast.success(`Berhasil menerima ${formData.jumlahTerima} pcs barang.`);
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Gagal mencatat penerimaan: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-brand-brown">Logistik: Penerimaan Barang</h1>
        <p className="text-sm text-brand-brown/50">Lacak kedatangan stok fisik dari pesanan Pre-Order.</p>
      </div>

      {/* SECTION: PENDING ORDERS */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-brand-brown">
          <Clock className="w-5 h-5 text-amber-500" />
          <h2 className="font-bold uppercase tracking-widest text-xs">Pesanan Belum Lengkap ({pendingOrders.length})</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-12 flex justify-center">
              <Loader2 className="w-8 h-8 text-brand-gold animate-spin" />
            </div>
          ) : pendingOrders.map((order) => {
            const pending = order.jumlah_beli - (order.jumlah_diterima || 0);
            return (
              <div key={order.id} className="bg-white p-5 rounded-3xl border border-brand-brown/10 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${order.status_penerimaan === 'Parsial' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                    {order.status_penerimaan || 'Pending'}
                  </div>
                  <span className="text-[10px] font-bold text-brand-brown/30">{order.tanggal}</span>
                </div>
                <h3 className="font-black text-brand-brown text-lg leading-tight mb-1">{order.nama_produk}</h3>
                <p className="text-xs font-bold text-brand-brown/50 mb-4">{order.nama_petani}</p>
                
                <div className="bg-brand-brown/[0.02] p-4 rounded-2xl mb-4 border border-brand-brown/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-brand-brown/40 uppercase tracking-widest">Progress</span>
                    <span className="text-xs font-black text-brand-brown">{(order.jumlah_diterima || 0)} / {order.jumlah_beli}</span>
                  </div>
                  <div className="w-full h-1.5 bg-brand-brown/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-gold transition-all duration-1000" 
                      style={{ width: `${((order.jumlah_diterima || 0) / order.jumlah_beli) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <button 
                  onClick={() => handleOpenModal(order)}
                  className="w-full py-3 bg-brand-brown text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-brand-gold group-hover:text-brand-brown transition-all"
                >
                  Terima {pending} Pcs <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            );
          })}
          {!loading && pendingOrders.length === 0 && (
            <div className="col-span-full py-12 bg-emerald-50 rounded-3xl text-center border-2 border-dashed border-emerald-100">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-emerald-700 font-bold uppercase tracking-widest text-xs">Semua pesanan sudah diterima lengkap!</p>
            </div>
          )}
        </div>
      </section>

      {/* SECTION: HISTORY */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-brand-brown">
          <Package className="w-5 h-5 text-brand-gold" />
          <h2 className="font-bold uppercase tracking-widest text-xs">Riwayat Kedatangan Barang (Terakhir)</h2>
        </div>

        <div className="bg-white rounded-3xl border border-brand-brown/10 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-brand-brown/5 border-b border-brand-brown/10">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-brand-brown">Tgl Terima</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-brand-brown">Barang</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-brand-brown text-center">Jumlah</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-brand-brown">Penerima</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-brand-brown">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-brown/10">
              {receivingHistory.map((log) => (
                <tr key={log.id} className="hover:bg-brand-brown/[0.01]">
                  <td className="px-6 py-4 text-sm font-medium text-brand-brown">{log.tanggal_terima}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-brand-brown">{log.purchase?.nama_produk}</div>
                    <div className="text-[9px] text-brand-brown/40 font-bold uppercase tracking-tighter">Dari: {log.purchase?.nama_petani}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg font-black text-sm">+{log.jumlah_terima}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-brand-brown font-bold">{log.penerima || '-'}</td>
                  <td className="px-6 py-4 text-xs text-brand-brown/50 italic">{log.catatan || '-'}</td>
                </tr>
              ))}
              {receivingHistory.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-brand-brown/30 italic text-sm">Belum ada riwayat penerimaan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL: INPUT RECEIVING */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden animate-fade-up">
            <div className="p-10 bg-brand-brown text-white relative">
              <div className="absolute top-0 right-0 p-10 opacity-10">
                <Package className="w-32 h-32" />
              </div>
              <h2 className="text-2xl font-black tracking-tight mb-2 uppercase italic">Konfirmasi Kedatangan</h2>
              <p className="text-white/50 font-bold uppercase tracking-[0.2em] text-[10px]">Pesanan dari: {selectedOrder.nama_petani}</p>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="col-span-2 bg-brand-gold/10 p-6 rounded-3xl border border-brand-gold/20">
                  <div className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2">Barang yang Diterima</div>
                  <div className="text-xl font-black text-brand-brown">{selectedOrder.nama_produk}</div>
                  <div className="mt-4 flex justify-between items-end">
                    <div>
                      <div className="text-[9px] font-black text-brand-brown/40 uppercase">Belum Diterima</div>
                      <div className="text-2xl font-black text-rose-500">{selectedOrder.jumlah_beli - (selectedOrder.jumlah_diterima || 0)} <span className="text-sm">pcs</span></div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-black text-brand-brown/40 uppercase">Total Pesanan</div>
                      <div className="text-lg font-bold text-brand-brown">{selectedOrder.jumlah_beli} pcs</div>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-brown/50 mb-3"><Calendar className="w-3 h-3" /> Tanggal Terima</label>
                  <input required type="date" value={formData.tanggalTerima} onChange={e => setFormData({...formData, tanggalTerima: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-brand-brown/10 focus:border-brand-gold outline-none font-bold bg-brand-brown/[0.02]" />
                </div>

                <div className="relative">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-gold mb-3"><Package className="w-3 h-3" /> Jumlah Datang *</label>
                  <input required type="number" min="1" value={formData.jumlahTerima} onChange={e => setFormData({...formData, jumlahTerima: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-brand-gold focus:ring-4 focus:ring-brand-gold/10 outline-none font-black text-2xl text-brand-brown bg-brand-gold/[0.02]" />
                </div>

                <div className="col-span-2">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-brown/50 mb-3"><User className="w-3 h-3" /> Nama Penerima</label>
                  <input type="text" value={formData.penerima} onChange={e => setFormData({...formData, penerima: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-brand-brown/10 focus:border-brand-gold outline-none font-bold" placeholder="Siapa yang menerima barang?" />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-brown/50 mb-3 block">Catatan Tambahan</label>
                  <textarea rows="2" value={formData.catatan} onChange={e => setFormData({...formData, catatan: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-brand-brown/10 focus:border-brand-gold outline-none font-bold" placeholder="Misal: Kondisi bagus, bungkus rapi..."></textarea>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] text-brand-brown/40 hover:bg-brand-brown/5 transition-all" disabled={submitting}>Batal</button>
                <button type="submit" className="flex-[2] py-5 bg-brand-gold text-brand-brown rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-brand-gold/20" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {submitting ? 'Memproses...' : 'Konfirmasi Masuk Stok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
