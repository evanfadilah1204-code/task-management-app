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
exports.connectToDatabase = void 0;
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
// 2. Aktifkan CORS untuk mengizinkan akses dari frontend Vite (local & Vercel production)
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL
].filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Izinkan request tanpa origin (seperti mobile apps, curl, healthcheck)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin) ||
            /\.vercel\.app$/.test(origin) ||
            process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        return callback(null, true);
    },
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
let dbConnectionPromise = null;
const connectToDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    if (mongoose_1.default.connection.readyState === 1)
        return mongoose_1.default;
    if (!mongoUri)
        throw new Error("MONGO_URI tidak ditemukan di environment variables!");
    if (!dbConnectionPromise) {
        dbConnectionPromise = mongoose_1.default.connect(mongoUri, mongooseOptions);
    }
    return dbConnectionPromise;
});
exports.connectToDatabase = connectToDatabase;
// Middleware memastikan database terhubung sebelum memproses API (Krusial untuk Serverless Vercel)
app.use((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Lewati pengecekan DB untuk static/ping jika diinginkan
    if (req.path === '/ping')
        return next();
    try {
        yield (0, exports.connectToDatabase)();
        next();
    }
    catch (err) {
        console.error("❌ GAGAL KONEK DATABASE:", err.message);
        res.status(500).json({ error: "Database connection failed", message: err.message });
    }
}));
// Jalankan standalone server jika bukan di environment Vercel
if (process.env.VERCEL !== '1') {
    (0, exports.connectToDatabase)()
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
    });
}
exports.default = app;
