import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Package, CheckCircle2, Wrench, XCircle, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface AssetStats {
  total: number;
  active: number;
  maintenance: number;
  retired: number;
}

interface RecentAsset {
  id: string;
  name: string;
  updatedAt: any;
  status: string;
}

interface CategoryData {
  name: string;
  value: number;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function Dashboard() {
  const [stats, setStats] = useState<AssetStats>({ total: 0, active: 0, maintenance: 0, retired: 0 });
  const [recentAssets, setRecentAssets] = useState<RecentAsset[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qStats = query(collection(db, 'assets'));
    const unsubscribeStats = onSnapshot(qStats, (snapshot) => {
      const newStats = { total: 0, active: 0, maintenance: 0, retired: 0 };
      const categories: Record<string, number> = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        newStats.total++;
        
        if (data.status === 'active') newStats.active++;
        else if (data.status === 'maintenance') newStats.maintenance++;
        else if (data.status === 'retired') newStats.retired++;

        const category = data.category || 'Lainnya';
        categories[category] = (categories[category] || 0) + 1;
      });

      setStats(newStats);
      setCategoryData(Object.keys(categories).map(key => ({
        name: key,
        value: categories[key]
      })));
      
      if (loading) setLoading(false);
    }, (error) => {
       try { handleFirestoreError(error, OperationType.GET, 'assets'); } catch(e) {}
       setLoading(false);
    });

    const qRecent = query(collection(db, 'assets'), orderBy('updatedAt', 'desc'), limit(5));
    const unsubscribeRecent = onSnapshot(qRecent, (snapshot) => {
      const recents: RecentAsset[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        recents.push({
          id: doc.id,
          name: data.name,
          status: data.status,
          updatedAt: data.updatedAt
        });
      });
      setRecentAssets(recents);
    }, (error) => {
      console.error(error);
    });

    return () => {
      unsubscribeStats();
      unsubscribeRecent();
    };
  }, []);

  if (loading) return (
     <div className="flex justify-center items-center h-64">
       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
     </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col gap-1 mb-8">
        <h3 className="text-2xl font-bold tracking-tight text-gray-900">Ringkasan Sistem</h3>
        <p className="text-sm text-gray-500">Gambaran umum status dan kondisi aset di institusi Anda.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Assets */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100/50 hover:shadow-md transition-shadow relative group">
          <div className="absolute right-0 top-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-indigo-50 opacity-50 group-hover:scale-150 transition-transform duration-500 blur-2xl"></div>
          <div className="p-6 relative">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-xl bg-indigo-100 p-3 ring-1 ring-indigo-50">
                <Package className="h-6 w-6 text-indigo-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Total Aset</dt>
                  <dd className="mt-1">
                    <div className="text-3xl font-bold tracking-tight text-gray-900">{stats.total}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Active Tools */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100/50 hover:shadow-md transition-shadow relative group">
          <div className="absolute right-0 top-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-emerald-50 opacity-50 group-hover:scale-150 transition-transform duration-500 blur-2xl"></div>
          <div className="p-6 relative">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-xl bg-emerald-100 p-3 ring-1 ring-emerald-50">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Aset Aktif</dt>
                  <dd className="mt-1">
                    <div className="text-3xl font-bold tracking-tight text-gray-900">{stats.active}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100/50 hover:shadow-md transition-shadow relative group">
          <div className="absolute right-0 top-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-amber-50 opacity-50 group-hover:scale-150 transition-transform duration-500 blur-2xl"></div>
          <div className="p-6 relative">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-xl bg-amber-100 p-3 ring-1 ring-amber-50">
                <Wrench className="h-6 w-6 text-amber-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Perawatan</dt>
                  <dd className="mt-1">
                    <div className="text-3xl font-bold tracking-tight text-gray-900">{stats.maintenance}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Retired Tools */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100/50 hover:shadow-md transition-shadow relative group">
          <div className="absolute right-0 top-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-red-50 opacity-50 group-hover:scale-150 transition-transform duration-500 blur-2xl"></div>
          <div className="p-6 relative">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-xl bg-red-100 p-3 ring-1 ring-red-50">
                <XCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Pensiun</dt>
                  <dd className="mt-1">
                    <div className="text-3xl font-bold tracking-tight text-gray-900">{stats.retired}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      {/* Category Pie Chart */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100/50 p-6 flex flex-col">
        <h3 className="text-base font-semibold text-gray-900 mb-4 tracking-tight">Distribusi Kategori Aset</h3>
        <div className="h-64 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={68}
                outerRadius={88}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${value} Aset`, 'Jumlah']} 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '13px' }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100/50 p-6 flex flex-col">
        <h3 className="text-base font-semibold text-gray-900 tracking-tight mb-1">Aktivitas Terkini</h3>
        <p className="text-sm text-gray-500 mb-4">Aset yang baru saja diperbarui dalam sistem.</p>
        
        <div className="flex-1 overflow-auto pr-2">
        {recentAssets.length === 0 ? (
          <p className="text-sm text-gray-500 italic px-4 py-8 text-center bg-gray-50 rounded-xl">
             Sistem ini digunakan untuk melacak aset perusahaan secara real-time. Belum ada aktivitas pembaruan.
          </p>
        ) : (
          <ul className="space-y-3">
            {recentAssets.map(asset => (
               <li key={asset.id} className="flex gap-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                 <div className="relative flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100/50 shadow-sm">
                   <Clock className="h-5 w-5" />
                 </div>
                 <div className="flex-auto min-w-0">
                   <div className="flex items-baseline justify-between gap-x-4">
                     <p className="text-sm font-semibold text-gray-900 truncate">{asset.name}</p>
                     <p className="flex-none text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                       {asset.updatedAt ? new Date(asset.updatedAt.toDate()).toLocaleString('id-ID', { hour: 'numeric', minute: 'numeric', day: 'numeric', month: 'short' }) : 'Baru saja'}
                     </p>
                   </div>
                   <p className="mt-1 text-sm text-gray-500 truncate">
                     Status diperbarui ke <span className="font-medium text-gray-700">{asset.status === 'active' ? 'Aktif' : asset.status === 'maintenance' ? 'Perawatan' : 'Pensiun'}</span>
                   </p>
                 </div>
               </li>
            ))}
          </ul>
        )}
        </div>
      </div>
    </div>
    </div>
  );
}
