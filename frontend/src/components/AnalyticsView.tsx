import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
  Filler
);

export interface TodoItem {
  _id: string;
  taskName?: string;
  title?: string;
  subject?: string;
  deadline?: string;
  isCompleted?: boolean;
}

export interface HabitItem {
  _id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  checkedInToday: boolean;
}

export interface TimeBlockItem {
  _id: string;
  title: string;
  startTime: string;
  endTime: string;
  category: string;
  isCompleted: boolean;
}

export interface ExpenseItem {
  _id: string;
  amount: number;
  category: string;
  notes: string;
  date: string;
}

interface AnalyticsViewProps {
  todos: TodoItem[];
  habits: HabitItem[];
  timeblocks: TimeBlockItem[];
  expenses: ExpenseItem[];
}

export default function AnalyticsView({ todos, habits, timeblocks, expenses }: AnalyticsViewProps) {
  // --- 1. FINANCE ANALYTICS (EXPENSES BY CATEGORY) ---
  const expenseCategoriesMap: { [key: string]: number } = {};
  let totalExpense = 0;

  expenses.forEach((item) => {
    const cat = item.category || 'Lainnya';
    const amount = Number(item.amount) || 0;
    expenseCategoriesMap[cat] = (expenseCategoriesMap[cat] || 0) + amount;
    totalExpense += amount;
  });

  const expenseLabels = Object.keys(expenseCategoriesMap);
  const expenseDataValues = Object.values(expenseCategoriesMap);

  const categoryColors = [
    '#ec4899', // Pink (Makanan)
    '#3b82f6', // Blue (Transportasi)
    '#10b981', // Emerald (Belanja)
    '#f59e0b', // Amber (Tagihan)
    '#8b5cf6', // Purple (Hiburan)
    '#06b6d4', // Cyan
    '#64748b'  // Slate
  ];

  const doughnutData = {
    labels: expenseLabels.length > 0 ? expenseLabels : ['Belum Ada Data'],
    datasets: [
      {
        data: expenseDataValues.length > 0 ? expenseDataValues : [1],
        backgroundColor: expenseDataValues.length > 0 ? categoryColors.slice(0, expenseLabels.length) : ['#334155'],
        borderColor: '#1e293b',
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#cbd5e1',
          font: {
            family: 'Inter, sans-serif',
            size: 11,
            weight: 600
          },
          padding: 14,
          usePointStyle: true,
          pointStyleWidth: 10,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            if (expenseDataValues.length === 0) return ' Belum ada transaksi';
            const val = context.raw || 0;
            const percentage = totalExpense > 0 ? ((val / totalExpense) * 100).toFixed(1) : '0';
            return ` Rp ${val.toLocaleString('id-ID')} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '68%',
  };

  // Find top expense category
  let topExpenseCategory = '-';
  let topExpenseAmount = 0;
  Object.entries(expenseCategoriesMap).forEach(([cat, amt]) => {
    if (amt > topExpenseAmount) {
      topExpenseAmount = amt;
      topExpenseCategory = cat;
    }
  });

  // --- 2. TODO ANALYTICS ---
  const totalTodosCount = todos.length;
  const completedTodosCount = todos.filter(t => Boolean(t.isCompleted)).length;
  const activeTodosCount = totalTodosCount - completedTodosCount;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueTodosCount = todos.filter(t => !t.isCompleted && t.deadline && new Date(t.deadline) < today).length;
  
  const todoCompletionRate = totalTodosCount > 0 ? Math.round((completedTodosCount / totalTodosCount) * 100) : 0;

  // Todos breakdown by subject
  const subjectMap: { [key: string]: { total: number; completed: number } } = {};
  todos.forEach(t => {
    const subj = t.subject || 'Umum';
    if (!subjectMap[subj]) {
      subjectMap[subj] = { total: 0, completed: 0 };
    }
    subjectMap[subj].total += 1;
    if (t.isCompleted) subjectMap[subj].completed += 1;
  });

  // --- 3. HABIT ANALYTICS ---
  const totalHabitsCount = habits.length;
  const habitsCheckedInCount = habits.filter(h => Boolean(h.checkedInToday)).length;
  const habitCompletionRate = totalHabitsCount > 0 ? Math.round((habitsCheckedInCount / totalHabitsCount) * 100) : 0;
  const highestStreak = habits.reduce((max, h) => (h.streak > max ? h.streak : max), 0);

  // --- 4. TIMEBLOCK ANALYTICS BY CATEGORY ---
  const timeblockCategoriesMap: { [key: string]: number } = {};
  timeblocks.forEach(tb => {
    const cat = tb.category || 'Umum';
    timeblockCategoriesMap[cat] = (timeblockCategoriesMap[cat] || 0) + 1;
  });

  const tbLabels = Object.keys(timeblockCategoriesMap);
  const tbDataValues = Object.values(timeblockCategoriesMap);

  const barData = {
    labels: tbLabels.length > 0 ? tbLabels : ['Belum Ada Jadwal'],
    datasets: [
      {
        label: 'Sesi Terjadwal',
        data: tbDataValues.length > 0 ? tbDataValues : [0],
        backgroundColor: '#6366f1',
        borderRadius: 8,
        hoverBackgroundColor: '#818cf8',
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => ` ${context.raw} Sesi Kegiatan`
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8', font: { size: 11, weight: 600 } },
        grid: { display: false },
      },
      y: {
        ticks: { color: '#94a3b8', precision: 0 },
        grid: { color: '#334155', drawBorder: false },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER RINGKASAN PRODUCTIVITY HEALTH */}
      <div className="bg-gradient-to-r from-indigo-900/80 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold mb-2 border border-indigo-500/30">
              📊 Executive Visual Analytics
            </div>
            <h2 className="text-2xl font-black text-white tracking-wide">Ringkasan Performa & Insights</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Visualisasi waktu riil untuk produktivitas harian, pencapaian kebiasaan, serta analisis pengeluaran keuangan Anda.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 backdrop-blur-md">
            <div className="text-center px-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Todo Done</span>
              <span className="text-lg font-extrabold text-blue-400">{todoCompletionRate}%</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-700"></div>
            <div className="text-center px-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Habit Check</span>
              <span className="text-lg font-extrabold text-amber-400">{habitCompletionRate}%</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-700"></div>
            <div className="text-center px-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Top Streak</span>
              <span className="text-lg font-extrabold text-emerald-400">🔥 {highestStreak} Hari</span>
            </div>
          </div>
        </div>
      </div>

      {/* GRID CHART 1: EXPENSE ANALYTICS & PRODUCTIVITY INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CHART 1: EXPENSE DISTRIBUTION (DONUT CHART) */}
        <div className="lg:col-span-6 bg-[#1e293b] border border-slate-700/60 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>💰</span> Distribusi Pengeluaran
              </h3>
              <p className="text-xs text-slate-400">Proporsi biaya per kategori bulan ini</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Total Pengeluaran</div>
              <div className="text-sm font-black text-rose-400">Rp {totalExpense.toLocaleString('id-ID')}</div>
            </div>
          </div>

          <div className="relative h-64 w-full my-2 flex items-center justify-center">
            <Doughnut data={doughnutData} options={doughnutOptions} />
            {/* Center Summary Label inside Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Top Category</span>
              <span className="text-sm font-extrabold text-white max-w-[120px] truncate text-center">
                {topExpenseCategory}
              </span>
            </div>
          </div>

          {/* Quick Expense Highlights */}
          <div className="mt-4 pt-3 border-t border-slate-700/60 grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/40">
              <span className="text-slate-400 block text-[10px]">Transaksi Terbanyak</span>
              <span className="font-extrabold text-slate-200">{expenses.length} Transaksi</span>
            </div>
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/40">
              <span className="text-slate-400 block text-[10px]">Dominasi Kategori</span>
              <span className="font-extrabold text-rose-300">
                {totalExpense > 0 ? `${Math.round((topExpenseAmount / totalExpense) * 100)}% (${topExpenseCategory})` : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* CHART 2: TIMEBLOCK SESSION ALLOCATION (BAR CHART) */}
        <div className="lg:col-span-6 bg-[#1e293b] border border-slate-700/60 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>⏰</span> Alokasi Waktu (TimeBlock)
              </h3>
              <p className="text-xs text-slate-400">Jumlah sesi kegiatan berdasarkan kategori</p>
            </div>
            <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2.5 py-1 rounded-lg font-bold border border-indigo-500/20">
              {timeblocks.length} Total Sesi
            </span>
          </div>

          <div className="relative h-64 w-full my-2">
            <Bar data={barData} options={barOptions} />
          </div>

          {/* Timeblock Completion Summary */}
          <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
            <span className="text-slate-400">Status Sesi Hari Ini:</span>
            <div className="flex gap-3 font-bold">
              <span className="text-emerald-400">
                ✓ {timeblocks.filter(tb => tb.isCompleted).length} Selesai
              </span>
              <span className="text-slate-400">
                ⏳ {timeblocks.filter(tb => !tb.isCompleted).length} Belum
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* GRID CHART 2: TODO BREAKDOWN & HABIT STREAKS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* TODO BREAKDOWN BY SUBJECT */}
        <div className="lg:col-span-6 bg-[#1e293b] border border-slate-700/60 rounded-2xl p-5 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>📚</span> Progres Tugas per Subjek
              </h3>
              <p className="text-xs text-slate-400">Tingkat penyelesaian berdasarkan mata pelajaran / bidang</p>
            </div>
            {overdueTodosCount > 0 && (
              <span className="bg-rose-500/20 text-rose-300 text-xs px-2.5 py-1 rounded-lg font-bold border border-rose-500/30">
                ⚠️ {overdueTodosCount} Overdue
              </span>
            )}
          </div>

          <div className="space-y-4 my-2">
            {Object.keys(subjectMap).length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">Belum ada data tugas terdaftar</div>
            ) : (
              Object.entries(subjectMap).map(([subjectName, data]) => {
                const percent = Math.round((data.completed / data.total) * 100);
                return (
                  <div key={subjectName} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        {subjectName}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {data.completed}/{data.total} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Todo Status Badges */}
          <div className="mt-6 pt-3 border-t border-slate-700/60 flex items-center justify-around text-xs">
            <div className="text-center">
              <span className="block text-slate-400 text-[10px]">Tugas Aktif</span>
              <span className="font-extrabold text-blue-400">{activeTodosCount}</span>
            </div>
            <div className="text-center">
              <span className="block text-slate-400 text-[10px]">Tugas Selesai</span>
              <span className="font-extrabold text-emerald-400">{completedTodosCount}</span>
            </div>
            <div className="text-center">
              <span className="block text-slate-400 text-[10px]">Terlambat (Overdue)</span>
              <span className="font-extrabold text-rose-400">{overdueTodosCount}</span>
            </div>
          </div>
        </div>

        {/* HABIT STREAKS & CONSISTENCY */}
        <div className="lg:col-span-6 bg-[#1e293b] border border-slate-700/60 rounded-2xl p-5 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>⚡</span> Konsistensi Kebiasaan (Habits)
              </h3>
              <p className="text-xs text-slate-400">Pencapaian streak & rutinitas harian</p>
            </div>
            <span className="bg-amber-500/10 text-amber-400 text-xs px-2.5 py-1 rounded-lg font-bold border border-amber-500/20">
              🔥 Max {highestStreak} Hari
            </span>
          </div>

          <div className="space-y-3.5 my-2 max-h-60 overflow-y-auto pr-1">
            {habits.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">Belum ada kebiasaan yang dibuat</div>
            ) : (
              habits.map((habit) => (
                <div
                  key={habit._id}
                  className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/50 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black ${
                        habit.checkedInToday
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {habit.checkedInToday ? '✓' : '⚡'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{habit.name}</h4>
                      <span className="text-[10px] text-slate-400 capitalize">{habit.frequency} Routine</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                      🔥 {habit.streak} Hari
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        habit.checkedInToday
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {habit.checkedInToday ? 'Checked' : 'Belum'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/60 flex justify-between items-center text-xs text-slate-400">
            <span>Status Check-in Hari Ini:</span>
            <span className="font-extrabold text-white">
              {habitsCheckedInCount} dari {totalHabitsCount} Kebiasaan ({habitCompletionRate}%)
            </span>
          </div>
        </div>

      </div>

      {/* INSIGHT CARD / AI SUGGESTION FOOTER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-xl flex items-start space-x-4">
        <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl text-xl font-bold flex-shrink-0">
          💡
        </div>
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">Rekomendasi AI Assistant</h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {totalExpense > 0 && topExpenseCategory !== '-' ? (
              <>
                Pengeluaran Anda bulan ini didominasi oleh kategori <strong className="text-rose-300">{topExpenseCategory}</strong> ({Math.round((topExpenseAmount / totalExpense) * 100)}%).
              </>
            ) : null}{' '}
            {overdueTodosCount > 0 ? (
              <span className="text-rose-400 font-semibold"> Ada {overdueTodosCount} tugas yang melewati deadline, pastikan untuk segera diselesaikan!</span>
            ) : (
              <span className="text-emerald-400 font-semibold"> Semua tugas dalam jadwal terpantau aman tanpa kendala deadline. Pertahankan ritme Anda!</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
