import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Download, ArrowUpRight, ArrowDownRight, Wallet, Loader2, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatRupiah } from '../../utils/format';

export default function AdminFinances() {
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().substring(0, 7));

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
      
      const { data: salesData } = await supabase.from('kabung_sales').select('*');
      const { data: purchasesData } = await supabase.from('kabung_purchases').select('*');
      const { data: expensesData } = await supabase.from('kabung_expenses').select('*');
      const { data: incomesData } = await supabase.from('kabung_incomes').select('*');
      const { data: accountsData } = await supabase.from('kabung_accounts').select('*');

      setSales(salesData || []);
      setPurchases(purchasesData || []);
      setExpenses(expensesData || []);
      setIncomes(incomesData || []);
      setAccounts(accountsData || []);

      if (accountsData?.length > 0) {
        const firstId = accountsData[0].id;
        setExpenseForm(prev => ({ ...prev, rekeningId: firstId }));
        setIncomeForm(prev => ({ ...prev, rekeningId: firstId }));
      }
    } catch (error) {
      console.error('Error fetching financial data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS FOR PENGELUARAN ---
  const handleOpenExpenseModal = (exp = null) => {
    if (exp) {
      setEditingId(exp.id);
      setExpenseForm({
        tanggal: exp.tanggal,
        kategori: exp.kategori,
        namaPengeluaran: exp.nama_pengeluaran,
        jumlah: exp.jumlah,
        rekeningId: exp.rekening_id,
        catatan: exp.catatan || ''
      });
    } else {
      setEditingId(null);
      setExpenseForm({ 
        tanggal: new Date().toISOString().split('T')[0], 
        kategori: expenseCategories[0], 
        namaPengeluaran: '', 
        jumlah: 0, 
        rekeningId: accounts.length > 0 ? accounts[0].id : '', 
        catatan: '' 
      });
    }
    setIsExpenseModalOpen(true);
  };

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        tanggal: expenseForm.tanggal,
        kategori: expenseForm.kategori,
        nama_pengeluaran: expenseForm.namaPengeluaran,
        jumlah: Number(expenseForm.jumlah),
        rekening_id: expenseForm.rekeningId,
        catatan: expenseForm.catatan
      };

      if (editingId) {
        const { error } = await supabase.from('kabung_expenses').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('kabung_expenses').insert([payload]);
        if (error) throw error;
      }

      await fetchInitialData();
      setIsExpenseModalOpen(false);
    } catch (error) {
      alert('Gagal menyimpan: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm('Yakin hapus pengeluaran ini?')) {
      try {
        setLoading(true);
        const { error } = await supabase.from('kabung_expenses').delete().eq('id', id);
        if (error) throw error;
        await fetchInitialData();
      } catch (error) {
        alert('Gagal menghapus: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // --- HANDLERS FOR PEMASUKAN ---
  const handleOpenIncomeModal = (inc = null) => {
    if (inc) {
      setEditingId(inc.id);
      setIncomeForm({
        tanggal: inc.tanggal,
        kategori: inc.kategori,
        namaPemasukan: inc.nama_pemasukan,
        jumlah: inc.jumlah,
        rekeningId: inc.rekening_id,
        catatan: inc.catatan || ''
      });
    } else {
      setEditingId(null);
      setIncomeForm({ 
        tanggal: new Date().toISOString().split('T')[0], 
        kategori: incomeCategories[0], 
        namaPemasukan: '', 
        jumlah: 0, 
        rekeningId: accounts.length > 0 ? accounts[0].id : '', 
        catatan: '' 
      });
    }
    setIsIncomeModalOpen(true);
  };

  const handleSubmitIncome = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        tanggal: incomeForm.tanggal,
        kategori: incomeForm.kategori,
        nama_pemasukan: incomeForm.namaPemasukan,
        jumlah: Number(incomeForm.jumlah),
        rekening_id: incomeForm.rekeningId,
        catatan: incomeForm.catatan
      };

      if (editingId) {
        const { error } = await supabase.from('kabung_incomes').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('kabung_incomes').insert([payload]);
        if (error) throw error;
      }

      await fetchInitialData();
      setIsIncomeModalOpen(false);
    } catch (error) {
      alert('Gagal menyimpan: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteIncome = async (id) => {
    if (window.confirm('Yakin hapus pemasukan ini?')) {
      try {
        setLoading(true);
        const { error } = await supabase.from('kabung_incomes').delete().eq('id', id);
        if (error) throw error;
        await fetchInitialData();
      } catch (error) {
        alert('Gagal menghapus: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // --- UNIFIED TRANSACTIONS LIST ---
  const allTransactions = useMemo(() => {
    let list = [];

    // 1. Sales (Pemasukan)
    sales.filter(s => s.status_pembayaran === 'Sudah bayar').forEach(s => {
      list.push({
        id: `sale-${s.id}`, rawId: s.id, type: 'INCOME', source: 'sale',
        tanggal: s.tanggal, kategori: 'Penjualan Produk',
        keterangan: `Penjualan: ${s.nama_pembeli} (${s.nama_produk})`,
        jumlah: Number(s.total_penjualan)
      });
    });

    // 2. Purchases (Pengeluaran)
    purchases.forEach(p => {
      list.push({
        id: `pur-${p.id}`, rawId: p.id, type: 'EXPENSE', source: 'purchase',
        tanggal: p.tanggal, kategori: 'Pembelian Stok',
        keterangan: `Restock: ${p.nama_produk} dari ${p.nama_petani}`,
        jumlah: Number(p.harga_beli_total)
      });
    });

    // 3. Manual Incomes
    incomes.forEach(i => {
      list.push({
        id: `inc-${i.id}`, rawId: i.id, type: 'INCOME', source: 'manual_inc',
        tanggal: i.tanggal, kategori: i.kategori,
        keterangan: i.nama_pemasukan,
        jumlah: Number(i.jumlah), rawData: i
      });
    });

    // 4. Manual Expenses
    expenses.forEach(e => {
      list.push({
        id: `exp-${e.id}`, rawId: e.id, type: 'EXPENSE', source: 'manual_exp',
        tanggal: e.tanggal, kategori: e.kategori,
        keterangan: e.nama_pengeluaran,
        jumlah: Number(e.jumlah), rawData: e
      });
    });

    // Sort by date descending
    list.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    
    // Filter by month
    if (filterMonth) {
      list = list.filter(t => t.tanggal.startsWith(filterMonth));
    }

    return list;
  }, [sales, purchases, incomes, expenses, filterMonth]);

  const { totalIn, totalOut } = useMemo(() => {
    let tIn = 0; let tOut = 0;
    allTransactions.forEach(t => {
      if (t.type === 'INCOME') tIn += t.jumlah;
      else tOut += t.jumlah;
    });
    return { totalIn: tIn, totalOut: tOut };
  }, [allTransactions]);

  // --- EXPORT TO CSV ---
  const handleExportCSV = () => {
    const headers = ['Tanggal', 'Tipe', 'Kategori', 'Keterangan', 'Pemasukan', 'Pengeluaran'];
    const rows = allTransactions.map(t => [
      t.tanggal,
      t.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
      t.kategori,
      `"${t.keterangan.replace(/"/g, '""')}"`, // escape quotes
      t.type === 'INCOME' ? t.jumlah : 0,
      t.type === 'EXPENSE' ? t.jumlah : 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `buku_kas_${filterMonth || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-brown">Pencatatan Keuangan</h1>
          <p className="text-brand-brown/50 text-sm">Buku Kas: Pemasukan & Pengeluaran</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input 
            type="month" 
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-2 border border-brand-brown/20 rounded-xl outline-none" 
          />
          <button 
            onClick={handleExportCSV}
            className="bg-brand-brown hover:bg-brand-brown/90 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-brand-brown/50 mb-1">Total Pemasukan</p>
            <h3 className="text-2xl font-bold text-emerald-600">{formatRupiah(totalIn)}</h3>
          </div>
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-500">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-rose-100 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-brand-brown/50 mb-1">Total Pengeluaran</p>
            <h3 className="text-2xl font-bold text-rose-600">{formatRupiah(totalOut)}</h3>
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <button onClick={() => handleOpenIncomeModal()} className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors">
          <Plus className="w-5 h-5" /> Pemasukan Manual
        </button>
        <button onClick={() => handleOpenExpenseModal()} className="flex-1 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors">
          <Plus className="w-5 h-5" /> Pengeluaran Manual
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-brand-brown/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-brand-brown/5 border-b border-brand-brown/10">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-brand-brown">Tanggal</th>
                <th className="px-6 py-4 text-sm font-semibold text-brand-brown">Keterangan</th>
                <th className="px-6 py-4 text-sm font-semibold text-brand-brown text-right">Pemasukan</th>
                <th className="px-6 py-4 text-sm font-semibold text-brand-brown text-right">Pengeluaran</th>
                <th className="px-6 py-4 text-sm font-semibold text-brand-brown text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-brown/10">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-brand-gold animate-spin mx-auto mb-2" />
                    <span className="text-sm text-brand-brown/40">Memuat data keuangan...</span>
                  </td>
                </tr>
              ) : allTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-brand-brown/[0.02]">
                  <td className="px-6 py-4 text-sm text-brand-brown whitespace-nowrap">{t.tanggal}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-brand-brown">{t.keterangan}</div>
                    <div className="flex gap-2 items-center mt-1">
                      <div className="text-xs inline-block px-2 py-0.5 bg-brand-brown/10 text-brand-brown rounded-full">{t.kategori}</div>
                      {t.rawData && t.rawData.rekening_id && (
                        <div className="text-xs inline-block px-2 py-0.5 border border-brand-brown/20 text-brand-brown/50 rounded-full">
                          {accounts.find(a => a.id === t.rawData.rekening_id)?.nama_rekening || 'Kas'}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-green-600">
                    {t.type === 'INCOME' ? formatRupiah(t.jumlah) : '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-red-600">
                    {t.type === 'EXPENSE' ? formatRupiah(t.jumlah) : '-'}
                  </td>
                  <td className="px-6 py-4 flex justify-center gap-2">
                    {t.source === 'manual_exp' && (
                      <>
                        <button onClick={() => handleOpenExpenseModal(t.rawData)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteExpense(t.rawId)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"><Trash2 className="w-4 h-4" /></button>
                      </>
                    )}
                    {t.source === 'manual_inc' && (
                      <>
                        <button onClick={() => handleOpenIncomeModal(t.rawData)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteIncome(t.rawId)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"><Trash2 className="w-4 h-4" /></button>
                      </>
                    )}
                    {(t.source === 'sale' || t.source === 'purchase') && (
                      <span className="text-xs text-brand-brown/40 italic">Otomatis</span>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && allTransactions.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-brand-brown/40">Belum ada transaksi di bulan ini.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL PENGELUARAN */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-brown-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-brown-900">{editingId ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}</h2>
            </div>
            <form onSubmit={handleSubmitExpense} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Tanggal</label><input required type="date" value={expenseForm.tanggal} onChange={e=>setExpenseForm({...expenseForm, tanggal: e.target.value})} className="w-full px-3 py-2 border rounded-xl" /></div>
              <div><label className="block text-sm font-medium mb-1">Kategori</label><select value={expenseForm.kategori} onChange={e=>setExpenseForm({...expenseForm, kategori: e.target.value})} className="w-full px-3 py-2 border rounded-xl">{expenseCategories.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">Keterangan</label><input required type="text" value={expenseForm.namaPengeluaran} onChange={e=>setExpenseForm({...expenseForm, namaPengeluaran: e.target.value})} className="w-full px-3 py-2 border rounded-xl" /></div>
              <div><label className="block text-sm font-medium mb-1">Jumlah (Rp)</label><input required type="number" min="1" value={expenseForm.jumlah} onChange={e=>setExpenseForm({...expenseForm, jumlah: e.target.value})} className="w-full px-3 py-2 border rounded-xl" /></div>
              <div>
                <label className="block text-sm font-medium mb-1">Potong dari Rekening/Kas *</label>
                <select required value={expenseForm.rekeningId} onChange={e => setExpenseForm({...expenseForm, rekeningId: e.target.value})} className="w-full px-3 py-2 border rounded-xl">
                  <option value="">-- Pilih Rekening --</option>
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.nama_rekening}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Catatan</label>
                <textarea rows="2" value={expenseForm.catatan} onChange={e => setExpenseForm({...expenseForm, catatan: e.target.value})} className="w-full px-3 py-2 border rounded-xl"></textarea>
              </div>
              <div className="pt-4 border-t mt-4 flex justify-end gap-3">
                <button type="button" onClick={()=>setIsExpenseModalOpen(false)} className="px-4 py-2 hover:bg-gray-100 rounded-xl" disabled={submitting}>Batal</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-xl flex items-center gap-2" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {submitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PEMASUKAN */}
      {isIncomeModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-brown-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-brown-900">{editingId ? 'Edit Pemasukan' : 'Tambah Pemasukan'}</h2>
            </div>
            <form onSubmit={handleSubmitIncome} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Tanggal</label><input required type="date" value={incomeForm.tanggal} onChange={e=>setIncomeForm({...incomeForm, tanggal: e.target.value})} className="w-full px-3 py-2 border rounded-xl" /></div>
              <div><label className="block text-sm font-medium mb-1">Kategori</label><select value={incomeForm.kategori} onChange={e=>setIncomeForm({...incomeForm, kategori: e.target.value})} className="w-full px-3 py-2 border rounded-xl">{incomeCategories.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">Keterangan</label><input required type="text" value={incomeForm.namaPemasukan} onChange={e=>setIncomeForm({...incomeForm, namaPemasukan: e.target.value})} className="w-full px-3 py-2 border rounded-xl" /></div>
              <div><label className="block text-sm font-medium mb-1">Jumlah (Rp)</label><input required type="number" min="1" value={incomeForm.jumlah} onChange={e=>setIncomeForm({...incomeForm, jumlah: e.target.value})} className="w-full px-3 py-2 border rounded-xl" /></div>
              <div>
                <label className="block text-sm font-medium mb-1">Masuk ke Rekening/Kas *</label>
                <select required value={incomeForm.rekeningId} onChange={e => setIncomeForm({...incomeForm, rekeningId: e.target.value})} className="w-full px-3 py-2 border rounded-xl">
                  <option value="">-- Pilih Rekening --</option>
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.nama_rekening}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Catatan</label>
                <textarea rows="2" value={incomeForm.catatan} onChange={e => setIncomeForm({...incomeForm, catatan: e.target.value})} className="w-full px-3 py-2 border rounded-xl"></textarea>
              </div>
              <div className="pt-4 border-t mt-4 flex justify-end gap-3">
                <button type="button" onClick={()=>setIsIncomeModalOpen(false)} className="px-4 py-2 hover:bg-gray-100 rounded-xl" disabled={submitting}>Batal</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-xl flex items-center gap-2" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {submitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
