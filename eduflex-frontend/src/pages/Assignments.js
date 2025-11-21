import React, { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import { toast } from "react-toastify";
import { API_BASE_URL, API_HOST } from "../config/api";

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

  // Helper: ensure file link goes to backend host if needed
  const makeFileUrl = (filePath) => {
    if (!filePath) return null;
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;
    if (filePath.startsWith(window.location.origin)) return filePath;
    return filePath.startsWith('http') ? filePath : `${API_HOST}${filePath}`;
  };

  useEffect(() => {
    const fetchMyAssignments = async () => {
      setLoadingState(s => ({ ...s, page: true }));
      try {
        const fetchedData = await fetchStudentAssignments();

        // Normalize server shapes into a consistent UI-friendly shape
        const processed = (fetchedData || []).map(item => {
          let courseTitle = 'N/A';
          if (item.course) {
            if (typeof item.course === 'object' && item.course.title) {
              courseTitle = item.course.title;
            } else if (typeof item.course === 'string') {
              courseTitle = item.course;
            }
          }

          // Determine submission object (server may send different shapes)
          // Prefer explicit filePath/submittedAt/isLate fields if present
          let submissionObj = null;

          // If backend returns /assignments/mine-style objects (single submission per item)
          if (item.filePath || item.submittedAt || (typeof item.isLate !== 'undefined') || item.originalName) {
            submissionObj = {
              submission: item.submission ?? null,
              filePath: item.filePath ?? null,
              originalName: item.originalName ?? null,
              submittedAt: item.submittedAt ?? null,
              isLate: typeof item.isLate !== 'undefined' ? item.isLate : undefined,
              grade: item.grade ?? null,
              feedback: item.feedback ?? null,
            };
          }

          // If backend returned an object with "submission" as object
          if (!submissionObj && item.submission && typeof item.submission === 'object') {
            submissionObj = {
              submission: item.submission.submission ?? null,
              filePath: item.submission.filePath ?? null,
              originalName: item.submission.originalName ?? null,
              submittedAt: item.submission.submittedAt ?? null,
              isLate: typeof item.submission.isLate !== 'undefined' ? item.submission.isLate : undefined,
              grade: item.submission.grade ?? null,
              feedback: item.submission.feedback ?? null,
            };
          }

          // If backend returned 'submissions' array (embedded) — pick the first / the one for this student
          if (!submissionObj && Array.isArray(item.submissions) && item.submissions.length) {
            // If you have multiple subs per assignment, this heuristic picks the first one.
            // Backend ideally should give you only the student's submission in the student endpoint.
            const s = item.submissions[0];
            submissionObj = {
              submission: s.submission ?? null,
              filePath: s.filePath ?? null,
              originalName: s.originalName ?? null,
              submittedAt: s.submittedAt ?? null,
              isLate: typeof s.isLate !== 'undefined' ? s.isLate : undefined,
              grade: s.grade ?? null,
              feedback: s.feedback ?? null,
            };
          }

          // If nothing found, fallback to basic submission string (older shape)
          if (!submissionObj && item.submission) {
            submissionObj = {
              submission: typeof item.submission === 'string' ? item.submission : null,
              filePath: null,
              originalName: null,
              submittedAt: null,
              isLate: undefined,
              grade: null,
              feedback: null,
            };
          }

          // Compute final isLate: prefer server-provided boolean; if missing, compute from submittedAt vs due
          const dueVal = item.dueDate || item.due || null;
          const dueTime = dueVal ? new Date(dueVal).getTime() : null;
          const submittedAtVal = submissionObj?.submittedAt ?? null;
          let submittedAtIso = null;
          let submittedAtMs = null;
          if (submittedAtVal) {
            const d = new Date(submittedAtVal);
            if (!isNaN(d.getTime())) {
              submittedAtIso = d.toISOString();
              submittedAtMs = d.getTime();
            }
          }

          const serverIsLate = typeof submissionObj?.isLate === 'boolean' ? submissionObj.isLate : undefined;
          const computedIsLate = (typeof serverIsLate === 'boolean')
            ? serverIsLate
            : (submittedAtMs && dueTime ? (submittedAtMs > dueTime) : false);

          return {
            ...item,
            id: item.assignmentId || item._id,
            title: item.title || item.assignmentTitle,
            status: item.status || (submissionObj ? 'submitted' : 'pending'),
            course: courseTitle,
            due: dueVal || 'N/A',
            attachmentUrl: item.attachmentUrl || null,
            // canonical submission fields for the UI
            submission: submissionObj?.submission ?? null,
            filePath: submissionObj?.filePath ?? null,
            originalName: submissionObj?.originalName ?? null,
            submittedAt: submittedAtIso ?? null,
            isLate: !!computedIsLate,
            grade: submissionObj?.grade ?? null,
            feedback: submissionObj?.feedback ?? null,
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
  // Submit (works for edit too) — uses server response to update UI
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

      // submitAssignment should return the saved submission object (server response)
      const savedSubmission = await submitAssignment(assignmentId, formData);

      // normalize returned submittedAt to ISO if present
      const returnedSubmittedAt = savedSubmission?.submittedAt ? new Date(savedSubmission.submittedAt).toISOString() : new Date().toISOString();
      const returnedIsLate = typeof savedSubmission?.isLate === 'boolean'
        ? savedSubmission.isLate
        : // fallback compute (server should provide boolean, but be defensive)
          (() => {
            const dueVal = assignments.find(a => a.id === assignmentId)?.due || null;
            const dueTime = dueVal ? new Date(dueVal).getTime() : null;
            const subMs = returnedSubmittedAt ? new Date(returnedSubmittedAt).getTime() : null;
            return dueTime && subMs ? subMs > dueTime : false;
          })();

      // update UI using server response (prefer canonical fields)
      setAssignments(prev =>
        prev.map(a =>
          a.id === assignmentId
            ? {
                ...a,
                status: 'submitted',
                submission: savedSubmission?.filePath || savedSubmission?.submission || savedSubmission?.originalName || (file ? file.name : text),
                filePath: savedSubmission?.filePath || null,
                originalName: savedSubmission?.originalName || null,
                isLate: !!returnedIsLate,
                submittedAt: returnedSubmittedAt,
                grade: savedSubmission?.grade ?? a.grade,
                feedback: savedSubmission?.feedback ?? a.feedback,
              }
            : a
        )
      );

      setEditing(prev => ({ ...prev, [assignmentId]: false }));
      setSelectedFile(prev => ({ ...prev, [assignmentId]: null }));
      setSubmissionText(prev => ({ ...prev, [assignmentId]: "" }));

      toast.success('Submission saved.');
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(error.response?.data?.message || "Failed to submit assignment.");
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
                href={a.attachmentUrl.startsWith("http") ? a.attachmentUrl : `${API_HOST}${a.attachmentUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 underline"
              >
                View Assignment Attachment
              </a>
            )}

            <p className="mt-3">{a.description}</p>

            {/* ========================= */}
            {/* EDIT OR SUBMIT AREA      */}
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

                {/* Show Late/On-time + timestamp */}
                <div className="flex items-center gap-3 mb-2">
                  {a.isLate ? (
                    <span className="px-2 py-1 rounded-full text-sm bg-red-100 text-red-700 font-semibold">Late</span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-sm bg-green-100 text-green-700 font-semibold">On time</span>
                  )}
                  {a.submittedAt && (
                    <div className="text-xs text-gray-500">Submitted: {new Date(a.submittedAt).toLocaleString()}</div>
                  )}
                </div>

                {/* prefer filePath for download */}
                {a.filePath ? (
                  <a
                    href={makeFileUrl(a.filePath)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline"
                  >
                    View Submitted File
                  </a>
                ) : a.submission ? (
                  <p>{a.submission}</p>
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

            {/* EDIT MODE UI */}
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
