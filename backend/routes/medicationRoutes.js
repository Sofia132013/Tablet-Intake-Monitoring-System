import express from 'express';
import {
    createMedication,
    createSchedule,
    deleteMedication,
    getMedications,
    getSchedules,
} from '../controllers/medicationController.js';

const router = express.Router();

router.get('/medications', getMedications);
router.post('/medications', createMedication);
router.delete('/medications/:id', deleteMedication);

router.get('/schedules', getSchedules);
router.post('/schedules', createSchedule);

export default router;
