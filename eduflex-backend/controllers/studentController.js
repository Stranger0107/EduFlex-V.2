const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const path = require('path');

// @desc    Get all courses a student is enrolled in
// @route   GET /api/student/courses
// @access  Private (Student)
const getMyCourses = async (req, res) => {
  try {
    const courses = await Course.find({ students: req.user.id });
    res.json(courses);
  } catch (error) {
    console.error('Error in getMyCourses:', error);
    res.status(500).json({ message: 'Server error fetching courses' });
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
    console.error('Error in getCourseAssignments:', error);
    res.status(500).json({ message: 'Server error fetching assignments' });
  }
};

// @desc    Submit work for an assignment
// @route   POST /api/student/assignments/:id/submit
// @access  Private (Student)
const submitAssignment = async (req, res) => {
  try {
    const assignmentId = req.params.id;

    console.log(`📩 Submit Assignment | assignmentId: ${assignmentId}, student: ${req.user.id}`);

    const body = req.body || {};
    let submissionContent = null;

    // ============================
    // 🔥 1. Handle FILE SUBMISSION
    // ============================
    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get("host")}`;

      // final accessible URL
      submissionContent = `${baseUrl}/uploads/submissions/${assignmentId}/${req.file.filename}`;

      console.log("📂 File received:", submissionContent);
    }

    // ============================
    // 📝 2. Handle TEXT SUBMISSION
    // ============================
    if (!submissionContent) {
      submissionContent =
        body.submission ||
        body.textSubmission ||
        body.text ||
        null;
    }

    if (!submissionContent) {
      console.error("❌ No submission file or text provided");
      return res.status(400).json({ message: 'No submission content provided.' });
    }

    // ============================
    // 📘 Fetch Assignment + Course
    // ============================
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    const course = await Course.findById(assignment.course);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const studentId = req.user.id;
    const isEnrolled = course.students.some(id => id.toString() === studentId.toString());
    if (!isEnrolled) {
      return res.status(403).json({ message: 'You are not enrolled in this course' });
    }

    // ============================
    // 🧾 3. Save & Update Submission Entry
    // ============================
    const existingIndex = assignment.submissions.findIndex(
      (s) => s.student.toString() === studentId.toString()
    );

    if (existingIndex !== -1) {
      assignment.submissions[existingIndex].submission = submissionContent;
      assignment.submissions[existingIndex].submittedAt = Date.now();
      assignment.submissions[existingIndex].grade = null;       // reset grade if resubmitted
      assignment.submissions[existingIndex].feedback = "";
    } else {
      assignment.submissions.push({
        student: studentId,
        submission: submissionContent,
        submittedAt: Date.now(),
      });
    }

    await assignment.save();

    console.log("✅ Submission saved.");
    res.json({
      message: 'Assignment submitted successfully',
      submissionUrl: submissionContent,
    });

  } catch (error) {
    console.error('🔥 Error in submitAssignment:', error);
    res.status(500).json({ message: 'Server error saving submission', error: error.message });
  }
};

// @desc    View all my grades
// @route   GET /api/student/grades
// @access  Private (Student)
const getMyGrades = async (req, res) => {
  try {
    const assignments = await Assignment.find({
      'submissions.student': req.user.id,
    }).populate('course', 'title');

    const grades = assignments.map((a) => {
      const sub = a.submissions.find((s) => s.student.equals(req.user.id));
      return {
        assignmentId: a._id,
        assignmentTitle: a.title,
        course: a.course?.title || 'Untitled Course',
        grade: sub.grade ?? null,
        submitted: Boolean(sub.submission),
      };
    });

    res.json(grades);
  } catch (error) {
    console.error('Error in getMyGrades:', error);
    res.status(500).json({ message: 'Server error fetching grades' });
  }
};

// @desc    Get student dashboard stats
// @route   GET /api/student/dashboard
// @access  Private (Student)
const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user.id;

    const courses = await Course.find({ students: studentId });
    const assignments = await Assignment.find({
      course: { $in: courses.map((c) => c._id) },
    });

    const pendingAssignments = assignments.filter(
      (a) => !a.submissions.some((s) => String(s.student) === studentId)
    ).length;

    const allGrades = assignments.flatMap((a) =>
      a.submissions
        .filter((s) => String(s.student) === studentId && s.grade != null)
        .map((s) => s.grade)
    );

    const averageGrade =
      allGrades.length > 0
        ? (allGrades.reduce((sum, g) => sum + g, 0) / allGrades.length).toFixed(2)
        : 0;

    res.json({
      totalCourses: courses.length,
      pendingAssignments,
      averageGrade,
    });
  } catch (error) {
    console.error('Error fetching student dashboard:', error);
    res.status(500).json({ message: 'Server error fetching dashboard' });
  }
};

// @desc    Get all assignments from enrolled courses
// @route   GET /api/student/assignments
// @access  Private (Student)
const getMyAssignments = async (req, res) => {
  try {
    const studentId = req.user.id;

    const enrolledCourses = await Course.find({ students: studentId }).select('_id');

    if (enrolledCourses.length === 0) {
      return res.status(200).json([]);
    }

    const assignments = await Assignment.find({
      course: { $in: enrolledCourses.map(c => c._id) },
    })
      .populate('course', 'title')
      .sort({ dueDate: 1 })
      .lean();

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const processedAssignments = assignments.map(a => {
      const mySubmission = a.submissions
        ? a.submissions.find(s => String(s.student) === String(studentId))
        : null;

      let status = 'pending';
      let grade = null;
      let submission = null;
      let filePath = null;
      let originalName = null;

      if (mySubmission) {
        submission = mySubmission.submission;
        // prefer an explicit filePath property if available (from assignments controller)
        if (mySubmission.filePath) {
          filePath = mySubmission.filePath;
          // ensure absolute URL
          if (!filePath.startsWith('http')) filePath = `${baseUrl}${filePath}`;
        } else if (typeof mySubmission.submission === 'string' && mySubmission.submission.startsWith(`${baseUrl}/uploads`)) {
          // older submissions may have stored the full URL in `submission`
          filePath = mySubmission.submission;
        }

        // originalName may be stored, otherwise derive from filename
        if (mySubmission.originalName) {
          originalName = mySubmission.originalName;
        } else if (filePath) {
          try {
            originalName = path.basename(filePath);
          } catch (e) {
            originalName = null;
          }
        }

        if (mySubmission.grade != null) {
          status = 'graded';
          grade = mySubmission.grade;
        } else {
          status = 'submitted';
        }
      }

      // Compute submittedAt and isLate so frontend can show correct status after refresh
      let submittedAt = null;
      let isLate = false;
      if (mySubmission && mySubmission.submittedAt) {
        submittedAt = new Date(mySubmission.submittedAt).toISOString();
        const dueTs = a.dueDate ? new Date(a.dueDate).getTime() : null;
        const subTs = new Date(mySubmission.submittedAt).getTime();
        if (dueTs && !isNaN(subTs)) {
          isLate = subTs > dueTs;
        }
      }

      // Fix attachmentUrl
      if (a.attachmentUrl && !a.attachmentUrl.startsWith("http")) {
        a.attachmentUrl = `${baseUrl}${a.attachmentUrl}`;
      }

      return {
        assignmentId: a._id,
        title: a.title,
        description: a.description,
        course: a.course?.title,
        courseId: a.course?._id,
        due: a.dueDate,
        attachmentUrl: a.attachmentUrl,
        status,
        grade,
        submission,
        filePath,
        originalName,
        submittedAt,
        isLate,
      };
    });

    res.json(processedAssignments);
  } catch (error) {
    console.error('Error in getMyAssignments:', error);
    res.status(500).json({ message: 'Server error fetching assignments' });
  }
};

module.exports = {
  getMyCourses,
  getCourseAssignments,
  submitAssignment,
  getMyGrades,
  getStudentDashboard,
  getMyAssignments,
};
