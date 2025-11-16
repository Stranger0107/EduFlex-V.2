import React, { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../config/api";

function Assignments() {
  const {
    user,
    fetchStudentAssignments,
    submitAssignment,
  } = useApp();

  const [assignments, setAssignments] = useState([]);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");

  const [selectedFile, setSelectedFile] = useState({});
  const [submissionText, setSubmissionText] = useState({});
  const [editing, setEditing] = useState({});              // ⭐ NEW
  const [loadingState, setLoadingState] = useState({ page: true, submitting: {} });

  useEffect(() => {
    const fetchMyAssignments = async () => {
      setLoadingState(s => ({ ...s, page: true }));
      try {
        const fetchedData = await fetchStudentAssignments();
        const processed = (fetchedData || []).map(item => {
          let courseTitle = 'N/A';
          if (item.course) {
            if (typeof item.course === 'object' && item.course.title) {
              courseTitle = item.course.title;
            } else if (typeof item.course === 'string') {
              courseTitle = item.course;
            }
          }

          return {
            ...item,
            id: item.assignmentId || item._id,
            title: item.title || item.assignmentTitle,
            status: item.status || 'pending',
            course: courseTitle,
            due: item.dueDate || item.due || 'N/A',
            attachmentUrl: item.attachmentUrl || null,
          };
        });
        setAssignments(processed);
      } catch (error) {
        console.error("Assignment fetch error:", error);
        toast.error("Failed to fetch assignments.");
      } finally {
        setLoadingState(s => ({ ...s, page: false }));
      }
    };
    if (user) fetchMyAssignments();
  }, [user, fetchStudentAssignments]);

  const sortAssignments = arr => {
    let sorted = [...arr];
    if (sortBy === "latest" || sortBy === "earliest") {
      sorted.sort((a, b) => {
        const aTime = a.due && Date.parse(a.due) ? new Date(a.due) : new Date(0);
        const bTime = b.due && Date.parse(b.due) ? new Date(b.due) : new Date(0);
        return sortBy === "latest" ? bTime - aTime : aTime - bTime;
      });
    } else if (sortBy === "title") {
      sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sortBy === "status") {
      const order = { graded: 1, submitted: 2, pending: 3 };
      sorted.sort((a, b) => (order[a.status] || 4) - (order[b.status] || 4));
    }
    return sorted;
  };

  const filteredAssignments = sortAssignments(
    assignments.filter(a => filter === "all" || a.status === filter)
  );

  const handleFileChange = (id, file) => {
    setSelectedFile(prev => ({ ...prev, [id]: file }));
  };

  const handleTextChange = (id, text) => {
    setSubmissionText(prev => ({ ...prev, [id]: text }));
  };

  // ================================
  // ⭐ Submit (works for edit too)
  // ================================
  const handleSubmit = async (assignmentId) => {
    const file = selectedFile[assignmentId];
    const text = (submissionText[assignmentId] || "").trim();

    if (!file && !text) {
      toast.warning('Please add a file or text before submitting.');
      return;
    }

    setLoadingState(s => ({
      ...s,
      submitting: { ...s.submitting, [assignmentId]: true }
    }));

    try {
      const formData = new FormData();
      if (file instanceof File) {
        formData.append("file", file);
      }
      if (text) {
        formData.append("text", text);
      }

      await submitAssignment(assignmentId, formData);

      // update UI
      setAssignments(prev =>
        prev.map(a =>
          a.id === assignmentId
            ? {
                ...a,
                status: "submitted",
                submission: file ? file.name : text,
              }
            : a
        )
      );

      setEditing(prev => ({ ...prev, [assignmentId]: false }));
      setSelectedFile(prev => ({ ...prev, [assignmentId]: null }));
      setSubmissionText(prev => ({ ...prev, [assignmentId]: "" }));

    } catch (error) {
      console.error("Submit error:", error);
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
      <p className="text-gray-600 mb-6">Submit or edit your assignments.</p>

      {/* filter + sort */}
      <div className="flex flex-wrap gap-2 mb-8 items-center">
        {["all", "pending", "submitted", "graded"].map(opt => (
          <button
            key={opt}
            className={`px-4 py-2 rounded ${
              filter === opt ? "bg-green-600 text-white" : "bg-gray-200 text-gray-800"
            }`}
            onClick={() => setFilter(opt)}
          >
            {opt.toUpperCase()}
          </button>
        ))}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="ml-3 px-3 py-1 rounded border"
        >
          <option value="latest">Latest Deadline</option>
          <option value="earliest">Earliest Deadline</option>
          <option value="title">Title (A-Z)</option>
          <option value="status">Status</option>
        </select>
      </div>

      {/* assignment cards */}
      <div className="space-y-6">
        {filteredAssignments.map(a => (
          <div
            key={a.id}
            className="bg-white p-6 rounded-lg shadow border-l-4"
          >
            <div className="flex justify-between mb-3">
              <div>
                <h3 className="text-xl font-semibold">{a.title}</h3>
                <p className="text-sm text-gray-500">
                  Course: {a.course}
                </p>
                <p className="text-sm text-gray-500">
                  Due: {a.due ? new Date(a.due).toLocaleDateString() : "N/A"}
                </p>
              </div>

              <span className={`px-3 py-1 h-fit rounded text-white ${
                a.status === "graded"
                  ? "bg-green-500"
                  : a.status === "submitted"
                  ? "bg-blue-500"
                  : "bg-yellow-500"
              }`}>
                {a.status.toUpperCase()}
              </span>
            </div>

            {/* show professor attachment */}
            {a.attachmentUrl && (
              <a
                href={a.attachmentUrl.startsWith("http") ? a.attachmentUrl : `${API_BASE_URL}${a.attachmentUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 underline"
              >
                View Assignment Attachment
              </a>
            )}

            <p className="mt-3">{a.description}</p>

            {/* ========================= */}
            {/* ⭐ EDIT OR SUBMIT AREA   */}
            {/* ========================= */}

            {/* PENDING → show submit UI */}
            {a.status === "pending" && !editing[a.id] && (
              <SubmitBox
                a={a}
                selectedFile={selectedFile}
                submissionText={submissionText}
                loadingState={loadingState}
                handleFileChange={handleFileChange}
                handleTextChange={handleTextChange}
                handleSubmit={handleSubmit}
              />
            )}

            {/* SUBMITTED or GRADED → show submission + Edit button */}
            {(a.status === "submitted" || a.status === "graded") && !editing[a.id] && (
              <div className="mt-5 p-4 bg-blue-50 border rounded">
                <h4 className="font-semibold mb-2">Your Submission:</h4>

                {a.submission ? (
                  a.submission.includes("/uploads/") ? (
                    <a
                      href={a.submission.startsWith("http") ? a.submission : `${API_BASE_URL}${a.submission}`}
                      target="_blank"
                      className="text-blue-600 underline"
                    >
                      View Submitted File
                    </a>
                  ) : (
                    <p>{a.submission}</p>
                  )
                ) : (
                  <p className="italic text-gray-500">No submission found.</p>
                )}

                {/* Edit Button */}
                <button
                  className="mt-3 px-4 py-2 bg-green-600 text-white rounded"
                  onClick={() => setEditing(prev => ({ ...prev, [a.id]: true }))}
                >
                  Edit Submission
                </button>
              </div>
            )}

            {/* ========================= */}
            {/* ⭐ EDIT MODE UI          */}
            {/* ========================= */}
            {editing[a.id] && (
              <EditBox
                a={a}
                selectedFile={selectedFile}
                submissionText={submissionText}
                loadingState={loadingState}
                handleFileChange={handleFileChange}
                handleTextChange={handleTextChange}
                handleSubmit={handleSubmit}
                setEditing={setEditing}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


/* ----------------------------
   SUBMIT UI (NEW SUBMISSION)
-----------------------------*/
function SubmitBox({ a, selectedFile, submissionText, handleFileChange, handleTextChange, handleSubmit, loadingState }) {
  return (
    <div className="mt-5 p-4 bg-gray-50 border rounded">
      <h4 className="font-semibold mb-2">Submit Assignment</h4>

      <input
        type="file"
        className="mb-3 block"
        accept=".pdf,.doc,.docx,.txt,.zip,.jpg,.png"
        onChange={e => handleFileChange(a.id, e.target.files[0])}
        disabled={loadingState.submitting[a.id]}
      />

      <textarea
        rows={4}
        placeholder="Text submission..."
        className="w-full p-2 border rounded"
        value={submissionText[a.id] || ""}
        onChange={e => handleTextChange(a.id, e.target.value)}
        disabled={loadingState.submitting[a.id]}
      ></textarea>

      <button
        onClick={() => handleSubmit(a.id)}
        className="mt-3 px-5 py-2 bg-green-600 text-white rounded"
        disabled={loadingState.submitting[a.id]}
      >
        {loadingState.submitting[a.id] ? "Submitting..." : "Submit"}
      </button>
    </div>
  );
}

/* ----------------------------
   EDIT MODE UI (RESUBMISSION)
-----------------------------*/
function EditBox({ a, selectedFile, submissionText, handleFileChange, handleTextChange, handleSubmit, loadingState, setEditing }) {
  return (
    <div className="mt-5 p-4 bg-yellow-50 border rounded">
      <h4 className="font-semibold mb-2">Edit Submission</h4>

      <p className="text-xs text-gray-500 mb-2">Your previous submission will be overwritten.</p>

      {/* File upload */}
      <input
        type="file"
        className="mb-3 block"
        accept=".pdf,.doc,.docx,.txt,.zip,.jpg,.png"
        onChange={e => handleFileChange(a.id, e.target.files[0])}
        disabled={loadingState.submitting[a.id]}
      />

      {/* Text area */}
      <textarea
        rows={4}
        placeholder="Update text submission..."
        className="w-full p-2 border rounded"
        value={submissionText[a.id] || ""}
        onChange={e => handleTextChange(a.id, e.target.value)}
        disabled={loadingState.submitting[a.id]}
      ></textarea>

      {/* Buttons */}
      <div className="flex gap-3 mt-3">
        <button
          onClick={() => handleSubmit(a.id)}
          className="px-5 py-2 bg-blue-600 text-white rounded"
          disabled={loadingState.submitting[a.id]}
        >
          {loadingState.submitting[a.id] ? "Saving..." : "Save Changes"}
        </button>

        <button
          onClick={() => setEditing(prev => ({ ...prev, [a.id]: false }))}
          className="px-5 py-2 bg-gray-400 text-white rounded"
          disabled={loadingState.submitting[a.id]}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default Assignments;
