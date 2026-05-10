const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const scheduleController = require('../controllers/scheduleController');

router.use(authMiddleware);

router.get('/', scheduleController.getSchedules);
router.post('/', scheduleController.createSchedule);

module.exports = router;