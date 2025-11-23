import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { API_HOST } from '../config/api';
import { useApp } from "../contexts/AppContext";
import { toast } from "react-toastify";

export default function CourseDetail() {
  const { courseId } = useParams();
  const {
    user,
    fetchCourseById,
    fetchAssignmentsForCourse,
    fetchQuizzesForCourse, // ✅ Added
  } = useApp();

  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Load course data, assignments, and quizzes
  useEffect(() => {
    const loadCourseData = async () => {
      try {
        setLoading(true);

        // Fetch course info
        const courseData = await fetchCourseById(courseId);
        if (!courseData) {
          toast.error("Course not found.");
          return;
        }
        setCourse(courseData);

        // Fetch assignments
        const courseAssignments = await fetchAssignmentsForCourse(courseId);
        setAssignments(Array.isArray(courseAssignments) ? courseAssignments : []);

        // ✅ Fetch quizzes using authenticated API
        const quizzesData = await fetchQuizzesForCourse(courseId);
        setQuizzes(Array.isArray(quizzesData) ? quizzesData : []);
      } catch (err) {
        console.error("Error loading course details:", err);
        toast.error("Failed to load course data.");
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [courseId, fetchCourseById, fetchAssignmentsForCourse, fetchQuizzesForCourse]);

  if (loading)
    return (
      <div className="p-6 text-center text-gray-600">Loading course details...</div>
    );

  if (!course)
    return (
      <div className="p-6 text-center text-gray-600">Course not found.</div>
    );

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-green-700 mb-1">{course.title}</h1>
        <p className="text-gray-600 mb-2">{course.description}</p>
        <p className="text-sm text-gray-500">
          Professor: {course.professor?.name || "N/A"}
        </p>
      </div>

      {/* ✅ Study Materials */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3 text-green-700">
          📘 Study Materials
        </h2>
        {course.materials && course.materials.length > 0 ? (
          <ul className="bg-white rounded-lg shadow p-4 space-y-3">
            {course.materials.map((m, i) => (
              <li key={i} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{m.title}</p>
                  <p className="text-xs text-gray-500">
                    Uploaded on{" "}
                    {m.uploadedAt
                      ? new Date(m.uploadedAt).toLocaleDateString()
                      : "Unknown"}
                  </p>
                </div>
                <div className="flex gap-3">
                  <a
                    href={m.fileUrl && m.fileUrl.startsWith('http') ? m.fileUrl : `${API_HOST}${m.fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </a>
                  <a
                    href={m.fileUrl && m.fileUrl.startsWith('http') ? m.fileUrl : `${API_HOST}${m.fileUrl}`}
                    download
                    className="text-green-600 hover:underline"
                  >
                    Download
                  </a>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">
            No study materials available yet.
          </p>
        )}
      </section>

      {/* ✅ Assignments */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3 text-green-700">
          📝 Assignments
        </h2>
        {assignments.length > 0 ? (
          <ul className="bg-white rounded-lg shadow p-4 space-y-2">
            {assignments.map((a) => (
              <li key={a._id} className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{a.title}</p>
                  <p className="text-sm text-gray-500">{a.description}</p>
                  {a.attachmentUrl && (
                    <a
                      href={a.attachmentUrl && a.attachmentUrl.startsWith('http') ? a.attachmentUrl : `${API_HOST}${a.attachmentUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 text-sm hover:underline block mt-1"
                    >
                      📎 View Attachment
                    </a>
                  )}
                </div>
                <span className="text-sm text-gray-600">
                  Due: {new Date(a.dueDate).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No assignments found.</p>
        )}
      </section>

      {/* ✅ Quizzes */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3 text-green-700">
          🧠 Quizzes
        </h2>
        {quizzes.length > 0 ? (
          <ul className="bg-white rounded-lg shadow p-4 space-y-2">
            {quizzes.map((q) => (
              <li
                key={q._id}
                className="flex justify-between items-center border-b pb-2"
              >
                <div>
                  <span className="font-medium">{q.title}</span>
                  <p className="text-xs text-gray-500">
                    {q.questions?.length || 0} Questions
                  </p>
                </div>
                <Link
                  to={`/student/courses/${courseId}/quiz/${q._id}`}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Take Quiz
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No quizzes yet.</p>
        )}
      </section>

      {/* ✅ Enrolled Students (visible for professor/admin only) */}
      {(user?.role === "professor" || user?.role === "admin") && (
        <section>
          <h2 className="text-2xl font-semibold mb-3 text-green-700">
            👥 Enrolled Students
          </h2>
          {course.students && course.students.length > 0 ? (
            <ul className="bg-white rounded-lg shadow p-4 space-y-1">
              {course.students.map((s) => (
                <li key={s._id} className="flex justify-between">
                  <span>{s.name}</span>
                  <span className="text-gray-500 text-sm">{s.email}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No students enrolled yet.</p>
          )}
        </section>
      )}
    </div>
  );
}
