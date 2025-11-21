const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const path = require('path'); // For file system operations
const fs = require('fs'); // For file system operations
const User = require('../models/User'); // if you want to populate student info
const Notification = require('../models/Notification');

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
      const rootDir = path.join(__dirname, '..');
      const relativePath = path.relative(rootDir, req.file.path);

      // 2. Convert to URL format (force forward slashes for web compatibility)
      assignmentData.attachmentUrl = '/' + relativePath.split(path.sep).join('/');

      console.log('📎 Attachment saved at:', assignmentData.attachmentUrl);
    }

    // ✅ Save assignment
    const assignment = new Assignment(assignmentData);
    await assignment.save();

    // ✅ Create notifications for enrolled students
    try {
      if (course.students && course.students.length > 0) {
        const notifs = course.students.map((studentId) => ({
          user: studentId,
          title: `New assignment in ${course.title}`,
          message: `A new assignment "${assignment.title}" was posted. Due: ${new Date(assignment.dueDate).toLocaleString()}`,
          type: 'assignment_added',
          relatedId: String(assignment._id),
          link: `/assignments`,
        }));

        await Notification.insertMany(notifs);
      }
    } catch (notifErr) {
      console.error('Failed to create assignment notifications:', notifErr);
    }

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

// ======================================================
// 📄 Get a single assignment by its ID
// @route   GET /api/assignments/:id
// @access  Private (Professor or Admin)
// ======================================================
// (Also used by students, but auth is checked in the student controller)
const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate(
      'course',
      'title'
    );
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    // Note: Further auth checks (like if user is enrolled)
    // are handled by the specific routes that call this
    res.json(assignment);
  } catch (error) {
    console.error('Error fetching assignment by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ======================================================
// ❌ Delete an assignment
// @route   DELETE /api/assignments/:id
// @access  Private (Professor or Admin)
// ======================================================
const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Find the course to check for ownership
    const course = await Course.findById(assignment.course);
    if (!course) {
      return res.status(404).json({ message: 'Associated course not found' });
    }

    // Check if the user is the professor who owns the course or an admin
    const isProfessorOwner = course.professor.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isProfessorOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: 'User not authorized to delete this assignment' });
    }

    // Optional: Delete assignment file attachment if it exists
    if (assignment.attachmentUrl) {
      const filePath = path.join(__dirname, '..', assignment.attachmentUrl);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.warn('Could not delete assignment attachment file:', filePath, err.message);
        } else {
          console.log('Deleted attachment file:', filePath);
        }
      });
    }
    
    // TODO: Also delete all submission files from /uploads/submissions/

    await assignment.deleteOne();

    res.status(200).json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ======================================================
