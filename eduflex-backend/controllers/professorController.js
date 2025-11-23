// ============================
// ✅ Course forum: fetch messages (professor)
// GET /api/professor/courses/:id/forum
exports.getCourseForumMessages = async (req, res) => {
  try {
    const CourseForumMessage = require('../models/CourseForumMessage');
    const messages = await CourseForumMessage.find({ course: req.params.id }).populate('sender', 'name email').sort({ sentAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error('Error in getCourseForumMessages:', err);
    res.status(500).json({ message: 'Server error fetching forum messages' });
  }
};

// ✅ Course forum: send message (professor)
// POST /api/professor/courses/:id/forum
exports.sendCourseForumMessage = async (req, res) => {
  try {
    const CourseForumMessage = require('../models/CourseForumMessage');
    const { text } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) return res.status(400).json({ message: 'Message text required' });
    const msg = new CourseForumMessage({ course: req.params.id, sender: req.user.id, text });
    await msg.save();
    await msg.populate('sender', 'name email');
    res.status(201).json(msg);
  } catch (err) {
    console.error('Error in sendCourseForumMessage:', err);
    res.status(500).json({ message: 'Server error sending forum message' });
  }
};
// ============================
// ✅ Meeting chat: fetch messages (professor)
// GET /api/professor/meetings/:id/messages
exports.getMeetingMessages = async (req, res) => {
  try {
    const MeetingMessage = require('../models/MeetingMessage');
    console.log(`[professorController] GET messages for meeting ${req.params.id} by user ${req.user?.id}`);
    const messages = await MeetingMessage.find({ meeting: req.params.id }).populate('sender', 'name email').sort({ sentAt: 1 });
    console.log(`[professorController] returning ${messages.length} messages for meeting ${req.params.id}`);
    res.json(messages);
  } catch (err) {
    console.error('Error in getMeetingMessages:', err);
    res.status(500).json({ message: 'Server error fetching messages' });
  }
};

// ✅ Meeting chat: send message (professor)
// POST /api/professor/meetings/:id/messages
exports.sendMeetingMessage = async (req, res) => {
  try {
    const Meeting = require('../models/Meeting');
    const MeetingMessage = require('../models/MeetingMessage');
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    // Only student or professor in meeting can send
    if (![String(meeting.student), String(meeting.professor)].includes(String(req.user.id))) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { text } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) return res.status(400).json({ message: 'Message text required' });
    const msg = new MeetingMessage({ meeting: meeting._id, sender: req.user.id, text });
    await msg.save();
    await msg.populate('sender', 'name email');
    console.log(`[professorController] saved message ${msg._id} for meeting ${meeting._id} by user ${req.user.id}`);
    res.status(201).json(msg);
  } catch (err) {
    console.error('Error in sendMeetingMessage:', err);
    res.status(500).json({ message: 'Server error sending message' });
  }
};
const User = require('../models/User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const Meeting = require('../models/Meeting');
const path = require('path');
const bcrypt = require('bcryptjs');
const Notification = require('../models/Notification');

// =========================================
// 📚 Upload Study Material (File Upload)
// =========================================
exports.uploadStudyMaterial = async (req, res) => {
  try {
    const { title } = req.body;
    const courseId = req.params.id;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (String(course.professor) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to upload materials for this course' });
    }

    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const rootDir = path.join(__dirname, '..');
    const relativePath = path.relative(rootDir, req.file.path);
    const fileUrl = '/' + relativePath.split(path.sep).join('/');

    const newMaterial = { title, fileUrl };

    course.materials.push(newMaterial);
    await course.save();

    res.status(200).json({
      message: 'File uploaded successfully!',
      material: newMaterial,
    });
  } catch (err) {
    console.error('Error uploading study material:', err);
    res.status(500).json({ message: 'Server error uploading study material' });
  }
};

// ============================
// ✅ Professor Dashboard
// ============================
exports.getProfessorDashboard = async (req, res) => {
  try {
    const courses = await Course.find({ professor: req.user.id });
    const assignments = await Assignment.find({
      course: { $in: courses.map(c => c._id) },
    });

    res.json({
      totalCourses: courses.length,
      totalAssignments: assignments.length,
    });
  } catch (error) {
    console.error('Error in getProfessorDashboard:', error);
    res.status(500).json({ error: 'Server error loading dashboard' });
  }
};

// ============================
// ✅ Get All My Courses
// ============================
exports.getMyCourses = async (req, res) => {
  try {
    const courses = await Course.find({ professor: req.user.id });
    res.json(courses);
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ error: 'Server error fetching courses' });
  }
};

