import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Typed from "typed.js";
import landing from "../assets/landing.jpg";

const Login = () => {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(true);
  const typedRef = useRef(null);
  const apiUrl = import.meta.env.VITE_API_URL;

  // Initialize typed.js effect
  useEffect(() => {
    if (showRoleSelection && typedRef.current) {
      const typed = new Typed(typedRef.current, {
        strings: [
          "Welcome to BROSCH Inventory Management System",
          "Please select your role to continue...",
          "Are you CS (Central Store) or NM (Node Manager)?"
        ],
        typeSpeed: 50,
        backSpeed: 30,
        backDelay: 1500,
        loop: true,
        showCursor: true,
        cursorChar: '|'
      });

      return () => {
        typed.destroy();
      };
    }
  }, [showRoleSelection]);

  const handleRoleSelection = (selectedRole) => {
    setRole(selectedRole);
    setShowRoleSelection(false);
    setShowLoginModal(true);
  };

  const loginApiCall = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await axios.post(`${apiUrl}/user/login`, {
        userId,
        password,
        type: role,
      });

      if (response?.data?.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem(
          "user",
          JSON.stringify(response.data.user || {})
        );
        toast.success("✅ Successfully logged in!");
        setTimeout(() => {
          window.location.hash = "#/";
          window.location.reload();
        }, 1000);
      } else {
        toast.error("❌ Login failed");
      }
    } catch (error) {
      console.error("Login failed:", error.response?.data || error.message);
      setMessage(
        error.response?.data?.message ||
        error.message ||
        "❌ Login failed due to a network/server error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    if (!userId || !password) {
      setMessage("⚠️ Please enter both User ID and Password");
      return;
    }
    loginApiCall();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  const goBackToRoleSelection = () => {
    setShowLoginModal(false);
    setShowRoleSelection(true);
    setRole("");
    setUserId("");
    setPassword("");
    setMessage("");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${landing})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay for better contrast */}
      <div className="absolute inset-0 bg-black/30"></div>

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gray-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>

      {/* Role Selection Screen */}
      {showRoleSelection && (
        <div className="relative bg-white/75 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 w-full max-w-2xl z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-gray-800/90 to-gray-900/90 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m0 0h4M9 7h6m-6 4h6m-6 4h6m-6 4h6"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900/90 mb-4 drop-shadow-sm">
              BROSCH
            </h1>

            {/* Typed.js Animation */}
            <div className="h-20 flex items-center justify-center">
              <span
                ref={typedRef}
                className="text-xl text-gray-800/90 font-medium min-h-[1.5rem] drop-shadow-sm"
              ></span>
            </div>
          </div>

          {/* Role Selection Buttons */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CS Role Button */}
              <button
                onClick={() => handleRoleSelection("user")}
                className="group relative bg-white/60 hover:bg-gray-800/90 backdrop-blur-sm rounded-xl p-8 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border border-white/30 hover:border-gray-700/50"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-gray-700/80 to-gray-800/80 group-hover:from-white/90 group-hover:to-gray-100/90 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 backdrop-blur-sm">
                    <svg
                      className="w-8 h-8 text-white group-hover:text-gray-800 transition-colors duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m0 0h4M9 7h6m-6 4h6m-6 4h6m-6 4h6"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900/90 group-hover:text-white mb-2 transition-colors duration-300 drop-shadow-sm">
                    CS
                  </h3>
                  <p className="text-gray-700/80 group-hover:text-gray-200 transition-colors duration-300 drop-shadow-sm">
                    Central Store
                  </p>
                  <p className="text-sm text-gray-600/70 group-hover:text-gray-300 mt-2 transition-colors duration-300 drop-shadow-sm">
                    Manage inventory and supplies
                  </p>
                </div>
              </button>

              {/* NM Role Button */}
              <button
                onClick={() => handleRoleSelection("shipper")}
                className="group relative bg-white/60 hover:bg-gray-800/90 backdrop-blur-sm rounded-xl p-8 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border border-white/30 hover:border-gray-700/50"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-gray-700/80 to-gray-800/80 group-hover:from-white/90 group-hover:to-gray-100/90 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 backdrop-blur-sm">
                    <svg
                      className="w-8 h-8 text-white group-hover:text-gray-800 transition-colors duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900/90 group-hover:text-white mb-2 transition-colors duration-300 drop-shadow-sm">
                    NM
                  </h3>
                  <p className="text-gray-700/80 group-hover:text-gray-200 transition-colors duration-300 drop-shadow-sm">
                    Node Manager
                  </p>
                  <p className="text-sm text-gray-600/70 group-hover:text-gray-300 mt-2 transition-colors duration-300 drop-shadow-sm">
                    Manage shipping and distribution
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="relative bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200 p-8 w-full max-w-md z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-gray-800 to-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {role === "user" ? "CS Login" : "NM Login"}
            </h2>
            <p className="text-gray-600">
              Sign in as {role === "user" ? "Central Store" : "Node Manager"}
            </p>

            {/* Back Button */}
            <button
              onClick={goBackToRoleSelection}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center mx-auto"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Change Role
            </button>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`text-center mb-6 p-3 rounded-lg backdrop-blur-sm ${message.includes("✅")
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
                }`}
            >
              {message}
            </div>
          )}

          {/* Form */}
          <div className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900 placeholder-gray-500 backdrop-blur-sm transition-all duration-300"
                  placeholder="Enter your username"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900 placeholder-gray-500 backdrop-blur-sm transition-all duration-300"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-300 ${loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black transform hover:scale-105 active:scale-95"
                } shadow-lg hover:shadow-xl`}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Signing in...</span>
                </div>
              ) : (
                `Sign in as ${role === "user" ? "CS" : "NM"}`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
