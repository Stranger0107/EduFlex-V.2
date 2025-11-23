const mongoose = require('mongoose');

const MeetingMessageSchema = new mongoose.Schema({
  meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  sentAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MeetingMessage', MeetingMessageSchema);
