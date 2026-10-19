/**
 * Utility Service untuk Browser Web Push Notification (HTML5 Notification API)
 */

export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    alert('Maaf, browser Anda tidak mendukung fitur Web Notification.');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      sendBrowserNotification('🔔 Notifikasi Browser Aktif!', {
        body: 'Selamat! Pengingat tugas & agenda FeloAssistant sekarang akan muncul langsung di layar Anda.',
        icon: '/favicon.ico'
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Gagal meminta izin notifikasi browser:', error);
    return false;
  }
};

export const sendBrowserNotification = (title: string, options?: NotificationOptions) => {
  if (!isNotificationSupported()) return;
  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        badge: '/favicon.ico',
        icon: '/favicon.ico',
        tag: 'felo-assistant-alert',
        renotify: true,
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (err) {
      console.error('Error saat membuat notifikasi:', err);
    }
  }
};

// 1. Pengingat Deadline Tugas (Todos)
export const checkTaskDeadlinesNotification = (todos: Array<{ taskName?: string; title?: string; deadline?: string; isCompleted?: boolean }>) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  const todayStr = new Date().toISOString().split('T')[0];
  const pendingTodayTodos = todos.filter(t => {
    if (t.isCompleted || !t.deadline) return false;
    const taskDate = new Date(t.deadline).toISOString().split('T')[0];
    return taskDate === todayStr;
  });

  if (pendingTodayTodos.length > 0) {
    const taskNames = pendingTodayTodos.map(t => t.taskName || t.title).slice(0, 2).join(', ');
    sendBrowserNotification(`📝 Peringatan Deadline Tugas Hari Ini (${pendingTodayTodos.length})`, {
      body: `Kamu memiliki ${pendingTodayTodos.length} tugas deadline hari ini: ${taskNames}${pendingTodayTodos.length > 2 ? '...' : ''}`
    });
  }
};

// 2. Pengingat Habit Check-in (Kebiasaan)
export const checkHabitsNotification = (habits: Array<{ name: string; checkedInToday: boolean }>) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  const uncheckedHabits = habits.filter(h => !h.checkedInToday);
  if (uncheckedHabits.length > 0) {
    const names = uncheckedHabits.map(h => h.name).slice(0, 2).join(', ');
    sendBrowserNotification(`⚡ Pengingat Habit & Rutinitas (${uncheckedHabits.length})`, {
      body: `Kamu belum check-in kebiasaan hari ini: ${names}${uncheckedHabits.length > 2 ? '...' : ''}`
    });
  }
};

// 3. Pengingat Jadwal Timeblock (Timeblock Calendar)
export const checkTimeblocksNotification = (timeblocks: Array<{ title: string; startTime: string; endTime: string; isCompleted: boolean }>) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  const activeTB = timeblocks.filter(tb => !tb.isCompleted);
  if (activeTB.length > 0) {
    const nextTB = activeTB[0];
    sendBrowserNotification(`📅 Pengingat Jadwal Jam (Timeblock)`, {
      body: `Sesi jadwal berikutnya: "${nextTB.title}" (${nextTB.startTime} - ${nextTB.endTime})`
    });
  }
};

// 4. Pengingat Pencatatan Keuangan (Expense Tracker)
export const checkExpensesNotification = (expenses: Array<{ date?: string }>) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  const todayStr = new Date().toISOString().split('T')[0];
  const recordedToday = expenses.some(e => e.date === todayStr);

  if (!recordedToday) {
    sendBrowserNotification(`💰 Pengingat Catatan Keuangan Harian`, {
      body: `Kamu belum mencatat pengeluaran uang hari ini. Yuk catat pengeluaran makan & belanjamu agar dompet ter kontrol!`
    });
  }
};
