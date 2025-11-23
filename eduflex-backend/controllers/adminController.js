// eduflex-backend/controllers/adminController.js
const User = require('../models/User');
const Course = require('../models/Course');

// --- Dashboard Stats ---
const getDashboardStats = async (req, res) => {
  try {
    const [userCount, courseCount, studentCount, professorCount] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'professor' })
    ]);

    res.json({
      userCount,
      courseCount,
      roleCounts: { student: studentCount, professor: professorCount },
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
};

// --- User Management ---
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get User List Error:', error.message);
    res.status(500).json({ message: 'Server error fetching user list' });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!['admin', 'professor', 'student'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role (must be admin, professor, or student)' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const user = new User({ name, email, password, role, department });
    await user.save();

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    });
  } catch (error) {
    console.error('Create user error:', error.message);
    res.status(500).json({ message: 'Server error creating user' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, email, role, department } = req.body;

    const updates = { name, email, role };
    if (typeof department !== 'undefined') updates.department = department;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Update user error:', err.message);
    res.status(500).json({ message: 'Server error updating user' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete an admin user' });
    }

    await user.deleteOne();
    res.json({ message: 'User removed' });
  } catch (err) {
    console.error('Delete user error:', err.message);
    res.status(500).json({ message: 'Server error deleting user' });
  }
};

// --- Course Management ---
const getAllCourses = async (req, res) => {
  try {
    // ✅ Defensive code to handle both 'professor' and old 'teacher' field
    const courses = await Course.find()
      .populate('professor', 'name email')
      .populate('students', 'name email');

    // If no courses or invalid documents exist
    if (!courses || courses.length === 0) {
      return res.status(200).json([]);
    }

    res.json(courses);
  } catch (err) {
    console.error('Error fetching courses:', err.message);
    res.status(500).json({ message: 'Server error fetching courses' });
  }
};

const createCourse = async (req, res) => {
  try {
    const { title, description, professorId } = req.body;

    if (!title || !description || !professorId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newCourse = new Course({
      title,
      description,
      professor: professorId,
    });

    const savedCourse = await newCourse.save();
    res.status(201).json(savedCourse);
  } catch (err) {
    console.error('Error creating course:', err.message);
    res.status(500).json({ message: 'Server error creating course' });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { title, description, professorId } = req.body;

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { title, description, professor: professorId },
      { new: true }
    );

    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    console.error('Error updating course:', err.message);
    res.status(500).json({ message: 'Server error updating course' });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    await course.deleteOne();
    res.json({ message: 'Course removed successfully' });
  } catch (err) {
    console.error('Error deleting course:', err.message);
    res.status(500).json({ message: 'Server error deleting course' });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
};
