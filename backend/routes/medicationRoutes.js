const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const medicationController = require('../controllers/medicationController');

router.use(authMiddleware);        // ← Protects all medication routes

router.get('/', medicationController.getMedications);
router.post('/', medicationController.createMedication);
router.delete('/:id', medicationController.deleteMedication);

module.exports = router;