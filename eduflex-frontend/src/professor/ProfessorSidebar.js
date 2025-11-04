import { Link, useLocation } from "react-router-dom";
import { FaChalkboardTeacher, FaClipboardList, FaFolder, FaSignOutAlt } from 'react-icons/fa';
import { useApp } from "../contexts/AppContext";
import { FaUserCircle } from "react-icons/fa";


export default function ProfessorSidebar() {
  const location = useLocation();
  const { logoutUser } = useApp();

  const menuItems = [
    {name: "Dashboard", icon: <FaChalkboardTeacher/>, path: "/professor/dashboard"},
    {name: "Courses", icon: <FaFolder/>, path: "/professor/courses"},
    {name: "Assignments", icon: <FaClipboardList/>, path: "/professor/assignments"},
    // Inside menuItems array
{ name: "Profile", icon: <FaUserCircle />, path: "/professor/profile" }
// (Import FaUserCircle from react-icons/fa if needed)
  ];

  return (
    <div className="fixed top-0 left-0 h-screen w-16 bg-gradient-to-b from-indigo-500 to-indigo-700 text-white flex flex-col p-4 overflow-hidden group hover:w-64 transition-all duration-500 shadow-xl rounded-r-2xl z-50">
      <h1 className="text-2xl font-bold mb-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
        Prof. Panel
      </h1>
      {menuItems.map(item => (
        <Link key={item.path}
          to={item.path}
          className={`mb-4 py-2 px-2 flex items-center rounded transition-all duration-300 overflow-hidden
            ${location.pathname === item.path ? "bg-indigo-600 shadow-lg" : "hover:bg-indigo-500"}`}
          >
            <span className="text-xl min-w-[24px]">{item.icon}</span>
            <span className="ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap">{item.name}</span>
        </Link>
      ))}
      <div className="mt-auto">
        <button
          onClick={logoutUser}
          className="w-full py-2 px-2 flex items-center rounded hover:bg-red-500 transition-all duration-300 overflow-hidden"
        >
          <span className="text-xl min-w-[24px]"><FaSignOutAlt /></span>
          <span className="ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap">Logout</span>
        </button>
      </div>
    </div>
  );
}
