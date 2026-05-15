import React, { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { LogIn, LogOut, LayoutDashboard, Package, ShieldAlert, Users, Menu, X, Box, ClipboardList } from 'lucide-react';
import { AssetList } from './components/AssetList';
import { Dashboard } from './components/Dashboard';
import { UserManagement } from './components/UserManagement';
import { AssetRequests } from './components/AssetRequests';

type View = 'dashboard' | 'assets' | 'requests' | 'users';

function Layout() {
  const { user, role, loading, signIn, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50/50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm font-medium text-gray-500 animate-pulse">Memuat Sistem SSDI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50/50 px-4">
        <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-xl border border-gray-100 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-sm">
            <Box size={32} />
          </div>
          <h1 className="mb-3 text-2xl font-bold tracking-tight text-gray-900">Sistem Laporan Aset</h1>
          <p className="mb-8 text-sm text-gray-500 leading-relaxed">Silakan masuk menggunakan akun Google Anda untuk mengakses sistem pelacakan aset institusi.</p>
          <button
            onClick={signIn}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 transition-all active:scale-[0.98]"
          >
            <LogIn size={20} />
            Masuk dengan Google
          </button>
        </div>
      </div>
    );
  }

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm lg:hidden flex transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col shadow-sm lg:shadow-none`}>
        <div className="flex h-16 items-center justify-between gap-3 border-b border-gray-100 px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex bg-indigo-50 p-1.5 rounded-lg border border-indigo-100">
              <Box className="text-indigo-600 shrink-0" size={20} />
            </div>
            <span className="text-base font-semibold text-gray-900 tracking-tight truncate">SSDI Assets</span>
          </div>
          <button onClick={closeSidebar} className="lg:hidden text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-md transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-1.5">
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Menu Utama</p>
          <button
            onClick={() => { setCurrentView('dashboard'); closeSidebar(); }}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
              currentView === 'dashboard' ? 'bg-indigo-50/80 text-indigo-700 shadow-sm shadow-indigo-100/50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <LayoutDashboard size={18} className={currentView === 'dashboard' ? 'text-indigo-600' : 'text-gray-400'} /> Dashboard
          </button>
          <button
             onClick={() => { setCurrentView('assets'); closeSidebar(); }}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
              currentView === 'assets' ? 'bg-indigo-50/80 text-indigo-700 shadow-sm shadow-indigo-100/50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Package size={18} className={currentView === 'assets' ? 'text-indigo-600' : 'text-gray-400'} /> Manajemen Aset
          </button>
          <button
             onClick={() => { setCurrentView('requests'); closeSidebar(); }}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
              currentView === 'requests' ? 'bg-indigo-50/80 text-indigo-700 shadow-sm shadow-indigo-100/50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <ClipboardList size={18} className={currentView === 'requests' ? 'text-indigo-600' : 'text-gray-400'} /> Pengajuan Aset
          </button>
          
          {role === 'admin' && (
            <>
              <div className="h-px bg-gray-100 my-4 mx-2"></div>
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Administrasi</p>
              <button
                onClick={() => { setCurrentView('users'); closeSidebar(); }}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  currentView === 'users' ? 'bg-indigo-50/80 text-indigo-700 shadow-sm shadow-indigo-100/50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Users size={18} className={currentView === 'users' ? 'text-indigo-600' : 'text-gray-400'} /> Manajemen Pengguna
              </button>
            </>
          )}
        </nav>
        
        <div className="border-t border-gray-100 p-4 bg-gray-50/30 shrink-0 m-4 rounded-2xl">
          <div className="mb-4">
             <p className="truncate text-sm font-semibold text-gray-900" title={user.displayName || user.email || ''}>{user.displayName || user.email}</p>
             <div className="flex items-center gap-1.5 mt-1 text-xs font-medium text-gray-500 bg-white border border-gray-200 w-max px-2 py-0.5 rounded-full shadow-sm">
               {role === 'admin' ? <ShieldAlert size={12} className="text-amber-500 shrink-0"/> : null} 
               <span className="capitalize text-gray-600">{role || 'Employee'}</span>
             </div>
          </div>
          <button
            onClick={signOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 hover:text-red-600 transition-all active:scale-[0.98]"
          >
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-8 shadow-sm z-10 w-full relative">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-semibold text-gray-800 tracking-tight">
              {currentView === 'dashboard' ? 'Dashboard Overview' : 
               currentView === 'assets' ? 'Daftar Aset' :
               currentView === 'requests' ? 'Pengajuan Aset' :
               'Manajemen Pengguna'}
            </h2>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {currentView === 'dashboard' ? <Dashboard /> : 
             currentView === 'assets' ? <AssetList /> :
             currentView === 'requests' ? <AssetRequests /> :
             <UserManagement />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  );
}
