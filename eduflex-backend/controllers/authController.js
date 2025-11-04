// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { generateToken } = require('../utils/generateToken'); // Use the generateToken util

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
// const JWT_EXPIRES = '1d'; // Defined in generateToken now

// Function to handle login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    // Find user (exclude password from initial find if not needed for comparison right away)
    const user = await User.findOne({ email }); //.select('+password'); // Only select password if needed later
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    // Generate token using the utility function
    const token = generateToken(user._id, user.role); // Pass both id and role

    // Return token and user details (exclude sensitive info)
    res.json({
      token,
      user: {
        _id: user._id, // Use _id convention
        name: user.name,
        email: user.email,
        role: user.role,
        // studentId: user.studentId, // Only include if necessary
        // joinedAt: user.joinedAt
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// Function to handle forgot password request
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await User.findOne({ email });
    // Important: In production, always return a generic success message
    // regardless of whether the user exists to prevent email enumeration attacks.
    if (!user) {
         console.log(`Password reset requested for non-existent email: ${email}`);
         // Still return 200 OK
         return res.json({ message: 'If an account with that email exists, a password reset token has been generated.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set expiry (store hashed token in DB for security)
    // NOTE: For simplicity here, we store the plain token, but hashing is recommended
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour validity

    await user.save();

    // TODO: Send email with reset link/token in production
    // Example: sendEmail(user.email, 'Password Reset', `Your token: ${resetToken}`);

    console.log(`Password reset token for ${email}: ${resetToken}`); // Log for dev/testing
    res.json({ message: 'Password reset token generated (check server logs/email).', dev_token: resetToken }); // Return token only in dev

  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({ error: 'Server error during forgot password' });
  }
};

// Function to handle resetting password with token
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password required' });

    // Find user by the reset token and check expiry
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() } // Check if token hasn't expired
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired password reset token' });

     // Validate new password length (example)
    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Set new password (the .pre('save') hook will hash it automatically)
    user.password = newPassword;
    user.resetPasswordToken = undefined; // Clear the reset token fields
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(500).json({ error: 'Server error during password reset' });
  }
};

// Function to get the currently logged-in user's details
const getMe = async (req, res) => {
  try {
    // req.user is attached by the authenticate middleware
    const user = await User.findById(req.user.id).select('-password -resetPasswordToken -resetPasswordExpires'); // Exclude sensitive fields

    if (!user) {
        // This case should ideally not happen if token is valid, but good to check
        console.error(`User not found for valid token ID: ${req.user.id}`);
        return res.status(404).json({ error: 'User associated with token not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Get Me Error:', err);
    res.status(500).json({ error: 'Server error fetching user details' });
  }
};

// Function to change the logged-in user's password
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Old and new passwords are required' });

    // Get user from DB (need to select password to compare)
    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found' }); // Should not happen with valid token

    // Check if old password matches
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Incorrect old password' });

    // Validate new password length (example)
    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Set new password (the .pre('save') hook will hash it)
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change Password Error:', err);
    res.status(500).json({ error: 'Server error changing password' });
  }
};

// --- Export all functions using module.exports ---
module.exports = {
  login,
  forgotPassword,
  resetPassword,
  getMe,
  changePassword
};