const Course = require('../models/Course');
const Assignment = require('../models/Assignment');

// @desc    Get all courses a student is enrolled in
// @route   GET /api/student/courses
// @access  Private (Student)
const getMyCourses = async (req, res) => {
  try {
    const courses = await Course.find({ students: req.user.id });
    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all assignments for a specific course
// @route   GET /api/student/assignments/:courseId
// @access  Private (Student)
const getCourseAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ course: req.params.courseId });
    res.json(assignments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Submit work for an assignment
// @route   POST /api/student/assignments/:assignmentId/submit
// @access  Private (Student)
const submitAssignment = async (req, res) => {
  try {
    const { submission } = req.body; // e.g., file URL or text
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    // Check if student is enrolled in the course
    const course = await Course.findById(assignment.course);
    if (!course.students.includes(req.user.id)) return res.status(403).json({ message: 'Not enrolled in this course' });

    // Add or update submission
    const existingSubmissionIndex = assignment.submissions.findIndex(s => s.student.equals(req.user.id));
    if (existingSubmissionIndex !== -1) {
      assignment.submissions[existingSubmissionIndex].submission = submission;
    } else {
      assignment.submissions.push({ student: req.user.id, submission: submission });
    }

    await assignment.save();
    res.json({ message: 'Submission saved', assignment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    View all my grades
// @route   GET /api/student/grades
// @access  Private (Student)
const getMyGrades = async (req, res) => {
  try {
    const assignments = await Assignment.find({ 'submissions.student': req.user.id })
      .populate('course', 'title');
      
    const grades = assignments.map(a => {
      const sub = a.submissions.find(s => s.student.equals(req.user.id));
      return {
        assignmentId: a._id,
        assignmentTitle: a.title,
        course: a.course.title, // 'a.course.name' was a bug, Course model has 'title'
        grade: sub.grade || null,
        submitted: sub.submission ? true : false
      };
    });
    res.json(grades);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMyCourses,
  getCourseAssignments,
  submitAssignment,
  getMyGrades
};