import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { formatRupiah } from '../../utils/format';
import { FileText, Calendar, Download, Loader2, PieChart, TrendingUp, Wallet, ShieldCheck, Briefcase, Lock, CheckCircle2, AlertCircle, Clock, ArrowRight, Heart, Zap, Gem } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState('labarugi');
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [products, setProducts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [mutations, setMutations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const [filterPeriod, setFilterPeriod] = useState('Bulan ini');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().substring(0, 7));
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Tutup Buku States
  const [selectedClosingMonth, setSelectedClosingMonth] = useState(new Date().toISOString().substring(0, 7));
  const [closingMode, setClosingMode] = useState('bulanan'); 

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
        { data: prodData },
        { data: accData },
        { data: invData },
        { data: mutData }
      ] = await Promise.all([
        supabase.from('kabung_sales').select('*'),
        supabase.from('kabung_purchases').select('*'),
        supabase.from('kabung_expenses').select('*'),
        supabase.from('kabung_incomes').select('*'),
        supabase.from('kabung_products').select('*'),
        supabase.from('kabung_accounts').select('*'),
        supabase.from('kabung_investors').select('*'),
        supabase.from('kabung_mutations').select('*')
      ]);

      setSales(sData || []);
      setPurchases(pData || []);
      setExpenses(eData || []);
      setIncomes(iData || []);
      setProducts(prodData || []);
      setAccounts(accData || []);
      setInvestors(invData || []);
      setMutations(mutData || []);
    } catch (error) {
      console.error('Error fetching data for reports:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const { filteredSales, filteredExpenses, filteredPurchases, filteredIncomes } = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const getStartOfWeek = (d) => {
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() - day;
      return new Date(date.setDate(diff)).toISOString().split('T')[0];
    };
    const startOfWeekStr = getStartOfWeek(today);
    const startOfMonthStr = today.toISOString().substring(0, 7) + '-01';

    const filter = (data) => data.filter(item => {
      if (filterPeriod === 'Hari ini') return item.tanggal === todayStr;
      if (filterPeriod === 'Minggu ini') return item.tanggal >= startOfWeekStr && item.tanggal <= todayStr;
      if (filterPeriod === 'Bulan ini') return item.tanggal >= startOfMonthStr && item.tanggal <= todayStr;
      if (filterPeriod === 'Pilih Bulan') return item.tanggal.startsWith(filterMonth);
      if (filterPeriod === 'Custom') {
        if (!customStartDate || !customEndDate) return false;
        return item.tanggal >= customStartDate && item.tanggal <= customEndDate;
      }
      return true;
    });

    return {
      filteredSales: filter(sales.filter(s => s.status_pembayaran === 'Sudah bayar')),
      filteredExpenses: filter(expenses),
      filteredPurchases: filter(purchases),
      filteredIncomes: filter(incomes)
    };
  }, [sales, expenses, purchases, incomes, filterPeriod, filterMonth, customStartDate, customEndDate]);

  // LABA RUGI CALCULATIONS
  const pnl = useMemo(() => {
    const revenue = filteredSales.reduce((sum, s) => sum + Number(s.total_penjualan), 0);
    const cogs = filteredSales.reduce((sum, s) => {
      const product = products.find(p => p.id === s.produk_id);
      return sum + ((product ? Number(product.harga_modal) : 0) * Number(s.jumlah));
    }, 0);
    const opex = filteredExpenses.reduce((sum, e) => sum + Number(e.jumlah), 0);
    const otherInc = filteredIncomes.reduce((sum, i) => i.kategori === 'Modal Awal' ? sum : sum + Number(i.jumlah), 0);
    const netProfit = revenue - cogs - opex + otherInc;
    return { revenue, cogs, grossProfit: revenue - cogs, opex, otherIncome: otherInc, netProfit };
  }, [filteredSales, filteredExpenses, products, filteredIncomes]);

  // TUTUP BUKU CALCULATIONS (With 40-10-10-40 Rule)
  const closingData = useMemo(() => {
    const monthSales = sales.filter(s => s.status_pembayaran === 'Sudah bayar' && s.tanggal.startsWith(selectedClosingMonth));
    const monthExpenses = expenses.filter(e => e.tanggal.startsWith(selectedClosingMonth));
    const monthIncomes = incomes.filter(i => i.tanggal.startsWith(selectedClosingMonth) && i.kategori !== 'Modal Awal');

    const mRevenue = monthSales.reduce((sum, s) => sum + Number(s.total_penjualan), 0);
    const mCogs = monthSales.reduce((sum, s) => {
      const product = products.find(p => p.id === s.produk_id);
      return sum + ((product ? Number(product.harga_modal) : 0) * Number(s.jumlah));
    }, 0);
    const mOpex = monthExpenses.reduce((sum, e) => sum + Number(e.jumlah), 0);
    const mOtherInc = monthIncomes.reduce((sum, i) => sum + Number(i.jumlah), 0);
    const mNetProfit = (mRevenue - mCogs - mOpex + mOtherInc);

    const cumulativeRevenue = sales.filter(s => s.status_pembayaran === 'Sudah bayar').reduce((sum, s) => sum + Number(s.total_penjualan), 0);
    const cumulativeCogs = sales.filter(s => s.status_pembayaran === 'Sudah bayar').reduce((sum, s) => {
      const product = products.find(p => p.id === s.produk_id);
      return sum + ((product ? Number(product.harga_modal) : 0) * Number(s.jumlah));
    }, 0);
    const cumulativeOpex = expenses.reduce((sum, e) => sum + Number(e.jumlah), 0);
    const cumulativeOtherInc = incomes.filter(i => i.kategori !== 'Modal Awal').reduce((sum, i) => sum + Number(i.jumlah), 0);
    const cumulativeNetProfit = (cumulativeRevenue - cumulativeCogs - cumulativeOpex + cumulativeOtherInc);

    const isAlreadyClosed = monthExpenses.some(e => e.kategori === 'Bagi Hasil Investor');
    const finalProfit = closingMode === 'kumulatif' ? cumulativeNetProfit : mNetProfit;

    // Split buckets
    const alokasiInvestasi = finalProfit * 0.40;
    const alokasiSedekah = finalProfit * 0.10;
    const alokasiSelfDev = finalProfit * 0.10;
    const alokasiDividen = finalProfit * 0.40;

    return { 
      mNetProfit, cumulativeNetProfit, isAlreadyClosed, finalProfit,
      alokasiInvestasi, alokasiSedekah, alokasiSelfDev, alokasiDividen
    };
  }, [selectedClosingMonth, sales, expenses, incomes, products, closingMode]);

  const handleTutupBuku = async () => {
    if (closingData.isAlreadyClosed) return toast.error('Bulan ini sudah pernah ditutup buku!');
    if (closingData.finalProfit <= 0) return toast.error('Laba bersih nol atau minus.');
    
    if (!window.confirm(`Konfirmasi Tutup Buku?\nTotal Laba: ${formatRupiah(closingData.finalProfit)}\n\nDistribusi:\n- Investasi (40%): ${formatRupiah(closingData.alokasiInvestasi)}\n- Sedekah (10%): ${formatRupiah(closingData.alokasiSedekah)}\n- Self Dev (10%): ${formatRupiah(closingData.alokasiSelfDev)}\n- Bagi Hasil (40%): ${formatRupiah(closingData.alokasiDividen)}`)) return;

    try {
      setProcessing(true);
      const today = new Date().toISOString().split('T')[0];
      const accountId = accounts.length > 0 ? accounts[0].id : null;

      const records = [
        { tanggal: today, kategori: 'Alokasi Investasi', nama_pengeluaran: `Dana Investasi (${selectedClosingMonth})`, jumlah: closingData.alokasiInvestasi, rekening_id: accountId, catatan: 'Otomatis Tutup Buku (40%)' },
        { tanggal: today, kategori: 'Alokasi Sedekah', nama_pengeluaran: `Dana Sedekah (${selectedClosingMonth})`, jumlah: closingData.alokasiSedekah, rekening_id: accountId, catatan: 'Otomatis Tutup Buku (10%)' },
        { tanggal: today, kategori: 'Pengembangan Diri', nama_pengeluaran: `Dana Self-Dev (${selectedClosingMonth})`, jumlah: closingData.alokasiSelfDev, rekening_id: accountId, catatan: 'Otomatis Tutup Buku (10%)' },
      ];

      const dividendRecords = investors.map(inv => ({
        tanggal: today,
        kategori: 'Bagi Hasil Investor',
        nama_pengeluaran: `Bagi Hasil ${selectedClosingMonth}: ${inv.nama}`,
        jumlah: (closingData.alokasiDividen * (Number(inv.persentase) / 100)),
        rekening_id: accountId,
        catatan: `Tutup Buku ${selectedClosingMonth}. Porsi 40% dari total laba.`
      }));

      const { error } = await supabase.from('kabung_expenses').insert([...records, ...dividendRecords]);
      if (error) throw error;

      toast.success(`Tutup buku berhasil! Seluruh alokasi telah dicatat.`);
      await fetchInitialData();
    } catch (error) {
      toast.error('Gagal tutup buku: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  // NERACA CALCULATIONS
  const neraca = useMemo(() => {
    const cashBank = accounts.reduce((sum, acc) => {
      let balance = Number(acc.saldo_awal) || 0;
      sales.filter(s => s.status_pembayaran === 'Sudah bayar' && s.rekening_id === acc.id).forEach(s => balance += Number(s.total_penjualan));
      incomes.filter(i => i.rekening_id === acc.id).forEach(i => balance += Number(i.jumlah));
      purchases.filter(p => p.rekening_id === acc.id).forEach(p => balance -= Number(p.harga_beli_total));
      expenses.filter(e => e.rekening_id === acc.id).forEach(e => balance -= Number(e.jumlah));
      mutations.filter(m => m.dari_rekening_id === acc.id).forEach(m => balance -= Number(m.jumlah));
      mutations.filter(m => m.ke_rekening_id === acc.id).forEach(m => balance += Number(m.jumlah));
      return sum + balance;
    }, 0);
    const inventoryValue = products.reduce((sum, p) => sum + (Number(p.stok) * Number(p.harga_modal)), 0);
    const totalPurchasesValue = purchases.reduce((sum, p) => sum + Number(p.harga_beli_total), 0);
    const cumulativeCogs = sales.filter(s => s.status_pembayaran === 'Sudah bayar').reduce((sum, s) => {
      const product = products.find(p => p.id === s.produk_id);
      return sum + ((product ? Number(product.harga_modal) : 0) * Number(s.jumlah));
    }, 0);
    const goodsInTransit = Math.max(0, totalPurchasesValue - cumulativeCogs - inventoryValue);
    const totalAssets = cashBank + inventoryValue + goodsInTransit;

    const totalCapital = investors.reduce((sum, inv) => sum + Number(inv.modal), 0);
    const cumulativeRevenue = sales.filter(s => s.status_pembayaran === 'Sudah bayar').reduce((sum, s) => sum + Number(s.total_penjualan), 0);
    const cumulativeOpex = expenses.reduce((sum, e) => sum + Number(e.jumlah), 0);
    const cumulativeOtherInc = incomes.filter(i => i.kategori !== 'Modal Awal').reduce((sum, i) => sum + Number(i.jumlah), 0);
    const retainedEarnings = cumulativeRevenue - cumulativeCogs - cumulativeOpex + cumulativeOtherInc;

    return { cashBank, inventoryValue, goodsInTransit, totalAssets, totalCapital, retainedEarnings, totalEquity: totalCapital + retainedEarnings };
  }, [accounts, products, sales, incomes, purchases, expenses, investors, mutations]);

  // ARUS KAS
  const cashflow = useMemo(() => {
    const opIn = filteredSales.reduce((sum, s) => sum + Number(s.total_penjualan), 0) + filteredIncomes.filter(i => i.kategori !== 'Modal Awal').reduce((sum, i) => sum + Number(i.jumlah), 0);
    const opOut = filteredExpenses.reduce((sum, e) => sum + Number(e.jumlah), 0) + filteredPurchases.reduce((sum, p) => sum + Number(p.harga_beli_total), 0);
    const financing = filteredIncomes.filter(i => i.kategori === 'Modal Awal').reduce((sum, i) => sum + Number(i.jumlah), 0) || (filterPeriod === 'Semua' ? investors.reduce((sum, inv) => sum + Number(inv.modal), 0) : 0);
    const beginningBalance = accounts.reduce((sum, acc) => sum + (Number(acc.saldo_awal) || 0), 0);
    return { opIn, opOut, operational: opIn - opOut, financing, netChange: opIn - opOut + financing, beginningBalance };
  }, [filteredSales, filteredIncomes, filteredExpenses, filteredPurchases, investors, accounts, filterPeriod]);

  if (loading) return <div className="h-[60vh] flex flex-col items-center justify-center"><Loader2 className="w-12 h-12 text-brand-gold animate-spin mb-4" /><p className="text-brand-brown/40 font-bold uppercase tracking-widest text-xs">Loading...</p></div>;

  return (
    <div className="space-y-8 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-brand-brown tracking-tight">Laporan <span className="italic font-light text-brand-brown/40">Keuangan</span></h1>
          <p className="text-xs text-brand-brown/40 font-bold uppercase tracking-widest mt-1">SAK - Gula Kabung</p>
        </div>
        {activeTab !== 'tutupbuku' && (
          <div className="flex flex-wrap gap-3 bg-white p-2 rounded-2xl shadow-sm border border-brand-brown/5">
            <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} className="px-4 py-2 bg-brand-brown/5 rounded-xl text-xs font-black uppercase tracking-widest outline-none border-none">
              <option value="Hari ini">Hari ini</option><option value="Minggu ini">Minggu ini</option><option value="Bulan ini">Bulan ini</option><option value="Pilih Bulan">Pilih Bulan</option><option value="Semua">Semua</option><option value="Custom">Custom</option>
            </select>
            {filterPeriod === 'Pilih Bulan' && <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="px-3 py-2 bg-brand-brown/5 rounded-xl text-xs font-bold outline-none border-none" />}
            {filterPeriod === 'Custom' && <div className="flex items-center gap-2"><input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="px-3 py-2 bg-brand-brown/5 rounded-xl text-xs font-bold outline-none border-none" /><span className="text-brand-brown/20 font-black">—</span><input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="px-3 py-2 bg-brand-brown/5 rounded-xl text-xs font-bold outline-none border-none" /></div>}
          </div>
        )}
      </div>

      {/* TABS */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {[{ id: 'labarugi', name: 'Laba Rugi', icon: TrendingUp }, { id: 'neraca', name: 'Neraca', icon: ShieldCheck }, { id: 'aruskas', name: 'Arus Kas', icon: Wallet }, { id: 'tutupbuku', name: 'Tutup Buku', icon: Lock }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-8 py-4 rounded-2xl flex items-center gap-3 transition-all whitespace-nowrap text-[10px] font-black uppercase tracking-[0.2em] border ${activeTab === tab.id ? 'bg-brand-brown text-white border-brand-brown shadow-xl scale-105' : 'bg-white text-brand-brown/40 border-brand-brown/5'}`}><tab.icon className="w-4 h-4" /> {tab.name}</button>
        ))}
      </div>

      {activeTab === 'labarugi' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-up">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-brand-brown/5">
              <h3 className="text-xl font-black text-brand-brown mb-8 flex items-center gap-3"><PieChart className="w-6 h-6 text-brand-gold" /> Rincian Laba Rugi</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center"><span className="text-sm font-bold text-brand-brown/60 uppercase tracking-widest">Pendapatan Penjualan</span><span className="text-lg font-black text-brand-brown">{formatRupiah(pnl.revenue)}</span></div>
                <div className="flex justify-between items-center group pb-6 border-b border-brand-brown/5"><span className="text-sm font-bold text-brand-brown/60 uppercase tracking-widest">Beban Pokok (HPP)</span><span className="text-lg font-black text-rose-500">({formatRupiah(pnl.cogs)})</span></div>
                <div className="flex justify-between items-center py-4 bg-brand-brown/[0.02] px-6 rounded-2xl"><span className="text-sm font-black text-brand-brown uppercase tracking-widest">Laba Kotor</span><span className="text-xl font-black text-brand-gold">{formatRupiah(pnl.grossProfit)}</span></div>
                <div className="flex justify-between items-center pt-4"><span className="text-sm font-bold text-brand-brown/60 uppercase tracking-widest">Beban Operasional</span><span className="text-lg font-black text-rose-500">({formatRupiah(pnl.opex)})</span></div>
                <div className="flex justify-between items-center pb-6 border-b border-brand-brown/5"><span className="text-sm font-bold text-brand-brown/60 uppercase tracking-widest">Pendapatan Lain</span><span className="text-lg font-black text-emerald-600">{formatRupiah(pnl.otherIncome)}</span></div>
                <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-8 rounded-3xl ${pnl.netProfit >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'} shadow-2xl gap-4`}>
                  <div><span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Laba Bersih</span><h4 className="text-3xl font-black tracking-tighter mt-1">{formatRupiah(pnl.netProfit)}</h4></div>
                  <TrendingUp className="w-12 h-12 opacity-30" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'neraca' && (
        <div className="grid lg:grid-cols-2 gap-8 animate-fade-up">
          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-brand-brown/5">
            <h3 className="text-xl font-black text-brand-brown mb-10 flex items-center gap-3"><Wallet className="w-6 h-6 text-brand-gold" /> Aktiva (Assets)</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center"><span className="text-sm font-bold text-brand-brown/60 uppercase tracking-widest">Kas & Bank</span><span className="text-lg font-black text-brand-brown">{formatRupiah(neraca.cashBank)}</span></div>
              <div className="flex justify-between items-center"><span className="text-sm font-bold text-brand-brown/60 uppercase tracking-widest">Persediaan Barang</span><span className="text-lg font-black text-brand-brown">{formatRupiah(neraca.inventoryValue)}</span></div>
              <div className="flex justify-between items-center pb-6 border-b border-brand-brown/5"><span className="text-sm font-bold text-brand-brown/60 uppercase tracking-widest">Pesanan (PO)</span><span className="text-lg font-black text-brand-gold">{formatRupiah(neraca.goodsInTransit)}</span></div>
              <div className="flex justify-between items-center pt-4 bg-brand-brown/5 p-6 rounded-2xl"><span className="text-sm font-black text-brand-brown uppercase tracking-widest">Total Aktiva</span><span className="text-2xl font-black text-brand-brown">{formatRupiah(neraca.totalAssets)}</span></div>
            </div>
          </div>
          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-brand-brown/5">
            <h3 className="text-xl font-black text-brand-brown mb-10 flex items-center gap-3"><Briefcase className="w-6 h-6 text-brand-gold" /> Pasiva (Equity)</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center"><span className="text-sm font-bold text-brand-brown/60 uppercase tracking-widest">Modal Investor</span><span className="text-lg font-black text-brand-brown">{formatRupiah(neraca.totalCapital)}</span></div>
              <div className="flex justify-between items-center pb-6 border-b border-brand-brown/5"><span className="text-sm font-bold text-brand-brown/60 uppercase tracking-widest">Laba Ditahan</span><span className="text-lg font-black text-emerald-600">{formatRupiah(neraca.retainedEarnings)}</span></div>
              <div className="flex justify-between items-center pt-4 bg-brand-brown text-white p-6 rounded-2xl shadow-xl"><span className="text-sm font-black uppercase tracking-widest opacity-60">Total Pasiva</span><span className="text-2xl font-black">{formatRupiah(neraca.totalEquity)}</span></div>
            </div>
            <p className="mt-8 text-[10px] text-brand-brown/30 font-bold tracking-widest text-center italic">Balance: {Math.abs(neraca.totalAssets - neraca.totalEquity) < 100 ? 'Balanced ✓' : 'Unbalanced ⚠'}</p>
          </div>
        </div>
      )}

      {activeTab === 'aruskas' && (
        <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-brand-brown/5 animate-fade-up">
          <h3 className="text-xl font-black text-brand-brown mb-12 flex items-center gap-3"><Wallet className="w-6 h-6 text-brand-gold" /> Laporan Arus Kas</h3>
          <div className="space-y-10 max-w-3xl">
            <div><h4 className="text-xs font-black text-brand-gold uppercase tracking-[0.3em] mb-6">Aktivitas Operasional</h4><div className="space-y-4 px-6 border-l-2 border-brand-brown/5"><div className="flex justify-between"><span className="text-sm font-bold text-brand-brown/60">Penerimaan Pelanggan</span><span className="text-sm font-black text-emerald-600">+{formatRupiah(cashflow.opIn)}</span></div><div className="flex justify-between"><span className="text-sm font-bold text-brand-brown/60">Pengeluaran Operasional</span><span className="text-sm font-black text-rose-500">-({formatRupiah(cashflow.opOut)})</span></div></div></div>
            <div><h4 className="text-xs font-black text-brand-gold uppercase tracking-[0.3em] mb-6">Aktivitas Pendanaan</h4><div className="space-y-4 px-6 border-l-2 border-brand-brown/5"><div className="flex justify-between"><span className="text-sm font-bold text-brand-brown/60">Modal Investor</span><span className="text-sm font-black text-emerald-600">+{formatRupiah(cashflow.financing)}</span></div></div></div>
            <div className="pt-10 border-t-2 border-brand-brown/10 space-y-4">
              <div className="flex justify-between px-6 font-bold"><span className="text-brand-brown/40">Saldo Awal</span><span>{formatRupiah(cashflow.beginningBalance)}</span></div>
              <div className="flex justify-between p-8 bg-brand-gold rounded-3xl text-brand-brown shadow-xl"><div><span className="text-[10px] font-black uppercase opacity-60">Saldo Akhir</span><h4 className="text-4xl font-black tracking-tighter mt-1">{formatRupiah(cashflow.beginningBalance + cashflow.netChange)}</h4></div><Wallet className="w-12 h-12 opacity-30" /></div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tutupbuku' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-up">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-brand-brown/5">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-black text-brand-brown flex items-center gap-3"><Lock className="w-6 h-6 text-brand-gold" /> Proses Tutup Buku</h3>
                <input type="month" value={selectedClosingMonth} onChange={(e) => setSelectedClosingMonth(e.target.value)} className="px-4 py-2 bg-brand-brown/5 rounded-xl text-xs font-black outline-none border-none" />
              </div>

              <div className="flex gap-4 mb-10">
                <button onClick={() => setClosingMode('bulanan')} className={`flex-1 p-5 rounded-3xl border transition-all text-left ${closingMode === 'bulanan' ? 'bg-brand-brown text-white border-brand-brown shadow-xl' : 'bg-white text-brand-brown/60 border-brand-brown/10'}`}><p className="text-[9px] font-black uppercase opacity-60">Mode</p><p className="font-bold">Bulan Ini</p><p className="text-xs mt-1">{formatRupiah(closingData.mNetProfit)}</p></button>
                <button onClick={() => setClosingMode('kumulatif')} className={`flex-1 p-5 rounded-3xl border transition-all text-left ${closingMode === 'kumulatif' ? 'bg-brand-gold text-brand-brown border-brand-gold shadow-xl' : 'bg-white text-brand-brown/60 border-brand-brown/10'}`}><p className="text-[9px] font-black uppercase opacity-60">Mode</p><p className="font-bold">Akumulatif</p><p className="text-xs mt-1">{formatRupiah(closingData.cumulativeNetProfit)}</p></button>
              </div>

              {!closingData.isAlreadyClosed && closingData.finalProfit > 0 && (
                <div className="space-y-8">
                  {/* BUCKETS GRID */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-brand-brown/[0.03] border border-brand-brown/5 rounded-3xl text-center">
                      <Gem className="w-5 h-5 mx-auto text-brand-gold mb-2" /><p className="text-[8px] font-black uppercase text-brand-brown/40">Investasi (40%)</p><p className="text-[10px] font-black text-brand-brown mt-1">{formatRupiah(closingData.alokasiInvestasi)}</p>
                    </div>
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-3xl text-center">
                      <Heart className="w-5 h-5 mx-auto text-emerald-600 mb-2" /><p className="text-[8px] font-black uppercase text-emerald-600/40">Sedekah (10%)</p><p className="text-[10px] font-black text-emerald-600 mt-1">{formatRupiah(closingData.alokasiSedekah)}</p>
                    </div>
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-3xl text-center">
                      <Zap className="w-5 h-5 mx-auto text-rose-600 mb-2" /><p className="text-[8px] font-black uppercase text-rose-600/40">Self-Dev (10%)</p><p className="text-[10px] font-black text-rose-600 mt-1">{formatRupiah(closingData.alokasiSelfDev)}</p>
                    </div>
                    <div className="p-4 bg-brand-gold/10 border border-brand-gold/20 rounded-3xl text-center">
                      <ShieldCheck className="w-5 h-5 mx-auto text-brand-gold mb-2" /><p className="text-[8px] font-black uppercase text-brand-gold/60">Bagi Hasil (40%)</p><p className="text-[10px] font-black text-brand-brown mt-1">{formatRupiah(closingData.alokasiDividen)}</p>
                    </div>
                  </div>

                  {/* INVESTOR LIST */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-brand-brown/40 uppercase tracking-widest">Distribusi Bagi Hasil (40% Pool)</h4>
                    <div className="bg-brand-brown/[0.02] border border-brand-brown/5 rounded-[2rem] overflow-hidden divide-y divide-brand-brown/5">
                      {investors.map(inv => (
                        <div key={inv.id} className="p-6 flex justify-between items-center group hover:bg-white transition-colors">
                          <div><p className="font-black text-brand-brown">{inv.nama}</p><p className="text-[9px] font-bold text-brand-brown/30 uppercase tracking-widest mt-1">Saham: {inv.persentase}%</p></div>
                          <div className="text-right"><p className="font-black text-brand-gold text-lg">{formatRupiah(closingData.alokasiDividen * (Number(inv.persentase) / 100))}</p><p className="text-[9px] font-bold text-brand-brown/20 uppercase">Porsi Bagi Hasil</p></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button onClick={handleTutupBuku} disabled={processing} className="w-full py-6 bg-brand-brown text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-brand-gold hover:text-brand-brown transition-all flex items-center justify-center gap-4 disabled:opacity-50">
                    {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />} Proses Tutup Buku & Alokasi Dana
                  </button>
                </div>
              )}

              {closingData.isAlreadyClosed && (
                <div className="bg-emerald-50 border border-emerald-100 p-10 rounded-[2.5rem] flex items-center gap-8"><CheckCircle2 className="w-16 h-16 text-emerald-500 shrink-0" /><div><h4 className="text-xl font-black text-emerald-900">Bulan Ini Sudah Ditutup</h4><p className="text-sm text-emerald-700/60 mt-1">Seluruh alokasi dana (40-10-10-40) telah dicatat ke pengeluaran.</p></div></div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
