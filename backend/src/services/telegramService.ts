import axios from 'axios';
import User from '../models/User';
import Todo from '../models/Todo';
import Habit from '../models/Habit';
import TimeBlock from '../models/TimeBlock';

/**
 * Service untuk mengelola pengiriman pesan via Telegram Bot API
 */

export const sendTelegramMessage = async (chatId: string, text: string): Promise<boolean> => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN belum diatur di .env');
    return false;
  }

  if (!chatId) {
    console.warn('⚠️ Telegram Chat ID tidak ditemukan');
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await axios.post(url, {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    });

    return response.data && response.data.ok;
  } catch (error: any) {
    console.error('❌ Gagal mengirim pesan Telegram:', error?.response?.data || error.message);
    return false;
  }
};

/**
 * Membuat format pesan rangkuman harian
 */
export const generateMorningDigestText = async (userId: string): Promise<string> => {
  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Ambil Data dari MongoDB
  const todos = await Todo.find({ userId }).sort({ createdAt: -1 });
  const habits = await Habit.find({ userId });
  const timeblocks = await TimeBlock.find({ userId }).sort({ startTime: 1 });

  const pendingTodos = todos.filter(t => !t.isCompleted);
  const habitsChecked = habits.filter(h => h.checkedInToday);

  let message = `🚀 <b>RANGKUMAN AGENDA HARI INI</b> 🚀\n`;
  message += `📅 <i>${todayStr}</i>\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Pilar 1: Todo Tasks
  message += `📌 <b>TUGAS & DEADLINE (${pendingTodos.length} Belum Selesai)</b>\n`;
  if (pendingTodos.length === 0) {
    message += `  ✨ Tidak ada tugas tertunda! Mantap.\n`;
  } else {
    pendingTodos.slice(0, 5).forEach((item, idx) => {
      const title = item.taskName || (item as any).title || 'Tugas';
      const deadline = item.deadline ? ` (⏱ ${item.deadline})` : '';
      message += `  ${idx + 1}. ⭕ <b>${title}</b>${deadline}\n`;
    });
    if (pendingTodos.length > 5) {
      message += `  <i>...dan ${pendingTodos.length - 5} tugas lainnya.</i>\n`;
    }
  }
  message += `\n`;

  // Pilar 2: Habits
  message += `🔥 <b>HABIT TRACKER (${habitsChecked.length}/${habits.length} Selesai Hari Ini)</b>\n`;
  if (habits.length === 0) {
    message += `  Belum ada kebiasaan yang dibuat.\n`;
  } else {
    habits.forEach(h => {
      const status = h.checkedInToday ? '✅' : '⏳';
      message += `  ${status} <b>${h.name}</b> (Streak: 🔥 ${h.streak || 0} hari)\n`;
    });
  }
  message += `\n`;

  // Pilar 3: Time Blocking
  message += `🕒 <b>AGENDA HARI INI (TIME BLOCKING)</b>\n`;
  if (timeblocks.length === 0) {
    message += `  Belum ada jadwal waktu khusus hari ini.\n`;
  } else {
    timeblocks.forEach(tb => {
      const category = tb.category ? `[${tb.category}] ` : '';
      message += `  • ⏱ <b>${tb.startTime || '00:00'} - ${tb.endTime || '00:00'}</b>: ${category}${tb.title}\n`;
    });
  }
  message += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `💪 <i>FeloAssistant siap mendampingi hari produktifmu!</i>`;

  return message;
};

/**
 * Mengirimkan Rangkuman Harian ke user yang ditentukan
 */
export const sendMorningDigest = async (userId: string): Promise<{ success: boolean; message: string }> => {
  const user = await User.findById(userId);
  if (!user) {
    return { success: false, message: 'User tidak ditemukan' };
  }

  if (!user.telegramChatId) {
    return { success: false, message: 'Telegram Chat ID belum diisi oleh pengguna' };
  }

  if (!user.telegramNotificationsEnabled) {
    return { success: false, message: 'Notifikasi Telegram sedang dinonaktifkan oleh pengguna' };
  }

  const digestText = await generateMorningDigestText(userId);
  const sent = await sendTelegramMessage(user.telegramChatId, digestText);

  if (sent) {
    return { success: true, message: 'Rangkuman harian berhasil dikirim ke Telegram!' };
  } else {
    return { success: false, message: 'Gagal mengirim pesan ke Telegram. Periksa TELEGRAM_BOT_TOKEN atau Chat ID.' };
  }
};

/**
 * Mengirim peringatan deadline ke Telegram
 */
export const sendDeadlineAlerts = async (userId: string): Promise<boolean> => {
  const user = await User.findById(userId);
  if (!user || !user.telegramChatId || !user.telegramNotificationsEnabled) return false;

  const pendingTodos = await Todo.find({ userId, isCompleted: false });
  if (pendingTodos.length === 0) return true;

  let alertText = `⚠️ <b>PERINGATAN TENGGAT WAKTU (DEADLINE)</b> ⚠️\n\n`;
  alertText += `Halo! Kamu masih memiliki <b>${pendingTodos.length} tugas</b> yang belum diselesaikan:\n\n`;

  pendingTodos.forEach((item, idx) => {
    const title = item.taskName || (item as any).title || 'Tugas';
    alertText += `${idx + 1}. 📌 <b>${title}</b> ${item.deadline ? `(Deadline: ${item.deadline})` : ''}\n`;
  });

  alertText += `\n<i>Yuk selesaikan sebelum menumpuk! 💪</i>`;

  return await sendTelegramMessage(user.telegramChatId, alertText);
};
