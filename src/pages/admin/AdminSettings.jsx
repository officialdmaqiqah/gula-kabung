import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatRupiah } from '../../utils/format';
import { Plus, Edit, Trash2, Users, CreditCard, Truck, Settings, Loader2, Save } from 'lucide-react';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('investor');

  const [investors, setInvestors] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [siteSettings, setSiteSettings] = useState({ hero_image: '', whatsapp: '6281234567890' });

  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({});
  const [localSiteSettings, setLocalSiteSettings] = useState(siteSettings);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const { data: investorsData } = await supabase.from('kabung_investors').select('*');
      const { data: accountsData } = await supabase.from('kabung_accounts').select('*');
      const { data: suppliersData } = await supabase.from('kabung_suppliers').select('*');
      const { data: settingsData } = await supabase.from('kabung_settings').select('*').eq('id', 'main').single();
      
      const { data: salesData } = await supabase.from('kabung_sales').select('total_penjualan, rekening_id, status_pembayaran');
      const { data: purchasesData } = await supabase.from('kabung_purchases').select('harga_beli_total, rekening_id');
      const { data: incomesData } = await supabase.from('kabung_incomes').select('jumlah, rekening_id');
      const { data: expensesData } = await supabase.from('kabung_expenses').select('jumlah, rekening_id');

      setInvestors(investorsData || []);
      setAccounts(accountsData || []);
      setSuppliers(suppliersData || []);
      if (settingsData) {
        setSiteSettings(settingsData);
        setLocalSiteSettings(settingsData);
      }
      
      setSales(salesData || []);
      setPurchases(purchasesData || []);
      setIncomes(incomesData || []);
      setExpenses(expensesData || []);
    } catch (error) {
      console.error('Error fetching settings data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingId(item.id);
      if (activeTab === 'investor') setFormData({ nama: item.nama, modal: item.modal, persentase: item.persentase });
      else if (activeTab === 'account') setFormData({ namaRekening: item.nama_rekening, nomorRekening: item.nomor_rekening, atasNama: item.atas_nama, saldoAwal: item.saldo_awal });
      else if (activeTab === 'supplier') setFormData({ namaPetani: item.nama_petani, kontak: item.kontak, alamat: item.alamat });
    } else {
      setEditingId(null);
      if (activeTab === 'investor') setFormData({ nama: '', modal: 0, persentase: 0 });
      if (activeTab === 'account') setFormData({ namaRekening: '', nomorRekening: '', atasNama: '', saldoAwal: 0 });
      if (activeTab === 'supplier') setFormData({ namaPetani: '', kontak: '', alamat: '' });
    }
    setIsModalOpen(true);
  };

  const handleSaveWebsiteSettings = async () => {
    try {
      setSubmitting(true);
      const { error } = await supabase.from('kabung_settings').upsert({
        id: 'main',
        hero_image: localSiteSettings.hero_image,
        whatsapp: localSiteSettings.whatsapp,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      
      setSaveStatus('Berhasil disimpan!');
      setTimeout(() => setSaveStatus(''), 3000);
      await fetchInitialData();
    } catch (error) {
      alert('Gagal menyimpan: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      if (activeTab === 'investor') {
        const payload = {
          nama: formData.nama,
          modal: Number(formData.modal),
          persentase: Number(formData.persentase)
        };
        
        if (editingId) {
          const { error } = await supabase.from('kabung_investors').update(payload).eq('id', editingId);
          if (error) throw error;
        } else {
          // New investor, create income automatically
          const { data: newInc, error: incError } = await supabase.from('kabung_incomes').insert([{
            tanggal: new Date().toISOString().split('T')[0],
            kategori: 'Modal Awal',
            nama_pemasukan: `Setoran Modal: ${payload.nama}`,
            jumlah: payload.modal,
            rekening_id: accounts.length > 0 ? accounts[0].id : null,
            catatan: 'Otomatis dari Master Data Investor'
          }]).select();
          
          if (incError) throw incError;
          
          const { error } = await supabase.from('kabung_investors').insert([{
            ...payload,
            income_id: newInc[0].id
          }]);
          if (error) throw error;
        }
      } 
      else if (activeTab === 'account') {
        const payload = {
          nama_rekening: formData.namaRekening,
          nomor_rekening: formData.nomorRekening,
          atas_nama: formData.atasNama,
          saldo_awal: Number(formData.saldoAwal)
        };
        if (editingId) await supabase.from('kabung_accounts').update(payload).eq('id', editingId);
        else await supabase.from('kabung_accounts').insert([payload]);
      } 
      else if (activeTab === 'supplier') {
        const payload = {
          nama_petani: formData.namaPetani,
          kontak: formData.kontak,
          alamat: formData.alamat
        };
        if (editingId) await supabase.from('kabung_suppliers').update(payload).eq('id', editingId);
        else await supabase.from('kabung_suppliers').insert([payload]);
      }

      await fetchInitialData();
      setIsModalOpen(false);
    } catch (error) {
      alert('Gagal menyimpan: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus data ini?')) return;
    
    try {
      setLoading(true);
      if (activeTab === 'investor') {
        const inv = investors.find(i => i.id === id);
        if (inv?.income_id) await supabase.from('kabung_incomes').delete().eq('id', inv.income_id);
        await supabase.from('kabung_investors').delete().eq('id', id);
      } else if (activeTab === 'account') {
        const acc = accounts.find(a => a.id === id);
        if (acc?.nama_rekening === 'Kas Tunai') return alert('Kas Tunai tidak bisa dihapus.');
        await supabase.from('kabung_accounts').delete().eq('id', id);
      } else if (activeTab === 'supplier') {
        await supabase.from('kabung_suppliers').delete().eq('id', id);
      }
      await fetchInitialData();
    } catch (error) {
      alert('Gagal menghapus: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateAccountBalances = useMemo(() => {
    const balances = {};
    accounts.forEach(acc => {
      balances[acc.id] = Number(acc.saldo_awal) || 0;
    });

    sales.filter(s => s.status_pembayaran === 'Sudah bayar' && s.rekening_id).forEach(s => {
      if (balances[s.rekening_id] !== undefined) balances[s.rekening_id] += Number(s.total_penjualan);
    });

    incomes.filter(i => i.rekening_id).forEach(i => {
      if (balances[i.rekening_id] !== undefined) balances[i.rekening_id] += Number(i.jumlah);
    });

    purchases.filter(p => p.rekening_id).forEach(p => {
      if (balances[p.rekening_id] !== undefined) balances[p.rekening_id] -= Number(p.harga_beli_total);
    });

    expenses.filter(e => e.rekening_id).forEach(e => {
      if (balances[e.rekening_id] !== undefined) balances[e.rekening_id] -= Number(e.jumlah);
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
        
        {loading ? (
          <div className="p-20 text-center">
            <Loader2 className="w-12 h-12 text-brand-gold animate-spin mx-auto mb-4" />
            <p className="text-brand-brown/50 font-medium">Memuat data master...</p>
          </div>
        ) : activeTab === 'website' ? (
          <div className="p-10 max-w-2xl">
            <div className="mb-12">
              <label className="block text-sm font-black text-brand-brown uppercase tracking-widest mb-4">Hero Image (Halaman Depan)</label>
              <div className="flex flex-col gap-6">
                <div className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden bg-brand-brown/5 border-2 border-dashed border-brand-brown/10 flex items-center justify-center">
                  {localSiteSettings.hero_image ? (
                    <img src={localSiteSettings.hero_image} alt="Hero Preview" className="w-full h-full object-cover" />
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
                            alert('Ukuran foto terlalu besar. Maksimal 2MB.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setLocalSiteSettings({ ...localSiteSettings, hero_image: reader.result });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  {localSiteSettings.hero_image && (
                    <button 
                      onClick={() => setLocalSiteSettings({ ...localSiteSettings, hero_image: '' })}
                      className="px-6 py-4 border border-rose-100 text-rose-500 hover:bg-rose-50 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-12">
              <label className="block text-sm font-black text-brand-brown uppercase tracking-widest mb-4">WhatsApp Admin</label>
              <input 
                type="text" 
                value={localSiteSettings.whatsapp || ''} 
                onChange={(e) => setLocalSiteSettings({ ...localSiteSettings, whatsapp: e.target.value })}
                placeholder="6281234567890"
                className="w-full px-6 py-4 rounded-2xl border border-brand-brown/10 bg-brand-brown/[0.02] focus:border-brand-gold outline-none font-bold text-brand-brown"
              />
            </div>

            <div className="pt-8 border-t border-brand-brown/10 flex items-center gap-6">
              <button 
                onClick={handleSaveWebsiteSettings}
                disabled={submitting}
                className="bg-brand-gold hover:bg-brand-brown text-white hover:text-brand-gold px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl flex items-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {submitting ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
              {saveStatus && <span className="text-green-600 font-bold text-xs">{saveStatus}</span>}
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
                    <th className="px-6 py-4 text-sm font-semibold text-brand-brown text-right">Saldo Saat Ini</th>
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
                  <td className="px-6 py-4 font-bold flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-brown-400" /> {acc.nama_rekening}
                  </td>
                  <td className="px-6 py-4">
                    {acc.nomor_rekening ? (
                      <div>
                        <div className="font-medium text-brown-900">{acc.nomor_rekening}</div>
                        <div className="text-xs text-brown-500">a.n {acc.atas_nama}</div>
                      </div>
                    ) : <span className="text-brown-400 italic">-</span>}
                  </td>
                  <td className="px-6 py-4 text-right text-brown-500">{formatRupiah(acc.saldo_awal)}</td>
                  <td className={`px-6 py-4 text-right font-bold text-lg ${calculateAccountBalances[acc.id] < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatRupiah(calculateAccountBalances[acc.id] || 0)}
                  </td>
                  <td className="px-6 py-4 flex justify-end gap-2">
                    <button onClick={() => handleOpenModal(acc)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                    {acc.nama_rekening !== 'Kas Tunai' && <button onClick={() => handleDelete(acc.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>}
                  </td>
                </tr>
              ))}

              {activeTab === 'supplier' && suppliers.map(sup => (
                <tr key={sup.id}>
                  <td className="px-6 py-4 font-medium">{sup.nama_petani}</td>
                  <td className="px-6 py-4 text-brown-600">{sup.kontak || '-'}</td>
                  <td className="px-6 py-4 text-brown-500 text-sm">{sup.alamat || '-'}</td>
                  <td className="px-6 py-4 flex justify-end gap-2">
                    <button onClick={() => handleOpenModal(sup)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(sup.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
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
                  <div><label className="block text-sm font-medium mb-1">Total Modal (Rp) *</label><input required type="number" min="0" value={formData.modal} onChange={e=>setFormData({...formData, modal: e.target.value})} className="w-full px-3 py-2 border rounded-xl" /></div>
                  <div><label className="block text-sm font-medium mb-1">Persentase Saham (%) *</label><input required type="number" step="0.1" min="0" max="100" value={formData.persentase} onChange={e=>setFormData({...formData, persentase: e.target.value})} className="w-full px-3 py-2 border rounded-xl" /></div>
                </>
              )}

              {activeTab === 'account' && (
                <>
                  <div><label className="block text-sm font-medium mb-1">Nama Rekening/Kas *</label><input required type="text" value={formData.namaRekening} onChange={e=>setFormData({...formData, namaRekening: e.target.value})} className="w-full px-3 py-2 border rounded-xl" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm font-medium mb-1">No. Rekening</label><input type="text" value={formData.nomorRekening || ''} onChange={e=>setFormData({...formData, nomorRekening: e.target.value})} className="w-full px-3 py-2 border rounded-xl" /></div>
                    <div><label className="block text-sm font-medium mb-1">Atas Nama</label><input type="text" value={formData.atasNama || ''} onChange={e=>setFormData({...formData, atasNama: e.target.value})} className="w-full px-3 py-2 border rounded-xl" /></div>
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
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 hover:bg-brand-brown/5 rounded-xl font-medium" disabled={submitting}>Batal</button>
                <button type="submit" className="px-4 py-2 bg-brand-gold text-white rounded-xl font-medium flex items-center gap-2" disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
