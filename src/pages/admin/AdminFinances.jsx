import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Download, ArrowUpRight, ArrowDownRight, Wallet, Loader2, ArrowRightLeft, Filter, X, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatRupiah } from '../../utils/format';

export default function AdminFinances() {
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [mutations, setMutations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // --- FILTERS ---
  const [filterPeriodType, setFilterPeriodType] = useState('Bulan'); // 'Bulan' or 'Semua'
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().substring(0, 7));
  const [filterType, setFilterType] = useState('Semua');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [filterAccountId, setFilterAccountId] = useState('Semua');
  const [showFilters, setShowFilters] = useState(false);

  // --- FORM DATA ---
  const expenseCategories = ['Bahan baku', 'Kemasan', 'Transportasi', 'Gaji/upah', 'Listrik/operasional', 'Marketing', 'Lain-lain'];
  const [expenseForm, setExpenseForm] = useState({ tanggal: '', kategori: expenseCategories[0], namaPengeluaran: '', jumlah: 0, rekeningId: '', catatan: '' });

  const incomeCategories = ['Modal Awal', 'Pendanaan', 'Lain-lain'];
  const [incomeForm, setIncomeForm] = useState({ tanggal: '', kategori: incomeCategories[0], namaPemasukan: '', jumlah: 0, rekeningId: '', catatan: '' });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [
        { data: sData },
        { data: pData },
        { data: eData },
        { data: iData },
        { data: accData },
        { data: mData }
      ] = await Promise.all([
        supabase.from('kabung_sales').select('*'),
        supabase.from('kabung_purchases').select('*'),
        supabase.from('kabung_expenses').select('*'),
        supabase.from('kabung_incomes').select('*'),
        supabase.from('kabung_accounts').select('*'),
        supabase.from('kabung_mutations').select('*')
      ]);

      setSales(sData || []);
      setPurchases(pData || []);
      setExpenses(eData || []);
      setIncomes(iData || []);
      setAccounts(accData || []);
      setMutations(mData || []);

      if (accData?.length > 0) {
        const firstId = accData[0].id;
        setExpenseForm(prev => ({ ...prev, rekeningId: firstId }));
        setIncomeForm(prev => ({ ...prev, rekeningId: firstId }));
      }
    } catch (error) {
      console.error('Error fetching financial data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---
  const handleOpenExpenseModal = (exp = null) => {
    if (exp) {
      setEditingId(exp.id);
      setExpenseForm({ tanggal: exp.tanggal, kategori: exp.kategori, namaPengeluaran: exp.nama_pengeluaran, jumlah: exp.jumlah, rekeningId: exp.rekening_id, catatan: exp.catatan || '' });
    } else {
      setEditingId(null);
      setExpenseForm({ tanggal: new Date().toISOString().split('T')[0], kategori: expenseCategories[0], namaPengeluaran: '', jumlah: 0, rekeningId: accounts.length > 0 ? accounts[0].id : '', catatan: '' });
    }
    setIsExpenseModalOpen(true);
  };

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = { tanggal: expenseForm.tanggal, kategori: expenseForm.kategori, nama_pengeluaran: expenseForm.namaPengeluaran, jumlah: Number(expenseForm.jumlah), rekening_id: expenseForm.rekeningId, catatan: expenseForm.catatan };
      if (editingId) await supabase.from('kabung_expenses').update(payload).eq('id', editingId);
      else await supabase.from('kabung_expenses').insert([payload]);
      await fetchInitialData();
      setIsExpenseModalOpen(false);
    } catch (error) { alert('Gagal: ' + error.message); } finally { setSubmitting(false); }
  };

  const handleOpenIncomeModal = (inc = null) => {
    if (inc) {
      setEditingId(inc.id);
      setIncomeForm({ tanggal: inc.tanggal, kategori: inc.kategori, namaPemasukan: inc.nama_pemasukan, jumlah: inc.jumlah, rekeningId: inc.rekening_id, catatan: inc.catatan || '' });
    } else {
      setEditingId(null);
      setIncomeForm({ tanggal: new Date().toISOString().split('T')[0], kategori: incomeCategories[0], namaPemasukan: '', jumlah: 0, rekeningId: accounts.length > 0 ? accounts[0].id : '', catatan: '' });
    }
    setIsIncomeModalOpen(true);
  };

  const handleSubmitIncome = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = { tanggal: incomeForm.tanggal, kategori: incomeForm.kategori, nama_pemasukan: incomeForm.namaPemasukan, jumlah: Number(incomeForm.jumlah), rekening_id: incomeForm.rekeningId, catatan: incomeForm.catatan };
      if (editingId) await supabase.from('kabung_incomes').update(payload).eq('id', editingId);
      else await supabase.from('kabung_incomes').insert([payload]);
      await fetchInitialData();
      setIsIncomeModalOpen(false);
    } catch (error) { alert('Gagal: ' + error.message); } finally { setSubmitting(false); }
  };

  const handleDeleteExpense = async (id) => { if (window.confirm('Hapus?')) { setLoading(true); await supabase.from('kabung_expenses').delete().eq('id', id); await fetchInitialData(); setLoading(false); } };
  const handleDeleteIncome = async (id) => { if (window.confirm('Hapus?')) { setLoading(true); await supabase.from('kabung_incomes').delete().eq('id', id); await fetchInitialData(); setLoading(false); } };

  // --- UNIFIED TRANSACTIONS LIST ---
  const allTransactions = useMemo(() => {
    let list = [];
    sales.filter(s => s.status_pembayaran === 'Sudah bayar').forEach(s => list.push({ id: `sale-${s.id}`, rawId: s.id, type: 'INCOME', source: 'sale', tanggal: s.tanggal, kategori: 'Penjualan Produk', keterangan: `Penjualan: ${s.nama_pembeli} (${s.nama_produk})`, jumlah: Number(s.total_penjualan), rekeningId: s.rekening_id }));
    purchases.forEach(p => list.push({ id: `pur-${p.id}`, rawId: p.id, type: 'EXPENSE', source: 'purchase', tanggal: p.tanggal, kategori: 'Pembelian Stok', keterangan: `Restock: ${p.nama_produk} dari ${p.nama_petani}`, jumlah: Number(p.harga_beli_total), rekeningId: p.rekening_id }));
    incomes.forEach(i => list.push({ id: `inc-${i.id}`, rawId: i.id, type: 'INCOME', source: 'manual_inc', tanggal: i.tanggal, kategori: i.kategori, keterangan: i.nama_pemasukan, jumlah: Number(i.jumlah), rawData: i, rekeningId: i.rekening_id }));
    expenses.forEach(e => list.push({ id: `exp-${e.id}`, rawId: e.id, type: 'EXPENSE', source: 'manual_exp', tanggal: e.tanggal, kategori: e.kategori, keterangan: e.nama_pengeluaran, jumlah: Number(e.jumlah), rawData: e, rekeningId: e.rekening_id }));
    mutations.forEach(m => {
      const dari = accounts.find(a => a.id === m.dari_rekening_id)?.nama_rekening || 'Account';
      const ke = accounts.find(a => a.id === m.ke_rekening_id)?.nama_rekening || 'Account';
      list.push({ id: `mut-${m.id}`, rawId: m.id, type: 'MUTATION', source: 'mutation', tanggal: m.tanggal, kategori: 'Mutasi Uang', keterangan: `Mutasi: ${dari} ke ${ke}`, jumlah: Number(m.jumlah), rawData: m, rekeningId: m.dari_rekening_id });
    });

    list.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    
    return list.filter(t => {
      const matchPeriod = filterPeriodType === 'Semua' || (filterMonth && t.tanggal.startsWith(filterMonth));
      const matchType = filterType === 'Semua' || t.type === filterType;
      const matchCategory = filterCategory === 'Semua' || t.kategori === filterCategory;
      const matchAccount = filterAccountId === 'Semua' || t.rekeningId === filterAccountId;
      return matchPeriod && matchType && matchCategory && matchAccount;
    });
  }, [sales, purchases, incomes, expenses, mutations, filterMonth, filterPeriodType, filterType, filterCategory, filterAccountId, accounts]);

  const { totalIn, totalOut } = useMemo(() => {
    let tIn = 0; let tOut = 0;
    allTransactions.forEach(t => {
      if (t.type === 'INCOME') tIn += t.jumlah;
      else if (t.type === 'EXPENSE') tOut += t.jumlah;
    });
    return { totalIn: tIn, totalOut: tOut };
  }, [allTransactions]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set();
    sales.filter(s => s.status_pembayaran === 'Sudah bayar').forEach(() => cats.add('Penjualan Produk'));
    purchases.forEach(() => cats.add('Pembelian Stok'));
    incomes.forEach(i => cats.add(i.kategori));
    expenses.forEach(e => cats.add(e.kategori));
    mutations.forEach(() => cats.add('Mutasi Uang'));
    return ['Semua', ...Array.from(cats)];
  }, [sales, purchases, incomes, expenses, mutations]);

  const handleExportCSV = () => {
    const headers = ['Tanggal', 'Tipe', 'Kategori', 'Keterangan', 'Akun', 'Pemasukan', 'Pengeluaran'];
    const rows = allTransactions.map(t => [t.tanggal, t.type, t.kategori, `"${t.keterangan.replace(/"/g, '""')}"`, accounts.find(a => a.id === t.rekeningId)?.nama_rekening || '-', t.type === 'INCOME' ? t.jumlah : 0, t.type === 'EXPENSE' ? t.jumlah : 0]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.setAttribute('download', `buku_kas.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h1 className="text-2xl font-bold text-brand-brown">Pencatatan Keuangan</h1><p className="text-brand-brown/50 text-sm">Buku Kas: Pemasukan & Pengeluaran</p></div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-medium transition-all ${showFilters ? 'bg-brand-brown text-white border-brand-brown' : 'bg-white text-brand-brown border-brand-brown/20'}`}><Filter className="w-4 h-4" /> Filter {showFilters ? 'Tutup' : ''}</button>
          <button onClick={handleExportCSV} className="bg-brand-brown hover:bg-brand-brown/90 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium"><Download className="w-4 h-4" /> Export CSV</button>
        </div>
      </div>

      {/* FILTERS PANEL */}
      {showFilters && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-brown/10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in relative">
          <button onClick={() => setShowFilters(false)} className="absolute top-4 right-4 text-brand-brown/20 hover:text-brand-brown"><X className="w-5 h-5" /></button>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-brand-brown/40 mb-2">Periode Waktu</label>
            <div className="flex gap-2">
              <select value={filterPeriodType} onChange={(e) => setFilterPeriodType(e.target.value)} className="w-1/2 px-3 py-2 bg-brand-brown/[0.02] border border-brand-brown/10 rounded-xl outline-none text-sm font-bold">
                <option value="Bulan">Bulan</option>
                <option value="Semua">Semua</option>
              </select>
              {filterPeriodType === 'Bulan' && (
                <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-1/2 px-3 py-2 bg-brand-brown/[0.02] border border-brand-brown/10 rounded-xl outline-none text-sm font-bold" />
              )}
            </div>
          </div>
          <div><label className="block text-[10px] font-black uppercase tracking-widest text-brand-brown/40 mb-2">Tipe Transaksi</label><select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full px-3 py-2 bg-brand-brown/[0.02] border border-brand-brown/10 rounded-xl outline-none text-sm font-bold"><option value="Semua">Semua Tipe</option><option value="INCOME">Pemasukan (+)</option><option value="EXPENSE">Pengeluaran (-)</option><option value="MUTATION">Mutasi Uang</option></select></div>
          <div><label className="block text-[10px] font-black uppercase tracking-widest text-brand-brown/40 mb-2">Kategori</label><select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full px-3 py-2 bg-brand-brown/[0.02] border border-brand-brown/10 rounded-xl outline-none text-sm font-bold">{uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label className="block text-[10px] font-black uppercase tracking-widest text-brand-brown/40 mb-2">Akun / Rekening</label><select value={filterAccountId} onChange={(e) => setFilterAccountId(e.target.value)} className="w-full px-3 py-2 bg-brand-brown/[0.02] border border-brand-brown/10 rounded-xl outline-none text-sm font-bold"><option value="Semua">Semua Akun</option>{accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.nama_rekening}</option>)}</select></div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 flex justify-between items-center group transition-all"><div><p className="text-sm font-medium text-brand-brown/50 mb-1">Total Pemasukan</p><h3 className="text-2xl font-bold text-emerald-600">{formatRupiah(totalIn)}</h3></div><div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 group-hover:rotate-12 transition-transform"><ArrowDownRight className="w-6 h-6" /></div></div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-rose-100 flex justify-between items-center group transition-all"><div><p className="text-sm font-medium text-brand-brown/50 mb-1">Total Pengeluaran</p><h3 className="text-2xl font-bold text-rose-600">{formatRupiah(totalOut)}</h3></div><div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 group-hover:rotate-12 transition-transform"><ArrowUpRight className="w-6 h-6" /></div></div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => handleOpenIncomeModal()} className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex justify-center items-center gap-2 shadow-sm transition-all"><Plus className="w-5 h-5" /> Pemasukan Manual</button>
        <button onClick={() => handleOpenExpenseModal()} className="flex-1 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex justify-center items-center gap-2 shadow-sm transition-all"><Plus className="w-5 h-5" /> Pengeluaran Manual</button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-brand-brown/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-brand-brown/5 border-b border-brand-brown/10">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-brand-brown">Tanggal</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-brand-brown">Keterangan</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-brand-brown text-right">Pemasukan</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-brand-brown text-right">Pengeluaran</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-brand-brown text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-brown/10">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center"><Loader2 className="w-8 h-8 text-brand-gold animate-spin mx-auto mb-2" /><span className="text-sm text-brand-brown/40">Loading...</span></td></tr>
              ) : allTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-brand-brown/[0.02] group transition-colors">
                  <td className="px-6 py-4 text-xs font-bold text-brand-brown whitespace-nowrap">{t.tanggal}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-brand-brown group-hover:text-brand-gold transition-colors">{t.keterangan}</div>
                    <div className="flex flex-wrap gap-2 items-center mt-1.5">
                      <div className="text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 bg-brand-brown/10 text-brand-brown rounded-full">{t.kategori}</div>
                      {t.rekeningId && <div className="text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 border border-brand-brown/20 text-brand-brown/50 rounded-full flex items-center gap-1"><Wallet className="w-2.5 h-2.5" />{accounts.find(a => a.id === t.rekeningId)?.nama_rekening || 'Kas'}</div>}
                      {t.type === 'MUTATION' && <div className="text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 bg-brand-gold/10 text-brand-gold rounded-full flex items-center gap-1"><ArrowRightLeft className="w-2.5 h-2.5" /> Mutasi</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-emerald-600">{t.type === 'INCOME' ? formatRupiah(t.jumlah) : '-'}</td>
                  <td className="px-6 py-4 text-right font-black text-rose-600">{t.type === 'EXPENSE' ? formatRupiah(t.jumlah) : '-'}</td>
                  <td className="px-6 py-4 flex justify-center gap-2">
                    {t.source === 'manual_exp' && (<><button onClick={() => handleOpenExpenseModal(t.rawData)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl"><Edit className="w-4 h-4" /></button><button onClick={() => handleDeleteExpense(t.rawId)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"><Trash2 className="w-4 h-4" /></button></>)}
                    {t.source === 'manual_inc' && (<><button onClick={() => handleOpenIncomeModal(t.rawData)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl"><Edit className="w-4 h-4" /></button><button onClick={() => handleDeleteIncome(t.rawId)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"><Trash2 className="w-4 h-4" /></button></>)}
                    {(t.source === 'sale' || t.source === 'purchase' || t.source === 'mutation') && <span className="text-[10px] font-black text-brand-brown/20 uppercase italic">Otomatis</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS (PENGELUARAN & PEMASUKAN) - Tetap Sama */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] overflow-y-auto p-4 flex items-center justify-center">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-fade-up">
            <div className="p-8 border-b border-brand-brown/5 flex justify-between items-center"><h2 className="text-xl font-black text-brand-brown">{editingId ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}</h2><button onClick={()=>setIsExpenseModalOpen(false)} className="text-brand-brown/20 hover:text-brand-brown"><X /></button></div>
            <form onSubmit={handleSubmitExpense} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-black uppercase text-brand-brown/40 mb-2">Tanggal</label><input required type="date" value={expenseForm.tanggal} onChange={e=>setExpenseForm({...expenseForm, tanggal: e.target.value})} className="w-full px-4 py-3 bg-brand-brown/5 rounded-2xl outline-none font-bold text-sm border-none" /></div>
                <div><label className="block text-[10px] font-black uppercase text-brand-brown/40 mb-2">Kategori</label><select value={expenseForm.kategori} onChange={e=>setExpenseForm({...expenseForm, kategori: e.target.value})} className="w-full px-4 py-3 bg-brand-brown/5 rounded-2xl outline-none font-bold text-sm border-none">{expenseCategories.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              </div>
              <div><label className="block text-[10px] font-black uppercase text-brand-brown/40 mb-2">Keterangan</label><input required type="text" placeholder="Keterangan..." value={expenseForm.namaPengeluaran} onChange={e=>setExpenseForm({...expenseForm, namaPengeluaran: e.target.value})} className="w-full px-4 py-3 bg-brand-brown/5 rounded-2xl outline-none font-bold text-sm border-none" /></div>
              <div><label className="block text-[10px] font-black uppercase text-brand-brown/40 mb-2">Jumlah (Rp)</label><input required type="number" min="1" value={expenseForm.jumlah} onChange={e=>setExpenseForm({...expenseForm, jumlah: e.target.value})} className="w-full px-4 py-3 bg-brand-brown/5 rounded-2xl outline-none font-black text-lg text-rose-600 border-none" /></div>
              <div><label className="block text-[10px] font-black uppercase text-brand-brown/40 mb-2">Akun</label><select required value={expenseForm.rekeningId} onChange={e => setExpenseForm({...expenseForm, rekeningId: e.target.value})} className="w-full px-4 py-3 bg-brand-brown/5 rounded-2xl outline-none font-bold text-sm border-none"><option value="">-- Pilih --</option>{accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.nama_rekening}</option>)}</select></div>
              <div className="pt-6 flex gap-3"><button type="button" onClick={()=>setIsExpenseModalOpen(false)} className="flex-1 px-4 py-4 bg-brand-brown/5 text-brand-brown rounded-2xl font-black text-xs uppercase" disabled={submitting}>Batal</button><button type="submit" className="flex-1 px-4 py-4 bg-brand-brown text-white rounded-2xl font-black text-xs uppercase shadow-xl" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button></div>
            </form>
          </div>
        </div>
      )}

      {isIncomeModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] overflow-y-auto p-4 flex items-center justify-center">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-fade-up">
            <div className="p-8 border-b border-brand-brown/5 flex justify-between items-center"><h2 className="text-xl font-black text-brand-brown">{editingId ? 'Edit Pemasukan' : 'Tambah Pemasukan'}</h2><button onClick={()=>setIsIncomeModalOpen(false)} className="text-brand-brown/20 hover:text-brand-brown"><X /></button></div>
            <form onSubmit={handleSubmitIncome} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-black uppercase text-brand-brown/40 mb-2">Tanggal</label><input required type="date" value={incomeForm.tanggal} onChange={e=>setIncomeForm({...incomeForm, tanggal: e.target.value})} className="w-full px-4 py-3 bg-brand-brown/5 rounded-2xl outline-none font-bold text-sm border-none" /></div>
                <div><label className="block text-[10px] font-black uppercase text-brand-brown/40 mb-2">Kategori</label><select value={incomeForm.kategori} onChange={e=>setIncomeForm({...incomeForm, kategori: e.target.value})} className="w-full px-4 py-3 bg-brand-brown/5 rounded-2xl outline-none font-bold text-sm border-none">{incomeCategories.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              </div>
              <div><label className="block text-[10px] font-black uppercase text-brand-brown/40 mb-2">Keterangan</label><input required type="text" placeholder="Keterangan..." value={incomeForm.namaPemasukan} onChange={e=>setIncomeForm({...incomeForm, namaPemasukan: e.target.value})} className="w-full px-4 py-3 bg-brand-brown/5 rounded-2xl outline-none font-bold text-sm border-none" /></div>
              <div><label className="block text-[10px] font-black uppercase text-brand-brown/40 mb-2">Jumlah (Rp)</label><input required type="number" min="1" value={incomeForm.jumlah} onChange={e=>setIncomeForm({...incomeForm, jumlah: e.target.value})} className="w-full px-4 py-3 bg-brand-brown/5 rounded-2xl outline-none font-black text-lg text-emerald-600 border-none" /></div>
              <div><label className="block text-[10px] font-black uppercase text-brand-brown/40 mb-2">Akun</label><select required value={incomeForm.rekeningId} onChange={e => setIncomeForm({...incomeForm, rekeningId: e.target.value})} className="w-full px-4 py-3 bg-brand-brown/5 rounded-2xl outline-none font-bold text-sm border-none"><option value="">-- Pilih --</option>{accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.nama_rekening}</option>)}</select></div>
              <div className="pt-6 flex gap-3"><button type="button" onClick={()=>setIsIncomeModalOpen(false)} className="flex-1 px-4 py-4 bg-brand-brown/5 text-brand-brown rounded-2xl font-black text-xs uppercase" disabled={submitting}>Batal</button><button type="submit" className="flex-1 px-4 py-4 bg-brand-brown text-white rounded-2xl font-black text-xs uppercase shadow-xl" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
