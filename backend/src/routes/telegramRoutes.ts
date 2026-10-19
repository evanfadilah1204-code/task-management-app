import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { sendTelegramMessage, sendMorningDigest } from '../services/telegramService';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

export interface AuthRequest extends Request {
  user?: any;
}

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak, token tidak ditemukan!' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token tidak valid atau sudah kadaluwarsa!' });
  }
};

// 1. GET /api/telegram/settings - Ambil pengaturan Telegram user
router.get('/settings', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    const botTokenConfigured = !!process.env.TELEGRAM_BOT_TOKEN;

    res.json({
      success: true,
      botTokenConfigured,
      telegramChatId: user.telegramChatId || '',
      telegramNotificationsEnabled: user.telegramNotificationsEnabled ?? true,
      telegramMorningDigestTime: user.telegramMorningDigestTime || '07:00'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. PUT /api/telegram/settings - Update pengaturan Telegram user
router.put('/settings', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const { telegramChatId, telegramNotificationsEnabled, telegramMorningDigestTime } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    if (telegramChatId !== undefined) user.telegramChatId = telegramChatId.trim();
    if (telegramNotificationsEnabled !== undefined) user.telegramNotificationsEnabled = telegramNotificationsEnabled;
    if (telegramMorningDigestTime !== undefined) user.telegramMorningDigestTime = telegramMorningDigestTime;

    await user.save();

    res.json({
      success: true,
      message: 'Pengaturan Telegram berhasil diperbarui!',
      user: {
        telegramChatId: user.telegramChatId,
        telegramNotificationsEnabled: user.telegramNotificationsEnabled,
        telegramMorningDigestTime: user.telegramMorningDigestTime
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. POST /api/telegram/test-send - Uji coba pengiriman pesan
router.post('/test-send', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user || !user.telegramChatId) {
      return res.status(400).json({
        success: false,
        message: 'Telegram Chat ID belum diisi. Silakan isi Chat ID terlebih dahulu!'
      });
    }

    const testText = `<b>🎉 Uji Coba Notifikasi FeloAssistant</b>\n\nHalo <b>${user.username}</b>! Pengecekan bot Telegram berhasil 100%! Bot ini siap mengirimkan pengingat agenda harianmu setiap jam 07:00 pagi. 🚀`;

    const sent = await sendTelegramMessage(user.telegramChatId, testText);

    if (sent) {
      res.json({ success: true, message: 'Pesan tes berhasil dikirim ke Telegram!' });
    } else {
      res.status(500).json({
        success: false,
        message: 'Gagal mengirim pesan ke Telegram. Pastikan TELEGRAM_BOT_TOKEN di .env sudah benar dan kamu sudah menekan /start pada Bot.'
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. POST /api/telegram/trigger-digest - Memicu pengiriman rangkuman harian secara manual
router.post('/trigger-digest', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const result = await sendMorningDigest(userId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
