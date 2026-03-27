import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { FiEye, FiEyeOff } from "react-icons/fi";

function validatePassword(password) {
  // At least 8 chars, one number, one letter
  return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*]{8,}$/.test(password);
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const passwordValid = validatePassword(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  useEffect(() => {
    // Check if user has a valid session (came from email link)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Invalid or expired reset link. Please request a new password reset.");
      }
    };
    checkSession();
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!passwordValid) {
      setError("Password must be at least 8 characters with 1 number and 1 letter");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      backgroundImage: "url('/images/banner.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      position: "relative"
    }}>
      {/* Background overlay */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: darkMode ? "rgba(26, 26, 26, 0.9)" : "rgba(255, 255, 255, 0.85)",
        zIndex: 0
      }}></div>

      {/* Content */}
      <div style={{
        position: "relative",
        zIndex: 1,
        width: "100%",
        maxWidth: "500px",
        background: darkMode ? "#2C2C2C" : "white",
        borderRadius: "24px",
        padding: "48px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        border: "3px solid #C2185B"
      }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <img 
            src="/images/logo.png" 
            alt="Logo" 
            style={{
              width: "100px",
              height: "auto",
              margin: "0 auto 20px",
              display: "block"
            }}
            onError={(e) => e.target.style.display = 'none'}
          />
          <h2 style={{ 
            color: darkMode ? "#E0E0E0" : "#C2185B", 
            marginBottom: 8,
            fontSize: "1.8em"
          }}>
            Reset Your Password
          </h2>
          <p style={{ 
            color: darkMode ? "#B0B0B0" : "#666", 
            fontSize: "0.95em",
            margin: 0
          }}>
            Enter your new password below
          </p>
        </div>

        {!success ? (
          <form onSubmit={handleResetPassword} style={{ marginTop: 30 }}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                display: "block", 
                marginBottom: 8, 
                fontWeight: "600", 
                color: darkMode ? "#E0E0E0" : "#333", 
                fontSize: "0.9em" 
              }}>
                New Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    paddingRight: "45px",
                    border: `2px solid ${passwordValid || password === "" ? (darkMode ? "rgba(255, 255, 255, 0.2)" : "#E0E0E0") : "#F44336"}`,
                    borderRadius: "10px",
                    fontSize: "1em",
                    outline: "none",
                    boxSizing: "border-box",
                    background: darkMode ? "rgba(255, 255, 255, 0.05)" : "white",
                    color: darkMode ? "#E0E0E0" : "#333"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: darkMode ? "#B0B0B0" : "#666"
                  }}
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              {!passwordValid && password !== "" && (
                <div style={{ color: "#F44336", fontSize: "0.85em", marginTop: 6 }}>
                  Min 8 characters, 1 number, 1 letter
                </div>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                display: "block", 
                marginBottom: 8, 
                fontWeight: "600", 
                color: darkMode ? "#E0E0E0" : "#333", 
                fontSize: "0.9em" 
              }}>
                Confirm Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    paddingRight: "45px",
                    border: `2px solid ${passwordsMatch || confirmPassword === "" ? (darkMode ? "rgba(255, 255, 255, 0.2)" : "#E0E0E0") : "#F44336"}`,
                    borderRadius: "10px",
                    fontSize: "1em",
                    outline: "none",
                    boxSizing: "border-box",
                    background: darkMode ? "rgba(255, 255, 255, 0.05)" : "white",
                    color: darkMode ? "#E0E0E0" : "#333"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: darkMode ? "#B0B0B0" : "#666"
                  }}
                >
                  {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              {!passwordsMatch && confirmPassword !== "" && (
                <div style={{ color: "#F44336", fontSize: "0.85em", marginTop: 6 }}>
                  Passwords do not match
                </div>
              )}
            </div>

            {error && (
              <div style={{ 
                padding: "12px 16px", 
                background: darkMode ? "rgba(244, 67, 54, 0.1)" : "#FFEBEE", 
                borderRadius: "8px",
                color: "#C62828",
                fontSize: "0.9em",
                marginBottom: 20,
                border: "1px solid " + (darkMode ? "rgba(244, 67, 54, 0.3)" : "#EF9A9A")
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !passwordValid || !passwordsMatch}
              style={{
                width: "100%",
                padding: "16px",
                background: loading || !passwordValid || !passwordsMatch ? "#F0F0F0" : (darkMode ? "rgba(194, 24, 91, 0.1)" : "white"),
                border: "2px solid #C2185B",
                borderRadius: "12px",
                color: loading || !passwordValid || !passwordsMatch ? "#999" : "#C2185B",
                fontSize: "1.05em",
                fontWeight: "600",
                cursor: loading || !passwordValid || !passwordsMatch ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(194, 24, 91, 0.1)",
                transition: "all 0.2s"
              }}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <div style={{ marginTop: 20, textAlign: "center" }}>
              <button
                type="button"
                onClick={() => navigate("/login")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#C2185B",
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontSize: "0.95em"
                }}
              >
                Back to Login
              </button>
            </div>
          </form>
        ) : (
          <div style={{
            textAlign: "center",
            padding: "30px 0"
          }}>
            <div style={{
              fontSize: "3em",
              color: "#4CAF50",
              marginBottom: 20
            }}>
              ✓
            </div>
            <h3 style={{
              color: darkMode ? "#E0E0E0" : "#333",
              marginBottom: 10
            }}>
              Password Reset Successful!
            </h3>
            <p style={{
              color: darkMode ? "#B0B0B0" : "#666",
              fontSize: "0.95em"
            }}>
              Redirecting to login page...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
