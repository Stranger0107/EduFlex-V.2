// src/professor/ProfessorCourseDetail.js
import React, { useEffect, useState, useCallback } from "react";
import { useApp } from "../contexts/AppContext";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function ProfessorCourseDetail() {
  const { courseId } = useParams();
  const {
    // *** THESE ARE THE CORRECTED FUNCTIONS ***
    fetchProfessorCourseById,
    fetchAssignmentsForCourse,
    updateProfessorCourse, // Use the prof-specific update
    createAssignment         // Use the general createAssignment
  } = useApp();

  const [course, setCourse] = useState(null);
  const [courseAssignments, setCourseAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // States for forms
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialLink, setMaterialLink] = useState("");
  // File upload is complex and requires a separate backend setup, removing for now.
  // const [materialFile, setMaterialFile] = useState(null); 

  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentInstr, setAssignmentInstr] = useState("");
  const [assignmentDue, setAssignmentDue] = useState("");

  // Fetch course and assignments
  const fetchCourseAndAssignments = useCallback(async () => {
    setLoading(true);
    try {
      //
      const [fetchedCourse, fetchedAssignments] = await Promise.all([
        fetchProfessorCourseById(courseId),
        fetchAssignmentsForCourse(courseId)
      ]);
  
      setCourse(fetchedCourse);
      setCourseAssignments(fetchedAssignments || []);
    } catch (err) {
      toast.error("Failed to load course data.");
    }
    setLoading(false);
  }, [courseId, fetchProfessorCourseById, fetchAssignmentsForCourse]);

  useEffect(() => {
    fetchCourseAndAssignments();
  }, [fetchCourseAndAssignments]); // Dependency array is correct now

  // --- FORM HANDLERS ---

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!materialTitle || !materialLink) {
      toast.error("Enter a title and a link for the material");
      return;
    }
    
    const newMaterial = {
      title: materialTitle,
      type: 'link', // Only links are supported for now
      url: materialLink
    };

    //
    const updatedMaterials = [...(course.materials || []), newMaterial];

    //
    const updatedCourse = await updateProfessorCourse(courseId, { 
      materials: updatedMaterials 
    });

    if (updatedCourse) {
      setMaterialTitle(""); 
      setMaterialLink("");
      toast.success("Material added!");
      fetchCourseAndAssignments(); // Refresh data
    }
  };

  const handleAddAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentTitle || !assignmentInstr || !assignmentDue) {
      toast.error("Please fill all assignment fields");
      return;
    }

    //
    const assignmentData = {
      title: assignmentTitle,
      instructions: assignmentInstr,
      dueDate: assignmentDue, // FIX: Use dueDate
      course: courseId         // FIX: Pass the course ID
    };

    //
    const newAssignment = await createAssignment(assignmentData);

    if (newAssignment) {
      setAssignmentTitle(""); 
      setAssignmentInstr(""); 
      setAssignmentDue("");
      toast.success("Assignment added!");
      fetchCourseAndAssignments(); // Refresh data
    }
  };


  if (loading) return <div className="p-8">Loading...</div>;
  if (!course) return <div className="p-8">Course not found.</div>;

  return (
    // Converted to Tailwind CSS
    <div className="p-8 min-h-screen">
      <h2 className="font-bold text-3xl mb-4">{course.title}</h2>
      <p className="mb-8 text-gray-700 text-base">{course.description}</p>

      {/* Study Materials */}
      <h3 className="mt-8 text-2xl font-semibold mb-4">Study Materials</h3>
      <div className="flex flex-wrap gap-3 my-4">
        {/* */}
        {(course.materials || []).length === 0 ? (
          <p className="text-gray-500 text-sm">No materials added yet.</p>
        ) : (
          (course.materials || []).map((mat, index) =>
            <a 
              href={mat.url} 
              target="_blank" 
              rel="noopener noreferrer"
              key={index} 
              className="bg-gray-100 rounded-md px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200 transition-colors"
            >
              {mat.type === "pdf" ? "📄" : "🔗"}&nbsp;
              {mat.title}
            </a>
          )
        )}
      </div>
      {/* Add Material FORM */}
      <form onSubmit={handleAddMaterial} className="mb-8 p-4 bg-gray-50 rounded-lg shadow-sm">
        <h4 className="font-semibold mb-3">Add New Material</h4>
        <div className="flex flex-wrap gap-4 items-center">
          <input
            placeholder="Material Title"
            value={materialTitle}
            onChange={e => setMaterialTitle(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            required
          />
          <input
            placeholder="Material Link (http://...)"
            type="url"
            value={materialLink}
            onChange={e => setMaterialLink(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            required
          />
          <button
            className="bg-indigo-600 text-white px-4 py-2 border-none rounded-md text-sm font-medium hover:bg-indigo-700"
            type="submit"
          >
          Add Material
        </button>
        </div>
      </form>

      {/* Assignments */}
      <h3 className="mt-10 text-2xl font-semibold mb-4">Assignments</h3>
      <div className="my-4 space-y-3">
        {courseAssignments.length === 0 ? (
          <p className="text-gray-500 text-sm">No assignments created yet.</p>
        ) : (
          courseAssignments.map(a =>
            <div key={a._id} className="bg-indigo-50 border border-indigo-200 rounded-lg mb-3 p-4">
              <Link 
                to={`/professor/assignments/${a._id}`} 
                className="text-blue-600 text-lg font-bold hover:underline"
              >
                {a.title}
              </Link>
              {/* */}
              <span className="text-sm text-gray-600 ml-3">
                (Due: {new Date(a.dueDate).toLocaleDateString()})
              </span>
              <div className="text-sm text-gray-700 mt-1">{a.instructions}</div>
            </div>
          )
        )}
      </div>
      {/* Add assignment FORM */}
      <form onSubmit={handleAddAssignment} className="mb-10 p-4 bg-gray-50 rounded-lg shadow-sm">
        <h4 className="font-semibold mb-3">Add New Assignment</h4>
        <div className="flex flex-wrap gap-4 items-center">
          <input
            placeholder="Assignment Title"
            value={assignmentTitle}
            onChange={e => setAssignmentTitle(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            required
          />
          <input
            type="date"
            placeholder="Due Date"
            value={assignmentDue}
            onChange={e => setAssignmentDue(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            required
          />
          <input
            placeholder="Instructions"
            value={assignmentInstr}
            onChange={e => setAssignmentInstr(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm flex-grow min-w-[220px] focus:outline-none focus:ring-2 focus:ring-indigo-400"
            required
          />
          <button
            className="bg-indigo-600 text-white px-4 py-2 border-none rounded-md text-sm font-medium hover:bg-indigo-700"
            type="submit"
          >
          Add Assignment
        </button>
        </div>
      </form>

      {/* Quizzes section removed, as it's not supported by the backend models or routes */}
    </div>
  );
}