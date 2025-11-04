import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import { toast } from "react-toastify";

export default function ProfessorQuizEditor() {
  const { courseId, quizId } = useParams();
  const { courses, addQuestionToQuiz } = useApp();

  const course = courses.find(c => String(c.id) === String(courseId));
  const quiz = course?.quizzes?.find(q => String(q.id) === String(quizId));

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);

  if (!quiz) return <div style={{ padding: "2rem" }}>Quiz not found.</div>;

  const handleAddQuestion = () => {
    if (question.trim().length < 5) {
      toast.error("Question is too short!");
      return;
    }
    if (options.some(opt => !opt)) {
      toast.error("All options required.");
      return;
    }
    addQuestionToQuiz(course.id, quiz.id, {
      text: question,
      options: [...options],
      correct: correct // this could be index (0-3) or value
    });
    setQuestion("");
    setOptions(["", "", "", ""]);
    setCorrect(0);
    toast.success("Question added!");
  };

  return (
    <div style={{ padding: "2rem", maxWidth: 600, margin: "0 auto" }}>
      <h2 style={{ fontWeight: 700, fontSize: "1.45rem", marginBottom: 18 }}>
        Edit Quiz: {quiz.title}
      </h2>
      <div style={{
        marginBottom: 24,
        background: "#f3f4f6",
        borderRadius: ".5rem",
        padding: "1.2rem 1rem"
      }}>
        <h4 style={{ marginBottom: 8 }}>Add Question</h4>
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Type the question..."
          rows={3}
          style={{ width: "100%", marginBottom: 8, borderRadius: 6, padding: 9}}
        />
        <div style={{ marginBottom: 8 }}>
          {["A", "B", "C", "D"].map((label, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
              <input
                type="radio"
                checked={correct === i}
                onChange={() => setCorrect(i)}
                style={{marginRight: 8}}
              />
              <input
                value={options[i]}
                placeholder={`Option ${label}`}
                onChange={e => setOptions(arr => arr.map((opt, j) => j === i ? e.target.value : opt))}
                style={{ width: 240, marginRight: 10, padding: 5 }}
              />
              {correct === i && <span style={{color: "#16a34a"}}>✓ Correct</span>}
            </div>
          ))}
        </div>
        <button
          onClick={handleAddQuestion}
          style={{
            padding: "0.5rem 1.2rem",
            marginTop: 8,
            background: "#22c55e",
            color: "#fff",
            border: "none",
            borderRadius: "7px",
            fontWeight: 600
          }}
        >Add Question</button>
      </div>
      {/* List of Questions */}
      <h4>Quiz Questions</h4>
      <ol>
        {quiz.questions.map((q, i) => (
          <li key={q.id} style={{
            background: "#fff4",
            borderLeft: "4px solid #6366f1",
            marginBottom: 12, padding: 8, borderRadius: 5
          }}>
            <div style={{ fontWeight: 600 }}>{i+1}. {q.text}</div>
            <ol style={{ marginLeft: 18 }}>
              {q.options.map((opt, idx) => (
                <li key={idx}>
                  {opt} {q.correct === idx ? <b style={{color:"#16a34a"}}>✓</b> : null}
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </div>
  );
}
