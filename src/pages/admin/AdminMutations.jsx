import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, ArrowRightLeft, Loader2, Calendar, Wallet, ArrowRight, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatRupiah } from '../../utils/format';
import { toast } from 'react-hot-toast';

export default function AdminMutations() {
  const [mutations, setMutations] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    dariRekeningId: '',
    keRekeningId: '',
    jumlah: 0,
    catatan: ''
  });

  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().substring(0, 7));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: mutationsData, error: mutError } = await supabase
        .from('kabung_mutations')
        .select('*')
        .order('tanggal', { ascending: false });
      
      const { data: accountsData, error: accError } = await supabase
        .from('kabung_accounts')
        .select('*');

      if (mutError) throw mutError;
      if (accError) throw accError;

      setMutations(mutationsData || []);
      setAccounts(accountsData || []);
    } catch (error) {
      console.error('Error fetching mutations:', error.message);
      toast.error('Gagal memuat data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      dariRekeningId: accounts.length > 0 ? accounts[0].id : '',
      keRekeningId: accounts.length > 1 ? accounts[1].id : '',
      jumlah: 0,
      catatan: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.dariRekeningId === formData.keRekeningId) {
      return toast.error('Rekening asal dan tujuan tidak boleh sama');
    }
    if (formData.jumlah <= 0) {
      return toast.error('Jumlah mutasi harus lebih dari 0');
    }

    try {
      setSubmitting(true);
      const payload = {
        tanggal: formData.tanggal,
        dari_rekening_id: formData.dariRekeningId,
        ke_rekening_id: formData.keRekeningId,
        jumlah: Number(formData.jumlah),
        catatan: formData.catatan
      };

      const { error } = await supabase.from('kabung_mutations').insert([payload]);
      if (error) throw error;

      toast.success('Mutasi uang berhasil dicatat');
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Gagal menyimpan: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus catatan mutasi ini?')) return;
    
    try {
      setLoading(true);
      const { error } = await supabase.from('kabung_mutations').delete().eq('id', id);
      if (error) throw error;
      toast.success('Catatan mutasi berhasil dihapus');
      fetchData();
    } catch (error) {
      toast.error('Gagal menghapus: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredMutations = useMemo(() => {
    if (!filterMonth) return mutations;
    return mutations.filter(m => m.tanggal.startsWith(filterMonth));
  }, [mutations, filterMonth]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-brown">Mutasi Uang</h1>
          <p className="text-brand-brown/50 text-sm">Pindahkan saldo antar rekening atau kas.</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="month" 
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-4 py-2 border border-brand-brown/10 rounded-xl outline-none bg-white font-medium" 
          />
          <button 
            onClick={handleOpenModal}
            className="bg-brand-brown hover:bg-brand-gold text-white hover:text-brand-brown px-5 py-2 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-brand-brown/10"
          >
            <Plus className="w-4 h-4" /> Mutasi Baru
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-brand-brown/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-brand-brown/5 border-b border-brand-brown/10">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-brand-brown">Tanggal</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-brand-brown">Dari Rekening</th>
                <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-brand-brown">Arah</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-brand-brown">Ke Rekening</th>
                <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-brand-brown">Jumlah</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-brand-brown">Catatan</th>
                <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-brand-brown">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-brown/5">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-20 text-center">
                    <Loader2 className="w-10 h-10 text-brand-gold animate-spin mx-auto mb-4" />
                    <p className="text-brand-brown/40 font-bold uppercase tracking-widest text-[10px]">Memuat data mutasi...</p>
                  </td>
                </tr>
              ) : filteredMutations.map((m) => (
                <tr key={m.id} className="hover:bg-brand-brown/[0.01] transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-brand-brown whitespace-nowrap">{m.tanggal}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-brand-brown">
                      {accounts.find(a => a.id === m.dari_rekening_id)?.nama_rekening || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="w-8 h-8 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center mx-auto">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-brand-brown">
                      {accounts.find(a => a.id === m.ke_rekening_id)?.nama_rekening || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-brand-brown">
                    {formatRupiah(m.jumlah)}
                  </td>
                  <td className="px-6 py-4 text-xs text-brand-brown/50 italic max-w-[200px] truncate">
                    {m.catatan || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleDelete(m.id)}
                      className="p-2 text-rose-400 hover:bg-rose-50 rounded-xl transition-all mx-auto block"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filteredMutations.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-20 text-center">
                    <div className="w-16 h-16 bg-brand-brown/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ArrowRightLeft className="w-8 h-8 text-brand-brown/10" />
                    </div>
                    <p className="text-brand-brown/30 font-bold uppercase tracking-widest text-[10px]">Belum ada mutasi di bulan ini.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 overflow-y-auto p-4 md:p-8">
          <div className="flex min-h-full items-center justify-center">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-up">
              <div className="p-8 bg-brand-brown text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <ArrowRightLeft className="w-24 h-24" />
                </div>
                <h2 className="text-2xl font-black tracking-tight mb-1 uppercase italic">Catat Mutasi Uang</h2>
                <p className="text-white/50 font-bold uppercase tracking-[0.2em] text-[10px]">Pindahkan dana antar kas/bank</p>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="relative">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-brown/50 mb-2">
                    <Calendar className="w-3 h-3" /> Tanggal Mutasi
                  </label>
                  <input 
                    required 
                    type="date" 
                    value={formData.tanggal} 
                    onChange={e => setFormData({...formData, tanggal: e.target.value})} 
                    className="w-full px-5 py-4 rounded-2xl border border-brand-brown/10 bg-brand-brown/[0.02] focus:border-brand-gold outline-none font-bold text-brand-brown" 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-brown/50 mb-2">
                      <Wallet className="w-3 h-3" /> Rekening Asal
                    </label>
                    <select 
                      required 
                      value={formData.dariRekeningId} 
                      onChange={e => setFormData({...formData, dariRekeningId: e.target.value})} 
                      className="w-full px-5 py-4 rounded-2xl border border-brand-brown/10 bg-brand-brown/[0.02] focus:border-brand-gold outline-none font-bold text-brand-brown"
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.nama_rekening}</option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-brown/50 mb-2">
                      <Wallet className="w-3 h-3 text-brand-gold" /> Rekening Tujuan
                    </label>
                    <select 
                      required 
                      value={formData.keRekeningId} 
                      onChange={e => setFormData({...formData, keRekeningId: e.target.value})} 
                      className="w-full px-5 py-4 rounded-2xl border-2 border-brand-gold/30 bg-brand-gold/[0.02] focus:border-brand-gold outline-none font-bold text-brand-brown"
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.nama_rekening}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="relative">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">
                    Jumlah yang Dimutasikan (Rp) *
                  </label>
                  <input 
                    required 
                    type="number" 
                    min="1" 
                    value={formData.jumlah} 
                    onChange={e => setFormData({...formData, jumlah: e.target.value})} 
                    className="w-full px-6 py-5 rounded-2xl border-2 border-brand-gold focus:ring-4 focus:ring-brand-gold/10 outline-none font-black text-3xl text-brand-brown bg-brand-gold/[0.02]" 
                  />
                </div>

                <div className="relative">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-brown/50 mb-2 block">
                    Catatan (Opsional)
                  </label>
                  <textarea 
                    rows="2" 
                    value={formData.catatan} 
                    onChange={e => setFormData({...formData, catatan: e.target.value})} 
                    className="w-full px-5 py-4 rounded-2xl border border-brand-brown/10 focus:border-brand-gold outline-none font-bold text-brand-brown"
                    placeholder="Misal: Setor tunai ke Bank BCA"
                  ></textarea>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-brand-brown/40 hover:bg-brand-brown/5 transition-all" 
                    disabled={submitting}
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="flex-[2] py-4 bg-brand-gold text-brand-brown rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-brand-gold/20" 
                    disabled={submitting}
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {submitting ? 'Memproses...' : 'Simpan Mutasi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
