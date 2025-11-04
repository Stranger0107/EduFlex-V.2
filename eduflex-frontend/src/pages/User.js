// src/pages/User.js
import React, { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";
const profilePic = "https://ui-avatars.com/api/?name=User&background=10b981&color=fff&rounded=true&size=128";

export default function User() {
  const { user, stats, enrolledCourses, recentGrades, loading } = useApp();
  const [showInfo, setShowInfo] = useState(true);

  useEffect(() => {
    // Optionally fetch up-to-date user/profile info here if your context doesn't do this already
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80 text-lg">
        Loading profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-2xl font-bold text-red-500 mb-6">No user found.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-8 p-8 bg-white rounded-xl shadow-lg">
      <div className="flex gap-8 items-center">
        <img src={profilePic} alt="User" className="w-32 h-32 rounded-full shadow" />
        <div>
          <h1 className="text-3xl font-bold text-green-700 mb-1">
            {user.name}
          </h1>
          <p className="text-gray-600 mb-2">
            <span className="font-semibold">{user.role && user.role.toUpperCase()}</span>
            {user.role === "student" && user.year ? ` | ${user.year}` : ""}
          </p>
          <p className="text-sm text-gray-400 mb-2">{user.email}</p>
          <button
            onClick={() => setShowInfo((show) => !show)}
            className="text-green-600 hover:underline text-sm"
          >
            {showInfo ? "Hide" : "Show"} Info
          </button>
          {showInfo && (
            <ul className="mt-1 text-gray-700 text-xs">
              {user.role === "profile" && user.department && <li>Department: {user.department}</li>}
              <li>Joined: {user.joinDate}</li>
              {user.studentId && <li>Student ID: {user.studentId}</li>}
            </ul>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 my-8">
        <StatsCard title="Courses" value={stats?.totalCourses || 0} color="#3b82f6" icon="📚" />
        <StatsCard title="Pending Assignments" value={stats?.pendingAssignments || 0} color="#f43f5e" icon="📝" />
        <StatsCard title="Avg Grade" value={stats?.averageGrade ? `${stats.averageGrade}%` : "N/A"} color="#22c55e" icon="🏅" />
        <StatsCard title="Overall Progress" value={stats?.overallProgress ? `${stats.overallProgress}%` : "N/A"} color="#f59e0b" icon="📈" />
      </div>

      {/* Enrolled Courses */}
      <h2 className="text-xl font-semibold mb-3 text-green-700">Enrolled Courses</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {enrolledCourses.length === 0 && (
          <div className="text-gray-400">No enrolled courses yet.</div>
        )}
        {enrolledCourses.map(c => (
          <div key={c._id} className="bg-gray-50 rounded p-4 border border-green-100">
            <div className="font-bold">{c.title}</div>
            <div className="text-xs text-gray-600 mb-1">Credits: {c.credits}</div>
            <div className="text-xs text-gray-600 mb-1">
              Progress: <span className="font-semibold text-blue-600">{c.progress || 0}%</span>
            </div>
            <div className="text-xs text-gray-500">From {c.startDate} - {c.endDate}</div>
          </div>
        ))}
      </div>

      {/* Recent Grades */}
      <h2 className="text-xl font-semibold mb-3 text-green-700">Recent Grades</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {recentGrades.length === 0 && (
          <div className="text-gray-400">No grades yet.</div>
        )}
        {recentGrades.map(g => (
          <div key={g.id} className="rounded bg-white p-4 border shadow-sm flex justify-between items-center">
            <div>
              <strong>{g.assignment} </strong>
              <span className="text-gray-600">({g.course})</span>
            </div>
            <span className="font-semibold text-green-600 text-xl">{g.score}</span>
          </div>
        ))}
      </div>

      {/* You can add chart visualizations here if you want (using recharts or similar) */}
    </div>
  );
}

function StatsCard({ title, value, color, icon }) {
  return (
    <div className="rounded-lg px-4 py-5 shadow text-center" style={{ background: color + "18" }}>
      <div className="text-3xl mb-1" style={{ color }}>{icon}</div>
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs opacity-70">{title}</div>
    </div>
  );
}
