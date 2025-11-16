const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: String,
  message: String,
  type: {
    type: String,
    enum: ["assignment_added", "graded", "due_reminder", "other"],
    default: "other",
  },
  relatedId: { type: String },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Notification", NotificationSchema);
