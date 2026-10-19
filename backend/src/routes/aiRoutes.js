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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const todoRoutes_1 = require("./todoRoutes");
const aiService_1 = require("../services/aiService");
const router = (0, express_1.Router)();
// POST /api/ai/chat
router.post('/chat', todoRoutes_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
        if (!userId) {
            return res.status(401).json({ message: 'User ID tidak ditemukan dari token!' });
        }
        const { prompt, history } = req.body;
        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ message: 'Pesan prompt tidak boleh kosong!' });
        }
        const result = yield (0, aiService_1.processAIChat)(userId, prompt, history || []);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('💥 Error aiRoute:', error);
        res.status(500).json({ message: 'Gagal memproses pesan AI', error: error.message });
    }
}));
exports.default = router;
