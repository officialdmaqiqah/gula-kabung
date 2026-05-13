import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { formatRupiah } from '../../utils/format';
import { FileText, Calendar, Download, Loader2, PieChart, TrendingUp, Wallet, ShieldCheck, Briefcase, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
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
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Tutup Buku States
  const [selectedClosingMonth, setSelectedClosingMonth] = useState(new Date().toISOString().substring(0, 7));

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
      if (filterPeriod === 'Custom' && customStartDate && customEndDate) {
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
  }, [sales, expenses, purchases, incomes, filterPeriod, customStartDate, customEndDate]);

  // LABA RUGI CALCULATIONS
  const pnl = useMemo(() => {
    const revenue = filteredSales.reduce((sum, s) => sum + Number(s.total_penjualan), 0);
    const cogs = filteredSales.reduce((sum, s) => {
      const product = products.find(p => p.id === s.produk_id);
      const costPerItem = product ? Number(product.harga_modal) : 0;
      return sum + (costPerItem * Number(s.jumlah));
    }, 0);
    const grossProfit = revenue - cogs;
    
    // Opex: Only expenses, not purchases (Purchases affect inventory & cash, not directly P&L)
    const opex = filteredExpenses.reduce((sum, e) => sum + Number(e.jumlah), 0);
    
    const otherIncome = filteredIncomes.reduce((sum, i) => {
      if (i.kategori === 'Modal Awal') return sum;
      return sum + Number(i.jumlah);
    }, 0);
    
    const netProfit = grossProfit - opex + otherIncome;
    return { revenue, cogs, grossProfit, opex, otherIncome, netProfit };
  }, [filteredSales, filteredExpenses, filteredPurchases, filteredIncomes, products]);

  // TUTUP BUKU CALCULATIONS
  const closingData = useMemo(() => {
    const monthSales = sales.filter(s => s.status_pembayaran === 'Sudah bayar' && s.tanggal.startsWith(selectedClosingMonth));
    const monthExpenses = expenses.filter(e => e.tanggal.startsWith(selectedClosingMonth));
    const monthIncomes = incomes.filter(i => i.tanggal.startsWith(selectedClosingMonth) && i.kategori !== 'Modal Awal');

    const revenue = monthSales.reduce((sum, s) => sum + Number(s.total_penjualan), 0);
    const cogs = monthSales.reduce((sum, s) => {
      const product = products.find(p => p.id === s.produk_id);
      return sum + ((product ? Number(product.harga_modal) : 0) * Number(s.jumlah));
    }, 0);
    const opex = monthExpenses.reduce((sum, e) => sum + Number(e.jumlah), 0);
    const otherInc = monthIncomes.reduce((sum, i) => sum + Number(i.jumlah), 0);
    
    const netProfit = (revenue - cogs - opex + otherInc);
    const isAlreadyClosed = monthExpenses.some(e => e.kategori === 'Bagi Hasil Investor');

    return { netProfit, isAlreadyClosed };
  }, [selectedClosingMonth, sales, expenses, incomes, products]);

  const handleTutupBuku = async () => {
    if (closingData.isAlreadyClosed) return toast.error('Bulan ini sudah pernah ditutup buku!');
    if (closingData.netProfit <= 0) return toast.error('Laba bersih nol atau minus, tidak ada bagi hasil untuk dibagikan.');
    if (!window.confirm(`Konfirmasi Tutup Buku ${selectedClosingMonth}?\nTotal Laba: ${formatRupiah(closingData.netProfit)}\nSistem akan mendistribusikan bagi hasil ke ${investors.length} investor.`)) return;

    try {
      setProcessing(true);
      const dividendRecords = investors.map(inv => ({
        tanggal: new Date().toISOString().split('T')[0],
        kategori: 'Bagi Hasil Investor',
        nama_pengeluaran: `Bagi Hasil ${selectedClosingMonth}: ${inv.nama}`,
        jumlah: (closingData.netProfit * (Number(inv.persentase) / 100)),
        rekening_id: accounts.length > 0 ? accounts[0].id : null,
        catatan: `Otomatis Tutup Buku Bulan ${selectedClosingMonth}. Persentase Saham: ${inv.persentase}%`
      }));

      const { error } = await supabase.from('kabung_expenses').insert(dividendRecords);
      if (error) throw error;

      toast.success(`Tutup buku ${selectedClosingMonth} berhasil! Bagi hasil telah dicatat.`);
      await fetchInitialData();
    } catch (error) {
      toast.error('Gagal tutup buku: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  // NERACA CALCULATIONS
  const neraca = useMemo(() => {
    // 1. ASSETS: Cash & Bank (Realtime calculation including mutations)
    const cashBank = accounts.reduce((sum, acc) => {
      let balance = Number(acc.saldo_awal) || 0;
      
      sales.filter(s => s.status_pembayaran === 'Sudah bayar' && s.rekening_id === acc.id).forEach(s => balance += Number(s.total_penjualan));
      incomes.filter(i => i.rekening_id === acc.id).forEach(i => balance += Number(i.jumlah));
      purchases.filter(p => p.rekening_id === acc.id).forEach(p => balance -= Number(p.harga_beli_total));
      expenses.filter(e => e.rekening_id === acc.id).forEach(e => balance -= Number(e.jumlah));
      
      // Mutations
      mutations.filter(m => m.dari_rekening_id === acc.id).forEach(m => balance -= Number(m.jumlah));
      mutations.filter(m => m.ke_rekening_id === acc.id).forEach(m => balance += Number(m.jumlah));
      
      return sum + balance;
    }, 0);

    // 2. ASSETS: Inventory Value
    const inventoryValue = products.reduce((sum, p) => sum + (Number(p.stok) * Number(p.harga_modal)), 0);
    const totalAssets = cashBank + inventoryValue;

    // 3. EQUITY: Total Capital (Investors)
    const totalCapital = investors.reduce((sum, inv) => sum + Number(inv.modal), 0);

    // 4. EQUITY: Retained Earnings (Cumulative Profit)
    const cumulativeRevenue = sales.filter(s => s.status_pembayaran === 'Sudah bayar').reduce((sum, s) => sum + Number(s.total_penjualan), 0);
    const cumulativeCogs = sales.filter(s => s.status_pembayaran === 'Sudah bayar').reduce((sum, s) => {
      const product = products.find(p => p.id === s.produk_id);
      return sum + ((product ? Number(product.harga_modal) : 0) * Number(s.jumlah));
    }, 0);
    
    // IMPORTANT: Profit only reduced by expenses, NOT purchases (Purchases are already in Cash & Inventory)
    const cumulativeOpex = expenses.reduce((sum, e) => sum + Number(e.jumlah), 0);
    const cumulativeOtherInc = incomes.filter(i => i.kategori !== 'Modal Awal').reduce((sum, i) => sum + Number(i.jumlah), 0);
    
    const retainedEarnings = (cumulativeRevenue - cumulativeCogs - cumulativeOpex + cumulativeOtherInc);
    const totalEquity = totalCapital + retainedEarnings;

    return { cashBank, inventoryValue, totalAssets, totalCapital, retainedEarnings, totalEquity };
  }, [accounts, products, sales, incomes, purchases, expenses, investors, mutations]);

  // ARUS KAS CALCULATIONS
  const cashflow = useMemo(() => {
    const opIn = filteredSales.reduce((sum, s) => sum + Number(s.total_penjualan), 0) + 
                 filteredIncomes.filter(i => i.kategori !== 'Modal Awal').reduce((sum, i) => sum + Number(i.jumlah), 0);
    const opOut = filteredExpenses.reduce((sum, e) => sum + Number(e.jumlah), 0) + 
                  filteredPurchases.reduce((sum, p) => sum + Number(p.harga_beli_total), 0);
    const operational = opIn - opOut;
    const financing = filteredIncomes.filter(i => i.kategori === 'Modal Awal').reduce((sum, i) => sum + Number(i.jumlah), 0);
    return { operational, financing, net: operational + financing };
  }, [filteredSales, filteredIncomes, filteredExpenses, filteredPurchases]);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-brand-gold animate-spin mb-4" />
        <p className="text-brand-brown/40 font-bold uppercase tracking-widest text-xs">Menyusun Laporan Keuangan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* HEADER & FILTER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-brand-brown tracking-tight">Laporan <span className="italic font-light text-brand-brown/40">Keuangan</span></h1>
          <p className="text-xs text-brand-brown/40 font-bold uppercase tracking-widest mt-1">Standar Akuntansi Keuangan (SAK)</p>
        </div>
        
        {activeTab !== 'tutupbuku' && (
          <div className="flex flex-wrap gap-3 bg-white p-2 rounded-2xl shadow-sm border border-brand-brown/5">
            <select 
              value={filterPeriod} 
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="px-4 py-2 bg-brand-brown/5 border-none rounded-xl text-xs font-black uppercase tracking-widest text-brand-brown focus:ring-0 outline-none cursor-pointer"
            >
              <option value="Hari ini">Hari ini</option>
              <option value="Minggu ini">Minggu ini</option>
              <option value="Bulan ini">Bulan ini</option>
              <option value="Semua">Semua Waktu</option>
              <option value="Custom">Custom</option>
            </select>
            
            {filterPeriod === 'Custom' && (
              <div className="flex items-center gap-2 animate-fade-in">
                <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="px-3 py-2 bg-brand-brown/5 rounded-xl text-xs font-bold outline-none" />
                <span className="text-brand-brown/20 font-black">—</span>
                <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="px-3 py-2 bg-brand-brown/5 rounded-xl text-xs font-bold outline-none" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* TABS */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {[
          { id: 'labarugi', name: 'Laba Rugi', icon: TrendingUp },
          { id: 'neraca', name: 'Neraca', icon: ShieldCheck },
          { id: 'aruskas', name: 'Arus Kas', icon: Wallet },
          { id: 'tutupbuku', name: 'Tutup Buku', icon: Lock }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-8 py-4 rounded-2xl flex items-center gap-3 transition-all whitespace-nowrap text-[10px] font-black uppercase tracking-[0.2em] border ${
              activeTab === tab.id 
                ? 'bg-brand-brown text-white border-brand-brown shadow-xl shadow-brand-brown/20 scale-105' 
                : 'bg-white text-brand-brown/40 border-brand-brown/5 hover:border-brand-brown/20'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.name}
          </button>
        ))}
      </div>

      {/* CONTENT: LABA RUGI */}
      {activeTab === 'labarugi' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-up">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-brand-brown/5">
              <h3 className="text-xl font-black text-brand-brown mb-8 flex items-center gap-3">
                <PieChart className="w-6 h-6 text-brand-gold" /> Rincian Laba Rugi
              </h3>
              
              <div className="space-y-6">
                <div className="flex justify-between items-center group">
                  <span className="text-sm font-bold text-brand-brown/60 uppercase tracking-widest">Pendapatan Penjualan</span>
                  <span className="text-lg font-black text-brand-brown">{formatRupiah(pnl.revenue)}</span>
                </div>
                <div className="flex justify-between items-center group pb-6 border-b border-brand-brown/5">
                  <span className="text-sm font-bold text-brand-brown/60 uppercase tracking-widest">Beban Pokok Penjualan (HPP)</span>
                  <span className="text-lg font-black text-rose-500">({formatRupiah(pnl.cogs)})</span>
                </div>
                
                <div className="flex justify-between items-center py-4 bg-brand-brown/[0.02] px-6 rounded-2xl">
                  <span className="text-sm font-black text-brand-brown uppercase tracking-widest">Laba Kotor (Gross Profit)</span>
                  <span className="text-xl font-black text-brand-gold">{formatRupiah(pnl.grossProfit)}</span>
                </div>

                <div className="flex justify-between items-center group pt-4">
                  <span className="text-sm font-bold text-brand-brown/60 uppercase tracking-widest">Beban Operasional</span>
                  <span className="text-lg font-black text-rose-500">({formatRupiah(pnl.opex)})</span>
                </div>
                <div className="flex justify-between items-center group pb-6 border-b border-brand-brown/5">
                  <span className="text-sm font-bold text-brand-brown/60 uppercase tracking-widest">Pendapatan Lain-lain</span>
                  <span className="text-lg font-black text-emerald-600">{formatRupiah(pnl.otherIncome)}</span>
                </div>

                <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 md:p-8 rounded-3xl ${pnl.netProfit >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'} shadow-2xl gap-4`}>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Laba Bersih (Net Profit)</span>
                    <h4 className="text-3xl font-black tracking-tighter mt-1">{formatRupiah(pnl.netProfit)}</h4>
                  </div>
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-8 h-8" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-brand-brown rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-5"><TrendingUp className="w-32 h-32" /></div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold mb-4">Margin Laba</h4>
              <div className="text-4xl font-black mb-2">{pnl.revenue > 0 ? ((pnl.netProfit / pnl.revenue) * 100).toFixed(1) : 0}%</div>
              <p className="text-xs text-white/40 font-medium">Profitabilitas dari total pendapatan penjualan periode ini.</p>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT: NERACA */}
      {activeTab === 'neraca' && (
        <div className="grid lg:grid-cols-2 gap-8 animate-fade-up">
          <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-brand-brown/5">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-black text-brand-brown flex items-center gap-3">
                <Wallet className="w-6 h-6 text-brand-gold" /> Aktiva (Assets)
              </h3>
              <span className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest">Kekayaan Usaha</span>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-brand-brown/60 uppercase tracking-widest">Kas & Bank</span>
                <span className="text-lg font-black text-brand-brown">{formatRupiah(neraca.cashBank)}</span>
              </div>
              <div className="flex justify-between items-center pb-6 border-b border-brand-brown/5">
                <span className="text-sm font-bold text-brand-brown/60 uppercase tracking-widest">Persediaan Barang</span>
                <span className="text-lg font-black text-brand-brown">{formatRupiah(neraca.inventoryValue)}</span>
              </div>
              <div className="flex justify-between items-center pt-4 bg-brand-brown/5 p-6 rounded-2xl">
                <span className="text-sm font-black text-brand-brown uppercase tracking-widest">Total Aktiva</span>
                <span className="text-2xl font-black text-brand-brown">{formatRupiah(neraca.totalAssets)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-brand-brown/5">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-black text-brand-brown flex items-center gap-3">
                <Briefcase className="w-6 h-6 text-brand-gold" /> Pasiva (Equity)
              </h3>
              <span className="px-4 py-2 bg-brand-gold/10 text-brand-gold rounded-xl text-[10px] font-black uppercase tracking-widest">Modal & Cadangan</span>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-brand-brown/60 uppercase tracking-widest">Modal Disetor (Investor)</span>
                <span className="text-lg font-black text-brand-brown">{formatRupiah(neraca.totalCapital)}</span>
              </div>
              <div className="flex justify-between items-center pb-6 border-b border-brand-brown/5">
                <span className="text-sm font-bold text-brand-brown/60 uppercase tracking-widest">Laba Ditahan (Kumulatif)</span>
                <span className={`text-lg font-black ${neraca.retainedEarnings >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatRupiah(neraca.retainedEarnings)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 bg-brand-brown text-white p-6 rounded-2xl shadow-xl">
                <span className="text-sm font-black uppercase tracking-widest opacity-60">Total Pasiva</span>
                <span className="text-2xl font-black">{formatRupiah(neraca.totalEquity)}</span>
              </div>
            </div>
            <p className="mt-8 text-[10px] text-brand-brown/30 font-bold uppercase tracking-widest text-center italic">
              Balance: {Math.abs(neraca.totalAssets - neraca.totalEquity) < 100 ? 'Balanced ✓' : 'Unbalanced ⚠'}
            </p>
          </div>
        </div>
      )}

      {/* CONTENT: ARUS KAS */}
      {activeTab === 'aruskas' && (
        <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-brand-brown/5 animate-fade-up">
          <div className="flex items-center justify-between mb-12">
            <h3 className="text-xl font-black text-brand-brown flex items-center gap-3">
              <Wallet className="w-6 h-6 text-brand-gold" /> Laporan Arus Kas
            </h3>
            <div className="text-[10px] font-black text-brand-brown/40 uppercase tracking-widest">Metode Langsung</div>
          </div>

          <div className="space-y-12 max-w-3xl">
            <div>
              <h4 className="text-xs font-black text-brand-gold uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Aktivitas Operasional
              </h4>
              <div className="space-y-4 px-6 border-l-2 border-brand-brown/5">
                <div className="flex justify-between items-center"><span className="text-sm font-bold text-brand-brown/60">Penerimaan dari Pelanggan</span><span className="text-sm font-black text-emerald-600">+{formatRupiah(filteredSales.reduce((sum,s)=>sum+Number(s.total_penjualan),0))}</span></div>
                <div className="flex justify-between items-center"><span className="text-sm font-bold text-brand-brown/60">Pembayaran Beban & Stok</span><span className="text-sm font-black text-rose-500">-({formatRupiah(filteredExpenses.reduce((sum,e)=>sum+Number(e.jumlah),0) + filteredPurchases.reduce((sum,p)=>sum+Number(p.harga_beli_total),0))})</span></div>
                <div className="flex justify-between items-center pt-2 font-black text-brand-brown"><span className="text-sm uppercase tracking-widest">Arus Kas Operasional</span><span className="text-md underline underline-offset-4">{formatRupiah(cashflow.operational)}</span></div>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-black text-brand-gold uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Aktivitas Pendanaan
              </h4>
              <div className="space-y-4 px-6 border-l-2 border-brand-brown/5">
                <div className="flex justify-between items-center"><span className="text-sm font-bold text-brand-brown/60">Setoran Modal Investor</span><span className="text-sm font-black text-emerald-600">+{formatRupiah(cashflow.financing)}</span></div>
                <div className="flex justify-between items-center pt-2 font-black text-brand-brown"><span className="text-sm uppercase tracking-widest">Arus Kas Pendanaan</span><span className="text-md underline underline-offset-4">{formatRupiah(cashflow.financing)}</span></div>
              </div>
            </div>
            <div className="pt-10 border-t-4 border-double border-brand-brown/10">
              <div className="flex justify-between items-center p-8 bg-brand-brown rounded-3xl text-white shadow-2xl">
                <div><span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Kenaikan/Penurunan Kas Neto</span><h4 className="text-4xl font-black tracking-tighter mt-1">{formatRupiah(cashflow.net)}</h4></div>
                <Wallet className="w-12 h-12 text-brand-gold opacity-40" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT: TUTUP BUKU */}
      {activeTab === 'tutupbuku' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-up">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-brand-brown/5">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-black text-brand-brown flex items-center gap-3">
                  <Lock className="w-6 h-6 text-brand-gold" /> Proses Tutup Buku
                </h3>
                <input 
                  type="month" 
                  value={selectedClosingMonth}
                  onChange={(e) => setSelectedClosingMonth(e.target.value)}
                  className="px-4 py-2 bg-brand-brown/5 rounded-xl text-xs font-black uppercase tracking-widest text-brand-brown outline-none"
                />
              </div>

              {closingData.isAlreadyClosed ? (
                <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-3xl flex items-center gap-6 mb-10">
                  <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-emerald-900">Bulan Ini Sudah Ditutup</h4>
                    <p className="text-sm text-emerald-700/60 mt-1">Bagi hasil untuk investor telah didistribusikan ke dalam catatan pengeluaran.</p>
                  </div>
                </div>
              ) : closingData.netProfit <= 0 ? (
                <div className="bg-rose-50 border border-rose-100 p-8 rounded-3xl flex items-center gap-6 mb-10">
                  <div className="w-16 h-16 bg-rose-500 text-white rounded-2xl flex items-center justify-center shrink-0">
                    <AlertCircle className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-rose-900">Tidak Ada Laba Tersedia</h4>
                    <p className="text-sm text-rose-700/60 mt-1">Hanya bulan dengan laba positif yang dapat melakukan proses tutup buku dan bagi hasil.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-brand-brown/5 p-8 rounded-3xl mb-10">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-black text-brand-brown/40 uppercase tracking-widest">Laba Bersih Tersedia ({selectedClosingMonth})</span>
                    <span className="text-2xl font-black text-brand-brown">{formatRupiah(closingData.netProfit)}</span>
                  </div>
                  <p className="text-[10px] text-brand-brown/30 font-bold uppercase tracking-widest italic">Profit ini akan dibagikan kepada seluruh investor sesuai porsi saham mereka.</p>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-xs font-black text-brand-brown/40 uppercase tracking-widest mb-4">Daftar Penerima Bagi Hasil</h4>
                <div className="divide-y divide-brand-brown/5 bg-brand-brown/[0.02] rounded-3xl overflow-hidden border border-brand-brown/5">
                  {investors.map(inv => (
                    <div key={inv.id} className="p-6 flex justify-between items-center group hover:bg-white transition-colors">
                      <div>
                        <p className="font-black text-brand-brown">{inv.nama}</p>
                        <p className="text-[10px] font-bold text-brand-brown/30 uppercase tracking-widest mt-1">Porsi Saham: {inv.persentase}%</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-brand-gold text-lg">
                          {formatRupiah(closingData.netProfit > 0 ? (closingData.netProfit * (Number(inv.persentase) / 100)) : 0)}
                        </p>
                        <p className="text-[10px] font-bold text-brand-brown/20 uppercase">Estimasi Transfer</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {!closingData.isAlreadyClosed && closingData.netProfit > 0 && (
                <button 
                  onClick={handleTutupBuku}
                  disabled={processing}
                  className="w-full mt-12 py-6 bg-brand-brown text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-brand-gold hover:text-brand-brown transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                >
                  {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                  Proses Tutup Buku & Bagi Hasil
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-brand-gold rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-4">Informasi</h4>
              <p className="text-sm font-bold leading-relaxed mb-6">Proses Tutup Buku berfungsi untuk mencatat pembagian keuntungan bulanan sebagai pengeluaran resmi bisnis.</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-[10px] font-black uppercase tracking-widest"><ShieldCheck className="w-4 h-4 shrink-0" /> Otomatis Tercatat di Keuangan</li>
                <li className="flex items-start gap-3 text-[10px] font-black uppercase tracking-widest"><ShieldCheck className="w-4 h-4 shrink-0" /> Saldo Kas Akan Berkurang</li>
                <li className="flex items-start gap-3 text-[10px] font-black uppercase tracking-widest"><ShieldCheck className="w-4 h-4 shrink-0" /> Mencegah Distribusi Ganda</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
