import React, { useState } from 'react';
import axios from 'axios';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import Swal from 'sweetalert2';
import { API_BASE_URL } from './config/api';

export default function Login({ onNavigate, onLoginSuccess }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: email,
        password: password
      });

      localStorage.setItem('token', response.data.token);
      
      Swal.fire({
        title: 'Login Berhasil! 🎉',
        text: 'Selamat datang kembali di FeloAssistant Workspace.',
        icon: 'success',
        background: '#1e293b',
        color: '#f1f5f9',
        timer: 1500,
        showConfirmButton: false
      });
      
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login gagal. Periksa kembali email & kata sandi Anda.';
      setError(msg);
      Swal.fire({
        title: 'Login Gagal!',
        text: msg,
        icon: 'error',
        background: '#1e293b',
        color: '#f1f5f9'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) return;

      const response = await axios.post(`${API_BASE_URL}/api/auth/google`, {
        credential: credentialResponse.credential
      });

      localStorage.setItem('token', response.data.token);
      
      Swal.fire({
        title: 'Google Login Berhasil! 🚀',
        text: 'Selamat datang di FeloAssistant.',
        icon: 'success',
        background: '#1e293b',
        color: '#f1f5f9',
        timer: 1500,
        showConfirmButton: false
      });

      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err: any) {
      setError('Gagal autentikasi via Google.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#070a13] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),rgba(255,255,255,0))] font-sans antialiased text-gray-100">
      
      {/* Top Navbar Header */}
      <header className="w-full bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-base font-bold shadow-md shadow-blue-500/30">
            🤖
          </div>
          <span className="font-extrabold text-sm tracking-wide text-white">
            FeloAssistant <span className="text-[10px] text-blue-400 font-semibold bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md ml-1">Auth Portal</span>
          </span>
        </div>
        
        <div className="flex items-center space-x-2 text-[11px] font-semibold text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>SYSTEM SECURE</span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 my-8">
        <div className="max-w-md w-full bg-[#1e293b]/80 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-slate-700/70 space-y-6 relative overflow-hidden">
          
          {/* Subtle Decorative Glows */}
          <div className="absolute -top-20 -right-20 w-44 h-44 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

          {/* Header & Logo */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-xl shadow-blue-500/25 mb-1">
              <span className="text-2xl">🤖</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Selamat Datang Kembali</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Masuk ke akun Anda untuk mengelola <span className="text-blue-400 font-semibold">4 Pilar & Momentum Score</span> FeloAssistant.
            </p>
          </div>

          {/* Alert Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-xs font-medium text-center backdrop-blur-sm animate-fadeIn">
              {error}
            </div>
          )}

          {/* Google Login Button */}
          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Login Google Gagal!')}
              useOneTap
              shape="pill"
              theme="filled_black"
              width="100%"
            />
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-slate-700/80 w-full"></div>
            <span className="bg-[#1e293b] px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider absolute">
              atau login manual
            </span>
          </div>

          {/* Login Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            
            {/* Email / Username Input */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Email atau Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@contoh.com atau username" 
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0f172a] border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-slate-200 placeholder-slate-500 text-xs transition duration-200 outline-none"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Kata Sandi</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-[#0f172a] border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-slate-200 placeholder-slate-500 text-xs transition duration-200 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a8.97 8.97 0 013.682-.863c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-4.692-4.692a3 3 0 00-4.243-4.243" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center space-x-2 text-slate-400 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500/50 cursor-pointer" 
                />
                <span>Ingat saya</span>
              </label>
              <button 
                type="button" 
                onClick={() => Swal.fire({ title: 'Info', text: 'Fitur reset sandi dikirim ke email kamu.', icon: 'info', background: '#1e293b', color: '#f1f5f9' })}
                className="text-blue-400 hover:text-blue-300 transition cursor-pointer"
              >
                Lupa sandi?
              </button>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 text-white font-bold py-2.5 rounded-xl transition duration-200 shadow-lg shadow-blue-600/30 text-xs tracking-wide uppercase mt-2 flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
            >
              {loading ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <span>Masuk Sekarang</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-700/40">
            Belum memiliki akun?{' '}
            <button 
              type="button"
              onClick={onNavigate} 
              className="text-blue-400 hover:text-blue-300 font-semibold hover:underline focus:outline-none cursor-pointer"
            >
              Daftar sekarang
            </button>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-slate-500 text-[11px]">
        FeloAssistant Workspace • AI-Driven Personal Productivity Platform
      </footer>
    </div>
  );
}