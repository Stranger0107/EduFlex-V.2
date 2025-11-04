// src/components/MobileNav.js
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaTachometerAlt, FaBook, FaCogs, FaUser, FaBars, FaTimes, FaChartLine, FaSignOutAlt } from "react-icons/fa";
import { useApp } from "../contexts/AppContext";
import { toast } from 'react-toastify';

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logoutUser } = useApp();

  // You can add logic here to only show tabs for students/professors/admin by checking user.role
  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: <FaTachometerAlt /> },
    { name: "User", path: "/user", icon: <FaUser /> },
    { name: "Courses", path: "/courses", icon: <FaBook /> },
    { name: "Assignments", path: "/assignments", icon: <FaCogs /> },
    { name: "Grades", path: "/grades", icon: <FaChartLine /> },
  ];

  const handleLogout = () => {
    setIsOpen(false);
    if (window.confirm('Are you sure you want to logout?')) {
      logoutUser();
      toast.success('Logged out successfully!');
      navigate('/');
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-700 text-white p-4 flex justify-between items-center shadow-lg fixed top-0 left-0 right-0 z-40">
        <h1 className="text-xl font-bold">EduFlex</h1>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-2xl hover:text-green-200 transition-colors"
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Spacer for fixed header */}
      <div style={{ height: "64px" }}></div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed top-0 right-0 h-full w-64 bg-gradient-to-b from-green-500 to-green-700 shadow-lg z-50 transform transition-transform">
            <div className="p-4">
              <div className="flex justify-between items-center mb-6 pt-2">
                <h2 className="text-lg font-bold text-white">Menu</h2>
                <button onClick={() => setIsOpen(false)}>
                  <FaTimes className="text-white hover:text-green-200 text-xl" />
                </button>
              </div>

              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      location.pathname === item.path
                        ? "bg-white bg-opacity-20 text-white"
                        : "text-green-100 hover:bg-white hover:bg-opacity-10"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </Link>
                ))}

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-green-100 hover:bg-red-500 hover:bg-opacity-80"
                >
                  <span className="text-lg"><FaSignOutAlt /></span>
                  <span className="font-medium">Logout</span>
                </button>
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  );
}
