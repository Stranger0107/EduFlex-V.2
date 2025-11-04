// src/components/Sidebar.js
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaTachometerAlt, FaCogs, FaUser, FaBook, FaChalkboardTeacher, FaSignOutAlt } from "react-icons/fa";
import { useApp } from "../contexts/AppContext";
import { toast } from 'react-toastify';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logoutUser } = useApp();

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: <FaTachometerAlt /> },
    { name: "User", path: "/user", icon: <FaUser /> },
    { name: "Courses", path: "/courses", icon: <FaBook /> },
    { name: "Assignments", path: "/assignments", icon: <FaCogs /> },
    { name: "Grades", path: "/grades", icon: <FaChalkboardTeacher /> },
  ];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logoutUser();
      toast.success('Logged out successfully!');
      navigate('/');
    }
  };

  return (
    <div className="fixed top-0 left-0 h-screen w-16 bg-gradient-to-b from-green-500 to-green-700 text-white flex flex-col p-4 overflow-hidden group hover:w-64 transition-all duration-500 shadow-xl rounded-r-2xl z-50">
      <h1 className="text-2xl font-bold mb-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
        EduFlex
      </h1>
      
      {menuItems.map((item) => (
        <Link
          key={item.name}
          to={item.path}
          className={`mb-4 py-2 px-2 flex items-center rounded transition-all duration-300 overflow-hidden ${
            location.pathname === item.path 
              ? 'bg-green-600 shadow-lg' 
              : 'hover:bg-green-500'
          }`}
        >
          <span className="text-xl transform transition-transform duration-300 group-hover:scale-110 min-w-[24px]">
            {item.icon}
          </span>
          <span className="ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap">
            {item.name}
          </span>
        </Link>
      ))}

      {/* Logout Button */}
      <div className="mt-auto">
        <button
          onClick={handleLogout}
          className="w-full py-2 px-2 flex items-center rounded hover:bg-red-500 transition-all duration-300 overflow-hidden"
        >
          <span className="text-xl transform transition-transform duration-300 group-hover:scale-110 min-w-[24px]">
            <FaSignOutAlt />
          </span>
          <span className="ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap">
            Logout
          </span>
        </button>
      </div>
    </div>
  );
}
