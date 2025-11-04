// src/components/ProtectedRoute.js
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { token, user, authLoading } = useApp(); // Use authLoading
  const location = useLocation();

  if (authLoading) {
    // Show a loading indicator while checking auth state
    return (
        <div className="flex justify-center items-center h-screen text-gray-600">
            Checking session...
        </div>
    );
  }

  // 1. Check if user is logged in (token exists AND user object exists after loading)
  if (!token || !user) {
    // Not logged in after check, redirect to login page ('/')
    // Save the current location they were trying to go to in state
    // so Login page can redirect them back after successful login.
    console.log("Not logged in, redirecting to login. Attempted path:", location.pathname);
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // 2. Check if the user's role is allowed for this route
  if (allowedRoles && !allowedRoles.includes(user.role)) {
     // User is logged in but doesn't have the right role
     console.warn(`Access denied for role: ${user.role} to path: ${location.pathname}. Redirecting to default dashboard.`);
     // Redirect to a relevant dashboard based on their actual role
     let defaultPath = '/'; // Default to login if role unknown
     if (user.role === 'student') defaultPath = '/dashboard';
     if (user.role === 'professor') defaultPath = '/professor/dashboard';
     if (user.role === 'admin') defaultPath = '/admin/dashboard';
     return <Navigate to={defaultPath} replace />;
  }

  // If logged in and role is allowed (or no specific roles required), render the child component
  return children;
}