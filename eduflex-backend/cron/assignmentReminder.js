const cron = require("node-cron");
const Assignment = require("../models/Assignment");
const Course = require("../models/Course");
const Notification = require("../models/Notification");

// Runs everyday at midnight
cron.schedule("0 0 * * *", async () => {
  try {
    const tomorrowStart = new Date();
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0,0,0,0);

    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23,59,59,999);

    const assignments = await Assignment.find({
      dueDate: {
        $gte: tomorrowStart,
        $lte: tomorrowEnd
      }
    }).populate("course");

    for (let asg of assignments) {
      const course = await Course.findById(asg.course._id).populate("students");
      if (!course || !course.students) continue;

      for (const s of course.students) {
        await Notification.create({
          user: s._id,
          title: `Assignment due tomorrow`,
          message: `Reminder: Assignment "${asg.title}" for course "${course.title}" is due tomorrow.`,
          type: "due_reminder",
          relatedId: String(asg._id),
          link: `/assignments/${asg._id}`,
          read: false,
        });
      }
    }

    console.log("📢 Assignment reminders sent");
  } catch (err) {
    console.error('Error sending assignment reminders:', err);
  }
});
