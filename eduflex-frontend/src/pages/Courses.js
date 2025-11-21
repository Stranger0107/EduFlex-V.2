// ✅ FINAL — src/pages/Courses.js
import React, { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import SearchIcon from "../assets/search.svg";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function Courses() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
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

  // ✅ Fetch courses properly
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const fetched =
          filter === "enrolled"
            ? await getMyStudentCourses()
            : await getAllCourses();

        setCourses(Array.isArray(fetched) ? fetched : []);
      } catch (err) {
        toast.error("Failed to load courses.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchCourses();
  }, [filter, user, getAllCourses, getMyStudentCourses]);

  // ✅ Mark enrolled courses and surface enrollment requirement flag
  const updatedCourses = courses.map((c) => ({
    ...c,
    enrolled: c.students?.includes(user?._id),
    enrollmentRequired: !!c.enrollmentRequired,
  }));

  // ✅ Search & Filter
  const filteredCourses = updatedCourses.filter((c) => {
    const term = search.toLowerCase();
    const match =
      c.title?.toLowerCase().includes(term) ||
      c.description?.toLowerCase().includes(term) ||
      c.professor?.name?.toLowerCase().includes(term);

    if (filter === "enrolled") return match && c.enrolled;
    if (filter === "available") return match && !c.enrolled;
    return match;
  });

 const handleEnrollment = async (courseId, isEnrolled, title, enrollmentRequired) => {
  try {
    if (isEnrolled) {
      await unenrollFromCourse(courseId);
      toast.success(`Unenrolled from ${title}.`);
    } else {
      let key = null;
      if (enrollmentRequired) {
        key = window.prompt(`This course requires an enrollment key. Enter key to enroll in ${title}:`);
        if (key === null) return; // user cancelled
      }
      await enrollInCourse(courseId, key);
      toast.success(`Enrolled in ${title}!`);
    }

    // 🧠 Optimistically update state after confirmed backend success
    setCourses((prev) =>
      prev.map((c) =>
        c._id === courseId
          ? {
              ...c,
              students: isEnrolled
                ? c.students.filter((s) => s !== user._id)
                : [...(c.students || []), user._id],
            }
          : c
      )
    );

    // 🕐 Delay re-fetch slightly so Mongo finishes updating
    setTimeout(async () => {
      const refreshed =
        filter === "enrolled"
          ? await getMyStudentCourses()
          : await getAllCourses();

      setCourses(Array.isArray(refreshed) ? refreshed : []);
    }, 500); // 0.5s delay fixes flash issue
  } catch (err) {
    console.error("Enrollment error:", err);
    toast.error(`Failed to ${isEnrolled ? "unenroll" : "enroll"}.`);
  }
};


  if (loading)
    return (
      <div className="flex justify-center items-center h-72 text-lg">
        Loading courses...
      </div>
    );

  return (
    <div className="p-8 pl-24 min-h-screen">
      <h1 className="text-3xl font-bold mb-2">Courses</h1>
      <p className="text-gray-600 mb-6">
        Browse courses, enroll, and start learning 🎓
      </p>

      {/* 🔍 Search & Filters */}
      <div className="flex gap-4 mb-8 items-center">
        <div className="relative flex-grow max-w-md">
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-green-500"
          />
          <img
            src={SearchIcon}
            alt="Search"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 opacity-60"
          />
        </div>

        {["all", "enrolled", "available"].map((f) => (
          <button
            key={f}
            className={`px-4 py-2 rounded ${
              filter === f
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
            onClick={() => setFilter(f)}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* 📚 Course Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <div
              key={course._id}
              className={`bg-white rounded-xl shadow p-4 border-2 ${
                course.enrolled ? "border-green-500" : "border-transparent"
              }`}
            >
              <h2 className="font-bold text-xl text-green-700 mb-1">
                {course.title}
              </h2>
              <p className="text-sm italic text-gray-500 mb-3">
                Professor: {course.professor?.name}
              </p>
              <p className="text-gray-700 mb-3">{course.description}</p>

              <div className="flex gap-2">
                  <button
                  onClick={() =>
                    handleEnrollment(course._id, course.enrolled, course.title, course.enrollmentRequired)
                  }
                  className={`flex-1 px-3 py-2 rounded font-semibold ${
                    course.enrolled
                      ? "bg-red-100 text-red-600 hover:bg-red-200"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
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
          ))
        ) : (
          <p className="text-center text-gray-500 col-span-full">
            No courses found 😕
          </p>
        )}
      </div>
    </div>
  );
}

export default Courses;
