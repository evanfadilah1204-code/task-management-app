import { Router, Response } from 'express';
import Expense from '../models/Expense';
import { authenticateToken, AuthRequest } from './todoRoutes';

const router = Router();

// GET /api/expenses
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const expenses = await Expense.find({ userId }).sort({ date: -1, createdAt: -1 });
    res.status(200).json(expenses);
  } catch (err: any) {
    res.status(500).json({ message: 'Gagal mengambil pengeluaran' });
  }
});

// POST /api/expenses
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { amount, category, notes, date } = req.body;
    const exp = await Expense.create({
      userId,
      amount,
      category: category || 'Makanan',
      notes: notes || '',
      date: date || new Date().toISOString().split('T')[0]
    });
    res.status(201).json(exp);
  } catch (err: any) {
    res.status(500).json({ message: 'Gagal membuat pengeluaran' });
  }
});

// PUT /api/expenses/:id (Edit Expense)
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { amount, category, notes } = req.body;
    const updateData: any = {};
    if (amount !== undefined) updateData.amount = amount;
    if (category) updateData.category = category;
    if (notes !== undefined) updateData.notes = notes;

    const exp = await Expense.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
    if (!exp) return res.status(404).json({ message: 'Pengeluaran tidak ditemukan' });
    res.status(200).json(exp);
  } catch (err: any) {
    res.status(500).json({ message: 'Gagal mengedit pengeluaran' });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Pengeluaran berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ message: 'Gagal menghapus pengeluaran' });
  }
});

export default router;
