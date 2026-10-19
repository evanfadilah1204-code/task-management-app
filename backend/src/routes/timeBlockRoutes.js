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
const TimeBlock_1 = __importDefault(require("../models/TimeBlock"));
const todoRoutes_1 = require("./todoRoutes");
const router = (0, express_1.Router)();
// GET /api/timeblocks
router.get('/', todoRoutes_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
        const blocks = yield TimeBlock_1.default.find({ userId }).sort({ startTime: 1 });
        res.status(200).json(blocks);
    }
    catch (err) {
        res.status(500).json({ message: 'Gagal mengambil timeblocks' });
    }
}));
// POST /api/timeblocks
router.post('/', todoRoutes_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
        const { title, startTime, endTime, category } = req.body;
        const block = yield TimeBlock_1.default.create({
            userId,
            title,
            startTime,
            endTime,
            category: category || 'Umum',
            isCompleted: false
        });
        res.status(201).json(block);
    }
    catch (err) {
        res.status(500).json({ message: 'Gagal membuat timeblock' });
    }
}));
// PUT /api/timeblocks/:id/toggle
router.put('/:id/toggle', todoRoutes_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const block = yield TimeBlock_1.default.findById(req.params.id);
        if (!block)
            return res.status(404).json({ message: 'Timeblock tidak ditemukan' });
        block.isCompleted = !block.isCompleted;
        yield block.save();
        res.status(200).json(block);
    }
    catch (err) {
        res.status(500).json({ message: 'Gagal toggle timeblock' });
    }
}));
// PUT /api/timeblocks/:id (Edit TimeBlock)
router.put('/:id', todoRoutes_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, startTime, endTime, category } = req.body;
        const updateData = {};
        if (title)
            updateData.title = title;
        if (startTime)
            updateData.startTime = startTime;
        if (endTime)
            updateData.endTime = endTime;
        if (category)
            updateData.category = category;
        const block = yield TimeBlock_1.default.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
        if (!block)
            return res.status(404).json({ message: 'Timeblock tidak ditemukan' });
        res.status(200).json(block);
    }
    catch (err) {
        res.status(500).json({ message: 'Gagal mengedit timeblock' });
    }
}));
// DELETE /api/timeblocks/:id
router.delete('/:id', todoRoutes_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield TimeBlock_1.default.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Timeblock berhasil dihapus' });
    }
    catch (err) {
        res.status(500).json({ message: 'Gagal menghapus timeblock' });
    }
}));
exports.default = router;
