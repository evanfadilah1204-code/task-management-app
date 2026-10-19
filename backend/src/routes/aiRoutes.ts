import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from './todoRoutes';
import { processAIChat } from '../services/aiService';

const router = Router();

// POST /api/ai/chat
router.post('/chat', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User ID tidak ditemukan dari token!' });
    }

    const { prompt, history } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ message: 'Pesan prompt tidak boleh kosong!' });
    }

    const result = await processAIChat(userId, prompt, history || []);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('💥 Error aiRoute:', error);
    res.status(500).json({ message: 'Gagal memproses pesan AI', error: error.message });
  }
});

export default router;
