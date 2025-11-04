import React, { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function ProfessorCourseDetail() {
  const { courseId } = useParams();
  const {
    getProfessorCourseById,
    getAssignmentsForCourse,
    addMaterialToCourse,
    addAssignmentToCourse,
    addQuizToCourse
  } = useApp();

  const [course, setCourse] = useState(null);
  const [courseAssignments, setCourseAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // States for forms
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialLink, setMaterialLink] = useState("");
  const [materialFile, setMaterialFile] = useState(null);

  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentInstr, setAssignmentInstr] = useState("");
  const [assignmentDue, setAssignmentDue] = useState("");

  const [quizTitle, setQuizTitle] = useState("");

  // Fetch course and assignments
  const fetchCourseAndAssignments = async () => {
    setLoading(true);
    const fetchedCourse = await getProfessorCourseById(courseId);
    setCourse(fetchedCourse);
    if (fetchedCourse) {
      const fetchedAssignments = await getAssignmentsForCourse(fetchedCourse.id || fetchedCourse._id);
      setCourseAssignments(fetchedAssignments || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCourseAndAssignments();
    // eslint-disable-next-line
  }, [courseId]);

  if (loading) return <div style={{ padding: "2rem" }}>Loading...</div>;
  if (!course) return <div style={{ padding: "2rem" }}>Course not found.</div>;

  return (
    <div style={{ padding: "2rem", minHeight: "100vh" }}>
      <h2 style={{ fontWeight: "bold", fontSize: "1.7rem", marginBottom: "1.5rem" }}>{course.title}</h2>
      <div style={{ marginBottom: "2rem", color: "#333", fontSize: "1.1rem" }}>{course.description}</div>

      {/* Study Materials */}
      <h3 style={{ marginTop: "2rem", fontWeight: "bold" }}>Study Materials</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1.2rem", margin: "1rem 0" }}>
        {(course.materials || []).map(mat =>
          <div key={mat.id} style={{ background: "#f3f4f6", borderRadius: "7px", padding: "0.85rem 1.2rem", fontSize: ".97rem" }}>
            {mat.type === "pdf" ? "📄" : "🔗"}&nbsp;
            <a href={mat.url} target="_blank" rel="noopener noreferrer">{mat.title}</a>
          </div>
        )}
      </div>
      {/* Add Material FORM */}
      <form onSubmit={async e => {
        e.preventDefault();
        if (!materialTitle || (!materialLink && !materialFile)) {
          toast.error("Enter a title and material file or link");
          return;
        }
        let url = materialLink;
        let type = "link";
        if (materialFile) {
          // If you have an API for file upload, call it here (e.g. uploadMaterial), then set url = uploaded file url
          url = URL.createObjectURL(materialFile);
          type = "pdf";
        }
        await addMaterialToCourse(course.id || course._id, { title: materialTitle, type, url });
        setMaterialTitle(""); setMaterialLink(""); setMaterialFile(null);
        toast.success("Material added!");
        fetchCourseAndAssignments();
      }} style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <input
            placeholder="Material Title"
            value={materialTitle}
            onChange={e => setMaterialTitle(e.target.value)}
            style={{ padding: "0.4rem" }}
          />
          <input
            placeholder="File Link (optional)"
            value={materialLink}
            onChange={e => setMaterialLink(e.target.value)}
            style={{ padding: "0.4rem" }}
          />
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={e => setMaterialFile(e.target.files[0])}
          />
          <button
            style={{ background: "#6366f1", color: "#fff", padding: "0.5rem 1.1rem", border: "none", borderRadius: "7px" }}
            type="submit"
          >Add Material</button>
        </div>
      </form>

      {/* Assignments */}
      <h3 style={{ marginTop: "2rem", fontWeight: "bold" }}>Assignments</h3>
      <div style={{ margin: "1rem 0 0.3rem 0" }}>
        {courseAssignments.map(a =>
          <div key={a.id} style={{ background: "#e0e7ff", borderRadius: "7px", marginBottom: "0.75rem", padding: "0.9rem" }}>
            <Link to={`/professor/assignments/${a.id}`} style={{ color: "#2563eb", textDecoration: "underline", fontWeight: "bold" }}>{a.title}</Link> (Due: {a.due})
            <div style={{ fontSize: ".98rem", color: "#444", marginTop: "0.22rem" }}>{a.instructions}</div>
          </div>
        )}
      </div>
      {/* Add assignment FORM */}
      <form onSubmit={async e => {
        e.preventDefault();
        if (!assignmentTitle || !assignmentInstr || !assignmentDue) {
          toast.error("Please fill all assignment fields");
          return;
        }
        await addAssignmentToCourse(course.id || course._id, {
          title: assignmentTitle,
          instructions: assignmentInstr,
          due: assignmentDue
        });
        setAssignmentTitle(""); setAssignmentInstr(""); setAssignmentDue("");
        toast.success("Assignment added!");
        fetchCourseAndAssignments();
      }} style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <input
            placeholder="Assignment Title"
            value={assignmentTitle}
            onChange={e => setAssignmentTitle(e.target.value)}
            style={{ padding: "0.4rem" }}
          />
          <input
            placeholder="Due Date (YYYY-MM-DD)"
            value={assignmentDue}
            onChange={e => setAssignmentDue(e.target.value)}
            style={{ padding: "0.4rem" }}
          />
          <input
            placeholder="Instructions"
            value={assignmentInstr}
            onChange={e => setAssignmentInstr(e.target.value)}
            style={{ padding: "0.4rem", width: "220px" }}
          />
          <button
            style={{ background: "#6366f1", color: "#fff", padding: "0.5rem 1rem", border: "none", borderRadius: "7px" }}
            type="submit"
          >Add Assignment</button>
        </div>
      </form>

      {/* Quizzes */}
      <h3 style={{ marginTop: "2rem", fontWeight: "bold" }}>Quizzes</h3>
      <div style={{ margin: "1rem 0 0.3rem 0" }}>
        {(course.quizzes || []).length === 0 ? (
          <div style={{ fontSize: ".97rem", color: "#6b7280" }}>No quizzes yet.</div>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {(course.quizzes || []).map(q =>
              <li key={q.id} style={{ marginBottom: ".8rem" }}>
                <div style={{
                  background: "#fef9c3",
                  borderRadius: "7px",
                  padding: "0.9rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <b>{q.title}</b>
                  <Link
                    to={`/professor/courses/${course.id}/quizzes/${q.id}`}
                    style={{
                      marginLeft: "2rem",
                      background: "#eab308",
                      color: "#fff",
                      padding: "0.4rem 1rem",
                      borderRadius: "6px",
                      textDecoration: "none",
                      fontWeight: "bold",
                      fontSize: ".99rem"
                    }}>
                    Edit Quiz
                  </Link>
                </div>
              </li>
            )}
          </ul>
        )}
      </div>
      {/* Add quiz FORM */}
      <form onSubmit={async e => {
        e.preventDefault();
        if (!quizTitle) {
          toast.error("Enter quiz title");
          return;
        }
        await addQuizToCourse(course.id || course._id, { title: quizTitle });
        setQuizTitle("");
        toast.success("Quiz added!");
        fetchCourseAndAssignments();
      }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.5rem" }}>
          <input
            placeholder="Quiz Title"
            value={quizTitle}
            onChange={e => setQuizTitle(e.target.value)}
            style={{ padding: "0.4rem" }}
          />
          <button
            style={{ background: "#eab308", color: "#fff", padding: "0.5rem 1.2rem", border: "none", borderRadius: "7px" }}
            type="submit"
          >Add Quiz</button>
        </div>
      </form>
    </div>
  );
}
