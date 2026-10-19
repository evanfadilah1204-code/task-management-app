import dns from 'dns';
// Paksa Node.js cari IPv4 dulu agar menghindari isu DNS tertunda
dns.setDefaultResultOrder('ipv4first');

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors'; // 1. Impor package CORS
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import todoRoutes from './routes/todoRoutes';
import habitRoutes from './routes/habitRoutes';
import timeBlockRoutes from './routes/timeBlockRoutes';
import expenseRoutes from './routes/expenseRoutes';
import aiRoutes from './routes/aiRoutes';
import telegramRoutes from './routes/telegramRoutes';
import indexRoutes from './routes/index';
import { initScheduler } from './services/schedulerService';

dotenv.config();

const app = express();

// 2. Aktifkan CORS untuk mengizinkan akses dari frontend Vite (local & Vercel production)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Izinkan request tanpa origin (seperti mobile apps, curl, healthcheck)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      /\.vercel\.app$/.test(origin) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

const PORT = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URI;

// Health check
app.get('/health', (req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
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
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/timeblocks', timeBlockRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/', indexRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
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

let dbConnectionPromise: Promise<typeof mongoose> | null = null;
export const connectToDatabase = async () => {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (!mongoUri) throw new Error("MONGO_URI tidak ditemukan di environment variables!");
  if (!dbConnectionPromise) {
    dbConnectionPromise = mongoose.connect(mongoUri, mongooseOptions);
  }
  return dbConnectionPromise;
};

// Middleware memastikan database terhubung sebelum memproses API (Krusial untuk Serverless Vercel)
app.use(async (req: Request, res: Response, next: NextFunction) => {
  // Lewati pengecekan DB untuk static/ping jika diinginkan
  if (req.path === '/ping') return next();
  try {
    await connectToDatabase();
    next();
  } catch (err: any) {
    console.error("❌ GAGAL KONEK DATABASE:", err.message);
    res.status(500).json({ error: "Database connection failed", message: err.message });
  }
});

// Jalankan standalone server jika bukan di environment Vercel
if (process.env.VERCEL !== '1') {
  connectToDatabase()
    .then(() => {
      console.log("✅ Database MongoDB Atlas terhubung, Mantap!");
      initScheduler(); // Aktifkan Penjadwal Cron Notifikasi Telegram
      app.listen(PORT, () => {
        console.log(`🚀 Server jalan di: http://localhost:${PORT}`);
        console.log(`   Health Check:   http://localhost:${PORT}/health`);
        console.log(`   Ping Test:      http://localhost:${PORT}/ping`);
      });
    })
    .catch((error: any) => {
      console.error("\n❌ GAGAL KONEK DATABASE:");
      console.error(error.message);
    });
}

export default app;