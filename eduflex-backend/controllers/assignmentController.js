const Assignment = require('../models/Assignment');
const Course = require('../models/Course');

// @desc    Create a new assignment
// @route   POST /api/assignments
// @access  Private (Teacher)
const createAssignment = async (req, res) => {
  const { title, description, courseId, dueDate } = req.body;
  const course = await Course.findById(courseId);
  if (!course) return res.status(404).json({ message: 'Course not found' });

  // ensure teacher owns course
  if (req.user.role === 'teacher' && String(course.teacher) !== String(req.user.id)) {
    return res.status(403).json({ message: 'You can only create assignments for your own courses' });
  }

  const assignment = new Assignment({
    title, description, course: courseId, dueDate, createdBy: req.user.id
  });
  await assignment.save();
  res.status(201).json(assignment);
};

// @desc    Get all assignments for a course
// @route   GET /api/assignments/course/:courseId
// @access  Private
const getAssignmentsForCourse = async (req, res) => {
  const list = await Assignment.find({ course: req.params.courseId });
  res.json(list);
};

module.exports = {
  createAssignment,
  getAssignmentsForCourse
};