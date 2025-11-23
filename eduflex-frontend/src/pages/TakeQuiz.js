// eduflex-frontend/src/pages/TakeQuiz.js
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import { toast } from "react-toastify";

export default function TakeQuiz() {
  const { user, fetchQuizById, submitQuiz } = useApp();
  const { quizId } = useParams();

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [timerLeft, setTimerLeft] = useState(null); // seconds
  const timerRef = useRef(null);
  const [warningShown, setWarningShown] = useState(false);
  const [startsIn, setStartsIn] = useState(null); // seconds until start when scheduled
  const [available, setAvailable] = useState(true);

  // ⭐ NEW: For one-by-one navigation
  const [currentQuestion, setCurrentQuestion] = useState(0);

  useEffect(() => {
    const loadQuiz = async () => {
      setLoading(true);

      const quizData = await fetchQuizById(quizId);
      if (!quizData) {
        toast.error("Quiz not found");
        setLoading(false);
        return;
      }

      // ❗ Check if user already attempted
      const alreadySubmitted = quizData.submissions?.find(
        (s) => s.student === user._id || s.student?._id === user._id
      );

      if (alreadySubmitted) {
        setSubmitted(true);
        setScore(alreadySubmitted.score);
        setAnswers(alreadySubmitted.answers); // show user's past answers
      }

      setQuiz(quizData);
      setAnswers(Array(quizData.questions.length).fill(null));
      // scheduling enforcement
      const nowMs = Date.now();
      let isAvailable = true;
      if (quizData.scheduledAt) {
        const startMs = new Date(quizData.scheduledAt).getTime();
        if (nowMs < startMs) {
          isAvailable = false;
          setStartsIn(Math.max(0, Math.ceil((startMs - nowMs) / 1000)));
        }
      }
      if (quizData.scheduledEnd) {
        const endMs = new Date(quizData.scheduledEnd).getTime();
        if (nowMs > endMs) {
          // already expired
          isAvailable = false;
          setStartsIn(null);
          setTimerLeft(0);
        }
      }
      setAvailable(isAvailable && !alreadySubmitted);

      // start timer when available: prefer per-user timeLimit; otherwise if scheduledEnd exists, use remaining seconds
      if (!alreadySubmitted && isAvailable) {
        if (quizData.timeLimit) {
          setTimerLeft(Math.max(0, Math.floor(quizData.timeLimit * 60)));
        } else if (quizData.scheduledEnd) {
          const endMs = new Date(quizData.scheduledEnd).getTime();
          setTimerLeft(Math.max(0, Math.floor((endMs - nowMs) / 1000)));
        }
      }
      setLoading(false);
    };

    loadQuiz();
  }, [quizId, fetchQuizById, user]);

  // ==============================
  // Select option
  // ==============================
  const selectOption = (optionIndex) => {
    setAnswers((prev) =>
      prev.map((ans, i) => (i === currentQuestion ? optionIndex : ans))
    );
  };

  // ==============================
  // Submit quiz
  // ==============================
  const handleSubmit = async (force = false) => {
    if (submitted) {
      toast.warning("You have already submitted this quiz.");
      return;
    }

    if (!force && answers.some((a) => a === null)) {
      toast.warning("Please answer all questions.");
      return;
    }

    // Prepare cleaned answers: keep nulls for unanswered questions
    const cleaned = answers.map((a) => (a === null || a === undefined ? null : Number(a)));
    // Stop timer if running
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // If this submission is forced due to an integrity violation (e.g., tab change), send that metadata
    const opts = {};
    if (force) {
      opts.isForfeited = true;
      opts.violation = 'forced-submit';
    }

    const res = await submitQuiz(quizId, cleaned, opts);

    if (res?.score !== undefined) {
      toast.success("Quiz submitted successfully!");
      setScore(res.score);
      setSubmitted(true);
    }
  };

  // Timer effect: decrement every second when timerLeft is set
  useEffect(() => {
    if (timerLeft === null) return;
    if (submitted) return;

    // If timer finished, force submit
    if (timerLeft <= 0) {
      (async () => {
        toast.info('Time is up — submitting your quiz');
        await handleSubmit(true);
      })();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimerLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timerLeft, submitted]);

  // Detect tab/window change or visibility loss and force-submit
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden && !submitted && available) {
        // immediate forced submit on tab change / visibility loss
        toast.error('Tab change detected — your quiz will be submitted for security reasons.');
        handleSubmit(true);
      }
    };

    const onBlur = () => {
      if (!document.hidden && !submitted && available) {
        // blur can mean switch to another window — treat similarly
        toast.error('Window change detected — submitting quiz for security reasons.');
        handleSubmit(true);
      }
    };

    const onBeforeUnload = (e) => {
      if (!submitted && available) {
        e.preventDefault();
        e.returnValue = 'You are in the middle of a quiz. If you leave, your quiz may be submitted.';
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [submitted, available]);

  // Start-countdown effect: when startsIn is set (>0) count down until quiz becomes available
  useEffect(() => {
    if (startsIn === null) return;
    if (startsIn <= 0) {
      // make available and initialize timer
      setStartsIn(null);
      setAvailable(true);
      const nowMs = Date.now();
      if (quiz?.timeLimit) {
        setTimerLeft(Math.max(0, Math.floor(quiz.timeLimit * 60)));
      } else if (quiz?.scheduledEnd) {
        const endMs = new Date(quiz.scheduledEnd).getTime();
        setTimerLeft(Math.max(0, Math.floor((endMs - nowMs) / 1000)));
      }
      return;
    }

    const startInterval = setInterval(() => {
      setStartsIn((s) => {
        if (s <= 1) {
          clearInterval(startInterval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(startInterval);
  }, [startsIn, quiz]);

  // Warning effect: when timerLeft reaches warning threshold, show banner/toast
  useEffect(() => {
    if (timerLeft === null || submitted || warningShown) return;
    const warningMinutes = quiz?.warningTime || 0;
    if (!warningMinutes) return;
    const threshold = warningMinutes * 60;
    if (timerLeft <= threshold) {
      setWarningShown(true);
      toast.warning(`Only ${warningMinutes} minute(s) left!`);
    }
  }, [timerLeft, quiz, submitted, warningShown]);

  // ==============================
  // Loading state
  // ==============================
  if (loading) return <div className="p-8">Loading quiz...</div>;
  if (!quiz) return <div className="p-8">Quiz not found.</div>;

  // ======================================
  //  SHOW RESULTS IF ALREADY SUBMITTED
  // ======================================
  if (submitted) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-green-700">
          Quiz: {quiz.title}
        </h2>

        <div className="bg-green-50 p-6 rounded-lg border border-green-300">
          <h3 className="text-xl font-semibold text-green-700 mb-3">
            Your Score: {score} / {quiz.questions.length}
          </h3>

          <ul className="space-y-4">
            {quiz.questions.map((q, i) => (
              <li key={i} className="p-4 bg-white rounded shadow-sm">
                <p className="font-semibold mb-1">
                  {i + 1}. {q.questionText}
                </p>

                <p className="text-sm text-gray-600">
                  Correct Answer:{" "}
                  <span className="text-green-600 font-medium">
                    {q.options[q.correctOption]}
                  </span>
                </p>

                <p
                  className={`text-sm ${
                    answers[i] === q.correctOption
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  Your Answer: {q.options[answers[i]]}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // ======================================
  // QUESTION NAVIGATION UI
  // ======================================
  const q = quiz.questions[currentQuestion];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-green-700">Quiz: {quiz.title}</h2>
        {!available && startsIn > 0 && (
          <div className="text-sm text-blue-600 font-semibold">
            Starts in: {Math.floor(startsIn / 60).toString().padStart(2, '0')}:{(startsIn % 60).toString().padStart(2, '0')}
          </div>
        )}
        {available && timerLeft !== null && !submitted && (
          <div className="text-sm text-red-600 font-semibold">
            Time Left: {Math.floor(timerLeft / 60).toString().padStart(2, '0')}:{(timerLeft % 60).toString().padStart(2, '0')}
          </div>
        )}
      </div>

      <div className="p-6 bg-white rounded-lg shadow-md border">
        {warningShown && !submitted && (
          <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded">
            Warning: time is running out — save your answers. You'll be auto-submitted when time ends.
          </div>
        )}
        {!available && startsIn === null && (
          <div className="mb-4 p-3 bg-gray-50 border-l-4 border-gray-300 text-gray-700 rounded">
            This quiz is not available. It may be scheduled for a future time or has already ended.
          </div>
        )}
        <p className="text-gray-600 mb-2">
          Question {currentQuestion + 1} of {quiz.questions.length}
        </p>

        <h3 className="text-lg font-semibold mb-4">{q.questionText}</h3>

        <div className="space-y-3">
          {q.options.map((opt, idx) => (
            <label
              key={idx}
              className="block p-3 border rounded cursor-pointer hover:bg-green-50"
            >
              <input
                type="radio"
                name="answer"
                value={idx}
                checked={answers[currentQuestion] === idx}
                onChange={() => selectOption(idx)}
                disabled={!available}
                className="mr-2"
              />
              {opt}
            </label>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <button
            disabled={currentQuestion === 0 || !available}
            onClick={() => setCurrentQuestion((q) => q - 1)}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-40"
          >
            Previous
          </button>

          {currentQuestion < quiz.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestion((q) => q + 1)}
              disabled={!available}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!available}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Submit Quiz
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
