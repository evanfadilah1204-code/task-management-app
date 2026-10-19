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
const dns_1 = __importDefault(require("dns"));
dns_1.default.setDefaultResultOrder('ipv4first');
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const mongoUri = process.env.MONGO_URI;
function clearDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('🔄 Menghubungkan ke MongoDB Atlas untuk mereset seluruh data...');
        if (!mongoUri) {
            console.error('❌ MONGO_URI tidak ditemukan di .env!');
            process.exit(1);
        }
        try {
            yield mongoose_1.default.connect(mongoUri);
            console.log('✅ Terhubung ke database MongoDB!');
            const db = mongoose_1.default.connection.db;
            if (!db) {
                throw new Error('Database connection instance not found');
            }
            const collections = ['todos', 'habits', 'timeblocks', 'expenses'];
            for (const colName of collections) {
                try {
                    const result = yield db.collection(colName).deleteMany({});
                    console.log(`🧹 Collection "${colName}" berhasil dibersihkan! (${result.deletedCount} dokumen dihapus)`);
                }
                catch (e) {
                    console.log(`ℹ️ Collection "${colName}" belum ada atau sudah bersih.`);
                }
            }
            console.log('\n✨ SELURUH DATABASE TELAH BERHASIL DIRESET 100% BERSIH!');
        }
        catch (err) {
            console.error('❌ Error saat mereset database:', err.message);
        }
        finally {
            yield mongoose_1.default.disconnect();
            console.log('🔌 Koneksi MongoDB ditutup.');
        }
    });
}
clearDatabase();
