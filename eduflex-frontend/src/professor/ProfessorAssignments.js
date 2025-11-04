// src/professor/ProfessorAssignments.js
import React, { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import { toast } from "react-toastify";

export default function ProfessorAssignments() {
  const {
    user,
    loading: contextLoading,
    getProfessorAssignments,
    getSubmissionsForAssignment,
    gradeSubmission,
    getMyProfessorCourses,
  } = useApp();

  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [gradeInputs, setGradeInputs] = useState({});
  const [feedbackInputs, setFeedbackInputs] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all assignments for professor on mount
  useEffect(() => {
    const fetchAllAssignments = async () => {
      setIsLoading(true);
      try {
        const courses = await getMyProfessorCourses();
        const allAssignments = [];
        for (const c of courses) {
          const courseAssignments = await getProfessorAssignments(c._id);
          (courseAssignments || []).forEach(a => allAssignments.push({ ...a, courseTitle: c.title }));
        }
        setAssignments(allAssignments);
      } catch (err) {
        toast.error("Failed to load assignments.");
      } finally {
        setIsLoading(false);
      }
    };
    if (!contextLoading && user) fetchAllAssignments();
  }, [user, contextLoading, getProfessorAssignments, getMyProfessorCourses]);

  // Fetch submissions for selected assignment
  useEffect(() => {
    const fetchSubs = async () => {
      if (!selectedAssignment) return;
      setSubmissionsLoading(true);
      try {
        const subs = await getSubmissionsForAssignment(selectedAssignment._id);
        setSubmissions(subs || []);
      } catch {
        toast.error("Failed to load submissions.");
      } finally {
        setSubmissionsLoading(false);
      }
    };
    fetchSubs();
  }, [selectedAssignment, getSubmissionsForAssignment]);

  const openAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setGradeInputs({});
    setFeedbackInputs({});
  };

  const handleGradeChange = (studentId, value) => {
    setGradeInputs(prev => ({ ...prev, [studentId]: value }));
  };
  const handleFeedbackChange = (studentId, value) => {
    setFeedbackInputs(prev => ({ ...prev, [studentId]: value }));
  };

  const handleGradeSubmit = async (assignmentId, studentId) => {
    const grade = gradeInputs[studentId];
    const feedback = feedbackInputs[studentId] || "";
    if (grade === undefined || grade === "") {
      toast.warning("Grade required");
      return;
    }
    try {
      await gradeSubmission(assignmentId, studentId, { grade, feedback });
      toast.success("Submission graded!");
      // Refresh submissions
      const refreshed = await getSubmissionsForAssignment(assignmentId);
      setSubmissions(refreshed || []);
      setGradeInputs(prev => ({ ...prev, [studentId]: "" }));
      setFeedbackInputs(prev => ({ ...prev, [studentId]: "" }));
    } catch {
      toast.error("Failed to submit grade.");
    }
  };

  if (isLoading || contextLoading) {
    return <div className="flex items-center justify-center h-80 text-lg">Loading assignments...</div>;
  }

  return (
    <div className="p-8 pl-24 min-h-screen">
      <h2 className="text-2xl font-bold mb-6">Assignments - Grading</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
        <div>
          <h3 className="text-lg mb-3 font-bold">All Assignments</h3>
          <div className="space-y-4">
            {assignments.length === 0 && (
              <div className="text-gray-400">No assignments found.</div>
            )}
            {assignments.map(a => (
              <div
                key={a._id}
                className={`p-4 rounded border ${selectedAssignment && selectedAssignment._id === a._id
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 bg-white"} cursor-pointer hover:border-green-400 transition`}
                onClick={() => openAssignment(a)}
              >
                <div className="text-green-700 font-bold">{a.title}</div>
                <div className="text-sm text-gray-500">
                  {a.courseTitle} | Due: {a.due ? new Date(a.due).toLocaleDateString() : "N/A"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submissions Panel */}
        <div>
          <h3 className="text-lg mb-3 font-bold">
            Submissions {selectedAssignment ? `for "${selectedAssignment.title}"` : ""}
          </h3>
          {!selectedAssignment && (
            <div className="text-gray-400 p-4">Select an assignment to view submissions.</div>
          )}
          {selectedAssignment && submissionsLoading && (
            <div className="p-6 text-center">Loading submissions...</div>
          )}
          {selectedAssignment && !submissionsLoading && (
            <div>
              {submissions.length === 0 && (
                <div className="text-gray-400 p-4">No submissions yet.</div>
              )}
              <div className="space-y-4">
                {submissions.map(sub => (
                  <div
                    key={sub.studentId}
                    className="bg-gray-50 rounded px-4 py-3 border border-gray-200"
                  >
                    <div className="font-semibold text-gray-700 mb-2">
                      Student ID: {sub.studentId}
                    </div>
                    <div className="mb-2 text-gray-600">
                      <span className="mr-2 font-semibold">Submission:</span>
                      {sub.fileUrl ? (
                        <a
                          href={sub.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 underline"
                        >View File</a>
                      ) : (sub.text || "No submission text/file.")}
                    </div>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        className="p-1 border rounded"
                        value={gradeInputs[sub.studentId] ?? sub.grade ?? ""}
                        onChange={e => handleGradeChange(sub.studentId, e.target.value)}
                        placeholder="Grade (%)"
                      />
                      <input
                        type="text"
                        className="p-1 border rounded flex-1"
                        value={feedbackInputs[sub.studentId] ?? sub.feedback ?? ""}
                        onChange={e => handleFeedbackChange(sub.studentId, e.target.value)}
                        placeholder="Feedback (optional)"
                      />
                      <button
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                        onClick={() => handleGradeSubmit(selectedAssignment._id, sub.studentId)}
                      >
                        Submit Grade
                      </button>
                    </div>
                    {sub.grade && (
                      <div className="text-xs text-green-700">
                        Graded: <b>{sub.grade}%</b>{" "}
                        {sub.feedback && <em>- "{sub.feedback}"</em>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
