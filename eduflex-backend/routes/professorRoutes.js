const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/authMiddleware');

const { createCourseHandler, 
        createAssignmentHandler, 
        getMyCoursesHandler, 
        getMyAssignmentsHandler, 
        getStudentsInCourseHandler, 
        gradeSubmissionHandler }=require('../controllers/professorController')

router.use(authenticate);
router.use(authorize('teacher'));

// Teacher - Get my courses
router.get('/courses',  getMyCoursesHandler);

// Teacher - Create Assignment
router.post('/assignments',  createAssignmentHandler);

// Teacher - View my assignments
router.get('/assignments', getMyAssignmentsHandler);

// Teacher - View students in a course
router.get('/courses/:id/students',  getStudentsInCourseHandler);

// Teacher - Grade assignment submission
router.patch('/assignments/:id/grade',  gradeSubmissionHandler);


module.exports = router;
