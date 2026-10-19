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
exports.authenticateToken = void 0;
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Todo_1 = __importDefault(require("../models/Todo"));
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
// Middleware Utama Otentikasi
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <TOKEN>
    if (!token) {
        return res.status(401).json({ message: 'Akses ditolak, token tidak ditemukan!' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error('JWT Error:', error);
        return res.status(401).json({ message: 'Token tidak valid atau sudah kadaluwarsa!' });
    }
};
exports.authenticateToken = authenticateToken;
// 1. GET: Ambil tugas KHUSUS milik akun yang sedang login
router.get('/', exports.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
        if (!userId) {
            return res.status(401).json({ message: 'User ID tidak valid pada token' });
        }
        const todos = yield Todo_1.default.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(todos);
    }
    catch (error) {
        console.error('Error GET Todos:', error.message);
        res.status(500).json({ message: 'Gagal mengambil data tugas' });
    }
}));
// 2. POST: Tambah tugas dan terikat ke userId akun yang sedang login
router.post('/', exports.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
        if (!userId) {
            return res.status(401).json({ message: 'User ID tidak valid pada token' });
        }
        const { taskName, title, namaTugas, subject, mataPelajaran, deadline, tenggatWaktu } = req.body;
        // Menangani kompatibilitas berbagai penamaan field
        const finalTaskName = taskName || title || namaTugas || 'Tugas Baru';
        const finalSubject = subject || mataPelajaran || 'Umum';
        const finalDeadline = deadline || tenggatWaktu || new Date();
        const newTodo = yield Todo_1.default.create({
            userId: userId,
            taskName: finalTaskName,
            title: finalTaskName,
            subject: finalSubject,
            deadline: finalDeadline,
            isCompleted: false
        });
        res.status(201).json(newTodo);
    }
    catch (error) {
        console.error('Error POST Todo:', error.message);
        res.status(500).json({ message: 'Gagal menambah tugas: ' + error.message });
    }
}));
// 3. DELETE: Hapus Tugas
router.delete('/:id', exports.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield Todo_1.default.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Tugas berhasil dihapus' });
    }
    catch (error) {
        res.status(500).json({ message: 'Gagal menghapus tugas' });
    }
}));
// 4. PUT: Update Status / Edit Data Tugas
router.put('/:id', exports.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updateFields = {};
        if (req.body.isCompleted !== undefined)
            updateFields.isCompleted = req.body.isCompleted;
        if (req.body.taskName || req.body.title) {
            updateFields.taskName = req.body.taskName || req.body.title;
            updateFields.title = req.body.taskName || req.body.title;
        }
        if (req.body.subject)
            updateFields.subject = req.body.subject;
        if (req.body.deadline)
            updateFields.deadline = req.body.deadline;
        const updated = yield Todo_1.default.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
        res.status(200).json(updated);
    }
    catch (error) {
        res.status(500).json({ message: 'Gagal update status/data tugas' });
    }
}));
exports.default = router;
