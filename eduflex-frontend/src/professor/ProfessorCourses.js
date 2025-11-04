import React, { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function ProfessorCourses() {
  const { user, getMyProfessorCourses, createCourse, updateCourse, deleteCourse } = useApp();

  const [myCourses, setMyCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch my professor courses from context on mount or when changes occur
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      const courses = user ? await getMyProfessorCourses() : [];
      setMyCourses(courses || []);
      setLoading(false);
    };
    fetchCourses();
  }, [getMyProfessorCourses, user]);

  // Helper to refresh courses after create/update/delete
  const refreshCourses = async () => {
    setLoading(true);
    const courses = user ? await getMyProfessorCourses() : [];
    setMyCourses(courses || []);
    setLoading(false);
  };

  return (
    <div style={{ padding: "2rem", minHeight: "100vh" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "2rem"
      }}>
        <h2 style={{ fontWeight: "bold", fontSize: "2rem" }}>My Courses</h2>
        <button
          style={{
            padding: "0.8rem 1.4rem",
            background: "linear-gradient(135deg, #6366f1, #2e1065)",
            color: "#fff",
            border: "none",
            borderRadius: "0.7rem",
            fontWeight: 600,
            fontSize: "1rem",
            cursor: "pointer"
          }}
          onClick={() => setShowModal(true)}
        >
          + Create New Course
        </button>
      </div>

      {loading ? (
        <div style={{ color: "#666", textAlign: "center", paddingTop: "1.5rem" }}>Loading...</div>
      ) : myCourses.length === 0 ? (
        <div style={{ color: "#666", textAlign: "center", paddingTop: "1.5rem" }}>No courses yet. Start by creating one!</div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
          {myCourses.map(course =>
            <CourseCard
              course={course}
              key={course.id || course._id}
              updateCourse={async (id, title, desc) => {
                await updateCourse(id, { title, description: desc });
                toast.success("Course updated");
                refreshCourses();
              }}
              deleteCourse={async (id) => {
                if (window.confirm("Delete this course?")) {
                  await deleteCourse(id);
                  toast.success("Course deleted!");
                  refreshCourses();
                }
              }}
            />
          )}
        </div>
      )}

      {showModal && (
        <CourseModal
          onClose={() => setShowModal(false)}
          onSubmit={async data => {
            await createCourse({ ...data, ownerId: user.id });
            toast.success("Course created!");
            setShowModal(false);
            refreshCourses();
          }}
        />
      )}
    </div>
  );
}

function CourseCard({ course, updateCourse, deleteCourse }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(course.title);
  const [desc, setDesc] = useState(course.description);

  return (
    <div style={{
      background: "#f3f4f6",
      borderRadius: "1rem",
      minWidth: 250, maxWidth: 320,
      padding: "1.5rem", flex: "1 1 270px", boxShadow: "0 2px 16px rgba(44,44,44,0.06)"
    }}>
      {editing ? (
        <>
          <input value={title} onChange={e => setTitle(e.target.value)} style={{ fontWeight: "bold", fontSize: "1.1rem", width: "100%", marginBottom: "0.5rem" }} />
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} style={{ fontSize: "1rem", width: "100%" }} />
          <button onClick={async () => {
            await updateCourse(course.id || course._id, title, desc);
            setEditing(false);
          }} style={{ margin: "1rem 0.5rem 0 0", background: "#22c55e", color: "#fff", border: "none", padding: "0.4rem 1.1rem", borderRadius: "5px" }}>Save</button>
          <button onClick={() => setEditing(false)} style={{ background: "#ccc", border: "none", padding: "0.4rem 1.1rem", borderRadius: "5px" }}>Cancel</button>
        </>
      ) : (
        <>
          <Link to={`/professor/courses/${course.id || course._id}`} style={{ textDecoration: "none", color: "#4338ca", fontWeight: "bold", fontSize: "1.13rem" }}>{course.title}</Link>
          <div style={{ marginBottom: "0.8rem", color: "#444" }}>{course.description}</div>
          <div style={{ fontSize: "0.9rem", opacity: 0.67, marginBottom: "0.6rem" }}>Credits: {course.credits || "N/A"}</div>
          <button onClick={() => setEditing(true)} style={{ background: "#6366f1", color: "#fff", border: "none", padding: "0.35rem 1rem", borderRadius: "4px" }}>Edit</button>
          <button onClick={() => deleteCourse(course.id || course._id)} style={{ background: "#f43f5e", color: "#fff", border: "none", padding: "0.35rem 1rem", borderRadius: "4px", marginLeft: "0.6rem" }}>Delete</button>
        </>
      )}
    </div>
  );
}

function CourseModal({ onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [credit, setCredit] = useState(4);

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(44,44,44,.26)", zIndex: 999
    }}>
      <div style={{
        background: "#fff", borderRadius: "1rem", maxWidth: 400, margin: "6% auto", padding: "2rem", position: "relative"
      }}>
        <h3 style={{ marginBottom: "1.2rem", fontWeight: "bold", fontSize: "1.2rem" }}>Create New Course</h3>
        <label style={{ fontWeight: 500 }}>Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} style={{ width: "100%", marginBottom: "1rem" }} />
        <label style={{ fontWeight: 500 }}>Description</label>
        <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} style={{ width: "100%", marginBottom: "1rem" }} />
        <label style={{ fontWeight: 500 }}>Credits</label>
        <input type="number" value={credit} min={0} max={10} onChange={e => setCredit(Number(e.target.value))} style={{ width: "100%", marginBottom: "1.4rem" }} />
        <div>
          <button onClick={() => { onSubmit({ title, description: desc, credits: credit }); }} style={{ background: "#6366f1", color: "#fff", border: "none", padding: "0.5rem 1.4rem", borderRadius: "6px", fontWeight: 600 }}>Create</button>
          <button onClick={onClose} style={{ marginLeft: "1rem", background: "#aaa", color: "#fff", border: "none", padding: "0.5rem 1.4rem", borderRadius: "6px" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
