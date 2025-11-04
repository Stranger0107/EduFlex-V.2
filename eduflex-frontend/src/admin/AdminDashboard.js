// src/admin/AdminDashboard.js
import React, { useEffect, useState } from "react";
import api from "../config/api"; // Import the configured api instance
import { toast } from "react-toastify";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    userCount: 0,
    courseCount: 0,
    professorCount: 0,
    studentCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        //
        const { data } = await api.get("/admin/stats");
        
        setStats({
          userCount: data.userCount,
          courseCount: data.courseCount,
          professorCount: data.roleCounts?.professor || 0,
          studentCount: data.roleCounts?.student || 0,
        });
      } catch (err) {
        toast.error("Failed to load dashboard statistics.");
        // Errors are also handled by the api.js interceptor
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, []); // Only runs once on component mount

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-80 text-lg">
        Loading dashboard...
      </div>
    );
  }

  return (
    // Removed pl-24, as layout component should handle this padding
    <div className="p-8 min-h-screen"> 
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <StatsCard title="Total Users" value={stats.userCount} color="#3b82f6" icon="👥" />
        <StatsCard title="Professors" value={stats.professorCount} color="#8b5cf6" icon="🧑‍🏫" />
        <StatsCard title="Students" value={stats.studentCount} color="#10b981" icon="🎓" />
        <StatsCard title="Courses" value={stats.courseCount} color="#f59e0b" icon="📚" />
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