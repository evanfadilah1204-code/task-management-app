"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
// Skema untuk menentukan kolom apa saja yang akan disimpan di MongoDB Atlas
const userSchema = new mongoose_1.Schema({
    username: {
        type: String,
        required: true,
        unique: true // Username tidak boleh kembar
    },
    email: {
        type: String,
        required: true,
        unique: true // Email tidak boleh kembar
    },
    password: {
        type: String,
        required: true
    },
    telegramChatId: {
        type: String,
        default: ''
    },
    telegramNotificationsEnabled: {
        type: Boolean,
        default: true
    },
    telegramMorningDigestTime: {
        type: String,
        default: '07:00'
    }
}, {
    timestamps: true // Otomatis membuat kolom createdAt dan updatedAt
});
exports.default = (0, mongoose_1.model)('User', userSchema);
