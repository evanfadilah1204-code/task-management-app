"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const telegramService_1 = require("../services/telegramService");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Akses ditolak, token tidak ditemukan!' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(403).json({ message: 'Token tidak valid atau sudah kadaluwarsa!' });
    }
};
// 1. GET /api/telegram/settings - Ambil pengaturan Telegram user
router.get('/settings', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = req.user.userId;
        const user = yield User_1.default.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }
        const botTokenConfigured = !!process.env.TELEGRAM_BOT_TOKEN;
        res.json({
            success: true,
            botTokenConfigured,
            telegramChatId: user.telegramChatId || '',
            telegramNotificationsEnabled: (_a = user.telegramNotificationsEnabled) !== null && _a !== void 0 ? _a : true,
            telegramMorningDigestTime: user.telegramMorningDigestTime || '07:00'
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
// 2. PUT /api/telegram/settings - Update pengaturan Telegram user
router.put('/settings', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const { telegramChatId, telegramNotificationsEnabled, telegramMorningDigestTime } = req.body;
        const user = yield User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }
        if (telegramChatId !== undefined)
            user.telegramChatId = telegramChatId.trim();
        if (telegramNotificationsEnabled !== undefined)
            user.telegramNotificationsEnabled = telegramNotificationsEnabled;
        if (telegramMorningDigestTime !== undefined)
            user.telegramMorningDigestTime = telegramMorningDigestTime;
        yield user.save();
        res.json({
            success: true,
            message: 'Pengaturan Telegram berhasil diperbarui!',
            user: {
                telegramChatId: user.telegramChatId,
                telegramNotificationsEnabled: user.telegramNotificationsEnabled,
                telegramMorningDigestTime: user.telegramMorningDigestTime
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
// 3. POST /api/telegram/test-send - Uji coba pengiriman pesan
router.post('/test-send', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const user = yield User_1.default.findById(userId);
        if (!user || !user.telegramChatId) {
            return res.status(400).json({
                success: false,
                message: 'Telegram Chat ID belum diisi. Silakan isi Chat ID terlebih dahulu!'
            });
        }
        const testText = `<b>🎉 Uji Coba Notifikasi FeloAssistant</b>\n\nHalo <b>${user.username}</b>! Pengecekan bot Telegram berhasil 100%! Bot ini siap mengirimkan pengingat agenda harianmu setiap jam 07:00 pagi. 🚀`;
        const sent = yield (0, telegramService_1.sendTelegramMessage)(user.telegramChatId, testText);
        if (sent) {
            res.json({ success: true, message: 'Pesan tes berhasil dikirim ke Telegram!' });
        }
        else {
            res.status(500).json({
                success: false,
                message: 'Gagal mengirim pesan ke Telegram. Pastikan TELEGRAM_BOT_TOKEN di .env sudah benar dan kamu sudah menekan /start pada Bot.'
            });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
// 4. POST /api/telegram/trigger-digest - Memicu pengiriman rangkuman harian secara manual
router.post('/trigger-digest', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const result = yield (0, telegramService_1.sendMorningDigest)(userId);
        if (result.success) {
            res.json(result);
        }
        else {
            res.status(400).json(result);
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
exports.default = router;
