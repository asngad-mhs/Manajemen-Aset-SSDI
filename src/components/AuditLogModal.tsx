import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { X, Clock, Activity } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  timestamp: any;
}

interface AuditLogModalProps {
  assetId: string;
  assetName: string;
  onClose: () => void;
}

export function AuditLogModal({ assetId, assetName, onClose }: AuditLogModalProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'assets', assetId, 'audit_logs'),
      orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results: AuditLog[] = [];
      snapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() } as AuditLog);
      });
      setLogs(results);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `assets/${assetId}/audit_logs`);
      setLoading(false);
    });
    return unsubscribe;
  }, [assetId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Riwayat Aset: {assetName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-sm font-medium text-gray-500 text-center py-8">Memuat riwayat...</div>
          ) : logs.length === 0 ? (
            <div className="text-sm font-medium text-gray-500 text-center py-8">Belum ada riwayat perubahan.</div>
          ) : (
            <div className="space-y-6">
              {logs.map((log, index) => (
                <div key={log.id} className="relative flex gap-4">
                  <div className="absolute left-4 top-10 -bottom-6 w-px bg-gray-200" style={{ display: index === logs.length - 1 ? 'none' : 'block' }}></div>
                  <div className="relative mt-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 ring-8 ring-white border border-gray-100">
                      {log.action === 'create' ? <Activity size={14} className="text-emerald-600" /> : <Clock size={14} className="text-indigo-600" />}
                    </div>
                  </div>
                  <div className="flex-1 py-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {log.action === 'create' ? 'Aset Didaftarkan' : 'Aset Diperbarui'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">
                      Oleh ID Pengguna: <span className="font-mono text-[10px] text-gray-400 ml-1">{log.performedBy}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1 font-medium">
                      {log.timestamp ? new Date(log.timestamp.toDate()).toLocaleString('id-ID') : 'Baru saja'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
