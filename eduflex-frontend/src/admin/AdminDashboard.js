// src/admin/AdminDashboard.js
import React, { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";

export default function AdminDashboard() {
  const { getAllUsers, getAllCourses, loading } = useApp();
  const [userCount, setUserCount] = useState(0);
  const [courseCount, setCourseCount] = useState(0);
  const [professorCount, setProfessorCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        const users = await getAllUsers();
        setUserCount(users?.length || 0);
        setProfessorCount(users?.filter(u => u.role === "professor").length || 0);
        setStudentCount(users?.filter(u => u.role === "student").length || 0);

        const courses = await getAllCourses();
        setCourseCount(courses?.length || 0);
      } catch (err) {
        // Errors handled by context/api.js
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, [getAllUsers, getAllCourses]);

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-80 text-lg">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="p-8 pl-24 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <StatsCard title="Total Users" value={userCount} color="#3b82f6" icon="👥" />
        <StatsCard title="Professors" value={professorCount} color="#8b5cf6" icon="🧑‍🏫" />
        <StatsCard title="Students" value={studentCount} color="#10b981" icon="🎓" />
        <StatsCard title="Courses" value={courseCount} color="#f59e0b" icon="📚" />
      </div>
      {/* Additional analytics/tables can be added below if needed */}
    </div>
  );
}

function StatsCard({ title, value, color, icon }) {
  return (
    <div className="rounded-lg px-4 py-6 shadow text-center" style={{ background: color + "14" }}>
      <span className="text-3xl mb-2 block" style={{ color }}>{icon}</span>
      <span className="text-xl font-bold" style={{ color }}>{value}</span>
      <div className="mt-1 text-xs opacity-75">{title}</div>
    </div>
  );
}
//Hey There
