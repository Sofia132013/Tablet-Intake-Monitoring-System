import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
    createMedication,
    deleteMedication,
    getMedications,
} from '../controllers/medicationController.js';

const router = express.Router();

router.get('/medications', authMiddleware, getMedications);
router.post('/medications', authMiddleware, createMedication);
router.delete('/medications/:id', authMiddleware, deleteMedication);

export default router;
