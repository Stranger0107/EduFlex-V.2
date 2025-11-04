// src/App.js
import { BrowserRouter as Router, Routes, Route, useLocation, Link, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "./contexts/AppContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Toast from "./components/Toast";
import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Courses from "./pages/Courses";
import Assignments from "./pages/Assignments";
import Grades from "./pages/Grades";
import User from "./pages/User";
import TakeQuiz from "./pages/TakeQuiz";
import CourseDetail from "./pages/CourseDetail";

// Professor imports
import ProfessorProfile from "./professor/ProfessorProfile";
import ProfessorSidebar from "./professor/ProfessorSidebar";
import ProfessorDashboard from "./professor/ProfessorDashboard";
import ProfessorCourses from "./professor/ProfessorCourses";
import ProfessorAssignments from "./professor/ProfessorAssignments";
import ProfessorCourseDetail from "./professor/ProfessorCourseDetail";
import ProfessorAssignmentDetail from "./professor/ProfessorAssignmentDetail";
import ProfessorQuizEditor from "./professor/ProfessorQuizEditor";

// Admin imports 
// Import the components *directly*
import AdminDashboard from './admin/AdminDashboard';
import AdminUsers from './admin/AdminUsers';
import AdminCourses from './admin/AdminCourses';
import AdminSidebar from "./admin/AdminSidebar"; 

function AppWrapper() {
  const location = useLocation();
  const { user } = useApp();

  // Role-based sidebar logic
  const showStudentSidebar = user && user.role === "student" && location.pathname !== "/";
  const showProfessorSidebar = user && user.role === "professor" && location.pathname.startsWith("/professor");
  const showAdminSidebar = user && user.role === "admin" && location.pathname.startsWith("/admin");

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Student sidebar */}
      {showStudentSidebar && (
        <>
          <div className="hidden md:block">
            <Sidebar />
          </div>
          <div className="md:hidden">
            <MobileNav />
          </div>
        </>
      )}
      {/* Professor sidebar */}
      {showProfessorSidebar && (
        <>
          <div className="hidden md:block">
            <ProfessorSidebar />
          </div>
        </>
      )}
      {/* Admin sidebar */}
      {showAdminSidebar && (
        <>
          <div className="hidden md:block">
            <AdminSidebar />
          </div>
        </>
      )}

      <div 
        style={{ 
          flex: 1,
          marginTop: (showStudentSidebar || showProfessorSidebar || showAdminSidebar) ? "0" : "0",
          padding: (showStudentSidebar || showProfessorSidebar || showAdminSidebar) ? "2rem" : "0",
          paddingLeft: (showStudentSidebar || showProfessorSidebar || showAdminSidebar) ? "5rem" : "0",
          background: "#f9fafb",
          minHeight: "100vh"
        }}
        className={(showStudentSidebar || showProfessorSidebar || showAdminSidebar) ? "md:pl-20" : ""}
      >
        <Routes>
          {/* PUBLIC LOGIN */}
          <Route path="/" element={<Login />} />

          {/* STUDENT ROUTES */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/courses/:courseId/quizzes/:quizId" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <TakeQuiz />
            </ProtectedRoute>
          } />
          <Route path="/courses/:courseId" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <CourseDetail />
            </ProtectedRoute>
          } />
          <Route path="/user" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <User />
            </ProtectedRoute>
          } />
          <Route path="/courses" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <Courses />
            </ProtectedRoute>
          } />
          <Route path="/assignments" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <Assignments />
            </ProtectedRoute>
          } />
          <Route path="/grades" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <Grades />
            </ProtectedRoute>
          } />

          {/* PROFESSOR ROUTES */}
          <Route path="/professor/profile" element={
            <ProtectedRoute allowedRoles={["professor"]}>
              <ProfessorProfile />
            </ProtectedRoute>
          } />
          <Route path="/professor/courses/:courseId/quizzes/:quizId" element={
            <ProtectedRoute allowedRoles={["professor"]}>
              <ProfessorQuizEditor />
            </ProtectedRoute>
          } />
          <Route path="/professor/dashboard" element={
            <ProtectedRoute allowedRoles={["professor"]}>
              <ProfessorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/professor/courses" element={
            <ProtectedRoute allowedRoles={["professor"]}>
              <ProfessorCourses />
            </ProtectedRoute>
          } />
          <Route path="/professor/courses/:courseId" element={
            <ProtectedRoute allowedRoles={["professor"]}>
              <ProfessorCourseDetail />
            </ProtectedRoute>
          } />
          <Route path="/professor/assignments/:assignmentId" element={
            <ProtectedRoute allowedRoles={["professor"]}>
              <ProfessorAssignmentDetail />
            </ProtectedRoute>
          } />
          <Route path="/professor/assignments" element={
            <ProtectedRoute allowedRoles={["professor"]}>
              <ProfessorAssignments />
            </ProtectedRoute>
          } />

          {/* ADMIN ROUTES - *** THIS SECTION IS NOW FIXED *** */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard /> 
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminUsers />
            </ProtectedRoute>
          } />
          <Route path="/admin/courses" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminCourses />
            </ProtectedRoute>
          } />
          {/* This redirect handles the base /admin path */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          
          {/* NOT FOUND ROUTE */}
          <Route path="*" element={
            <div className="flex justify-center items-center h-screen">
              <div>
                <h1 className="text-3xl font-bold">404 - Not Found</h1>
                <Link to="/" className="text-green-600 hover:underline">Go Home</Link>
              </div>
            </div>
          } />
        </Routes>
      </div>

      <Toast />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppProvider>
        <AppWrapper />
      </AppProvider>
    </Router>
  );
}

export default App;