const express = require('express');
const router = express.Router();
const insightController = require('../controllers/insightController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// generate (professor/admin or cron) - allow professors and admins
router.post('/generate', authenticate, authorize('professor','admin'), insightController.generateWeeklyInsights);

// get insights for a student (professor/admin/student)
router.get('/student/:studentId', authenticate, authorize('professor','admin','student'), insightController.getStudentInsights);

// add suggestion to an insight (professor)
router.post('/:insightId/suggestions', authenticate, authorize('professor'), insightController.addSuggestion);

// approve a suggestion (professor/admin)
router.patch('/:insightId/suggestions/:suggId/approve', authenticate, authorize('professor','admin'), insightController.approveSuggestion);

// get suggestions for a student (student/professor/admin)
router.get('/:studentId/suggestions', authenticate, authorize('professor','admin','student'), insightController.getSuggestionsForStudent);

module.exports = router;
