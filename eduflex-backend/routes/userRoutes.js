const express = require("express");
const router = express.Router();
const upload = require("../config/multerConfig");
const { authenticate } = require("../middleware/authMiddleware");
const User = require("../models/User");
const path = require("path");

router.use(authenticate);

// ⭐ Upload Profile Photo
router.post("/profile/photo", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No photo uploaded" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Build full URL
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const photoUrl = `${baseUrl}/uploads/materials/${req.user.id}/${req.file.filename}`;

    user.photoUrl = photoUrl;
    await user.save();

    res.json({ message: "Photo updated", user });
  } catch (err) {
    console.error("Profile photo upload error:", err);
    res.status(500).json({ message: "Server error uploading photo" });
  }
});

module.exports = router;
