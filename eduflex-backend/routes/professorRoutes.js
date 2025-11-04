// eduflex-backend/routes/professorRoutes.js
const express = require('express');
const router = express.Router();
const {
  getProfessorDashboard,
  getMyCourses,
  getMyAssignments,
  getCourseById,
  gradeAssignment,
  updateProfessorProfile,
  createCourse, // <-- Import new function
  updateCourse, // <-- Import new function
  deleteCourse  // <-- Import new function
} = require('../controllers/professorController.js');
const { authenticate, authorize } = require('../middleware/authMiddleware.js');

// All routes in this file are for professors only
router.use(authenticate);
router.use(authorize('professor')); // <-- *** FIX: Was 'teacher' ***

// --- Dashboard ---
router.get('/dashboard', getProfessorDashboard);

// --- Profile ---
router.put('/profile', updateProfessorProfile);

// --- Course Routes ---
router.get('/courses', getMyCourses);
router.post('/courses', createCourse);         // <-- ADDED: POST /api/professor/courses
router.get('/courses/:id', getCourseById);
router.put('/courses/:id', updateCourse);       // <-- ADDED: PUT /api/professor/courses/:id
router.delete('/courses/:id', deleteCourse);    // <-- ADDED: DELETE /api/professor/courses/:id

// --- Assignment Routes ---
router.get('/assignments', getMyAssignments);
router.post('/assignments/:id/grade', gradeAssignment);

module.exports = router;