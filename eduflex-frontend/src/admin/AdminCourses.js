import React, { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";
import { toast } from "react-toastify";

export default function AdminCourses() {
  const { getAllCourses, deleteCourse } = useApp();

  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const fetchedCourses = await getAllCourses();
        setCourses(fetchedCourses || []);
      } catch {
        toast.error("Failed to load courses.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [getAllCourses]);

  // Search filter
  const filteredCourses = courses.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      (c.teacher?.name?.toLowerCase().includes(q) || "")
    );
  });

  // Delete handler
  const handleDelete = async (courseId, title) => {
    if (window.confirm(`Are you sure you want to delete the course "${title}"? This cannot be undone.`)) {
      await deleteCourse(courseId);
      // Refresh list
      const refreshed = await getAllCourses();
      setCourses(refreshed || []);
    }
  };

  return (
    <div className="p-8 pl-24 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Course Management</h1>
        {/* Add new course button if desired */}
      </div>
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search courses..."
          className="px-4 py-2 w-full max-w-md border border-gray-300 rounded focus:outline-none"
        />
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-80 text-lg">Loading courses...</div>
      ) : (
        <table className="w-full bg-white rounded-xl shadow overflow-x-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">Title</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-left">Instructor</th>
              <th className="px-4 py-2 text-left">Credits</th>
              <th className="px-4 py-2 text-left">Start</th>
              <th className="px-4 py-2 text-left">End</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.map(c => (
              <tr key={c._id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2 font-semibold">{c.title}</td>
                <td className="px-4 py-2">{c.description}</td>
                <td className="px-4 py-2">{c.teacher?.name || c.instructor || "N/A"}</td>
                <td className="px-4 py-2">{c.credits}</td>
                <td className="px-4 py-2">{c.startDate}</td>
                <td className="px-4 py-2">{c.endDate}</td>
                <td className="px-4 py-2">
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
                    onClick={() => handleDelete(c._id, c.title)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filteredCourses.length === 0 && (
              <tr>
                <td colSpan={7} className="text-gray-400 text-center py-6">No courses found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
//Hey there