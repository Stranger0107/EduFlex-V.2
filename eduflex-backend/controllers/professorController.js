// eduflex-backend/controllers/professorController.js
const User = require('../models/User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');

// @desc    Get professor's dashboard data
// @route   GET /api/professor/dashboard
const getProfessorDashboard = async (req, res) => {
  try {
    const courses = await Course.find({ professor: req.user.id }).populate('students', 'name');
    const assignments = await Assignment.find({ course: { $in: courses.map(c => c._id) } }).populate('course', 'title');
    res.json({ courses, assignments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all courses for the logged-in professor
// @route   GET /api/professor/courses
const getMyCourses = async (req, res) => {
  try {
    const courses = await Course.find({ professor: req.user.id }).populate('students', 'name email');
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all assignments for the logged-in professor
// @route   GET /api/professor/assignments
const getMyAssignments = async (req, res) => {
  try {
    const courses = await Course.find({ professor: req.user.id }).select('_id');
    const courseIds = courses.map(c => c._id);
    const assignments = await Assignment.find({ course: { $in: courseIds } })
      .populate('course', 'title')
      .populate('submissions.student', 'name');
    res.json(assignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get a single course by ID
// @route   GET /api/professor/courses/:id
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      professor: req.user.id
    }).populate('students', 'name email');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found or you do not teach this course' });
    }
    res.json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Professor grades an assignment submission
// @route   POST /api/professor/assignments/:id/grade
const gradeAssignment = async (req, res) => {
  try {
    const { studentId, grade, feedback } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    const submission = assignment.submissions.find(
      (sub) => sub.student.toString() === studentId
    );
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    submission.grade = grade;
    submission.feedback = feedback;
    submission.gradedAt = Date.now();
    await assignment.save();
    res.json(assignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Professor updates their profile
// @route   PUT /api/professor/profile
const updateProfessorProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- NEW FUNCTION TO CREATE COURSE ---
// @desc    Professor creates a new course
// @route   POST /api/professor/courses
// @access  Private (Professor)
const createCourse = async (req, res) => {
  try {
    const { title, description } = req.body; 

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const newCourse = new Course({
      title,
      description,
      professor: req.user.id 
    });

    const createdCourse = await newCourse.save();
    res.status(201).json(createdCourse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating course' });
  }
};

// --- NEW FUNCTION TO UPDATE COURSE ---
// @desc    Professor updates their own course
// @route   PUT /api/professor/courses/:id
// @access  Private (Professor)
const updateCourse = async (req, res) => {
  try {
    const { title, description } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    if (course.professor.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to edit this course' });
    }

    course.title = title || course.title;
    course.description = description || course.description;

    const updatedCourse = await course.save();
    res.json(updatedCourse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating course' });
  }
};

// --- NEW FUNCTION TO DELETE COURSE ---
// @desc    Professor deletes their own course
// @route   DELETE /api/professor/courses/:id
// @access  Private (Professor)
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    if (course.professor.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this course' });
    }

    await Assignment.deleteMany({ course: course._id });
    await course.deleteOne();
    
    res.json({ message: 'Course and associated assignments removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting course' });
  }
};

// Export all functions needed by your router
module.exports = {
  getProfessorDashboard,
  getMyCourses,
  getMyAssignments,
  getCourseById,
  gradeAssignment,
  updateProfessorProfile,
  createCourse, 
  updateCourse, 
  deleteCourse
};