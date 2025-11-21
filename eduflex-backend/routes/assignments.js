const express = require('express');
const router = express.Router();
const upload = require('../config/multerConfig');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const {
  createAssignment,
  getAssignmentsForCourse,
  getAssignmentById,
  deleteAssignment,
  submitAssignment,
  getSubmissionsForAssignment,
  getMySubmissions,
} = require('../controllers/assignmentController');

// All routes need authentication
router.use(authenticate);

// ===============================
// POST /api/assignments
// Create assignment + upload file
// ===============================
router.post(
  '/',
  authorize('professor', 'admin'),

  // Pass courseId BEFORE multer runs (keeps compatibility with your multerConfig)
  (req, res, next) => {
    req.uploadType = 'assignments';
    const courseId = req.headers['x-course-id'];
    if (courseId) {
      req.query.courseId = courseId; // multer will use this if needed
    }
    next();
  },

  upload.single('file'), // field name MUST be "file"
  createAssignment
);

// ===============================
// GET /api/assignments/course/:courseId
// ===============================
router.get('/course/:courseId', getAssignmentsForCourse);

// ===============================
// Student submit (file upload or text)
// POST /api/assignments/:id/submit
// ===============================
router.post(
  '/:id/submit',
  authorize('student'), // ensure only students submit
  (req, res, next) => {
    // Hint for multerConfig to choose destination if it uses req.uploadType
    req.uploadType = 'submissions';
    next();
  },
  upload.single('file'), // field name "file"
  submitAssignment
);

// ===============================
// Professor/Admin: get all submissions for an assignment
// GET /api/assignments/:id/submissions
// ===============================
router.get('/:id/submissions', getSubmissionsForAssignment);

// ===============================
// Student: get my submissions
// GET /api/assignments/mine
// ===============================
router.get('/mine', authorize('student'), getMySubmissions);

// ===============================
// GET /api/assignments/:id
// (Specific route — placed after more specific subroutes)
// ===============================
router.get('/:id', getAssignmentById);

// ===============================
// DELETE /api/assignments/:id
// ===============================
router.delete('/:id', authorize('professor', 'admin'), deleteAssignment);

module.exports = router;
