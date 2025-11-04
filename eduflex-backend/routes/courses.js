const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware.js');
// Import existing AND the new update/delete controller functions
const {
  createCourse,
  getAllCourses,
  enrollStudent,
  updateCourse, // <-- Make sure this is imported
  deleteCourse  // <-- Make sure this is imported
} = require('../controllers/courseController.js'); // NOTE: controller file is singular 'coursecontroller.js'

// All routes here are protected by login
router.use(authenticate);

// --- Define routes ---

// Create Course (teacher/admin)
router.post('/', authorize('teacher','admin'), createCourse);

// Get All Courses (any logged-in user)
router.get('/', getAllCourses);

// --- ADD THESE TWO LINES ---
// Update Course (teacher who owns it, or admin)
router.put('/:id', authorize('teacher','admin'), updateCourse);

// Delete Course (teacher who owns it, or admin)
router.delete('/:id', authorize('teacher','admin'), deleteCourse);
// --- END OF ADDED LINES ---

// Enroll Student (teacher or admin)
router.post('/:id/enroll', authorize('teacher','admin'), enrollStudent);

// (Optional placeholders for future features)
// router.get('/:id', getCourseById);
// router.delete('/:id/enroll/:studentId', authorize('teacher','admin'), unenrollStudent);

module.exports = router;