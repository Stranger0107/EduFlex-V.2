// src/professor/ProfessorDashboard.js
import React, { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

export default function ProfessorDashboard() {
  const { user, loading, getMyProfessorCourses, getProfessorAssignments } = useApp();
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch professor's courses and assignments for calendar
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const courseList = await getMyProfessorCourses();
        setCourses(courseList || []);
        const allAssignments = [];
        for (const c of (courseList || [])) {
          const courseAssignments = await getProfessorAssignments(c._id);
          (courseAssignments || []).forEach(a => allAssignments.push({ ...a, courseTitle: c.title }));
        }
        setAssignments(allAssignments);

        // --- Build Calendar Events ---
        const evts = [
          // Course start/end dates
          ...(courseList || []).map(course => ({
            id: `start-${course._id}`,
            title: `Start: ${course.title}`,
            start: new Date(course.startDate),
            end: new Date(course.startDate),
            type: "course-start",
            resource: course,
          })),
          ...(courseList || []).map(course => ({
            id: `end-${course._id}`,
            title: `End: ${course.title}`,
            start: new Date(course.endDate),
            end: new Date(course.endDate),
            type: "course-end",
            resource: course,
          })),
          // Assignment deadlines
          ...(allAssignments || []).map(assignment => ({
            id: `asgn-${assignment._id}`,
            title: `Due: ${assignment.title}`,
            start: new Date(assignment.due),
            end: new Date(assignment.due),
            type: "assignment",
            resource: assignment,
          }))
        ];
        setEvents(evts);
      } catch (err) {
        // Error handled by context interceptor
      } finally {
        setIsLoading(false);
      }
    };
    if (user && user.role === "professor") fetchData();
  }, [user, getMyProfessorCourses, getProfessorAssignments]);

  // Card stats calculations
  const totalStudents = courses.reduce((sum, course) =>
    sum + (course.enrolledStudents?.length || 0), 0
  );
  const totalSubmissions = assignments.reduce((acc, a) =>
    acc + ((a.submissions && a.submissions.length) || 0), 0
  );

  // Calendar event colors
  const eventStyleGetter = (event) => {
    let backgroundColor = "#3b82f6";
    if (event.type === "course-start") backgroundColor = "#10b981";
    if (event.type === "course-end") backgroundColor = "#ef4444";
    if (event.type === "assignment") backgroundColor = "#f59e0b";
    return {
      style: {
        backgroundColor,
        borderRadius: "5px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block"
      }
    };
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-80 text-lg">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div style={{padding: "2rem", minHeight: "100vh"}}>
      <h2 style={{fontWeight: "bold", fontSize: "2rem", marginBottom: "2rem"}}>
        Welcome, {user?.name}
      </h2>
      <div style={{
        display: "flex", gap: "2rem", flexWrap: "wrap", marginBottom: "2rem"
      }}>
        <StatCard title="My Courses" count={courses.length} color="#6366f1" icon="📚" />
        <StatCard title="Assignments Created" count={assignments.length} color="#f59e42" icon="📝" />
        <StatCard title="Student Enrollments" count={totalStudents} color="#22c55e" icon="👥" />
        <StatCard title="Total Submissions" count={totalSubmissions} color="#f43f5e" icon="✅" />
      </div>

      {/* Calendar Section */}
      <div style={{
        background: "#fff",
        borderRadius: "1rem",
        padding: "2rem",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        marginBottom: "2rem"
      }}>
        <h3 style={{ fontWeight: "bold", fontSize: "1.5rem", marginBottom: "1.5rem" }}>
          📅 Events Calendar
        </h3>
        <div style={{ height: 600 }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            eventPropGetter={eventStyleGetter}
            views={["month", "week", "day", "agenda"]}
            defaultView="month"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, count, color, icon }) {
  return (
    <div style={{
      flex: "1 1 220px",
      background: color,
      color: "#fff",
      borderRadius: "1rem",
      padding: "1.5rem",
      boxShadow: "0 4px 12px rgba(44,44,44,0.18)",
      display: "flex",
      alignItems: "center",
      minWidth: 180
    }}>
      <span style={{fontSize: "2.2rem", marginRight: "1rem"}}>{icon}</span>
      <div>
        <div style={{fontSize: "2rem", fontWeight: "bold"}}>{count}</div>
        <div style={{fontSize: "1rem", opacity: 0.88}}>{title}</div>
      </div>
    </div>
  );
}
