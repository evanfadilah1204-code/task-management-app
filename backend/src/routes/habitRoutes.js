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
const Habit_1 = __importDefault(require("../models/Habit"));
const todoRoutes_1 = require("./todoRoutes");
const router = (0, express_1.Router)();
// GET /api/habits
router.get('/', todoRoutes_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
        const habits = yield Habit_1.default.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(habits);
    }
    catch (err) {
        res.status(500).json({ message: 'Gagal mengambil habits' });
    }
}));
// POST /api/habits
router.post('/', todoRoutes_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
        const { name, frequency } = req.body;
        const habit = yield Habit_1.default.create({
            userId,
            name,
            frequency: frequency || 'daily',
            streak: 0,
            checkedInToday: false
        });
        res.status(201).json(habit);
    }
    catch (err) {
        res.status(500).json({ message: 'Gagal membuat habit' });
    }
}));
// PUT /api/habits/:id/checkin
router.put('/:id/checkin', todoRoutes_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const habit = yield Habit_1.default.findById(req.params.id);
        if (!habit)
            return res.status(404).json({ message: 'Habit tidak ditemukan' });
        const nextChecked = !habit.checkedInToday;
        habit.checkedInToday = nextChecked;
        habit.streak = nextChecked ? habit.streak + 1 : Math.max(0, habit.streak - 1);
        yield habit.save();
        res.status(200).json(habit);
    }
    catch (err) {
        res.status(500).json({ message: 'Gagal checkin habit' });
    }
}));
// PUT /api/habits/:id (Edit Habit)
router.put('/:id', todoRoutes_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, frequency } = req.body;
        const updateData = {};
        if (name)
            updateData.name = name;
        if (frequency)
            updateData.frequency = frequency;
        const habit = yield Habit_1.default.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
        if (!habit)
            return res.status(404).json({ message: 'Habit tidak ditemukan' });
        res.status(200).json(habit);
    }
    catch (err) {
        res.status(500).json({ message: 'Gagal mengedit habit' });
    }
}));
// DELETE /api/habits/:id
router.delete('/:id', todoRoutes_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield Habit_1.default.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Habit berhasil dihapus' });
    }
    catch (err) {
        res.status(500).json({ message: 'Gagal menghapus habit' });
    }
}));
exports.default = router;
