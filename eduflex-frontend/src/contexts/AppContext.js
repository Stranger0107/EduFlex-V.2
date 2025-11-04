// src/contexts/AppContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../config/api';
import { toast } from 'react-toastify';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [authLoading, setAuthLoading] = useState(true); 

  // --- AUTH FUNCTIONS ---
  const loginUser = async (email, password) => {
    setAuthLoading(true); 
    try {
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

  useEffect(() => {
    const loadInitialUser = async () => {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        setToken(storedToken); 
        try { 
          const storedUser = localStorage.getItem('currentUser');
          if(storedUser) setUser(JSON.parse(storedUser)); 
        } catch { 
          localStorage.removeItem('currentUser'); 
        }
        try {
          const { data } = await api.get('/auth/me');
          setUser(data);
          localStorage.setItem('currentUser', JSON.stringify(data));
        } catch (error) {
          console.error("Token verification failed.");
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
          setToken(null);
          setUser(null);
        }
      }
      setAuthLoading(false); 
    };
    loadInitialUser();
  }, []); 

  // --- API FUNCTIONS ---

  // --- General ---
  const fetchAllCourses = useCallback(async () => { 
    try {
      const { data } = await api.get('/courses');
      return data;
    } catch (error) { console.error("API: fetchAllCourses failed", error); return []; }
  }, []);

  // --- Student ---
  const fetchMyStudentCourses = useCallback(async () => { /* ... */ }, []);
  const fetchMyGrades = useCallback(async () => { /* ... */ }, []);
  const submitAssignment = async (assignmentId, submissionText) => { /* ... */ };

  // --- Professor ---
  const fetchMyProfessorCourses = useCallback(async () => { 
    try {
      const { data } = await api.get('/professor/courses');
      return data;
    } catch (error) { console.error("API: fetchMyProfessorCourses failed", error); return []; }
  }, []);
  const fetchProfessorAssignments = useCallback(async () => { 
    try {
      const { data } = await api.get('/professor/assignments');
      return data;
    } catch (error) { console.error("API: fetchProfessorAssignments failed", error); return []; }
  }, []);
  const fetchProfessorCourseById = useCallback(async (courseId) => { 
    try {
      const { data } = await api.get(`/professor/courses/${courseId}`);
      return data;
    } catch (error) { console.error("API: fetchProfessorCourseById failed", error); return null; }
  }, []);
  const fetchAssignmentsForCourse = useCallback(async (courseId) => { 
    try {
      const { data } = await api.get(`/assignments/course/${courseId}`);
      return data;
    } catch (error) { console.error("API: fetchAssignmentsForCourse failed", error); return []; }
  }, []);
  const createProfessorCourse = async (courseData) => { 
    try {
      const { data } = await api.post('/professor/courses', courseData);
      return data;
    } catch (error) { console.error("API: createProfessorCourse failed", error); return null; }
  };
  const updateProfessorCourse = async (courseId, updateData) => { 
    try {
      const { data } = await api.put(`/professor/courses/${courseId}`, updateData);
      return data;
    } catch (error) { console.error("API: updateProfessorCourse failed", error); return null; }
  };
  const deleteProfessorCourse = async (courseId) => { 
    try {
      await api.delete(`/professor/courses/${courseId}`);
      return true;
    } catch (error) { console.error("API: deleteProfessorCourse failed", error); return false; }
  };
  const gradeSubmission = async (assignmentId, studentId, grade, feedback) => { /* ... */ };
  const updateUserProfile = async (profileData) => { /* ... */ };
  const createAssignment = async (assignmentData) => { 
    try {
      const { data } = await api.post('/assignments', assignmentData);
      return data;
    } catch (error) { console.error("API: createAssignment failed", error); return null; }
  };

  // --- Admin Routes ---
  const fetchAllUsersAdmin = useCallback(async () => { 
    try {
      const { data } = await api.get('/admin/users');
      return data;
    } catch (error) { console.error("API: fetchAllUsersAdmin failed", error); return []; }
  }, []);
  const createCourse = async (courseData) => { /* ... */ }; // This is for ADMIN
  const updateCourse = async (courseId, updateData) => { /* ... */ }; // This is for ADMIN
  const deleteCourse = async (courseId) => { /* ... */ }; // This is for ADMIN
  const createUser = async (userData) => { 
    try {
      const { data } = await api.post('/admin/users', userData);
      return data;
    } catch (error) { console.error("API: createUser failed", error); return null; }
  };

  const value = {
    user,
    token,
    authLoading,
    loginUser,
    logoutUser,
    fetchAllUsersAdmin, 
    createUser, 
    createCourse, 
    updateCourse,
    deleteCourse,
    fetchMyStudentCourses, 
    fetchMyGrades, 
    submitAssignment,
    fetchMyProfessorCourses,
    fetchProfessorAssignments,
    gradeSubmission,
    updateUserProfile,
    createProfessorCourse, // <-- Now correctly provided
    updateProfessorCourse, // <-- Now correctly provided
    deleteProfessorCourse, // <-- Now correctly provided
    fetchProfessorCourseById, // <-- Now correctly provided
    fetchAssignmentsForCourse, // <-- Now correctly provided
    createAssignment, // <-- Now correctly provided
    fetchAllCourses
  };

  return (
    <AppContext.Provider value={value}>
      {authLoading ? <div className="flex justify-center items-center h-screen">Initializing Session...</div> : children}
    </AppContext.Provider>
  );
};