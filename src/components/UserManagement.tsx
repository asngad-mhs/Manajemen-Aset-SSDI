import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../AuthContext';
import { ShieldAlert, User, Shield } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  role: 'admin' | 'employee';
  createdAt: any;
  updatedAt: any;
}

export function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const { role: currentUserRole } = useAuth();

  useEffect(() => {
    if (currentUserRole !== 'admin') return;

    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results: UserData[] = [];
      snapshot.forEach(docSnap => {
        results.push({ id: docSnap.id, ...docSnap.data() } as UserData);
      });
      setUsers(results);
      setLoading(false);
    }, (error) => {
      try { handleFirestoreError(error, OperationType.LIST, 'users'); } catch (e) {}
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUserRole]);

  const toggleRole = async (userId: string, currentRole: 'admin' | 'employee') => {
    if (!window.confirm(`Yakin ingin mengubah role pengguna ini menjadi ${currentRole === 'admin' ? 'Employee' : 'Admin'}?`)) return;
    
    try {
      const newRole = currentRole === 'admin' ? 'employee' : 'admin';
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
       alert("Gagal mengubah role. Pastikan Anda memiliki hak akses Admin.");
       try { handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`); } catch (e) {}
    }
  };

  if (currentUserRole !== 'admin') {
    return (
      <div className="rounded-md bg-red-50 p-4 border border-red-200">
        <div className="flex">
           <div className="flex-shrink-0">
             <ShieldAlert className="h-5 w-5 text-red-400" aria-hidden="true" />
           </div>
           <div className="ml-3">
             <h3 className="text-sm font-medium text-red-800">Akses Ditolak</h3>
             <div className="mt-2 text-sm text-red-700">
               <p>Hanya Admin yang dapat mengakses halaman manajemen pengguna.</p>
             </div>
           </div>
        </div>
      </div>
    );
  }

  if (loading) return (
     <div className="flex justify-center items-center h-64">
       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
     </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 mb-8">
        <h3 className="text-2xl font-bold tracking-tight text-gray-900">Manajemen Pengguna Sistem</h3>
        <p className="text-sm text-gray-500">Atur hak akses karyawan dan administrator secara aman.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-100/50">
        <div className="overflow-x-auto">
           <table className="min-w-full divide-y divide-gray-100">
             <thead className="bg-gray-50/50">
               <tr>
                 <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Pengguna</th>
                 <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Role Terkini</th>
                 <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Terdaftar Pada</th>
                 <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Aksi</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100 bg-white">
               {users.map((user) => (
                 <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                   <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-inset ring-indigo-100/50">
                        <User size={18} />
                      </div>
                      <span className="font-semibold">{user.email}</span>
                   </td>
                   <td className="whitespace-nowrap px-6 py-4 text-sm">
                     <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        user.role === 'admin' ? 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20 shadow-sm' : 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-300/50 shadow-sm'
                     }`}>
                       {user.role === 'admin' && <Shield size={12} />}
                       {user.role === 'admin' ? 'Administrator' : 'Karyawan (Employee)'}
                     </span>
                   </td>
                   <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                     {user.createdAt?.toDate ? new Date(user.createdAt.toDate()).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                   </td>
                   <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                     <button
                       onClick={() => toggleRole(user.id, user.role)}
                       className={`rounded-xl px-4 py-2 text-xs font-semibold shadow-sm ring-1 ring-inset transition-all active:scale-[0.98] ${
                         user.role === 'admin' 
                           ? 'bg-white text-gray-700 ring-gray-200 hover:bg-gray-50 hover:text-red-600' 
                           : 'bg-white text-indigo-600 ring-indigo-200 hover:bg-indigo-50 hover:ring-indigo-300'
                       }`}
                     >
                       {user.role === 'admin' ? 'Jadikan Employee' : 'Jadikan Admin'}
                     </button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}
