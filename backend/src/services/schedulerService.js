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
exports.initScheduler = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const User_1 = __importDefault(require("../models/User"));
const telegramService_1 = require("./telegramService");
/**
 * Service Penjadwalan Otomatis (Cron Jobs)
 */
const initScheduler = () => {
    console.log('⏰ Penjadwal Otomatis (Cron Scheduler) Berhasil Diaktifkan!');
    // 1. Rangkuman Harian Pagi (Jam 07:00 AM setiap hari)
    node_cron_1.default.schedule('0 7 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log('🔔 [Cron] Menjalankan Pengiriman Rangkuman Harian (07:00 AM)...');
        try {
            const users = yield User_1.default.find({
                telegramChatId: { $ne: '' },
                telegramNotificationsEnabled: true
            });
            for (const user of users) {
                yield (0, telegramService_1.sendMorningDigest)(user._id.toString());
            }
            console.log(`✅ [Cron] Selesai memproses ${users.length} user.`);
        }
        catch (err) {
            console.error('❌ [Cron Error] Gagal mengirim rangkuman harian:', err.message);
        }
    }));
    // 2. Peringatan Deadline Sore (Jam 17:00 PM setiap hari)
    node_cron_1.default.schedule('0 17 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log('🔔 [Cron] Menjalankan Peringatan Deadline Tugas (17:00 PM)...');
        try {
            const users = yield User_1.default.find({
                telegramChatId: { $ne: '' },
                telegramNotificationsEnabled: true
            });
            for (const user of users) {
                yield (0, telegramService_1.sendDeadlineAlerts)(user._id.toString());
            }
            console.log(`✅ [Cron] Selesai mengirim peringatan deadline.`);
        }
        catch (err) {
            console.error('❌ [Cron Error] Gagal mengirim peringatan deadline:', err.message);
        }
    }));
};
exports.initScheduler = initScheduler;
