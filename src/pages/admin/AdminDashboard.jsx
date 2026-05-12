import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { formatRupiah } from '../../utils/format';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  AlertTriangle, 
  Package, 
  Loader2, 
  CreditCard,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownRight,
  Wallet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [products, setProducts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [mutations, setMutations] = useState([]);
  const [receiving, setReceiving] = useState([]);
  const [loading, setLoading] = useState(true);

  // Safe Date Handling
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const thisMonth = today.substring(0, 7);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        console.log('AdminDashboard: Initializing data fetch...');

        // Fetching with individual error handling to prevent total crash
        const fetchTable = async (tableName) => {
          try {
            const { data, error } = await supabase.from(tableName).select('*');
            if (error) {
              console.warn(`AdminDashboard: Error fetching ${tableName}:`, error.message);
              return [];
            }
            return data || [];
          } catch (e) {
            console.warn(`AdminDashboard: Exception fetching ${tableName}:`, e.message);
            return [];
          }
        };

        const [s, e, p, i, prod, acc, mut, rec] = await Promise.all([
          fetchTable('kabung_sales'),
          fetchTable('kabung_expenses'),
          fetchTable('kabung_purchases'),
          fetchTable('kabung_incomes'),
          fetchTable('kabung_products'),
          fetchTable('kabung_accounts'),
          fetchTable('kabung_mutations'),
          fetchTable('kabung_receiving')
        ]);

        if (isMounted) {
          setSales(s);
          setExpenses(e);
          setPurchases(p);
          setIncomes(i);
          setProducts(prod);
          setAccounts(acc);
          setMutations(mut);
          setReceiving(rec);
          console.log('AdminDashboard: All data loaded successfully');
        }
      } catch (err) {
        console.error('AdminDashboard: Critical data fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => { isMounted = false; };
  }, []);

  // Safe Calculations
  const stats = useMemo(() => {
    let sToday = 0;
    let sMonth = 0;
    let eMonth = 0;
    let txCount = 0;
    let pcsIn = 0;
    let pcsOut = 0;

    (sales || []).forEach(sale => {
      if (sale && sale.status_pembayaran === 'Sudah bayar') {
        const val = Number(sale.total_penjualan || 0);
        if (sale.tanggal === today) sToday += val;
        if (sale.tanggal && sale.tanggal.startsWith(thisMonth)) {
          sMonth += val;
          txCount++;
          pcsOut += Number(sale.jumlah_produk || 0);
        }
      }
    });

    (expenses || []).forEach(exp => {
      if (exp && exp.tanggal && exp.tanggal.startsWith(thisMonth)) {
        eMonth += Number(exp.jumlah || 0);
      }
    });

    (purchases || []).forEach(p => {
      if (p && p.tanggal && p.tanggal.startsWith(thisMonth)) {
        eMonth += Number(p.harga_beli_total || 0);
      }
    });

    (incomes || []).forEach(i => {
      if (i) {
        const val = Number(i.jumlah || 0);
        if (i.tanggal === today) sToday += val;
        if (i.tanggal && i.tanggal.startsWith(thisMonth)) {
          sMonth += val;
        }
      }
    });

    (receiving || []).forEach(r => {
      if (r && r.tanggal_terima && r.tanggal_terima.startsWith(thisMonth)) {
        pcsIn += Number(r.jumlah_terima || 0);
      }
    });

    const totalBalance = (products || []).reduce((acc, p) => acc + Number(p.stok || 0), 0);

    return {
      salesToday: sToday,
      salesThisMonth: sMonth,
      expensesThisMonth: eMonth,
      txCountThisMonth: txCount,
      profitLoss: sMonth - eMonth,
      totalPcsIn: pcsIn,
      totalPcsOut: pcsOut,
      totalPcsBalance: totalBalance
    };
  }, [sales, expenses, purchases, incomes, receiving, products, today, thisMonth]);

  const accountBalances = useMemo(() => {
    const balances = {};
    (accounts || []).forEach(acc => {
      if (acc && acc.id) balances[acc.id] = Number(acc.saldo_awal || 0);
    });

    (sales || []).filter(s => s && s.status_pembayaran === 'Sudah bayar' && s.rekening_id).forEach(s => {
      if (balances[s.rekening_id] !== undefined) balances[s.rekening_id] += Number(s.total_penjualan || 0);
    });

    (incomes || []).filter(i => i && i.rekening_id).forEach(i => {
      if (balances[i.rekening_id] !== undefined) balances[i.rekening_id] += Number(i.jumlah || 0);
    });

    (purchases || []).filter(p => p && p.rekening_id).forEach(p => {
      if (balances[p.rekening_id] !== undefined) balances[p.rekening_id] -= Number(p.harga_beli_total || 0);
    });

    (expenses || []).filter(e => e && e.rekening_id).forEach(e => {
      if (balances[e.rekening_id] !== undefined) balances[e.rekening_id] -= Number(e.jumlah || 0);
    });

    (mutations || []).forEach(m => {
      if (m) {
        if (m.dari_rekening_id && balances[m.dari_rekening_id] !== undefined) balances[m.dari_rekening_id] -= Number(m.jumlah || 0);
        if (m.ke_rekening_id && balances[m.ke_rekening_id] !== undefined) balances[m.ke_rekening_id] += Number(m.jumlah || 0);
      }
    });

    return (accounts || []).map(acc => ({
      ...acc,
      currentBalance: balances[acc.id] || 0
    }));
  }, [accounts, sales, incomes, purchases, expenses, mutations]);

  const lowStockProducts = useMemo(() => {
    return (products || []).filter(p => p && Number(p.stok || 0) <= 5);
  }, [products]);

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-brand-brown">
        <Loader2 className="w-16 h-16 text-brand-gold animate-spin mb-4" />
        <p className="font-bold uppercase tracking-[0.2em]">Memuat Dashboard...</p>
      </div>
    );
  }

  try {
    return (
      <div className="space-y-6 pb-4">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: 'Pemasukan Hari Ini', value: formatRupiah(stats.salesToday), icon: DollarSign, color: 'emerald' },
            { label: 'Pemasukan Bulan Ini', value: formatRupiah(stats.salesThisMonth), icon: TrendingUp, color: 'brand-gold' },
            { label: 'Pengeluaran Bulan Ini', value: formatRupiah(stats.expensesThisMonth), icon: TrendingDown, color: 'rose' },
            { label: 'Transaksi Bulan Ini', value: stats.txCountThisMonth, icon: ShoppingBag, color: 'indigo' },
          ].map((stat, i) => {
            const colorMap = {
              emerald: 'bg-emerald-50 text-emerald-600',
              'brand-gold': 'bg-brand-gold/10 text-brand-gold',
              rose: 'bg-rose-50 text-rose-600',
              indigo: 'bg-indigo-50 text-indigo-600',
            };
            const colorClass = colorMap[stat.color] || colorMap.emerald;
            
            return (
              <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 group hover:border-brand-gold/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl group-hover:scale-110 transition-all duration-500 ${colorClass}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-brown/30 uppercase tracking-widest mb-1">{stat.label}</p>
                  <h3 className="text-2xl font-black text-brand-brown tracking-tight">{stat.value}</h3>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Laba Rugi Card */}
          <div className="lg:col-span-8 relative overflow-hidden rounded-[2.5rem] bg-brand-brown text-white shadow-2xl min-h-[320px] flex flex-col border border-brand-gold/10">
            <div className="relative z-10 p-8 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-gold/10 rounded-xl border border-brand-gold/20">
                    <TrendingUp className="w-6 h-6 text-brand-gold" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-white">Ikhtisar Keuangan</h2>
                    <p className="text-xs text-brand-gold font-bold italic tracking-wider">Performa Bulan Ini</p>
                  </div>
                </div>
                <div className="px-5 py-2.5 bg-brand-gold/10 rounded-xl border border-brand-gold/20 text-[10px] font-black tracking-[0.3em] uppercase text-brand-gold">
                  {thisMonth}
                </div>
              </div>
              
              <div className="flex-grow flex flex-col justify-center">
                <p className="text-[10px] font-black text-brand-gold uppercase tracking-[0.5em] mb-3">Total Net Profit</p>
                <h3 className="text-5xl md:text-6xl font-black tracking-tighter text-white">
                  {formatRupiah(stats.profitLoss)}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-8 mt-8 pt-8 border-t border-white/5">
                <div>
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">Gross Income</p>
                  <p className="text-2xl font-black text-white">{formatRupiah(stats.salesThisMonth)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">Total Expenses</p>
                  <p className="text-2xl font-black text-white">{formatRupiah(stats.expensesThisMonth)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Product Stock Movement */}
          <div className="lg:col-span-4 bg-white rounded-[2.5rem] p-8 shadow-xl border border-brand-brown/5 flex flex-col h-full">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-brand-gold/10 rounded-2xl">
                <Package className="w-6 h-6 text-brand-gold" />
              </div>
              <div>
                <h2 className="text-xl font-black text-brand-brown tracking-tight">Stok Gula Kabung</h2>
                <p className="text-[10px] text-brand-brown/40 font-bold uppercase tracking-widest italic">Pergerakan Pcs</p>
              </div>
            </div>

            <div className="flex-grow space-y-6">
              <div className="p-6 bg-brand-brown/[0.02] rounded-3xl border border-brand-brown/5 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-brand-brown/40 uppercase tracking-widest mb-1">Total Saldo Stok</p>
                  <h4 className="text-3xl font-black text-brand-brown">{stats.totalPcsBalance} <span className="text-sm font-bold text-brand-brown/30">pcs</span></h4>
                </div>
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-brand-brown/5">
                  <Package className="w-6 h-6 text-brand-brown/20" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-emerald-50 rounded-3xl border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2 text-emerald-600">
                    <ArrowDownRight className="w-4 h-4" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-center">Masuk</span>
                  </div>
                  <h4 className="text-2xl font-black text-emerald-700">{stats.totalPcsIn} <span className="text-[10px]">pcs</span></h4>
                </div>
                <div className="p-5 bg-rose-50 rounded-3xl border border-rose-100">
                  <div className="flex items-center gap-2 mb-2 text-rose-600">
                    <ArrowUpRight className="w-4 h-4" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-center">Keluar</span>
                  </div>
                  <h4 className="text-2xl font-black text-rose-700">{stats.totalPcsOut} <span className="text-[10px]">pcs</span></h4>
                </div>
              </div>
            </div>

            <button 
              onClick={() => navigate('/admin/receiving')}
              className="mt-8 w-full py-4 bg-brand-brown text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-brand-gold transition-all"
            >
              Logistik Barang
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Account Balances Grid */}
          <div className="lg:col-span-8 bg-white rounded-[2.5rem] p-8 shadow-xl border border-brand-brown/5">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-gold/10 rounded-2xl">
                  <CreditCard className="w-6 h-6 text-brand-gold" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-brand-brown tracking-tight">Saldo Akun</h2>
                  <p className="text-[10px] text-brand-brown/40 font-bold uppercase tracking-widest italic">Cash & Bank Balance</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/admin/mutations')}
                className="px-4 py-2 bg-brand-brown/5 hover:bg-brand-brown/10 text-brand-brown rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Mutasi Saldo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accountBalances.map(acc => (
                <div key={acc.id} className="p-6 bg-white border border-brand-brown/5 rounded-3xl hover:border-brand-gold/30 hover:shadow-lg transition-all duration-500 flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-brown/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                      <Wallet className="w-6 h-6 text-brand-brown/20" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-brand-brown/30 uppercase tracking-[0.2em] mb-1">{acc.nama_rekening}</p>
                      <h4 className="text-lg font-black text-brand-brown tracking-tight">{formatRupiah(acc.currentBalance)}</h4>
                    </div>
                  </div>
                  <div className="p-2 bg-brand-brown/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRightLeft className="w-4 h-4 text-brand-gold" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Warning */}
          <div className="lg:col-span-4 bg-white rounded-[2.5rem] p-8 flex flex-col shadow-xl border border-brand-brown/5">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-brand-brown tracking-tight flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-brand-gold" />
                  Stok Menipis
                </h2>
              </div>
              <div className="w-10 h-10 bg-brand-gold/10 rounded-xl flex items-center justify-center">
                <span className="text-sm font-black text-brand-gold">{lowStockProducts.length}</span>
              </div>
            </div>

            <div className="flex-grow space-y-4 overflow-y-auto max-h-[300px] pr-2 no-scrollbar">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map(p => (
                  <div key={p.id} className="p-5 bg-white border border-brand-brown/5 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-brand-brown truncate">{p.nama_produk}</p>
                        <p className="text-[10px] text-brand-brown/40 font-bold uppercase tracking-widest">{p.ukuran}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-black ${Number(p.stok || 0) === 0 ? 'text-rose-500' : 'text-brand-gold'}`}>
                          {p.stok}
                        </p>
                        <p className="text-[10px] font-bold text-brand-brown/20 uppercase">{p.satuan}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-brand-brown/30 py-10 font-bold uppercase tracking-widest">Semua Stok Aman</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (renderError) {
    console.error('AdminDashboard: Render Exception:', renderError);
    return <div className="p-10 text-center text-rose-500 font-bold">Terjadi kesalahan tampilan. Mohon lakukan Hard Refresh (Ctrl+F5).</div>;
  }
}
