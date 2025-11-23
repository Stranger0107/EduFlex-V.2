const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    questions: [
      {
        questionText: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctOption: { type: Number, required: true },
      },
    ],
    // time limit in minutes (optional). If provided, frontend will enforce auto-submit.
    timeLimit: { type: Number },
    // warningTime in minutes before end to show a warning to students (optional)
    warningTime: { type: Number },
    // scheduled start and end times (optional)
    scheduledAt: { type: Date },
    scheduledEnd: { type: Date },
    submissions: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        answers: [Number],
        score: Number,
        total: Number,
        // Optional flag to mark submission as forfeited or due to violation (tab change, blur, etc.)
        violation: { type: String },
        isForfeited: { type: Boolean, default: false },
        submittedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quiz', quizSchema);
