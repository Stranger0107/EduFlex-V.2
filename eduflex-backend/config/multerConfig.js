const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // If the incoming field is a profile photo, store under 'profile'
    const type = file && file.fieldname === 'photo' ? 'profile' : (req.uploadType || 'materials');

    // Determine folder id. For profile photos prefer the authenticated user's id.
    let folderId = null;
    if (file && file.fieldname === 'photo' && req.user && req.user.id) {
      folderId = req.user.id;
    } else {
      folderId = req.params.id || req.body.courseId || req.query.courseId || 'general';
    }

    const uploadDir = path.join(__dirname, '..', 'uploads', type, folderId);

    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).slice(2);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Invalid file type'));
};

module.exports = multer({ storage, fileFilter });
