const User = require("../models/User");
const path = require("path");

exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No photo uploaded" });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const photoUrl = `${baseUrl}/uploads/profile/${req.user.id}/${req.file.filename}`;

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { photo: photoUrl },
      { new: true }
    );

    return res.json({
      message: "Profile photo updated",
      user: updated,
      photo: photoUrl
    });
  } catch (error) {
    console.error("Upload profile photo error:", error);
    res.status(500).json({ error: "Server error uploading photo" });
  }
};
