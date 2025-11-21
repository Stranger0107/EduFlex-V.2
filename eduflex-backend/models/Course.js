// eduflex-backend/models/Course.js
const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Material title is required'],
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required'],
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const CourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
    },
    professor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Professor is required'],
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Optional enrollment key (stored hashed)
    enrollmentKeyHash: {
      type: String,
      default: '',
    },
    // ✅ NEW FIELD: Study materials (professor uploads here)
    materials: [MaterialSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', CourseSchema);
