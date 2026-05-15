import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../AuthContext';
import { Plus, Edit2, Trash2, ShieldAlert, RefreshCw, History, Search, Filter, Download, FileText, FileSpreadsheet, ChevronDown, Loader2, Package } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AuditLogModal } from './AuditLogModal';

interface Asset {
  id: string;
  name: string;
  code: string;
  category: string;
  status: 'active' | 'maintenance' | 'retired';
  condition: string;
  purchaseDate?: string;
  location: string;
  assignedTo: string;
  createdBy: string;
}

export function AssetList() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [historyAsset, setHistoryAsset] = useState<{id: string, name: string} | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { role } = useAuth();
  
  const [formData, setFormData] = useState<Partial<Asset>>({
    name: '', code: '', category: '', status: 'active', condition: 'Baru', location: '', purchaseDate: '', assignedTo: ''
  });

  useEffect(() => {
    if (refreshTrigger === 0) {
      setLoading(true);
    }
    const q = query(collection(db, 'assets'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results: Asset[] = [];
      snapshot.forEach((docSnap) => {
        results.push({ id: docSnap.id, ...docSnap.data() } as Asset);
      });
      setAssets(results);
      setLoading(false);
      setIsRefreshing(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'assets');
      setLoading(false);
      setIsRefreshing(false);
    });
    return unsubscribe;
  }, [refreshTrigger]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Laporan Aset SSDI', 14, 15);
    
    const tableColumn = ["Kode", "Nama Aset", "Kategori", "Status", "Kondisi", "Dibeli Pada", "Lokasi"];
    const tableRows = filteredAssets.map(asset => [
      asset.code,
      asset.name,
      asset.category,
      asset.status === 'active' ? 'Aktif' : asset.status === 'maintenance' ? 'Perawatan' : 'Pensiun',
      asset.condition,
      asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString('id-ID') : '-',
      asset.location
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    
    doc.save('Laporan_Aset_SSDI.pdf');
    setIsExportMenuOpen(false);
  };

  const handleExportExcel = () => {
    const dataToExport = filteredAssets.map(asset => ({
      "Kode Aset": asset.code,
      "Nama Aset": asset.name,
      "Kategori": asset.category,
      "Status": asset.status === 'active' ? 'Aktif' : asset.status === 'maintenance' ? 'Perawatan' : 'Pensiun',
      "Kondisi": asset.condition,
      "Tanggal Pembelian": asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString('id-ID') : '-',
      "Lokasi": asset.location,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Aset");
    XLSX.writeFile(workbook, "Laporan_Aset_SSDI.xlsx");
    setIsExportMenuOpen(false);
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData(asset);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingAsset(null);
    setFormData({ name: '', code: '', category: '', status: 'active', condition: 'Baru', location: '', purchaseDate: '', assignedTo: '' });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus aset ini?')) return;
    try {
      await deleteDoc(doc(db, 'assets', id));
    } catch (e) {
      alert("Gagal menghapus data. Pastikan Anda memiliki hak akses (Admin).");
      try {
        handleFirestoreError(e, OperationType.DELETE, `assets/${id}`);
      } catch (err) {}
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    try {
      if (editingAsset) {
        const ref = doc(db, 'assets', editingAsset.id);
        const updatePayload = {
          name: formData.name,
          category: formData.category,
          status: formData.status,
          condition: formData.condition,
          location: formData.location,
          purchaseDate: formData.purchaseDate || '',
          assignedTo: formData.assignedTo,
          updatedAt: serverTimestamp()
        };
        await updateDoc(ref, updatePayload);
        
        // Simplified Audit Log conceptually
        const logId = crypto.randomUUID();
        await setDoc(doc(db, 'assets', editingAsset.id, 'audit_logs', logId), {
           assetId: editingAsset.id,
           action: 'update',
           performedBy: auth.currentUser?.uid,
           timestamp: serverTimestamp()
        });
      } else {
        const id = crypto.randomUUID();
        const ref = doc(db, 'assets', id);
        const payload = {
          name: formData.name,
          code: formData.code,
          category: formData.category,
          status: formData.status,
          condition: formData.condition,
          location: formData.location || 'Kantor Pusat',
          purchaseDate: formData.purchaseDate || '',
          assignedTo: formData.assignedTo || '',
          createdBy: auth.currentUser?.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(ref, payload);
        
        const logId = crypto.randomUUID();
        await setDoc(doc(db, 'assets', id, 'audit_logs', logId), {
           assetId: id,
           action: 'create',
           performedBy: auth.currentUser?.uid,
           timestamp: serverTimestamp()
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      setErrorMessage('Terjadi kesalahan saat menyimpan data. Periksa kembali isian Anda.');
      try {
        handleFirestoreError(error, OperationType.WRITE, 'assets');
      } catch (e) {
        // Suppress handleFirestoreError throwing to prevent app crash
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
     <div className="flex justify-center items-center h-64">
       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
     </div>
  );

  const filteredAssets = assets.filter(asset => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = asset.name.toLowerCase().includes(searchLower) || 
                          asset.code.toLowerCase().includes(searchLower) ||
                          asset.location.toLowerCase().includes(searchLower);
    const matchesStatus = statusFilter ? asset.status === statusFilter : true;
    const matchesCategory = categoryFilter ? asset.category === categoryFilter : true;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 mb-8">
        <h3 className="text-2xl font-bold tracking-tight text-gray-900">Inventaris Aset SSDI</h3>
        <p className="text-sm text-gray-500">Kelola dan pantau seluruh daftar aset dengan mudah.</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm ring-1 ring-gray-100/50">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 sm:max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari nama, kode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-xl border-0 py-2.5 pl-10 pr-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-gray-50/50 hover:bg-white transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-gray-400 hidden sm:block ml-1" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full rounded-xl border-0 py-2.5 pl-3 pr-8 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-gray-50/50 hover:bg-white transition-colors"
            >
              <option value="">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="maintenance">Perawatan</option>
              <option value="retired">Pensiun</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="block w-full rounded-xl border-0 py-2.5 pl-3 pr-8 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-gray-50/50 hover:bg-white transition-colors"
            >
              <option value="">Semua Kategori</option>
              <option value="Elektronik">Elektronik</option>
              <option value="Kendaraan">Kendaraan</option>
              <option value="Furnitur">Furnitur</option>
              <option value="Mesin">Mesin & Peralatan</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 hover:bg-gray-50 transition-all focus-within:ring-2 focus-within:ring-indigo-600"
            >
              <Download size={16} /> Unduh <ChevronDown size={14} className="text-gray-400" />
            </button>
            
            {isExportMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsExportMenuOpen(false)} 
                />
                <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-xl bg-white py-1.5 shadow-lg ring-1 ring-black/5 focus:outline-none">
                  <button
                    onClick={handleExportPDF}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FileText size={16} className="text-red-500" /> Unduh PDF
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FileSpreadsheet size={16} className="text-emerald-500" /> Unduh Excel (.xlsx)
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gray-500 shadow-sm ring-1 ring-inset ring-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-indigo-600' : ''} />
          </button>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all active:scale-[0.98]"
          >
            <Plus size={16} /> Tambah Baru
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-100/50">
        <div className="overflow-x-auto">
           <table className="min-w-full table-fixed divide-y divide-gray-100">
             <thead className="bg-gray-50/50">
               <tr>
                 <th className="w-1/6 px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Kode</th>
                 <th className="w-1/5 px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Nama Aset</th>
                 <th className="w-1/6 px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Kategori</th>
                 <th className="w-32 px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                 <th className="w-32 px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Dibeli Pada</th>
                 <th className="w-1/6 px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Lokasi</th>
                 <th className="w-24 px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Aksi</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100 bg-white">
               {filteredAssets.length === 0 ? (
                 <tr>
                   <td colSpan={7} className="px-6 py-16 text-center">
                     <Package className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                     <p className="text-sm font-medium text-gray-900">Tak ada aset yang ditemukan.</p>
                     <p className="text-sm text-gray-500 mt-1">Coba sesuaikan kriteria pencarian Anda.</p>
                   </td>
                 </tr>
               ) : filteredAssets.map((asset) => (
                 <tr key={asset.id} className="group hover:bg-indigo-50/30 transition-colors">
                   <td className="truncate px-6 py-4 text-sm font-medium text-gray-900 border-l-[3px] border-transparent group-hover:border-indigo-500 transition-all font-mono">{asset.code}</td>
                   <td className="truncate px-6 py-4 text-sm text-gray-900 font-semibold">{asset.name}</td>
                   <td className="truncate px-6 py-4 text-sm text-gray-600">{asset.category}</td>
                   <td className="truncate px-6 py-4 text-sm">
                     <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        asset.status === 'active' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' :
                        asset.status === 'maintenance' ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20' :
                        'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10'
                     }`}>
                       {asset.status === 'active' ? 'Aktif' : asset.status === 'maintenance' ? 'Perawatan' : 'Pensiun'}
                     </span>
                   </td>
                   <td className="truncate px-6 py-4 text-sm text-gray-500">{asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</td>
                   <td className="truncate px-6 py-4 text-sm text-gray-600 font-medium">{asset.location}</td>
                   <td className="px-6 py-4 text-right text-sm">
                     <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => setHistoryAsset({ id: asset.id, name: asset.name })} className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors" title="Riwayat Aset">
                         <History size={16} />
                       </button>
                       <button onClick={() => handleEdit(asset)} className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors" title="Edit Aset">
                         <Edit2 size={16} />
                       </button>
                       {role === 'admin' && (
                         <button onClick={() => handleDelete(asset.id)} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Hapus Aset">
                           <Trash2 size={16} />
                         </button>
                       )}
                     </div>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">{editingAsset ? 'Edit Aset' : 'Tambah Aset Baru'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="rounded-md bg-red-50 p-4 mb-4 border border-red-200">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Gagal Menyimpan</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{errorMessage}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium leading-6 text-gray-900">Kode Aset</label>
                <input
                  type="text" required disabled={!!editingAsset || isSaving}
                  value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})}
                  className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:bg-gray-100"
                  placeholder="e.g. LPT-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium leading-6 text-gray-900">Nama Aset</label>
                <input
                  type="text" required disabled={isSaving}
                  value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:bg-gray-100"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium leading-6 text-gray-900">Kategori</label>
                  <select
                    value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} disabled={isSaving}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:bg-gray-100"
                    required
                  >
                    <option value="">Pilih...</option>
                    <option value="Elektronik">Elektronik</option>
                    <option value="Kendaraan">Kendaraan</option>
                    <option value="Furnitur">Furnitur</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium leading-6 text-gray-900">Status</label>
                  <select
                    value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as any})} disabled={isSaving}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:bg-gray-100"
                  >
                    <option value="active">Aktif</option>
                    <option value="maintenance">Perawatan</option>
                    <option value="retired">Pensiun</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium leading-6 text-gray-900">Lokasi / Penempatan</label>
                  <input
                    type="text" disabled={isSaving}
                    value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium leading-6 text-gray-900">Tanggal Pembelian</label>
                  <input
                    type="date" disabled={isSaving}
                    value={formData.purchaseDate || ''} onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-x-4">
                <button
                  type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving}
                  className="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors disabled:opacity-50"
                >
                  {isSaving && <Loader2 size={16} className="animate-spin" />}
                  {isSaving ? 'Menyimpan...' : 'Simpan Aset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {historyAsset && (
        <AuditLogModal 
          assetId={historyAsset.id} 
          assetName={historyAsset.name} 
          onClose={() => setHistoryAsset(null)} 
        />
      )}
    </div>
  );
}
