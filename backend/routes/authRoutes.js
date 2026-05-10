import express from 'express';
import { loginOrRegister } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', loginOrRegister);

export default router;
