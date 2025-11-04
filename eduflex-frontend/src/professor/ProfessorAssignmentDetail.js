import { useApp } from "../contexts/AppContext";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

// Assumed: you have getProfessorAssignments, getProfessorCourseById, getEnrolledStudents, gradeSubmission

export default function ProfessorAssignmentDetail() {
  const { assignmentId } = useParams();
  const {
    getProfessorAssignments,
    getProfessorCourseById,
    getEnrolledStudents, // <-- implement in context or fetch students with course
    gradeSubmission,
  } = useApp();

  const [assignment, setAssignment] = useState(null);
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [gradingState, setGradingState] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch assignment, course, and students
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Get all assignments for all professor courses, then find the one we want
      let foundAssignment = null, foundCourse = null;
      const courses = await getProfessorCourseById ? await getProfessorCourseById() : [];
      for (const c of (Array.isArray(courses) ? courses : [courses])) {
        const courseAssignments = await getProfessorAssignments(c.id || c._id);
        const match = (courseAssignments || []).find(a => String(a.id || a._id) === String(assignmentId));
        if (match) {
          foundAssignment = match;
          foundCourse = c;
          break;
        }
      }
      setAssignment(foundAssignment);
      setCourse(foundCourse);
      if (foundCourse && foundCourse.id)
        setStudents(await getEnrolledStudents(foundCourse.id));
      setLoading(false);
    };
    fetchData();
    // eslint-disable-next-line
  }, [assignmentId]);

  // Setup grading state whenever students or assignment change
  useEffect(() => {
    if (!students.length || !assignment) return;
    setGradingState(
      Object.fromEntries(
        students.map(stu => {
          const sub = assignment.submissions?.find(sub => sub.studentId === stu.id) || {};
          return [
            stu.id,
            {
              grade: sub.grade ?? "",
              feedback: sub.feedback ?? ""
            }
          ];
        })
      )
    );
  }, [students, assignment]);

  const handleInput = (sid, key, value) => {
    setGradingState(st => ({
      ...st,
      [sid]: {
        ...st[sid],
        [key]: value
      }
    }));
  };

  if (loading) return <div style={{ padding: 32 }}>Loading...</div>;
  if (!assignment) return <div style={{ padding: 32 }}>Assignment not found.</div>;

  let numSubmitted = 0,
    numNot = 0;
  students.forEach(stu => {
    const sub = assignment.submissions?.find(sub => sub.studentId === stu.id);
    if (sub?.status === "submitted") numSubmitted++;
    else numNot++;
  });

  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ marginBottom: 20 }}>{assignment.title}</h2>
      <div style={{ fontWeight: 500, color: "#444", marginBottom: 14 }}>{assignment.instructions}</div>
      <div style={{ fontSize: ".99rem" }}><b>Due:</b> {assignment.due}</div>
      <div style={{ fontSize: ".99rem", margin: ".8rem 0 1.4rem 0" }}>
        <span style={{ color: "#10b981" }}>Submitted: {numSubmitted}</span> &nbsp;|&nbsp;
        <span style={{ color: "#dc2626" }}>Not Submitted: {numNot}</span>
      </div>
      <hr style={{ margin: "1.5rem 0" }} />
      <h3 style={{ fontWeight: "bold", marginBottom: "1.1rem" }}>Student Submissions</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", boxShadow: "0 2px 8px #ddd3" }}>
        <thead>
          <tr style={{ background: "#e0e7ff" }}>
            <th style={tdS}>Student</th>
            <th style={tdS}>Status</th>
            <th style={tdS}>Submitted File/Text</th>
            <th style={tdS}>Grade</th>
            <th style={tdS}>Feedback</th>
            <th style={tdS}>Action</th>
          </tr>
        </thead>
        <tbody>
          {students.map(stu => {
            const submission =
              assignment.submissions?.find(sub => sub.studentId === stu.id) || {
                status: "not_submitted"
              };
            return (
              <tr key={stu.id}>
                <td style={tdS}>
                  {stu.name}
                  <br />
                  <span style={{ color: "#4361ee" }}>{stu.email}</span>
                </td>
                <td style={tdS}>
                  <Status status={submission.status} graded={submission.graded} />
                </td>
                <td style={tdS}>
                  {submission.status === "submitted" ? (
                    <>
                      {submission.fileName && (
                        <div>
                          <a
                            href={submission.fileUrl}
                            download={submission.fileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#2563eb", fontWeight: 500 }}
                          >📄 {submission.fileName}</a>
                        </div>
                      )}
                      {submission.text && (
                        <div
                          style={{
                            background: "#f3f4f6",
                            display: "inline-block",
                            marginTop: 2,
                            padding: "0.5rem 1rem",
                            borderRadius: 6
                          }}
                        >
                          {submission.text}
                        </div>
                      )}
                    </>
                  ) : (
                    <span style={{ color: "#888" }}>---</span>
                  )}
                </td>
                <td style={tdS}>
                  <input
                    type="number"
                    value={gradingState[stu.id]?.grade ?? ""}
                    onChange={e =>
                      handleInput(stu.id, "grade", e.target.value)
                    }
                    disabled={
                      submission.status !== "submitted" || submission.graded
                    }
                    min={0}
                    max={100}
                    style={{
                      width: 50,
                      padding: 4,
                      background:
                        submission.graded && submission.status === "submitted"
                          ? "#ecfeff"
                          : "#fff"
                    }}
                  />
                </td>
                <td style={tdS}>
                  <input
                    type="text"
                    value={gradingState[stu.id]?.feedback ?? ""}
                    onChange={e =>
                      handleInput(stu.id, "feedback", e.target.value)
                    }
                    style={{ width: 100, padding: 4 }}
                    disabled={
                      submission.status !== "submitted" || submission.graded
                    }
                  />
                </td>
                <td style={tdS}>
                  {submission.status === "submitted" ? (
                    <button
                      onClick={async () => {
                        await gradeSubmission(
                          assignment.id || assignment._id,
                          stu.id,
                          {
                            grade: Number(gradingState[stu.id]?.grade),
                            feedback: gradingState[stu.id]?.feedback
                          }
                        );
                        toast.success("Graded!");
                        // Refresh assignment after grading
                        // ...repeat the fetch logic to update assignment and state
                      }}
                      disabled={submission.graded}
                      style={{
                        background:
                          submission.graded && submission.status === "submitted"
                            ? "#bdbdbd"
                            : "#16a34a",
                        color: "#fff",
                        padding: "0.4rem 1rem",
                        border: "none",
                        borderRadius: 6,
                        cursor: submission.graded ? "not-allowed" : "pointer"
                      }}
                    >
                      {submission.graded ? "✔ Graded" : "Grade"}
                    </button>
                  ) : (
                    <span style={{ color: "#aaa" }}>N/A</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


function Status({ status, graded }) {
  if (status === "submitted" && graded)
    return <span style={{ color: "#16a34a" }}>Graded</span>;
  if (status === "submitted") return <span style={{ color: "#2563eb" }}>Submitted</span>;
  return <span style={{ color: "#f59e42" }}>Not Submitted</span>;
}

const tdS = {
  padding: 8,
  textAlign: "center",
  borderBottom: "1px solid #eef2ff"
};
