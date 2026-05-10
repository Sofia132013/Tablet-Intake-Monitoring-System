import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
    createSchedule,
    getSchedules,
} from '../controllers/scheduleController.js';

const router = express.Router();

router.get('/schedules', authMiddleware, getSchedules);
router.post('/schedules', authMiddleware, createSchedule);

export default router;
