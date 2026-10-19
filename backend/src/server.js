"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dns_1 = __importDefault(require("dns"));
// Paksa Node.js cari IPv4 dulu agar menghindari isu DNS tertunda
dns_1.default.setDefaultResultOrder('ipv4first');
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors")); // 1. Impor package CORS
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const todoRoutes_1 = __importDefault(require("./routes/todoRoutes"));
const habitRoutes_1 = __importDefault(require("./routes/habitRoutes"));
const timeBlockRoutes_1 = __importDefault(require("./routes/timeBlockRoutes"));
const expenseRoutes_1 = __importDefault(require("./routes/expenseRoutes"));
const aiRoutes_1 = __importDefault(require("./routes/aiRoutes"));
const telegramRoutes_1 = __importDefault(require("./routes/telegramRoutes"));
const index_1 = __importDefault(require("./routes/index"));
const schedulerService_1 = require("./services/schedulerService");
dotenv_1.default.config();
const app = (0, express_1.default)();
// 2. Aktifkan CORS untuk mengizinkan akses dari frontend Vite
app.use((0, cors_1.default)({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express_1.default.json());
const PORT = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URI;
// Health check
app.get('/health', (req, res) => {
    const dbState = mongoose_1.default.connection.readyState;
    const dbStatus = dbState === 1 ? 'CONNECTED ✅' : 'DISCONNECTED ❌';
    res.status(200).json({
        status: 'ok',
        server: 'running',
        database: dbStatus,
        dbCode: dbState,
        mongoUriConfigured: !!mongoUri,
        timestamp: new Date().toISOString()
    });
});
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/todos', todoRoutes_1.default);
app.use('/api/habits', habitRoutes_1.default);
app.use('/api/timeblocks', timeBlockRoutes_1.default);
app.use('/api/expenses', expenseRoutes_1.default);
app.use('/api/ai', aiRoutes_1.default);
app.use('/api/telegram', telegramRoutes_1.default);
app.use('/', index_1.default);
// Global Error Handler
app.use((err, req, res, next) => {
    console.error('💥 Global Error:', err.message);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
});
// Cek .env
if (!mongoUri) {
    console.error("❌ MONGO_URI tidak ditemukan di file .env!");
    process.exit(1);
}
// Opsi koneksi minimalis & kuat untuk direct Shard connection
const mongooseOptions = {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    authSource: 'admin',
};
mongoose_1.default.connect(mongoUri, mongooseOptions)
    .then(() => {
    console.log("✅ Database MongoDB Atlas terhubung, Mantap!");
    (0, schedulerService_1.initScheduler)(); // Aktifkan Penjadwal Cron Notifikasi Telegram
    app.listen(PORT, () => {
        console.log(`🚀 Server jalan di: http://localhost:${PORT}`);
        console.log(`   Health Check:   http://localhost:${PORT}/health`);
        console.log(`   Ping Test:      http://localhost:${PORT}/ping`);
    });
})
    .catch((error) => {
    console.error("\n❌ GAGAL KONEK DATABASE:");
    console.error(error.message);
    process.exit(1);
});
