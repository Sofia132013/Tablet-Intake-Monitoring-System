import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
    createIntake,
    getIntakeHistory,
} from '../controllers/intakeController.js';


const router = express.Router();

router.post('/intake', authMiddleware, createIntake);
router.get('/intake/history', authMiddleware, getIntakeHistory);

export default router;
