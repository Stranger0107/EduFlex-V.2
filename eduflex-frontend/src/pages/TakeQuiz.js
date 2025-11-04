// src/pages/TakeQuiz.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import { toast } from "react-toastify";

export default function TakeQuiz() {
  const { user, getAllCourses, submitQuiz } = useApp();
  const { courseId, quizId } = useParams();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [submission, setSubmission] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      // Fetch all courses, or you can use a getCourseById API if you have one
      const courses = await getAllCourses();
      const foundCourse = (courses || []).find(
        c => String(c.id) === String(courseId) || String(c._id) === String(courseId)
      );
      if (!foundCourse) {
        setCourse(null);
        setQuiz(null);
        setLoading(false);
        return;
      }
      setCourse(foundCourse);

      const foundQuiz = (foundCourse.quizzes || []).find(
        q => String(q.id) === String(quizId) || String(q._id) === String(quizId)
      );
      setQuiz(foundQuiz || null);

      // If the quiz already has submissions for this user
      const prevSubmission = foundQuiz?.submissions?.find(s => s.studentId === user?.id);
      setSubmission(prevSubmission || null);

      // Set blank answers
      setAnswers(
        Array(foundQuiz?.questions?.length || 0).fill(null)
      );

      setLoading(false);
    };
    fetchQuiz();
  }, [courseId, quizId, getAllCourses, user?.id]);

  if (loading) return <div style={{ padding: "2rem" }}>Loading...</div>;
  if (!quiz) return <div style={{ padding: "2rem" }}>Quiz not found.</div>;

  const handleSelect = (qi, ans) => {
    setAnswers(prev => prev.map((a, i) => (i === qi ? ans : a)));
  };

  const handleSubmit = async () => {
    if (answers.some(ans => ans === null)) {
      toast.warning("Answer all questions first!");
      return;
    }
    // API: courseId, quizId, answers
    try {
      await submitQuiz(course.id || course._id, quiz.id || quiz._id, answers);
      toast.success("Quiz submitted!");
      setSubmitted(true);

      // Update submission state
      setSubmission({
        studentId: user.id,
        answers,
        score: answers.reduce(
          (acc, ans, i) => acc + (ans === quiz.questions[i].correct ? 1 : 0),
          0
        ),
        total: quiz.questions.length
      });
    } catch {
      toast.error("Failed to submit quiz.");
    }
  };

  // Determine finalSubmission: either from context/quiz, or fresh submission in this session
  const finalSubmission =
    submission ||
    (submitted && {
      studentId: user.id,
      answers,
      score: answers.reduce(
        (acc, ans, i) => acc + (ans === quiz.questions[i].correct ? 1 : 0),
        0
      ),
      total: quiz.questions.length
    });

  return (
    <div style={{ padding: "2rem", maxWidth: 640, margin: "0 auto" }}>
      <h2 style={{ fontWeight: "bold", fontSize: "1.6rem", marginBottom: "1.4rem" }}>
        Quiz: {quiz.title}
      </h2>
      {!finalSubmission ? (
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          {quiz.questions.map((q, i) => (
            <div
              key={q.id}
              style={{
                marginBottom: 22,
                paddingBottom: 10,
                borderBottom: "1px solid #e5e7eb"
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                {i + 1}. {q.text}
              </div>
              <div>
                {q.options.map((opt, idx) => (
                  <label key={idx} style={{ display: "block", marginBottom: 4 }}>
                    <input
                      type="radio"
                      value={idx}
                      checked={answers[i] === idx}
                      onChange={() => handleSelect(i, idx)}
                      style={{ marginRight: 8 }}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button
            type="submit"
            style={{
              background: "#6366f1",
              color: "#fff",
              padding: "0.7rem 2rem",
              borderRadius: 7,
              border: "none",
              fontWeight: 600,
              fontSize: "1.1rem",
              marginTop: 18
            }}
          >
            Submit Quiz
          </button>
        </form>
      ) : (
        <div
          style={{
            padding: 26,
            background: "#f0fdf4",
            borderRadius: 10,
            border: "2px solid #10b98177",
            marginTop: 20
          }}
        >
          <h3 style={{ color: "#16a34a" }}>
            Your Score: {finalSubmission.score} / {finalSubmission.total}
          </h3>
          <ul style={{ marginTop: 14, fontSize: "1.05rem" }}>
            {quiz.questions.map((q, i) => (
              <li key={i}>
                <b>
                  {i + 1}. {q.text}
                </b>
                <ul>
                  <li
                    style={{
                      color:
                        finalSubmission.answers[i] === q.correct
                          ? "#16a34a"
                          : "#f43f5e"
                    }}
                  >
                    Your answer: {q.options[finalSubmission.answers[i]] || "-"}
                    {finalSubmission.answers[i] === q.correct ? " ✓" : ""}
                  </li>
                  <li style={{ color: "#22c55e" }}>
                    Correct: {q.options[q.correct]}
                  </li>
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
