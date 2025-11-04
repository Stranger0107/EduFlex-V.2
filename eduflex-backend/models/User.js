// models/User.js
const mongoose = require('mongoose');
const bcrypt= require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  role: { type: String, enum: ['student','teacher','admin'], required: true },
  password: { type: String, required: true },
  studentId: { type: String },
  joinedAt: { type: Date, default: Date.now },

  // stats for UI
  enrolledCoursesCount: { type: Number, default: 0 },
  pendingAssignmentsCount: { type: Number, default: 0 },
  averageGrade: { type: Number, default: 0 },
  overallProgressPct: { type: Number, default: 0 },

  resetPasswordToken: String,
  resetPasswordExpires: Date
}, { timestamps: true });

userSchema.pre('save', async function(next){
  if(!this.isModified('password')){
    return next();
  }
  const salt=await bcrypt.genSalt(10);
  this.password=await bcrypt.hash(this.password, salt);
  next();
})

module.exports = mongoose.model('User', userSchema);
