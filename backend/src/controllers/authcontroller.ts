import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '');

// 1. REGISTER MANUAL
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Semua field wajib diisi!' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username atau Email sudah terdaftar!' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword
    });

    const token = jwt.sign(
      { userId: newUser._id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registrasi berhasil!',
      token,
      user: { id: newUser._id, username: newUser.username, email: newUser.email }
    });
  } catch (error: any) {
    console.error('Error Register:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server: ' + error.message });
  }
};

// 2. LOGIN MANUAL
export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, email, username, password } = req.body;
    const loginKey = identifier || email || username;

    if (!loginKey || !password) {
      return res.status(400).json({ message: 'Email/Username dan Password wajib diisi!' });
    }

    const user = await User.findOne({
      $or: [{ email: loginKey }, { username: loginKey }]
    });

    if (!user) {
      return res.status(400).json({ message: 'Akun tidak ditemukan!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Password salah!' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login berhasil!',
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (error: any) {
    console.error('Error Login:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server: ' + error.message });
  }
};

// 3. LOGIN GOOGLE
export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { idToken, credential } = req.body;
    const tokenGoogle = idToken || credential;

    if (!tokenGoogle) {
      return res.status(400).json({ message: 'Token Google tidak ditemukan!' });
    }

    // Verifikasi Token ke Google Server
    const ticket = await client.verifyIdToken({
      idToken: tokenGoogle,
      audience: process.env.GOOGLE_CLIENT_ID || '',
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ message: 'Token Google tidak valid!' });
    }

    const { email, name } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      const generatedUsername = email ? email.split('@')[0] : 'user_' + Date.now();
      const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);

      user = await User.create({
        username: generatedUsername,
        email: email,
        password: randomPassword
      });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login Google Berhasil!',
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (error: any) {
    console.error('Error Google Auth:', error);
    res.status(500).json({ message: 'Gagal autentikasi via Google: ' + error.message });
  }
};