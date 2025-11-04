// src/admin/AdminPanel.js
import React, { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import { toast } from "react-toastify";

/* ---------- Tab Configuration ---------- */
const TABS = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "users", label: "User Management", icon: "👥" },
  { key: "courses", label: "Course Management", icon: "📚" },
  { key: "settings", label: "System Settings", icon: "⚙" },
];

/* ---------- Main Component ---------- */
export default function AdminPanel() {
  const [tab, setTab] = useState("dashboard");

  return (
    <div className="p-8 pl-24 min-h-screen bg-gray-50">
      <TabbedHeader tabs={TABS} active={tab} setActive={setTab} />
      <div className="bg-white rounded-xl shadow px-5 py-6 mt-3">
        {tab === "dashboard" && <AdminDashboard />}
        {tab === "users" && <AdminUsers />}
        {tab === "courses" && <AdminCourses />}
        {tab === "settings" && <AdminSettings />}
      </div>
    </div>
  );
}

/* ---------- Header Tabs ---------- */
function TabbedHeader({ tabs, active, setActive }) {
  return (
    <div className="flex gap-2 mb-3">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => setActive(t.key)}
          className={`font-semibold py-2 px-4 rounded-t transition 
            ${
              active === t.key
                ? "bg-white text-green-700 shadow-md"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
        >
          <span className="mr-1">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* =====================================================
   🧩 DASHBOARD TAB
===================================================== */
function AdminDashboard() {
  const { getAllUsers, getAllCourses } = useApp();
  const [stats, setStats] = useState({
    users: 0,
    professors: 0,
    students: 0,
    courses: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const users = (await getAllUsers()) || [];
        const courses = (await getAllCourses()) || [];
        setStats({
          users: users.length,
          professors: users.filter((u) => u.role === "professor").length,
          students: users.filter((u) => u.role === "student").length,
          courses: courses.length,
        });
      } catch (error) {
        toast.error("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [getAllUsers, getAllCourses]);

  if (loading) return <div>Loading overview...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <StatsCard title="Total Users" value={stats.users} color="#3b82f6" icon="👥" />
        <StatsCard title="Professors" value={stats.professors} color="#8b5cf6" icon="🧑‍🏫" />
        <StatsCard title="Students" value={stats.students} color="#10b981" icon="🎓" />
        <StatsCard title="Courses" value={stats.courses} color="#f59e0b" icon="📚" />
      </div>
      <div className="flex gap-6 flex-wrap mt-8">
        <QuickLink
          icon="👥"
          label="User Management"
          onClick={() => window.scrollTo({ top: 400, behavior: "smooth" })}
        />
        <QuickLink
          icon="📚"
          label="Course Management"
          onClick={() => window.scrollTo({ top: 1000, behavior: "smooth" })}
        />
        <QuickLink
          icon="⚙"
          label="System Settings"
          onClick={() => window.scrollTo({ top: 2000, behavior: "smooth" })}
        />
      </div>
    </div>
  );
}

function StatsCard({ title, value, color, icon }) {
  return (
    <div
      className="rounded-lg px-4 py-6 shadow text-center"
      style={{ background: color + "14" }}
    >
      <span className="text-3xl mb-2 block" style={{ color }}>
        {icon}
      </span>
      <span className="text-xl font-bold" style={{ color }}>
        {value}
      </span>
      <div className="mt-1 text-xs opacity-75">{title}</div>
    </div>
  );
}

function QuickLink({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex gap-2 items-center text-lg bg-green-100 hover:bg-green-200 py-3 px-7 rounded font-semibold transition"
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}

/* =====================================================
   👥 USER MANAGEMENT TAB
===================================================== */
function AdminUsers() {
  const { getAllUsers, createUser, deleteUser } = useApp();
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const fetchedUsers = (await getAllUsers()) || [];
      setUsers(fetchedUsers);
      setLoading(false);
    };
    fetchUsers();
  }, [getAllUsers]);

  const filteredUsers = users.filter((u) =>
    roleFilter === "all" ? true : u.role === roleFilter
  );

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.warning("All fields required.");
      return;
    }
    await createUser(form);
    setShowModal(false);
    setForm({ name: "", email: "", password: "", role: "student" });
    const refreshedUsers = await getAllUsers();
    setUsers(refreshedUsers || []);
  };

  const handleDelete = async (userId, userName) => {
    if (
      window.confirm(
        `Are you sure you want to remove user "${userName}"? This cannot be undone.`
      )
    ) {
      await deleteUser(userId);
      const refreshedUsers = await getAllUsers();
      setUsers(refreshedUsers || []);
    }
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">All Users</h2>

      {/* Role Filter Buttons */}
      <div className="mb-4 flex gap-4">
        {["all", "student", "professor", "admin"].map((role) => (
          <button
            key={role}
            onClick={() => setRoleFilter(role)}
            className={`px-4 py-2 rounded ${
              roleFilter === role
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            {role.charAt(0).toUpperCase() + role.slice(1)}s
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="mb-3 bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700"
      >
        + Add New User
      </button>

      {/* Table */}
      <table className="w-full bg-white rounded-xl shadow overflow-x-auto">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Email</th>
            <th className="px-4 py-2 text-left">Role</th>
            <th className="px-4 py-2 text-left">Joined</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((u) => (
            <tr key={u._id || u.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2">{u.name}</td>
              <td className="px-4 py-2">{u.email}</td>
              <td className="px-4 py-2 capitalize">{u.role}</td>
              <td className="px-4 py-2">{u.joinDate || "-"}</td>
              <td className="px-4 py-2">
                <button
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
                  onClick={() => handleDelete(u._id || u.id, u.name)}
                  disabled={u.role === "admin"}
                  title={
                    u.role === "admin"
                      ? "Cannot remove admin user"
                      : "Remove user"
                  }
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
          {filteredUsers.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="text-gray-400 text-center py-6"
              >
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal for Create User */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleCreateUser}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative"
          >
            <h3 className="text-xl font-semibold mb-4">
              Create New User
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleFormChange}
                required
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                name="email"
                value={form.email}
                onChange={handleFormChange}
                required
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleFormChange}
                required
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleFormChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="student">Student</option>
                <option value="professor">Professor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded font-medium hover:bg-indigo-700"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded font-medium hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/* =====================================================
   📚 COURSE MANAGEMENT TAB
===================================================== */
function AdminCourses() {
  const { getAllCourses } = useApp();
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      const fetchedCourses = (await getAllCourses()) || [];
      setCourses(fetchedCourses);
      setLoading(false);
    };
    fetchCourses();
  }, [getAllCourses]);

  const filteredCourses = courses.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.title?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.teacher?.name?.toLowerCase().includes(q)
    );
  });

  if (loading) return <div>Loading courses...</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">All Courses</h2>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search courses..."
        className="px-4 py-2 w-full max-w-md border border-gray-300 rounded focus:outline-none mb-4"
      />
      <table className="w-full bg-white rounded-xl shadow overflow-x-auto">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 text-left">Title</th>
            <th className="px-4 py-2 text-left">Description</th>
            <th className="px-4 py-2 text-left">Instructor</th>
            <th className="px-4 py-2 text-left">Credits</th>
            <th className="px-4 py-2 text-left">Start</th>
            <th className="px-4 py-2 text-left">End</th>
          </tr>
        </thead>
        <tbody>
          {filteredCourses.map((c) => (
            <tr key={c._id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2 font-semibold">{c.title}</td>
              <td className="px-4 py-2">{c.description}</td>
              <td className="px-4 py-2">
                {c.teacher?.name || c.instructor || "N/A"}
              </td>
              <td className="px-4 py-2">{c.credits || "-"}</td>
              <td className="px-4 py-2">{c.startDate || "-"}</td>
              <td className="px-4 py-2">{c.endDate || "-"}</td>
            </tr>
          ))}
          {filteredCourses.length === 0 && (
            <tr>
              <td colSpan={6} className="text-gray-400 text-center py-6">
                No courses found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* =====================================================
   ⚙ SETTINGS TAB
===================================================== */
function AdminSettings() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">System Settings</h2>
      <p className="text-gray-600">
        There are currently no configurable settings.
      </p>
    </div>
  );
}
