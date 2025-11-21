const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Assignment description is required'],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    attachmentUrl: {
      type: String,
      default: '',
    },
    submissions: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        submission: String, // text or uploaded file path
        filePath: { type: String, default: '' },
        originalName: { type: String, default: '' },
        grade: {
          type: Number,
          min: 0,
          max: 100,
        },
        feedback: String,
        submittedAt: {
          type: Date,
          default: Date.now,
        },
        isLate: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
