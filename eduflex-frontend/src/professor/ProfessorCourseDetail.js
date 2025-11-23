import React, { useEffect, useState, useCallback } from "react";
import { useApp } from "../contexts/AppContext";
import { useParams, Link } from "react-router-dom";
import { API_HOST } from '../config/api';
import { toast } from "react-toastify";
import { FaTrash } from 'react-icons/fa'; // 1. Import the delete icon

export default function ProfessorCourseDetail() {
  const { courseId } = useParams();
  const {
    fetchProfessorCourseById,
    fetchAssignmentsForCourse,
    updateProfessorCourse,
    createAssignment,
    fetchQuizzesForCourse,
    createQuiz,
    deleteAssignment, // 2. Get the deleteAssignment function
  } = useApp();

  const [course, setCourse] = useState(null);
  const [courseAssignments, setCourseAssignments] = useState([]);
  const [courseQuizzes, setCourseQuizzes] = useState([]); // ✅ New
  const [loading, setLoading] = useState(true);

  // Study Material form
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialLink, setMaterialLink] = useState("");

  // Assignment form
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentInstr, setAssignmentInstr] = useState("");
  const [assignmentDue, setAssignmentDue] = useState("");
  const [assignmentFile, setAssignmentFile] = useState(null);

  // ✅ Quiz form
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState([
    { questionText: "", options: ["", "", "", ""], correctOption: 0 },
  ]);
  const [quizTimeLimit, setQuizTimeLimit] = useState(''); // minutes, optional
  const [quizWarningTime, setQuizWarningTime] = useState(''); // minutes before end to warn students
  const [quizScheduledAt, setQuizScheduledAt] = useState('');
  const [quizScheduledEnd, setQuizScheduledEnd] = useState('');

  // -------------------------
  // Fetch course + assignments + quizzes
  // -------------------------
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedCourse, fetchedAssignments, fetchedQuizzes] = await Promise.all([
        fetchProfessorCourseById(courseId),
        fetchAssignmentsForCourse(courseId),
        fetchQuizzesForCourse(courseId),
      ]);
      setCourse(fetchedCourse);
      setCourseAssignments(fetchedAssignments || []);
      setCourseQuizzes(fetchedQuizzes || []);
    } catch {
      toast.error("Failed to load course data.");
    }
    setLoading(false);
  }, [courseId, fetchProfessorCourseById, fetchAssignmentsForCourse, fetchQuizzesForCourse]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // -------------------------
  // HANDLERS
  // -------------------------

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!materialTitle || !materialLink) {
      toast.error("Enter a title and a link for the material");
      return;
    }

    const newMaterial = { title: materialTitle, fileUrl: materialLink };
    const updatedMaterials = [...(course.materials || []), newMaterial];

    const updatedCourse = await updateProfessorCourse(courseId, {
      materials: updatedMaterials,
    });

    if (updatedCourse) {
      setMaterialTitle("");
      setMaterialLink("");
      toast.success("Material added!");
      fetchAllData();
    }
  };

  const handleAddAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentTitle || !assignmentInstr || !assignmentDue) {
      toast.error("Please fill all assignment fields");
      return;
    }

    const formData = new FormData();
    formData.append("title", assignmentTitle);
    formData.append("description", assignmentInstr);
    formData.append("dueDate", assignmentDue);
    formData.append("courseId", courseId);
    if (assignmentFile) formData.append("file", assignmentFile);

    const newAssignment = await createAssignment(formData, true);
    if (newAssignment) {
      setAssignmentTitle("");
      setAssignmentInstr("");
      setAssignmentDue("");
      setAssignmentFile(null);
      toast.success("Assignment added!");
      fetchAllData();
    }
  };

  // 3. Add the delete handler
  const handleDeleteAssignment = async (assignmentId) => {
    if (window.confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      const success = await deleteAssignment(assignmentId);
      if (success) {
        // If successful, refresh the assignment list by re-fetching all data
        fetchAllData();
      }
    }
  };

  // ✅ QUIZ HANDLERS
  const addQuestion = () => {
    setQuestions([...questions, { questionText: "", options: ["", "", "", ""], correctOption: 0 }]);
  };

  const handleQuestionChange = (i, value) => {
    const updated = [...questions];
    updated[i].questionText = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qi, oi, value) => {
    const updated = [...questions];
    updated[qi].options[oi] = value;
    setQuestions(updated);
  };

  const handleCorrectOptionChange = (qi, value) => {
    const updated = [...questions];
    updated[qi].correctOption = parseInt(value);
    setQuestions(updated);
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (!quizTitle || questions.some(q => !q.questionText || q.options.some(o => !o))) {
      toast.error("Please fill all quiz fields properly!");
      return;
    }

    const payload = { title: quizTitle, courseId, questions };
    if (quizTimeLimit) payload.timeLimit = Number(quizTimeLimit);
    if (quizWarningTime) payload.warningTime = Number(quizWarningTime);
    if (quizScheduledAt) payload.scheduledAt = quizScheduledAt; // string ISO from datetime-local
    if (quizScheduledEnd) payload.scheduledEnd = quizScheduledEnd;
    const newQuiz = await createQuiz(payload);

    if (newQuiz) {
      toast.success("Quiz created successfully!");
      setQuizTitle("");
      setQuestions([{ questionText: "", options: ["", "", "", ""], correctOption: 0 }]);
      fetchAllData();
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!course) return <div className="p-8">Course not found.</div>;

  return (
    <div className="p-8 min-h-screen">
      <h2 className="font-bold text-3xl mb-4">{course.title}</h2>
      <p className="mb-8 text-gray-700 text-base">{course.description}</p>

      {/* ======================== */}
      {/* Study Materials */}
      {/* ======================== */}
      <h3 className="mt-8 text-2xl font-semibold mb-4">Study Materials</h3>
      <div className="flex flex-wrap gap-3 my-4">
        {(course.materials || []).length === 0 ? (
          <p className="text-gray-500 text-sm">No materials added yet.</p>
        ) : (
          (course.materials || []).map((mat, index) => (
            <a
              href={mat.url || mat.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              key={index}
              className="bg-gray-100 rounded-md px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200 transition-colors"
            >
              📄 {mat.title}
            </a>
          ))
        )}
      </div>

      <form
        onSubmit={handleAddMaterial}
        className="mb-8 p-4 bg-gray-50 rounded-lg shadow-sm"
      >
        <h4 className="font-semibold mb-3">Add New Material</h4>
        <div className="flex flex-wrap gap-4 items-center">
          <input
            placeholder="Material Title"
            value={materialTitle}
            onChange={(e) => setMaterialTitle(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            required
          />
          <input
            placeholder="Material Link (http://...)"
            type="url"
            value={materialLink}
            onChange={(e) => setMaterialLink(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            required
          />
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
            type="submit"
          >
            Add Material
          </button>
        </div>
      </form>

      {/* ======================== */}
      {/* Assignments */}
      {/* ======================== */}
      <h3 className="mt-10 text-2xl font-semibold mb-4">Assignments</h3>
      <div className="my-4 space-y-3">
        {courseAssignments.length === 0 ? (
          <p className="text-gray-500 text-sm">No assignments created yet.</p>
        ) : (
          courseAssignments.map((a) => (
            <div
              key={a._id}
              className="bg-indigo-50 border border-indigo-200 rounded-lg mb-3 p-4 flex justify-between items-center" // 4. Added flex
            >
              <div> {/* Wrapper for assignment content */}
                <Link
                  to={`/professor/assignments/${a._id}`}
                  className="text-blue-600 text-lg font-bold hover:underline"
                >
                  {a.title}
                </Link>
                <span className="text-sm text-gray-600 ml-3">
                  (Due: {new Date(a.dueDate).toLocaleDateString()})
                </span>
                {a.attachmentUrl && (
                  <div className="mt-2">
                    <a
                      href={a.attachmentUrl && a.attachmentUrl.startsWith('http') ? a.attachmentUrl : `${API_HOST}${a.attachmentUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 text-sm hover:underline"
                    >
                      📎 Download Attachment
                    </a>
                  </div>
                )}
                <div className="text-sm text-gray-700 mt-1">{a.description}</div>
              </div>
              
              {/* 5. Delete button */}
              <button
                onClick={() => handleDeleteAssignment(a._id)}
                className="text-red-500 hover:text-red-700 transition-colors ml-4"
                title="Delete Assignment"
              >
                <FaTrash size={18} />
              </button>

            </div>
          ))
        )}
      </div>

      <form
        onSubmit={handleAddAssignment}
        className="mb-10 p-4 bg-gray-50 rounded-lg shadow-sm"
        encType="multipart/form-data"
      >
        <h4 className="font-semibold mb-3">Add New Assignment</h4>
        <div className="flex flex-wrap gap-4 items-center">
          <input
            placeholder="Assignment Title"
            value={assignmentTitle}
            onChange={(e) => setAssignmentTitle(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            required
          />
          <input
            type="date"
            value={assignmentDue}
            onChange={(e) => setAssignmentDue(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            required
          />
          <input
            placeholder="Instructions"
            value={assignmentInstr}
            onChange={(e) => setAssignmentInstr(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm flex-grow"
            required
          />
          <input
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            onChange={(e) => setAssignmentFile(e.target.files[0])}
            className="text-sm text-gray-700"
          />
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
            type="submit"
          >
            Add Assignment
          </button>
        </div>
      </form>

      {/* ======================== */}
      {/* QUIZZES SECTION */}
      {/* ======================== */}
      <h3 className="mt-10 text-2xl font-semibold mb-4">Quizzes</h3>
      <div className="my-4 space-y-3">
        {courseQuizzes.length === 0 ? (
          <p className="text-gray-500 text-sm">No quizzes created yet.</p>
        ) : (
          courseQuizzes.map((quiz) => (
            <div
              key={quiz._id}
              className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
            >
              <div className="text-lg font-semibold text-yellow-800">{quiz.title}</div>
              <div className="text-sm text-gray-600">
                Questions: {quiz.questions?.length || 0}
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE QUIZ FORM */}
      <form
        onSubmit={handleCreateQuiz}
        className="mt-6 p-4 bg-gray-50 rounded-lg shadow-sm"
      >
        <h4 className="font-semibold mb-3">Create New Quiz</h4>

        <input
          placeholder="Quiz Title"
          value={quizTitle}
          onChange={(e) => setQuizTitle(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm w-full mb-4"
          required
        />

        <div className="mb-4 flex flex-wrap items-start gap-4">
          <div>
            <input
              placeholder="Time limit (minutes, optional)"
              value={quizTimeLimit}
              onChange={(e) => setQuizTimeLimit(e.target.value)}
              type="number"
              min="1"
              className="px-3 py-2 border border-gray-300 rounded-md text-sm w-56"
            />
            <div className="text-xs text-gray-500 mt-1">Leave empty for no time limit.</div>
          </div>

          <div>
            <input
              placeholder="Warn before (minutes, optional)"
              value={quizWarningTime}
              onChange={(e) => setQuizWarningTime(e.target.value)}
              type="number"
              min="1"
              className="px-3 py-2 border border-gray-300 rounded-md text-sm w-56"
            />
            <div className="text-xs text-gray-500 mt-1">Notify students this many minutes before time ends.</div>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Start (local)</label>
            <input
              type="datetime-local"
              value={quizScheduledAt}
              onChange={(e) => setQuizScheduledAt(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm w-64"
            />
            <div className="text-xs text-gray-500 mt-1">Optional: schedule when the quiz becomes available.</div>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">End (local)</label>
            <input
              type="datetime-local"
              value={quizScheduledEnd}
              onChange={(e) => setQuizScheduledEnd(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm w-64"
            />
            <div className="text-xs text-gray-500 mt-1">Optional: when the quiz window ends (overrides timeLimit for global end).</div>
          </div>
        </div>

        {questions.map((q, qi) => (
          <div key={qi} className="mb-4 border-b pb-3">
            <input
              placeholder={`Question ${qi + 1}`}
              value={q.questionText}
              onChange={(e) => handleQuestionChange(qi, e.target.value)}
              className="w-full mb-2 px-3 py-2 border rounded-md text-sm"
              required
            />
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2 mb-1">
                <input
                  type="radio"
                  name={`correct-${qi}`}
                  value={oi}
                  checked={q.correctOption === oi}
                  onChange={(e) => handleCorrectOptionChange(qi, e.target.value)}
                />
                <input
                  placeholder={`Option ${oi + 1}`}
                  value={opt}
                  onChange={(e) => handleOptionChange(qi, oi, e.target.value)}
                  className="flex-grow px-2 py-1 border rounded-md text-sm"
                  required
                />
              </div>
            ))}
          </div>
        ))}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={addQuestion}
            className="bg-gray-200 px-3 py-1 rounded-md text-sm hover:bg-gray-300"
          >
            + Add Question
          </button>
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
          >
            Create Quiz
          </button>
        </div>
      </form>
    </div>
  );
}