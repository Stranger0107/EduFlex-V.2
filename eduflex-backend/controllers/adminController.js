// eduflex-backend/controllers/adminController.js
const User = require('../models/User');
const Course = require('../models/Course');

// --- Stats Function ---
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
      roleCounts: { student: studentCount, professor: professorCount }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
};

// --- User Functions ---
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get User List Error:', error);
    res.status(500).json({ message: 'Server error fetching user list' });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Missing fields' });
    }
    // *** THIS IS THE FIX ***
    if (!['admin','professor','student'].includes(role)) { 
      return res.status(400).json({ message: 'Invalid role (must be admin, professor, or student)' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already exists' });

    const user = new User({ name, email, password, role });
    await user.save();
    res.status(201).json({ 
      _id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role 
    });
  } catch (error) {
    console.error(error); // This is where your validation error was logged
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role },
      { new: true } 
    ).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role === 'admin') {
         return res.status(400).json({ message: 'Cannot delete an admin user' });
    }
    await user.deleteOne(); 
    res.json({ message: 'User removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Course Functions ---
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate('professor', 'name');
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const createCourse = async (req, res) => {
  try {
    const { title, description, professorId } = req.body;
    const newCourse = new Course({
      title,
      description,
      professor: professorId,
    });
    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (err) {
    console.error(err);
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
     if (!course) {
        return res.status(404).json({ message: 'Course not found' });
     }
     res.json(course);
   } catch (err) {
     console.error(err);
     res.status(500).json({ message: 'Server error updating course' });
   }
};

const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        await course.deleteOne();
        res.json({ message: 'Course removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
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
  deleteCourse
};