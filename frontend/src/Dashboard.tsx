import { API_BASE_URL } from './config/api';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import AIChatWidget from './components/AIChatWidget';
import { useVoiceRecognition } from './utils/useVoiceRecognition';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendBrowserNotification,
  checkTaskDeadlinesNotification,
  checkHabitsNotification,
  checkTimeblocksNotification,
  checkExpensesNotification
} from './utils/notificationService';

interface TodoItem {
  _id: string;
  taskName?: string;
  title?: string;
  subject?: string;
  deadline?: string;
  isCompleted?: boolean;
}

interface HabitItem {
  _id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  checkedInToday: boolean;
}

interface TimeBlockItem {
  _id: string;
  title: string;
  startTime: string;
  endTime: string;
  category: string;
  isCompleted: boolean;
}

interface ExpenseItem {
  _id: string;
  amount: number;
  category: string;
  notes: string;
  date: string;
  isCompleted?: boolean;
}

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  // Navigation Tab State (4 Pilar Utama)
  const [activeTab, setActiveTab] = useState<'todos' | 'habits' | 'calendar' | 'finance'>('todos');

  // --- BROWSER WEB NOTIFICATION STATE ---
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');

  // --- PILAR 5: TELEGRAM NOTIFICATION STATE ---
  const [telegramChatId, setTelegramChatId] = useState<string>('');
  const [telegramNotificationsEnabled, setTelegramNotificationsEnabled] = useState<boolean>(true);
  const [botTokenConfigured, setBotTokenConfigured] = useState<boolean>(false);
  const [loadingTelegramSave, setLoadingTelegramSave] = useState<boolean>(false);
  const [loadingTestSend, setLoadingTestSend] = useState<boolean>(false);
  const [loadingDigestSend, setLoadingDigestSend] = useState<boolean>(false);

  // --- QUICK VOICE COMMAND STATE & HOOK ---
  const [voiceModalOpen, setVoiceModalOpen] = useState<boolean>(false);
  const [voicePrompt, setVoicePrompt] = useState<string>('');
  const [loadingVoiceAction, setLoadingVoiceAction] = useState<boolean>(false);

  const {
    isListening: isDashVoiceListening,
    transcript: dashVoiceTranscript,
    isSupported: isDashVoiceSupported,
    errorMessage: dashVoiceError,
    startListening: startDashVoiceListening,
    stopListening: stopDashVoiceListening
  } = useVoiceRecognition({
    lang: 'id-ID',
    onResult: (text) => {
      setVoicePrompt(text);
    }
  });

  // --- PILAR 1: TODO TASKS STATE ---
  const [taskName, setTaskName] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [editTaskName, setEditTaskName] = useState<string>('');
  const [editSubject, setEditSubject] = useState<string>('');
  const [editDeadline, setEditDeadline] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [loadingSubmit, setLoadingSubmit] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(false);

  // --- PILAR 2: HABITS STATE ---
  const [habitName, setHabitName] = useState<string>('');
  const [habitFreq, setHabitFreq] = useState<'daily' | 'weekly'>('daily');
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [editingHabit, setEditingHabit] = useState<HabitItem | null>(null);
  const [editHabitName, setEditHabitName] = useState<string>('');
  const [editHabitFreq, setEditHabitFreq] = useState<'daily' | 'weekly'>('daily');

  // --- PILAR 3: TIMEBLOCKS / CALENDAR STATE ---
  const [tbTitle, setTbTitle] = useState<string>('');
  const [tbStart, setTbStart] = useState<string>('09:00');
  const [tbEnd, setTbEnd] = useState<string>('10:30');
  const [tbCategory, setTbCategory] = useState<string>('Akademik');
  const [timeblocks, setTimeblocks] = useState<TimeBlockItem[]>([]);
  const [editingTimeBlock, setEditingTimeBlock] = useState<TimeBlockItem | null>(null);
  const [editTbTitle, setEditTbTitle] = useState<string>('');
  const [editTbStart, setEditTbStart] = useState<string>('09:00');
  const [editTbEnd, setEditTbEnd] = useState<string>('10:30');
  const [editTbCategory, setEditTbCategory] = useState<string>('Akademik');

  // --- PILAR 4: EXPENSES / FINANCE STATE ---
  const [expAmount, setExpAmount] = useState<string>('');
  const [expCategory, setExpCategory] = useState<string>('Makanan');
  const [expNotes, setExpNotes] = useState<string>('');
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [editExpAmount, setEditExpAmount] = useState<string>('');
  const [editExpCategory, setEditExpCategory] = useState<string>('Makanan');
  const [editExpNotes, setEditExpNotes] = useState<string>('');

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  // --- API FETCH ALL DATA FROM MONGODB ---
  const fetchTodos = async () => {
    setLoadingData(true);
    try {
      const res = await axios.get<TodoItem[]>(`${API_BASE_URL}/api/todos`, getHeaders());
      if (Array.isArray(res.data)) setTodos(res.data);
    } catch (err) {
      setTodos([]);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchHabits = async () => {
    try {
      const res = await axios.get<HabitItem[]>(`${API_BASE_URL}/api/habits`, getHeaders());
      if (Array.isArray(res.data)) setHabits(res.data);
    } catch (err) {
      setHabits([]);
    }
  };

  const fetchTimeBlocks = async () => {
    try {
      const res = await axios.get<TimeBlockItem[]>(`${API_BASE_URL}/api/timeblocks`, getHeaders());
      if (Array.isArray(res.data)) setTimeblocks(res.data);
    } catch (err) {
      setTimeblocks([]);
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await axios.get<ExpenseItem[]>(`${API_BASE_URL}/api/expenses`, getHeaders());
      if (Array.isArray(res.data)) setExpenses(res.data);
    } catch (err) {
      setExpenses([]);
    }
  };

  const fetchTelegramSettings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/telegram/settings`, getHeaders());
      if (res.data.success) {
        setTelegramChatId(res.data.telegramChatId || '');
        setTelegramNotificationsEnabled(res.data.telegramNotificationsEnabled ?? true);
        setBotTokenConfigured(res.data.botTokenConfigured);
      }
    } catch (err) {
      console.error('Gagal mengambil pengaturan Telegram');
    }
  };

  const fetchAllData = () => {
    fetchTodos();
    fetchHabits();
    fetchTimeBlocks();
    fetchExpenses();
    fetchTelegramSettings();
  };

  useEffect(() => {
    fetchAllData();
    setNotifPermission(getNotificationPermission());
  }, []);

  useEffect(() => {
    if (todos.length > 0) {
      checkTaskDeadlinesNotification(todos);
    }
  }, [todos]);

  useEffect(() => {
    if (habits.length > 0) {
      checkHabitsNotification(habits);
    }
  }, [habits]);

  useEffect(() => {
    if (timeblocks.length > 0) {
      checkTimeblocksNotification(timeblocks);
    }
  }, [timeblocks]);

  useEffect(() => {
    checkExpensesNotification(expenses);
  }, [expenses]);

  // --- HANDLERS FOR BROWSER WEB NOTIFICATIONS ---
  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotifPermission(getNotificationPermission());
    if (granted) {
      Swal.fire({
        title: 'Notifikasi Berhasil Diaktifkan! 🎉',
        text: 'Pengingat tugas sekarang akan muncul langsung di layar Anda.',
        icon: 'success',
        background: '#1e293b',
        color: '#f1f5f9',
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  const handleTestNotification = () => {
    sendBrowserNotification('🧪 Tes Notifikasi FeloAssistant', {
      body: 'Ini adalah contoh tampilan pengingat pop-up di layar Laptop / HP Anda!'
    });
  };

  // --- MOMENTUM SCORE CALCULATOR (Direct Simple Percentage: Completed / Total) ---
  const totalAllItems = todos.length + habits.length + timeblocks.length;
  const completedAllItems = 
    todos.filter(t => Boolean(t.isCompleted)).length + 
    habits.filter(h => Boolean(h.checkedInToday)).length + 
    timeblocks.filter(tb => Boolean(tb.isCompleted)).length;
  
  const momentumScore = totalAllItems > 0 
    ? Math.round((completedAllItems / totalAllItems) * 100) 
    : 0;
  const totalExpenseAmount = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);

  // --- HANDLERS FOR PILAR 1: TODOS ---
  const handleAddTodo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoadingSubmit(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/todos`,
        { taskName, subject, deadline },
        getHeaders()
      );
      setTodos(prev => [...prev, res.data]);
    } catch (err) {
      const newTodo: TodoItem = {
        _id: Date.now().toString(),
        taskName,
        subject,
        deadline,
        isCompleted: false
      };
      setTodos(prev => [newTodo, ...prev]);
    } finally {
      setTaskName('');
      setSubject('');
      setDeadline('');
      setLoadingSubmit(false);
      Swal.fire({
        title: 'Berhasil!',
        text: 'Tugas baru berhasil ditambahkan.',
        icon: 'success',
        background: '#1e293b',
        color: '#f1f5f9',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const handleToggleComplete = async (id: string, currentStatus?: boolean) => {
    try {
      await axios.put(`${API_BASE_URL}/api/todos/${id}`, { isCompleted: !currentStatus }, getHeaders());
    } catch (err) {
      // Local fallback toggle
    }
    setTodos(prev => prev.map(t => t._id === id ? { ...t, isCompleted: !currentStatus } : t));
  };

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

  const handleUpdateTodo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTodo) return;
    try {
      await axios.put(
        `${API_BASE_URL}/api/todos/${editingTodo._id}`,
        { taskName: editTaskName, subject: editSubject, deadline: editDeadline },
        getHeaders()
      );
    } catch (err) {
      // Fallback update
    }
    setTodos(prev => prev.map(t => t._id === editingTodo._id ? {
      ...t,
      taskName: editTaskName,
      title: editTaskName,
      subject: editSubject,
      deadline: editDeadline
    } : t));
    setEditingTodo(null);
    Swal.fire({
      title: 'Diperbarui!',
      text: 'Data tugas berhasil diubah.',
      icon: 'success',
      background: '#1e293b',
      color: '#f1f5f9',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Apakah kamu yakin?',
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
        await axios.delete(`${API_BASE_URL}/api/todos/${id}`, getHeaders());
      } catch (err) {
        // Fallback delete
      }
      setTodos(prev => prev.filter(t => t._id !== id));
      Swal.fire({
        title: 'Terhapus!',
        text: 'Tugas berhasil dihapus.',
        icon: 'success',
        background: '#1e293b',
        color: '#f1f5f9',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  // --- HANDLERS FOR PILAR 2: HABITS ---
  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;
    try {
      const res = await axios.post<HabitItem>(`${API_BASE_URL}/api/habits`, { name: habitName, frequency: habitFreq }, getHeaders());
      setHabits(prev => [res.data, ...prev]);
    } catch (err) {
      const newHabit: HabitItem = {
        _id: Date.now().toString(),
        name: habitName,
        frequency: habitFreq,
        streak: 0,
        checkedInToday: false
      };
      setHabits(prev => [newHabit, ...prev]);
    }
    setHabitName('');
    Swal.fire({
      title: 'Habit Ditambahkan!',
      text: 'Mari konsisten bangun kebiasaan positif!',
      icon: 'success',
      background: '#1e293b',
      color: '#f1f5f9',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleToggleHabitCheckIn = async (id: string) => {
    try {
      const res = await axios.put<HabitItem>(`${API_BASE_URL}/api/habits/${id}/checkin`, {}, getHeaders());
      setHabits(prev => prev.map(h => h._id === id ? res.data : h));
    } catch (err) {
      setHabits(prev => prev.map(h => {
        if (h._id === id) {
          const nextChecked = !h.checkedInToday;
          return {
            ...h,
            checkedInToday: nextChecked,
            streak: nextChecked ? h.streak + 1 : Math.max(0, h.streak - 1)
          };
        }
        return h;
      }));
    }
  };

  const handleOpenEditHabit = (habit: HabitItem) => {
    setEditingHabit(habit);
    setEditHabitName(habit.name);
    setEditHabitFreq(habit.frequency);
  };

  const handleUpdateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHabit) return;
    try {
      await axios.put(`${API_BASE_URL}/api/habits/${editingHabit._id}`, {
        name: editHabitName,
        frequency: editHabitFreq
      }, getHeaders());
    } catch (err) {
      // Fallback
    }
    setHabits(prev => prev.map(h => h._id === editingHabit._id ? {
      ...h,
      name: editHabitName,
      frequency: editHabitFreq
    } : h));
    setEditingHabit(null);
    Swal.fire({
      title: 'Habit Diperbarui!',
      text: 'Data habit berhasil diubah.',
      icon: 'success',
      background: '#1e293b',
      color: '#f1f5f9',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleDeleteHabit = async (id: string) => {
    const result = await Swal.fire({
      title: 'Apakah kamu yakin?',
      text: 'Data habit ini akan dihapus secara permanen!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d97706',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      background: '#1e293b',
      color: '#f1f5f9'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/api/habits/${id}`, getHeaders());
      } catch (err) {
        // Fallback local
      }
      setHabits(prev => prev.filter(h => h._id !== id));
      Swal.fire({
        title: 'Terhapus!',
        text: 'Habit berhasil dihapus.',
        icon: 'success',
        background: '#1e293b',
        color: '#f1f5f9',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  // --- HANDLERS FOR PILAR 3: TIMEBLOCKS ---
  const handleAddTimeBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tbTitle.trim()) return;
    try {
      const res = await axios.post<TimeBlockItem>(`${API_BASE_URL}/api/timeblocks`, {
        title: tbTitle,
        startTime: tbStart,
        endTime: tbEnd,
        category: tbCategory
      }, getHeaders());
      setTimeblocks(prev => [...prev, res.data]);
    } catch (err) {
      const newTB: TimeBlockItem = {
        _id: Date.now().toString(),
        title: tbTitle,
        startTime: tbStart,
        endTime: tbEnd,
        category: tbCategory || 'Umum',
        isCompleted: false
      };
      setTimeblocks(prev => [...prev, newTB]);
    }
    setTbTitle('');
    Swal.fire({
      title: 'Jadwal Ditambahkan!',
      text: 'Timeblock berhasil diset.',
      icon: 'success',
      background: '#1e293b',
      color: '#f1f5f9',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleToggleTimeBlock = async (id: string) => {
    try {
      const res = await axios.put<TimeBlockItem>(`${API_BASE_URL}/api/timeblocks/${id}/toggle`, {}, getHeaders());
      setTimeblocks(prev => prev.map(tb => tb._id === id ? res.data : tb));
    } catch (err) {
      setTimeblocks(prev => prev.map(tb => tb._id === id ? { ...tb, isCompleted: !tb.isCompleted } : tb));
    }
  };

  const handleOpenEditTimeBlock = (tb: TimeBlockItem) => {
    setEditingTimeBlock(tb);
    setEditTbTitle(tb.title);
    setEditTbStart(tb.startTime);
    setEditTbEnd(tb.endTime);
    setEditTbCategory(tb.category);
  };

  const handleUpdateTimeBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTimeBlock) return;
    try {
      await axios.put(`${API_BASE_URL}/api/timeblocks/${editingTimeBlock._id}`, {
        title: editTbTitle,
        startTime: editTbStart,
        endTime: editTbEnd,
        category: editTbCategory
      }, getHeaders());
    } catch (err) {
      // Fallback
    }
    setTimeblocks(prev => prev.map(tb => tb._id === editingTimeBlock._id ? {
      ...tb,
      title: editTbTitle,
      startTime: editTbStart,
      endTime: editTbEnd,
      category: editTbCategory
    } : tb));
    setEditingTimeBlock(null);
    Swal.fire({
      title: 'Jadwal Diperbarui!',
      text: 'Timeblock berhasil diubah.',
      icon: 'success',
      background: '#1e293b',
      color: '#f1f5f9',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleDeleteTimeBlock = async (id: string) => {
    const result = await Swal.fire({
      title: 'Apakah kamu yakin?',
      text: 'Jadwal ini akan dihapus secara permanen!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      background: '#1e293b',
      color: '#f1f5f9'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/api/timeblocks/${id}`, getHeaders());
      } catch (err) {
        // Fallback local
      }
      setTimeblocks(prev => prev.filter(tb => tb._id !== id));
      Swal.fire({
        title: 'Terhapus!',
        text: 'Jadwal berhasil dihapus.',
        icon: 'success',
        background: '#1e293b',
        color: '#f1f5f9',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  // --- HANDLERS FOR PILAR 4: EXPENSES ---
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(expAmount);
    if (!val || val <= 0) return;
    try {
      const res = await axios.post<ExpenseItem>(`${API_BASE_URL}/api/expenses`, {
        amount: val,
        category: expCategory,
        notes: expNotes
      }, getHeaders());
      setExpenses(prev => [res.data, ...prev]);
    } catch (err) {
      const newExp: ExpenseItem = {
        _id: Date.now().toString(),
        amount: val,
        category: expCategory,
        notes: expNotes,
        date: new Date().toISOString().split('T')[0]
      };
      setExpenses(prev => [newExp, ...prev]);
    }
    setExpAmount('');
    setExpNotes('');
    Swal.fire({
      title: 'Pengeluaran Dicatat!',
      text: `Rp ${val.toLocaleString('id-ID')} berhasil disimpan.`,
      icon: 'success',
      background: '#1e293b',
      color: '#f1f5f9',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleOpenEditExpense = (exp: ExpenseItem) => {
    setEditingExpense(exp);
    setEditExpAmount(exp.amount.toString());
    setEditExpCategory(exp.category);
    setEditExpNotes(exp.notes);
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    const val = Number(editExpAmount);
    try {
      await axios.put(`${API_BASE_URL}/api/expenses/${editingExpense._id}`, {
        amount: val,
        category: editExpCategory,
        notes: editExpNotes
      }, getHeaders());
    } catch (err) {
      // Fallback
    }
    setExpenses(prev => prev.map(exp => exp._id === editingExpense._id ? {
      ...exp,
      amount: val,
      category: editExpCategory,
      notes: editExpNotes
    } : exp));
    setEditingExpense(null);
    Swal.fire({
      title: 'Pengeluaran Diperbarui!',
      text: 'Catatan pengeluaran berhasil diubah.',
      icon: 'success',
      background: '#1e293b',
      color: '#f1f5f9',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleDeleteExpense = async (id: string) => {
    const result = await Swal.fire({
      title: 'Apakah kamu yakin?',
      text: 'Catatan pengeluaran ini akan dihapus secara permanen!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      background: '#1e293b',
      color: '#f1f5f9'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/api/expenses/${id}`, getHeaders());
      } catch (err) {
        // Fallback local
      }
      setExpenses(prev => prev.filter(e => e._id !== id));
      Swal.fire({
        title: 'Terhapus!',
        text: 'Catatan pengeluaran berhasil dihapus.',
        icon: 'success',
        background: '#1e293b',
        color: '#f1f5f9',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const handleToggleExpense = (id: string) => {
    setExpenses(prev => prev.map(exp => exp._id === id ? { ...exp, isCompleted: !exp.isCompleted } : exp));
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const isOverdue = (deadlineStr?: string) => {
    if (!deadlineStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadlineStr);
    return deadlineDate < today;
  };

  const filteredTodos = todos.filter((todo) => {
    const name = (todo.taskName || todo.title || '').toLowerCase();
    const subj = (todo.subject || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = name.includes(query) || subj.includes(query);

    if (filterStatus === 'active') return matchesSearch && !todo.isCompleted;
    if (filterStatus === 'completed') return matchesSearch && todo.isCompleted;
    return matchesSearch;
  });

  // --- HANDLERS FOR TELEGRAM NOTIFICATIONS ---
  const handleSaveTelegramSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingTelegramSave(true);
    try {
      const res = await axios.put(`${API_BASE_URL}/api/telegram/settings`, {
        telegramChatId,
        telegramNotificationsEnabled
      }, getHeaders());
      if (res.data.success) {
        Swal.fire({
          title: 'Tersimpan!',
          text: 'Pengaturan Notifikasi Telegram berhasil disimpan.',
          icon: 'success',
          background: '#1e293b',
          color: '#f1f5f9',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (err: any) {
      Swal.fire({
        title: 'Gagal Menyimpan',
        text: err.response?.data?.message || 'Terjadi kesalahan saat menyimpan settings',
        icon: 'error',
        background: '#1e293b',
        color: '#f1f5f9'
      });
    } finally {
      setLoadingTelegramSave(false);
    }
  };

  const handleTestSendTelegram = async () => {
    if (!telegramChatId.trim()) {
      Swal.fire({
        title: 'Chat ID Kosong',
        text: 'Masukkan Telegram Chat ID terlebih dahulu!',
        icon: 'warning',
        background: '#1e293b',
        color: '#f1f5f9'
      });
      return;
    }
    setLoadingTestSend(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/telegram/test-send`, {}, getHeaders());
      if (res.data.success) {
        Swal.fire({
          title: 'Pesan Terkirim! 🎉',
          text: 'Silakan cek aplikasi Telegram di HP/Laptop kamu!',
          icon: 'success',
          background: '#1e293b',
          color: '#f1f5f9'
        });
      }
    } catch (err: any) {
      Swal.fire({
        title: 'Gagal Kirim Pesan',
        text: err.response?.data?.message || 'Gagal mengirim pesan uji coba',
        icon: 'error',
        background: '#1e293b',
        color: '#f1f5f9'
      });
    } finally {
      setLoadingTestSend(false);
    }
  };

  const handleTriggerDigest = async () => {
    if (!telegramChatId.trim()) {
      Swal.fire({
        title: 'Chat ID Kosong',
        text: 'Masukkan Telegram Chat ID terlebih dahulu!',
        icon: 'warning',
        background: '#1e293b',
        color: '#f1f5f9'
      });
      return;
    }
    setLoadingDigestSend(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/telegram/trigger-digest`, {}, getHeaders());
      if (res.data.success) {
        Swal.fire({
          title: 'Rangkuman Harian Terkirim! 🚀',
          text: 'Agenda harianmu berhasil dikirimkan ke Telegram.',
          icon: 'success',
          background: '#1e293b',
          color: '#f1f5f9'
        });
      }
    } catch (err: any) {
      Swal.fire({
        title: 'Gagal Kirim Rangkuman',
        text: err.response?.data?.message || 'Gagal mengirim rangkuman harian',
        icon: 'error',
        background: '#1e293b',
        color: '#f1f5f9'
      });
    } finally {
      setLoadingDigestSend(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 pb-12 font-sans antialiased">
      {/* NAVBAR MODERN */}
      <nav className="sticky top-0 z-40 bg-[#1e293b]/90 backdrop-blur-md border-b border-slate-700/60 px-6 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/20 flex items-center justify-center">
            <span className="text-xl leading-none">🤖</span>
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-wide leading-tight flex items-center gap-2">
              FeloAssistant
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Sistem Manajemen Produktivitas Personal & AI</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Tombol Quick Voice Command */}
          <button
            onClick={() => setVoiceModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-red-500/20 via-purple-500/20 to-indigo-500/20 hover:from-red-500/30 hover:to-indigo-500/30 text-red-300 border border-red-500/40 rounded-xl text-xs font-extrabold transition-all active:scale-95 cursor-pointer flex items-center gap-2 shadow-md shadow-red-950/40"
            title="Jalankan Perintah Suara Cepat (Mic)"
          >
            <span className="text-base animate-pulse">🎙️</span>
            <span className="hidden sm:inline">Perintah Suara</span>
          </button>

          {notifPermission === 'granted' ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Notifikasi Browser Aktif
            </span>
          ) : (
            <button 
              onClick={handleEnableNotifications}
              className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-extrabold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 animate-pulse"
              title="Aktifkan Pengingat Pop-up di Layar"
            >
              <span>🔔</span> Aktifkan Notifikasi Browser
            </button>
          )}

          <button 
            onClick={() => { localStorage.removeItem('token'); onLogout(); }} 
            className="bg-slate-800 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-all duration-200 border border-slate-700 hover:border-red-500/40 active:scale-95 cursor-pointer"
          >
            Keluar
          </button>
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <div className="max-w-5xl mx-auto px-6 mt-8 space-y-6">
        
        {/* STATS & MOMENTUM CARD */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Momentum / Target Score Card */}
          <div className="bg-gradient-to-br from-indigo-900/60 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">🎯 Target Hari Ini</span>
              <span className="text-xl font-extrabold text-indigo-400">{momentumScore}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${momentumScore}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              {totalAllItems === 0 ? 'Belum ada kegiatan hari ini' : `${completedAllItems} dari ${totalAllItems} kegiatan selesai`}
            </p>
          </div>

          {/* Stat Todo */}
          <div className="bg-[#1e293b] border border-slate-700/60 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl font-bold">📝</div>
              <div>
                <div className="text-lg font-extrabold text-white">{todos.filter(t => Boolean(t.isCompleted)).length} / {todos.length}</div>
                <div className="text-[11px] text-slate-400 font-medium">Tugas Selesai</div>
              </div>
            </div>
          </div>

          {/* Stat Habit */}
          <div className="bg-[#1e293b] border border-slate-700/60 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl font-bold">⚡</div>
              <div>
                <div className="text-lg font-extrabold text-white">{habits.filter(h => Boolean(h.checkedInToday)).length} / {habits.length}</div>
                <div className="text-[11px] text-slate-400 font-medium">Habit Check-in Hari Ini</div>
              </div>
            </div>
          </div>

          {/* Stat Expense */}
          <div className="bg-[#1e293b] border border-slate-700/60 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl font-bold">💰</div>
              <div>
                <div className="text-lg font-extrabold text-rose-300">Rp {totalExpenseAmount.toLocaleString('id-ID')}</div>
                <div className="text-[11px] text-slate-400 font-medium">Total Pengeluaran</div>
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS (4 PILAR UTAMA) */}
        <div className="flex bg-[#1e293b] p-1.5 rounded-2xl border border-slate-700/60 gap-2">
          <button 
            onClick={() => setActiveTab('todos')}
            className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'todos' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📝</span> Tugas (Todos)
          </button>
          <button 
            onClick={() => setActiveTab('habits')}
            className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'habits' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>⚡</span> Kebiasaan (Habit)
          </button>
          <button 
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'calendar' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📅</span> Jadwal (Timeblock)
          </button>
          <button 
            onClick={() => setActiveTab('finance')}
            className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'finance' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>💰</span> Keuangan
          </button>
        </div>

        {/* TAB 1: TODO TASKS */}
        {activeTab === 'todos' && (
          <div className="space-y-6">
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
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterStatus === 'all' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    Semua
                  </button>
                  <button 
                    onClick={() => setFilterStatus('active')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterStatus === 'active' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    Belum
                  </button>
                  <button 
                    onClick={() => setFilterStatus('completed')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterStatus === 'completed' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
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

                              {isOverdue(todo.deadline) && !isDone && (
                                <span className="bg-red-500/20 text-red-400 border border-red-500/50 px-2 py-0.5 rounded text-[10px] font-extrabold animate-pulse tracking-wide">
                                  ⚠️ TERLAMBAT
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

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
        )}

        {/* TAB 2: HABITS */}
        {activeTab === 'habits' && (
          <div className="space-y-6">
            <div className="bg-[#1e293b] rounded-2xl shadow-2xl p-6 border border-slate-700/60">
              <div className="mb-5">
                <h2 className="text-sm font-extrabold text-amber-400 uppercase tracking-wider">TAMBAH KEBIASAAN (HABIT) BARU</h2>
                <p className="text-xs text-slate-400 mt-0.5">Bangun rutinitas positif secara konsisten setiap hari.</p>
              </div>

              <form onSubmit={handleAddHabit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Nama Kebiasaan</label>
                  <input 
                    type="text" 
                    value={habitName} 
                    onChange={(e) => setHabitName(e.target.value)} 
                    placeholder="Contoh: Olahraga Pagi 15 Menit" 
                    required 
                    className="w-full px-4 py-2.5 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-gray-100 outline-none focus:border-amber-500" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Frekuensi</label>
                  <select 
                    value={habitFreq} 
                    onChange={(e) => setHabitFreq(e.target.value as 'daily' | 'weekly')}
                    className="w-full px-4 py-2.5 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-gray-100 outline-none focus:border-amber-500"
                  >
                    <option value="daily">Harian (Daily)</option>
                    <option value="weekly">Mingguan (Weekly)</option>
                  </select>
                </div>
                <button type="submit" className="bg-amber-600 hover:bg-amber-500 font-bold h-[42px] px-6 rounded-xl text-sm text-white transition-all cursor-pointer">
                  + Simpan Habit
                </button>
              </form>
            </div>

            <div className="bg-[#1e293b] rounded-2xl shadow-2xl p-6 border border-slate-700/60">
              <h2 className="text-sm font-extrabold text-amber-400 uppercase tracking-wider mb-4">PELAKSANAAN HABIT & STREAK</h2>
              {habits.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">Belum ada habit. Tambahkan habit pertamamu di atas!</div>
              ) : (
                <div className="space-y-3">
                  {habits.map(h => (
                    <div 
                      key={h._id} 
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                        h.checkedInToday 
                          ? 'bg-[#0f172a]/50 border-slate-800 opacity-60' 
                          : 'bg-[#0f172a] border-slate-700/80 hover:border-slate-600 hover:shadow-lg'
                      }`}
                    >
                      <div className="flex items-center space-x-4 flex-1 min-w-0 pr-4">
                        <input 
                          type="checkbox" 
                          checked={h.checkedInToday} 
                          onChange={() => handleToggleHabitCheckIn(h._id)} 
                          className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-bold truncate ${h.checkedInToday ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                              {h.name}
                            </p>
                            <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-extrabold">
                              🔥 {h.streak} Hari Beruntun
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1">Frekuensi: {h.frequency === 'daily' ? 'Harian' : 'Mingguan'}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleOpenEditHabit(h)}
                          className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all cursor-pointer"
                          title="Edit Habit"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDeleteHabit(h._id)} 
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer" 
                          title="Hapus Habit"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CALENDAR / TIMEBLOCKS */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <div className="bg-[#1e293b] rounded-2xl shadow-2xl p-6 border border-slate-700/60">
              <div className="mb-5">
                <h2 className="text-sm font-extrabold text-indigo-400 uppercase tracking-wider">JADWALKAN BLOK WAKTU (TIMEBLOCK)</h2>
                <p className="text-xs text-slate-400 mt-0.5">Alokasikan waktu fokus untuk setiap aktivitas penting.</p>
              </div>

              <form onSubmit={handleAddTimeBlock} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Kegiatan</label>
                  <input 
                    type="text" 
                    value={tbTitle} 
                    onChange={(e) => setTbTitle(e.target.value)} 
                    placeholder="Bimbingan Dosen..." 
                    required 
                    className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-gray-100 outline-none focus:border-indigo-500" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Mulai</label>
                  <input 
                    type="time" 
                    value={tbStart} 
                    onChange={(e) => setTbStart(e.target.value)} 
                    required 
                    className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-gray-100 outline-none [color-scheme:dark]" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Selesai</label>
                  <input 
                    type="time" 
                    value={tbEnd} 
                    onChange={(e) => setTbEnd(e.target.value)} 
                    required 
                    className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-gray-100 outline-none [color-scheme:dark]" 
                  />
                </div>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 font-bold h-[38px] px-4 rounded-xl text-xs text-white cursor-pointer">
                  + Jadwalkan
                </button>
              </form>
            </div>

            <div className="bg-[#1e293b] rounded-2xl shadow-2xl p-6 border border-slate-700/60">
              <h2 className="text-sm font-extrabold text-indigo-400 uppercase tracking-wider mb-4">AGENDA TIMEBLOCK HARI INI</h2>
              {timeblocks.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">Belum ada blok waktu terjadwal hari ini.</div>
              ) : (
                <div className="space-y-3">
                  {timeblocks.map(tb => (
                    <div key={tb._id} className="flex items-center justify-between p-4 bg-[#0f172a] border border-slate-700/80 rounded-xl">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          checked={tb.isCompleted} 
                          onChange={() => handleToggleTimeBlock(tb._id)} 
                          className="w-5 h-5 accent-indigo-500 rounded cursor-pointer"
                        />
                        <div>
                          <p className={`text-sm font-bold ${tb.isCompleted ? 'line-through text-slate-500' : 'text-white'}`}>{tb.title}</p>
                          <div className="text-xs text-indigo-400 mt-0.5">⏰ {tb.startTime} - {tb.endTime} • <span className="text-slate-400">{tb.category}</span></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleOpenEditTimeBlock(tb)}
                          className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all cursor-pointer"
                          title="Edit Jadwal"
                        >
                          ✏️
                        </button>
                        <button onClick={() => handleDeleteTimeBlock(tb._id)} className="text-slate-500 hover:text-red-400 p-2 cursor-pointer" title="Hapus Jadwal">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: EXPENSES / FINANCE */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="bg-[#1e293b] rounded-2xl shadow-2xl p-6 border border-slate-700/60">
              <div className="mb-5">
                <h2 className="text-sm font-extrabold text-rose-400 uppercase tracking-wider">CATAT PENGELUARAN KEUANGAN</h2>
                <p className="text-xs text-slate-400 mt-0.5">Kelola keuangan dan kontrol pengeluaran harianmu.</p>
              </div>

              <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Nominal (Rp)</label>
                  <input 
                    type="number" 
                    value={expAmount} 
                    onChange={(e) => setExpAmount(e.target.value)} 
                    placeholder="50000" 
                    required 
                    className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-gray-100 outline-none focus:border-rose-500" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Kategori</label>
                  <select 
                    value={expCategory} 
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-gray-100 outline-none focus:border-rose-500"
                  >
                    <option value="Makanan">Makanan & Minuman</option>
                    <option value="Transportasi">Transportasi</option>
                    <option value="Pendidikan">Pendidikan & Uprak</option>
                    <option value="Hiburan">Hiburan & Belanja</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Catatan</label>
                  <input 
                    type="text" 
                    value={expNotes} 
                    onChange={(e) => setExpNotes(e.target.value)} 
                    placeholder="Makan siang padang..." 
                    className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-gray-100 outline-none focus:border-rose-500" 
                  />
                </div>
                <button type="submit" className="bg-rose-600 hover:bg-rose-500 font-bold h-[38px] px-4 rounded-xl text-xs text-white cursor-pointer">
                  + Simpan Pengeluaran
                </button>
              </form>
            </div>

            <div className="bg-[#1e293b] rounded-2xl shadow-2xl p-6 border border-slate-700/60">
              <h2 className="text-sm font-extrabold text-rose-400 uppercase tracking-wider mb-4">RIWAYAT PENGELUARAN</h2>
              {expenses.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">Belum ada catatan pengeluaran.</div>
              ) : (
                <div className="space-y-3">
                  {expenses.map(exp => (
                    <div 
                      key={exp._id} 
                      className="flex items-center justify-between p-4 bg-[#0f172a] border border-slate-700/80 rounded-xl hover:border-slate-600 transition-all shadow-md"
                    >
                      <div>
                        <div className="text-sm font-extrabold text-rose-400">Rp {exp.amount.toLocaleString('id-ID')}</div>
                        <div className="text-xs text-slate-400 mt-1">📁 {exp.category} • {exp.notes || 'Tanpa Catatan'}</div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleOpenEditExpense(exp)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                          title="Edit Pengeluaran"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDeleteExpense(exp._id)} 
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer" 
                          title="Hapus Pengeluaran"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: TELEGRAM NOTIFICATIONS */}
        {activeTab === 'telegram' && (
          <div className="space-y-6">
            {/* CARD STATUS & CARA PENGGUNAAN */}
            <div className="bg-[#1e293b] rounded-2xl shadow-2xl p-6 border border-slate-700/60 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-700/80 pb-4 gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-cyan-400 flex items-center gap-2">
                    ✈️ Integrasi Pengingat Otomatis via Telegram Bot
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Dapatkan rangkuman agenda harian (07:00 AM) & peringatan tenggat waktu tugas langsung ke Telegram milikmu.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${
                    telegramChatId ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                    {telegramChatId ? 'Tersambung (Chat ID Active)' : 'Belum Terhubung'}
                  </span>
                </div>
              </div>

              {/* CARD PANDUAN DENGAN BORDER GRADIEN */}
              <div className="bg-slate-900/80 rounded-xl p-5 border border-cyan-500/30 space-y-3">
                <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                  📖 CARA MENGHUBUNGKAN BOT TELEGRAM (HANYA 1 MENIT)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300 pt-1">
                  <div className="bg-[#1e293b] p-3.5 rounded-xl border border-slate-700">
                    <span className="font-extrabold text-cyan-400 block mb-1">1. Cari Bot di Telegram</span>
                    Buka Telegram HP/Laptop, cari bot <code className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded">@myidbot</code> atau Bot FeloAssistant milikmu.
                  </div>
                  <div className="bg-[#1e293b] p-3.5 rounded-xl border border-slate-700">
                    <span className="font-extrabold text-cyan-400 block mb-1">2. Ambil Chat ID</span>
                    Kirim pesan <code className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded">/getid</code> ke bot. Salin deretan angka <b>Chat ID</b> yang diberikan (contoh: <code>123456789</code>).
                  </div>
                  <div className="bg-[#1e293b] p-3.5 rounded-xl border border-slate-700">
                    <span className="font-extrabold text-cyan-400 block mb-1">3. Simpan & Uji Coba</span>
                    Tempelkan Chat ID di form di bawah, lalu klik <b>Simpan</b> dan lakukan pengujian pengiriman pesan!
                  </div>
                </div>
              </div>

              {/* FORM PENGATURAN CHAT ID */}
              <form onSubmit={handleSaveTelegramSettings} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Telegram Chat ID Kamu
                    </label>
                    <input 
                      type="text" 
                      placeholder="Contoh: 123456789" 
                      value={telegramChatId} 
                      onChange={(e) => setTelegramChatId(e.target.value)} 
                      className="w-full px-4 py-3 bg-[#0f172a] border border-slate-700 rounded-xl text-sm font-mono text-cyan-300 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-700/80 mt-auto">
                    <div>
                      <span className="text-xs font-bold text-white block">Status Notifikasi Otomatis</span>
                      <span className="text-[11px] text-slate-400">Kirim pengingat jam 07:00 & 17:00</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={telegramNotificationsEnabled} 
                        onChange={(e) => setTelegramNotificationsEnabled(e.target.checked)} 
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button 
                    type="submit" 
                    disabled={loadingTelegramSave} 
                    className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-cyan-600/30 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {loadingTelegramSave ? 'Menyimpan...' : '💾 Simpan Pengaturan'}
                  </button>

                  <button 
                    type="button" 
                    onClick={handleTestSendTelegram} 
                    disabled={loadingTestSend} 
                    className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    <span>🧪</span> {loadingTestSend ? 'Mengirim...' : 'Kirim Pesan Uji Coba'}
                  </button>

                  <button 
                    type="button" 
                    onClick={handleTriggerDigest} 
                    disabled={loadingDigestSend} 
                    className="px-5 py-3 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2 ml-auto"
                  >
                    <span>🚀</span> {loadingDigestSend ? 'Memproses...' : 'Kirim Ringkasan Hari Ini Ke Telegram'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* MODAL EDIT TUGAS (TODO) */}
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

      {/* MODAL EDIT HABIT */}
      {editingHabit && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e293b] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-700 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-700/80 pb-3">
              <h3 className="font-extrabold text-amber-400 text-sm uppercase">EDIT KEBIASAAN (HABIT)</h3>
              <button onClick={() => setEditingHabit(null)} className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleUpdateHabit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Nama Kebiasaan</label>
                <input 
                  type="text" 
                  value={editHabitName} 
                  onChange={(e) => setEditHabitName(e.target.value)} 
                  required 
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-gray-100 outline-none focus:border-amber-500" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Frekuensi</label>
                <select 
                  value={editHabitFreq} 
                  onChange={(e) => setEditHabitFreq(e.target.value as 'daily' | 'weekly')}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-gray-100 outline-none focus:border-amber-500"
                >
                  <option value="daily">Harian (Daily)</option>
                  <option value="weekly">Mingguan (Weekly)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button 
                  type="button" 
                  onClick={() => setEditingHabit(null)} 
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-600/30 cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT TIMEBLOCK */}
      {editingTimeBlock && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e293b] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-700 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-700/80 pb-3">
              <h3 className="font-extrabold text-indigo-400 text-sm uppercase">EDIT JADWAL (TIMEBLOCK)</h3>
              <button onClick={() => setEditingTimeBlock(null)} className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleUpdateTimeBlock} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Nama Kegiatan</label>
                <input 
                  type="text" 
                  value={editTbTitle} 
                  onChange={(e) => setEditTbTitle(e.target.value)} 
                  required 
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-gray-100 outline-none focus:border-indigo-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Waktu Mulai</label>
                  <input 
                    type="time" 
                    value={editTbStart} 
                    onChange={(e) => setEditTbStart(e.target.value)} 
                    required 
                    className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-gray-100 outline-none [color-scheme:dark]" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Waktu Selesai</label>
                  <input 
                    type="time" 
                    value={editTbEnd} 
                    onChange={(e) => setEditTbEnd(e.target.value)} 
                    required 
                    className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-gray-100 outline-none [color-scheme:dark]" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Kategori</label>
                <input 
                  type="text" 
                  value={editTbCategory} 
                  onChange={(e) => setEditTbCategory(e.target.value)} 
                  required 
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-gray-100 outline-none focus:border-indigo-500" 
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button 
                  type="button" 
                  onClick={() => setEditingTimeBlock(null)} 
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT EXPENSE */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e293b] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-700 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-700/80 pb-3">
              <h3 className="font-extrabold text-rose-400 text-sm uppercase">EDIT PENGELUARAN</h3>
              <button onClick={() => setEditingExpense(null)} className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleUpdateExpense} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Nominal (Rp)</label>
                <input 
                  type="number" 
                  value={editExpAmount} 
                  onChange={(e) => setEditExpAmount(e.target.value)} 
                  required 
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-gray-100 outline-none focus:border-rose-500" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Kategori</label>
                <select 
                  value={editExpCategory} 
                  onChange={(e) => setEditExpCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-gray-100 outline-none focus:border-rose-500"
                >
                  <option value="Makanan">Makanan & Minuman</option>
                  <option value="Transportasi">Transportasi</option>
                  <option value="Pendidikan">Pendidikan & Uprak</option>
                  <option value="Hiburan">Hiburan & Belanja</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Catatan</label>
                <input 
                  type="text" 
                  value={editExpNotes} 
                  onChange={(e) => setEditExpNotes(e.target.value)} 
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-gray-100 outline-none focus:border-rose-500" 
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button 
                  type="button" 
                  onClick={() => setEditingExpense(null)} 
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL QUICK VOICE COMMAND */}
      {voiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 max-w-lg w-full shadow-2xl shadow-purple-950/50 space-y-5 relative overflow-hidden">
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-purple-500 to-indigo-500"></div>

            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎙️</span>
                <div>
                  <h3 className="font-extrabold text-slate-100 text-lg">Smart Voice Command</h3>
                  <p className="text-xs text-slate-400">Bicara langsung dalam Bahasa Indonesia</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (isDashVoiceListening) stopDashVoiceListening();
                  setVoiceModalOpen(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Big Interactive Mic Pulse Button */}
            <div className="flex flex-col items-center justify-center py-6 space-y-4 bg-slate-950/50 rounded-2xl border border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  if (isDashVoiceListening) {
                    stopDashVoiceListening();
                  } else {
                    startDashVoiceListening();
                  }
                }}
                disabled={loadingVoiceAction || !isDashVoiceSupported}
                className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-2xl transition-all duration-300 cursor-pointer ${
                  isDashVoiceListening
                    ? 'mic-active-pulse border-4 border-red-500 shadow-red-500/50'
                    : 'bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/30 hover:scale-105 active:scale-95'
                }`}
              >
                🎙️
              </button>

              <div className="text-center space-y-1">
                {isDashVoiceListening ? (
                  <div className="flex items-center justify-center gap-2 text-red-400 font-bold text-sm">
                    <span className="soundwave-bar"></span>
                    <span className="soundwave-bar"></span>
                    <span className="soundwave-bar"></span>
                    <span className="soundwave-bar"></span>
                    <span>Mendengarkan suara kamu...</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-medium">Tekan tombol mikrofon di atas untuk mulai bicara</p>
                )}
                {dashVoiceError && (
                  <p className="text-xs text-amber-400 font-medium">⚠️ {dashVoiceError}</p>
                )}
              </div>
            </div>

            {/* Speech Transcript Output Box */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Hasil Suara Kamu:</label>
              <textarea
                rows={3}
                value={voicePrompt}
                onChange={(e) => setVoicePrompt(e.target.value)}
                placeholder="Contoh: 'Catat pengeluaran beli bensin 30 ribu' atau 'Tambah tugas kuis HKI besok'..."
                className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 text-sm p-3.5 rounded-xl border border-slate-800 focus:outline-none focus:border-purple-500 transition-colors resize-none"
              />
            </div>

            {/* Example Prompts */}
            <div className="space-y-1.5">
              <p className="text-[11px] text-slate-400 font-bold uppercase">💡 Contoh ucapan cepat:</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  '💰 Catat pengeluaran beli kopi 25rb',
                  '📝 Tambahkan tugas Revisi Bab 1 besok',
                  '⚡ Tambah habit Olahraga Pagi daily',
                  '⏰ Timeblock Belajar Coding 19:00 sampai 21:00'
                ].map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setVoicePrompt(ex.replace(/^[^\s]+\s/, ''))}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg transition-colors border border-slate-700/60"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (isDashVoiceListening) stopDashVoiceListening();
                  setVoiceModalOpen(false);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!voicePrompt.trim()) return;
                  if (isDashVoiceListening) stopDashVoiceListening();

                  setLoadingVoiceAction(true);
                  try {
                    const token = localStorage.getItem('token');
                    const res = await axios.post(
                      `${API_BASE_URL}/api/ai/chat`,
                      { prompt: voicePrompt },
                      { headers: { Authorization: `Bearer ${token}` } }
                    );

                    const aiReply = res.data.reply || 'Perintah selesai diproses.';
                    const actionExecuted = res.data.actionExecuted;

                    if (actionExecuted) {
                      fetchAllData();
                    }

                    const formattedHtml = aiReply
                      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #60a5fa;">$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em style="color: #cbd5e1;">$1</em>')
                      .replace(/^- (.*)$/gm, '• $1')
                      .replace(/\n/g, '<br/>');

                    Swal.fire({
                      title: actionExecuted ? 'Aksi AI Berhasil! 🎉' : 'Respon AI',
                      html: `<div style="text-align: left; font-size: 14px; line-height: 1.7; font-family: sans-serif;">${formattedHtml}</div>`,
                      icon: actionExecuted ? 'success' : 'info',
                      background: '#1e293b',
                      color: '#f1f5f9',
                      confirmButtonColor: '#6366f1'
                    });

                    setVoicePrompt('');
                    setVoiceModalOpen(false);
                  } catch (err: any) {
                    Swal.fire({
                      title: 'Gagal Memproses Suara',
                      text: err.response?.data?.message || err.message,
                      icon: 'error',
                      background: '#1e293b',
                      color: '#f1f5f9'
                    });
                  } finally {
                    setLoadingVoiceAction(false);
                  }
                }}
                disabled={loadingVoiceAction || !voicePrompt.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 transition-all disabled:opacity-40 flex items-center gap-2"
              >
                {loadingVoiceAction ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Memproses AI...</span>
                  </>
                ) : (
                  <>
                    <span>🚀 Kirim ke AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Chatbot Widget */}
      <AIChatWidget onDataChanged={fetchAllData} />
    </div>
  );
}