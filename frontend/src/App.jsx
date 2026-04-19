import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import Login from "./components/Login";
import UserDashboard from "./components/UserDashboard";
import DriverDashboard from "./components/DriverDashboard";
import AdminDashboard from "./components/AdminDashboard";
import ResetPassword from "./components/ResetPassword";
import Toast from "./components/Toast";
import { supabase, hasSupabaseConfig } from "./supabaseClient";
import { FiSun, FiMoon } from "react-icons/fi";

function PrivateRoute({ children, role }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  
  // Allow access if no token (will redirect via Navigate)
  if (!token) return <Navigate to="/login" replace />;
  
  // Allow access if role matches or no role specified
  if (role && (!user || user.role !== role)) {
    // Wrong role - clear and redirect
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

export default function App() {
  if (!hasSupabaseConfig) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#f7f7f7" }}>
        <div style={{ maxWidth: 760, width: "100%", background: "white", border: "1px solid #ddd", borderRadius: 12, padding: 24 }}>
          <h2 style={{ marginTop: 0, color: "#C2185B" }}>Frontend Configuration Missing</h2>
          <p style={{ marginBottom: 10 }}>Set these environment variables in Vercel, then redeploy:</p>
          <pre style={{ background: "#f3f3f3", padding: 12, borderRadius: 8, overflowX: "auto" }}>
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_API_BASE=https://your-backend.onrender.com
REACT_APP_PAYMENT_API_URL=https://your-backend.onrender.com/api/payments
          </pre>
        </div>
      </div>
    );
  }

  const [me, setMe] = useState(null);
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Don't check session on mount to avoid 401 errors
  // Let the login page handle everything
  useEffect(() => {
    // Just check localStorage without calling Supabase
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setMe(user);
      }
    } catch (e) {
      console.error("Error reading user from localStorage:", e);
      localStorage.clear();
    }
  }, []);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const onLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setMe(null);
    showToast("Logged out successfully.", "success");
    navigate("/login");
  };

  // No loading screen needed anymore
  const showHeader = location.pathname !== "/" && location.pathname !== "/login";
  
  return (
    <div className="app">
      {showHeader && (
        <header className="app-header">
          <h1>QR Bus Ticketing System</h1>
          {me && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span>Welcome, {me.username}!</span>
              
              {/* Dark Mode Toggle */}
              <button 
                onClick={() => setDarkMode(!darkMode)}
                style={{ 
                  background: darkMode ? "#2C2C2C" : "white",
                  border: darkMode ? "2px solid rgba(255, 255, 255, 0.2)" : "2px solid #C2185B",
                  borderRadius: "20px",
                  padding: "8px 16px",
                  cursor: "pointer",
                  color: "#C2185B",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.3s ease"
                }}
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
                {darkMode ? "Light" : "Dark"}
              </button>
              
              {/* Logout Button */}
              <button 
                onClick={onLogout} 
                style={{ 
                  background: "#dc3545",
                  border: "none",
                  borderRadius: "20px",
                  padding: "8px 16px",
                  cursor: "pointer",
                  color: "white",
                  fontWeight: "600"
                }}
              >
                Logout
              </button>
            </div>
          )}
        </header>
      )}

      <main>
        <Routes>
          <Route path="/" element={<Login onLogin={(user) => { setMe(user); showToast("Login successful!", "success"); navigate(user.role === "admin" ? "/admin" : user.role === "driver" ? "/driver" : "/user"); }} />} />
          <Route path="/login" element={<Login onLogin={(user) => { setMe(user); showToast("Login successful!", "success"); navigate(user.role === "admin" ? "/admin" : user.role === "driver" ? "/driver" : "/user"); }} />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/user/*" element={
            <PrivateRoute role="user">
              <UserDashboard showToast={showToast} darkMode={darkMode} />
            </PrivateRoute>
          } />
          <Route path="/driver/*" element={
            <PrivateRoute role="driver">
              <DriverDashboard showToast={showToast} darkMode={darkMode} />
            </PrivateRoute>
          } />
          <Route path="/admin/*" element={
            <PrivateRoute role="admin">
              <AdminDashboard showToast={showToast} darkMode={darkMode} />
            </PrivateRoute>
          } />
        </Routes>
      </main>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
    </div>
  );
}
