const Course = require('../models/Course');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// ======================================================
// 📘 Create a new course
// @route   POST /api/courses
// @access  Private (Admin, Professor)
// ======================================================
const createCourse = async (req, res) => {
  try {
    const { title, description, professor: professorIdFromBody, enrollmentKey } = req.body;

    // Determine professor ID
    let professorId;
    if (req.user.role === 'professor') {
      professorId = req.user.id;
    } else if (req.user.role === 'admin' && professorIdFromBody) {
      const assignedProfessor = await User.findById(professorIdFromBody);
      if (!assignedProfessor || assignedProfessor.role !== 'professor') {
        return res.status(400).json({ message: 'Invalid professor ID provided' });
      }
      professorId = professorIdFromBody;
    } else if (req.user.role === 'admin' && !professorIdFromBody) {
      return res.status(400).json({ message: 'Admin must assign a professor ID when creating a course' });
    } else {
      return res.status(403).json({ message: 'Unauthorized role for course creation' });
    }

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const course = new Course({ title, description, professor: professorId });

    // If an enrollmentKey is provided, hash and store it
    if (enrollmentKey && typeof enrollmentKey === 'string' && enrollmentKey.trim() !== '') {
      const hash = await bcrypt.hash(enrollmentKey, 10);
      course.enrollmentKeyHash = hash;
    }
    await course.save();

    const populatedCourse = await Course.findById(course._id)
      .populate('professor', 'name email')
      .populate('students', 'name email')
      .select('title description professor students materials createdAt updatedAt enrollmentKeyHash');

    const obj = populatedCourse.toObject();
    obj.enrollmentRequired = !!obj.enrollmentKeyHash;
    delete obj.enrollmentKeyHash;
    res.status(201).json(obj);
  } catch (error) {
    console.error('Create Course Error:', error);
    res.status(500).json({ message: 'Server error creating course' });
  }
};

// ======================================================
// 📘 Upload Study Material
// @route   POST /api/courses/:id/materials
// @access  Private (Professor who owns the course)
// ======================================================
const uploadStudyMaterial = async (req, res) => {
  try {
    const { title, fileUrl } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (!title || !fileUrl)
      return res.status(400).json({ message: 'Title and file URL are required' });

    // ✅ Only the professor who owns the course can upload
    if (!course.professor.equals(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to upload materials for this course' });
    }

    course.materials.push({ title, fileUrl });
    await course.save();

    const updatedCourse = await Course.findById(course._id)
      .populate('professor', 'name email')
      .populate('students', 'name email');

    res.status(200).json(updatedCourse);
  } catch (error) {
    console.error('Upload Material Error:', error);
    res.status(500).json({ message: 'Server error uploading study material' });
  }
};

// ======================================================
// 📗 Get all courses (with study materials)
// @route   GET /api/courses
// @access  Private
// ======================================================
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('professor', 'name email')
      .populate('students', 'name email')
      .select('title description professor students materials createdAt updatedAt enrollmentKeyHash'); // include key hash to compute flag

    // Map to remove the hash and expose enrollmentRequired
    const mapped = courses.map(c => {
      const obj = c.toObject();
      return {
        ...obj,
        enrollmentRequired: !!obj.enrollmentKeyHash,
        // don't send the hash to the client
        enrollmentKeyHash: undefined,
      };
    });

    res.json(mapped);
  } catch (error) {
    console.error('Get All Courses Error:', error);
    res.status(500).json({ message: 'Server error fetching courses' });
  }
};

// ======================================================
// 📙 Get single course by ID (with materials)
// @route   GET /api/courses/:id
// @access  Private
// ======================================================
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('professor', 'name email')
      .populate('students', 'name email')
      .select('title description professor students materials createdAt updatedAt enrollmentKeyHash');

    if (!course) return res.status(404).json({ message: 'Course not found' });
    const obj = course.toObject();
    obj.enrollmentRequired = !!obj.enrollmentKeyHash;
    delete obj.enrollmentKeyHash;
    res.json(obj);
  } catch (error) {
    console.error('Get Course by ID Error:', error);
    res.status(500).json({ message: 'Server error fetching course' });
  }
};

