import React, { useState, useEffect } from 'react';
// Mengambil icon dari react-icons untuk indikator halaman
import { HiOutlineLockClosed, HiOutlineTemplate } from 'react-icons/hi';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';

export default function App() {
  // default halaman diarahkan ke login
  const [page, setPage] = useState<string>('login');

  // Cek otomatis saat aplikasi dimuat, jika sudah ada token, langsung ke dashboard
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setPage('dashboard');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between font-sans">
      
      {/* HEADER MINIMALIS DENGAN ICON INDIKATOR */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {page === 'dashboard' ? (
            <HiOutlineTemplate className="h-6 w-6 text-blue-600" />
          ) : (
            <HiOutlineLockClosed className="h-6 w-6 text-gray-500" />
          )}
          <span className="font-bold text-gray-800 tracking-wide text-lg">
            {page === 'dashboard' ? 'Workspace Dashboard' : 'Authentication System'}
          </span>
        </div>
        <div className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full uppercase tracking-wider">
          Status: {page}
        </div>
      </header>

      {/* KONTEN UTAMA APLIKASI */}
      <main className="flex-grow">
        {page === 'login' && (
          <Login 
            onNavigate={() => setPage('register')} 
            onLoginSuccess={() => setPage('dashboard')} 
          />
        )}
        
        {page === 'register' && (
          <Register onNavigate={() => setPage('login')} />
        )}
        
        {page === 'dashboard' && (
          <Dashboard onLogout={() => setPage('login')} />
        )}
      </main>

    </div>
  );
}