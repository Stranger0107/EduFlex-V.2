const Course = require('../models/Course');
const User = require('../models/User'); // Needed for checking roles/existence

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private (Admin, Teacher)
const createCourse = async (req, res) => {
  try {
     const { title, description, teacher: teacherIdFromBody } = req.body; // Teacher ID might come from body if admin creates

     // Determine the teacher ID
     let teacherId;
     if (req.user.role === 'teacher') {
         teacherId = req.user.id; // Teacher creates for themselves
     } else if (req.user.role === 'admin' && teacherIdFromBody) {
         // Admin assigns a teacher - Validate teacher exists and has 'teacher' role
         const assignedTeacher = await User.findById(teacherIdFromBody);
         if (!assignedTeacher || assignedTeacher.role !== 'teacher') {
             return res.status(400).json({ message: 'Invalid teacher ID provided' });
         }
         teacherId = teacherIdFromBody;
     } else if (req.user.role === 'admin' && !teacherIdFromBody) {
          // If admin doesn't provide teacher ID, maybe assign admin? Or require it? Let's require it.
          return res.status(400).json({ message: 'Admin must assign a teacher ID when creating a course' });
     }
      else {
          // Invalid scenario (e.g., student trying, though middleware should block)
          return res.status(403).json({ message: 'Unauthorized role for course creation' });
     }

      if (!title || !description) {
           return res.status(400).json({ message: 'Title and description are required' });
      }

     const course = new Course({ title, description, teacher: teacherId });
     await course.save();

     // Populate teacher details before sending response
     const populatedCourse = await Course.findById(course._id).populate('teacher', 'name email');

     res.status(201).json(populatedCourse);
  } catch(error) {
      console.error("Create Course Error:", error);
      res.status(500).json({ message: 'Server error creating course' });
  }
};

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
const getAllCourses = async (req, res) => {
  try {
      const courses = await Course.find().populate('teacher', 'name email');
      res.json(courses);
  } catch(error) {
      console.error("Get All Courses Error:", error);
      res.status(500).json({ message: 'Server error fetching courses' });
  }
};

// @desc    Enroll a student in a course
// @route   POST /api/courses/:id/enroll
// @access  Private (Admin, Teacher)
const enrollStudent = async (req, res) => {
   try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        // Authorization check: Only course teacher or admin can enroll
        if (req.user.role === 'teacher' && !course.teacher.equals(req.user.id)) {
            return res.status(403).json({ message: 'Not authorized to enroll students in this course' });
        }

        const { studentId } = req.body;
        if (!studentId) return res.status(400).json({ message: 'Student ID required' });

        // Validate student exists and has 'student' role
        const student = await User.findById(studentId);
        if (!student || student.role !== 'student') {
            return res.status(400).json({ message: 'Invalid student ID or user is not a student' });
        }

        // Add student if not already enrolled (convert to String for includes check)
        if (!course.students.map(id => id.toString()).includes(studentId)) {
            course.students.push(studentId);
            await course.save();
        }
         // Populate details before sending response
        const populatedCourse = await Course.findById(course._id)
            .populate('teacher', 'name email')
            .populate('students', 'name email'); // Populate students too

        res.json(populatedCourse);
   } catch(error) {
       console.error("Enroll Student Error:", error);
        if (error.name === 'CastError') { // Handle invalid ID formats
            return res.status(400).json({ message: 'Invalid course or student ID format' });
        }
       res.status(500).json({ message: 'Server error enrolling student' });
   }
};


// --- ADD THIS FUNCTION ---
// @desc    Update a course
// @route   PUT /api/courses/:id
// @access  Private (Admin, or Teacher who owns the course)
const updateCourse = async (req, res) => {
  try {
    const { title, description } = req.body;
    // Basic validation for update data
     if (!title && !description) {
        return res.status(400).json({ message: 'No update data provided (title or description required)' });
    }

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Authorization Check: Allow admin OR the teacher who owns the course
    const isOwner = course.teacher.equals(req.user.id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'User not authorized to update this course' });
    }

    // Update fields only if they are provided in the request body
    if (title) course.title = title;
    if (description) course.description = description;
    // Add other updatable fields here (e.g., assigning a different teacher by admin)
    // if (isAdmin && req.body.teacher) { ... validation ... course.teacher = req.body.teacher; }

    const updatedCourse = await course.save();
    // Populate teacher details before sending response
    const populatedCourse = await Course.findById(updatedCourse._id).populate('teacher', 'name email');

    res.json(populatedCourse);

  } catch (error) {
    console.error('Update Course Error:', error);
    // Handle potential CastError if ID format is wrong
     if (error.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid course ID format' });
    }
    res.status(500).json({ message: 'Server error updating course' });
  }
};


// --- ADD THIS FUNCTION ---
// @desc    Delete a course
// @route   DELETE /api/courses/:id
// @access  Private (Admin, or Teacher who owns the course)
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Authorization Check: Allow admin OR the teacher who owns the course
    const isOwner = course.teacher.equals(req.user.id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'User not authorized to delete this course' });
    }

    // TODO: Consider related data deletion (e.g., assignments associated with this course)
    // This might require finding assignments where course == course._id and deleting them,
    // or adding Mongoose 'remove' middleware to the Course schema.
    // await Assignment.deleteMany({ course: course._id }); // Example of cascading delete

    await course.deleteOne(); // Use deleteOne() on the document instance

    res.json({ message: 'Course removed successfully' });

  } catch (error) {
    console.error('Delete Course Error:', error);
     if (error.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid course ID format' });
    }
    res.status(500).json({ message: 'Server error deleting course' });
  }
};


module.exports = {
  createCourse,
  getAllCourses,
  enrollStudent,
  updateCourse, // <-- Export new function
  deleteCourse  // <-- Export new function
};