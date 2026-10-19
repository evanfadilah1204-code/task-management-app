import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const mongoUri = process.env.MONGO_URI;

async function clearDatabase() {
  console.log('🔄 Menghubungkan ke MongoDB Atlas untuk mereset seluruh data...');
  if (!mongoUri) {
    console.error('❌ MONGO_URI tidak ditemukan di .env!');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Terhubung ke database MongoDB!');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection instance not found');
    }

    const collections = ['todos', 'habits', 'timeblocks', 'expenses'];
    
    for (const colName of collections) {
      try {
        const result = await db.collection(colName).deleteMany({});
        console.log(`🧹 Collection "${colName}" berhasil dibersihkan! (${result.deletedCount} dokumen dihapus)`);
      } catch (e: any) {
        console.log(`ℹ️ Collection "${colName}" belum ada atau sudah bersih.`);
      }
    }

    console.log('\n✨ SELURUH DATABASE TELAH BERHASIL DIRESET 100% BERSIH!');
  } catch (err: any) {
    console.error('❌ Error saat mereset database:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Koneksi MongoDB ditutup.');
  }
}

clearDatabase();
