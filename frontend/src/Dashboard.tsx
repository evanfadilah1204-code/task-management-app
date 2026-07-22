import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

interface TodoItem {
  _id: string;
  taskName?: string;
  title?: string;
  subject?: string;
  deadline?: string;
  isCompleted?: boolean;
}

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  // Form State Tambah
  const [taskName, setTaskName] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');

  // State Edit
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [editTaskName, setEditTaskName] = useState<string>('');
  const [editSubject, setEditSubject] = useState<string>('');
  const [editDeadline, setEditDeadline] = useState<string>('');

  // State Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');

  // Data State
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loadingSubmit, setLoadingSubmit] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(false);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  const fetchTodos = async () => {
    setLoadingData(true);
    try {
      const res = await axios.get<TodoItem[]>('http://localhost:5000/api/todos', getHeaders());
      setTodos(res.data);
    } catch (err) {
      console.error('Gagal mengambil data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  // 1. Tambah Tugas
  const handleAddTodo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoadingSubmit(true);

    try {
      await axios.post(
        'http://localhost:5000/api/todos',
        { taskName, subject, deadline },
        getHeaders()
      );
      setTaskName('');
      setSubject('');
      setDeadline('');
      fetchTodos();

      Swal.fire({
        title: 'Berhasil!',
        text: 'Tugas baru berhasil ditambahkan.',
        icon: 'success',
        background: '#1e293b',
        color: '#f1f5f9',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        title: 'Gagal!',
        text: 'Gagal menambah tugas baru.',
        icon: 'error',
        background: '#1e293b',
        color: '#f1f5f9'
      });
    } finally {
      setLoadingSubmit(false);
    }
  };

  // 2. Toggle Ceklis (Status Selesai)
  const handleToggleComplete = async (id: string, currentStatus?: boolean) => {
    try {
      await axios.put(
        `http://localhost:5000/api/todos/${id}`,
        { isCompleted: !currentStatus },
        getHeaders()
      );
      fetchTodos();
    } catch (err) {
      Swal.fire({
        title: 'Error!',
        text: 'Gagal mengubah status tugas.',
        icon: 'error',
        background: '#1e293b',
        color: '#f1f5f9'
      });
    }
  };

  // 3. Buka Modal Edit
  const handleOpenEdit = (todo: TodoItem) => {
    setEditingTodo(todo);
    setEditTaskName(todo.taskName || todo.title || '');
    setEditSubject(todo.subject || '');
    if (todo.deadline) {
      const dateVal = new Date(todo.deadline).toISOString().split('T')[0];
      setEditDeadline(dateVal);
    } else {
      setEditDeadline('');
    }
  };

  // 4. Simpan Perubahan Edit
  const handleUpdateTodo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTodo) return;

    try {
      await axios.put(
        `http://localhost:5000/api/todos/${editingTodo._id}`,
        {
          taskName: editTaskName,
          subject: editSubject,
          deadline: editDeadline
        },
        getHeaders()
      );
      setEditingTodo(null);
      fetchTodos();

      Swal.fire({
        title: 'Diperbarui!',
        text: 'Data tugas berhasil diubah.',
        icon: 'success',
        background: '#1e293b',
        color: '#f1f5f9',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        title: 'Gagal!',
        text: 'Gagal memperbarui data tugas.',
        icon: 'error',
        background: '#1e293b',
        color: '#f1f5f9'
      });
    }
  };

  // 5. Hapus Tugas (Pakai SweetAlert2)
  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Yakin mau hapus, Boy?',
      text: 'Tugas yang dihapus gak bisa balik lagi lho!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      background: '#1e293b',
      color: '#f1f5f9'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/todos/${id}`, getHeaders());
        fetchTodos();

        Swal.fire({
          title: 'Terhapus!',
          text: 'Tugas berhasil dihapus.',
          icon: 'success',
          background: '#1e293b',
          color: '#f1f5f9',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (err) {
        Swal.fire({
          title: 'Gagal!',
          text: 'Gagal menghapus tugas.',
          icon: 'error',
          background: '#1e293b',
          color: '#f1f5f9'
        });
      }
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Cek Deadline Lewat (Overdue)
  const isOverdue = (deadlineStr?: string) => {
    if (!deadlineStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadlineStr);
    return deadlineDate < today;
  };

  // LOGIKA FITUR FILTER & SEARCH
  const filteredTodos = todos.filter((todo) => {
    const name = (todo.taskName || todo.title || '').toLowerCase();
    const subj = (todo.subject || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = name.includes(query) || subj.includes(query);

    if (filterStatus === 'active') return matchesSearch && !todo.isCompleted;
    if (filterStatus === 'completed') return matchesSearch && todo.isCompleted;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 pb-12 font-sans antialiased">
      {/* Navbar Dark Theme */}
      <nav className="sticky top-0 z-40 bg-[#1e293b]/90 backdrop-blur-md border-b border-slate-700/60 px-8 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600/20 border border-blue-500/30 p-2.5 rounded-xl text-blue-400 shadow-md flex items-center justify-center">
            <span className="text-xl leading-none">📝</span>
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-wide leading-tight">
              TASK MANAGEMENT
            </h1>
            <p className="text-[11px] text-blue-400 font-medium">Developer Mode • Evan</p>
          </div>
        </div>

        <button 
          onClick={() => { localStorage.removeItem('token'); onLogout(); }} 
          className="bg-slate-800 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-bold text-xs px-5 py-2.5 rounded-xl transition-all duration-200 border border-slate-700 hover:border-red-500/40 active:scale-95 cursor-pointer"
        >
          Keluar
        </button>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 mt-8 space-y-8">
        
        {/* FORM INPUT TUGAS */}
        <div className="bg-[#1e293b] rounded-2xl shadow-2xl p-6 border border-slate-700/60">
          <div className="mb-5">
            <h2 className="text-sm font-extrabold text-blue-400 uppercase tracking-wider">TAMBAH TUGAS BARU</h2>
            <p className="text-xs text-slate-400 mt-0.5">Catat tanggungan tugas lu biar ga kelupaan.</p>
          </div>
          
          <form onSubmit={handleAddTodo} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Nama Tugas / Deskripsi</label>
              <input 
                type="text" 
                value={taskName} 
                onChange={(e) => setTaskName(e.target.value)} 
                placeholder="Misal: Bikin CRUD Laravel..." 
                required 
                className="w-full px-4 py-2.5 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-gray-100 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" 
              />
            </div>
            
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Mata Pelajaran / Kuliah</label>
              <input 
                type="text" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                placeholder="Misal: Uprak Produktif" 
                required 
                className="w-full px-4 py-2.5 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-gray-100 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" 
              />
            </div>
            
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Tenggat Waktu</label>
                <input 
                  type="date" 
                  value={deadline} 
                  onChange={(e) => setDeadline(e.target.value)} 
                  required 
                  className="w-full px-4 py-2.5 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-gray-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all [color-scheme:dark]" 
                />
              </div>
              <button 
                type="submit" 
                disabled={loadingSubmit} 
                className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold h-[42px] px-6 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
              >
                {loadingSubmit ? '...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>

        {/* LIST TUGAS + SEARCH & FILTER BAR */}
        <div className="bg-[#1e293b] rounded-2xl shadow-2xl p-6 border border-slate-700/60">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b border-slate-700/60">
            <div>
              <h2 className="text-sm font-extrabold text-blue-400 uppercase tracking-wider">DAFTAR TUGAS AKTIF</h2>
              <p className="text-xs text-slate-400 mt-0.5">Menampilkan {filteredTodos.length} dari {todos.length} tugas.</p>
            </div>

            {/* TAB FILTER STATUS */}
            <div className="flex bg-[#0f172a] p-1 rounded-xl border border-slate-700/80 text-xs font-semibold">
              <button 
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${filterStatus === 'all' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                Semua
              </button>
              <button 
                onClick={() => setFilterStatus('active')}
                className={`px-3 py-1.5 rounded-lg transition-all ${filterStatus === 'active' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                Belum
              </button>
              <button 
                onClick={() => setFilterStatus('completed')}
                className={`px-3 py-1.5 rounded-lg transition-all ${filterStatus === 'completed' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                Selesai
              </button>
            </div>
          </div>

          {/* INPUT SEARCH BAR */}
          <div className="mb-5">
            <input 
              type="text" 
              placeholder="🔍 Cari tugas berdasarkan nama atau mata pelajaran..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0f172a] border border-slate-700 rounded-xl text-xs text-gray-100 placeholder-slate-500 outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {loadingData ? (
            <div className="text-center py-10 text-slate-400 text-sm">Memuat data tugas...</div>
          ) : filteredTodos.length === 0 ? (
            <div className="text-center py-12 bg-[#0f172a]/60 border border-dashed border-slate-700 rounded-2xl">
              <span className="text-3xl block mb-2">🔍</span>
              <p className="text-sm font-semibold text-slate-300">Tidak ada tugas ditemukan</p>
              <p className="text-xs text-slate-400 mt-1">Coba kata kunci lain atau ubah filter status di atas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTodos.map((todo) => {
                const isDone = todo.isCompleted;
                return (
                  <div 
                    key={todo._id} 
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                      isDone 
                        ? 'bg-[#0f172a]/50 border-slate-800 opacity-60' 
                        : 'bg-[#0f172a] border-slate-700/80 hover:border-slate-600 hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-center space-x-4 flex-1 min-w-0 pr-4">
                      {/* Checkbox Ceklis */}
                      <input 
                        type="checkbox" 
                        checked={isDone || false} 
                        onChange={() => handleToggleComplete(todo._id, todo.isCompleted)} 
                        className="w-5 h-5 accent-blue-500 rounded cursor-pointer"
                      />
                      
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-bold truncate ${isDone ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                          {todo.taskName || todo.title}
                        </p>
                        <div className="flex items-center space-x-2 mt-1 text-xs">
                          <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-semibold text-[10px]">
                            {todo.subject || 'Umum'}
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className={isDone ? 'text-slate-500' : 'text-rose-400 font-semibold'}>
                            📅 {formatDate(todo.deadline)}
                          </span>

                          {/* BADGE TERLAMBAT */}
                          {isOverdue(todo.deadline) && !isDone && (
                            <span className="bg-red-500/20 text-red-400 border border-red-500/50 px-2 py-0.5 rounded text-[10px] font-extrabold animate-pulse tracking-wide">
                              ⚠️ TERLAMBAT
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tombol Aksi: Edit & Hapus */}
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleOpenEdit(todo)} 
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all cursor-pointer"
                        title="Edit Tugas"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(todo._id)} 
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                        title="Hapus Tugas"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* MODAL EDIT TUGAS */}
      {editingTodo && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e293b] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-700 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-700/80 pb-3">
              <h3 className="font-extrabold text-blue-400 text-sm uppercase">EDIT TUGAS</h3>
              <button onClick={() => setEditingTodo(null)} className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleUpdateTodo} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Nama Tugas</label>
                <input 
                  type="text" 
                  value={editTaskName} 
                  onChange={(e) => setEditTaskName(e.target.value)} 
                  required 
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-gray-100 outline-none focus:border-blue-500" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Mata Pelajaran</label>
                <input 
                  type="text" 
                  value={editSubject} 
                  onChange={(e) => setEditSubject(e.target.value)} 
                  required 
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-gray-100 outline-none focus:border-blue-500" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Tenggat Waktu</label>
                <input 
                  type="date" 
                  value={editDeadline} 
                  onChange={(e) => setEditDeadline(e.target.value)} 
                  required 
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-gray-100 outline-none focus:border-blue-500 [color-scheme:dark]" 
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button 
                  type="button" 
                  onClick={() => setEditingTodo(null)} 
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}