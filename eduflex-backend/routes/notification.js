const express = require("express");
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

console.log('Notification routes file loaded');

// All routes require authentication
router.use(authenticate);

// GET /api/notification - get current user's notifications
router.get('/', notificationController.getMyNotifications);

// GET /api/notification/unreadCount - get unread count
router.get('/unreadCount', notificationController.getUnreadCount);

// PUT /api/notification/:id/read - mark single as read
router.put('/:id/read', notificationController.markAsRead);

// PUT /api/notification/markAllRead - mark all for current user
router.put('/markAllRead', notificationController.markAllRead);

module.exports = router;
