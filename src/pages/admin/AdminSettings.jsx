import React, { useState, useMemo, useEffect } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { formatRupiah } from '../../utils/format';
import { Plus, Edit, Trash2, Users, CreditCard, Truck, Settings } from 'lucide-react';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('investor');

  const [investors, setInvestors] = useLocalStorage('kabungmart_investors', []);
  const [accounts, setAccounts] = useLocalStorage('kabungmart_accounts', [{ id: 'kas-tunai', namaRekening: 'Kas Tunai', saldoAwal: 0 }]);
  const [suppliers, setSuppliers] = useLocalStorage('kabungmart_suppliers', []);

  const [sales] = useLocalStorage('kabungmart_sales', []);
  const [purchases] = useLocalStorage('kabungmart_purchases', []);
  const [incomes, setIncomes] = useLocalStorage('kabungmart_incomes', []);
  const [expenses] = useLocalStorage('kabungmart_expenses', []);
  const [siteSettings, setSiteSettings] = useLocalStorage('kabungmart_settings', { heroImage: '', whatsapp: '6281234567890' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({});
  const [localSiteSettings, setLocalSiteSettings] = useState(siteSettings);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    setLocalSiteSettings(siteSettings);
  }, [siteSettings]);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setFormData(item);
    } else {
      setEditingId(null);
      if (activeTab === 'investor') setFormData({ nama: '', modal: 0, persentase: 0 });
      if (activeTab === 'account') setFormData({ namaRekening: '', nomorRekening: '', atasNama: '', saldoAwal: 0 });
      if (activeTab === 'supplier') setFormData({ namaPetani: '', kontak: '', alamat: '' });
    }
    setIsModalOpen(true);
  };

  const handleSaveWebsiteSettings = () => {
    setSiteSettings(localSiteSettings);
    setSaveStatus('Berhasil disimpan!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (activeTab === 'investor') {
      const modalValue = Number(formData.modal);
      const newItem = { ...formData, modal: modalValue, persentase: Number(formData.persentase) };
      
      let updatedIncomes = [...incomes];
      
      if (editingId) {
        // If editing, find the income record and update
        const existingInvestor = investors.find(inv => inv.id === editingId);
        if (existingInvestor && existingInvestor.incomeId) {
          updatedIncomes = updatedIncomes.map(inc => 
            inc.id === existingInvestor.incomeId 
              ? { ...inc, jumlah: modalValue, namaPemasukan: `Setoran Modal: ${newItem.nama}` } 
              : inc
          );
        }
        setIncomes(updatedIncomes);
        setInvestors(investors.map(inv => inv.id === editingId ? { ...newItem, id: editingId } : inv));
      } else {
        // New investor, create income
        const incomeId = Date.now() + 1;
        const newIncome = {
          id: incomeId,
          tanggal: new Date().toISOString().split('T')[0],
          kategori: 'Modal Awal',
          namaPemasukan: `Setoran Modal: ${newItem.nama}`,
          jumlah: modalValue,
          rekeningId: accounts.length > 0 ? accounts[0].id : '', // default to first account
          catatan: 'Otomatis dari Master Data Investor'
        };
        setIncomes([newIncome, ...incomes]);
        setInvestors([{ ...newItem, id: Date.now(), incomeId }, ...investors]);
      }
    } 
    else if (activeTab === 'account') {
      const newItem = { ...formData, saldoAwal: Number(formData.saldoAwal) };
      if (editingId) setAccounts(accounts.map(acc => acc.id === editingId ? { ...newItem, id: editingId } : acc));
      else setAccounts([...accounts, { ...newItem, id: `acc-${Date.now()}` }]);
    } 
    else if (activeTab === 'supplier') {
      if (editingId) setSuppliers(suppliers.map(sup => sup.id === editingId ? { ...formData, id: editingId } : sup));
      else setSuppliers([...suppliers, { ...formData, id: `sup-${Date.now()}` }]);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Yakin ingin menghapus data ini?')) return;
    
    if (activeTab === 'investor') {
      const invToDelete = investors.find(inv => inv.id === id);
      if (invToDelete && invToDelete.incomeId) {
        setIncomes(incomes.filter(inc => inc.id !== invToDelete.incomeId));
      }
      setInvestors(investors.filter(inv => inv.id !== id));
    } else if (activeTab === 'account') {
      if (id === 'kas-tunai') return alert('Kas Tunai bawaan tidak bisa dihapus.');
      setAccounts(accounts.filter(acc => acc.id !== id));
    } else if (activeTab === 'supplier') {
      setSuppliers(suppliers.filter(sup => sup.id !== id));
    }
  };

  const calculateAccountBalances = useMemo(() => {
    const balances = {};
    // initialize
    accounts.forEach(acc => {
      balances[acc.id] = acc.saldoAwal || 0;
    });

    // Sales (+)
    sales.filter(s => s.statusPembayaran === 'Sudah bayar' && s.rekeningId).forEach(s => {
      if (balances[s.rekeningId] !== undefined) balances[s.rekeningId] += s.totalPenjualan;
    });

    // Incomes (+)
    incomes.filter(i => i.rekeningId).forEach(i => {
      if (balances[i.rekeningId] !== undefined) balances[i.rekeningId] += i.jumlah;
    });

    // Purchases (-)
    purchases.filter(p => p.rekeningId).forEach(p => {
      if (balances[p.rekeningId] !== undefined) balances[p.rekeningId] -= p.hargaBeliTotal;
    });

    // Expenses (-)
    expenses.filter(e => e.rekeningId).forEach(e => {
      if (balances[e.rekeningId] !== undefined) balances[e.rekeningId] -= e.jumlah;
    });

    return balances;
  }, [accounts, sales, incomes, purchases, expenses]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-8 h-8 text-brand-brown" />
        <h1 className="text-2xl font-bold text-brand-brown">Pengaturan Master Data</h1>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
        <button onClick={() => setActiveTab('investor')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'investor' ? 'bg-brand-gold text-white' : 'bg-white text-brand-brown/60 border border-brand-brown/10 hover:bg-brand-brown/5'}`}>
          <Users className="w-5 h-5" /> Data Investor
        </button>
        <button onClick={() => setActiveTab('account')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'account' ? 'bg-brand-gold text-white' : 'bg-white text-brand-brown/60 border border-brand-brown/10 hover:bg-brand-brown/5'}`}>
          <CreditCard className="w-5 h-5" /> Data Rekening (Bank/Kas)
        </button>
        <button onClick={() => setActiveTab('supplier')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'supplier' ? 'bg-brand-gold text-white' : 'bg-white text-brand-brown/60 border border-brand-brown/10 hover:bg-brand-brown/5'}`}>
          <Truck className="w-5 h-5" /> Data Supplier/Petani
        </button>
        <button onClick={() => setActiveTab('website')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'website' ? 'bg-brand-gold text-white' : 'bg-white text-brand-brown/60 border border-brand-brown/10 hover:bg-brand-brown/5'}`}>
          <Settings className="w-5 h-5" /> Tampilan Web
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-brand-brown/10 overflow-hidden mb-6">
        <div className="p-6 border-b border-brand-brown/10 flex justify-between items-center bg-brand-brown/[0.02]">
          <h2 className="text-lg font-bold text-brand-brown">
            {activeTab === 'investor' ? 'Daftar Investor' : activeTab === 'account' ? 'Daftar Rekening & Saldo' : activeTab === 'supplier' ? 'Daftar Petani / Supplier' : 'Pengaturan Tampilan Website'}
          </h2>
          {activeTab !== 'website' && (
            <button onClick={() => handleOpenModal()} className="bg-brand-brown hover:bg-brand-brown/90 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium">
              <Plus className="w-4 h-4" /> Tambah Baru
            </button>
          )}
        </div>
        
        
        {activeTab === 'website' ? (
          <div className="p-10 max-w-2xl">
            <div className="mb-12">
              <label className="block text-sm font-black text-brand-brown uppercase tracking-widest mb-4">Hero Image (Halaman Depan)</label>
              <div className="flex flex-col gap-6">
                <div className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden bg-brand-brown/5 border-2 border-dashed border-brand-brown/10 flex items-center justify-center">
                  {localSiteSettings.heroImage ? (
                    <img src={localSiteSettings.heroImage} alt="Hero Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-8">
                      <Plus className="w-12 h-12 text-brand-brown/10 mx-auto mb-2" />
                      <p className="text-xs text-brand-brown/30 font-bold uppercase">Belum ada foto</p>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="flex-1">
                    <div className="bg-brand-brown hover:bg-brand-gold text-white hover:text-brand-brown px-6 py-4 rounded-2xl cursor-pointer transition-all text-center font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand-brown/10">
                      Pilih Foto Baru
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          if (file.size > 2 * 1024 * 1024) {
                            alert('Ukuran foto terlalu besar. Maksimal 2MB untuk optimasi performa.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setLocalSiteSettings({ ...localSiteSettings, heroImage: reader.result });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  {localSiteSettings.heroImage && (
                    <button 
                      onClick={() => setLocalSiteSettings({ ...localSiteSettings, heroImage: '' })}
                      className="px-6 py-4 border border-rose-100 text-rose-500 hover:bg-rose-50 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-brand-brown/40 font-medium italic">
                  * Foto ini akan muncul sebagai gambar utama di halaman depan website Anda. Gunakan foto berkualitas tinggi untuk hasil terbaik. (Maks 2MB)
                </p>
              </div>
            </div>

            <div className="mb-12">
              <label className="block text-sm font-black text-brand-brown uppercase tracking-widest mb-4">WhatsApp Admin (Penerima Pesanan)</label>
              <div className="space-y-4">
                <input 
                  type="text" 
                  value={localSiteSettings.whatsapp || ''} 
                  onChange={(e) => setLocalSiteSettings({ ...localSiteSettings, whatsapp: e.target.value })}
                  placeholder="Contoh: 6281234567890"
                  className="w-full px-6 py-4 rounded-2xl border border-brand-brown/10 bg-brand-brown/[0.02] focus:border-brand-gold outline-none font-bold text-brand-brown"
                />
                <p className="text-[10px] text-brand-brown/40 font-medium italic">
                  * Gunakan format kode negara (62) tanpa tanda + atau spasi. Nomor ini akan terhubung ke semua tombol "Hubungi WhatsApp" di website.
                </p>
              </div>
            </div>

            <div className="pt-8 border-t border-brand-brown/10 flex items-center gap-6">
              <button 
                onClick={handleSaveWebsiteSettings}
                className="bg-brand-gold hover:bg-brand-brown text-white hover:text-brand-gold px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-brand-gold/20"
              >
                Simpan Pengaturan
              </button>
              {saveStatus && (
                <span className="text-green-600 font-bold text-xs animate-fade-in">{saveStatus}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-brand-brown/5 border-b border-brand-brown/10">
              <tr>
                {activeTab === 'investor' && (
                  <>
                    <th className="px-6 py-4 text-sm font-semibold text-brand-brown">Nama Investor</th>
                    <th className="px-6 py-4 text-sm font-semibold text-brand-brown text-right">Modal Disetor</th>
                    <th className="px-6 py-4 text-sm font-semibold text-brand-brown text-center">Kepemilikan Saham</th>
                  </>
                )}
                {activeTab === 'account' && (
                  <>
                    <th className="px-6 py-4 text-sm font-semibold text-brand-brown">Nama Rekening/Kas</th>
                    <th className="px-6 py-4 text-sm font-semibold text-brand-brown">No. Rekening</th>
                    <th className="px-6 py-4 text-sm font-semibold text-brand-brown text-right">Saldo Awal</th>
                    <th className="px-6 py-4 text-sm font-semibold text-brand-brown text-right">Saldo Saat Ini (Real-time)</th>
                  </>
                )}
                {activeTab === 'supplier' && (
                  <>
                    <th className="px-6 py-4 text-sm font-semibold text-brand-brown">Nama Petani/Pabrik</th>
                    <th className="px-6 py-4 text-sm font-semibold text-brand-brown">Kontak</th>
                    <th className="px-6 py-4 text-sm font-semibold text-brand-brown">Alamat/Catatan</th>
                  </>
                )}
                <th className="px-6 py-4 text-sm font-semibold text-brand-brown text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-brown/10">
              {activeTab === 'investor' && investors.map(inv => (
                <tr key={inv.id}>
                  <td className="px-6 py-4 font-medium">{inv.nama}</td>
                  <td className="px-6 py-4 text-right font-bold text-green-600">{formatRupiah(inv.modal)}</td>
                  <td className="px-6 py-4 text-center font-bold">{inv.persentase}%</td>
                  <td className="px-6 py-4 flex justify-end gap-2">
                    <button onClick={() => handleOpenModal(inv)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(inv.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              
              {activeTab === 'account' && accounts.map(acc => (
                <tr key={acc.id}>
                  <td className="px-6 py-4">
                    <div className="font-bold flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-brown-400" /> {acc.namaRekening}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {acc.nomorRekening ? (
                      <div>
                        <div className="font-medium text-brown-900">{acc.nomorRekening}</div>
                        <div className="text-xs text-brown-500">a.n {acc.atasNama}</div>
                      </div>
                    ) : (
                      <span className="text-brown-400 italic">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-brown-500">{formatRupiah(acc.saldoAwal)}</td>
                  <td className={`px-6 py-4 text-right font-bold text-lg ${calculateAccountBalances[acc.id] < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatRupiah(calculateAccountBalances[acc.id] || 0)}
                  </td>
                  <td className="px-6 py-4 flex justify-end gap-2">
                    <button onClick={() => handleOpenModal(acc)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                    {acc.id !== 'kas-tunai' && <button onClick={() => handleDelete(acc.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>}
                  </td>
                </tr>
              ))}

              {activeTab === 'supplier' && suppliers.map(sup => (
                <tr key={sup.id}>
                  <td className="px-6 py-4 font-medium">{sup.namaPetani}</td>
                  <td className="px-6 py-4 text-brown-600">{sup.kontak || '-'}</td>
                  <td className="px-6 py-4 text-brown-500 text-sm">{sup.alamat || '-'}</td>
                  <td className="px-6 py-4 flex justify-end gap-2">
                    <button onClick={() => handleOpenModal(sup)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(sup.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}

              {((activeTab === 'investor' && investors.length === 0) || 
                (activeTab === 'account' && accounts.length === 0) || 
                (activeTab === 'supplier' && suppliers.length === 0)) && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-brand-brown/40">Belum ada data di menu ini.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-brown-100">
              <h2 className="text-xl font-bold text-brown-900">{editingId ? 'Edit Data' : 'Tambah Data'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {activeTab === 'investor' && (
                <>
                  <div><label className="block text-sm font-medium mb-1">Nama Investor *</label><input required type="text" value={formData.nama} onChange={e=>setFormData({...formData, nama: e.target.value})} className="w-full px-3 py-2 border rounded-xl" /></div>
                  <div><label className="block text-sm font-medium mb-1">Total Modal Disetor (Rp) *</label><input required type="number" min="0" value={formData.modal} onChange={e=>setFormData({...formData, modal: e.target.value})} className="w-full px-3 py-2 border rounded-xl" /></div>
                  <div><label className="block text-sm font-medium mb-1">Persentase Saham (%) *</label><input required type="number" step="0.1" min="0" max="100" value={formData.persentase} onChange={e=>setFormData({...formData, persentase: e.target.value})} className="w-full px-3 py-2 border rounded-xl" /></div>
                  <p className="text-xs text-brown-500 italic mt-2">* Menyimpan data ini akan otomatis membuat Pemasukan "Modal Awal" di Buku Kas.</p>
                </>
              )}

              {activeTab === 'account' && (
                <>
                  <div><label className="block text-sm font-medium mb-1">Nama Rekening/Kas *</label><input required type="text" placeholder="Contoh: BCA, Mandiri, Brankas Toko" value={formData.namaRekening} onChange={e=>setFormData({...formData, namaRekening: e.target.value})} className="w-full px-3 py-2 border rounded-xl" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm font-medium mb-1">Nomor Rekening</label><input type="text" placeholder="Opsional" value={formData.nomorRekening || ''} onChange={e=>setFormData({...formData, nomorRekening: e.target.value})} className="w-full px-3 py-2 border rounded-xl" /></div>
                    <div><label className="block text-sm font-medium mb-1">Atas Nama</label><input type="text" placeholder="Opsional" value={formData.atasNama || ''} onChange={e=>setFormData({...formData, atasNama: e.target.value})} className="w-full px-3 py-2 border rounded-xl" /></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Saldo Awal (Rp)</label><input type="number" min="0" value={formData.saldoAwal} onChange={e=>setFormData({...formData, saldoAwal: e.target.value})} className="w-full px-3 py-2 border rounded-xl" /></div>
                </>
              )}

              {activeTab === 'supplier' && (
                <>
                  <div><label className="block text-sm font-medium mb-1">Nama Petani/Pabrik *</label><input required type="text" value={formData.namaPetani} onChange={e=>setFormData({...formData, namaPetani: e.target.value})} className="w-full px-3 py-2 border rounded-xl" /></div>
                  <div><label className="block text-sm font-medium mb-1">Kontak/No HP</label><input type="text" value={formData.kontak} onChange={e=>setFormData({...formData, kontak: e.target.value})} className="w-full px-3 py-2 border rounded-xl" /></div>
                  <div><label className="block text-sm font-medium mb-1">Alamat/Catatan</label><textarea rows="2" value={formData.alamat} onChange={e=>setFormData({...formData, alamat: e.target.value})} className="w-full px-3 py-2 border rounded-xl"></textarea></div>
                </>
              )}

              <div className="pt-4 border-t mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 hover:bg-brand-brown/5 rounded-xl font-medium text-brand-brown">Batal</button>
                <button type="submit" className="px-4 py-2 bg-brand-gold text-white rounded-xl font-medium">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
