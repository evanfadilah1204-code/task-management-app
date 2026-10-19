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
exports.sendDeadlineAlerts = exports.sendMorningDigest = exports.generateMorningDigestText = exports.sendTelegramMessage = void 0;
const axios_1 = __importDefault(require("axios"));
const User_1 = __importDefault(require("../models/User"));
const Todo_1 = __importDefault(require("../models/Todo"));
const Habit_1 = __importDefault(require("../models/Habit"));
const TimeBlock_1 = __importDefault(require("../models/TimeBlock"));
/**
 * Service untuk mengelola pengiriman pesan via Telegram Bot API
 */
const sendTelegramMessage = (chatId, text) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
        const response = yield axios_1.default.post(url, {
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML'
        });
        return response.data && response.data.ok;
    }
    catch (error) {
        console.error('❌ Gagal mengirim pesan Telegram:', ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return false;
    }
});
exports.sendTelegramMessage = sendTelegramMessage;
/**
 * Membuat format pesan rangkuman harian
 */
const generateMorningDigestText = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const todayStr = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    // Ambil Data dari MongoDB
    const todos = yield Todo_1.default.find({ userId }).sort({ createdAt: -1 });
    const habits = yield Habit_1.default.find({ userId });
    const timeblocks = yield TimeBlock_1.default.find({ userId }).sort({ startTime: 1 });
    const pendingTodos = todos.filter(t => !t.isCompleted);
    const habitsChecked = habits.filter(h => h.checkedInToday);
    let message = `🚀 <b>RANGKUMAN AGENDA HARI INI</b> 🚀\n`;
    message += `📅 <i>${todayStr}</i>\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    // Pilar 1: Todo Tasks
    message += `📌 <b>TUGAS & DEADLINE (${pendingTodos.length} Belum Selesai)</b>\n`;
    if (pendingTodos.length === 0) {
        message += `  ✨ Tidak ada tugas tertunda! Mantap.\n`;
    }
    else {
        pendingTodos.slice(0, 5).forEach((item, idx) => {
            const title = item.taskName || item.title || 'Tugas';
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
    }
    else {
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
    }
    else {
        timeblocks.forEach(tb => {
            const category = tb.category ? `[${tb.category}] ` : '';
            message += `  • ⏱ <b>${tb.startTime || '00:00'} - ${tb.endTime || '00:00'}</b>: ${category}${tb.title}\n`;
        });
    }
    message += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `💪 <i>FeloAssistant siap mendampingi hari produktifmu!</i>`;
    return message;
});
exports.generateMorningDigestText = generateMorningDigestText;
/**
 * Mengirimkan Rangkuman Harian ke user yang ditentukan
 */
const sendMorningDigest = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield User_1.default.findById(userId);
    if (!user) {
        return { success: false, message: 'User tidak ditemukan' };
    }
    if (!user.telegramChatId) {
        return { success: false, message: 'Telegram Chat ID belum diisi oleh pengguna' };
    }
    if (!user.telegramNotificationsEnabled) {
        return { success: false, message: 'Notifikasi Telegram sedang dinonaktifkan oleh pengguna' };
    }
    const digestText = yield (0, exports.generateMorningDigestText)(userId);
    const sent = yield (0, exports.sendTelegramMessage)(user.telegramChatId, digestText);
    if (sent) {
        return { success: true, message: 'Rangkuman harian berhasil dikirim ke Telegram!' };
    }
    else {
        return { success: false, message: 'Gagal mengirim pesan ke Telegram. Periksa TELEGRAM_BOT_TOKEN atau Chat ID.' };
    }
});
exports.sendMorningDigest = sendMorningDigest;
/**
 * Mengirim peringatan deadline ke Telegram
 */
const sendDeadlineAlerts = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield User_1.default.findById(userId);
    if (!user || !user.telegramChatId || !user.telegramNotificationsEnabled)
        return false;
    const pendingTodos = yield Todo_1.default.find({ userId, isCompleted: false });
    if (pendingTodos.length === 0)
        return true;
    let alertText = `⚠️ <b>PERINGATAN TENGGAT WAKTU (DEADLINE)</b> ⚠️\n\n`;
    alertText += `Halo! Kamu masih memiliki <b>${pendingTodos.length} tugas</b> yang belum diselesaikan:\n\n`;
    pendingTodos.forEach((item, idx) => {
        const title = item.taskName || item.title || 'Tugas';
        alertText += `${idx + 1}. 📌 <b>${title}</b> ${item.deadline ? `(Deadline: ${item.deadline})` : ''}\n`;
    });
    alertText += `\n<i>Yuk selesaikan sebelum menumpuk! 💪</i>`;
    return yield (0, exports.sendTelegramMessage)(user.telegramChatId, alertText);
});
exports.sendDeadlineAlerts = sendDeadlineAlerts;
