import React, { useState, useMemo } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { formatRupiah } from '../../utils/format';
import { FileText, Calendar, Download } from 'lucide-react';

export default function AdminReports() {
  const [sales] = useLocalStorage('kabungmart_sales', []);
  const [expenses] = useLocalStorage('kabungmart_expenses', []);
  const [purchases] = useLocalStorage('kabungmart_purchases', []);
  const [incomes] = useLocalStorage('kabungmart_incomes', []);
  
  const [filterPeriod, setFilterPeriod] = useState('Bulan ini');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const { filteredSales, filteredExpenses, filteredPurchases, filteredIncomes } = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Helper to get start of week (Sunday)
    const getStartOfWeek = (d) => {
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() - day;
      return new Date(date.setDate(diff)).toISOString().split('T')[0];
    };

    const startOfWeekStr = getStartOfWeek(today);
    const startOfMonthStr = today.toISOString().substring(0, 7) + '-01';

    return {
      filteredSales: sales.filter(s => {
        if (s.statusPembayaran !== 'Sudah bayar') return false;
        
        if (filterPeriod === 'Hari ini') return s.tanggal === todayStr;
        if (filterPeriod === 'Minggu ini') return s.tanggal >= startOfWeekStr && s.tanggal <= todayStr;
        if (filterPeriod === 'Bulan ini') return s.tanggal >= startOfMonthStr && s.tanggal <= todayStr;
        if (filterPeriod === 'Custom' && customStartDate && customEndDate) {
          return s.tanggal >= customStartDate && s.tanggal <= customEndDate;
        }
        return true; // Semua Waktu
      }),
      filteredExpenses: expenses.filter(e => {
        if (filterPeriod === 'Hari ini') return e.tanggal === todayStr;
        if (filterPeriod === 'Minggu ini') return e.tanggal >= startOfWeekStr && e.tanggal <= todayStr;
        if (filterPeriod === 'Bulan ini') return e.tanggal >= startOfMonthStr && e.tanggal <= todayStr;
        if (filterPeriod === 'Custom' && customStartDate && customEndDate) {
          return e.tanggal >= customStartDate && e.tanggal <= customEndDate;
        }
        return true;
      }),
      filteredPurchases: purchases.filter(p => {
        if (filterPeriod === 'Hari ini') return p.tanggal === todayStr;
        if (filterPeriod === 'Minggu ini') return p.tanggal >= startOfWeekStr && p.tanggal <= todayStr;
        if (filterPeriod === 'Bulan ini') return p.tanggal >= startOfMonthStr && p.tanggal <= todayStr;
        if (filterPeriod === 'Custom' && customStartDate && customEndDate) {
          return p.tanggal >= customStartDate && p.tanggal <= customEndDate;
        }
        return true;
      }),
      filteredIncomes: incomes.filter(i => {
        if (filterPeriod === 'Hari ini') return i.tanggal === todayStr;
        if (filterPeriod === 'Minggu ini') return i.tanggal >= startOfWeekStr && i.tanggal <= todayStr;
        if (filterPeriod === 'Bulan ini') return i.tanggal >= startOfMonthStr && i.tanggal <= todayStr;
        if (filterPeriod === 'Custom' && customStartDate && customEndDate) {
          return i.tanggal >= customStartDate && i.tanggal <= customEndDate;
        }
        return true;
      })
    };
  }, [sales, expenses, purchases, incomes, filterPeriod, customStartDate, customEndDate]);

  const { totalPemasukan, totalPengeluaran, labaBersih, txCount, expenseCount } = useMemo(() => {
    const totalPemasukanSales = filteredSales.reduce((sum, s) => sum + s.totalPenjualan, 0);
    const totalPemasukanManual = filteredIncomes.reduce((sum, i) => sum + i.jumlah, 0);
    const totalPemasukan = totalPemasukanSales + totalPemasukanManual;

    const totalPengeluaranExp = filteredExpenses.reduce((sum, e) => sum + e.jumlah, 0);
    const totalPengeluaranPur = filteredPurchases.reduce((sum, p) => sum + p.hargaBeliTotal, 0);
    const totalPengeluaran = totalPengeluaranExp + totalPengeluaranPur;

    return {
      totalPemasukan,
      totalPengeluaran,
      labaBersih: totalPemasukan - totalPengeluaran,
      txCount: filteredSales.length,
      expenseCount: filteredExpenses.length + filteredPurchases.length
    };
  }, [filteredSales, filteredExpenses, filteredPurchases]);

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-2xl font-bold text-brand-brown">Laporan Laba Rugi</h1>
        <div className="flex flex-wrap gap-3 bg-white p-2 rounded-xl shadow-sm border border-brand-brown/10">
          <select 
            value={filterPeriod} 
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="px-3 py-2 bg-brand-brown/5 border-none rounded-lg focus:ring-0 text-brand-brown font-medium outline-none"
          >
            <option value="Hari ini">Hari ini</option>
            <option value="Minggu ini">Minggu ini</option>
            <option value="Bulan ini">Bulan ini</option>
            <option value="Semua">Semua Waktu</option>
            <option value="Custom">Custom Tanggal</option>
          </select>
          
          {filterPeriod === 'Custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="px-2 py-1 border rounded" />
              <span>-</span>
              <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="px-2 py-1 border rounded" />
            </div>
          )}
        </div>
      </div>

      {filteredSales.length === 0 && filteredExpenses.length === 0 && filteredPurchases.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-brand-brown/10 text-center shadow-sm">
          <FileText className="w-16 h-16 text-brand-brown/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-brand-brown mb-2">Belum Ada Data</h3>
          <p className="text-brand-brown/50">Tidak ada transaksi penjualan atau pengeluaran pada periode ini.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border-2 text-center ${
            labaBersih > 0 ? 'bg-emerald-50 border-emerald-200' : 
            labaBersih < 0 ? 'bg-rose-50 border-rose-200' : 'bg-gray-50 border-gray-200'
          }`}>
            <h2 className="text-lg font-bold mb-2">Status Kas Usaha</h2>
            <p className="text-2xl font-bold">
              {labaBersih > 0 
                ? <span className="text-emerald-700">Kas Positif sebesar {formatRupiah(labaBersih)}</span>
                : labaBersih < 0 
                ? <span className="text-rose-700">Kas Defisit (Minus) sebesar {formatRupiah(Math.abs(labaBersih))}</span>
                : <span className="text-gray-700">Saldo Kas Nol</span>
              }
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-brand-brown/10 shadow-sm">
              <p className="text-brand-brown/50 font-medium mb-1">Total Pemasukan (Termasuk Modal)</p>
              <h3 className="text-3xl font-bold text-emerald-600">{formatRupiah(totalPemasukan)}</h3>
              <p className="text-sm text-brand-brown/30 mt-2">Dari Penjualan & Pemasukan Lainnya</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-brand-brown/10 shadow-sm">
              <p className="text-brand-brown/50 font-medium mb-1">Total Pengeluaran</p>
              <h3 className="text-3xl font-bold text-rose-600">{formatRupiah(totalPengeluaran)}</h3>
              <p className="text-sm text-brand-brown/30 mt-2">Dari {expenseCount} catatan pengeluaran & pembelian stok</p>
            </div>
            <div className="bg-brand-brown p-6 rounded-2xl border border-white/5 shadow-sm text-white">
              <p className="text-white/40 font-medium mb-1">Saldo Kas / Bersih</p>
              <h3 className={`text-3xl font-bold ${labaBersih >= 0 ? 'text-brand-gold' : 'text-rose-400'}`}>
                {formatRupiah(labaBersih)}
              </h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
