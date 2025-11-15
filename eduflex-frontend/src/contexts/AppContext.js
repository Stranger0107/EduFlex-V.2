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

  // =============================
  // 🔐 AUTH FUNCTIONS
  // =============================
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
      } else {
        toast.error('Failed to login.');
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
          if (storedUser) setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem('currentUser');
        }
        try {
          const { data } = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
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

  // =============================
  // 📚 COURSE FUNCTIONS (ALL USERS)
  // =============================

  const fetchCourseById = useCallback(async (courseId) => {
    try {
      const { data } = await api.get(`/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (error) {
      console.error("API: fetchCourseById failed", error);
      toast.error("Failed to load course details.");
      return null;
    }
  }, [token]);

  const fetchAllCourses = useCallback(async () => {
  try {
    const { data } = await api.get('/courses', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (error) {
    console.error("API: fetchAllCourses failed", error);
    toast.error("Failed to fetch courses.");
    return [];
  }
}, [token]);


  const getAllCourses = useCallback(async () => {
    try {
      const { data } = await api.get('/courses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (error) {
      console.error("API: getAllCourses failed", error);
      toast.error("Failed to fetch courses.");
      return [];
    }
  }, [token]);

  const enrollInCourse = async (courseId) => {
    try {
      const { data } = await api.post(`/courses/${courseId}/enroll`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Enrolled successfully!");
      return data;
    } catch (error) {
      console.error("API: enrollInCourse failed", error);
      toast.error("Failed to enroll in course.");
      throw error;
    }
  };

  const unenrollFromCourse = async (courseId) => {
    try {
      const { data } = await api.post(`/courses/${courseId}/unenroll`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Unenrolled successfully!");
      return data;
    } catch (error) {
      console.error("API: unenrollFromCourse failed", error);
      toast.error("Failed to unenroll from course.");
      throw error;
    }
  };

  // =============================
  // 🧑‍🎓 STUDENT FUNCTIONS
  // =============================

  const fetchStudentDashboard = useCallback(async () => {
    try {
      const { data } = await api.get('/student/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (error) {
      console.error("API: fetchStudentDashboard failed", error);
      toast.error("Failed to load student dashboard.");
      return { totalCourses: 0, pendingAssignments: 0, averageGrade: 0 };
    }
  }, [token]);

  const getMyStudentCourses = useCallback(async () => {
    try {
      const { data } = await api.get('/student/courses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (error) {
      console.error("API: getMyStudentCourses failed", error);
      toast.error("Failed to fetch enrolled courses.");
      return [];
    }
  }, [token]);

  const fetchMyGrades = useCallback(async () => {
    try {
      const { data } = await api.get('/student/grades', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (error) {
      console.error("API: fetchMyGrades failed", error);
      toast.error("Failed to load grades.");
      return [];
    }
  }, [token]);

  // ✅ FIX: Robust submission handler
  const submitAssignment = async (assignmentId, submissionData) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // If sending FormData (file upload), delete Content-Type so the browser sets the boundary
      if (submissionData instanceof FormData) {
        // This is the critical fix:
        delete config.headers['Content-Type']; 
      }

      const { data } = await api.post(
        `/student/assignments/${assignmentId}/submit`,
        submissionData,
        config
      );
      toast.success("Assignment submitted successfully!");
      return data;
    } catch (error) {
      console.error("API: submitAssignment failed", error);
      const msg = error.response?.data?.message || error.message;
      toast.error(`Submit failed: ${msg}`);
      throw error;
    }
  };

  const fetchStudentAssignments = useCallback(async () => {
    try {
      const { data } = await api.get('/student/assignments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (error) {
      console.error('API: fetchStudentAssignments failed', error);
      toast.error('Failed to fetch student assignments.');
      return [];
    }
  }, [token]);

  // Used for the Grades page specifically
  const getStudentGrades = useCallback(async () => {
    try {
      const { data } = await api.get('/student/assignments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data.filter(a => a.status === 'graded').map(a => ({
        id: a.assignmentId,
        assignment: a.title,
        course: a.course,
        grade: a.grade >= 90 ? 'A' : a.grade >= 80 ? 'B' : a.grade >= 70 ? 'C' : a.grade >= 60 ? 'D' : 'F',
        score: `${a.grade}%`,
        date: a.due
      }));
    } catch (error) {
      console.error("API: getStudentGrades failed", error);
      return [];
    }
  }, [token]);


  // =============================
  // 👨‍🏫 PROFESSOR FUNCTIONS
  // =============================

  const fetchMyProfessorCourses = useCallback(async () => {
    try {
      const { data } = await api.get('/professor/courses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (error) {
      console.error("API: fetchMyProfessorCourses failed", error);
      return [];
    }
  }, [token]);

  const fetchProfessorAssignments = useCallback(async () => {
    try {
      const { data } = await api.get('/professor/assignments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (error) {
      console.error("API: fetchProfessorAssignments failed", error);
      return [];
    }
  }, [token]);

  const fetchProfessorCourseById = useCallback(async (courseId) => {
    try {
      const { data } = await api.get(`/professor/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (error) {
      console.error("API: fetchProfessorCourseById failed", error);
      return null;
    }
  }, [token]);

  const fetchAssignmentsForCourse = useCallback(async (courseId) => {
    try {
      const { data } = await api.get(`/assignments/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (error) {
      console.error("API: fetchAssignmentsForCourse failed", error);
      return [];
    }
  }, [token]);

  const getEnrolledStudents = async (courseId) => {
    try {
      const { data } = await api.get(`/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data.students || [];
    } catch (error) {
      console.error("API: getEnrolledStudents failed", error);
      return [];
    }
  };

  const createProfessorCourse = async (courseData) => {
    try {
      const { data } = await api.post('/professor/courses', courseData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Course created!");
      return data;
    } catch (error) {
      console.error("API: createProfessorCourse failed", error);
      toast.error("Failed to create course.");
      return null;
    }
  };

  const updateProfessorCourse = async (courseId, updateData) => {
    try {
      const { data } = await api.put(`/professor/courses/${courseId}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Course updated!");
      return data;
    } catch (error) {
      console.error("API: updateProfessorCourse failed", error);
      toast.error("Failed to update course.");
      return null;
    }
  };

  const deleteProfessorCourse = async (courseId) => {
    try {
      await api.delete(`/professor/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Course deleted!");
      return true;
    } catch (error) {
      console.error("API: deleteProfessorCourse failed", error);
      toast.error("Failed to delete course.");
      return false;
    }
  };

  const gradeSubmission = async (assignmentId, studentId, { grade, feedback }) => {
    try {
      const { data } = await api.post(
        `/professor/assignments/${assignmentId}/grade`,
        { studentId, grade, feedback },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Submission graded successfully!");
      return data;
    } catch (error) {
      console.error("API: gradeSubmission failed", error);
      toast.error("Failed to grade submission.");
      return null;
    }
  };

  const uploadStudyMaterial = async (courseId, materialData) => {
    try {
      const { data } = await api.post(`/professor/courses/${courseId}/materials`, materialData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Study material uploaded!");
      return data;
    } catch (error) {
      console.error("API: uploadStudyMaterial failed", error);
      toast.error("Failed to upload material.");
      return null;
    }
  };

  // =============================
  // 🧠 QUIZ FUNCTIONS
  // =============================
  const createQuiz = async (quizData) => {
    try {
      const { data } = await api.post(`/quizzes`, quizData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Quiz created!");
      return data;
    } catch (error) {
      console.error("API: createQuiz failed", error);
      toast.error("Failed to create quiz.");
      return null;
    }
  };

  const fetchQuizzesForCourse = async (courseId) => {
    try {
      const { data } = await api.get(`/quizzes/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (error) {
      console.error("API: fetchQuizzesForCourse failed", error);
      toast.error("Failed to load quizzes.");
      return [];
    }
  };

  const fetchQuizById = async (quizId) => {
    try {
      const { data } = await api.get(`/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (error) {
      console.error("API: fetchQuizById failed", error);
      toast.error("Failed to load quiz.");
      return null;
    }
  };

  const submitQuiz = async (quizId, answers) => {
    try {
      const { data } = await api.post(
        `/quizzes/${quizId}/submit`,
        { answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data;
    } catch (error) {
      console.error("API: submitQuiz failed", error);
      toast.error("Failed to submit quiz.");
      return null;
    }
  };

  // =============================
  // 🛠️ ADMIN FUNCTIONS
  // =============================
  const fetchAllUsersAdmin = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (error) {
      console.error("API: fetchAllUsersAdmin failed", error);
      return [];
    }
  }, [token]);

  const createUser = async (userData) => {
    try {
      const { data } = await api.post('/admin/users', userData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("User created!");
      return data;
    } catch (error) {
      console.error("API: createUser failed", error);
      toast.error("Failed to create user.");
      return null;
    }
  };

  const createCourse = async (courseData) => {
    try {
      const { data } = await api.post('/admin/courses', courseData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Course created by admin!");
      return data;
    } catch (error) {
      console.error("API: createCourse failed", error);
      toast.error("Failed to create course.");
      return null;
    }
  };

  const updateCourse = async (courseId, updateData) => {
    try {
      const { data } = await api.put(`/admin/courses/${courseId}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Course updated by admin!");
      return data;
    } catch (error) {
      console.error("API: updateCourse failed", error);
      toast.error("Failed to update course.");
      return null;
    }
  };

  const deleteCourse = async (courseId) => {
    try {
      await api.delete(`/admin/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Course deleted by admin!");
      return true;
    } catch (error) {
      console.error("API: deleteCourse failed", error);
      toast.error("Failed to delete course.");
      return false;
    }
  };

  // =============================
  // 👤 PROFILE FUNCTIONS
  // =============================
  const updateUserProfile = async (profileData) => {
    try {
      const { data } = await api.put('/professor/profile', profileData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(data);
      localStorage.setItem('currentUser', JSON.stringify(data));
      toast.success('Profile updated successfully!');
      return data;
    } catch (error) {
      console.error("API: updateUserProfile failed", error);
      toast.error(error.response?.data?.error || "Failed to update profile");
      return null;
    }
  };

  const createAssignment = async (assignmentData, isMultipart = false) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      // ✅ CRITICAL FIX: Delete Content-Type so browser sets multipart boundary
      if (isMultipart || assignmentData instanceof FormData) {
        delete headers['Content-Type'];
      }

      const { data } = await api.post("/assignments", assignmentData, { headers });
      toast.success("Assignment created!");
      return data;
    } catch (error) {
      console.error("API: createAssignment failed", error);
      toast.error("Failed to create assignment.");
      return null;
    }
  };


  // =============================
  // 🌍 CONTEXT VALUE
  // =============================
  const value = {
    user,
    token,
    authLoading,
    loginUser,
    logoutUser,
    getAllCourses,
    getMyStudentCourses,
    enrollInCourse,
    unenrollFromCourse,
    fetchCourseById,
    fetchAllCourses,
    fetchStudentDashboard,
    fetchMyGrades,
    submitAssignment,
    fetchStudentAssignments,
    getStudentGrades,
    fetchMyProfessorCourses,
    fetchProfessorAssignments,
    fetchProfessorCourseById,
    fetchAssignmentsForCourse,
    getEnrolledStudents,
    createProfessorCourse,
    updateProfessorCourse,
    deleteProfessorCourse,
    gradeSubmission,
    uploadStudyMaterial,
    fetchAllUsersAdmin,
    createUser,
    createCourse,
    updateCourse,
    deleteCourse,
    updateUserProfile,
    createAssignment,
    // ✅ QUIZZES
    createQuiz,
    fetchQuizzesForCourse,
    fetchQuizById,
    submitQuiz,
  };

  return (
    <AppContext.Provider value={value}>
      {authLoading ? (
        <div className="flex justify-center items-center h-screen">
          Initializing Session...
        </div>
      ) : (
        children
      )}
    </AppContext.Provider>
  );
};