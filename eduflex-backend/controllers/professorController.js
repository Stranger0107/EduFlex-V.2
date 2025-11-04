const Course = require('../models/Course');
const Assignment = require('../models/Assignment');

const getMyCoursesHandler=async (req, res) => {
    try {
        const courses = await Course.find({ teacher: req.user._id });
        res.json(courses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}
// Create course
const createCourseHandler = async (req, res) => {
  const { title, description } = req.body;
  const course = await Course.create({
    title,
    description,
    professor: req.user._id
  });
  res.status(201).json(course);
};

// Create assignment
const createAssignmentHandler = async (req, res) => {
    try {
        const { title, description, courseId, dueDate } = req.body;
        if (!title || !courseId) return res.status(400).json({ message: 'Missing fields' });

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });
        if (!course.teacher.equals(req.user._id)) return res.status(403).json({ message: 'Not authorized for this course' });

        const assignment = new Assignment({
            title,
            description,
            course: courseId,
            teacher: req.user._id,
            dueDate
        });

        await assignment.save();
        res.status(201).json(assignment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

const getMyAssignmentsHandler=async (req, res) => {
    try {
        const assignments = await Assignment.find({ teacher: req.user._id }).populate('course');
        res.json(assignments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

const getStudentsInCourseHandler=async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('students');
        if (!course) return res.status(404).json({ message: 'Course not found' });
        if (!course.teacher.equals(req.user._id)) return res.status(403).json({ message: 'Not authorized' });

        res.json(course.students);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}
const gradeSubmissionHandler=async (req, res) => {
    try {
        const { studentId, grade } = req.body;
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
        if (!assignment.teacher.equals(req.user._id)) return res.status(403).json({ message: 'Not authorized' });

        // Add or update grade
        const submissionIndex = assignment.submissions.findIndex(s => s.student.equals(studentId));
        if (submissionIndex !== -1) {
            assignment.submissions[submissionIndex].grade = grade;
        } else {
            assignment.submissions.push({ student: studentId, grade });
        }

        await assignment.save();
        res.json({ message: 'Grade updated', assignment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}


module.exports = { createCourseHandler, 
                   createAssignmentHandler, 
                   getMyCoursesHandler, 
                   getMyAssignmentsHandler, 
                   getStudentsInCourseHandler, 
                   gradeSubmissionHandler };
