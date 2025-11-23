const express = require('express');
const router = express.Router();
// (Route declarations moved below so auth middleware runs first)
const upload = require('../config/multerConfig');
const {
  getProfessorDashboard,
  getMyCourses,
  getMyAssignments,
  getCourseById,
  gradeAssignment,
  updateProfessorProfile,
  createCourse,
  updateCourse,
  deleteCourse,
  uploadStudyMaterial,
  getQuizReports,
} = require('../controllers/professorController');

const { authenticate, authorize } = require('../middleware/authMiddleware.js');

// Protect all routes — only for professors
router.use(authenticate);
router.use(authorize('professor'));

// Course forum endpoints (protected)
router.get('/courses/:id/forum', require('../controllers/professorController').getCourseForumMessages);
router.post('/courses/:id/forum', require('../controllers/professorController').sendCourseForumMessage);
// Meeting chat endpoints (protected)
router.get('/meetings/:id/messages', require('../controllers/professorController').getMeetingMessages);
router.post('/meetings/:id/messages', require('../controllers/professorController').sendMeetingMessage);

// Professor meetings list
router.get('/meetings', require('../controllers/professorController').getMyMeetings);

// --- Dashboard ---
router.get('/dashboard', getProfessorDashboard);

// --- Profile ---
router.put('/profile', updateProfessorProfile);

// --- Courses ---
router.get('/courses', getMyCourses);
router.post('/courses', createCourse);
router.get('/courses/:id', getCourseById);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

// ✅ Added 'upload.single' middleware here
router.post('/courses/:id/materials', upload.single('file'), uploadStudyMaterial);

// --- Assignments ---
router.get('/assignments', getMyAssignments);
router.post('/assignments/:id/grade', gradeAssignment);

// --- Quizzes Reports ---
router.get('/quizzes/:id/reports', getQuizReports);
// Schedule meeting with a student about a quiz
router.post('/quizzes/:quizId/reports/:studentId/schedule', require('../controllers/professorController').scheduleMeeting);

module.exports = router;