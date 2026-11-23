const POCKET_CATEGORIES = ['Alokasi Investasi', 'Alokasi Sedekah', "Ka'bah"];
const DIVIDEND_CATEGORY = 'Bagi Hasil Investor';
const ALLOCATION_CATEGORIES = [...POCKET_CATEGORIES, DIVIDEND_CATEGORY];
const CAPITAL_CATEGORIES = ['Modal Awal', 'Pendanaan'];

const sumBy = (list, getValue) => list.reduce((sum, item) => sum + Number(getValue(item) || 0), 0);
const roundTo1000 = (num) => Math.round(num / 1000) * 1000;
const purchaseGoodsCost = (purchase) => Number(purchase.harga_beli_total || 0) - Number(purchase.bagian_sedekah || 0);

export const isPaidSale = (sale) => sale.status_pembayaran === 'Sudah bayar';
export const isAllocationExpense = (expense) => ALLOCATION_CATEGORIES.includes(expense.kategori);
export const isDividendExpense = (expense) => expense.kategori === DIVIDEND_CATEGORY;
export const isCapitalIncome = (income) => CAPITAL_CATEGORIES.includes(income.kategori);
export const isOtherIncome = (income) => !isCapitalIncome(income) && !POCKET_CATEGORIES.includes(income.kategori);

export function calcAccountBalances(accounts, { sales, incomes, purchases, expenses, mutations }) {
  const balances = {};
  accounts.forEach(acc => { balances[acc.id] = Number(acc.saldo_awal) || 0; });
  const add = (id, amount) => {
    if (id && balances[id] !== undefined) balances[id] += Number(amount) || 0;
  };

  sales.filter(isPaidSale).forEach(s => add(s.rekening_id, s.total_penjualan));
  incomes.forEach(i => add(i.rekening_id, i.jumlah));
  purchases.forEach(p => add(p.rekening_id, -p.harga_beli_total));
  expenses.forEach(e => add(e.rekening_id, -e.jumlah));
  mutations.forEach(m => {
    add(m.dari_rekening_id, -m.jumlah);
    add(m.ke_rekening_id, m.jumlah);
  });
  return balances;
}

export function calcProfit({ sales, expenses, incomes, products }) {
  const paidSales = sales.filter(isPaidSale);
  const costById = new Map(products.map(p => [p.id, Number(p.harga_modal) || 0]));
  const revenue = sumBy(paidSales, s => s.total_penjualan);
  const cogs = paidSales.reduce((sum, s) => {
    const unitCost = s.hpp_satuan != null ? Number(s.hpp_satuan) : (costById.get(s.produk_id) || 0);
    return sum + unitCost * Number(s.jumlah);
  }, 0);
  const opex = sumBy(expenses.filter(e => !isAllocationExpense(e)), e => e.jumlah);
  const otherIncome = sumBy(incomes.filter(isOtherIncome), i => i.jumlah);
  const grossProfit = revenue - cogs;
  return { revenue, cogs, grossProfit, opex, otherIncome, netProfit: grossProfit - opex + otherIncome };
}

