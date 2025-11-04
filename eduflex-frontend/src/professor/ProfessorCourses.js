// src/professor/ProfessorCourses.js
import React, { useEffect, useState, useCallback } from "react";
import { useApp } from "../contexts/AppContext";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function ProfessorCourses() {
  // *** FIX: Use the NEW professor-specific functions ***
  const { 
    user, 
    fetchMyProfessorCourses, // Use the correct function name
    createProfessorCourse, 
    updateProfessorCourse, 
    deleteProfessorCourse 
  } = useApp();

  const [myCourses, setMyCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Helper to refresh courses, wrapped in useCallback
  const refreshCourses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // *** FIX: Call correct function name ***
      const courses = await fetchMyProfessorCourses();
      setMyCourses(courses || []);
    } catch (err) {
      toast.error("Failed to load courses.");
    } finally {
      setLoading(false);
    }
  }, [fetchMyProfessorCourses, user]);

  // Fetch courses on mount
  useEffect(() => {
    refreshCourses();
  }, [refreshCourses]);

  // --- Event Handlers ---

  const handleCreate = async (data) => {
    // *** FIX: Call correct context function ***
    const newCourse = await createProfessorCourse({ title: data.title, description: data.description });
    if (newCourse) {
      toast.success("Course created!");
      setShowModal(false);
      refreshCourses();
    }
    // Error toast is handled by api.js interceptor
  };

  const handleUpdate = async (id, title, desc) => {
    // *** FIX: Call correct context function ***
    const updated = await updateProfessorCourse(id, { title, description: desc });
    if (updated) {
      toast.success("Course updated");
      refreshCourses();
      return true; // Return true to close edit modal
    }
    return false;
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this course? This will also delete all associated assignments.")) {
      // *** FIX: Call correct context function ***
      const success = await deleteProfessorCourse(id);
      if (success) {
        toast.success("Course deleted!");
        refreshCourses();
      }
    }
  };

  return (
    // Converted to Tailwind CSS
    <div className="p-8 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h2 className="font-bold text-3xl">My Courses</h2>
        <button
          className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-800 text-white rounded-lg font-semibold text-sm shadow-lg hover:scale-105 transition-transform"
          onClick={() => setShowModal(true)}
        >
          + Create New Course
        </button>
      </div>

      {loading ? (
        <div className="text-gray-600 text-center pt-6">Loading...</div>
      ) : myCourses.length === 0 ? (
        <div className="text-gray-600 text-center pt-6">No courses yet. Start by creating one!</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myCourses.map(course =>
            <CourseCard
              course={course}
              key={course._id}
              updateCourse={handleUpdate}
              deleteCourse={handleDelete}
            />
          )}
        </div>
      )}

      {showModal && (
        <CourseModal
          onClose={() => setShowModal(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}

function CourseCard({ course, updateCourse, deleteCourse }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(course.title);
  const [desc, setDesc] = useState(course.description);

  const handleSave = async () => {
    const success = await updateCourse(course._id, title, desc);
    if (success) {
      setEditing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg flex flex-col min-w-[250px]">
      <div className="p-6 flex-grow">
      {editing ? (
        <>
          <label htmlFor="edit-title" className="text-xs font-semibold text-gray-500">Title</label>
          <input 
            id="edit-title"
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            className="font-bold text-lg w-full mb-2 border-b-2 border-indigo-300 focus:outline-none" 
          />
          <label htmlFor="edit-desc" className="text-xs font-semibold text-gray-500">Description</label>
          <textarea 
            id="edit-desc"
            value={desc} 
            onChange={e => setDesc(e.target.value)} 
            rows={3} 
            className="text-sm w-full text-gray-700 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <div className="mt-4">
            <button 
              onClick={handleSave} 
              className="mr-2 bg-green-500 text-white border-none px-4 py-1 rounded-md text-sm font-medium"
            >
              Save
            </button>
            <button 
              onClick={() => setEditing(false)} 
              className="bg-gray-300 border-none px-4 py-1 rounded-md text-sm"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <Link 
            to={`/professor/courses/${course._id}`} 
            className="text-indigo-700 font-bold text-xl mb-2 block hover:underline"
          >
            {course.title}
          </Link>
          <p className="text-gray-700 text-sm mb-4 h-16 overflow-hidden">
            {course.description}
          </p>
          <button 
            onClick={() => setEditing(true)} 
            className="bg-indigo-500 text-white border-none px-4 py-1 rounded-md text-sm font-medium hover:bg-indigo-600"
          >
            Edit
          </button>
          <button 
            onClick={() => deleteCourse(course._id)} 
            className="bg-red-500 text-white border-none px-4 py-1 rounded-md text-sm font-medium ml-2 hover:bg-red-600"
          >
            Delete
          </button>
        </>
      )}
      </div>
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        {/* */}
        {/* This field exists in your model */}
        <div className="text-sm text-gray-600">
          <strong>{course.students?.length || 0}</strong> Student(s) Enrolled
        </div>
      </div>
    </div>
  );
}

function CourseModal({ onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  //
  // Removed 'credit' state, as it does not exist on the Course model

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ title, description: desc }); // Removed credits
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <form 
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative"
      >
        <h3 className="mb-4 font-bold text-xl">Create New Course</h3>
        <div className="mb-4">
          <label htmlFor="title" className="font-semibold text-sm block mb-1">Title</label>
    M     <input 
            id="title"
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400" 
          />
        </div>
        <div className="mb-6">
          <label htmlFor="desc" className="font-semibold text-sm block mb-1">Description</label>
          <textarea 
            id="desc"
            value={desc} 
            onChange={e => setDesc(e.target.value)} 
            rows={3} 
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400" 
          />
        </div>
        {/* */}
        {/* Removed 'Credits' input as it does not exist on the Course model */}
        <div className="flex justify-end gap-3">
          <button 
            type="submit"
            className="bg-indigo-600 text-white border-none px-5 py-2 rounded-md font-semibold hover:bg-indigo-700"
          >
            Create
          </button>
          <button 
            type="button"
            onClick={onClose} 
            className="ml-3 bg-gray-300 text-gray-800 border-none px-5 py-2 rounded-md font-semibold hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}