import React, { useMemo } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { formatRupiah } from '../../utils/format';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, AlertTriangle, Package } from 'lucide-react';

export default function AdminDashboard() {
  const [sales] = useLocalStorage('kabungmart_sales', []);
  const [expenses] = useLocalStorage('kabungmart_expenses', []);
  const [purchases] = useLocalStorage('kabungmart_purchases', []);
  const [incomes] = useLocalStorage('kabungmart_incomes', []);
  const [products] = useLocalStorage('kabungmart_products', []);

  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.substring(0, 7); // YYYY-MM

  const {
    salesToday,
    salesThisMonth,
    expensesThisMonth,
    txCountThisMonth,
    profitLoss
  } = useMemo(() => {
    let sToday = 0;
    let sMonth = 0;
    let eMonth = 0;
    let txCount = 0;

    sales.forEach(sale => {
      if (sale.statusPembayaran === 'Sudah bayar') {
        if (sale.tanggal === today) sToday += sale.totalPenjualan;
        if (sale.tanggal.startsWith(thisMonth)) {
          sMonth += sale.totalPenjualan;
          txCount++;
        }
      }
    });

    expenses.forEach(exp => {
      if (exp.tanggal.startsWith(thisMonth)) {
        eMonth += exp.jumlah;
      }
    });

    purchases.forEach(p => {
      if (p.tanggal.startsWith(thisMonth)) {
        eMonth += p.hargaBeliTotal;
      }
    });

    incomes.forEach(i => {
      if (i.tanggal === today) sToday += i.jumlah;
      if (i.tanggal.startsWith(thisMonth)) {
        sMonth += i.jumlah;
      }
    });

    return {
      salesToday: sToday,
      salesThisMonth: sMonth,
      expensesThisMonth: eMonth,
      txCountThisMonth: txCount,
      profitLoss: sMonth - eMonth
    };
  }, [sales, expenses, purchases, incomes, today, thisMonth]);

  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stok <= 5);
  }, [products]);

  const isProfit = profitLoss >= 0;

  return (
    <div className="space-y-10 pb-12">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Pemasukan Hari Ini', value: formatRupiah(salesToday), icon: DollarSign, color: 'emerald', trend: '+12.5%' },
          { label: 'Pemasukan Bulan Ini', value: formatRupiah(salesThisMonth), icon: TrendingUp, color: 'brand-gold', trend: '+8.2%' },
          { label: 'Pengeluaran Bulan Ini', value: formatRupiah(expensesThisMonth), icon: TrendingDown, color: 'rose', trend: '-2.4%' },
          { label: 'Transaksi Bulan Ini', value: txCountThisMonth, icon: ShoppingBag, color: 'indigo', trend: '+5' },
        ].map((stat, i) => {
          const colorMap = {
            emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100',
            'brand-gold': 'bg-brand-gold/10 text-brand-gold border-brand-gold/20 shadow-brand-gold/10',
            rose: 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-100',
            indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-indigo-100',
          };
          const colorClass = colorMap[stat.color] || colorMap.emerald;
          
          return (
            <div key={i} className="bg-white rounded-3xl p-8 shadow-sm border border-black/5 group hover:border-brand-gold/30 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl group-hover:scale-110 transition-all duration-500 shadow-sm ${colorClass.split(' ').filter(c => !c.startsWith('border')).join(' ')}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${colorClass.split(' ').filter(c => !c.startsWith('shadow')).join(' ')}`}>
                  {stat.trend}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-brand-brown/30 uppercase tracking-widest mb-1">{stat.label}</p>
                <h3 className="text-2xl font-black text-brand-brown tracking-tight">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Laba Rugi Card */}
        <div className="lg:col-span-8 relative overflow-hidden rounded-[2.5rem] bg-brand-brown text-white shadow-2xl min-h-[400px] flex flex-col border border-brand-gold/10">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-gold/10 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative z-10 p-12 flex flex-col h-full">
            <div className="flex items-center justify-between mb-16">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-brand-gold/10 rounded-2xl border border-brand-gold/20">
                  <TrendingUp className="w-8 h-8 text-brand-gold" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white">Ikhtisar Keuangan</h2>
                  <p className="text-sm text-brand-gold font-bold italic tracking-wider">Performa Bulan Ini</p>
                </div>
              </div>
              <div className="px-5 py-2.5 bg-brand-gold/10 rounded-xl border border-brand-gold/20 text-[10px] font-black tracking-[0.3em] uppercase text-brand-gold">
                {thisMonth}
              </div>
            </div>
            
            <div className="flex-grow flex flex-col justify-center">
              <p className="text-[10px] font-black text-brand-gold uppercase tracking-[0.5em] mb-6">Total Net Profit</p>
              <h3 className="text-6xl md:text-8xl font-black tracking-tighter text-white">
                {formatRupiah(profitLoss)}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-12 mt-16 pt-12 border-t border-white/5">
              <div className="group">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Gross Income</p>
                </div>
                <p className="text-3xl font-black text-white">{formatRupiah(salesThisMonth)}</p>
              </div>
              <div className="group">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Total Expenses</p>
                </div>
                <p className="text-3xl font-black text-white">{formatRupiah(expensesThisMonth)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="lg:col-span-4 bg-white/70 rounded-3xl p-8 flex flex-col shadow-xl border border-brand-brown/5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-brand-brown tracking-tight flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-brand-gold" />
                Stok Menipis
              </h2>
              <p className="text-xs text-brand-brown/40 font-medium mt-1">Segera lakukan pengadaan stok</p>
            </div>
            <div className="w-10 h-10 bg-brand-gold/10 rounded-xl flex items-center justify-center">
              <span className="text-sm font-black text-brand-gold">{lowStockProducts.length}</span>
            </div>
          </div>

          <div className="flex-grow space-y-4 overflow-y-auto max-h-[450px] pr-2 no-scrollbar">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map(p => (
                <div key={p.id} className="group p-5 bg-white border border-brand-brown/5 rounded-2xl hover:border-brand-gold/30 hover:shadow-lg transition-all duration-500">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-brand-brown/5 rounded-2xl flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-500">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.namaProduk} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-7 h-7 text-brand-brown/10" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-brand-brown truncate group-hover:text-brand-gold transition-colors">{p.namaProduk}</p>
                      <p className="text-[10px] text-brand-brown/40 font-bold uppercase tracking-widest">{p.ukuran}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-black ${p.stok === 0 ? 'text-rose-500' : 'text-brand-gold'}`}>
                        {p.stok}
                      </p>
                      <p className="text-[10px] font-bold text-brand-brown/20 uppercase">{p.satuan}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 bg-brand-gold/5 text-brand-gold rounded-full flex items-center justify-center mb-6">
                  <Package className="w-12 h-12" />
                </div>
                <h4 className="text-brand-brown font-black uppercase tracking-widest mb-2">Semua Aman</h4>
                <p className="text-xs text-brand-brown/40 font-medium">Stok produk Anda terkendali.</p>
              </div>
            )}
          </div>
          
          <button className="mt-8 w-full py-4 bg-brand-brown text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-brand-gold transition-all shadow-lg shadow-brand-brown/10">
            Manajemen Produk
          </button>
        </div>
      </div>
    </div>
  );
}
