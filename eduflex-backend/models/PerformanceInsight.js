const mongoose = require('mongoose');

const SuggestionSchema = new mongoose.Schema({
  professor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  type: { type: String, enum: ['resource','quiz','one-on-one','motivation'], default: 'resource' },
  resourceLink: { type: String, default: '' },
  slot: { type: Date }, // for 1-to-1 sessions
  approved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const PerformanceInsightSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  weekStart: { type: Date, required: true },
  metrics: {
    progressPct: { type: Number, default: 0 },
    assignmentDelays: { type: Number, default: 0 },
    avgQuizScore: { type: Number, default: 0 },
    attendancePct: { type: Number, default: -1 } // -1 when not applicable
  },
  weaknesses: [{ type: String }],
  suggestions: [SuggestionSchema]
}, { timestamps: true });

module.exports = mongoose.model('PerformanceInsight', PerformanceInsightSchema);
