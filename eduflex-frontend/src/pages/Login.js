// src/pages/Login.js
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Import useLocation
import { useApp } from "../contexts/AppContext";
import { toast } from 'react-toastify';
import logo from "../assets/logo (2).png"; // Assuming you have this logo

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation(); // Get location to redirect after login if needed
  const { loginUser, user, authLoading } = useApp();

  // Redirect if user is already logged in (checked after initial load)
  useEffect(() => {
    if (!authLoading && user) {
      const from = location.state?.from?.pathname || getDefaultRedirectPath(user.role);
      console.log("User logged in, redirecting to:", from);
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, location.state]);

  // Helper function for default redirection path based on role
  const getDefaultRedirectPath = (role) => {
      if (role === 'professor') return '/professor/dashboard';
      if (role === 'student') return '/dashboard'; // Or '/courses'
      if (role === 'admin') return '/admin/dashboard';
      return '/'; // Fallback to login if role is unknown
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const loggedInUser = await loginUser(email, password); // Call context function

    if (loggedInUser) {
      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberMeEmail', email);
      } else {
        localStorage.removeItem('rememberMeEmail');
      }
      // Redirect is handled by useEffect after user state updates
    } else {
      // Login failed - error toast is shown by context/interceptor
      setIsSubmitting(false); // Stop loading indicator only on failure
    }
  };

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberMeEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

   // If initial auth check is happening, show loading
   if (authLoading) {
       return <div className="flex justify-center items-center h-screen text-gray-600">Checking session...</div>;
   }

  // If user exists after loading, means redirect useEffect is about to run
  if (user) {
       return <div className="flex justify-center items-center h-screen text-gray-600">Redirecting...</div>;
  }

  // Render Login form if not loading and no user
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left side: Logo */}
      <div className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-br from-green-500 to-green-700 p-8">
        <img
          src={logo}
          alt="EduFlex Logo"
          className="w-3/4 max-w-sm lg:max-w-md transform transition duration-500 hover:scale-105"
        />
      </div>

      {/* Right side: Login form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm bg-white p-8 rounded-xl shadow-lg space-y-6"
        >
          <h2 className="text-3xl font-bold text-center text-green-700">
            Login
          </h2>
          <p className="text-center text-gray-500 text-sm">
            Welcome! Please login to continue.
          </p>

          {/* Email input */}
          <div className="relative">
            <label htmlFor="email" className="sr-only">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              required
              disabled={isSubmitting}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 bg-white disabled:bg-gray-100 placeholder-gray-400"
            />
          </div>

          {/* Password input */}
          <div className="relative">
             <label htmlFor="password" className="sr-only">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              disabled={isSubmitting}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 bg-white disabled:bg-gray-100 placeholder-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 hover:text-green-600 focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {/* Remember me & Forgot password */}
          <div className="flex justify-between items-center text-sm">
            <label className="flex items-center cursor-pointer text-gray-600 select-none"> {/* Added select-none */}
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isSubmitting}
                className="mr-2 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => toast.info('Password reset feature coming soon!')}
              className="text-green-600 hover:text-green-800 hover:underline focus:outline-none"
              disabled={isSubmitting}
            >
              Forgot password?
            </button>
          </div>

          {/* Login button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-md font-semibold text-base
                       hover:from-green-600 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                       transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>

             {/* Demo credentials info - REMOVE FOR PRODUCTION */}
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md text-xs text-green-700">
              <strong>Demo Credentials:</strong>
              <div className="mt-2 font-mono space-y-1">
                 <div>📧 student@eduflex.com | 🔒 student123 (Mock - Use Real)</div>
                 <div>📧 teacher@eduflex.test | 🔒 teacher123 (Real)</div>
                 <div>📧 admin@eduflex.local | 🔒 Admin@123 (Real)</div>
              </div>
            </div>

        </form>
      </div>
    </div>
  );
}