export function calcClosing({ month, mode, sales, expenses, incomes, products, investors }) {
  const inMonth = (item) => item.tanggal?.startsWith(month);
  const mNetProfit = calcProfit({
    sales: sales.filter(inMonth),
    expenses: expenses.filter(inMonth),
    incomes: incomes.filter(inMonth),
    products
  }).netProfit;
  const cumulativeNetProfit = calcProfit({ sales, expenses, incomes, products }).netProfit;
  const allocatedProfit = sumBy(expenses.filter(isAllocationExpense), e => e.jumlah);
  const unallocatedProfit = cumulativeNetProfit - allocatedProfit;

  const monthAllocations = expenses.filter(e => inMonth(e) && isAllocationExpense(e));
  if (monthAllocations.length > 0) {
    const total = (kategori) => sumBy(monthAllocations.filter(e => e.kategori === kategori), e => e.jumlah);
    return {
      mNetProfit, cumulativeNetProfit, unallocatedProfit,
      isAlreadyClosed: true,
      blockReason: 'Bulan ini sudah pernah ditutup buku.',
      finalProfit: sumBy(monthAllocations, e => e.jumlah),
      alokasiInvestasi: total('Alokasi Investasi'),
      alokasiSedekah: total('Alokasi Sedekah'),
      alokasiSelfDev: total("Ka'bah"),
      alokasiDividen: total(DIVIDEND_CATEGORY),
      roundedInvestorDividends: monthAllocations.filter(isDividendExpense).map(e => {
        const nama = e.nama_pengeluaran.replace(/^Bagi Hasil [^:]+:\s*/, '');
        return { id: e.id, nama, persentase: investors.find(i => i.nama === nama)?.persentase ?? '-', jumlah: Number(e.jumlah) };
      })
    };
  }

  const finalProfit = mode === 'kumulatif' ? unallocatedProfit : Math.min(mNetProfit, unallocatedProfit);
  const alokasiSedekah = roundTo1000(finalProfit * 0.10);
  const alokasiSelfDev = roundTo1000(finalProfit * 0.10);
  const alokasiDividen = roundTo1000(finalProfit * 0.40);
  const alokasiInvestasi = finalProfit - alokasiSedekah - alokasiSelfDev - alokasiDividen;

  let allocatedDividends = 0;
  const roundedInvestorDividends = investors.map((inv, index) => {
    const jumlah = index === investors.length - 1
      ? alokasiDividen - allocatedDividends
      : roundTo1000(alokasiDividen * (Number(inv.persentase) / 100));
    allocatedDividends += jumlah;
    return { id: inv.id, nama: inv.nama, persentase: inv.persentase, jumlah };
  });

  const totalPercent = sumBy(investors, i => i.persentase);
  let blockReason = '';
  if (finalProfit <= 0) blockReason = 'Tidak ada laba yang bisa dibagi.';
  else if (investors.length === 0) blockReason = 'Tambahkan data investor sebelum tutup buku.';
  else if (Math.abs(totalPercent - 100) > 0.01) blockReason = `Total saham investor harus 100%, sekarang ${totalPercent}%.`;

  return {
    mNetProfit, cumulativeNetProfit, unallocatedProfit,
    isAlreadyClosed: false, blockReason, finalProfit,
    alokasiInvestasi, alokasiSedekah, alokasiSelfDev, alokasiDividen,
    roundedInvestorDividends
  };
}

export function calcBalanceSheet({ accounts, products, sales, incomes, purchases, expenses, mutations }) {
  const balances = calcAccountBalances(accounts, { sales, incomes, purchases, expenses, mutations });
  const cashBank = Object.values(balances).reduce((sum, value) => sum + value, 0);
  const inventoryValue = products.reduce((sum, p) => sum + Number(p.stok) * Number(p.harga_modal), 0);
  const profit = calcProfit({ sales, expenses, incomes, products });
  const goodsInTransit = Math.max(0, sumBy(purchases, purchaseGoodsCost) - profit.cogs - inventoryValue);
  const totalCapital = sumBy(accounts, a => a.saldo_awal) + sumBy(incomes.filter(isCapitalIncome), i => i.jumlah);
  const retainedEarnings = profit.netProfit
    - sumBy(expenses.filter(isDividendExpense), e => e.jumlah)
    - sumBy(purchases, p => p.bagian_sedekah);
  return {
    cashBank, inventoryValue, goodsInTransit,
    totalAssets: cashBank + inventoryValue + goodsInTransit,
    totalCapital, retainedEarnings,
    totalEquity: totalCapital + retainedEarnings
  };
}

function calcCashMovement({ sales, incomes, expenses, purchases }) {
  const opIn = sumBy(sales.filter(isPaidSale), s => s.total_penjualan) + sumBy(incomes.filter(isOtherIncome), i => i.jumlah);
  const opOut = sumBy(expenses.filter(e => !isAllocationExpense(e)), e => e.jumlah) + sumBy(purchases, purchaseGoodsCost);
  const financing = sumBy(incomes.filter(isCapitalIncome), i => i.jumlah)
    - sumBy(expenses.filter(isDividendExpense), e => e.jumlah)
    - sumBy(purchases, p => p.bagian_sedekah);
  return { opIn, opOut, operational: opIn - opOut, financing, netChange: opIn - opOut + financing };
}

export function calcCashflow({ sales, incomes, expenses, purchases, accounts, before }) {
  return {
    ...calcCashMovement({ sales, incomes, expenses, purchases }),
    beginningBalance: sumBy(accounts, a => a.saldo_awal) + calcCashMovement(before).netChange
  };
}
