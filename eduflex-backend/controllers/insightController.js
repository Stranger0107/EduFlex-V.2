const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const PerformanceInsight = require('../models/PerformanceInsight');

// Utility to compute week start (Monday)
function getWeekStart(date = new Date()){
  const d = new Date(date);
  const day = d.getDay();
  // Convert to Monday-based weekStart
  const diff = (day + 6) % 7; // 0 -> Monday
  d.setDate(d.getDate() - diff);
  d.setHours(0,0,0,0);
  d.setMinutes(0,0,0,0);
  return d;
}

async function doGenerateWeeklyInsights(){
  const weekStart = getWeekStart();
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  const courses = await Course.find({}).populate('students', 'name email');

  for (const course of courses) {
    const assignments = await Assignment.find({ course: course._id });
    const quizzes = await Quiz.find({ course: course._id });

    for (const student of course.students) {
      // progress: percent of assignments submitted
      const totalAssignments = assignments.length;
      let submittedCount = 0;
      let assignmentDelays = 0;

      for (const a of assignments) {
        const sub = a.submissions.find(s => String(s.student) === String(student._id));
        if (sub) {
          submittedCount++;
          if (sub.isLate) {
            // count late submissions within the week
            const submittedAt = new Date(sub.submittedAt || sub.updatedAt || Date.now());
            const since = weekStart;
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate()+7);
            if (submittedAt >= since && submittedAt < weekEnd) assignmentDelays++;
          }
        }
      }

      const progressPct = totalAssignments === 0 ? 100 : Math.round((submittedCount / totalAssignments) * 100);

      // quizzes: average score in the week
      let quizScores = [];
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate()+7);
      for (const q of quizzes) {
        for (const sub of q.submissions) {
          if (String(sub.student) === String(student._id)) {
            const submittedAt = new Date(sub.submittedAt || Date.now());
            if (submittedAt >= weekStart && submittedAt < weekEnd && typeof sub.score === 'number') {
              quizScores.push(sub.score);
            }
          }
        }
      }

      const avgQuizScore = quizScores.length ? Math.round(quizScores.reduce((a,b)=>a+b,0)/quizScores.length) : 0;

      // Compare with previous week to detect drop
      const prevInsight = await PerformanceInsight.findOne({ student: student._id, course: course._id, weekStart: prevWeekStart });
      const weaknesses = [];
      if (assignmentDelays > 0) weaknesses.push(`You missed ${assignmentDelays} assignment deadline(s) this week`);
      if (prevInsight && typeof prevInsight.metrics.avgQuizScore === 'number') {
        const prev = prevInsight.metrics.avgQuizScore || 0;
        if (prev > 0 && prev - avgQuizScore >= Math.round(prev * 0.2)) {
          weaknesses.push(`Your quiz accuracy dropped by ${Math.round(((prev-avgQuizScore)/prev)*100)}% this week`);
        }
      }

      // Attendance is not tracked globally; set as -1 (unknown)
      const attendancePct = -1;

      // Create or update insight for this week
      let insight = await PerformanceInsight.findOne({ student: student._id, course: course._id, weekStart });
      if (!insight) {
        insight = new PerformanceInsight({ student: student._id, course: course._id, weekStart });
      }

      insight.metrics = { progressPct, assignmentDelays, avgQuizScore, attendancePct };
      insight.weaknesses = weaknesses;

      await insight.save();
    }
  }
}

// POST /api/insights/generate - generate insights for all courses (protected)
exports.generateWeeklyInsights = async (req, res) => {
  try {
    await doGenerateWeeklyInsights();
    res.json({ message: 'Weekly insights generated' });
  } catch (err) {
    console.error('Error generating insights:', err);
    res.status(500).json({ error: 'Server error generating insights' });
  }
};

// Export the job function for cron
exports.doGenerateWeeklyInsights = doGenerateWeeklyInsights;

// GET /api/insights/student/:studentId - get insights for a student (optionally filter by course)
exports.getStudentInsights = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId } = req.query;
    const query = { student: studentId };
    if (courseId) query.course = courseId;

    const insights = await PerformanceInsight.find(query).populate('course', 'title').sort({ weekStart: -1 });
    res.json(insights);
  } catch (err) {
    console.error('Error fetching student insights:', err);
    res.status(500).json({ error: 'Server error fetching insights' });
  }
};

// POST /api/insights/:insightId/suggestions - professor adds a suggestion
exports.addSuggestion = async (req, res) => {
  try {
    const { insightId } = req.params;
    const { text, type, resourceLink, slot } = req.body;

    const insight = await PerformanceInsight.findById(insightId);
    if (!insight) return res.status(404).json({ error: 'Insight not found' });

    // only a professor can add suggestion
    if (req.user.role !== 'professor') return res.status(403).json({ error: 'Only professors can add suggestions' });

    const suggestion = {
      professor: req.user.id,
      text,
      type: type || 'resource',
      resourceLink: resourceLink || '',
      slot: slot ? new Date(slot) : undefined,
      approved: false
    };

    insight.suggestions.push(suggestion);
    await insight.save();

    res.status(201).json({ message: 'Suggestion added', suggestion });
  } catch (err) {
    console.error('Error adding suggestion:', err);
    res.status(500).json({ error: 'Server error adding suggestion' });
  }
};

// PATCH /api/insights/:insightId/suggestions/:suggId/approve - approve a suggestion (professor)
exports.approveSuggestion = async (req, res) => {
  try {
    const { insightId, suggId } = req.params;
    const insight = await PerformanceInsight.findById(insightId);
    if (!insight) return res.status(404).json({ error: 'Insight not found' });

    const suggestion = insight.suggestions.id(suggId);
    if (!suggestion) return res.status(404).json({ error: 'Suggestion not found' });

    // only the professor who created it (or the course professor) should approve
    if (req.user.role !== 'professor' && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });

    suggestion.approved = true;
    await insight.save();

    res.json({ message: 'Suggestion approved', suggestion });
  } catch (err) {
    console.error('Error approving suggestion:', err);
    res.status(500).json({ error: 'Server error approving suggestion' });
  }
};

// GET /api/insights/:studentId/suggestions - get suggestions for a student (show approved only to students)
exports.getSuggestionsForStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const insights = await PerformanceInsight.find({ student: studentId }).populate('suggestions.professor', 'name email');

    // flatten suggestions with insight reference
    const suggestions = [];
    for (const ins of insights) {
      for (const s of ins.suggestions) {
        // if requester is student, only show approved suggestions
        if (req.user.role === 'student' && String(req.user.id) === String(studentId) && !s.approved) continue;
        suggestions.push({ insightId: ins._id, course: ins.course, weekStart: ins.weekStart, suggestion: s });
      }
    }

    res.json(suggestions);
  } catch (err) {
    console.error('Error fetching suggestions:', err);
    res.status(500).json({ error: 'Server error fetching suggestions' });
  }
};
