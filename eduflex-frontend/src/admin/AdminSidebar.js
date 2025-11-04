import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaTachometerAlt, FaUsersCog, FaBook, FaSignOutAlt } from 'react-icons/fa';
import { useApp } from "../contexts/AppContext";

export default function AdminSidebar() {
  const location = useLocation();
  const { logoutUser } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/'); // Redirect to login
  };

  const menuItems = [
    { name: "Dashboard", icon: <FaTachometerAlt />, path: "/admin/dashboard" },
    { name: "User Management", icon: <FaUsersCog />, path: "/admin/dashboard" },
    { name: "Course Management", icon: <FaBook />, path: "/admin/dashboard" }
  ];

  return (
    <div className="fixed top-0 left-0 h-screen w-16 bg-gradient-to-b from-gray-700 to-gray-900 text-white flex flex-col p-4 overflow-hidden group hover:w-64 transition-all duration-300 shadow-xl rounded-r-lg z-50">
      <h1 className="text-2xl font-bold mb-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
        Admin Panel
      </h1>
      {menuItems.map(item => (
        <Link key={item.path}
          to={item.path}
          className={`mb-4 py-2 px-2 flex items-center rounded transition-all duration-300 overflow-hidden
            ${location.pathname === item.path ? "bg-gray-600 shadow-inner" : "hover:bg-gray-500 hover:bg-opacity-75"}`}
        >
          <span className="text-xl min-w-[24px] text-gray-300 group-hover:text-white">{item.icon}</span>
          <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">{item.name}</span>
        </Link>
      ))}
      <div className="mt-auto">
        <button
          onClick={handleLogout}
          className="w-full py-2 px-2 flex items-center rounded hover:bg-red-600 hover:bg-opacity-80 transition-all duration-300 overflow-hidden"
        >
          <span className="text-xl min-w-[24px] text-gray-300 group-hover:text-white"><FaSignOutAlt /></span>
          <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Logout</span>
        </button>
      </div>
    </div>
  );
}
