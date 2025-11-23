import express from 'express';
import { loginDoctor, signupDoctor } from '../controllers/authController';

const router = express.Router();

router.post('/signup-doctor', signupDoctor);
router.post('/login-doctor', loginDoctor);

export default router;
