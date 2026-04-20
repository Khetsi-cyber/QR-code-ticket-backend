import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { FiSun, FiMoon, FiInfo, FiPhone, FiUsers, FiMap, FiHelpCircle, FiEye, FiEyeOff, FiMenu, FiX, FiTruck, FiFileText } from "react-icons/fi";

function validateEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

function validatePassword(password) {
  // At least 8 chars, one number, one letter
  return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*]{8,}$/.test(password);
}

export default function Login({ onLogin }) {
  const location = useLocation();
  const [step, setStep] = useState(0); // 0: login/register choice, 1: form, 2: shuttle booking
  const [mode, setMode] = useState("login"); // 'login' or 'register'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [touched, setTouched] = useState({ email: false, password: false, fullName: false });
  const [showPassword, setShowPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );
  
  // Shuttle booking state
  const [shuttleBooking, setShuttleBooking] = useState({
    full_name: "",
    email: "",
    phone: "",
    departure: "",
    destination: "",
    trip_type: "one-way",
    outbound_date: "",
    return_date: "",
    passengers: 1
  });

  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Clear old session on component mount
  useEffect(() => {
    const clearOldSession = async () => {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        await supabase.auth.signOut().catch(() => {});
      } catch (e) {
        console.log("Session cleared");
      }
    };
    clearOldSession();
  }, []);

  const emailValid = validateEmail(email);
  const passwordValid = validatePassword(password);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleAuthChoice = (authMode) => {
    setMode(authMode);
    setStep(1);
    setError(null);
    setSuccess(null);
    setAcceptTerms(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateEmail(email) || !validatePassword(password) || !fullName.trim()) {
      setError("Please fill all fields correctly");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: "user",
          },
        },
      });

      if (signUpError) throw signUpError;

      setSuccess("Registration successful! Please check your email to verify your account.");
      setLoading(false);

      // Auto login after successful registration
      setTimeout(() => {
        setMode("login");
        setSuccess(null);
      }, 2000);
    } catch (err) {
      const message = err?.message || "Registration failed";
      setError(
        message.includes("Failed to fetch")
          ? "Cannot reach the authentication service. Check your Supabase project URL and public anon key in Vercel, then redeploy."
          : message
      );
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateEmail(email) || !validatePassword(password)) {
      setError("Please enter valid credentials");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Fetch user profile to get role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileError) throw new Error("Could not fetch user profile");

      // Use the role from the database
      const user = {
        id: data.user.id,
        email: data.user.email,
        username: profile.full_name || data.user.email,
        role: profile.role,
        full_name: profile.full_name,
      };

      localStorage.setItem("token", data.session.access_token);
      localStorage.setItem("user", JSON.stringify(user));

      if (onLogin) onLogin(user);
    } catch (err) {
      const message = err?.message || "Login failed";
      setError(
        message.includes("Failed to fetch")
          ? "Cannot reach the authentication service. Check your Supabase project URL and public anon key in Vercel, then redeploy."
          : message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      setSuccess("Password reset link sent! Please check your email.");
      setTimeout(() => {
        setForgotPassword(false);
        setSuccess(null);
      }, 3000);
    } catch (err) {
      const message = err?.message || "Failed to send reset email";
      setError(
        message.includes("Failed to fetch")
          ? "Cannot reach the authentication service. Check your Supabase project URL and public anon key in Vercel, then redeploy."
          : message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleShuttleBooking = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!shuttleBooking.full_name.trim() || !shuttleBooking.email.trim() || !shuttleBooking.phone.trim() ||
        !shuttleBooking.departure.trim() || !shuttleBooking.destination.trim() || 
        !shuttleBooking.outbound_date || !shuttleBooking.passengers) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!validateEmail(shuttleBooking.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (shuttleBooking.trip_type === "return" && !shuttleBooking.return_date) {
      setError("Please select a return date for return trips.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: insertError } = await supabase
        .from("shuttle_bookings")
        .insert([{
          full_name: shuttleBooking.full_name,
          email: shuttleBooking.email,
          phone: shuttleBooking.phone,
          departure: shuttleBooking.departure,
          destination: shuttleBooking.destination,
          trip_type: shuttleBooking.trip_type,
          outbound_date: shuttleBooking.outbound_date,
          return_date: shuttleBooking.trip_type === "return" ? shuttleBooking.return_date : null,
          passengers: shuttleBooking.passengers,
          status: "pending"
        }]);

      if (insertError) throw insertError;

      setSuccess("✅ Shuttle booking request submitted successfully! We'll contact you via email within 24 hours with availability and payment details.");
      
      // Reset form
      setShuttleBooking({
        full_name: "",
        email: "",
        phone: "",
        departure: "",
        destination: "",
        trip_type: "one-way",
        outbound_date: "",
        return_date: "",
        passengers: 1
      });
    } catch (err) {
      setError(err.message || "Failed to submit booking request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submit = forgotPassword ? handleResetPassword : (mode === "register" ? handleRegister : handleLogin);

  return (
    <div style={{
      minHeight: "100vh", 
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: isMobile ? "12px 10px 20px 10px" : "100px 20px 40px 20px",
      backgroundImage: "url('/images/banner.jpg')",
      backgroundSize: "cover",
      backgroundPosition: isMobile ? "center top" : "center",
      backgroundRepeat: "no-repeat",
      position: "relative",
      overflowX: "hidden",
      transition: "background 0.3s"
    }}>
      {/* Background overlay for readability */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: darkMode ? "rgba(26, 26, 26, 0.9)" : "rgba(255, 255, 255, 0.85)",
        zIndex: 0
      }}></div>
      
      {/* Content wrapper */}
      <div style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Header Banner */}
      <header style={{
        position: isMobile ? "relative" : "fixed",
        top: 0,
        left: 0,
        right: 0,
        padding: isMobile ? "10px 12px" : "12px 24px",
        background: darkMode ? "rgba(44, 44, 44, 0.95)" : "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        justifyContent: "space-between",
        alignItems: isMobile ? "stretch" : "center",
        gap: isMobile ? "10px" : "0",
        zIndex: 1000,
        borderBottom: "2px solid #C2185B"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "8px" : "12px", width: isMobile ? "100%" : "auto", minWidth: 0 }}>
          <img 
            src="/images/logo.png" 
            alt="Logo" 
            style={{ 
              height: isMobile ? "56px" : "140px",
              width: "auto",
              objectFit: "contain"
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <h1 style={{ 
            margin: 0, 
            color: darkMode ? "#E0E0E0" : "#C2185B",
            fontSize: isMobile ? "1.05em" : "1.3em"
          }}>
            Tiyandza Transport
          </h1>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "8px" : "12px", width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "space-between" : "flex-end", flexWrap: "wrap" }}>
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: darkMode ? "#2C2C2C" : "white",
              border: "2px solid #C2185B",
              borderRadius: "20px",
              padding: isMobile ? "8px 12px" : "8px 16px",
              cursor: "pointer",
              color: "#C2185B",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.3s ease",
              fontSize: isMobile ? "0.85em" : "1em"
            }}
            title="Menu"
          >
            <FiMenu size={18} />
            Menu
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              background: darkMode ? "#2C2C2C" : "white",
              border: darkMode ? "2px solid rgba(255, 255, 255, 0.2)" : "2px solid #C2185B",
              borderRadius: "20px",
              padding: isMobile ? "8px 12px" : "8px 16px",
              cursor: "pointer",
              color: "#C2185B",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.3s ease",
              fontSize: isMobile ? "0.85em" : "1em"
            }}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
            {darkMode ? "Light" : "Dark"}
          </button>
        </div>
      </header>

      {/* Menu Overlay */}
      {menuOpen && (
        <div 
          onClick={() => setMenuOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 1001
          }}
        />
      )}

      {/* Slide-out Menu */}
      {menuOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: isMobile ? "100%" : "320px",
          maxWidth: "100%",
          height: "100vh",
          background: darkMode ? "#2C2C2C" : "white",
          boxShadow: "-4px 0 12px rgba(0,0,0,0.1)",
          zIndex: 1002,
          overflowY: "auto",
          padding: isMobile ? "16px 12px" : "20px"
        }}>
          <button
            onClick={() => setMenuOpen(false)}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: "1.5em",
              color: darkMode ? "#E0E0E0" : "#333"
            }}
          >
            <FiX />
          </button>

          <h3 style={{ 
            marginTop: isMobile ? "44px" : "60px", 
            marginBottom: "20px", 
            color: darkMode ? "#E0E0E0" : "#333",
            fontSize: isMobile ? "1.05em" : "1.2em"
          }}>
            Quick Actions
          </h3>

          <button
            onClick={() => {
              setMenuOpen(false);
              setStep(2);
            }}
            style={{
              width: "100%",
              padding: "14px 16px",
              marginBottom: "20px",
              background: darkMode ? "rgba(255, 255, 255, 0.05)" : "white",
              border: "2px solid #C2185B",
              borderRadius: "10px",
              color: "#C2185B",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              fontSize: "1em",
              transition: "all 0.2s",
              boxShadow: "0 2px 8px rgba(194, 24, 91, 0.2)"
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 4px 12px rgba(194, 24, 91, 0.3)";
              e.target.style.background = "#C2185B";
              e.target.style.color = "white";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 8px rgba(194, 24, 91, 0.2)";
              e.target.style.background = darkMode ? "rgba(255, 255, 255, 0.05)" : "white";
              e.target.style.color = "#C2185B";
            }}
          >
            <FiTruck size={18} />
            Book Shuttle
          </button>

          <h3 style={{ 
            marginBottom: "20px", 
            color: darkMode ? "#E0E0E0" : "#333",
            fontSize: "1.2em"
          }}>
            Information
          </h3>

          {[
            { key: "contact", icon: FiPhone, title: "Contact Us", content: <>
              <p style={{margin: "0 0 8px 0"}}><strong>Phone:</strong> +268 76879552</p>
              <p style={{margin: "0 0 8px 0"}}><strong>Email:</strong> tiyandzamshengu@gmail.com</p>
              <p style={{margin: "0"}}><strong>Office Hours:</strong> Mon-Fri 8AM-6PM, Sat 9AM-2PM</p>
            </> },
            { key: "staff", icon: FiUsers, title: "Our Staff", content: <>
              <p style={{margin: "0 0 8px 0"}}>Our team consists of experienced drivers, customer support specialists, and technical staff dedicated to providing you with the best travel experience. All our drivers are professionally trained and certified.</p>
              <p style={{margin: "0 0 8px 0"}}><strong>Admin:</strong> Khetsiwe Mabuza</p>
              <p style={{margin: "0"}}><strong>Driver:</strong> Mnakekeli Mabuza</p>
            </> },
            { key: "routes", icon: FiMap, title: "Routes", content: <>
              <p style={{margin: "0 0 8px 0"}}><strong>Main Routes:</strong></p>
              <ul style={{margin: "0", paddingLeft: "20px"}}>
                <li>Manzini - Mbabane</li>
                <li>Mbabane - Manzini</li>
              </ul>
            </> },
            { key: "help", icon: FiHelpCircle, title: "Help", content: <>
              <p style={{margin: "0 0 8px 0"}}><strong>How to book:</strong> Select your role, sign in or register, then choose your route and date.</p>
              <p style={{margin: "0 0 8px 0"}}><strong>Payment:</strong> We accept mobile money and card payments.</p>
              <p style={{margin: "0"}}><strong>Need help?</strong> Contact our support team at tiyandzamshengu@gmail.com</p>
            </> },
            { key: "terms", icon: FiFileText, title: "Terms & Conditions", content: <>
              <p style={{margin: "0 0 12px 0", fontWeight: "600", color: "#C2185B"}}>1. Booking & Tickets</p>
              <p style={{margin: "0 0 8px 0"}}>• All bookings are subject to seat availability</p>
              <p style={{margin: "0 0 8px 0"}}>• Tickets are non-transferable and must be presented (QR code) for boarding</p>
              <p style={{margin: "0 0 8px 0"}}>• Passengers must arrive 15 minutes before departure time</p>
              
              <p style={{margin: "16px 0 12px 0", fontWeight: "600", color: "#C2185B"}}>2. Cancellation & Refunds</p>
              <p style={{margin: "0 0 8px 0"}}>• Cancellations made 24+ hours before departure: 80% refund</p>
              <p style={{margin: "0 0 8px 0"}}>• Cancellations made 6-24 hours before: 50% refund</p>
              <p style={{margin: "0 0 8px 0"}}>• Cancellations less than 6 hours: No refund</p>
              <p style={{margin: "0 0 8px 0"}}>• No-shows forfeit all payments</p>
              
              <p style={{margin: "16px 0 12px 0", fontWeight: "600", color: "#C2185B"}}>3. Passenger Responsibilities</p>
              <p style={{margin: "0 0 8px 0"}}>• Passengers must carry valid identification</p>
              <p style={{margin: "0 0 8px 0"}}>• Children under 12 must be accompanied by an adult</p>
              <p style={{margin: "0 0 8px 0"}}>• Maximum 2 bags per passenger (combined weight: 20kg)</p>
              <p style={{margin: "0 0 8px 0"}}>• Prohibited items: weapons, illegal substances, flammable materials</p>
              
              <p style={{margin: "16px 0 12px 0", fontWeight: "600", color: "#C2185B"}}>4. Liability & Safety</p>
              <p style={{margin: "0 0 8px 0"}}>• Tiyandza Transport is not liable for delays due to weather, traffic, or emergencies</p>
              <p style={{margin: "0 0 8px 0"}}>• We are not responsible for lost or damaged personal belongings</p>
              <p style={{margin: "0 0 8px 0"}}>• All passengers must wear seatbelts when available</p>
              <p style={{margin: "0 0 8px 0"}}>• Disruptive behavior may result in removal without refund</p>
              
              <p style={{margin: "16px 0 12px 0", fontWeight: "600", color: "#C2185B"}}>5. Payment & Pricing</p>
              <p style={{margin: "0 0 8px 0"}}>• All prices are in Swazi Emalangeni (SZL)</p>
              <p style={{margin: "0 0 8px 0"}}>• Payments are processed securely through approved channels</p>
              <p style={{margin: "0 0 8px 0"}}>• Prices may change without notice; bookings are honored at purchase price</p>
              
              <p style={{margin: "16px 0 12px 0", fontWeight: "600", color: "#C2185B"}}>6. Privacy & Data</p>
              <p style={{margin: "0 0 8px 0"}}>• Your personal information is used solely for booking purposes</p>
              <p style={{margin: "0 0 8px 0"}}>• We do not share your data with third parties without consent</p>
              <p style={{margin: "0 0 8px 0"}}>• Email/SMS notifications may be sent regarding your bookings</p>
              
              <p style={{margin: "16px 0 0 0", fontSize: "0.8em", fontStyle: "italic"}}>By booking with Tiyandza Transport, you accept these Terms & Conditions. Last updated: March 2026</p>
            </> },
          ].map(({ key, icon: Icon, title, content }) => (
            <div key={key} style={{ marginBottom: "12px" }}>
              <button
                onClick={() => toggleSection(key)}
                style={{
                  width: "100%",
                  padding: isMobile ? "10px 12px" : "12px 14px",
                  marginBottom: "6px",
                  background: "transparent",
                  border: "2px solid #C2185B",
                  borderRadius: "8px",
                  color: darkMode ? "#E0E0E0" : "#333",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "0.9em",
                  transition: "all 0.2s"
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Icon size={16} /> {title}
                </span>
                <span style={{ fontSize: "0.8em" }}>{expandedSection === key ? "▼" : "▶"}</span>
              </button>
              {expandedSection === key && (
                <div style={{
                  padding: "14px",
                  background: "transparent",
                  border: "2px solid #C2185B",
                  borderRadius: "6px",
                  marginBottom: "6px",
                  fontSize: "0.85em",
                  lineHeight: "1.6",
                  color: darkMode ? "#D0D0D0" : "#555"
                }}>
                  {content}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{
        position: "relative",
        zIndex: 1,
        width: "100%",
        maxWidth: "900px",
        background: darkMode ? "#2C2C2C" : "white",
        borderRadius: isMobile ? "16px" : "24px",
        padding: isMobile ? "18px 14px" : "48px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        border: "3px solid #C2185B"
      }}>
        {/* Header with Logo/Icon */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <img 
            src="/images/banner.jpg" 
            alt="Tiyandza Transport" 
            style={{
              width: isMobile ? "90px" : "120px",
              height: isMobile ? "90px" : "120px",
              margin: "0 auto 20px",
              borderRadius: "20px",
              objectFit: "cover",
              boxShadow: "0 8px 24px rgba(194, 24, 91, 0.3)",
              border: "3px solid #C2185B"
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.innerHTML = '🚌';
              fallback.style.cssText = 'width: 80px; height: 80px; margin: 0 auto 20px; background: linear-gradient(135deg, #7B2CBF 0%, #FF69B4 100%); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 2.5em; box-shadow: 0 8px 24px rgba(123, 44, 191, 0.3);';
              e.target.parentNode.insertBefore(fallback, e.target);
            }}
          />
          <h1 style={{ 
            margin: 0, 
            fontSize: isMobile ? "1.4em" : "1.8em", 
            color: darkMode ? "#E0E0E0" : "#333",
            fontWeight: "700",
            marginBottom: "8px"
          }}>
            Tiyandza Transport
          </h1>
          <p style={{ 
            margin: 0, 
            color: darkMode ? "#B0B0B0" : "#666",
            fontSize: "0.95em"
          }}>
            Your Journey, Our Priority
          </p>
        </div>

        {step === 0 ? (
          <>
            <h2 style={{ textAlign: "center", marginBottom: 20, color: darkMode ? "#E0E0E0" : "#333", fontSize: "1.3em", fontWeight: "600" }}>
              Welcome!
            </h2>
            <p style={{ textAlign: "center", marginBottom: 24, color: darkMode ? "#B0B0B0" : "#666" }}>
              Sign in to continue
            </p>
            <button
              style={{ 
                width: "100%",
                fontSize: "1.05em", 
                padding: "16px 0",
                background: darkMode ? "rgba(255, 255, 255, 0.05)" : "white",
                border: "2px solid #C2185B",
                borderRadius: "12px",
                color: "#C2185B",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(194, 24, 91, 0.1)",
                transition: "all 0.2s"
              }}
              onClick={() => handleAuthChoice("login")}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 4px 12px rgba(194, 24, 91, 0.2)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 2px 8px rgba(194, 24, 91, 0.1)";
              }}
            >
              Login
            </button>
            
            <div style={{ marginTop: 20, textAlign: "center", fontSize: "0.95em" }}>
              <span style={{ color: darkMode ? "#B0B0B0" : "#666" }}>Don't have an account? </span>
              <button
                style={{ 
                  background: "transparent", 
                  border: "none", 
                  color: "#C2185B", 
                  textDecoration: "underline", 
                  cursor: "pointer",
                  fontSize: "inherit",
                  padding: 0
                }}
                onClick={() => handleAuthChoice("register")}
              >
                Sign up
              </button>
            </div>
          </>
        ) : step === 2 ? (
          <>
            <h2 style={{ textAlign: "center", marginBottom: 20, color: darkMode ? "#E0E0E0" : "#333", fontSize: "1.3em", fontWeight: "600" }}>
              Welcome!
            </h2>
            <p style={{ textAlign: "center", marginBottom: 24, color: darkMode ? "#B0B0B0" : "#666" }}>
              Sign in to continue
            </p>
            <button
              style={{ 
                width: "100%",
                fontSize: "1.05em", 
                padding: "16px 0",
                background: darkMode ? "rgba(255, 255, 255, 0.05)" : "white",
                border: "2px solid #C2185B",
                borderRadius: "12px",
                color: "#C2185B",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(194, 24, 91, 0.1)",
                transition: "all 0.2s"
              }}
              onClick={() => handleAuthChoice("login")}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 4px 12px rgba(194, 24, 91, 0.2)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 2px 8px rgba(194, 24, 91, 0.1)";
              }}
            >
              Login
            </button>
            
            <div style={{ marginTop: 20, textAlign: "center", fontSize: "0.95em" }}>
              <span style={{ color: darkMode ? "#B0B0B0" : "#666" }}>Don't have an account? </span>
              <button
                style={{ 
                  background: "transparent", 
                  border: "none", 
                  color: "#C2185B", 
                  textDecoration: "underline", 
                  cursor: "pointer",
                    fontSize: "1em",
                    padding: 0,
                    fontWeight: "600"
                  }}
                  onClick={() => handleAuthChoice("register")}
                >
                  Sign up
                </button>
            </div>
          </>
        ) : step === 2 ? (
          <>
            <h2 style={{ textAlign: "center", marginBottom: 10, color: darkMode ? "#E0E0E0" : "#333", fontSize: "1.3em", fontWeight: "600" }}>
              🚐 Book a Shuttle
            </h2>
            <p style={{ textAlign: "center", marginBottom: 24, color: darkMode ? "#B0B0B0" : "#666", fontSize: "0.9em" }}>
              No account needed. We'll contact you with availability and payment details.
            </p>
            
            <form onSubmit={handleShuttleBooking} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: "600", color: darkMode ? "#E0E0E0" : "#555", fontSize: "0.95em" }}>Full Name *</label>
                <input
                  value={shuttleBooking.full_name}
                  onChange={(e) => setShuttleBooking({ ...shuttleBooking, full_name: e.target.value })}
                  type="text"
                  required
                  placeholder="Your full name"
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "10px",
                    border: darkMode ? "2px solid rgba(194, 24, 91, 0.5)" : "2px solid #E0E0E0",
                    background: darkMode ? "#1C1C1C" : "white",
                    color: darkMode ? "#E0E0E0" : "#333",
                    fontSize: "1em",
                    fontFamily: "inherit",
                    transition: "border-color 0.2s"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: "600", color: darkMode ? "#E0E0E0" : "#555", fontSize: "0.95em" }}>Email Address *</label>
                <input
                  value={shuttleBooking.email}
                  onChange={(e) => setShuttleBooking({ ...shuttleBooking, email: e.target.value })}
                  type="email"
                  required
                  placeholder="your@email.com"
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "10px",
                    border: darkMode ? "2px solid rgba(194, 24, 91, 0.5)" : "2px solid #E0E0E0",
                    background: darkMode ? "#1C1C1C" : "white",
                    color: darkMode ? "#E0E0E0" : "#333",
                    fontSize: "1em",
                    fontFamily: "inherit",
                    transition: "border-color 0.2s"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: "600", color: darkMode ? "#E0E0E0" : "#555", fontSize: "0.95em" }}>Phone Number *</label>
                <input
                  value={shuttleBooking.phone}
                  onChange={(e) => setShuttleBooking({ ...shuttleBooking, phone: e.target.value })}
                  type="tel"
                  required
                  placeholder="+268 7600 0000"
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "10px",
                    border: darkMode ? "2px solid rgba(194, 24, 91, 0.5)" : "2px solid #E0E0E0",
                    background: darkMode ? "#1C1C1C" : "white",
                    color: darkMode ? "#E0E0E0" : "#333",
                    fontSize: "1em",
                    fontFamily: "inherit",
                    transition: "border-color 0.2s"
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 15 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontWeight: "600", color: darkMode ? "#E0E0E0" : "#555", fontSize: "0.95em" }}>From (Departure) *</label>
                  <select
                    value={shuttleBooking.departure}
                    onChange={(e) => setShuttleBooking({ ...shuttleBooking, departure: e.target.value })}
                    required
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "10px",
                      border: darkMode ? "2px solid rgba(194, 24, 91, 0.5)" : "2px solid #E0E0E0",
                      background: darkMode ? "#1C1C1C" : "white",
                      color: darkMode ? "#E0E0E0" : "#333",
                      fontSize: "1em",
                      fontFamily: "inherit"
                    }}
                  >
                    <option value="">Select departure</option>
                    <option value="Mbabane">Mbabane</option>
                    <option value="Manzini">Manzini</option>
                    <option value="Siteki">Siteki</option>
                    <option value="Big Bend">Big Bend</option>
                    <option value="Nhlangano">Nhlangano</option>
                    <option value="Piggs Peak">Piggs Peak</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 6, fontWeight: "600", color: darkMode ? "#E0E0E0" : "#555", fontSize: "0.95em" }}>To (Destination) *</label>
                  <select
                    value={shuttleBooking.destination}
                    onChange={(e) => setShuttleBooking({ ...shuttleBooking, destination: e.target.value })}
                    required
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "10px",
                      border: darkMode ? "2px solid rgba(194, 24, 91, 0.5)" : "2px solid #E0E0E0",
                      background: darkMode ? "#1C1C1C" : "white",
                      color: darkMode ? "#E0E0E0" : "#333",
                      fontSize: "1em",
                      fontFamily: "inherit"
                    }}
                  >
                    <option value="">Select destination</option>
                    <option value="Mbabane">Mbabane</option>
                    <option value="Manzini">Manzini</option>
                    <option value="Siteki">Siteki</option>
                    <option value="Big Bend">Big Bend</option>
                    <option value="Nhlangano">Nhlangano</option>
                    <option value="Piggs Peak">Piggs Peak</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: "600", color: darkMode ? "#E0E0E0" : "#555", fontSize: "0.95em" }}>Trip Type *</label>
                <select
                  value={shuttleBooking.trip_type}
                  onChange={(e) => setShuttleBooking({ ...shuttleBooking, trip_type: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "10px",
                    border: darkMode ? "2px solid rgba(194, 24, 91, 0.5)" : "2px solid #E0E0E0",
                    background: darkMode ? "#1C1C1C" : "white",
                    color: darkMode ? "#E0E0E0" : "#333",
                    fontSize: "1em",
                    fontFamily: "inherit"
                  }}
                >
                  <option value="one-way">One-Way</option>
                  <option value="return">Return Trip</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: shuttleBooking.trip_type === "return" ? (isMobile ? "1fr" : "1fr 1fr") : "1fr", gap: 15 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontWeight: "600", color: darkMode ? "#E0E0E0" : "#555", fontSize: "0.95em" }}>Outbound Date *</label>
                  <input
                    value={shuttleBooking.outbound_date}
                    onChange={(e) => setShuttleBooking({ ...shuttleBooking, outbound_date: e.target.value })}
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "10px",
                      border: darkMode ? "2px solid rgba(194, 24, 91, 0.5)" : "2px solid #E0E0E0",
                      background: darkMode ? "#1C1C1C" : "white",
                      color: darkMode ? "#E0E0E0" : "#333",
                      fontSize: "1em",
                      fontFamily: "inherit"
                    }}
                  />
                </div>

                {shuttleBooking.trip_type === "return" && (
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontWeight: "600", color: darkMode ? "#E0E0E0" : "#555", fontSize: "0.95em" }}>Return Date *</label>
                    <input
                      value={shuttleBooking.return_date}
                      onChange={(e) => setShuttleBooking({ ...shuttleBooking, return_date: e.target.value })}
                      type="date"
                      required
                      min={shuttleBooking.outbound_date || new Date().toISOString().split('T')[0]}
                      style={{
                        width: "100%",
                        padding: "14px",
                        borderRadius: "10px",
                        border: darkMode ? "2px solid rgba(194, 24, 91, 0.5)" : "2px solid #E0E0E0",
                        background: darkMode ? "#1C1C1C" : "white",
                        color: darkMode ? "#E0E0E0" : "#333",
                        fontSize: "1em",
                        fontFamily: "inherit"
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: "600", color: darkMode ? "#E0E0E0" : "#555", fontSize: "0.95em" }}>Number of Passengers *</label>
                <input
                  value={shuttleBooking.passengers}
                  onChange={(e) => setShuttleBooking({ ...shuttleBooking, passengers: parseInt(e.target.value) || 1 })}
                  type="number"
                  min="1"
                  max="50"
                  required
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "10px",
                    border: darkMode ? "2px solid rgba(194, 24, 91, 0.5)" : "2px solid #E0E0E0",
                    background: darkMode ? "#1C1C1C" : "white",
                    color: darkMode ? "#E0E0E0" : "#333",
                    fontSize: "1em",
                    fontFamily: "inherit"
                  }}
                />
              </div>

              {error && <div style={{ padding: "12px", background: "#ffebee", borderRadius: "8px", border: "1px solid #ef5350", color: "#c62828", fontSize: "0.9em" }}>{error}</div>}
              {success && <div style={{ padding: 12, background: "#e8f5e9", color: "#2e7d32", borderRadius: 8, border: "1px solid #66bb6a", fontSize: "0.9em" }}>{success}</div>}

              <button
                type="submit"
                disabled={loading}
                style={{ 
                  width: "100%",
                  padding: "16px 0",
                  background: loading ? "#ccc" : "linear-gradient(135deg, #FF9800 0%, #F57C00 100%)",
                  border: "none",
                  borderRadius: "12px",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "1.05em",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "0 4px 12px rgba(255, 152, 0, 0.3)",
                  transition: "all 0.2s"
                }}
                onMouseOver={(e) => !loading && (e.target.style.transform = "translateY(-2px)")}
                onMouseOut={(e) => e.target.style.transform = "translateY(0)"}
              >
                {loading ? "Submitting..." : "📩 Submit Booking Request"}
              </button>
            </form>

            <button
              style={{ 
                width: "100%",
                marginTop: 18, 
                background: darkMode ? "rgba(255, 255, 255, 0.05)" : "white",
                border: "2px solid #C2185B",
                borderRadius: "12px",
                padding: "14px 0",
                color: "#C2185B",
                fontWeight: "600",
                cursor: "pointer"
              }}
              onClick={() => { setStep(0); setError(null); setSuccess(null); }}
            >
              ← Back
            </button>
          </>
        ) : (
          <>
            <h2 style={{ textAlign: "center", marginBottom: 24, color: darkMode ? "#E0E0E0" : "#333", fontSize: "1.3em", fontWeight: "600" }}>
              {mode === "register" ? "Create Account" : "Sign in"}
            </h2>

            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {mode === "register" && (
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: "600", color: darkMode ? "#E0E0E0" : "#333", fontSize: "0.9em" }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="John Doe"
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      border: "2px solid " + (fullName.trim() || !touched.fullName ? (darkMode ? "rgba(255, 255, 255, 0.2)" : "#E0E0E0") : "#F44336"),
                      borderRadius: "10px",
                      fontSize: "1em",
                      outline: "none",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box",
                      background: darkMode ? "rgba(255, 255, 255, 0.05)" : "white",
                      color: darkMode ? "#E0E0E0" : "#333"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#7B2CBF"}
                    onBlur={(e) => {
                      setTouched((t) => ({ ...t, fullName: true }));
                      if (fullName.trim()) e.target.style.borderColor = darkMode ? "rgba(255, 255, 255, 0.2)" : "#E0E0E0";
                    }}
                  />
                  {!fullName.trim() && touched.fullName && (
                    <div style={{ color: "#F44336", fontSize: "0.85em", marginTop: 6 }}>Full name is required</div>
                  )}
                </div>
              )}

              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: "600", color: darkMode ? "#E0E0E0" : "#333", fontSize: "0.9em" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    border: "2px solid " + (emailValid || !touched.email ? (darkMode ? "rgba(255, 255, 255, 0.2)" : "#E0E0E0") : "#F44336"),
                    borderRadius: "10px",
                    fontSize: "1em",
                    outline: "none",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box",
                    background: darkMode ? "rgba(255, 255, 255, 0.05)" : "white",
                    color: darkMode ? "#E0E0E0" : "#333"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#7B2CBF"}
                  onBlur={(e) => {
                    setTouched((t) => ({ ...t, email: true }));
                    if (emailValid) e.target.style.borderColor = darkMode ? "rgba(255, 255, 255, 0.2)" : "#E0E0E0";
                  }}
                />
                {!emailValid && touched.email && (
                  <div style={{ color: "#F44336", fontSize: "0.85em", marginTop: 6 }}>Enter a valid email</div>
                )}
              </div>

              {!forgotPassword && (
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: "600", color: darkMode ? "#E0E0E0" : "#333", fontSize: "0.9em" }}>
                    Password
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
                        border: "2px solid " + (passwordValid || !touched.password ? (darkMode ? "rgba(255, 255, 255, 0.2)" : "#E0E0E0") : "#F44336"),
                        borderRadius: "10px",
                        fontSize: "1em",
                        outline: "none",
                        transition: "border-color 0.2s",
                        boxSizing: "border-box",
                        background: darkMode ? "rgba(255, 255, 255, 0.05)" : "white",
                        color: darkMode ? "#E0E0E0" : "#333"
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#7B2CBF"}
                      onBlur={(e) => {
                        setTouched((t) => ({ ...t, password: true }));
                        if (passwordValid) e.target.style.borderColor = darkMode ? "rgba(255, 255, 255, 0.2)" : "#E0E0E0";
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
                        fontSize: "1.2em",
                        color: darkMode ? "#B0B0B0" : "#666",
                        display: "flex",
                        alignItems: "center"
                      }}
                    >
                      {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                    </button>
                  </div>
                  {!passwordValid && touched.password && (
                    <div style={{ color: "#F44336", fontSize: "0.85em", marginTop: 6 }}>
                      Min 8 characters, 1 number
                    </div>
                  )}
                </div>
              )}

              {mode === "login" && !forgotPassword && (
                <div style={{ textAlign: "right", marginTop: -8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPassword(true);
                      setError(null);
                      setSuccess(null);
                      setPassword("");
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#C2185B",
                      fontSize: "0.9em",
                      cursor: "pointer",
                      textDecoration: "underline",
                      padding: 0
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              {forgotPassword && (
                <div style={{ 
                  padding: "12px 16px", 
                  background: darkMode ? "rgba(194, 24, 91, 0.1)" : "#FFF0F5", 
                  borderRadius: "8px",
                  fontSize: "0.9em",
                  color: darkMode ? "#E0E0E0" : "#333",
                  border: "1px solid " + (darkMode ? "rgba(194, 24, 91, 0.3)" : "#FFD4E5"),
                  marginBottom: "10px"
                }}>
                  Enter your email address and we'll send you a link to reset your password.
                </div>
              )}

              {mode === "register" && !forgotPassword && (
                <div style={{ 
                  display: "flex", 
                  alignItems: "flex-start", 
                  gap: "10px",
                  marginBottom: "16px",
                  padding: "12px",
                  background: darkMode ? "rgba(194, 24, 91, 0.05)" : "#FFF8FA",
                  borderRadius: "8px",
                  border: "1px solid " + (darkMode ? "rgba(194, 24, 91, 0.2)" : "#FFE0EB")
                }}>
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    style={{
                      marginTop: "4px",
                      cursor: "pointer",
                      width: "18px",
                      height: "18px",
                      accentColor: "#C2185B"
                    }}
                  />
                  <label 
                    htmlFor="acceptTerms" 
                    style={{ 
                      fontSize: "0.9em", 
                      color: darkMode ? "#D0D0D0" : "#555",
                      lineHeight: "1.5",
                      cursor: "pointer"
                    }}
                  >
                    I agree to the{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(true);
                        setExpandedSection("terms");
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#C2185B",
                        cursor: "pointer",
                        textDecoration: "underline",
                        fontSize: "inherit",
                        padding: 0,
                        fontWeight: "600"
                      }}
                    >
                      Terms & Conditions
                    </button>
                    {" "}and acknowledge that my information will be used in accordance with the company's privacy policy.
                  </label>
                </div>
              )}

              {error && (
                <div style={{ 
                  padding: "12px 16px", 
                  background: darkMode ? "rgba(244, 67, 54, 0.1)" : "#FFEBEE", 
                  borderRadius: "8px",
                  color: "#C62828",
                  fontSize: "0.9em",
                  border: "1px solid " + (darkMode ? "rgba(244, 67, 54, 0.3)" : "#EF9A9A")
                }}>
                  {error}
                </div>
              )}

              {success && (
                <div style={{ 
                  padding: "12px 16px", 
                  background: darkMode ? "rgba(76, 175, 80, 0.1)" : "#E8F5E9", 
                  borderRadius: "8px",
                  color: "#2E7D32",
                  fontSize: "0.9em",
                  border: "1px solid " + (darkMode ? "rgba(76, 175, 80, 0.3)" : "#A5D6A7")
                }}>
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (!emailValid || (!forgotPassword && (!passwordValid || (mode === "register" && (!fullName.trim() || !acceptTerms)))))}
                style={{
                  width: "100%",
                  padding: "16px",
                  background: loading ? "#F0F0F0" : (darkMode ? "rgba(194, 24, 91, 0.1)" : "white"),
                  border: "2px solid #C2185B",
                  borderRadius: "12px",
                  color: loading ? "#999" : "#C2185B",
                  fontSize: "1.05em",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px rgba(194, 24, 91, 0.1)",
                  transition: "all 0.2s"
                }}
                onMouseOver={(e) => !loading && (e.target.style.transform = "translateY(-2px)")}
                onMouseOut={(e) => e.target.style.transform = "translateY(0)"}
              >
                {loading ? "Please wait..." : forgotPassword ? "Send Reset Link" : mode === "register" ? "Create Account" : "Sign in"}
              </button>

              {forgotPassword && (
                <div style={{ marginTop: 18, textAlign: "center", fontSize: "0.95em" }}>
                  <button
                    type="button"
                    style={{ 
                      background: "transparent", 
                      border: "none", 
                      color: "#C2185B", 
                      textDecoration: "underline", 
                      cursor: "pointer",
                      fontSize: "1em",
                      padding: 0,
                      fontWeight: "600"
                    }}
                    onClick={() => {
                      setForgotPassword(false);
                      setError(null);
                      setSuccess(null);
                    }}
                  >
                    Back to Login
                  </button>
                </div>
              )}
            </form>

            {mode === "login" && (
              <div style={{ marginTop: 20, textAlign: "center", fontSize: "0.95em" }}>
                <span style={{ color: darkMode ? "#B0B0B0" : "#666" }}>Don't have an account? </span>
                <button
                  style={{ 
                    background: "transparent", 
                    border: "none", 
                    color: "#C2185B", 
                    textDecoration: "underline", 
                    cursor: "pointer",
                    fontSize: "1em",
                    padding: 0,
                    fontWeight: "600"
                  }}
                  onClick={() => {
                    setMode("register");
                    setError(null);
                    setSuccess(null);
                  }}
                >
                  Sign up
                </button>
              </div>
            )}

            <button
              style={{ 
                width: "100%",
                marginTop: 18, 
                background: darkMode ? "rgba(255, 255, 255, 0.05)" : "white",
                border: "2px solid #C2185B",
                borderRadius: "12px",
                padding: "14px 0",
                color: "#C2185B",
                fontWeight: "600",
                cursor: "pointer"
              }}
              onClick={() => setStep(0)}
            >
              ← Back
            </button>
          </>
        )}
      </div>

      {/* Footer Banner - About Us */}
      <footer style={{
        position: "relative",
        zIndex: 1,
        width: "100%",
        maxWidth: "900px",
        marginTop: "24px",
        padding: "32px 48px",
        background: darkMode ? "rgba(44, 44, 44, 0.95)" : "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        borderRadius: "16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        border: "2px solid #C2185B"
      }}>
        <h3 style={{
          color: "#C2185B",
          fontSize: "1.5em",
          marginBottom: "16px",
          textAlign: "center",
          fontWeight: "700"
        }}>
          About Us
        </h3>
        <p style={{
          color: darkMode ? "#E0E0E0" : "#333",
          fontSize: "1em",
          lineHeight: "1.8",
          margin: 0,
          marginBottom: "16px",
          textAlign: "center"
        }}>
          At Tiyandza Transport, we've taken the stress out of travel. No more long queues at the station or paper tickets lost in your bag. Our digital-first platform allows you to book your seat in seconds, manage your trips on the go, and board with just a scan of your phone.
        </p>
        <p style={{
          color: darkMode ? "#E0E0E0" : "#333",
          fontSize: "1em",
          lineHeight: "1.8",
          margin: 0,
          textAlign: "center"
        }}>
          We combine a modern fleet with cutting-edge booking technology to ensure that from the moment you click "Buy" to the moment you reach your destination, your experience is seamless.
        </p>
        <p style={{
          color: darkMode ? "#B0B0B0" : "#666",
          fontSize: "0.85em",
          marginTop: "24px",
          marginBottom: 0,
          textAlign: "center",
          borderTop: darkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.1)",
          paddingTop: "16px"
        }}>
          © 2026 Tiyandza Transport. All rights reserved.
          {" • "}
          <button
            onClick={() => {
              setMenuOpen(true);
              setExpandedSection("terms");
            }}
            style={{
              background: "none",
              border: "none",
              color: "#C2185B",
              cursor: "pointer",
              textDecoration: "underline",
              fontSize: "inherit",
              padding: 0,
              fontWeight: "600"
            }}
          >
            Terms & Conditions
          </button>
          {" • "}
          <a
            href="mailto:tiyandzamshengu@gmail.com"
            style={{
              color: "#C2185B",
              textDecoration: "underline",
              fontWeight: "600"
            }}
          >
            Contact
          </a>
        </p>
      </footer>

      </div> {/* Close content wrapper */}
    </div>
  );
}