// ======================================================
// 🎓 Enroll a student
// ======================================================
const enrollStudent = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    let studentId = req.body.studentId;
    const providedKey = req.body.enrollmentKey;
    if (req.user.role === 'student') studentId = req.user.id;

    if (req.user.role === 'professor' && !course.professor.equals(req.user.id))
      return res.status(403).json({ message: 'Not authorized' });

    if (req.user.role === 'admin' && !studentId)
      return res.status(400).json({ message: 'Admin must specify studentId' });

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student')
      return res.status(400).json({ message: 'Invalid student ID' });

    // If the course requires an enrollment key, verify it unless the requester
    // is the course professor (owner) or an admin enrolling someone.
    if (course.enrollmentKeyHash) {
      const isOwnerProfessor = req.user.role === 'professor' && course.professor.equals(req.user.id);
      const isAdmin = req.user.role === 'admin';
      // If not privileged, require and validate the key
      if (!isOwnerProfessor && !isAdmin) {
        if (!providedKey) {
          return res.status(400).json({ message: 'Enrollment key required for this course.' });
        }
        const match = await bcrypt.compare(providedKey, course.enrollmentKeyHash);
        if (!match) {
          return res.status(403).json({ message: 'Invalid enrollment key.' });
        }
      }
    }

    if (!course.students.map(id => id.toString()).includes(studentId.toString())) {
      course.students.push(studentId);
      await course.save();
    }

    const populatedCourse = await Course.findById(course._id)
      .populate('professor', 'name email')
      .populate('students', 'name email')
      .select('title description professor students materials');

    res.json(populatedCourse);
  } catch (error) {
    console.error('Enroll Student Error:', error);
    res.status(500).json({ message: 'Server error enrolling student' });
  }
};

// ======================================================
// 🚪 Unenroll a student
// ======================================================
const unenrollStudent = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const { studentId } = req.body || {};
    const targetStudentId = studentId || req.user.id;

    if (req.user.role === 'professor' && !course.professor.equals(req.user.id))
      return res.status(403).json({ message: 'Not authorized' });

    course.students = course.students.filter(
      (id) => id.toString() !== targetStudentId.toString()
    );
    await course.save();

    const populatedCourse = await Course.findById(course._id)
      .populate('professor', 'name email')
      .populate('students', 'name email')
      .select('title description professor students materials');

    res.json(populatedCourse);
  } catch (error) {
    console.error('Unenroll Student Error:', error);
    res.status(500).json({ message: 'Server error unenrolling student' });
  }
};

// ======================================================
// ✏️ Update a course
// ======================================================
const updateCourse = async (req, res) => {
  try {
    const { title, description } = req.body;

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const isOwner = course.professor.equals(req.user.id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin)
      return res.status(403).json({ message: 'Not authorized to update' });

    if (title) course.title = title;
    if (description) course.description = description;

    // Handle enrollmentKey updates: if provided and non-empty, hash and store; if provided as empty string, clear it
    if (Object.prototype.hasOwnProperty.call(req.body, 'enrollmentKey')) {
      const newKey = req.body.enrollmentKey;
      if (newKey && newKey.trim() !== '') {
        course.enrollmentKeyHash = await bcrypt.hash(newKey, 10);
      } else {
        // clear key
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
  } catch (error) {
    console.error('Update Course Error:', error);
    res.status(500).json({ message: 'Server error updating course' });
  }
};

// ======================================================
// ❌ Delete a course
// ======================================================
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const isOwner = course.professor.equals(req.user.id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin)
      return res.status(403).json({ message: 'Not authorized' });

    await course.deleteOne();
    res.json({ message: 'Course removed successfully' });
  } catch (error) {
    console.error('Delete Course Error:', error);
    res.status(500).json({ message: 'Server error deleting course' });
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  enrollStudent,
  unenrollStudent,
  updateCourse,
  deleteCourse,
  uploadStudyMaterial,
};
