import { Router } from 'express';
import { register, login, googleLogin } from '../controllers/authcontroller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);

export default router;