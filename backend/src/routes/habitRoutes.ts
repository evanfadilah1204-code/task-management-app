import { Router, Response } from 'express';
import Habit from '../models/Habit';
import { authenticateToken, AuthRequest } from './todoRoutes';

const router = Router();

// GET /api/habits
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const habits = await Habit.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(habits);
  } catch (err: any) {
    res.status(500).json({ message: 'Gagal mengambil habits' });
  }
});

// POST /api/habits
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { name, frequency } = req.body;
    const habit = await Habit.create({
      userId,
      name,
      frequency: frequency || 'daily',
      streak: 0,
      checkedInToday: false
    });
    res.status(201).json(habit);
  } catch (err: any) {
    res.status(500).json({ message: 'Gagal membuat habit' });
  }
});

// PUT /api/habits/:id/checkin
router.put('/:id/checkin', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) return res.status(404).json({ message: 'Habit tidak ditemukan' });

    const nextChecked = !habit.checkedInToday;
    habit.checkedInToday = nextChecked;
    habit.streak = nextChecked ? habit.streak + 1 : Math.max(0, habit.streak - 1);
    await habit.save();

    res.status(200).json(habit);
  } catch (err: any) {
    res.status(500).json({ message: 'Gagal checkin habit' });
  }
});

// PUT /api/habits/:id (Edit Habit)
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name, frequency } = req.body;
    const updateData: any = {};
    if (name) updateData.name = name;
    if (frequency) updateData.frequency = frequency;

    const habit = await Habit.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
    if (!habit) return res.status(404).json({ message: 'Habit tidak ditemukan' });
    res.status(200).json(habit);
  } catch (err: any) {
    res.status(500).json({ message: 'Gagal mengedit habit' });
  }
});

// DELETE /api/habits/:id
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await Habit.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Habit berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ message: 'Gagal menghapus habit' });
  }
});

export default router;
