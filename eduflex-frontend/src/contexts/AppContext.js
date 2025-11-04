// src/contexts/AppContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../config/api'; // Use the configured Axios instance
import { toast } from 'react-toastify';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};

export const AppProvider = ({ children }) => {
  // Authentication State
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [authLoading, setAuthLoading] = useState(true); // Loading for initial auth check

  // Data State (Add placeholders for data to be fetched later)
  const [allCourses, setAllCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [myAssignments, setMyAssignments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [dataLoading, setDataLoading] = useState({
      courses: false,
      assignments: false,
      users: false,
  });

   // --- Authentication ---

  const loginUser = async (email, password) => {
    setAuthLoading(true); // Indicate loading start
    try {
      // Make the API call to the backend login endpoint
      const { data } = await api.post('/auth/login', { email, password });

      // Check if response includes token and user data
      if (data.token && data.user) {
        // Store token and user data in localStorage
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user)); // Store user object

        // Update React state
        setToken(data.token);
        setUser(data.user); // Store the full user object from response

        toast.success(`Welcome back, ${data.user.name}!`);
        setAuthLoading(false);
        return data.user; // Return user data for successful login
      } else {
        throw new Error("Login response missing token or user data.");
      }
    } catch (error) {
      // Error is logged/toasted by Axios interceptor
      console.error('Login failed in context:', error);
      setAuthLoading(false);
      return null; // Return null to indicate login failure
    }
  };

  const logoutUser = useCallback(() => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      setToken(null);
      setUser(null);
      // Clear data state
      setAllCourses([]);
      setMyCourses([]);
      setMyAssignments([]);
      setAllUsers([]);
      toast.info('You have been logged out.');
      // Navigation should happen in the component calling this
    }
  }, []);

  // Effect to load user info on initial app load if token exists
  useEffect(() => {
    const loadInitialUser = async () => {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('currentUser');

      if (storedToken) {
        setToken(storedToken); // Set token state
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser)); // Set user state from storage
          } catch {
            localStorage.removeItem('currentUser'); // Clear invalid JSON
          }
        }
        // Optional: Verify token with /auth/me to ensure it's still valid
        // and get fresh user data (especially role)
        try {
            console.log("Verifying token with /auth/me...");
            const { data } = await api.get('/auth/me');
            // Update user state and storage if data differs or was missing
            if (!storedUser || JSON.parse(storedUser)._id !== data._id || JSON.parse(storedUser).role !== data.role) {
               console.log("Updating stored user data from /auth/me");
               setUser(data);
               localStorage.setItem('currentUser', JSON.stringify(data));
            }
        } catch (error) {
            // Interceptor handles 401 (invalid token -> logout)
            console.error("Token verification failed or token expired.");
            // Explicitly clear state if /me fails for safety
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            setToken(null);
            setUser(null);
        }
      }
      setAuthLoading(false); // Finished initial loading attempt
    };
    loadInitialUser();
  }, []); // Run only once on mount

    // --- Placeholder API Call Functions --- (Keep these as placeholders for now)
    const fetchAllCourses = useCallback(async () => { console.warn("API: fetchAllCourses not implemented"); return []; }, []);
    const fetchMyStudentCourses = useCallback(async () => { console.warn("API: fetchMyStudentCourses not implemented"); return []; }, []);
    const fetchMyProfessorCourses = useCallback(async () => { console.warn("API: fetchMyProfessorCourses not implemented"); return []; }, []);
    const fetchMyGrades = useCallback(async () => { console.warn("API: fetchMyGrades not implemented"); return []; }, []);
    const fetchProfessorAssignments = useCallback(async () => { console.warn("API: fetchProfessorAssignments not implemented"); return []; }, []);
    const createCourse = async (courseData) => { console.warn("API: createCourse not implemented"); throw new Error("Not implemented"); };
    const updateCourse = async (courseId, updateData) => { console.warn("API: updateCourse not implemented"); throw new Error("Not implemented"); };
    const deleteCourse = async (courseId) => { console.warn("API: deleteCourse not implemented"); throw new Error("Not implemented"); };
    const createAssignment = async (assignmentData) => { console.warn("API: createAssignment not implemented"); throw new Error("Not implemented"); };
    const submitAssignment = async (assignmentId, submissionText) => { console.warn("API: submitAssignment not implemented"); throw new Error("Not implemented"); };
    const gradeSubmission = async (assignmentId, studentId, grade, feedback) => { console.warn("API: gradeSubmission not implemented"); throw new Error("Not implemented"); };
    const fetchAllUsersAdmin = useCallback(async () => { console.warn("API: fetchAllUsersAdmin not implemented"); return []; }, []);
    const createUser = async (userData) => { console.warn("API: createUser not implemented"); throw new Error("Not implemented"); };
    const updateUserProfile = async (profileData) => { console.warn("API: updateUserProfile not implemented"); throw new Error("Not implemented"); };


  // --- Value passed to consumers ---
  const value = {
    user,
    token,
    authLoading,
    dataLoading, // Keep for future data loading states
    loginUser,
    logoutUser,

    // Include placeholders for now
    allCourses, myCourses, myAssignments, allUsers,
    fetchAllCourses, fetchMyStudentCourses, fetchMyProfessorCourses,
    fetchMyGrades, fetchProfessorAssignments, createCourse, updateCourse,
    deleteCourse, createAssignment, submitAssignment, gradeSubmission,
    fetchAllUsersAdmin, createUser, updateUserProfile,
  };

  // Render provider - show global loading only during initial auth check
  return (
    <AppContext.Provider value={value}>
      {authLoading ? <div className="flex justify-center items-center h-screen">Initializing Session...</div> : children}
    </AppContext.Provider>
  );
};