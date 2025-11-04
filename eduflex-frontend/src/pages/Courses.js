// src/pages/Courses.js
import React, { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import SearchIcon from "../assets/search.svg";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function Courses() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // 'all', 'enrolled', 'available'
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const {
    user,
    getAllCourses,
    getMyStudentCourses,
    enrollInCourse,
    unenrollFromCourse,
  } = useApp();

  const navigate = useNavigate();

  // Fetch courses per filter
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        let fetchedCourses = [];
        if (filter === 'enrolled') {
          fetchedCourses = await getMyStudentCourses();
        } else {
          fetchedCourses = await getAllCourses();
        }
        setCourses(fetchedCourses || []);
      } catch (error) {
        toast.error("Failed to fetch courses.");
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchCourses();
  }, [filter, user, getAllCourses, getMyStudentCourses]);

  // Search and further filtering
  const filteredCourses = courses.filter(course => {
    // 'available' filter: not enrolled
    if (filter === "available" && course.enrolled) return false;
    // Search logic
    const term = search.toLowerCase();
    const teacherName =
      (course.teacher?.name || course.instructor || "").toLowerCase();
    return (
      course.title?.toLowerCase().includes(term) ||
      course.description?.toLowerCase().includes(term) ||
      teacherName.includes(term)
    );
  });

  const handleEnrollment = async (courseId, isEnrolled, title) => {
    try {
      if (isEnrolled) {
        await unenrollFromCourse(courseId);
        toast.success(`Unenrolled from ${title}.`);
      } else {
        await enrollInCourse(courseId);
        toast.success(`Enrolled in ${title}!`);
      }
      // Refetch current filter's courses after status change
      setFilter(f => f); // Triggers useEffect
    } catch {
      toast.error(`Failed to ${isEnrolled ? 'unenroll' : 'enroll'}.`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-lg">
        Loading courses...
      </div>
    );
  }

  return (
    <div className="p-8 pl-24 min-h-screen">
      <h1 className="text-3xl font-bold mb-2">Courses</h1>
      <p className="text-gray-600 mb-6">Browse available courses or view your enrolled ones.</p>
      {/* === Search & Filter Controls === */}
      <div className="flex flex-wrap gap-4 items-center mb-8">
        {/* Search */}
        <div className="relative flex-grow max-w-md">
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <img
            src={SearchIcon}
            alt="Search"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none"
          />
        </div>
        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded ${filter === "all" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-800"}`}
            onClick={() => setFilter("all")}
          >All</button>
          <button
            className={`px-4 py-2 rounded ${filter === "enrolled" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-800"}`}
            onClick={() => setFilter("enrolled")}
          >Enrolled</button>
          <button
            className={`px-4 py-2 rounded ${filter === "available" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-800"}`}
            onClick={() => setFilter("available")}
          >Available</button>
        </div>
      </div>

      {/* === Course Grid === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCourses.length > 0 ? (
          filteredCourses.map(course => (
            <div
              key={course._id}
              className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 ${course.enrolled ? 'border-green-500' : 'border-transparent'}`}
            >
              {course.image && (
                <img src={course.image} alt={course.title} className="h-40 w-full object-cover" />
              )}
              <div className="p-4 flex flex-col h-full">
                <h2 className="text-lg font-bold text-green-700 mb-1">{course.title}</h2>
                <p className="text-sm italic text-gray-500 mb-4">
                  Instructor: {course.teacher?.name || course.instructor || "N/A"}
                </p>
                <div className="text-gray-800 mb-1" style={{ minHeight: "48px" }}>{course.description}</div>
                {course.credits &&
                  <div className="text-gray-500 text-xs mb-2">Credits: {course.credits}</div>
                }
                <div className="flex gap-2 mt-auto pt-4">
                  <button
                    onClick={() => handleEnrollment(course._id, course.enrolled, course.title)}
                    className={`flex-1 px-3 py-2 rounded 
                      ${course.enrolled
                        ? "bg-red-100 text-red-600 hover:bg-red-200"
                        : "bg-green-600 text-white hover:bg-green-700"} font-semibold`}
                  >
                    {course.enrolled ? "Unenroll" : "Enroll"}
                  </button>
                  {course.enrolled && (
                    <button
                      onClick={() => navigate(`/courses/${course._id}`)}
                      className="flex-1 px-3 py-2 rounded bg-blue-500 text-white hover:bg-blue-700 font-semibold"
                    >
                      View
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 col-span-full text-center">No courses match your criteria.</p>
        )}
      </div>
    </div>
  );
}

export default Courses;
