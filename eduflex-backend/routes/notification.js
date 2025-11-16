const express = require("express");
const Notification = require("../models/Notification");
const router = express.Router();

router.get("/", async (req, res) => {
  const { studentId } = req.query;
  const notifs = await Notification.find({ studentId }).sort({ createdAt: -1 });
  res.json(notifs);
});

router.put("/:id/read", async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { read: true });
  res.json({ success: true });
});

router.put("/markAllRead", async (req, res) => {
  await Notification.updateMany(
    { studentId: req.body.studentId }, 
    { read: true }
  );
  res.json({ success: true });
});

module.exports = router;
