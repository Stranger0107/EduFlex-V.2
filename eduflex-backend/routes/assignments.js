const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware.js');
const {
  createAssignment,
  getAssignmentsForCourse
} = require('../controllers/assignmentController.js');

// All routes here are protected by login
router.use(authenticate);

// create assignment (teacher only)
router.post('/', authorize('teacher'), createAssignment);

// list assignments for a course
router.get('/course/:courseId', getAssignmentsForCourse);

module.exports = router;