import express from 'express';
import createIntake from '../controllers/intakeController.js';
import getIntakeHistory from '../controllers/intakeController.js';


const router = express.Router();

router.post('/intake', createIntake);
router.get('/intake/history', getIntakeHistory);

export default router;
