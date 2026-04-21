


import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import QRCode from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { FiBell, FiMoon, FiSun, FiStar, FiDownload, FiCalendar, FiHome, FiMail, FiFileText, FiTruck, FiMapPin, FiCreditCard, FiSmartphone, FiShoppingCart } from "react-icons/fi";
import PaymentModal from "./PaymentModal";

export default function UserDashboard({ showToast }) {
  const [activeMenu, setActiveMenu] = useState('home'); // 'home', 'enquiry', 'myTickets', 'reviews'
  const [step, setStep] = useState(-1); // -1: landing page, 0: select departure, 1: select destination, 2: confirm fare, 3: select seats, 4: show QR
  const [currentUser, setCurrentUser] = useState(null);
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [departures, setDepartures] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [selectedDeparture, setSelectedDeparture] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("");
  const [fare, setFare] = useState(0);
  const [numAdults, setNumAdults] = useState(1);
  const [numChildren, setNumChildren] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [myTickets, setMyTickets] = useState([]);
  const [showMyTickets, setShowMyTickets] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [passengerName, setPassengerName] = useState("");
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [myReviews, setMyReviews] = useState([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleTicket, setRescheduleTicket] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [submittingReschedule, setSubmittingReschedule] = useState(false);
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submittingEnquiry, setSubmittingEnquiry] = useState(false);
  const [myEnquiries, setMyEnquiries] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // Track auth state changes (token refreshes, signIn, signOut)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
      }
    });
    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      // getSession reads from localStorage — no network call, always reliable
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      console.log("Current user:", user);
      if (!user) {
        console.error("No user found - redirecting might be needed");
      } else {
        setCurrentUser(user);
        // Load passenger profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        
        if (profileData) {
          setPassengerName(profileData.full_name);
        }
      }
    };
    
    checkAuth();
    loadBuses();
    loadDepartures();
    loadMyTickets();
    loadNotifications();
    loadMyReviews();
    loadMyEnquiries();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Reload tickets when switching to My Tickets section
  useEffect(() => {
    if (activeMenu === 'myTickets') {
      loadMyTickets();
    }
  }, [activeMenu]);

  const loadBuses = async () => {
    try {
      console.log("Loading buses...");
      const { data, error } = await supabase
        .from("buses")
        .select("*")
        .eq("is_active", true)
        .order("bus_number");
      
      if (error) {
        console.error("Supabase error:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        throw error;
      }
      console.log("Buses loaded:", data);
      setBuses(data || []);
    } catch (err) {
      console.error("Error loading buses:", err);
      showToast?.(`Failed to load buses: ${err.message}`, "error");
    }
  };

  const loadDepartures = async () => {
    try {
      const { data, error } = await supabase
        .from("bus_stops")
        .select("departure")
        .eq("is_active", true)
        .order("departure");
      
      if (error) throw error;
      
      // Get unique departures
      const uniqueDepartures = [...new Set(data.map(item => item.departure))];
      setDepartures(uniqueDepartures);
    } catch (err) {
      console.error("Error loading departures:", err);
      showToast?.("Failed to load departures", "error");
    }
  };

  const loadDestinations = async (departure) => {
    try {
      const { data, error } = await supabase
        .from("bus_stops")
        .select("*")
        .eq("departure", departure)
        .eq("is_active", true)
        .order("destination");
      
      if (error) throw error;
      setDestinations(data || []);
    } catch (err) {
      console.error("Error loading destinations:", err);
      showToast?.("Failed to load destinations", "error");
    }
  };

  const loadMyTickets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log("Loading tickets for user:", user.id);
      
      const { data, error } = await supabase
        .from("tickets")
        .select("id, user_id, bus_id, departure, destination, fare, seat_numbers, qr_code, status, payment_status, created_at, scheduled_date, reschedule_count, original_scheduled_date, last_rescheduled_at, reschedule_reason, buses(bus_number)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error loading tickets:", error);
        throw error;
      }
      
      console.log("Tickets loaded successfully:", data?.length || 0, "tickets");
      console.log("Tickets data:", data);
      setMyTickets(data || []);
    } catch (err) {
      console.error("Error loading tickets:", err);
      showToast?.(`Failed to load tickets: ${err.message}`, "error");
    }
  };

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("notifications")
        .select("*, bus_schedules(*, buses(bus_number))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);
      
      if (error) throw error;
      await loadNotifications();
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      
      if (error) throw error;
      await loadNotifications();
      showToast?.("All notifications marked as read", "success");
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);
      
      if (error) throw error;
      await loadNotifications();
      showToast?.("Notification deleted", "success");
    } catch (err) {
      console.error("Error deleting notification:", err);
      showToast?.("Failed to delete notification", "error");
    }
  };

  const loadMyReviews = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("reviews")
        .select("*, profiles(full_name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setMyReviews(data || []);
    } catch (err) {
      console.error("Error loading reviews:", err);
    }
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      showToast?.("Please select a rating", "error");
      return;
    }

    setSubmittingReview(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("reviews")
        .insert({
          user_id: user.id,
          rating: reviewRating,
          comment: reviewComment.trim(),
        });

      if (error) throw error;

      showToast?.("Review submitted successfully!", "success");
      setShowReviewModal(false);
      setReviewRating(0);
      setReviewComment("");
      await loadMyReviews();
    } catch (err) {
      console.error("Error submitting review:", err);
      showToast?.(err.message || "Failed to submit review", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId);

      if (error) throw error;

      showToast?.("Review deleted successfully", "success");
      await loadMyReviews();
    } catch (err) {
      console.error("Error deleting review:", err);
      showToast?.("Failed to delete review", "error");
    }
  };

  const handleOpenReschedule = (ticket) => {
    setRescheduleTicket(ticket);
    
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setRescheduleDate(dateStr);
    
    // Set default time to 8 AM
    setRescheduleTime("08:00");
    setRescheduleReason("");
    setShowRescheduleModal(true);
  };

  const handleSubmitReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) {
      showToast?.("Please select both date and time", "error");
      return;
    }

    // Validate that the new date is in the future
    const selectedDateTime = new Date(`${rescheduleDate}T${rescheduleTime}`);
    const now = new Date();
    
    if (selectedDateTime <= now) {
      showToast?.("Please select a future date and time", "error");
      return;
    }

    setSubmittingReschedule(true);
    try {
      // Prepare update data
      const updateData = {
        scheduled_date: selectedDateTime.toISOString(),
        last_rescheduled_at: new Date().toISOString(),
        reschedule_count: (rescheduleTicket.reschedule_count || 0) + 1
      };

      // Store original date if first reschedule
      if (!rescheduleTicket.original_scheduled_date) {
        updateData.original_scheduled_date = rescheduleTicket.scheduled_date || rescheduleTicket.created_at;
      }

      // Add reason if provided
      if (rescheduleReason.trim()) {
        updateData.reschedule_reason = rescheduleReason.trim();
      }

      // Update ticket in database
      const { error } = await supabase
        .from("tickets")
        .update(updateData)
        .eq("id", rescheduleTicket.id);

      if (error) throw error;

      showToast?.("Ticket rescheduled successfully!", "success");
      setShowRescheduleModal(false);
      setRescheduleTicket(null);
      setRescheduleDate("");
      setRescheduleTime("");
      setRescheduleReason("");
      await loadMyTickets();
    } catch (err) {
      console.error("Error rescheduling ticket:", err);
      showToast?.(err.message || "Failed to reschedule ticket", "error");
    } finally {
      setSubmittingReschedule(false);
    }
  };

  const loadMyEnquiries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('enquiries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyEnquiries(data || []);
    } catch (err) {
      console.error('Error loading enquiries:', err);
      showToast?.(`Failed to load enquiries: ${err.message}`, 'error');
    }
  };

  const handleSubmitEnquiry = async () => {
    if (!enquiryForm.name || !enquiryForm.email || !enquiryForm.subject || !enquiryForm.message) {
      showToast?.("Please fill in all fields", "error");
      return;
    }

    setSubmittingEnquiry(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert enquiry into database
      const { error } = await supabase
        .from('enquiries')
        .insert({
          user_id: user.id,
          name: enquiryForm.name,
          email: enquiryForm.email,
          subject: enquiryForm.subject,
          message: enquiryForm.message,
          status: 'pending'
        });

      if (error) throw error;

      showToast?.("Enquiry submitted successfully! Admin will respond soon.", "success");
      setShowEnquiryForm(false);
      setEnquiryForm({ name: '', email: '', subject: '', message: '' });
      await loadMyEnquiries();
    } catch (err) {
      console.error('Error submitting enquiry:', err);
      showToast?.(err.message || "Failed to submit enquiry", "error");
    } finally {
      setSubmittingEnquiry(false);
    }
  };

  const handleDepartureSelect = async (departure) => {
    setSelectedDeparture(departure);
    await loadDestinations(departure);
    setStep(1);
  };

  const handleDestinationSelect = (destination) => {
    setSelectedDestination(destination.destination);
    setFare(destination.fare);
    setStep(2);
  };

  const loadOccupiedSeats = async (busId) => {
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select("seat_numbers")
        .eq("bus_id", busId)
        .eq("status", "active");
      
      if (error) throw error;
      
      // Flatten all seat numbers from all active tickets
      const allOccupiedSeats = data.reduce((acc, ticket) => {
        if (ticket.seat_numbers && Array.isArray(ticket.seat_numbers)) {
          return [...acc, ...ticket.seat_numbers];
        }
        return acc;
      }, []);
      
      setOccupiedSeats(allOccupiedSeats);
    } catch (err) {
      console.error("Error loading occupied seats:", err);
      showToast?.("Failed to load seat availability", "error");
    }
  };

  const handleSeatClick = (seatNumber) => {
    if (occupiedSeats.includes(seatNumber)) {
      showToast?.("This seat is already taken", "error");
      return;
    }
    
    const totalPassengers = numAdults + numChildren;
    
    if (selectedSeats.includes(seatNumber)) {
      // Deselect seat
      setSelectedSeats(selectedSeats.filter(s => s !== seatNumber));
    } else {
      // Select seat
      if (selectedSeats.length >= totalPassengers) {
        showToast?.(`You can only select ${totalPassengers} seat(s)`, "error");
        return;
      }
      setSelectedSeats([...selectedSeats, seatNumber]);
    }
  };

  const proceedToSeatSelection = async () => {
    setLoading(true);
    setError(null);
    try {
      const totalPassengers = numAdults + numChildren;

      // Auto-assign an available bus based on capacity
      const availableBus = buses.find(bus => 
        bus.is_active && 
        (bus.current_capacity + totalPassengers) <= bus.max_capacity
      );

      if (!availableBus) {
        throw new Error("No buses available with enough seats. Please try again later.");
      }

      setSelectedBus(availableBus);
      await loadOccupiedSeats(availableBus.id);
      setSelectedSeats([]);
      setStep(3);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
      showToast?.(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm("Are you sure you want to delete this ticket? This action cannot be undone.")) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from("tickets")
        .delete()
        .eq("id", ticketId);

      if (error) throw error;

      showToast?.("Ticket deleted successfully", "success");
      await loadMyTickets(); // Reload the tickets list
    } catch (err) {
      console.error("Error deleting ticket:", err);
      showToast?.(`Failed to delete ticket: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    const totalPassengers = numAdults + numChildren;
    
    if (selectedSeats.length !== totalPassengers) {
      showToast?.(`Please select exactly ${totalPassengers} seat(s)`, "error");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // Use cached user; fall back to the local session (no network call)
      let user = currentUser;
      if (!user) {
        const { data: { session } } = await supabase.auth.getSession();
        user = session?.user ?? null;
        if (user) setCurrentUser(user);
      }
      if (!user) throw new Error("Not authenticated");

      const totalFare = fare * totalPassengers;

      // Prepare booking data for payment
      const booking = {
        userId: user.id,
        busId: selectedBus.id,
        departure: selectedDeparture,
        destination: selectedDestination,
        fare: totalFare,
        seatNumbers: selectedSeats,
        numAdults,
        numChildren,
        totalPassengers,
        busName: selectedBus.name || selectedBus.bus_number || 'Bus',
        customerName: passengerName || user.email
      };

      setBookingData(booking);
      setShowPaymentModal(true);
    } catch (err) {
      console.error("Error preparing booking:", err);
      setError(err.message || "Failed to prepare booking");
      showToast?.(err.message || "Failed to prepare booking", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentReference) => {
    setLoading(true);
    try {
      let user = currentUser;
      if (!user) {
        const { data: { session } } = await supabase.auth.getSession();
        user = session?.user ?? null;
        if (user) setCurrentUser(user);
      }
      if (!user) throw new Error("Not authenticated");

      // Generate QR code data
      const qrData = JSON.stringify({
        user_id: user.id,
        bus_id: bookingData.busId,
        departure: bookingData.departure,
        destination: bookingData.destination,
        fare: bookingData.fare / bookingData.totalPassengers,
        num_adults: bookingData.numAdults,
        num_children: bookingData.numChildren,
        total_passengers: bookingData.totalPassengers,
        total_fare: bookingData.fare,
        seat_numbers: bookingData.seatNumbers,
        payment_reference: paymentReference,
        timestamp: new Date().toISOString(),
      });

      // Create ticket after successful payment
      const { data, error } = await supabase
        .from("tickets")
        .insert({
          user_id: user.id,
          bus_id: bookingData.busId,
          departure: bookingData.departure,
          destination: bookingData.destination,
          fare: bookingData.fare,
          seat_numbers: bookingData.seatNumbers,
          qr_code: qrData,
          status: "active",
          payment_status: "paid",
          payment_reference: paymentReference,
          scheduled_date: new Date().toISOString(),
          reschedule_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      setTicket(data);
      setStep(4);
      setShowPaymentModal(false);
      setBookingData(null);
      await loadMyTickets();
      showToast?.("✓ Payment successful! Your ticket has been created. Seats: " + bookingData.seatNumbers.join(", "), "success");
    } catch (err) {
      console.error("Error creating ticket after payment:", err);
      setError(err.message || "Failed to create ticket");
      showToast?.(err.message || "Failed to create ticket after payment", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStartOver = () => {
    setStep(-1);
    setSelectedBus(null);
    setSelectedDeparture("");
    setSelectedDestination("");
    setFare(0);
    setNumAdults(1);
    setNumChildren(0);
    setTicket(null);
    setError(null);
    setSelectedSeats([]);
    setOccupiedSeats([]);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.clear();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even if API call fails
      localStorage.clear();
      window.location.href = "/login";
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh",
      backgroundImage: "url('/images/banner.jpg')",
      backgroundSize: "cover",
      backgroundPosition: isMobile ? "center top" : "center",
      backgroundRepeat: "no-repeat",
      backgroundAttachment: isMobile ? "scroll" : "fixed",
      padding: isMobile ? "12px" : "20px",
      overflowX: "hidden"
    }}>
      {/* Top Navigation Bar */}
      <div style={{
        position: isMobile ? "relative" : "fixed",
        top: 0,
        left: 0,
        right: 0,
        padding: isMobile ? "10px 12px" : "12px 24px",
        background: "white",
        backdropFilter: "blur(10px)",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        justifyContent: "space-between",
        alignItems: isMobile ? "stretch" : "center",
        gap: isMobile ? "10px" : "0",
        zIndex: 1000,
        borderBottom: "2px solid #C2185B"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "8px" : "12px", width: isMobile ? "100%" : "auto" }}>
          <img 
            src="/images/logo.png" 
            alt="Logo" 
            style={{ height: isMobile ? "56px" : "140px", width: "auto", objectFit: "contain", maxWidth: isMobile ? "90px" : "none" }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div>
            <h2 style={{ 
              margin: 0, 
              color: "#C2185B",
              fontSize: isMobile ? "1.05em" : "1.3em"
            }}>
              Passenger Dashboard
            </h2>
          {passengerName && (
            <p style={{
              margin: "4px 0 0 0",
              color: darkMode ? "#ccc" : "#666",
              fontSize: "0.9em"
            }}>
              Welcome, {passengerName}!
            </p>
          )}
          </div>
        </div>
        
        <div style={{ display: "flex", gap: isMobile ? "8px" : "16px", alignItems: "center", width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "space-between" : "flex-end", flexWrap: "wrap" }}>
          {/* Notification Icon */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: "1.1em",
              color: "#C2185B",
              position: "relative",
              padding: "8px"
            }}
            title="Notifications"
          >
            {isMobile ? <FiBell size={18} /> : <><FiBell style={{ marginRight: 8 }} /> Notifications</>}
            {unreadCount > 0 && (
              <span style={{
                position: "absolute",
                top: "5px",
                right: "5px",
                background: "#FF4444",
                color: "white",
                borderRadius: "50%",
                width: "18px",
                height: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.65em",
                fontWeight: "bold"
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              background: "white",
              border: "2px solid #C2185B",
              borderRadius: "20px",
              padding: isMobile ? "8px 12px" : "8px 16px",
              cursor: "pointer",
              fontSize: "0.9em",
              color: "#C2185B",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
            title="Toggle Dark Mode"
          >
            {darkMode ? <FiSun /> : <FiMoon />}
            {isMobile ? (darkMode ? "Light" : "Dark") : (darkMode ? "Light Mode" : "Dark Mode")}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              background: darkMode ? "#FF4444" : "#dc3545",
              border: "none",
              borderRadius: "20px",
              padding: isMobile ? "8px 12px" : "8px 16px",
              cursor: "pointer",
              fontSize: "0.9em",
              color: "white",
              fontWeight: "600"
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div style={{
          position: "fixed",
          top: isMobile ? "120px" : "60px",
          right: isMobile ? "12px" : "24px",
          left: isMobile ? "12px" : "auto",
          background: "white",
          border: "2px solid #C2185B",
          borderRadius: "8px",
          padding: "16px",
          minWidth: isMobile ? "auto" : "300px",
          maxWidth: isMobile ? "none" : "400px",
          maxHeight: "400px",
          overflowY: "auto",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          zIndex: 1001,
          color: darkMode ? "#fff" : "#333"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
            <h3 style={{ margin: 0, color: "#C2185B" }}>Notifications</h3>
            <div style={{ display: "flex", gap: "8px" }}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    background: "#C2185B",
                    border: "none",
                    borderRadius: "5px",
                    padding: "5px 10px",
                    cursor: "pointer",
                    fontSize: "0.75em",
                    color: "white"
                  }}
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setShowNotifications(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.2em",
                  color: darkMode ? "#FFB6D9" : "#7B2CBF"
                }}
              >
                ✕
              </button>
            </div>
          </div>
          {notifications.length === 0 ? (
            <p style={{ margin: 0, fontSize: "0.9em", color: darkMode ? "#ccc" : "#666" }}>
              No notifications yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  style={{
                    padding: "12px",
                    background: notif.is_read 
                      ? (darkMode ? "rgba(255, 255, 255, 0.05)" : "#f9f9f9")
                      : (darkMode ? "rgba(255, 182, 217, 0.2)" : "#fff3e0"),
                    borderRadius: "8px",
                    borderLeft: notif.is_read 
                      ? "3px solid transparent" 
                      : `3px solid ${darkMode ? "#FFB6D9" : "#FF9800"}`,
                    fontSize: "0.9em",
                    transition: "all 0.2s ease",
                    position: "relative"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "10px" }}>
                    <div 
                      onClick={() => !notif.is_read && markNotificationAsRead(notif.id)}
                      style={{ 
                        flex: 1,
                        cursor: notif.is_read ? "default" : "pointer"
                      }}
                      onMouseEnter={(e) => {
                        if (!notif.is_read) {
                          e.currentTarget.style.opacity = "0.8";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!notif.is_read) {
                          e.currentTarget.style.opacity = "1";
                        }
                      }}
                    >
                      <div style={{ fontWeight: notif.is_read ? "normal" : "bold", marginBottom: 5, color: darkMode ? "#FFB6D9" : "#333" }}>
                        {notif.title}
                      </div>
                      <div style={{ color: darkMode ? "#ccc" : "#666", fontSize: "0.9em", whiteSpace: "pre-line" }}>
                        {notif.message}
                      </div>
                      <div style={{ fontSize: "0.75em", color: darkMode ? "#999" : "#999", marginTop: 5, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "5px" }}>
                        <span>{new Date(notif.created_at).toLocaleString()}</span>
                        {!notif.is_read && (
                          <span style={{ fontSize: "0.85em", color: darkMode ? "#FFB6D9" : "#C2185B", fontWeight: "bold" }}>
                            Click to mark as read
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#F44336",
                        cursor: "pointer",
                        fontSize: "1.2em",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        transition: "all 0.2s ease",
                        lineHeight: "1",
                        minWidth: "24px"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(244, 67, 54, 0.1)";
                        e.currentTarget.style.transform = "scale(1.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                      title="Delete notification"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
          padding: "20px"
        }}
        onClick={() => setShowReviewModal(false)}
        >
          <div 
            style={{
              background: darkMode ? "#2C2C2C" : "white",
              borderRadius: "12px",
              padding: "30px",
              maxWidth: "500px",
              width: "100%",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              border: darkMode ? "2px solid #FFB6D9" : "2px solid #7B2CBF"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ 
              margin: "0 0 20px 0", 
              color: darkMode ? "#FFB6D9" : "#7B2CBF",
              textAlign: "center"
            }}>
              Leave a Review
            </h3>

            {/* Star Rating */}
            <div style={{ marginBottom: 20, textAlign: "center" }}>
              <div style={{ 
                fontSize: "0.9em", 
                marginBottom: 10, 
                color: darkMode ? "#ccc" : "#333",
                fontWeight: "600"
              }}>
                Rate our service:
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    style={{
                      background: "transparent",
                      border: "none",
                      fontSize: "2em",
                      cursor: "pointer",
                      transition: "transform 0.2s",
                      padding: 0
                    }}
                    onMouseEnter={(e) => e.target.style.transform = "scale(1.2)"}
                    onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                  >
                    {star <= reviewRating ? "★" : "☆"}
                  </button>
                ))}
              </div>
              {reviewRating > 0 && (
                <div style={{ 
                  marginTop: 10, 
                  color: "#FFB6D9", 
                  fontWeight: "bold" 
                }}>
                  {reviewRating} star{reviewRating > 1 ? "s" : ""}
                </div>
              )}
            </div>

            {/* Comment */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                display: "block", 
                marginBottom: 8, 
                color: darkMode ? "#ccc" : "#333",
                fontWeight: "600"
              }}>
                Your feedback (optional):
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Tell us about your experience..."
                rows={4}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: darkMode ? "2px solid rgba(255, 182, 217, 0.5)" : "2px solid #FFB6D9",
                  background: darkMode ? "#1A1A1A" : "white",
                  color: darkMode ? "#fff" : "#333",
                  fontSize: "0.95em",
                  resize: "vertical",
                  fontFamily: "inherit"
                }}
              />
            </div>

            {/* My Previous Reviews */}
            {myReviews.length > 0 && (
              <div style={{ 
                marginBottom: 20,
                padding: "15px",
                background: darkMode ? "rgba(255, 182, 217, 0.1)" : "#f8f9fa",
                borderRadius: "8px",
                maxHeight: "200px",
                overflowY: "auto"
              }}>
                <h4 style={{ 
                  margin: "0 0 10px 0", 
                  fontSize: "0.9em",
                  color: darkMode ? "#FFB6D9" : "#7B2CBF"
                }}>
                  Your Previous Reviews:
                </h4>
                {myReviews.map(review => (
                  <div key={review.id} style={{
                    padding: "10px",
                    marginBottom: "10px",
                    background: darkMode ? "rgba(255, 255, 255, 0.05)" : "white",
                    borderRadius: "6px",
                    border: darkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #ddd"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ color: "#C2185B" }}>
                        {"★".repeat(review.rating)}
                      </div>
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        style={{
                          background: "#dc3545",
                          border: "none",
                          borderRadius: "4px",
                          padding: "4px 8px",
                          color: "white",
                          fontSize: "0.75em",
                          cursor: "pointer"
                        }}
                      >
                        Delete
                      </button>
                    </div>
                    {review.comment && (
                      <div style={{ 
                        marginTop: 5, 
                        fontSize: "0.85em",
                        color: darkMode ? "#ccc" : "#666"
                      }}>
                        {review.comment}
                      </div>
                    )}
                    <div style={{ 
                      marginTop: 5,
                      fontSize: "0.7em",
                      color: darkMode ? "#999" : "#999"
                    }}>
                      {new Date(review.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview || reviewRating === 0}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "8px",
                  border: "none",
                  background: reviewRating === 0 ? "#999" : "#C2185B",
                  color: "white",
                  fontWeight: "600",
                  cursor: reviewRating === 0 ? "not-allowed" : "pointer",
                  fontSize: "0.95em"
                }}
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewRating(0);
                  setReviewComment("");
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "8px",
                  border: "2px solid #C2185B",
                  background: "transparent",
                  color: "#C2185B",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "0.95em"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && rescheduleTicket && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
          padding: "20px"
        }}
        onClick={() => setShowRescheduleModal(false)}
        >
          <div 
            style={{
              background: darkMode ? "#2C2C2C" : "white",
              borderRadius: "12px",
              padding: "30px",
              maxWidth: "500px",
              width: "100%",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              border: "2px solid #C2185B"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ 
              margin: "0 0 20px 0", 
              color: "#C2185B",
              textAlign: "center"
            }}>
              Reschedule Trip
            </h3>

            {/* Current Trip Info */}
            <div style={{
              background: darkMode ? "rgba(255, 182, 217, 0.1)" : "#f8f9fa",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: 20,
              border: darkMode ? "1px solid rgba(255, 182, 217, 0.3)" : "1px solid #dee2e6"
            }}>
              <div style={{ fontSize: "0.9em", fontWeight: "bold", marginBottom: 10, color: darkMode ? "#FFB6D9" : "#7B2CBF" }}>
                Current Trip Details:
              </div>
              <div style={{ fontSize: "0.85em", color: darkMode ? "#ccc" : "#666", marginBottom: 5 }}>
                <strong>Route:</strong> {rescheduleTicket.departure} → {rescheduleTicket.destination}
              </div>
              <div style={{ fontSize: "0.85em", color: darkMode ? "#ccc" : "#666", marginBottom: 5 }}>
                <strong>Current Scheduled Date:</strong> {rescheduleTicket.scheduled_date ? new Date(rescheduleTicket.scheduled_date).toLocaleString() : new Date(rescheduleTicket.created_at).toLocaleString()}
              </div>
              {rescheduleTicket.reschedule_count > 0 && (
                <div style={{ fontSize: "0.85em", color: "#ff9800", marginTop: 5 }}>
                  ⚠️ This ticket has been rescheduled {rescheduleTicket.reschedule_count} time{rescheduleTicket.reschedule_count > 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* New Date Selection */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                display: "block", 
                marginBottom: 8, 
                color: darkMode ? "#ccc" : "#333",
                fontWeight: "600"
              }}>
                New Date:
              </label>
              <input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: darkMode ? "2px solid rgba(255, 182, 217, 0.5)" : "2px solid #FFB6D9",
                  background: darkMode ? "#1A1A1A" : "white",
                  color: darkMode ? "#fff" : "#333",
                  fontSize: "0.95em",
                  fontFamily: "inherit"
                }}
              />
            </div>

            {/* Time Selection */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                display: "block", 
                marginBottom: 8, 
                color: darkMode ? "#ccc" : "#333",
                fontWeight: "600"
              }}>
                New Time:
              </label>
              <input
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: darkMode ? "2px solid rgba(255, 182, 217, 0.5)" : "2px solid #FFB6D9",
                  background: darkMode ? "#1A1A1A" : "white",
                  color: darkMode ? "#fff" : "#333",
                  fontSize: "0.95em",
                  fontFamily: "inherit"
                }}
              />
            </div>

            {/* Reason */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                display: "block", 
                marginBottom: 8, 
                color: darkMode ? "#ccc" : "#333",
                fontWeight: "600"
              }}>
                Reason for rescheduling (optional):
              </label>
              <textarea
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="e.g., Personal emergency, work commitment, etc."
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: darkMode ? "2px solid rgba(255, 182, 217, 0.5)" : "2px solid #FFB6D9",
                  background: darkMode ? "#1A1A1A" : "white",
                  color: darkMode ? "#fff" : "#333",
                  fontSize: "0.95em",
                  resize: "vertical",
                  fontFamily: "inherit"
                }}
              />
            </div>

            {/* Info Message */}
            <div style={{
              background: "#fff3cd",
              border: "1px solid #ffeaa7",
              borderRadius: "6px",
              padding: "10px",
              marginBottom: 20,
              fontSize: "0.85em",
              color: "#856404"
            }}>
              ℹ️ Your seat selection will be preserved. The ticket will be valid for the new date and time.
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleSubmitReschedule}
                disabled={submittingReschedule || !rescheduleDate || !rescheduleTime}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "8px",
                  border: "none",
                  background: (!rescheduleDate || !rescheduleTime) ? "#999" : "#C2185B",
                  color: "white",
                  fontWeight: "600",
                  cursor: (!rescheduleDate || !rescheduleTime) ? "not-allowed" : "pointer",
                  fontSize: "0.95em"
                }}
              >
                {submittingReschedule ? "Rescheduling..." : "Confirm Reschedule"}
              </button>
              <button
                onClick={() => {
                  setShowRescheduleModal(false);
                  setRescheduleTicket(null);
                  setRescheduleDate("");
                  setRescheduleTime("");
                  setRescheduleReason("");
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "8px",
                  border: darkMode ? "2px solid #FFB6D9" : "2px solid #7B2CBF",
                  background: "transparent",
                  color: darkMode ? "#FFB6D9" : "#7B2CBF",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "0.95em"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Horizontal Navigation Menu */}
      <div style={{
        position: isMobile ? "relative" : "fixed",
        top: isMobile ? "0" : "164px",
        left: 0,
        right: 0,
        marginTop: isMobile ? "12px" : "0",
        padding: "0",
        background: darkMode ? "#2C2C2C" : "white",
        borderBottom: "2px solid #C2185B",
        zIndex: 999,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          justifyContent: isMobile ? "flex-start" : "center",
          gap: "0",
          overflowX: isMobile ? "auto" : "visible"
        }}>
          {[
            { id: 'home', label: 'Home', icon: FiHome },
            { id: 'enquiry', label: 'Enquiry', icon: FiMail },
            { id: 'myTickets', label: 'My Tickets', icon: FiFileText },
            { id: 'reviews', label: 'Reviews', icon: FiStar }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              style={{
                flex: isMobile ? "0 0 auto" : 1,
                minWidth: isMobile ? "110px" : "auto",
                padding: isMobile ? "12px 14px" : "16px 24px",
                background: activeMenu === item.id 
                  ? (darkMode ? "#C2185B" : "#C2185B") 
                  : "transparent",
                border: "none",
                borderBottom: activeMenu === item.id ? "3px solid #C2185B" : "3px solid transparent",
                color: activeMenu === item.id ? "white" : (darkMode ? "#E0E0E0" : "#666"),
                fontWeight: activeMenu === item.id ? "700" : "500",
                cursor: "pointer",
                fontSize: isMobile ? "0.9em" : "1em",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                if (activeMenu !== item.id) {
                  e.currentTarget.style.background = darkMode ? "rgba(194, 24, 91, 0.1)" : "rgba(194, 24, 91, 0.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeMenu !== item.id) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: isMobile ? "16px auto 0" : "240px auto 0", padding: isMobile ? 8 : 20 }}>

      {/* HOME - Booking Section */}
      {activeMenu === 'home' && (
        <>
      {step === -1 && (
        <div style={{
          textAlign: "center",
          padding: isMobile ? "32px 14px" : "60px 20px",
          background: darkMode ? "rgba(44, 44, 44, 0.95)" : "white",
          borderRadius: "20px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          border: darkMode ? "2px solid rgba(194, 24, 91, 0.3)" : "2px solid #C2185B"
        }}>
          <div style={{
            marginBottom: "20px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}>
            <FiTruck 
              size={isMobile ? 56 : 80} 
              color={darkMode ? "#FFB6D9" : "#C2185B"}
              style={{ strokeWidth: 1.5 }}
            />
          </div>
          <h2 style={{ 
            color: darkMode ? "#FFB6D9" : "#C2185B",
            fontSize: isMobile ? "1.8em" : "2.5em",
            marginBottom: "15px",
            fontWeight: "700"
          }}>
            Book Your Journey
          </h2>
          <p style={{ 
            color: darkMode ? "#ccc" : "#666",
            fontSize: isMobile ? "1em" : "1.2em",
            marginBottom: "40px",
            lineHeight: "1.6"
          }}>
            Travel comfortably and affordably with Tiyandza Transport.<br />
            Select your route, choose your seat, and get your ticket instantly!
          </p>
          <button
            onClick={() => setStep(0)}
            className="login-btn"
            style={{
              background: "linear-gradient(135deg, #C2185B 0%, #FF69B4 100%)",
              fontSize: isMobile ? "1.05em" : "1.3em",
              padding: isMobile ? "14px 24px" : "18px 60px",
              width: isMobile ? "100%" : "auto",
              maxWidth: isMobile ? "320px" : "none",
              border: "none",
              borderRadius: "50px",
              color: "white",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 8px 20px rgba(194, 24, 91, 0.4)",
              transition: "all 0.3s ease",
              textTransform: "uppercase",
              letterSpacing: "1px"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 12px 28px rgba(194, 24, 91, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(194, 24, 91, 0.4)";
            }}
          >
            <FiMapPin size={20} style={{ marginRight: "8px" }} /> Book Now
          </button>
          <div style={{
            marginTop: "40px",
            padding: "20px",
            background: darkMode ? "rgba(194, 24, 91, 0.1)" : "rgba(194, 24, 91, 0.05)",
            borderRadius: "12px"
          }}>
            <p style={{ 
              color: darkMode ? "#FFB6D9" : "#C2185B",
              fontWeight: "600",
              marginBottom: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}>
              <FiStar size={18} /> Why Choose Us?
            </p>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "15px",
              marginTop: "15px"
            }}>
              <div style={{ color: darkMode ? "#ccc" : "#666", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <FiTruck size={18} /> Modern Fleet
              </div>
              <div style={{ color: darkMode ? "#ccc" : "#666", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <FiCalendar size={18} /> Instant Booking
              </div>
              <div style={{ color: darkMode ? "#ccc" : "#666", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <FiCreditCard size={18} /> Secure Payment
              </div>
              <div style={{ color: darkMode ? "#ccc" : "#666", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <FiSmartphone size={18} /> Digital Tickets
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 0 && (
        <div>
          <h3>Select Departure Point</h3>
          {departures.map(dep => (
            <button
              key={dep}
              onClick={() => handleDepartureSelect(dep)}
              className="login-btn"
              style={{ marginBottom: 10, width: "100%" }}
            >
              {dep}
            </button>
          ))}
          <button 
            onClick={() => setStep(-1)} 
            className="login-btn" 
            style={{ background: "#6c757d", marginTop: 10 }}
          >
            ← Back to Home
          </button>
        </div>
      )}

      {step === 1 && (
        <div>
          <h3>Select Destination</h3>
          <div style={{ marginBottom: 10, padding: 10, background: "white", borderRadius: 8 }}>
            <strong>From:</strong> {selectedDeparture}
          </div>
          {destinations.length === 0 ? (
            <p style={{ padding: 20, background: "white", borderRadius: 8 }}>No destinations available from {selectedDeparture}</p>
          ) : (
            destinations.map(dest => (
              <button
                key={dest.id}
                onClick={() => handleDestinationSelect(dest)}
                className="login-btn"
                style={{ marginBottom: 10, width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <span>{dest.destination}</span>
                <span style={{ fontWeight: "bold" }}>E{dest.fare}</span>
              </button>
            ))
          )}
          <button onClick={() => setStep(0)} className="login-btn" style={{ background: "#6c757d" }}>
            Back to Departure Selection
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3>Confirm Your Booking</h3>
          
          {/* Passenger Count Selection */}
          <div style={{ 
            background: darkMode ? "rgba(255, 255, 255, 0.1)" : "#f5f5f5", 
            padding: 20, 
            borderRadius: 8, 
            marginBottom: 20,
            border: darkMode ? "1px solid rgba(255, 255, 255, 0.2)" : "none"
          }}>
            <h4 style={{ marginTop: 0, color: darkMode ? "#FFB6D9" : "#333" }}>Number of Passengers</h4>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: 20 }}>
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: 8, 
                  fontWeight: "600",
                  color: darkMode ? "#ccc" : "#555"
                }}>
                  Adults
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={numAdults}
                  onChange={(e) => setNumAdults(Math.max(1, parseInt(e.target.value) || 1))}
                  className="login-input"
                  style={{ width: "100%" }}
                />
              </div>
              
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: 8, 
                  fontWeight: "600",
                  color: darkMode ? "#ccc" : "#555"
                }}>
                  Children
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={numChildren}
                  onChange={(e) => setNumChildren(Math.max(0, parseInt(e.target.value) || 0))}
                  className="login-input"
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </div>

          <div style={{ 
            background: darkMode ? "rgba(255, 255, 255, 0.1)" : "#f5f5f5", 
            padding: 20, 
            borderRadius: 8, 
            marginBottom: 20,
            border: darkMode ? "1px solid rgba(255, 255, 255, 0.2)" : "none"
          }}>
            <div style={{ marginBottom: 10, color: darkMode ? "#ccc" : "#333" }}>
              <strong>From:</strong> {selectedDeparture}
            </div>
            <div style={{ marginBottom: 10, color: darkMode ? "#ccc" : "#333" }}>
              <strong>To:</strong> {selectedDestination}
            </div>
            <div style={{ marginBottom: 10, color: darkMode ? "#ccc" : "#333" }}>
              <strong>Adults:</strong> {numAdults}
            </div>
            <div style={{ marginBottom: 10, color: darkMode ? "#ccc" : "#333" }}>
              <strong>Children:</strong> {numChildren}
            </div>
            <div style={{ marginBottom: 10, color: darkMode ? "#ccc" : "#333" }}>
              <strong>Total Passengers:</strong> {numAdults + numChildren}
            </div>
            <div style={{ 
              fontSize: "0.9em", 
              color: darkMode ? "#999" : "#666", 
              marginBottom: 15,
              padding: "10px",
              background: darkMode ? "rgba(255, 182, 217, 0.1)" : "#fff3e0",
              borderRadius: 4
            }}>
              Fare per person: E{fare}
            </div>
            <div style={{ fontSize: "1.5em", fontWeight: "bold", color: "#4CAF50" }}>
              Total Fare: E{fare * (numAdults + numChildren)}
            </div>
          </div>
          {error && <div style={{ color: "#dc3545", marginBottom: 10 }}>{error}</div>}
          <button
            onClick={proceedToSeatSelection}
            disabled={loading}
            className="login-btn"
            style={{ width: "100%", marginBottom: 10, background: "#4CAF50" }}
          >
            {loading ? "Processing..." : "Continue to Seat Selection"}
          </button>
          <button onClick={() => setStep(1)} className="login-btn" style={{ background: "#6c757d" }}>
            Back to Destination Selection
          </button>
        </div>
      )}

      {step === 3 && (
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h3 style={{ color: darkMode ? "#FFB6D9" : "#333", textAlign: "center" }}>Select Your Seats</h3>
          
          <div style={{
            background: darkMode ? "rgba(255, 255, 255, 0.1)" : "#f5f5f5",
            padding: 20,
            borderRadius: 8,
            marginBottom: 20,
            border: darkMode ? "1px solid rgba(255, 255, 255, 0.2)" : "none"
          }}>
            <div style={{ marginBottom: 10, color: darkMode ? "#ccc" : "#333" }}>
              <strong>Bus:</strong> {selectedBus?.bus_number}
            </div>
            <div style={{ marginBottom: 10, color: darkMode ? "#ccc" : "#333" }}>
              <strong>Total Passengers:</strong> {numAdults + numChildren}
            </div>
            <div style={{ marginBottom: 10, color: darkMode ? "#ccc" : "#333" }}>
              <strong>Seats Selected:</strong> {selectedSeats.length} / {numAdults + numChildren}
            </div>
            {selectedSeats.length > 0 && (
              <div style={{ color: "#4CAF50", fontWeight: "bold" }}>
                Your seats: {selectedSeats.sort((a, b) => a - b).join(", ")}
              </div>
            )}
          </div>

          {/* Bus Layout */}
          <div style={{
            background: darkMode ? "rgba(255, 255, 255, 0.05)" : "white",
            padding: "30px 20px",
            borderRadius: 12,
            marginBottom: 20,
            border: darkMode ? "2px solid rgba(255, 255, 255, 0.1)" : "2px solid #ddd"
          }}>
            {/* Driver Section */}
            <div style={{
              marginBottom: 30,
              paddingBottom: 20,
              borderBottom: darkMode ? "2px dashed rgba(255, 255, 255, 0.2)" : "2px dashed #ccc",
              textAlign: "center"
            }}>
              <div style={{
                display: "inline-block",
                background: "#C2185B",
                color: "white",
                padding: "10px 30px",
                borderRadius: 8,
                fontWeight: "bold"
              }}>
                🚗 Driver
              </div>
            </div>

            {/* Seat Layout */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {Array.from({ length: 10 }, (_, rowIndex) => (
                <div key={rowIndex} style={{ display: "flex", justifyContent: "center", gap: "12px", alignItems: "center" }}>
                  {/* Left side - 2 seats */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    {[1, 2].map(col => {
                      const seatNumber = rowIndex * 5 + col;
                      const isOccupied = occupiedSeats.includes(seatNumber);
                      const isSelected = selectedSeats.includes(seatNumber);
                      
                      return (
                        <button
                          key={seatNumber}
                          onClick={() => handleSeatClick(seatNumber)}
                          disabled={isOccupied}
                          style={{
                            width: 45,
                            height: 45,
                            borderRadius: 8,
                            border: isSelected 
                              ? "3px solid #4CAF50" 
                              : isOccupied 
                                ? "2px solid #999" 
                                : "2px solid #C2185B",
                            background: isOccupied 
                              ? "#999" 
                              : isSelected 
                                ? "#4CAF50" 
                                : "transparent",
                            color: isOccupied || isSelected ? "white" : darkMode ? "#fff" : "#333",
                            cursor: isOccupied ? "not-allowed" : "pointer",
                            fontWeight: "bold",
                            fontSize: "0.85em",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                            transition: "all 0.2s",
                            boxShadow: isSelected ? "0 0 10px rgba(76, 175, 80, 0.5)" : "none"
                          }}
                        >
                          {isOccupied ? "✗" : seatNumber}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Aisle */}
                  <div style={{ width: 30, textAlign: "center", color: darkMode ? "#666" : "#ccc", fontWeight: "bold" }}>
                    │
                  </div>
                  
                  {/* Right side - 3 seats */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    {[3, 4, 5].map(col => {
                      const seatNumber = rowIndex * 5 + col;
                      const isOccupied = occupiedSeats.includes(seatNumber);
                      const isSelected = selectedSeats.includes(seatNumber);
                      
                      return (
                        <button
                          key={seatNumber}
                          onClick={() => handleSeatClick(seatNumber)}
                          disabled={isOccupied}
                          style={{
                            width: 45,
                            height: 45,
                            borderRadius: 8,
                            border: isSelected 
                              ? "3px solid #4CAF50" 
                              : isOccupied 
                                ? "2px solid #999" 
                                : "2px solid #C2185B",
                            background: isOccupied 
                              ? "#999" 
                              : isSelected 
                                ? "#4CAF50" 
                                : "transparent",
                            color: isOccupied || isSelected ? "white" : darkMode ? "#fff" : "#333",
                            cursor: isOccupied ? "not-allowed" : "pointer",
                            fontWeight: "bold",
                            fontSize: "0.85em",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                            transition: "all 0.2s",
                            boxShadow: isSelected ? "0 0 10px rgba(76, 175, 80, 0.5)" : "none"
                          }}
                        >
                          {isOccupied ? "✗" : seatNumber}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: 20,
            marginBottom: 20,
            flexWrap: "wrap"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 30,
                height: 30,
                background: "transparent",
                border: "2px solid #C2185B",
                borderRadius: 6
              }} />
              <span style={{ color: darkMode ? "#ccc" : "#333", fontSize: "0.9em" }}>Available</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 30,
                height: 30,
                background: "#4CAF50",
                border: "3px solid #4CAF50",
                borderRadius: 6
              }} />
              <span style={{ color: darkMode ? "#ccc" : "#333", fontSize: "0.9em" }}>Selected</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 30,
                height: 30,
                background: "#999",
                border: "2px solid #999",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold"
              }}>✗</div>
              <span style={{ color: darkMode ? "#ccc" : "#333", fontSize: "0.9em" }}>Occupied</span>
            </div>
          </div>

          {error && <div style={{ color: "#dc3545", marginBottom: 10, textAlign: "center" }}>{error}</div>}
          
          <button
            onClick={handleCheckout}
            disabled={loading || selectedSeats.length !== (numAdults + numChildren)}
            className="login-btn"
            style={{ 
              width: "100%", 
              marginBottom: 10, 
              background: selectedSeats.length === (numAdults + numChildren) ? "#C2185B" : "#999",
              color: "white",
              cursor: selectedSeats.length === (numAdults + numChildren) ? "pointer" : "not-allowed"
            }}
          >
            {loading ? "Processing..." : `Proceed to Pay (${selectedSeats.length}/${numAdults + numChildren} seats)`}
          </button>
          <button onClick={() => setStep(2)} className="login-btn" style={{ background: "#6c757d", width: "100%" }}>
            Back to Booking Details
          </button>
        </div>
      )}

      {step === 4 && ticket && (
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ 
            textAlign: "center", 
            marginBottom: 25,
            padding: "15px",
            background: "#C2185B",
            borderRadius: 8,
            color: "white"
          }}>
            <div style={{ fontSize: "2em", marginBottom: 5 }}>✓</div>
            <h3 style={{ margin: 0, color: "white" }}>Ticket Booked Successfully!</h3>
          </div>
          
          <div
            id={`new-ticket-full-${ticket.id}`}
            style={{ 
              background: "white",
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              border: "1px solid #e0e0e0",
              marginBottom: 20
            }}
          >
            {/* Ticket Header */}
            <div style={{
              background: "#C2185B",
              color: "white",
              padding: "15px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <div style={{ fontSize: "1.3em", fontWeight: "bold", letterSpacing: "1px" }}>
                  ESWATINI TRANSPORT
                </div>
                <div style={{ fontSize: "0.85em", opacity: 0.9, marginTop: 2 }}>
                  Bus Ticket
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ 
                  fontSize: "0.8em", 
                  opacity: 0.9,
                  background: "rgba(255,255,255,0.2)",
                  padding: "4px 10px",
                  borderRadius: 4
                }}>
                  Ticket #{ticket.id.slice(0, 8).toUpperCase()}
                </div>
              </div>
            </div>

            {/* Main Ticket Body */}
            <div style={{ display: "flex", minHeight: 240 }}>
              {/* Left Side - Ticket Details */}
              <div style={{ 
                flex: 1, 
                padding: 25,
                borderRight: "2px dashed #d0d0d0",
                position: "relative"
              }}>
                {/* Semicircle notches */}
                <div style={{
                  position: "absolute",
                  right: -12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 24,
                  height: 24,
                  background: "#f5f5f5",
                  borderRadius: "50%",
                  border: "2px solid #e0e0e0",
                  borderRight: "none"
                }} />
                
                {/* Route Information */}
                <div style={{ marginBottom: 25 }}>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between",
                    marginBottom: 15
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.75em", color: "#666", marginBottom: 6 }}>
                        FROM
                      </div>
                      <div style={{ 
                        fontSize: "1.6em", 
                        fontWeight: "bold",
                        color: "#333"
                      }}>
                        {ticket.departure}
                      </div>
                    </div>
                    
                    <div style={{ 
                      padding: "0 20px",
                      fontSize: "1.8em",
                      color: "#FFB6D9"
                    }}>
                      →
                    </div>
                    
                    <div style={{ flex: 1, textAlign: "right" }}>
                      <div style={{ fontSize: "0.75em", color: "#666", marginBottom: 6 }}>
                        TO
                      </div>
                      <div style={{ 
                        fontSize: "1.6em", 
                        fontWeight: "bold",
                        color: "#333"
                      }}>
                        {ticket.destination}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ticket Details Grid */}
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px"
                }}>
                  <div>
                    <div style={{ fontSize: "0.7em", color: "#666", marginBottom: 3 }}>
                      PASSENGER NAME
                    </div>
                    <div style={{ fontSize: "1em", fontWeight: "600", color: "#333" }}>
                      {passengerName}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: "0.7em", color: "#666", marginBottom: 3 }}>
                      BUS NUMBER
                    </div>
                    <div style={{ fontSize: "1.2em", fontWeight: "600", color: "#333" }}>
                      {selectedBus?.bus_number}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: "0.7em", color: "#666", marginBottom: 3 }}>
                      ADULTS
                    </div>
                    <div style={{ fontSize: "1.2em", fontWeight: "600", color: "#333" }}>
                      {ticket.num_adults || numAdults}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: "0.7em", color: "#666", marginBottom: 3 }}>
                      CHILDREN
                    </div>
                    <div style={{ fontSize: "1.2em", fontWeight: "600", color: "#333" }}>
                      {ticket.num_children || numChildren}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: "0.7em", color: "#666", marginBottom: 3 }}>
                      TOTAL PASSENGERS
                    </div>
                    <div style={{ fontSize: "1.2em", fontWeight: "600", color: "#7B2CBF" }}>
                      {ticket.total_passengers || (numAdults + numChildren)}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: "0.7em", color: "#666", marginBottom: 3 }}>
                      TOTAL FARE
                    </div>
                    <div style={{ fontSize: "1.2em", fontWeight: "600", color: "#4CAF50" }}>
                      E{ticket.fare}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: "0.7em", color: "#666", marginBottom: 3 }}>
                      DATE & TIME
                    </div>
                    <div style={{ fontSize: "0.95em", fontWeight: "500", color: "#333" }}>
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: "0.85em", color: "#666" }}>
                      {new Date(ticket.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: "0.7em", color: "#666", marginBottom: 3 }}>
                      STATUS
                    </div>
                    <span style={{
                      padding: "5px 12px",
                      borderRadius: 4,
                      background: "#d4edda",
                      color: "#155724",
                      fontSize: "0.85em",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      display: "inline-block"
                    }}>
                      {ticket.status}
                    </span>
                  </div>

                  {ticket.seat_numbers && ticket.seat_numbers.length > 0 && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ fontSize: "0.7em", color: "#666", marginBottom: 3 }}>
                        SEAT NUMBER{ticket.seat_numbers.length > 1 ? "S" : ""}
                      </div>
                      <div style={{ fontSize: "1.1em", fontWeight: "700", color: "#C2185B", letterSpacing: "1px" }}>
                        {ticket.seat_numbers.join(", ")}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - QR Code Section */}
              <div style={{ 
                width: 240,
                padding: 25,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "#fafafa"
              }}>
                <div style={{ marginBottom: 12, textAlign: "center" }}>
                  <QRCode 
                    id={`new-ticket-qr-${ticket.id}`}
                    value={ticket.qr_code} 
                    size={180}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div style={{ 
                  fontSize: "0.8em", 
                  color: "#666", 
                  textAlign: "center",
                  lineHeight: 1.5,
                  marginBottom: 15
                }}>
                  Scan this code at boarding
                </div>
                
                {/* Download Buttons in QR Section */}
                <div style={{ display: "flex", gap: 8, width: "100%" }}>
                  <button
                    onClick={() => {
                      const ticketElement = document.getElementById(`new-ticket-full-${ticket.id}`);
                      if (ticketElement) {
                        html2canvas(ticketElement, {
                          scale: 2,
                          backgroundColor: '#ffffff',
                          logging: false
                        }).then(canvas => {
                          const url = canvas.toDataURL("image/png");
                          const link = document.createElement("a");
                          link.download = `eswatini-transport-ticket-${ticket.id.slice(0, 8)}.png`;
                          link.href = url;
                          link.click();
                          showToast?.("Ticket downloaded as PNG!", "success");
                        });
                      }
                    }}
                    className="login-btn"
                    style={{ 
                      background: "white", 
                      border: "2px solid #C2185B",
                      color: "#C2185B",
                      padding: "8px 12px", 
                      fontSize: "0.8em",
                      flex: 1
                    }}
                  >
                    PNG
                  </button>
                  <button
                    onClick={() => {
                      const ticketElement = document.getElementById(`new-ticket-full-${ticket.id}`);
                      if (ticketElement) {
                        html2canvas(ticketElement, {
                          scale: 2,
                          backgroundColor: '#ffffff',
                          logging: false
                        }).then(canvas => {
                          const imgData = canvas.toDataURL("image/png");
                          const pdf = new jsPDF({
                            orientation: 'portrait',
                            unit: 'mm',
                            format: 'a4'
                          });
                          const imgWidth = 190;
                          const imgHeight = (canvas.height * imgWidth) / canvas.width;
                          pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
                          pdf.save(`eswatini-transport-ticket-${ticket.id.slice(0, 8)}.pdf`);
                          showToast?.("Ticket downloaded as PDF!", "success");
                        });
                      }
                    }}
                    className="login-btn"
                    style={{ 
                      background: "#C2185B", 
                      border: "2px solid #C2185B",
                      color: "white",
                      padding: "8px 12px", 
                      fontSize: "0.8em",
                      flex: 1
                    }}
                  >
                    PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Ticket Footer */}
            <div style={{
              background: "#f8f9fa",
              padding: "12px 20px",
              fontSize: "0.75em",
              color: "#666",
              borderTop: "1px solid #e0e0e0",
              textAlign: "center",
              lineHeight: 1.6
            }}>
              Please arrive 15 minutes before departure • Keep this ticket until journey completion • Show QR code to conductor
            </div>
          </div>

          <button 
            onClick={handleStartOver} 
            className="login-btn" 
            style={{ 
              background: "#4CAF50",
              width: "100%",
              padding: "12px",
              fontSize: "1em"
            }}
          >
            Book Another Ticket
          </button>
        </div>
      )}
      </>
      )}

      {/* Enquiry Section */}
      {activeMenu === 'enquiry' && (
      <div style={{ marginTop: 30, marginBottom: 20 }}>
        <button
          onClick={() => setShowEnquiryForm(!showEnquiryForm)}
          className="login-btn"
          style={{ 
            marginBottom: 10,
            background: darkMode ? "#FFB6D9" : "#7B2CBF"
          }}
        >
          {showEnquiryForm ? "Hide" : "📧 Submit an Enquiry"}
        </button>
        
        {showEnquiryForm && (
          <div style={{ 
            background: darkMode ? "rgba(255, 255, 255, 0.1)" : "white", 
            padding: 20, 
            borderRadius: 12,
            border: darkMode ? "1px solid rgba(255, 255, 255, 0.2)" : "2px solid #FFB6D9"
          }}>
            <h3 style={{ color: darkMode ? "#FFB6D9" : "#FF69B4", marginTop: 0 }}>Submit Your Enquiry</h3>
            <p style={{ color: darkMode ? "#ccc" : "#666", fontSize: "0.9em", marginBottom: 15 }}>
              Have a question or concern? Send us an enquiry and our admin team will get back to you soon.
            </p>
            
            <div style={{ display: "grid", gap: 15 }}>
              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: darkMode ? "#FFB6D9" : "#FF1493" }}>
                  Your Name: *
                </label>
                <input
                  type="text"
                  value={enquiryForm.name}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, name: e.target.value })}
                  placeholder="Enter your full name"
                  className="login-input"
                  style={{ border: "2px solid #FFB6D9", background: darkMode ? "rgba(255, 255, 255, 0.1)" : "white", color: darkMode ? "#fff" : "#333" }}
                />
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: darkMode ? "#FFB6D9" : "#FF1493" }}>
                  Email Address: *
                </label>
                <input
                  type="email"
                  value={enquiryForm.email}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                  placeholder="Enter your email"
                  className="login-input"
                  style={{ border: "2px solid #FFB6D9", background: darkMode ? "rgba(255, 255, 255, 0.1)" : "white", color: darkMode ? "#fff" : "#333" }}
                />
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: darkMode ? "#FFB6D9" : "#FF1493" }}>
                  Subject: *
                </label>
                <input
                  type="text"
                  value={enquiryForm.subject}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, subject: e.target.value })}
                  placeholder="What is your enquiry about?"
                  className="login-input"
                  style={{ border: "2px solid #FFB6D9", background: darkMode ? "rgba(255, 255, 255, 0.1)" : "white", color: darkMode ? "#fff" : "#333" }}
                />
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: darkMode ? "#FFB6D9" : "#FF1493" }}>
                  Message: *
                </label>
                <textarea
                  value={enquiryForm.message}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
                  placeholder="Describe your enquiry in detail..."
                  rows={5}
                  className="login-input"
                  style={{ border: "2px solid #FFB6D9", background: darkMode ? "rgba(255, 255, 255, 0.1)" : "white", color: darkMode ? "#fff" : "#333", fontFamily: "inherit", resize: "vertical" }}
                />
              </div>
              
              <button
                onClick={handleSubmitEnquiry}
                disabled={submittingEnquiry}
                className="login-btn"
                style={{ 
                  background: submittingEnquiry ? "#ccc" : "#C2185B",
                  cursor: submittingEnquiry ? "not-allowed" : "pointer"
                }}
              >
                {submittingEnquiry ? "Submitting..." : "📤 Submit Enquiry"}
              </button>
            </div>
          </div>
        )}
        
        {/* My Enquiries */}
        {myEnquiries.length > 0 && (
          <div style={{ 
            marginTop: 15,
            background: darkMode ? "rgba(255, 255, 255, 0.1)" : "white", 
            padding: 20, 
            borderRadius: 12,
            border: darkMode ? "1px solid rgba(255, 255, 255, 0.2)" : "2px solid #FFB6D9"
          }}>
            <h4 style={{ color: darkMode ? "#FFB6D9" : "#FF69B4", marginTop: 0 }}>My Enquiries ({myEnquiries.length})</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {myEnquiries.map((enq) => (
                <div key={enq.id} style={{
                  padding: 15,
                  background: enq.status === 'pending' ? '#FFF3E0' : '#E8F5E9',
                  borderRadius: 8,
                  border: `2px solid ${enq.status === 'pending' ? '#FF9800' : '#4CAF50'}`
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontWeight: "bold", color: "#FF1493" }}>{enq.subject}</div>
                    <span style={{
                      padding: "3px 10px",
                      borderRadius: 10,
                      fontSize: "0.75em",
                      fontWeight: "bold",
                      background: enq.status === 'pending' ? '#FF9800' : '#4CAF50',
                      color: 'white'
                    }}>
                      {enq.status === 'pending' ? 'Pending' : 'Responded'}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.85em", color: "#666", marginBottom: 5 }}>{enq.message}</div>
                  {enq.response && (
                    <div style={{ marginTop: 10, padding: 10, background: "rgba(76, 175, 80, 0.1)", borderRadius: 6, borderLeft: "3px solid #4CAF50" }}>
                      <div style={{ fontSize: "0.8em", fontWeight: "bold", color: "#4CAF50", marginBottom: 3 }}>✓ Admin Response:</div>
                      <div style={{ fontSize: "0.85em", color: "#333" }}>{enq.response}</div>
                    </div>
                  )}
                  <div style={{ fontSize: "0.75em", color: "#999", marginTop: 8 }}>
                    Submitted: {new Date(enq.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      )}

      {/* My Tickets Section */}
      {activeMenu === 'myTickets' && (
      <div style={{ marginTop: 30, marginBottom: 20 }}>
        <h2 style={{ 
          color: darkMode ? "#FFB6D9" : "#C2185B", 
          textAlign: "center",
          marginBottom: 25 
        }}>
          My Tickets ({myTickets.length})
        </h2>
        
        {myTickets.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: "60px 20px",
            background: darkMode ? "rgba(255, 255, 255, 0.1)" : "white",
            borderRadius: 12,
            border: darkMode ? "1px solid rgba(255, 255, 255, 0.2)" : "2px solid #FFB6D9"
          }}>
            <div style={{ fontSize: "3em", marginBottom: 15 }}>🎫</div>
            <h3 style={{ color: darkMode ? "#FFB6D9" : "#C2185B", marginBottom: 10 }}>
              No Tickets Yet
            </h3>
            <p style={{ color: darkMode ? "#ccc" : "#666", marginBottom: 20 }}>
              You haven't booked any tickets yet. Book your first ticket from the Home section!
            </p>
            <button
              onClick={() => setActiveMenu('home')}
              className="login-btn"
              style={{ background: "#C2185B" }}
            >
              Book a Ticket
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {myTickets.map((ticket) => {
              // Parse QR code data for passenger counts
              let qrCodeData = {};
              try {
                qrCodeData = JSON.parse(ticket.qr_code);
              } catch (e) {
                console.error("Error parsing QR code:", e);
              }
              
              return (
              <div
                key={ticket.id}
                id={`ticket-full-${ticket.id}`}
                style={{ 
                  background: darkMode ? "#2C2C2C" : "white",
                  borderRadius: 12,
                  overflow: "hidden",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                  border: darkMode ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid #e0e0e0"
                }}
              >
                {/* Ticket Header */}
                <div style={{
                  background: "#C2185B",
                  color: "white",
                  padding: "15px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div>
                    <div style={{ fontSize: "1.3em", fontWeight: "bold", letterSpacing: "1px" }}>
                      ESWATINI TRANSPORT
                    </div>
                    <div style={{ fontSize: "0.85em", opacity: 0.9, marginTop: 2 }}>
                      Bus Ticket
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ 
                      fontSize: "0.8em", 
                      opacity: 0.9,
                      background: "rgba(255,255,255,0.2)",
                      padding: "4px 10px",
                      borderRadius: 4
                    }}>
                      Ticket #{ticket.id.slice(0, 8).toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Main Ticket Body */}
                <div style={{ display: "flex", minHeight: 240, flexWrap: "wrap" }}>
                  {/* Left Side - Ticket Details */}
                  <div style={{ 
                    flex: 1, 
                    minWidth: isMobile ? "100%" : 300,
                    padding: 25,
                    borderRight: darkMode ? "2px dashed rgba(255, 255, 255, 0.2)" : "2px dashed #d0d0d0",
                    position: "relative"
                  }}>
                    {/* Route Information */}
                    <div style={{ marginBottom: 25 }}>
                      <div style={{ 
                        display: "flex", 
                        flexDirection: isMobile ? "column" : "row",
                        alignItems: isMobile ? "flex-start" : "center", 
                        justifyContent: "space-between",
                        gap: isMobile ? 12 : 0,
                        marginBottom: 15
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "0.75em", color: darkMode ? "#B0B0B0" : "#666", marginBottom: 6 }}>
                            FROM
                          </div>
                          <div style={{ 
                            fontSize: "1.6em", 
                            fontWeight: "bold",
                            color: darkMode ? "#E0E0E0" : "#333"
                          }}>
                            {ticket.departure}
                          </div>
                        </div>
                        
                        <div style={{ 
                          padding: isMobile ? "0" : "0 20px",
                          fontSize: isMobile ? "1.4em" : "1.8em",
                          color: "#FFB6D9",
                          alignSelf: isMobile ? "center" : "auto"
                        }}>
                          →
                        </div>
                        
                        <div style={{ flex: 1, textAlign: isMobile ? "left" : "right" }}>
                          <div style={{ fontSize: "0.75em", color: darkMode ? "#B0B0B0" : "#666", marginBottom: 6 }}>
                            TO
                          </div>
                          <div style={{ 
                            fontSize: "1.6em", 
                            fontWeight: "bold",
                            color: darkMode ? "#E0E0E0" : "#333"
                          }}>
                            {ticket.destination}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ticket Details Grid */}
                    <div style={{ 
                      display: "grid", 
                      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                      gap: "15px"
                    }}>
                      <div>
                        <div style={{ fontSize: "0.7em", color: darkMode ? "#B0B0B0" : "#666", marginBottom: 3 }}>
                          PASSENGER NAME
                        </div>
                        <div style={{ fontSize: "1em", fontWeight: "600", color: darkMode ? "#E0E0E0" : "#333" }}>
                          {passengerName || 'N/A'}
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ fontSize: "0.7em", color: darkMode ? "#B0B0B0" : "#666", marginBottom: 3 }}>
                          BUS NUMBER
                        </div>
                        <div style={{ fontSize: "1.2em", fontWeight: "600", color: darkMode ? "#E0E0E0" : "#333" }}>
                          {ticket.buses?.bus_number || 'N/A'}
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ fontSize: "0.7em", color: darkMode ? "#B0B0B0" : "#666", marginBottom: 3 }}>
                          ADULTS
                        </div>
                        <div style={{ fontSize: "1.2em", fontWeight: "600", color: darkMode ? "#E0E0E0" : "#333" }}>
                          {qrCodeData.num_adults || 0}
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ fontSize: "0.7em", color: darkMode ? "#B0B0B0" : "#666", marginBottom: 3 }}>
                          CHILDREN
                        </div>
                        <div style={{ fontSize: "1.2em", fontWeight: "600", color: darkMode ? "#E0E0E0" : "#333" }}>
                          {qrCodeData.num_children || 0}
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ fontSize: "0.7em", color: darkMode ? "#B0B0B0" : "#666", marginBottom: 3 }}>
                          TOTAL PASSENGERS
                        </div>
                        <div style={{ fontSize: "1.2em", fontWeight: "600", color: "#7B2CBF" }}>
                          {qrCodeData.total_passengers || 0}
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ fontSize: "0.7em", color: darkMode ? "#B0B0B0" : "#666", marginBottom: 3 }}>
                          TOTAL FARE
                        </div>
                        <div style={{ fontSize: "1.2em", fontWeight: "600", color: "#4CAF50" }}>
                          E{ticket.fare}
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ fontSize: "0.7em", color: darkMode ? "#B0B0B0" : "#666", marginBottom: 3 }}>
                          SCHEDULED DATE & TIME
                        </div>
                        <div style={{ fontSize: "0.95em", fontWeight: "500", color: darkMode ? "#E0E0E0" : "#333" }}>
                          {ticket.scheduled_date ? new Date(ticket.scheduled_date).toLocaleDateString() : new Date(ticket.created_at).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: "0.85em", color: darkMode ? "#B0B0B0" : "#666" }}>
                          {ticket.scheduled_date ? new Date(ticket.scheduled_date).toLocaleTimeString() : new Date(ticket.created_at).toLocaleTimeString()}
                        </div>
                        {ticket.reschedule_count > 0 && (
                          <div style={{ 
                            fontSize: "0.7em", 
                            color: "#ff9800", 
                            marginTop: 4,
                            fontStyle: "italic"
                          }}>
                            Rescheduled {ticket.reschedule_count}x
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <div style={{ fontSize: "0.7em", color: darkMode ? "#B0B0B0" : "#666", marginBottom: 3 }}>
                          STATUS
                        </div>
                        <span style={{
                          padding: "5px 12px",
                          borderRadius: 4,
                          background: ticket.status === 'active' ? "#d4edda" : ticket.status === 'used' ? "#d1ecf1" : "#f8d7da",
                          color: ticket.status === 'active' ? "#155724" : ticket.status === 'used' ? "#0c5460" : "#721c24",
                          fontSize: "0.85em",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          display: "inline-block"
                        }}>
                          {ticket.status}
                        </span>
                      </div>

                      {ticket.seat_numbers && ticket.seat_numbers.length > 0 && (
                        <div style={{ gridColumn: "1 / -1" }}>
                          <div style={{ fontSize: "0.7em", color: darkMode ? "#B0B0B0" : "#666", marginBottom: 3 }}>
                            SEAT NUMBER{ticket.seat_numbers.length > 1 ? "S" : ""}
                          </div>
                          <div style={{ fontSize: "1.1em", fontWeight: "700", color: "#C2185B", letterSpacing: "1px" }}>
                            {ticket.seat_numbers.join(", ")}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side - QR Code Section */}
                  <div style={{ 
                    width: 240,
                    padding: 25,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: darkMode ? "#1a1a1a" : "#fafafa"
                  }}>
                    <div style={{ marginBottom: 12, textAlign: "center" }}>
                      <QRCode 
                        id={`ticket-qr-${ticket.id}`}
                        value={ticket.qr_code} 
                        size={180}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <div style={{ 
                      fontSize: "0.8em", 
                      color: darkMode ? "#B0B0B0" : "#666", 
                      textAlign: "center",
                      lineHeight: 1.5,
                      marginBottom: 15
                    }}>
                      Scan this code at boarding
                    </div>
                    
                    {/* Download Buttons */}
                    <div style={{ marginBottom: 8, fontSize: "0.7em", color: darkMode ? "#B0B0B0" : "#666", textAlign: "center" }}>
                      Download As:
                    </div>
                    <div style={{ display: "flex", gap: 8, width: "100%", marginBottom: 8 }}>
                      <button
                        onClick={() => {
                          const ticketElement = document.getElementById(`ticket-full-${ticket.id}`);
                          if (ticketElement) {
                            html2canvas(ticketElement, {
                              scale: 2,
                              backgroundColor: darkMode ? '#2C2C2C' : '#ffffff',
                              logging: false
                            }).then(canvas => {
                              const url = canvas.toDataURL("image/png");
                              const link = document.createElement("a");
                              link.download = `eswatini-transport-ticket-${ticket.id.slice(0, 8)}.png`;
                              link.href = url;
                              link.click();
                              showToast?.("Ticket downloaded as PNG!", "success");
                            });
                          }
                        }}
                        className="login-btn"
                        style={{ 
                          background: darkMode ? "#3C3C3C" : "white", 
                          border: "2px solid #C2185B",
                          color: "#C2185B",
                          padding: "6px 12px", 
                          fontSize: "0.8em",
                          flex: 1
                        }}
                      >
                        PNG
                      </button>
                      <button
                        onClick={() => {
                          const ticketElement = document.getElementById(`ticket-full-${ticket.id}`);
                          if (ticketElement) {
                            html2canvas(ticketElement, {
                              scale: 2,
                              backgroundColor: darkMode ? '#2C2C2C' : '#ffffff',
                              logging: false
                            }).then(canvas => {
                              const imgData = canvas.toDataURL("image/png");
                              const pdf = new jsPDF({
                                orientation: 'portrait',
                                unit: 'mm',
                                format: 'a4'
                              });
                              const imgWidth = 190;
                              const imgHeight = (canvas.height * imgWidth) / canvas.width;
                              pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
                              pdf.save(`eswatini-transport-ticket-${ticket.id.slice(0, 8)}.pdf`);
                              showToast?.("Ticket downloaded as PDF!", "success");
                            });
                          }
                        }}
                        className="login-btn"
                        style={{ 
                          background: "#C2185B", 
                          border: "2px solid #C2185B",
                          color: "white",
                          padding: "6px 12px", 
                          fontSize: "0.8em",
                          flex: 1
                        }}
                      >
                        PDF
                      </button>
                    </div>

                    {/* Reschedule Button */}
                    {ticket.status === 'active' && (
                      <button
                        onClick={() => handleOpenReschedule(ticket)}
                        className="login-btn"
                        style={{ 
                          background: darkMode ? "#3C3C3C" : "white",
                          border: "2px solid #FF9800",
                          color: "#FF9800",
                          padding: "8px 16px", 
                          fontSize: "0.85em",
                          width: "100%",
                          marginBottom: 8
                        }}
                      >
                        📅 Reschedule
                      </button>
                    )}

                    {/* Delete Button */}
                    {ticket.status === 'active' && (
                      <button
                        onClick={() => handleDeleteTicket(ticket.id)}
                        className="login-btn"
                        style={{ 
                          background: darkMode ? "#3C3C3C" : "white",
                          border: "2px solid #dc3545",
                          color: "#dc3545",
                          padding: "8px 16px", 
                          fontSize: "0.85em",
                          width: "100%"
                        }}
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Ticket Footer */}
                <div style={{
                  background: darkMode ? "#1a1a1a" : "#f8f9fa",
                  padding: "12px 20px",
                  fontSize: "0.75em",
                  color: darkMode ? "#B0B0B0" : "#666",
                  borderTop: darkMode ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid #e0e0e0",
                  textAlign: "center",
                  lineHeight: 1.6
                }}>
                  Please arrive 15 minutes before departure • Keep this ticket until journey completion • Show QR code to conductor
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
      )}

      {/* Reviews Section */}
      {activeMenu === 'reviews' && (
      <div style={{ marginTop: 30, marginBottom: 20 }}>
        <h2 style={{ 
          color: darkMode ? "#FFB6D9" : "#C2185B", 
          textAlign: "center",
          marginBottom: 25 
        }}>
          Reviews
        </h2>
        
        <button
          onClick={() => setShowReviewModal(true)}
          className="login-btn"
          style={{ 
            background: "#C2185B",
            marginBottom: 20,
            width: "100%",
            maxWidth: 400,
            margin: "0 auto 20px"
          }}
        >
          ⭐ Write a Review
        </button>

        {myReviews.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: "60px 20px",
            background: darkMode ? "rgba(255, 255, 255, 0.1)" : "white",
            borderRadius: 12,
            border: darkMode ? "1px solid rgba(255, 255, 255, 0.2)" : "2px solid #FFB6D9"
          }}>
            <div style={{ fontSize: "3em", marginBottom: 15 }}>⭐</div>
            <h3 style={{ color: darkMode ? "#FFB6D9" : "#C2185B", marginBottom: 10 }}>
              No Reviews Yet
            </h3>
            <p style={{ color: darkMode ? "#ccc" : "#666" }}>
              You haven't submitted any reviews yet. Share your experience with us!
            </p>
          </div>
        ) : (
          <div style={{ 
            background: darkMode ? "rgba(255, 255, 255, 0.1)" : "white", 
            padding: 20, 
            borderRadius: 12,
            border: darkMode ? "1px solid rgba(255, 255, 255, 0.2)" : "2px solid #FFB6D9"
          }}>
            <h4 style={{ color: darkMode ? "#FFB6D9" : "#FF69B4", marginTop: 0 }}>
              My Reviews ({myReviews.length})
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {myReviews.map((review) => (
                <div key={review.id} style={{
                  padding: 15,
                  background: darkMode ? "rgba(255, 255, 255, 0.05)" : "#f8f9fa",
                  borderRadius: 8,
                  border: darkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #e0e0e0"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontWeight: "bold", color: darkMode ? "#FFB6D9" : "#FF1493" }}>
                      {"⭐".repeat(review.rating)}
                    </div>
                    <div style={{ fontSize: "0.75em", color: darkMode ? "#B0B0B0" : "#999" }}>
                      {new Date(review.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ fontSize: "0.9em", color: darkMode ? "#E0E0E0" : "#333" }}>
                    {review.comment}
                  </div>
                  {review.departure && review.destination && (
                    <div style={{ 
                      marginTop: 8, 
                      fontSize: "0.8em", 
                      color: darkMode ? "#B0B0B0" : "#666",
                      fontStyle: "italic" 
                    }}>
                      Trip: {review.departure} → {review.destination}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      )}
      
      </div> {/* Close content wrapper from line 1326 */}
      
      {/* About Us Section */}
      <div style={{
        marginTop: 40,
        padding: "20px",
        background: darkMode ? "rgba(50, 50, 50, 0.8)" : "rgba(255, 255, 255, 0.5)",
        borderRadius: "10px",
        textAlign: "left",
        maxWidth: "800px",
        margin: "40px auto 0"
      }}>
        <h3 style={{ 
          margin: "0 0 10px 0", 
          fontSize: "1.2em", 
          color: darkMode ? "#FFB6D9" : "#333",
          fontWeight: "600"
        }}>
          About Us
        </h3>
        <p style={{ 
          margin: 0, 
          fontSize: "0.95em", 
          color: darkMode ? "#ccc" : "#666",
          lineHeight: "1.6"
        }}>
          At Tiyandza Transport, we've taken the stress out of travel. No more long queues at the station or paper tickets lost in your bag. Our digital-first platform allows you to book your seat in seconds, manage your trips on the go, and board with just a scan of your phone.
          <br /><br />
          We combine a modern fleet with cutting-edge booking technology to ensure that from the moment you click "Buy" to the moment you reach your destination, your experience is seamless.
        </p>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && bookingData && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setBookingData(null);
          }}
          bookingData={bookingData}
          onPaymentSuccess={handlePaymentSuccess}
          showToast={showToast}
        />
      )}
    </div>
  );
}
