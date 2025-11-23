const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  professor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
  scheduledAt: { type: Date, required: true },
  durationMins: { type: Number, default: 30 },
  notes: { type: String },
  status: { type: String, enum: ['pending','confirmed','completed','cancelled'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Meeting', MeetingSchema);
