import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Todo from '../models/Todo';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

// Interface custom Request agar req.user terbaca TypeScript tanpa error
export interface AuthRequest extends Request {
  user?: any;
}

// Middleware Utama Otentikasi
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <TOKEN>

  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak, token tidak ditemukan!' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT Error:', error);
    return res.status(401).json({ message: 'Token tidak valid atau sudah kadaluwarsa!' });
  }
};

// 1. GET: Ambil tugas KHUSUS milik akun yang sedang login
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User ID tidak valid pada token' });
    }

    const todos = await Todo.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(todos);
  } catch (error: any) {
    console.error('Error GET Todos:', error.message);
    res.status(500).json({ message: 'Gagal mengambil data tugas' });
  }
});

// 2. POST: Tambah tugas dan terikat ke userId akun yang sedang login
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User ID tidak valid pada token' });
    }

    const { taskName, title, namaTugas, subject, mataPelajaran, deadline, tenggatWaktu } = req.body;

    // Menangani kompatibilitas berbagai penamaan field
    const finalTaskName = taskName || title || namaTugas || 'Tugas Baru';
    const finalSubject = subject || mataPelajaran || 'Umum';
    const finalDeadline = deadline || tenggatWaktu || new Date();

    const newTodo = await Todo.create({
      userId: userId,
      taskName: finalTaskName,
      title: finalTaskName,
      subject: finalSubject,
      deadline: finalDeadline,
      isCompleted: false
    });

    res.status(201).json(newTodo);
  } catch (error: any) {
    console.error('Error POST Todo:', error.message);
    res.status(500).json({ message: 'Gagal menambah tugas: ' + error.message });
  }
});

// 3. DELETE: Hapus Tugas
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await Todo.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Tugas berhasil dihapus' });
  } catch (error: any) {
    res.status(500).json({ message: 'Gagal menghapus tugas' });
  }
});

// 4. PUT: Update Status Selesai
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isCompleted } = req.body;
    const updated = await Todo.findByIdAndUpdate(id, { isCompleted }, { new: true });
    res.status(200).json(updated);
  } catch (error: any) {
    res.status(500).json({ message: 'Gagal update status tugas' });
  }
});

export default router;