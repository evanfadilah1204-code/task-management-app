import dns from 'dns';
// Paksa Node.js cari IPv4 dulu agar menghindari isu DNS tertunda
dns.setDefaultResultOrder('ipv4first');

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors'; // 1. Impor package CORS
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import todoRoutes from './routes/todoRoutes'; // <-- FIX: Nama variabel diganti jadi todoRoutes biar sinkron
import indexRoutes from './routes/index';

dotenv.config();

const app = express();

// 2. Aktifkan CORS untuk mengizinkan akses dari frontend Vite
app.use(cors({
  origin: 'http://localhost:5173',
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
app.use('/api/todos', todoRoutes); // <-- FIX: Jalurnya diganti jadi /api/todos sesuai request frontend!
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

console.log("⏳ Mencoba tersambung ke MongoDB Atlas via jalur Direct...");

mongoose.connect(mongoUri, mongooseOptions)
  .then(() => {
    console.log("✅ Database MongoDB Atlas terhubung, Mantap!");
    app.listen(PORT, () => {
      console.log(`🚀 Server jalan di: http://localhost:${PORT}`);
      console.log(`   Health Check:   http://localhost:${PORT}/health`);
      console.log(`   Ping Test:      http://localhost:${PORT}/ping`);
    });
  })
  .catch((error: any) => {
    console.error("\n❌ GAGAL KONEK DATABASE:");
    console.error(error.message);
    process.exit(1);
  });