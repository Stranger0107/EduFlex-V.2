import React, { useState } from "react";
import { useApp } from "../contexts/AppContext";
import { toast } from "react-toastify";
import { FaUserTie, FaEnvelope, FaBuilding, FaCalendarAlt, FaBook, FaClipboardList, FaEdit } from "react-icons/fa";

export default function ProfessorProfile() {
  // HOOKS AT THE TOP!
  const { user, courses, assignments, updateUserProfile, loading } = useApp();
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    department: user?.department ?? "",
    email: user?.email ?? "",
    joinDate: user?.joinDate ?? "",
  });

  if (loading) {
    return <div style={{ padding: "2rem", fontSize: "1.3rem" }}>Loading profile...</div>;
  }
  if (!user || user.role !== "professor") {
    return <div style={{ padding: "2rem" }}>Access denied.</div>;
  }

  const handleChange = e => setProfile({ ...profile, [e.target.name]: e.target.value });
  const saveProfile = () => {
    updateUserProfile(profile);
    setEditing(false);
    toast.success("Profile updated!");
  };

  const myCourses = courses.filter(c => c.ownerId === user.id);
  const assignmentsMade = assignments.filter(a => {
    const course = courses.find(c => c.id === a.courseId);
    return course && course.ownerId === user.id;
  });

  const getInitials = (name = "") =>
    name
      .split(" ")
      .map(word => word[0]?.toUpperCase())
      .join("")
      .slice(0, 2);

  return (
    <div style={{
      padding: "2rem",
      minHeight: "100vh",
      background: "radial-gradient(circle 600px at 70% 40%, #e0e7ff 0%, #f8fafc 100%)"
    }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#3730a3", marginBottom: "2rem", letterSpacing: ".03em" }}>
        Professor Profile
      </h1>
      <div style={{
        background: "#fff",
        maxWidth: 540,
        margin: "0 auto",
        borderRadius: "1.2rem",
        boxShadow: "0 6px 32px #c7d2fe44",
        padding: "2.3rem 2rem 2.2rem 2rem",
        position: "relative",
      }}>
        {/* Avatar and Info */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: 18 }}>
          <div style={{
            width: 88, height: 88, borderRadius: "50%",
            background: "linear-gradient(135deg,#6366f1,#22c55e)",
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: "2.4rem", boxShadow: "0 4px 16px #6366f133",
          }}>
            <FaUserTie size={46} style={{ opacity: 0.72, marginRight: 2 }} />
            <span style={{ marginLeft: 6 }}>{getInitials(profile.name)}</span>
          </div>
          <div>
            <div style={{ fontSize: "1.58rem", fontWeight: "bold", color: "#3730a3" }}>{profile.name}</div>
            <div style={{ fontSize: ".99rem", marginTop: 2, color: "#475569" }}>
              Professor, <span style={{ fontWeight: 500, color: "#16a34a" }}>{profile.department || "Department"}</span>
            </div>
            <div style={{ fontSize: ".91rem", color: "#888", marginTop: ".25rem" }}>
              Joined on <FaCalendarAlt size={13} style={{ marginBottom: -2, marginRight: 2 }}/>{profile.joinDate || "-"}
            </div>
          </div>
        </div>
        {/* Cards */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "2.2rem" }}>
          <div style={{
            flex: 1,
            background: "linear-gradient(120deg,#6366f1,#818cf8)",
            color: "#fff",
            borderRadius: ".7rem",
            padding: "1rem 1.1rem",
            textAlign: "center"
          }}>
            <FaBook size={28} style={{ marginBottom: 2 }} /><br />
            <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{myCourses.length}</div>
            <div style={{ fontSize: ".98rem", fontWeight: 300 }}>Courses Created</div>
          </div>
          <div style={{
            flex: 1,
            background: "linear-gradient(120deg,#22c55e,#2dd4bf)",
            color: "#fff",
            borderRadius: ".7rem",
            padding: "1rem 1.1rem",
            textAlign: "center"
          }}>
            <FaClipboardList size={25} style={{ marginBottom: 2 }} /><br />
            <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{assignmentsMade.length}</div>
            <div style={{ fontSize: ".98rem", fontWeight: 300 }}>Assignments Given</div>
          </div>
        </div>
        {/* Profile Details */}
        <div style={{ marginBottom: "2.2rem", background:"#f8fafc", borderRadius:".8rem", padding:"1.2rem" }}>
          {/* Name */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: ".95rem" }}>
            <FaUserTie color="#10b981" />
            <span style={{ fontWeight: 500, minWidth: 120, color: "#222" }}>Name:</span>
            {editing ? (
              <input type="text" name="name" value={profile.name} onChange={handleChange}
                style={{ fontSize: ".98rem", padding: ".3rem .7rem", border: "1.5px solid #a5b4fc", borderRadius: "7px", background: "#fff" }}
              />
            ) : (
              <span style={{ color: "#1e293b" }}>{profile.name}</span>
            )}
          </div>
          {/* Department */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: ".95rem" }}>
            <FaBuilding color="#6366f1" />
            <span style={{ fontWeight: 500, minWidth: 120, color: "#222" }}>Department:</span>
            {editing ? (
              <input type="text" name="department" value={profile.department} onChange={handleChange}
                style={{ fontSize: ".98rem", padding: ".3rem .7rem", border: "1.5px solid #a5b4fc", borderRadius: "7px", background: "#fff" }}
              />
            ) : (
              <span style={{ color: "#475569" }}>{user.department || "-"}</span>
            )}
          </div>
          {/* Email */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: ".95rem" }}>
            <FaEnvelope color="#eab308" />
            <span style={{ fontWeight: 500, minWidth: 120, color: "#222" }}>Email:</span>
            <span style={{ color: "#4c51bf" }}>{profile.email}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ textAlign: "right" }}>
          {editing ? (
            <>
              <button
                onClick={saveProfile}
                style={{
                  background: "linear-gradient(90deg,#6366f1,#22d3ee)",
                  color: "#fff", fontWeight: 600, border: "none",
                  borderRadius: "8px", padding: ".55rem 1.6rem", marginRight: "1rem", fontSize: "1rem"
                }}>
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                style={{
                  background: "#aaa", color: "#fff", fontWeight: 600,
                  border: "none", borderRadius: "8px", padding: ".55rem 1.5rem", fontSize: "1rem"
                }}>
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              style={{
                background: "linear-gradient(90deg,#22c55e,#4f46e5)",
                color: "#fff", fontWeight: 600, border: "none",
                borderRadius: "8px", padding: ".72rem 2.2rem", fontSize: "1.06rem"
              }}>
              <FaEdit style={{ marginRight: 7 }} /> Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