// ============================
// ✅ Get Specific Course
// ============================
exports.getCourseById = async (req, res) => {
  try {
    // ✅ FIX: Populate students so frontend gets names/emails, not just IDs
    const course = await Course.findById(req.params.id)
      .populate('students', 'name email'); 

    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (String(course.professor) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    res.json(course);
  } catch (err) {
    console.error('Error fetching course:', err);
    res.status(500).json({ error: 'Server error fetching course' });
  }
};

// ============================
// ✅ Create a Course
// ============================
exports.createCourse = async (req, res) => {
  try {
    const { title, description, enrollmentKey } = req.body;
    const newCourse = new Course({
      title,
      description,
      professor: req.user.id,
    });

    if (enrollmentKey && typeof enrollmentKey === 'string' && enrollmentKey.trim() !== '') {
      newCourse.enrollmentKeyHash = await bcrypt.hash(enrollmentKey, 10);
    }

    const saved = await newCourse.save();

    const populatedCourse = await Course.findById(saved._id)
      .populate('professor', 'name email')
      .populate('students', 'name email')
      .select('title description professor students materials createdAt updatedAt enrollmentKeyHash');

    const obj = populatedCourse.toObject();
    obj.enrollmentRequired = !!obj.enrollmentKeyHash;
    delete obj.enrollmentKeyHash;

    res.status(201).json(obj);
  } catch (err) {
    console.error('Error creating course:', err);
    res.status(500).json({ error: 'Server error creating course' });
  }
};

// ============================
// ✅ Update Course
// ============================
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (String(course.professor) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { title, description } = req.body;
    if (title) course.title = title;
    if (description) course.description = description;

    // Handle enrollmentKey updates
    if (Object.prototype.hasOwnProperty.call(req.body, 'enrollmentKey')) {
      const newKey = req.body.enrollmentKey;
      if (newKey && newKey.trim() !== '') {
        course.enrollmentKeyHash = await bcrypt.hash(newKey, 10);
      } else {
        course.enrollmentKeyHash = '';
      }
    }

    const updated = await course.save();

    const populatedCourse = await Course.findById(updated._id)
      .populate('professor', 'name email')
      .populate('students', 'name email')
      .select('title description professor students materials createdAt updatedAt enrollmentKeyHash');

    const obj = populatedCourse.toObject();
    obj.enrollmentRequired = !!obj.enrollmentKeyHash;
    delete obj.enrollmentKeyHash;

    res.json(obj);
  } catch (err) {
    console.error('Error updating course:', err);
    res.status(500).json({ error: 'Server error updating course' });
  }
};

// ============================
// ✅ Delete Course
// ============================
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (String(course.professor) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await course.deleteOne();
    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    console.error('Error deleting course:', err);
    res.status(500).json({ error: 'Server error deleting course' });
  }
};

// ============================
// ✅ Get Professor Assignments
// ============================
exports.getMyAssignments = async (req, res) => {
  try {
    const courses = await Course.find({ professor: req.user.id });
    const assignments = await Assignment.find({
      course: { $in: courses.map(c => c._id) },
    }).populate('submissions.student', 'name email');

    res.json(assignments);
  } catch (err) {
    console.error('Error fetching assignments:', err);
    res.status(500).json({ error: 'Server error fetching assignments' });
  }
};

