const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    dueDate: Date,
    submissions: [
        {
            student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            submission: String,
            grade: Number
        }
    ]
});

module.exports = mongoose.model('Assignment', assignmentSchema);
