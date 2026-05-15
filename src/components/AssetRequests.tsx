import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, updateDoc, orderBy } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../AuthContext';
import { Plus, Check, X, Clock, FileText, CheckCircle2, XCircle } from 'lucide-react';

interface AssetRequest {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'received';
  requestedBy: string;
  requestedAt: any;
  updatedAt: any;
}

export function AssetRequests() {
  const { user, role } = useAuth();
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'asset_requests'),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData: AssetRequest[] = [];
      snapshot.forEach((doc) => {
        requestsData.push({ id: doc.id, ...doc.data() } as AssetRequest);
      });
      setRequests(requestsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'asset_requests');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    
    try {
      const id = doc(collection(db, 'asset_requests')).id;
      const requestData = {
        title: formData.title,
        description: formData.description,
        status: 'pending',
        requestedBy: user.uid,
        requestedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(doc(db, 'asset_requests', id), requestData);
      setIsModalOpen(false);
      setFormData({ title: '', description: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'asset_requests');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected' | 'received') => {
    try {
      await updateDoc(doc(db, 'asset_requests', id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `asset_requests/${id}`);
    }
  };

  if (loading) return (
     <div className="flex justify-center items-center h-64">
       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
     </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-gray-900">Pengajuan Aset</h3>
          <p className="mt-1 text-sm text-gray-500">Ajukan permohonan aset baru atau pantau status pengajuan.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all active:scale-[0.98]"
        >
          <Plus size={16} /> Buat Pengajuan
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {requests.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-sm font-semibold text-gray-900">Belum ada pengajuan</h3>
            <p className="mt-1 text-sm text-gray-500">Mulai dengan membuat pengajuan baru.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Judul / Deskripsi</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 max-w-sm">
                      <div className="text-sm font-medium text-gray-900 mb-1">{req.title}</div>
                      <div className="text-sm text-gray-500 truncate">{req.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        req.status === 'pending' ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20' :
                        req.status === 'approved' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20' :
                        req.status === 'received' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' :
                        'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
                      }`}>
                        {req.status === 'pending' && <Clock size={12} />}
                        {req.status === 'approved' && <CheckCircle2 size={12} />}
                        {req.status === 'received' && <CheckCircle2 size={12} />}
                        {req.status === 'rejected' && <XCircle size={12} />}
                        
                        {req.status === 'pending' ? 'Menunggu Persetujuan' : 
                         req.status === 'approved' ? 'Disetujui (Menunggu Diterima)' :
                         req.status === 'received' ? 'Aset Diterima' : 'Ditolak'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {req.requestedAt ? new Date(req.requestedAt.toDate()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {role === 'admin' && req.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleUpdateStatus(req.id, 'approved')} className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors" title="Setujui">
                            <Check size={18} />
                          </button>
                          <button onClick={() => handleUpdateStatus(req.id, 'rejected')} className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Tolak">
                            <X size={18} />
                          </button>
                        </div>
                      )}
                      {req.requestedBy === user?.uid && req.status === 'approved' && (
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'received')}
                          className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Tandai Diterima
                        </button>
                      )}
                      
                      {/* Placeholder for no actions */}
                      {((role !== 'admin' && req.status === 'pending') || req.status === 'received' || req.status === 'rejected') && (
                        <span className="text-gray-400 text-xs italic">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="relative z-50">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)} />
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <form onSubmit={handleSubmit}>
                  <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div className="mb-5">
                      <h3 className="text-xl font-bold leading-6 text-gray-900">Form Pengajuan Aset</h3>
                      <p className="mt-2 text-sm text-gray-500">Punya kebutuhan aset baru? Rincikan apa yang Anda butuhkan di bawah ini.</p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900">Judul Kebutuhan / Nama Aset</label>
                        <div className="mt-2">
                          <input
                            type="text"
                            required
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="block w-full rounded-xl border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            placeholder="Contoh: Laptop Performa Tinggi untuk Desain"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">Deskripsi / Alasan</label>
                        <div className="mt-2">
                          <textarea
                            id="description"
                            required
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="block w-full rounded-xl border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 resize-none"
                            placeholder="Jelaskan secara spesifikasi apa yang dibutuhkan dan alasan request ini."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:flex sm:flex-row-reverse sm:px-6">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex w-full justify-center rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto disabled:opacity-50 transition-colors"
                    >
                      {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
