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

  // --- Authentication ---

  const loginUser = async (email, password) => {
    setAuthLoading(true); // Indicate loading start
    try {
      //
      const { data } = await api.post('/auth/login', { email, password });

      if (data.token && data.user) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user)); 

        setToken(data.token);
        setUser(data.user); 

        toast.success(`Welcome back, ${data.user.name}!`);
        setAuthLoading(false);
        return data.user; 
      } else {
        throw new Error("Login response missing token or user data.");
      }
    } catch (error) {
      console.error('Login failed in context:', error);
      // Specific toast for invalid credentials
      if (error.response?.status === 400 || error.response?.status === 401) {
        toast.error('Invalid email or password.');
      }
      setAuthLoading(false);
      return null; 
    }
  };

  const logoutUser = useCallback(() => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      setToken(null);
      setUser(null);
      toast.info('You have been logged out.');
    }
  }, []);

  // Effect to load user info on initial app load if token exists
  useEffect(() => {
    const loadInitialUser = async () => {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('currentUser');

      if (storedToken) {
        setToken(storedToken); 
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser)); 
          } catch {
            localStorage.removeItem('currentUser'); 
          }
        }
        
        try {
            console.log("Verifying token with /auth/me...");
          //
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

  // --- API Call Functions ---
  // These functions are provided to the app, but components will manage their own data/loading state.

  // --- General Course Routes ---
  const fetchAllCourses = useCallback(async () => { 
    try {
      //
      const { data } = await api.get('/courses');
      return data;
    } catch (error) {
      console.error("API: fetchAllCourses failed", error);
      return [];
    }
  }, []);

  // --- Student Routes ---
  const fetchMyStudentCourses = useCallback(async () => { 
    try {
      //
      const { data } = await api.get('/student/courses');
      return data;
    } catch (error) {
      console.error("API: fetchMyStudentCourses failed", error);
      return [];
    }
  }, []);

  const fetchMyGrades = useCallback(async () => { 
    try {
      //
      const { data } = await api.get('/student/grades');
      return data;
    } catch (error) {
      console.error("API: fetchMyGrades failed", error);
      return [];
    }
  }, []);
  
  const submitAssignment = async (assignmentId, submissionText) => { 
    try {
      //
      const { data } = await api.post(`/student/assignments/${assignmentId}/submit`, { submissionText });
      toast.success('Assignment submitted!');
      return data;
    } catch (error) {
      console.error("API: submitAssignment failed", error);
      return null;
    }
  };

  // --- Professor Routes ---
  const fetchMyProfessorCourses = useCallback(async () => { 
    try {
      //
      const { data } = await api.get('/professor/courses');
      return data;
    } catch (error) {
      console.error("API: fetchMyProfessorCourses failed", error);
      return [];
    }
  }, []);

  const fetchProfessorAssignments = useCallback(async () => { 
    try {
      //
      const { data } = await api.get('/professor/assignments');
      return data;
    } catch (error) {
      console.error("API: fetchProfessorAssignments failed", error);
      return [];
    }
  }, []);

  const createAssignment = async (assignmentData) => { 
    try {
      //
      const { data } = await api.post('/assignments', assignmentData);
      toast.success('Assignment created!');
      return data;
    } catch (error) {
      console.error("API: createAssignment failed", error);
      return null;
    }
  };

  const gradeSubmission = async (assignmentId, studentId, grade, feedback) => { 
    try {
      //
      const { data } = await api.post(`/professor/assignments/${assignmentId}/grade`, { studentId, grade, feedback });
      toast.success('Grade submitted!');
      return data;
    } catch (error) {
      console.error("API: gradeSubmission failed", error);
      return null;
    }
  };

  // --- Admin Routes ---
  const fetchAllUsersAdmin = useCallback(async () => { 
    try {
      //
      const { data } = await api.get('/admin/users');
      return data;
    } catch (error) {
      console.error("API: fetchAllUsersAdmin failed", error);
      return [];
    }
  }, []);

  const createCourse = async (courseData) => { 
    try {
      //
      const { data } = await api.post('/admin/courses', courseData);
      toast.success('Course created!');
      return data;
    } catch (error) {
      console.error("API: createCourse failed", error);
      return null;
    }
  };

  const updateCourse = async (courseId, updateData) => { 
    try {
      //
      const { data } = await api.put(`/admin/courses/${courseId}`, updateData);
      toast.success('Course updated!');
      return data;
    } catch (error) {
      console.error("API: updateCourse failed", error);
      return null;
    }
  };

  const deleteCourse = async (courseId) => { 
    try {
      //
      await api.delete(`/admin/courses/${courseId}`);
      toast.success('Course deleted!');
      return true;
    } catch (error) {
      console.error("API: deleteCourse failed", error);
      return false;
    }
  };

  const createUser = async (userData) => { 
    try {
      //
      const { data } = await api.post('/admin/users', userData);
      toast.success('User created!');
      return data;
    } catch (error) {
      console.error("API: createUser failed", error);
      return null;
    }
  };

  // --- General User Routes ---
  const updateUserProfile = async (profileData) => { 
    if (!user) return null;
    
    let url = '';
    if (user.role === 'student') {
      //
      url = '/student/profile'; 
    } else if (user.role === 'professor') {
      //
      url = '/professor/profile'; 
    } else {
      toast.error('Admins must update profiles via the Admin Panel.');
      return null;
    }

    try {
      const { data } = await api.put(url, profileData);
      setUser(data); // Update user state with new profile data
      localStorage.setItem('currentUser', JSON.stringify(data));
      toast.success('Profile updated!');
      return data;
    } catch (error) {
      console.error('Update profile failed', error);
      return null;
    }
  };


  // --- Value passed to consumers ---
  const value = {
    user,
    token,
    authLoading,
    loginUser,
    logoutUser,

    // --- API Functions ---
    fetchAllCourses, 
    fetchMyStudentCourses, 
    fetchMyProfessorCourses,
    fetchMyGrades, 
    fetchProfessorAssignments, 
    createCourse, 
    updateCourse,
    deleteCourse, 
    createAssignment, 
    submitAssignment, 
    gradeSubmission,
    fetchAllUsersAdmin, 
    createUser, 
    updateUserProfile,
  };

  // Render provider - show global loading only during initial auth check
  return (
    <AppContext.Provider value={value}>
      {authLoading ? <div className="flex justify-center items-center h-screen">Initializing Session...</div> : children}
    </AppContext.Provider>
  );
};