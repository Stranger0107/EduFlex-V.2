import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "../contexts/AppContext";
import { toast } from "react-toastify";
import { API_BASE_URL, API_HOST } from "../config/api";

// Helper to safely extract an ID string
const getStudentId = (student) => {
  if (!student) return null;
  if (typeof student === 'string') return student;
  return String(student._id || student.id);
};

export default function ProfessorAssignments() {
  const {
    user,
    authLoading: contextLoading,
    fetchProfessorAssignments,
    fetchProfessorCourseById,
    gradeSubmission,
  } = useApp();

  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [displayStudents, setDisplayStudents] = useState([]);
  const [gradingState, setGradingState] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const selectedAssignment = useMemo(
    () => assignments.find((a) => a._id === selectedAssignmentId) || null,
    [assignments, selectedAssignmentId]
  );

  // Load assignments
  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchProfessorAssignments();
      setAssignments(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load assignments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!contextLoading && user) loadData();
  }, [user, contextLoading]);

  // Prepare enrolled + submitted students
  useEffect(() => {
    const prepareView = async () => {
      if (!selectedAssignment) return;

      const studentMap = new Map();

      // A. Fetch enrolled students
      try {
        const courseId =
          typeof selectedAssignment.course === "object"
            ? selectedAssignment.course._id
            : selectedAssignment.course;

        if (courseId) {
          const courseData = await fetchProfessorCourseById(courseId);
          const enrolled = courseData?.students || [];

          enrolled.forEach(stu => {
            const id = getStudentId(stu);
            if (id) {
              const studentObj = typeof stu === 'string'
                ? { _id: id, name: "Loading...", email: "..." }
                : { ...stu, _id: id };

              studentMap.set(id, studentObj);
            }
          });
        }
      } catch (error) {
        console.error("Error fetching students", error);
      }

      // B. Merge submissions
      if (selectedAssignment.submissions) {
        selectedAssignment.submissions.forEach(sub => {
          const stu = sub.student;
          const id = getStudentId(stu);
          if (id && !studentMap.has(id)) {
            studentMap.set(id, { _id: id, name: "Unknown Student", email: "N/A" });
          }
        });
      }

      const allStudents = Array.from(studentMap.values());
      setDisplayStudents(allStudents);

      // C. Pre-fill grading fields
      const initialGrading = {};
      allStudents.forEach((stu) => {
        const sId = stu._id;
        const sub = selectedAssignment.submissions?.find(
          s => getStudentId(s.student) === sId
        );
        if (sub) {
          initialGrading[sId] = {
            grade: sub.grade ?? "",
            feedback: sub.feedback ?? "",
          };
        }
      });
      setGradingState(initialGrading);
    };

    prepareView();
  }, [selectedAssignment, fetchProfessorCourseById]);

  const handleInput = (studentId, key, value) => {
    setGradingState((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [key]: value },
    }));
  };

  const handleGrade = async (studentId) => {
    const state = gradingState[studentId] || {};
    const grade = state.grade;
    const feedback = state.feedback;

    if (grade === "" || grade === undefined) {
      toast.warning("Please enter a grade.");
      return;
    }

    const success = await gradeSubmission(
      selectedAssignment._id,
      studentId,
      { grade: Number(grade), feedback }
    );

    if (success) {
      await loadData();
      toast.success("Grade saved!");
    }
  };

  const handleRefresh = (e) => {
    e.stopPropagation();
    loadData();
  };

  if (isLoading && assignments.length === 0) {
    return <div className="flex items-center justify-center h-80 text-lg">Loading assignments...</div>;
  }

  return (
    <div className="p-8 pl-24 min-h-screen flex flex-col md:flex-row gap-6">

      {/* LEFT PANEL */}
      <div className="w-full md:w-1/3 flex flex-col h-[calc(100vh-100px)]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Assignments</h2>
          <button onClick={handleRefresh} className="text-sm text-blue-600 hover:underline">
            Refresh
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto pr-2 flex-1">
          {assignments.map((a) => (
            <div
              key={a._id}
              className={`p-4 rounded-lg border shadow-sm cursor-pointer transition-all 
                ${
                  selectedAssignmentId === a._id 
                    ? "border-green-500 bg-green-50 ring-1 ring-green-500" 
                    : "border-gray-200 bg-white hover:border-green-300"
                }`}
              onClick={() => setSelectedAssignmentId(a._id)}
            >
              <div className="font-bold text-gray-800">{a.title}</div>
              <div className="text-xs text-gray-500 mt-1">
                {typeof a.course === "object" ? a.course.title : "Course"}
              </div>

              <div className="mt-2 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "N/A"}
                </span>
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium">
                  {a.submissions?.length || 0} Subs
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full md:w-2/3 bg-white rounded-lg border border-gray-200 shadow-sm p-6 h-[calc(100vh-100px)] overflow-y-auto">
        
        {!selectedAssignment ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            Select an assignment to grade.
          </div>
        ) : (
          <>
            {/* Assignment Header */}
            <div className="border-b pb-4 mb-4">
              <h2 className="text-2xl font-bold text-gray-800">{selectedAssignment.title}</h2>

              <div className="mt-2 flex gap-4 text-sm text-gray-500">
                <span>Due: {new Date(selectedAssignment.dueDate).toLocaleDateString()}</span>
                <span>Total Students: {displayStudents.length}</span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Submission</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Grade</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Feedback</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {displayStudents.map((stu, index) => {
                    const studentId = stu._id || `temp-${index}`;

                    const submission = selectedAssignment.submissions?.find(
                      (s) => getStudentId(s.student) === studentId
                    );

                    const isSubmitted = !!submission;
                    const isGraded = submission && submission.grade !== null && submission.grade !== undefined;

                    return (
                      <tr key={studentId} className="hover:bg-gray-50">
                        
                        {/* Student Name */}
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{stu.name}</div>
                          <div className="text-xs text-gray-500">{stu.email}</div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          {isGraded ? (
                            <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">
                              Graded
                            </span>
                          ) : isSubmitted ? (
                            <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                              Submitted
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-500 rounded">
                              Pending
                            </span>
                          )}
                        </td>

                        {/* FILE VIEWER (FIXED) */}
                        <td className="px-4 py-3">
                            {isSubmitted ? (
                            <a
                              href={
                                submission.submission.startsWith("http")
                                  ? submission.submission
                                  : `${API_HOST}${submission.submission}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              📄 View Submission
                            </a>
                          ) : (
                            <span className="text-gray-300 italic">---</span>
                          )}
                        </td>

                        {/* Grade */}
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            disabled={!isSubmitted}
                            value={gradingState[studentId]?.grade || ""}
                            onChange={(e) => handleInput(studentId, "grade", e.target.value)}
                            className="w-16 border rounded px-2 py-1 text-center disabled:bg-gray-100"
                          />
                        </td>

                        {/* Feedback */}
                        <td className="px-4 py-3">
                          <input
                            disabled={!isSubmitted}
                            type="text"
                            placeholder="Feedback..."
                            value={gradingState[studentId]?.feedback || ""}
                            onChange={(e) => handleInput(studentId, "feedback", e.target.value)}
                            className="w-full border rounded px-2 py-1 text-sm disabled:bg-gray-100"
                          />
                        </td>

                        {/* Save Button */}
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleGrade(studentId)}
                            disabled={!isSubmitted}
                            className={`px-3 py-1.5 text-xs rounded text-white 
                              ${
                                isSubmitted
                                  ? "bg-green-600 hover:bg-green-700"
                                  : "bg-gray-300 cursor-not-allowed"
                              }`}
                          >
                            Save
                          </button>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>

              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
