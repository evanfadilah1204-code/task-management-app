import { Router, Response } from 'express';
import TimeBlock from '../models/TimeBlock';
import { authenticateToken, AuthRequest } from './todoRoutes';

const router = Router();

// GET /api/timeblocks
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const blocks = await TimeBlock.find({ userId }).sort({ startTime: 1 });
    res.status(200).json(blocks);
  } catch (err: any) {
    res.status(500).json({ message: 'Gagal mengambil timeblocks' });
  }
});

// POST /api/timeblocks
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { title, startTime, endTime, category } = req.body;
    const block = await TimeBlock.create({
      userId,
      title,
      startTime,
      endTime,
      category: category || 'Umum',
      isCompleted: false
    });
    res.status(201).json(block);
  } catch (err: any) {
    res.status(500).json({ message: 'Gagal membuat timeblock' });
  }
});

// PUT /api/timeblocks/:id/toggle
router.put('/:id/toggle', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const block = await TimeBlock.findById(req.params.id);
    if (!block) return res.status(404).json({ message: 'Timeblock tidak ditemukan' });

    block.isCompleted = !block.isCompleted;
    await block.save();
    res.status(200).json(block);
  } catch (err: any) {
    res.status(500).json({ message: 'Gagal toggle timeblock' });
  }
});

// PUT /api/timeblocks/:id (Edit TimeBlock)
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { title, startTime, endTime, category } = req.body;
    const updateData: any = {};
    if (title) updateData.title = title;
    if (startTime) updateData.startTime = startTime;
    if (endTime) updateData.endTime = endTime;
    if (category) updateData.category = category;

    const block = await TimeBlock.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
    if (!block) return res.status(404).json({ message: 'Timeblock tidak ditemukan' });
    res.status(200).json(block);
  } catch (err: any) {
    res.status(500).json({ message: 'Gagal mengedit timeblock' });
  }
});

// DELETE /api/timeblocks/:id
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await TimeBlock.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Timeblock berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ message: 'Gagal menghapus timeblock' });
  }
});

export default router;
