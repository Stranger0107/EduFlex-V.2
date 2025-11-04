// eduflex-backend/routes/admin.js
const express = require('express');
const router = express.Router();
const {
  getDashboardStats, // <-- Fixes dashboard 404
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse
} = require('../controllers/adminController.js');

const { authenticate, authorize } = require('../middleware/authMiddleware.js');

// Apply authentication and admin authorization to all routes in this file
router.use(authenticate);
router.use(authorize('admin'));

// --- Dashboard ---
router.get('/stats', getDashboardStats); // <-- Fixes dashboard 404

// --- User Routes ---
router.get('/users', getAllUsers);
router.post('/users', createUser); // <-- Fixes create user 404
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// --- Course Routes ---
router.get('/courses', getAllCourses);
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

module.exports = router;