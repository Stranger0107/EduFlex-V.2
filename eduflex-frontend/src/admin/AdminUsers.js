// src/admin/AdminUsers.js
import React, { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";
import { toast } from "react-toastify";

export default function AdminUsers() {
  const { getAllUsers, createUser /*, deleteUserAPI */ } = useApp();

  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // For create user modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const fetchedUsers = await getAllUsers();
        setUsers(fetchedUsers || []);
      } catch (err) {
        toast.error("Failed to load users.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [getAllUsers]);

  // Optionally implement user delete
  // const handleDelete = async (userId) => { ... };

  // Filtering
  const filteredUsers = users.filter(u =>
    roleFilter === "all" ? true : u.role === roleFilter
  );

  // Creating
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
    try {
      await createUser(form);
      setForm({ name: "", email: "", password: "", role: "student" });
      setShowModal(false);
      toast.success("User created!");
      // Refresh list
      const refreshedUsers = await getAllUsers();
      setUsers(refreshedUsers || []);
    } catch (err) {
      toast.error("Failed to create user.");
    }
  };

  return (
    <div className="p-8 pl-24 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
        <button
          className="bg-green-600 text-white px-5 py-2 rounded font-semibold hover:bg-green-700 transition"
          onClick={() => setShowModal(true)}
        >
          + Add New User
        </button>
      </div>
      <div className="mb-6 flex gap-4">
        <FilterButton filter={roleFilter} setFilter={setRoleFilter} role="all" label="All" />
        <FilterButton filter={roleFilter} setFilter={setRoleFilter} role="student" label="Students" />
        <FilterButton filter={roleFilter} setFilter={setRoleFilter} role="professor" label="Professors" />
        <FilterButton filter={roleFilter} setFilter={setRoleFilter} role="admin" label="Admins" />
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-80 text-lg">Loading users...</div>
      ) : (
        <table className="w-full bg-white rounded-xl shadow overflow-x-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Joined</th>
              {/* <th className="px-4 py-2"></th> */}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u._id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{u.name}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2 capitalize">{u.role}</td>
                <td className="px-4 py-2">{u.joinDate || "-"}</td>
                {/* <td className="px-4 py-2">
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    onClick={() => handleDelete(u._id)}
                  >
                    Delete
                  </button>
                </td> */}
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="text-gray-400 text-center py-6">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleCreateUser}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative"
          >
            <h3 className="text-xl font-semibold mb-4">Create New User</h3>
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
              <label className="block text-sm font-medium mb-1">Password</label>
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

function FilterButton({ filter, setFilter, role, label }) {
  return (
    <button
      className={`px-5 py-2 rounded font-medium ${filter === role
        ? "bg-green-700 text-white"
        : "bg-gray-200 text-gray-800"
      }`}
      onClick={() => setFilter(role)}
    >
      {label}
    </button>
  );
}
