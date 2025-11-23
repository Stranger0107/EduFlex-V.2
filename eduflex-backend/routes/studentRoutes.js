const express = require('express');
const router = express.Router();
// (Route declarations moved below so auth middleware runs first)
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate, authorize } = require('../middleware/authMiddleware.js');
const {
  getMyCourses,
  getCourseAssignments,
  submitAssignment,
  getMyGrades,
  getStudentDashboard,
  getMyAssignments
} = require('../controllers/studentController.js');

const { getMyMeetings, updateMeetingStatus } = require('../controllers/studentController.js');

// ✅ DEFINE MULTER CONFIGURATION LOCALLY TO ENSURE IT WORKS
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use assignment ID from params, or 'general' if missing
    const folderId = req.params.id || 'general';
    const uploadDir = path.join(__dirname, '..', 'uploads', 'submissions', folderId);

    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    console.log(`📂 [Multer] Saving file to: ${uploadDir}`);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Clean filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = `submission-${uniqueSuffix}${ext}`;
    console.log(`📄 [Multer] Generated filename: ${filename}`);
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept common document and image types
  const allowedTypes = /pdf|doc|docx|txt|jpg|jpeg|png|zip|rar/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    console.error(`❌ [Multer] Rejected file type: ${file.mimetype}`);
    cb(null, false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ================= ROUTES =================

router.use(authenticate);
router.use(authorize('student'));

// Course forum endpoints (protected)
router.get('/courses/:id/forum', require('../controllers/studentController').getCourseForumMessages);
router.post('/courses/:id/forum', require('../controllers/studentController').sendCourseForumMessage);
// Meeting chat endpoints (protected)
router.get('/meetings/:id/messages', require('../controllers/studentController').getMeetingMessages);
router.post('/meetings/:id/messages', require('../controllers/studentController').sendMeetingMessage);

router.get('/courses', getMyCourses);
router.get('/assignments/:courseId', getCourseAssignments);

// ✅ SUBMIT ROUTE WITH LOCAL MULTER MIDDLEWARE & DEBUGGING
router.post(
  '/assignments/:id/submit',
  (req, res, next) => {
      console.log('🔍 [Route Hit] Headers:', req.headers['content-type']); 
      next();
  },
  upload.single('file'), // Must match frontend formData.append('file', ...)
  submitAssignment
);

router.get('/grades', getMyGrades);
router.get('/dashboard', getStudentDashboard);
router.get('/assignments', getMyAssignments);

// Student meetings
router.get('/meetings', getMyMeetings);
router.patch('/meetings/:id', updateMeetingStatus);

module.exports = router;