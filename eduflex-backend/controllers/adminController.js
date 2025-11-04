const User = require('../models/User');

// @desc    Admin creates a new user (student, teacher, or other admin)
// @route   POST /api/admin/create-user
// @access  Private (Admin)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Missing fields' });
    }
    if (!['admin','teacher','student'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already exists' });

    // Create new user
    // The password will be auto-hashed by the .pre('save') middleware!
    const user = new User({ name, email, password, role });
    await user.save();

    // Return user info, but NO token.
    // This is the correct, secure practice.
    res.status(201).json({ 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- ADD THIS NEW FUNCTION ---
// @desc    Admin gets a list of all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUserList = async (req, res) => {
  try {
    // Fetch all users, excluding their passwords
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get User List Error:', error); // Log specific error
    res.status(500).json({ message: 'Server error fetching user list' });
  }
};
// --- END OF NEW FUNCTION ---


module.exports = {
  createUser,
  getUserList // <-- Make sure to export the new function
};