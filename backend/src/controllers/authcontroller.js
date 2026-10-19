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
exports.googleLogin = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const google_auth_library_1 = require("google-auth-library");
const User_1 = __importDefault(require("../models/User"));
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID || '');
// 1. REGISTER MANUAL
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Semua field wajib diisi!' });
        }
        const existingUser = yield User_1.default.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Username atau Email sudah terdaftar!' });
        }
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        const newUser = yield User_1.default.create({
            username,
            email,
            password: hashedPassword
        });
        const token = jsonwebtoken_1.default.sign({ userId: newUser._id, username: newUser.username }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            message: 'Registrasi berhasil!',
            token,
            user: { id: newUser._id, username: newUser.username, email: newUser.email }
        });
    }
    catch (error) {
        console.error('Error Register:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server: ' + error.message });
    }
});
exports.register = register;
// 2. LOGIN MANUAL
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { identifier, email, username, password } = req.body;
        const loginKey = identifier || email || username;
        if (!loginKey || !password) {
            return res.status(400).json({ message: 'Email/Username dan Password wajib diisi!' });
        }
        const user = yield User_1.default.findOne({
            $or: [{ email: loginKey }, { username: loginKey }]
        });
        if (!user) {
            return res.status(400).json({ message: 'Akun tidak ditemukan!' });
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Password salah!' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({
            message: 'Login berhasil!',
            token,
            user: { id: user._id, username: user.username, email: user.email }
        });
    }
    catch (error) {
        console.error('Error Login:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server: ' + error.message });
    }
});
exports.login = login;
// 3. LOGIN GOOGLE
const googleLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { idToken, credential } = req.body;
        const tokenGoogle = idToken || credential;
        if (!tokenGoogle) {
            return res.status(400).json({ message: 'Token Google tidak ditemukan!' });
        }
        // Verifikasi Token ke Google Server
        const ticket = yield client.verifyIdToken({
            idToken: tokenGoogle,
            audience: process.env.GOOGLE_CLIENT_ID || '',
        });
        const payload = ticket.getPayload();
        if (!payload) {
            return res.status(400).json({ message: 'Token Google tidak valid!' });
        }
        const { email, name } = payload;
        let user = yield User_1.default.findOne({ email });
        if (!user) {
            const generatedUsername = email ? email.split('@')[0] : 'user_' + Date.now();
            const randomPassword = yield bcryptjs_1.default.hash(Math.random().toString(36).slice(-8), 10);
            user = yield User_1.default.create({
                username: generatedUsername,
                email: email,
                password: randomPassword
            });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({
            message: 'Login Google Berhasil!',
            token,
            user: { id: user._id, username: user.username, email: user.email }
        });
    }
    catch (error) {
        console.error('Error Google Auth:', error);
        res.status(500).json({ message: 'Gagal autentikasi via Google: ' + error.message });
    }
});
exports.googleLogin = googleLogin;
