const cron = require("node-cron");
const Assignment = require("../models/Assignment");
const Course = require("../models/Course");
const Notification = require("../models/Notification");

// Runs everyday at midnight
cron.schedule("0 0 * * *", async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const assignments = await Assignment.find({
    dueDate: {
      $gte: new Date(tomorrow.setHours(0,0,0,0)),
      $lte: new Date(tomorrow.setHours(23,59,59,999))
    }
  }).populate("course");

  for (let asg of assignments) {
    const course = await Course.findById(asg.course._id).populate("students");

    course.students.forEach(async (s) => {
      await Notification.create({
        user: s._id,
        message: `Reminder: Assignment "${asg.title}" is due tomorrow.`,
        type: "assignment-reminder",
        link: `/assignments/${asg._id}`
      });
    });
  }

  console.log("📢 Assignment reminders sent");
});
