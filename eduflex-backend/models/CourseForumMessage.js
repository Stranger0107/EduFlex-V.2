const mongoose = require('mongoose');

const CourseForumMessageSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  sentAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CourseForumMessage', CourseForumMessageSchema);
