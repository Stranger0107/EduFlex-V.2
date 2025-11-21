const User = require('../models/User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
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