// POST /api/assignments/:id/submit
// Student submits text or a file
// Access: Private (student)
// ======================================================
const submitAssignment = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const userId = req.user.id;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found.' });

    const submittedAt = new Date();

    // Robust due date parsing
    const dueTime = assignment.dueDate ? new Date(assignment.dueDate).getTime() : null;
    const isLate = dueTime ? (submittedAt.getTime() > dueTime) : false;

    let filePath = '';
    let originalName = '';
    const submissionText = req.body.text || req.body.submission || '';

    if (req.file) {
      const rootDir = path.join(__dirname, '..');
      const relativePath = path.relative(rootDir, req.file.path);
      filePath = '/' + relativePath.split(path.sep).join('/');
      originalName = req.file.originalname || '';
    }

    const existingIndex = assignment.submissions.findIndex(s => String(s.student) === String(userId));

    const submissionObj = {
      student: userId,
      submission: submissionText || (filePath ? originalName : ''),
      filePath,
      originalName,
      submittedAt,
      isLate,
    };

    if (existingIndex > -1) {
      assignment.submissions[existingIndex] = {
        ...assignment.submissions[existingIndex]._doc,
        ...submissionObj
      };
    } else {
      assignment.submissions.push(submissionObj);
    }

    await assignment.save();

    const savedSubmission = existingIndex > -1 ? assignment.submissions[existingIndex] : assignment.submissions[assignment.submissions.length - 1];

    // normalize submittedAt to ISO and return the submission object directly
    const savedPlain = {
      submission: savedSubmission.submission,
      filePath: savedSubmission.filePath,
      originalName: savedSubmission.originalName,
      submittedAt: savedSubmission.submittedAt
        ? new Date(savedSubmission.submittedAt).toISOString()
        : new Date().toISOString(),
      isLate: !!savedSubmission.isLate,
      grade: savedSubmission.grade ?? null,
      feedback: savedSubmission.feedback ?? null,
      student: savedSubmission.student
    };

    // Return the submission object directly (not wrapped) — frontend expects this shape
    return res.status(existingIndex > -1 ? 200 : 201).json(savedPlain);
  } catch (err) {
    console.error('submitAssignment error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ======================================================
// GET /api/assignments/:id/submissions
// Professor/Admin view: list all submissions for an assignment
// Access: Private (professor who owns course or admin)
// ======================================================
const getSubmissionsForAssignment = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const assignment = await Assignment.findById(assignmentId).lean();
    if (!assignment) return res.status(404).json({ message: 'Assignment not found.' });

    const course = await Course.findById(assignment.course);
    const isProfessorOwner = course && String(course.professor) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';
    if (!isProfessorOwner && !isAdmin) return res.status(403).json({ message: 'Not authorized.' });

    const dueTime = assignment.dueDate ? new Date(assignment.dueDate).getTime() : null;

    // populate minimal student info and ensure isLate computed
    const populated = await Promise.all((assignment.submissions || []).map(async (s) => {
      let studentObj = s.student;
      if (s.student) {
        try {
          const u = await User.findById(s.student).select('name email').lean();
          if (u) studentObj = u;
        } catch {}
      }
      const computedIsLate = (typeof s.isLate === 'boolean')
        ? s.isLate
        : (s.submittedAt && dueTime ? (new Date(s.submittedAt).getTime() > dueTime) : false);

      return {
        student: studentObj,
        submission: s.submission ?? null,
        filePath: s.filePath ?? null,
        originalName: s.originalName ?? null,
        submittedAt: s.submittedAt ? new Date(s.submittedAt).toISOString() : null,
        isLate: !!computedIsLate,
        grade: s.grade ?? null,
        feedback: s.feedback ?? null,
      };
    }));

    return res.json(populated);
  } catch (err) {
    console.error('getSubmissionsForAssignment error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ======================================================
// GET /api/assignments/mine
// Student: get all submissions made by current student
// Access: Private (student)
// ======================================================
const getMySubmissions = async (req, res) => {
  try {
    const userId = req.user.id;
    const assignments = await Assignment.find({ 'submissions.student': userId })
      .select('title course dueDate submissions')
      .lean();

    const result = [];
    for (const a of assignments) {
      const dueTime = a.dueDate ? new Date(a.dueDate).getTime() : null;
      for (const s of (a.submissions || [])) {
        if (String(s.student) === String(userId)) {
          const computedIsLate = (typeof s.isLate === 'boolean')
            ? s.isLate
            : (s.submittedAt && dueTime ? (new Date(s.submittedAt).getTime() > dueTime) : false);

          result.push({
            assignmentId: a._id,
            assignmentTitle: a.title,
            // also include `title` for frontend convenience
            title: a.title,
            course: a.course,
            dueDate: a.dueDate,
            submission: s.submission ?? null,
            filePath: s.filePath ?? null,
            originalName: s.originalName ?? null,
            submittedAt: s.submittedAt ? new Date(s.submittedAt).toISOString() : null,
            isLate: !!computedIsLate,
            grade: s.grade ?? null,
            feedback: s.feedback ?? null,
          });
        }
      }
    }

    // NOTE: return the array directly (frontend expects an array)
    return res.json(result);
  } catch (err) {
    console.error('getMySubmissions error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// --- Export all functions ---
module.exports = {
  createAssignment,
  getAssignmentsForCourse,
  getAssignmentById,
  deleteAssignment,
  submitAssignment,
  getSubmissionsForAssignment,
  getMySubmissions,
};
