const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware.js');

// Import controller functions
const {
  getMyCourses,
  getCourseAssignments,
  submitAssignment,
  getMyGrades
} = require('../controllers/studentController.js');

// All routes here are private and for 'student' role
router.use(authenticate);
router.use(authorize('student'));

// Routes
router.get('/courses', getMyCourses);
router.get('/assignments/:courseId', getCourseAssignments);
router.post('/assignments/:assignmentId/submit', submitAssignment);
router.get('/grades', getMyGrades);

module.exports = router;