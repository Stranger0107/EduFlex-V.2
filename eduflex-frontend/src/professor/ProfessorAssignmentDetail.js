import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "../contexts/AppContext";
import { toast } from "react-toastify";
import { API_BASE_URL, API_HOST } from "../config/api";

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
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [gradingState, setGradingState] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const selectedAssignment = useMemo(
    () => assignments.find((a) => a._id === selectedAssignmentId) || null,
    [assignments, selectedAssignmentId]
  );

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

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedAssignment) return;

      try {
        const courseId =
          typeof selectedAssignment.course === "object"
            ? selectedAssignment.course._id
            : selectedAssignment.course;

        const courseData = await fetchProfessorCourseById(courseId);
        const students = courseData?.students || [];
        setEnrolledStudents(students);

        const initialGrading = {};
        students.forEach((stu) => {
          const sId = String(stu._id || stu.id);
          const sub = selectedAssignment.submissions?.find(
            (s) => String(s.student?._id || s.student) === sId
          );
          if (sub) {
            initialGrading[sId] = {
              grade: sub.grade ?? "",
              feedback: sub.feedback ?? "",
            };
          }
        });
        setGradingState(initialGrading);
      } catch (error) {
        console.error("Error loading course details:", error);
        toast.error("Failed to load student list.");
      }
    };

    loadStudents();
  }, [selectedAssignmentId, selectedAssignment, fetchProfessorCourseById]);

  const handleInput = (studentId, key, value) => {
    setGradingState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [key]: value,
      },
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

  const handleRefresh = () => loadData();

  if (isLoading && assignments.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-lg">
        Loading assignments...
      </div>
    );
  }

  return (
    <div className="p-8 pl-24 min-h-screen flex flex-col md:flex-row gap-6">

      {/* LEFT PANEL */}
      <div className="w-full md:w-1/3 flex flex-col h-[calc(100vh-100px)]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Assignments</h2>
          <button
            onClick={handleRefresh}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
          >
            Refresh
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto pr-2 flex-1">
          {assignments.length === 0 && (
            <div className="text-gray-400 italic">No assignments found.</div>
          )}

          {assignments.map((a) => (
            <div
              key={a._id}
              className={`p-4 rounded-lg border shadow-sm cursor-pointer 
                ${selectedAssignmentId === a._id
                  ? "border-green-500 bg-green-50 ring-1 ring-green-500"
                  : "border-gray-200 bg-white hover:border-green-300 hover:shadow-md"
                }`}
              onClick={() => setSelectedAssignmentId(a._id)}
            >
              <div className="font-bold text-gray-800">{a.title}</div>
              <div className="text-xs text-gray-500 mt-1">
                Course: {typeof a.course === "object" ? a.course.title : "..."}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "N/A"}
              </div>

              <div className="mt-3 flex gap-2 text-xs">
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
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
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <p>Select an assignment from the left to view submissions and grade.</p>
          </div>
        ) : (
          <>
            {/* Assignment Header */}
            <div className="border-b pb-4 mb-4">
              <h2 className="text-2xl font-bold text-gray-800">{selectedAssignment.title}</h2>
              <p className="text-gray-600 mt-1">{selectedAssignment.description}</p>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-bold">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold">Submission</th>
                    <th className="px-4 py-3 text-left text-xs font-bold">Submitted</th>
                    <th className="px-4 py-3 text-center text-xs font-bold">Grade</th>
                    <th className="px-4 py-3 text-left text-xs font-bold">Feedback</th>
                    <th className="px-4 py-3 text-center text-xs font-bold">Action</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {enrolledStudents.map((stu) => {
                    const studentId = String(stu._id || stu.id);
                    const submission = selectedAssignment.submissions?.find(
                      (s) => String(s.student?._id || s.student) === studentId
                    );

                    const isSubmitted = !!submission;
                    const isGraded = submission && submission.grade != null;

                    return (
                      <tr key={studentId}>
                        {/* Student */}
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium">{stu.name}</div>
                          <div className="text-xs text-gray-500">{stu.email}</div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          {isGraded ? (
                            <span className="badge bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Graded
                            </span>
                          ) : isSubmitted ? (
                            <span className="badge bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              Submitted
                            </span>
                          ) : (
                            <span className="badge bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                              Pending
                            </span>
                          )}
                        </td>

                        {/* Submission File */}
                        <td className="px-4 py-3">
                          {isSubmitted ? (
                            submission.filePath ? (
                              <a
                                href={submission.filePath.startsWith('http') ? submission.filePath : `${API_HOST}${submission.filePath}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1"
                              >
                                📄 View File
                              </a>
                            ) : submission.submission ? (
                              <span>{submission.submission}</span>
                            ) : (
                              <span className="text-gray-400 italic">No File</span>
                            )
                          ) : (
                            <span className="text-gray-400 italic">---</span>
                          )}
                        </td>

                        {/* Submitted (timestamp + late badge) */}
                        <td className="px-4 py-3">
                          {isSubmitted ? (
                            <div className="text-xs text-gray-500">
                              {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : '—'}
                              {submission.isLate ? (
                                <span className="ml-3 inline-block px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-semibold">Late</span>
                              ) : (
                                <span className="ml-3 inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-semibold">On time</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">---</span>
                          )}
                        </td>

                        {/* Grade */}
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            disabled={!isSubmitted}
                            className="w-16 text-center border px-2 py-1 rounded"
                            value={gradingState[studentId]?.grade || ""}
                            onChange={(e) => handleInput(studentId, "grade", e.target.value)}
                          />
                        </td>

                        {/* Feedback */}
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            disabled={!isSubmitted}
                            className="w-full border px-2 py-1 rounded"
                            value={gradingState[studentId]?.feedback || ""}
                            onChange={(e) => handleInput(studentId, "feedback", e.target.value)}
                          />
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleGrade(studentId)}
                            disabled={!isSubmitted}
                            className={`px-3 py-1 text-sm rounded text-white ${
                              isSubmitted
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-gray-300 cursor-not-allowed"
                            }`}
                          >
                            {isGraded ? "Update" : "Save"}
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
