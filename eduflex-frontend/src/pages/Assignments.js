import React, { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import { toast } from "react-toastify";

function Assignments() {
  const {
    user,
    getMyGrades,             // API: get student's assignments + grades
    submitAssignment,        // API: submit/turn in assignment
  } = useApp();

  const [assignments, setAssignments] = useState([]);
  const [filter, setFilter] = useState("all"); // all, pending, submitted, graded
  const [sortBy, setSortBy] = useState("latest"); // latest, earliest, title, status
  const [selectedFile, setSelectedFile] = useState({});
  const [submissionText, setSubmissionText] = useState({});
  const [loadingState, setLoadingState] = useState({ page: true, submitting: {} });

  useEffect(() => {
    const fetchMyAssignments = async () => {
      setLoadingState(s => ({ ...s, page: true }));
      try {
        const fetchedData = await getMyGrades();
        const processed = (fetchedData || []).map(item => ({
          ...item,
          id: item.assignmentId || item.id,
          title: item.assignmentTitle || item.title,
          status: item.grade ? 'graded' : (item.submitted ? 'submitted' : 'pending'),
          due: item.dueDate || item.due || 'N/A',
        }));
        setAssignments(processed);
      } catch (error) {
        toast.error("Failed to fetch assignments.");
      } finally {
        setLoadingState(s => ({ ...s, page: false }));
      }
    };
    if (user) fetchMyAssignments();
  }, [user, getMyGrades]);

  // Sort logic
  const sortAssignments = arr => {
    let sorted = [...arr];
    if (sortBy === "latest" || sortBy === "earliest") {
      sorted.sort((a, b) => {
        const aTime = a.due && Date.parse(a.due) ? new Date(a.due) : new Date(0);
        const bTime = b.due && Date.parse(b.due) ? new Date(b.due) : new Date(0);
        return sortBy === "latest"
          ? bTime - aTime // latest first
          : aTime - bTime;
      });
    } else if (sortBy === "title") {
      sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sortBy === "status") {
      // Graded > Submitted > Pending
      const order = { graded: 1, submitted: 2, pending: 3 };
      sorted.sort((a, b) => (order[a.status] || 4) - (order[b.status] || 4));
    }
    return sorted;
  };

  // Filter logic
  const filteredAssignments = sortAssignments(
    assignments.filter(assignment => {
      if (filter === "all") return true;
      return assignment.status === filter;
    })
  );

  // File and text handlers
  const handleFileChange = (assignmentId, file) => {
    setSelectedFile(prev => ({ ...prev, [assignmentId]: file }));
  };
  const handleTextChange = (assignmentId, text) => {
    setSubmissionText(prev => ({ ...prev, [assignmentId]: text }));
  };

  // Submission
  const handleSubmit = async (assignmentId) => {
    const file = selectedFile[assignmentId];
    const text = submissionText[assignmentId]?.trim();

    if (!file && !text) {
      toast.warning('Please add a file or text before submitting.');
      return;
    }
    setLoadingState(s => ({
      ...s,
      submitting: { ...s.submitting, [assignmentId]: true }
    }));

    try {
      let submissionData;
      if (file) {
        submissionData = new FormData();
        submissionData.append('file', file);
        if (text) submissionData.append('textSubmission', text);
      } else {
        submissionData = { submission: text };
      }
      await submitAssignment(assignmentId, submissionData);

      setSelectedFile(prev => ({ ...prev, [assignmentId]: null }));
      setSubmissionText(prev => ({ ...prev, [assignmentId]: "" }));

      setAssignments(prev =>
        prev.map(a =>
          a.id === assignmentId ? { ...a, status: 'submitted', submitted: true } : a
        )
      );
      toast.success('Assignment submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit assignment.');
    } finally {
      setLoadingState(s => ({
        ...s,
        submitting: { ...s.submitting, [assignmentId]: false }
      }));
    }
  };

  if (loadingState.page) {
    return (
      <div className="flex items-center justify-center h-96 text-lg">
        Loading assignments...
      </div>
    );
  }

  return (
    <div className="p-8 pl-24 min-h-screen">
      <h1 className="text-3xl font-bold mb-2">My Assignments</h1>
      <p className="text-gray-600 mb-6">Submit your assignments and track your progress.</p>

      {/* Filters & Sorting */}
      <div className="flex flex-wrap gap-2 mb-8 items-center">
        {["all", "pending", "submitted", "graded"].map(opt => (
          <button
            key={opt}
            className={`px-4 py-2 rounded ${filter === opt
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-800"}`}
            onClick={() => setFilter(opt)}
          >
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </button>
        ))}
        <span className="ml-3 font-medium">Sort by:</span>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="ml-1 px-3 py-1 rounded border border-gray-300"
        >
          <option value="latest">Latest Deadline</option>
          <option value="earliest">Earliest Deadline</option>
          <option value="title">Title (A-Z)</option>
          <option value="status">Status</option>
        </select>
      </div>

      {/* Assignments List */}
      <div className="space-y-6">
        {filteredAssignments.length > 0 ? (
          filteredAssignments.map(assignment => (
            <div
              key={assignment.id}
              className={`bg-white p-6 rounded-lg shadow-md border-l-4
                ${assignment.status === 'graded' ? 'border-green-500' :
                  assignment.status === 'submitted' ? 'border-blue-500' : 'border-yellow-500'}`}
            >
              {/* Assignment Header */}
              <div className="flex flex-wrap justify-between items-start mb-4 gap-4">
                <div>
                  <h3 className="text-xl font-semibold mb-1">{assignment.title}</h3>
                  <p className="text-gray-500 mb-1">
                    <strong>Course:</strong> {assignment.course || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">
                    <strong>Due:</strong> {assignment.due ? new Date(assignment.due).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium text-white
                    ${assignment.status === 'graded' ? 'bg-green-500' :
                      assignment.status === 'submitted' ? 'bg-blue-500' : 'bg-yellow-500'}`}>
                    {assignment.status.toUpperCase()}
                  </span>
                  {assignment.status === 'graded' && assignment.grade && (
                    <div className="mt-2 text-lg font-bold text-green-600">
                      Grade: {assignment.grade}
                    </div>
                  )}
                </div>
              </div>

              {/* Submission form for pending assignments */}
              {assignment.status === 'pending' && (
                <div className="bg-gray-50 p-4 rounded border border-gray-200 mt-4">
                  <h4 className="font-semibold mb-3 text-gray-700">Submit Assignment</h4>
                  <div className="mb-4">
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Upload File (optional)
                    </label>
                    <input
                      type="file"
                      onChange={e => handleFileChange(assignment.id, e.target.files[0])}
                      className="block w-full text-sm text-gray-500"
                      accept=".pdf,.doc,.docx,.txt,.zip"
                      disabled={!!loadingState.submitting[assignment.id]}
                    />
                    {selectedFile[assignment.id] && (
                      <div className="mt-2 text-xs text-gray-700">
                        {selectedFile[assignment.id].name}
                        <button
                          type="button"
                          className="ml-3 text-red-600 text-xs"
                          onClick={() => handleFileChange(assignment.id, null)}
                        >Remove</button>
                      </div>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Text Submission (optional)
                    </label>
                    <textarea
                      value={submissionText[assignment.id] || ''}
                      onChange={e => handleTextChange(assignment.id, e.target.value)}
                      placeholder="Write your submission here..."
                      rows={4}
                      className="block w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-vertical disabled:bg-gray-100"
                      disabled={!!loadingState.submitting[assignment.id]}
                    />
                  </div>
                  <button
                    onClick={() => handleSubmit(assignment.id)}
                    disabled={!!loadingState.submitting[assignment.id]}
                    className="px-5 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition duration-200 disabled:opacity-50"
                  >
                    {loadingState.submitting[assignment.id] ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              )}

              {/* If submitted/graded, show summary */}
              {(assignment.status === 'submitted' || assignment.status === 'graded') && (
                <div className={`mt-4 p-4 rounded border
                  ${assignment.status === 'graded' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                  <h4 className="font-semibold mb-2 text-gray-700">Your Submission:</h4>
                  <p className="text-sm text-gray-600">
                    {/* Display text/file from real backend data here */}
                    Submission summary (from backend) appears here.
                  </p>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center col-span-full">No assignments found for this filter.</p>
        )}
      </div>
    </div>
  );
}

export default Assignments;
