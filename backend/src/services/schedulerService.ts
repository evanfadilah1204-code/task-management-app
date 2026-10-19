import cron from 'node-cron';
import User from '../models/User';
import { sendMorningDigest, sendDeadlineAlerts } from './telegramService';

/**
 * Service Penjadwalan Otomatis (Cron Jobs)
 */
export const initScheduler = () => {
  console.log('⏰ Penjadwal Otomatis (Cron Scheduler) Berhasil Diaktifkan!');

  // 1. Rangkuman Harian Pagi (Jam 07:00 AM setiap hari)
  cron.schedule('0 7 * * *', async () => {
    console.log('🔔 [Cron] Menjalankan Pengiriman Rangkuman Harian (07:00 AM)...');
    try {
      const users = await User.find({
        telegramChatId: { $ne: '' },
        telegramNotificationsEnabled: true
      });

      for (const user of users) {
        await sendMorningDigest(user._id.toString());
      }
      console.log(`✅ [Cron] Selesai memproses ${users.length} user.`);
    } catch (err: any) {
      console.error('❌ [Cron Error] Gagal mengirim rangkuman harian:', err.message);
    }
  });

  // 2. Peringatan Deadline Sore (Jam 17:00 PM setiap hari)
  cron.schedule('0 17 * * *', async () => {
    console.log('🔔 [Cron] Menjalankan Peringatan Deadline Tugas (17:00 PM)...');
    try {
      const users = await User.find({
        telegramChatId: { $ne: '' },
        telegramNotificationsEnabled: true
      });

      for (const user of users) {
        await sendDeadlineAlerts(user._id.toString());
      }
      console.log(`✅ [Cron] Selesai mengirim peringatan deadline.`);
    } catch (err: any) {
      console.error('❌ [Cron Error] Gagal mengirim peringatan deadline:', err.message);
    }
  });
};
