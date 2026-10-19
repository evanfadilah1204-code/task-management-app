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
const Expense_1 = __importDefault(require("../models/Expense"));
const todoRoutes_1 = require("./todoRoutes");
const router = (0, express_1.Router)();
// GET /api/expenses
router.get('/', todoRoutes_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
        const expenses = yield Expense_1.default.find({ userId }).sort({ date: -1, createdAt: -1 });
        res.status(200).json(expenses);
    }
    catch (err) {
        res.status(500).json({ message: 'Gagal mengambil pengeluaran' });
    }
}));
// POST /api/expenses
router.post('/', todoRoutes_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
        const { amount, category, notes, date } = req.body;
        const exp = yield Expense_1.default.create({
            userId,
            amount,
            category: category || 'Makanan',
            notes: notes || '',
            date: date || new Date().toISOString().split('T')[0]
        });
        res.status(201).json(exp);
    }
    catch (err) {
        res.status(500).json({ message: 'Gagal membuat pengeluaran' });
    }
}));
// PUT /api/expenses/:id (Edit Expense)
router.put('/:id', todoRoutes_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { amount, category, notes } = req.body;
        const updateData = {};
        if (amount !== undefined)
            updateData.amount = amount;
        if (category)
            updateData.category = category;
        if (notes !== undefined)
            updateData.notes = notes;
        const exp = yield Expense_1.default.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
        if (!exp)
            return res.status(404).json({ message: 'Pengeluaran tidak ditemukan' });
        res.status(200).json(exp);
    }
    catch (err) {
        res.status(500).json({ message: 'Gagal mengedit pengeluaran' });
    }
}));
// DELETE /api/expenses/:id
router.delete('/:id', todoRoutes_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield Expense_1.default.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Pengeluaran berhasil dihapus' });
    }
    catch (err) {
        res.status(500).json({ message: 'Gagal menghapus pengeluaran' });
    }
}));
exports.default = router;
