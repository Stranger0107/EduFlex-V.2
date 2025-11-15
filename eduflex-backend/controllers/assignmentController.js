const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const path = require('path'); // ✅ Import path module

// ======================================================
// 🧾 Create a new assignment (with optional file upload)
// @route   POST /api/assignments
// @access  Private (Professor or Admin)
// ======================================================
const createAssignment = async (req, res) => {
  try {
    const { title, description, dueDate, courseId } = req.body;

    // ✅ Validate inputs
    if (!title || !description || !dueDate || !courseId) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // ✅ Find the course and verify ownership
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found.' });

    // ✅ Only the professor who owns the course or admin can create
    if (
      req.user.role !== 'admin' &&
      String(course.professor) !== String(req.user.id)
    ) {
      return res.status(403).json({
        message: 'You are not authorized to create assignments for this course.',
      });
    }

    // ✅ Build assignment object
    const assignmentData = {
      title,
      description,
      dueDate,
      course: courseId,
      submissions: [],
    };

    // ✅ Handle uploaded file (optional)
    if (req.file) {
      // 1. Get path relative to the backend root
      // This finds the ACTUAL path where multer saved the file, regardless of folder
      const rootDir = path.join(__dirname, '..'); 
      const relativePath = path.relative(rootDir, req.file.path);
      
      // 2. Convert to URL format (force forward slashes for web compatibility)
      // This fixes the issue if the file ended up in 'general' or if running on Windows
      assignmentData.attachmentUrl = '/' + relativePath.split(path.sep).join('/');
      
      console.log("📎 Attachment saved at:", assignmentData.attachmentUrl);
    }

    // ✅ Save assignment
    const assignment = new Assignment(assignmentData);
    await assignment.save();

    res.status(201).json({
      message: 'Assignment created successfully.',
      assignment,
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ message: 'Server error creating assignment.' });
  }
};

// ======================================================
// 📋 Get all assignments for a specific course
// @route   GET /api/assignments/course/:courseId
// @access  Private (Student, Professor, Admin)
// ======================================================
const getAssignmentsForCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found.' });

    // ✅ Authorization check (professor must own or student enrolled)
    const isProfessor = String(course.professor) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';
    const isStudent =
      req.user.role === 'student' &&
      course.students.map((id) => id.toString()).includes(req.user.id);

    if (!isProfessor && !isAdmin && !isStudent) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to view these assignments.' });
    }

    const assignments = await Assignment.find({ course: req.params.courseId })
      .sort({ dueDate: 1 }) // nearest due date first
      .lean();

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Server error fetching assignments.' });
  }
};

module.exports = {
  createAssignment,
  getAssignmentsForCourse,
};