// ============================
// ✅ Grade an Assignment
// ============================
exports.gradeAssignment = async (req, res) => {
  try {
    console.log(`📝 [Grade] Assignment: ${req.params.id}, Student: ${req.body.studentId}, Grade: ${req.body.grade}`);
    
    const { grade, feedback, studentId } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const submission = assignment.submissions.find(
      (s) => String(s.student) === String(studentId)
    );

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    submission.grade = grade;
    submission.feedback = feedback;
    await assignment.save();

    // Notify the student about the grade
    try {
      const notif = new Notification({
        user: studentId,
        title: `Assignment graded: ${assignment.title}`,
        message: `Your submission for "${assignment.title}" has been graded: ${grade}`,
        type: 'graded',
        relatedId: String(assignment._id),
        link: `/assignments`,
      });
      await notif.save();
    } catch (notifErr) {
      console.error('Failed to create grade notification:', notifErr);
    }

    res.json({ message: 'Grade updated successfully' });
  } catch (err) {
    console.error('🔥 Error grading assignment:', err);
    res.status(500).json({ error: 'Server error grading assignment' });
  }
};

// ============================
// ✅ Update Professor Profile
// ============================
exports.updateProfessorProfile = async (req, res) => {
  try {
    const { name, department, email } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Professor not found' });

    if (name) user.name = name;
    if (department) user.department = department;
    if (email) user.email = email;

    const updatedUser = await user.save();
    const safeUser = updatedUser.toObject();
    delete safeUser.password;

    res.json(safeUser);
  } catch (err) {
    console.error('Error updating profile:', err.message);
    res.status(500).json({ error: 'Server error while updating profile' });
  }
};

// ============================
// ✅ Get Quiz Reports (per-student scores)
// ============================
exports.getQuizReports = async (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = await Quiz.findById(quizId).populate('course').populate('submissions.student', 'name email');
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    // Ensure the requesting professor owns the course
    if (!quiz.course || String(quiz.course.professor) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized to view this quiz' });
    }

    const reports = (quiz.submissions || []).map((s) => {
      const percent = (s.total && typeof s.score === 'number') ? Math.round((s.score / s.total) * 100) : null;
      return {
        student: s.student || null,
        score: typeof s.score === 'number' ? s.score : null,
        total: s.total ?? null,
        percent,
        submittedAt: s.submittedAt || null,
      };
    });

    res.json({ quiz: { _id: quiz._id, title: quiz.title, course: quiz.course }, reports });
  } catch (err) {
    console.error('Error in getQuizReports:', err);
    res.status(500).json({ error: 'Server error fetching quiz reports' });
  }
};

// ============================
// ✅ Schedule a 1:1 Meeting with a student
// POST /professor/quizzes/:quizId/reports/:studentId/schedule
exports.scheduleMeeting = async (req, res) => {
  try {
    const { quizId, studentId } = req.params;
    const { scheduledAt, durationMins, notes } = req.body;

    if (!scheduledAt) return res.status(400).json({ error: 'scheduledAt (ISO datetime) is required' });

    const quiz = await Quiz.findById(quizId).populate('course');
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    // Ensure professor owns the course
    if (!quiz.course || String(quiz.course.professor) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized to schedule for this quiz' });
    }

    // Create meeting
    const meeting = new Meeting({
      course: quiz.course._id,
      professor: req.user.id,
      student: studentId,
      quiz: quiz._id,
      scheduledAt: new Date(scheduledAt),
      durationMins: Number(durationMins || 30),
      notes: notes || '',
    });

    await meeting.save();

    // Notify student
    try {
      const Notification = require('../models/Notification');
      const notif = new Notification({
        user: studentId,
        title: `1:1 session scheduled by ${req.user.name || 'Professor'}`,
        message: `A 1:1 session has been scheduled for ${new Date(scheduledAt).toLocaleString()}.`,
        type: 'other',
        relatedId: String(meeting._id),
        link: `/professor/meetings/${meeting._id}`,
      });
      await notif.save();
    } catch (nerr) {
      console.error('Failed to create notification for meeting:', nerr);
    }

    res.status(201).json({ message: 'Meeting scheduled', meeting });
  } catch (err) {
    console.error('Error scheduling meeting:', err);
    res.status(500).json({ error: 'Server error scheduling meeting' });
  }
};
// ✅ Get my scheduled meetings (professor view)
// GET /api/professor/meetings
exports.getMyMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({ professor: req.user.id })
      .populate('student', 'name email')
      .populate('course', 'title')
      .populate('quiz', 'title')
      .sort({ scheduledAt: 1 });
    res.json(meetings);
  } catch (err) {
    console.error('Error in getMyMeetings:', err);
    res.status(500).json({ message: 'Server error fetching meetings' });
  }
};