import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { Scanner } from "@yudiel/react-qr-scanner";
import QRCode from "qrcode.react";
import jsPDF from "jspdf";
import {
  FiCalendar,
  FiSend,
  FiAlertTriangle,
  FiFileText,
  FiDownload,
  FiCamera,
  FiSun,
  FiMoon,
  FiMenu,
  FiX,
  FiGrid,
  FiPackage,
  FiLayers,
  FiLoader
} from "react-icons/fi";

export default function DriverDashboard({ showToast, darkMode = false }) {
  const [activeMenu, setActiveMenu] = useState('dashboard'); // 'dashboard', 'bulkTickets', 'scanQR', 'schedule', 'alerts', 'seating'
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [buses, setBuses] = useState([]);
  const [seatingFilter, setSeatingFilter] = useState({
    bus_id: "",
    departure: "",
    destination: "",
    date: new Date().toISOString().split('T')[0]
  });
  const [seatingData, setSeatingData] = useState([]);
  const [loadingSeating, setLoadingSeating] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [scannedTicket, setScannedTicket] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [cameraStatus, setCameraStatus] = useState("idle"); // idle, loading, ready, error
  const [cameraError, setCameraError] = useState("");
  const [showBulkProduction, setShowBulkProduction] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    bus_id: "",
    departure: "",
    destination: "",
    fare: "",
    quantity: 1,
  });
  const [departures, setDepartures] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [generatedTickets, setGeneratedTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [scheduleForm, setScheduleForm] = useState({
    bus_id: "",
    departure_location: "",
    destination: "",
    scheduled_departure: "",
    notes: ""
  });
  const [expandedStatus, setExpandedStatus] = useState({ active: true, used: false });
  const [expandedDates, setExpandedDates] = useState({});
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertForm, setAlertForm] = useState({
    type: 'warning',
    title: '',
    message: '',
    reportedBy: ''
  });
  const lastScannedRef = useRef({ value: "", time: 0 });
  const scanProcessingRef = useRef(false);

  useEffect(() => {
    loadBuses();
    loadDepartures();
    loadTickets();
    loadSchedules();
  }, []);

  useEffect(() => {
    if (activeMenu === 'seating' && seatingFilter.bus_id && seatingFilter.departure && seatingFilter.destination && seatingFilter.date) {
      loadSeatingData();
    }
  }, [activeMenu, seatingFilter]);

  useEffect(() => {
    if (bulkForm.departure) {
      loadDestinationsForDeparture(bulkForm.departure);
    }
  }, [bulkForm.departure]);

  useEffect(() => {
    if (seatingFilter.departure) {
      loadDestinationsForDeparture(seatingFilter.departure);
    } else {
      setDestinations([]);
    }
  }, [seatingFilter.departure]);

  useEffect(() => {
    if (scanMode) {
      // Set camera to ready after a brief delay to allow initialization
      const timer = setTimeout(() => {
        setCameraStatus("ready");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [scanMode]);

  useEffect(() => {
    if (scheduleForm.departure_location) {
      console.log("Loading destinations for schedule form departure:", scheduleForm.departure_location);
      loadDestinationsForDeparture(scheduleForm.departure_location);
    } else {
      console.log("No departure selected, clearing destinations");
      setDestinations([]);
    }
  }, [scheduleForm.departure_location]);

  const loadBuses = async () => {
    try {
      const { data, error } = await supabase
        .from("buses")
        .select("*")
        .order("bus_number");
      
      if (error) {
        console.error("Bus load error details:", error);
        throw error;
      }
      console.log("Loaded buses:", data?.length || 0, data);
      setBuses(data || []);
    } catch (err) {
      console.error("Error loading buses:", err);
      showToast?.("Failed to load buses: " + err.message, "error");
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
      const uniqueDepartures = [...new Set(data.map(item => item.departure))];
      setDepartures(uniqueDepartures);
    } catch (err) {
      console.error("Error loading departures:", err);
    }
  };

  const loadDestinationsForDeparture = async (departure) => {
    try {
      console.log("Fetching destinations for:", departure);
      const { data, error } = await supabase
        .from("bus_stops")
        .select("*")
        .eq("departure", departure)
        .eq("is_active", true)
        .order("destination");
      
      if (error) throw error;
      console.log("Loaded destinations:", data);
      setDestinations(data || []);
    } catch (err) {
      console.error("Error loading destinations:", err);
      setDestinations([]);
    }
  };

  const loadTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select("*, buses(bus_number)")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (error) {
        console.error("Error details:", error);
        throw error;
      }
      console.log("Loaded tickets:", data?.length || 0);
      setTickets(data || []);
    } catch (err) {
      console.error("Error loading tickets:", err);
      showToast?.("Failed to load tickets: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const loadSeatingData = async () => {
    setLoadingSeating(true);
    try {
      // Get tickets for the selected route
      const { data: ticketsData, error: ticketsError } = await supabase
        .from("tickets")
        .select("id, seat_numbers, status, user_id")
        .eq("bus_id", seatingFilter.bus_id)
        .eq("departure", seatingFilter.departure)
        .eq("destination", seatingFilter.destination)
        .eq("scheduled_date", seatingFilter.date)
        .in("status", ["active", "used"]);
      
      if (ticketsError) throw ticketsError;
      
      // Get unique user IDs
      const userIds = [...new Set(ticketsData?.map(t => t.user_id).filter(Boolean))];
      
      // Fetch profiles for these users
      let profilesMap = {};
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);
        
        if (profilesError) {
          console.warn("Could not load profiles:", profilesError);
        } else {
          // Create a map of user_id -> full_name
          profilesData?.forEach(profile => {
            profilesMap[profile.id] = profile.full_name;
          });
        }
      }
      
      // Combine tickets with profile names
      const enrichedData = ticketsData?.map(ticket => ({
        ...ticket,
        passengerName: profilesMap[ticket.user_id] || 'Passenger'
      }));
      
      console.log("Loaded seating data:", enrichedData?.length || 0, "tickets");
      setSeatingData(enrichedData || []);
    } catch (err) {
      console.error("Error loading seating data:", err);
      showToast?.("Failed to load seating data: " + err.message, "error");
    } finally {
      setLoadingSeating(false);
    }
  };

  const loadSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from("bus_schedules")
        .select("*, buses(bus_number)")
        .order("scheduled_departure", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setSchedules(data || []);
    } catch (err) {
      console.error("Error loading schedules:", err);
      showToast?.("Failed to load schedules: " + err.message, "error");
    }
  };

  const createSchedule = async () => {
    const { bus_id, departure_location, destination, scheduled_departure, notes } = scheduleForm;
    
    if (!bus_id || !departure_location || !destination || !scheduled_departure) {
      showToast?.("Please fill all required fields", "error");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast?.("User not authenticated", "error");
        return;
      }

      const { data, error } = await supabase
        .from("bus_schedules")
        .insert({
          bus_id,
          departure_location,
          destination,
          scheduled_departure,
          notes,
          created_by: user.id,
          status: "scheduled"
        })
        .select()
        .single();

      if (error) throw error;

      showToast?.("Schedule created and passengers notified!", "success");
      setScheduleForm({
        bus_id: "",
        departure_location: "",
        destination: "",
        scheduled_departure: "",
        notes: ""
      });
      setShowScheduleForm(false);
      await loadSchedules();
    } catch (err) {
      console.error("Error creating schedule:", err);
      showToast?.(`Failed to create schedule: ${err.message}`, "error");
    }
  };

  const updateScheduleStatus = async (scheduleId, newStatus) => {
    try {
      const updates = { status: newStatus };
      if (newStatus === "departed") {
        updates.actual_departure = new Date().toISOString();
      }

      const { error } = await supabase
        .from("bus_schedules")
        .update(updates)
        .eq("id", scheduleId);

      if (error) throw error;

      showToast?.(`Schedule marked as ${newStatus} and passengers notified!`, "success");
      await loadSchedules();
    } catch (err) {
      console.error("Error updating schedule:", err);
      showToast?.(`Failed to update schedule: ${err.message}`, "error");
    }
  };

  const submitServiceAlert = async () => {
    if (!alertForm.title || !alertForm.message) {
      showToast?.("Please fill in all required fields", "error");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert alert into database (will trigger email to admins)
      const { error } = await supabase
        .from('service_alerts')
        .insert({
          driver_id: user.id,
          type: alertForm.type,
          title: alertForm.title,
          message: alertForm.message,
          reported_by: alertForm.reportedBy || 'Driver',
          status: 'active'
        });

      if (error) throw error;

      showToast?.("Service alert submitted successfully! Admins have been notified.", "success");
      setShowAlertForm(false);
      setAlertForm({ type: 'warning', title: '', message: '', reportedBy: '' });
    } catch (err) {
      console.error('Error submitting alert:', err);
      showToast?.("Failed to submit alert: " + err.message, "error");
    }
  };

  const handleScanError = (error) => {
    if (!error) return;
    console.error("QR Scanner error:", error);
    if (error.name === "NotAllowedError") {
      setCameraStatus("error");
      setCameraError("Camera permission denied. Please allow camera access in your browser settings.");
    } else if (error.name === "NotFoundError") {
      setCameraStatus("error");
      setCameraError("No camera found on this device.");
    } else if (error.name === "NotReadableError") {
      setCameraStatus("error");
      setCameraError("Camera is already in use by another application.");
    }
  };

  const handleScan = async (results) => {
    if (!Array.isArray(results) || results.length === 0) return;
    const scannedText = results[0]?.rawValue;
    if (!scannedText || scanProcessingRef.current) return;

    const now = Date.now();
    if (lastScannedRef.current.value === scannedText && now - lastScannedRef.current.time < 3000) {
      return;
    }

    lastScannedRef.current = { value: scannedText, time: now };
    scanProcessingRef.current = true;

    try {
      JSON.parse(scannedText);

      const { data, error } = await supabase
        .from("tickets")
        .select("*, buses(bus_number)")
        .eq("qr_code", scannedText)
        .single();

      if (error || !data) throw error || new Error("Ticket not found");

      setScannedTicket(data);

      if (data.status === "used") {
        setScanResult({
          type: "invalid",
          title: "INVALID, Declined",
          message: "This ticket has already been used."
        });
        showToast?.("INVALID, Declined", "error");
      } else if (data.status === "cancelled" || data.status === "expired") {
        setScanResult({
          type: "invalid",
          title: "INVALID, Declined",
          message: `This ticket is ${data.status}.`
        });
        showToast?.("INVALID, Declined", "error");
      } else {
        await markTicketAsUsed(data);
      }
    } catch (err) {
      console.error("Error scanning ticket:", err);
      setScannedTicket(null);
      setScanResult({
        type: "invalid",
        title: "INVALID, Declined",
        message: "Invalid QR code or ticket not found."
      });
      showToast?.("INVALID, Declined", "error");
    } finally {
      scanProcessingRef.current = false;
    }
  };

  const handleScanToggle = () => {
    if (scanMode) {
      setScanMode(false);
      setCameraStatus("idle");
      setCameraError("");
      setScannedTicket(null);
      setScanResult(null);
      lastScannedRef.current = { value: "", time: 0 };
    } else {
      setScanMode(true);
      setCameraStatus("loading");
      setScannedTicket(null);
      setScanResult(null);
    }
  };

  const retryCamera = () => {
    setCameraStatus("loading");
    setCameraError("");
    // The useEffect will set it to ready after delay
  };

  const markTicketAsUsed = async (ticket) => {
    try {
      const usedAt = new Date().toISOString();
      const { error } = await supabase
        .from("tickets")
        .update({ status: "used", used_at: usedAt })
        .eq("id", ticket.id);
      
      if (error) throw error;

      setScannedTicket({ ...ticket, status: "used", used_at: usedAt });
      setScanResult({
        type: "valid",
        title: "VALID, Accepted",
        message: "Ticket verified and accepted for boarding."
      });
      showToast?.("VALID, Accepted", "success");
      await loadBuses();
      await loadTickets();
    } catch (err) {
      console.error("Error marking ticket:", err);
      setScanResult({
        type: "invalid",
        title: "INVALID, Declined",
        message: "Failed to validate this ticket. Please try again."
      });
      showToast?.("INVALID, Declined", "error");
    }
  };

  const generateBulkTickets = async () => {
    const { bus_id, departure, destination, fare, quantity } = bulkForm;
    
    console.log("Form data:", { bus_id, departure, destination, fare, quantity });
    console.log("Bus ID type:", typeof bus_id, "Value:", bus_id);
    
    if (!bus_id || !departure || !destination || !fare || quantity < 1) {
      showToast?.("Please fill all fields", "error");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast?.("User not authenticated", "error");
        return;
      }

      const ticketsToCreate = [];
      for (let i = 0; i < quantity; i++) {
        const qrData = {
          bus_id,
          departure,
          destination,
          fare: parseFloat(fare),
          payment_type: "CASH",
          created_at: new Date().toISOString(),
          ticket_number: `CASH-${Date.now()}-${i}`
        };

        ticketsToCreate.push({
          bus_id: bus_id,
          user_id: user.id,
          departure,
          destination,
          fare: parseFloat(fare),
          qr_code: JSON.stringify(qrData),
          status: "active",
          payment_status: "completed"
        });
      }

      console.log("Creating tickets with bus_id:", bus_id);
      console.log("Sample ticket:", ticketsToCreate[0]);

      const { data, error } = await supabase
        .from("tickets")
        .insert(ticketsToCreate)
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Tickets created:", data);
      setGeneratedTickets(data || []);
      showToast?.(`${quantity} tickets generated successfully!`, "success");
      
      setTimeout(async () => {
        await loadBuses();
        await loadTickets();
      }, 500);
    } catch (err) {
      console.error("Error generating bulk tickets:", err);
      showToast?.(`Failed to generate tickets: ${err.message}`, "error");
    }
  };

  const downloadQRCode = (ticketId, qrData) => {
    const canvas = document.getElementById(`qr-${ticketId}`);
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      const parsed = JSON.parse(qrData);
      link.download = `ticket-${parsed.ticket_number}.png`;
      link.href = url;
      link.click();
    }
  };

  const downloadAllQRCodes = () => {
    generatedTickets.forEach((ticket, index) => {
      setTimeout(() => downloadQRCode(ticket.id, ticket.qr_code), 100 * index);
    });
  };

  const downloadTicketsAsPDF = async () => {
    if (generatedTickets.length === 0) {
      showToast?.("No tickets to download", "error");
      return;
    }

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const ticketWidth = (pageWidth - 3 * margin) / 2; // 2 tickets per row
      const ticketHeight = 80;
      let xPos = margin;
      let yPos = margin;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(194, 24, 91); // #C2185B
      pdf.text("Bulk Tickets - Cash Payments", pageWidth / 2, 10, { align: "center" });
      
      yPos = 20;

      for (let i = 0; i < generatedTickets.length; i++) {
        const ticket = generatedTickets[i];
        const qrData = JSON.parse(ticket.qr_code);
        
        // Get QR code as image
        const canvas = document.getElementById(`qr-${ticket.id}`);
        if (canvas) {
          const qrImage = canvas.toDataURL("image/png");
          
          // Draw ticket border
          pdf.setDrawColor(194, 24, 91);
          pdf.setLineWidth(0.5);
          pdf.rect(xPos, yPos, ticketWidth, ticketHeight);
          
          // Add QR code
          const qrSize = 40;
          pdf.addImage(qrImage, "PNG", xPos + 5, yPos + 5, qrSize, qrSize);
          
          // Add ticket details
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(194, 24, 91);
          pdf.text("CASH PAID", xPos + qrSize + 10, yPos + 10);
          
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          pdf.setTextColor(0, 0, 0);
          pdf.text(`From: ${qrData.departure}`, xPos + qrSize + 10, yPos + 20);
          pdf.text(`To: ${qrData.destination}`, xPos + qrSize + 10, yPos + 27);
          pdf.text(`Fare: E${qrData.fare}`, xPos + qrSize + 10, yPos + 34);
          pdf.text(`Ticket: ${qrData.ticket_number}`, xPos + 5, yPos + qrSize + 12, { maxWidth: ticketWidth - 10 });
          
          // Move to next position
          xPos += ticketWidth + margin;
          
          // If we've filled a row, move to next row
          if ((i + 1) % 2 === 0) {
            xPos = margin;
            yPos += ticketHeight + margin;
            
            // If we need a new page
            if (yPos + ticketHeight > pageHeight - margin) {
              pdf.addPage();
              yPos = margin;
            }
          }
        }
      }
      
      // Save the PDF
      const timestamp = new Date().toISOString().slice(0, 10);
      pdf.save(`bulk-tickets-${timestamp}.pdf`);
      showToast?.("PDF downloaded successfully!", "success");
    } catch (err) {
      console.error("Error generating PDF:", err);
      showToast?.("Failed to generate PDF", "error");
    }
  };

  return (
    <div style={{ 
      display: "flex", 
      minHeight: "100vh", 
      backgroundImage: "url('/images/banner.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      position: "relative"
    }}>
      {/* Background overlay */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: darkMode ? "rgba(26, 26, 26, 0.92)" : "rgba(245, 245, 245, 0.88)",
        zIndex: 0
      }}></div>
      {/* Collapsible Sidebar */}
      <div style={{
        width: sidebarOpen ? "260px" : "0",
        background: darkMode ? "#2C2C2C" : "#FFFFFF",
        borderRight: `2px solid ${darkMode ? "#3C3C3C" : "#E0E0E0"}`,
        transition: "width 0.3s ease",
        overflow: "hidden",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 1001,
        boxShadow: sidebarOpen ? "2px 0 8px rgba(0,0,0,0.1)" : "none"
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: "20px",
          borderBottom: `2px solid ${darkMode ? "#3C3C3C" : "#E0E0E0"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <h3 style={{ 
            margin: 0, 
            color: "#C2185B",
            fontSize: "1.3em",
            whiteSpace: "nowrap"
          }}>
            Driver Menu
          </h3>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              background: "transparent",
              border: "none",
              color: darkMode ? "#E0E0E0" : "#666",
              cursor: "pointer",
              fontSize: "1.3em",
              padding: "5px"
            }}
          >
            <FiX />
          </button>
        </div>

        {/* Menu Items */}
        <nav style={{ padding: "10px 0" }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: FiGrid },
            { id: 'seating', label: 'Seating Overview', icon: FiLayers },
            { id: 'bulkTickets', label: 'Bulk Ticket Production', icon: FiPackage },
            { id: 'scanQR', label: 'Scan Ticket QR Code', icon: FiCamera },
            { id: 'schedule', label: 'Create Bus Schedule', icon: FiCalendar },
            { id: 'alerts', label: 'Report Service Alert', icon: FiAlertTriangle }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              style={{
                width: "100%",
                padding: "16px 20px",
                background: activeMenu === item.id 
                  ? (darkMode ? "#C2185B" : "#C2185B") 
                  : "transparent",
                border: "none",
                borderLeft: activeMenu === item.id ? "4px solid #FFFFFF" : "4px solid transparent",
                color: activeMenu === item.id ? "#FFFFFF" : (darkMode ? "#E0E0E0" : "#666"),
                fontWeight: activeMenu === item.id ? "600" : "400",
                cursor: "pointer",
                fontSize: "0.95em",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                textAlign: "left",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap"
              }}
              onMouseEnter={(e) => {
                if (activeMenu !== item.id) {
                  e.currentTarget.style.background = darkMode ? "rgba(194, 24, 91, 0.2)" : "rgba(194, 24, 91, 0.1)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeMenu !== item.id) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        marginLeft: sidebarOpen ? "260px" : "0",
        transition: "margin-left 0.3s ease",
        minHeight: "100vh",
        position: "relative",
        zIndex: 1
      }}>
        {/* Top Bar */}
        <div style={{
          background: darkMode ? "#2C2C2C" : "#FFFFFF",
          borderBottom: `2px solid ${darkMode ? "#3C3C3C" : "#E0E0E0"}`,
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 999
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <img 
              src="/images/logo.png" 
              alt="Logo" 
              style={{ height: "140px", width: "auto", objectFit: "contain" }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#C2185B",
                  cursor: "pointer",
                  fontSize: "1.5em",
                  padding: "5px"
                }}
              >
                <FiMenu />
              </button>
            )}
            <h2 style={{ 
              margin: 0, 
              color: darkMode ? "#E0E0E0" : "#C2185B",
              fontSize: "1.6em"
            }}>
              {activeMenu === 'dashboard' && 'Dashboard'}
              {activeMenu === 'seating' && 'Seating Overview'}
              {activeMenu === 'bulkTickets' && 'Bulk Ticket Production'}
              {activeMenu === 'scanQR' && 'Scan Ticket QR Code'}
              {activeMenu === 'schedule' && 'Create Bus Schedule'}
              {activeMenu === 'alerts' && 'Report Service Alert'}
            </h2>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ 
          padding: "24px",
          maxWidth: "1400px",
          margin: "0 auto"
        }}>

      {/* DASHBOARD Section */}
      {activeMenu === 'dashboard' && (
        <>
      {/* Dashboard shows Bus Capacity and All Tickets */}
      
      {/* Bus Capacity */}
      <div style={{ marginBottom: 30 }}>
        <h3 style={{ color: darkMode ? "#E0E0E0" : "#C2185B" }}>Bus Capacity</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minMax(300px, 1fr))", gap: 15 }}>
          {buses.map(bus => {
            console.log("Bus:", bus.bus_number, "Current:", bus.current_capacity, "Max:", bus.max_capacity);
            const percentage = (bus.current_capacity / bus.max_capacity) * 100;
            const isFull = bus.current_capacity >= bus.max_capacity;
            
            return (
              <div key={bus.id} style={{ background: darkMode ? "#3C3C3C" : "white", padding: 15, borderRadius: 12, border: "2px solid #C2185B", boxShadow: darkMode ? "0 2px 8px rgba(0, 0, 0, 0.3)" : "0 2px 8px rgba(194, 24, 91, 0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <strong style={{ color: darkMode ? "#E0E0E0" : "#C2185B" }}>{bus.bus_number}</strong>
                  <span style={{ color: darkMode ? "#E0E0E0" : "#C2185B", fontWeight: "bold" }}>
                    {bus.current_capacity} / {bus.max_capacity}
                  </span>
                </div>
                <div style={{ width: "100%", height: 10, background: darkMode ? "#2C2C2C" : "white", borderRadius: 5, overflow: "hidden", border: "1px solid #C2185B" }}>
                  <div
                    style={{
                      width: `${percentage}%`,
                      height: "100%",
                      background: "#C2185B",
                      transition: "width 0.3s ease"
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* All Tickets Table */}
      <div style={{ marginTop: 30 }}>
        <h3 style={{ color: darkMode ? "#E0E0E0" : "#C2185B" }}>All Tickets</h3>
        {loading ? (
          <p style={{ color: darkMode ? "#E0E0E0" : "#C2185B" }}>Loading...</p>
        ) : tickets.length === 0 ? (
          <p style={{ color: darkMode ? "#E0E0E0" : "#C2185B" }}>No tickets yet</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", gap: 20 }}>
            {/* Group tickets by status and date */}
            {(() => {
              // Group tickets by status first
              const grouped = tickets.reduce((acc, ticket) => {
                if (!acc[ticket.status]) acc[ticket.status] = {};
                const date = new Date(ticket.created_at).toLocaleDateString();
                if (!acc[ticket.status][date]) acc[ticket.status][date] = [];
                acc[ticket.status][date].push(ticket);
                return acc;
              }, {});

              const toggleStatus = (status) => {
                setExpandedStatus(prev => ({ ...prev, [status]: !prev[status] }));
              };

              const toggleDate = (status, date) => {
                const key = `${status}-${date}`;
                setExpandedDates(prev => ({ ...prev, [key]: !prev[key] }));
              };

              return Object.keys(grouped).sort().map(status => (
                <div key={status} style={{ background: darkMode ? "#3C3C3C" : "white", borderRadius: 12, border: darkMode ? "3px solid rgba(194, 24, 91, 0.5)" : "3px solid #FFB6D9", boxShadow: darkMode ? "0 4px 6px rgba(0, 0, 0, 0.3)" : "0 4px 6px rgba(255, 105, 180, 0.2)", overflow: "hidden" }}>
                  {/* Status Header */}
                  <div 
                    onClick={() => toggleStatus(status)}
                    style={{
                      padding: "12px 15px",
                      background: darkMode ? "#2C2C2C" : "#F8F8F8",
                      borderBottom: darkMode ? "2px solid rgba(194, 24, 91, 0.3)" : "2px solid #FFB6D9",
                      cursor: "pointer",
                      fontWeight: "bold",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <span style={{ color: darkMode ? "#E0E0E0" : "#333", textTransform: "uppercase" }}>{status}</span>
                    <span style={{ fontSize: 20, color: darkMode ? "#E0E0E0" : "#333" }}>{expandedStatus[status] ? "▲" : "▼"}</span>
                  </div>

                  {/* Tickets grouped by date */}
                  {expandedStatus[status] && Object.keys(grouped[status]).sort().reverse().map(date => (
                    <div key={date} style={{ borderBottom: darkMode ? "1px solid rgba(194, 24, 91, 0.2)" : "1px solid #FFB6D9" }}>
                      {/* Date Header */}
                      <div 
                        onClick={() => toggleDate(status, date)}
                        style={{
                          padding: "10px 15px",
                          background: darkMode ? "#333" : "#FFF3F8",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <span style={{ color: darkMode ? "#E0E0E0" : "#666", fontWeight: 600 }}>{date}</span>
                        <span style={{ fontSize: 16, color: darkMode ? "#E0E0E0" : "#666" }}>{expandedDates[`${status}-${date}`] ? "▲" : "▼"}</span>
                      </div>

                      {/* Tickets */}
                      {expandedDates[`${status}-${date}`] && (
                        <div style={{ background: darkMode ? "#2C2C2C" : "#FFFFFF" }}>
                          {grouped[status][date].map(ticket => (
                            <div key={ticket.id} style={{ 
                              padding: "12px 15px", 
                              borderBottom: darkMode ? "1px solid rgba(194, 24, 91, 0.1)" : "1px solid #FFE4F0",
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                              gap: 10,
                              alignItems: "center"
                            }}>
                              <div>
                                <div style={{ fontSize: "0.85em", color: darkMode ? "#B0B0B0" : "#999", marginBottom: 2 }}>TICKET ID</div>
                                <div style={{ fontWeight: 600, color: darkMode ? "#E0E0E0" : "#333" }}>{ticket.id}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: "0.85em", color: darkMode ? "#B0B0B0" : "#999", marginBottom: 2 }}>PASSENGER</div>
                                <div style={{ fontWeight: 600, color: darkMode ? "#E0E0E0" : "#333" }}>{ticket.full_name}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: "0.85em", color: darkMode ? "#B0B0B0" : "#999", marginBottom: 2 }}>PHONE</div>
                                <div style={{ fontWeight: 600, color: darkMode ? "#E0E0E0" : "#333" }}>{ticket.phone_number}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: "0.85em", color: darkMode ? "#B0B0B0" : "#999", marginBottom: 2 }}>ROUTE</div>
                                <div style={{ fontWeight: 600, color: darkMode ? "#E0E0E0" : "#333" }}>{ticket.departure_location} → {ticket.destination}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: "0.85em", color: darkMode ? "#B0B0B0" : "#999", marginBottom: 2 }}>TRAVEL DATE</div>
                                <div style={{ fontWeight: 600, color: darkMode ? "#E0E0E0" : "#333" }}>{ticket.travel_date}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: "0.85em", color: darkMode ? "#B0B0B0" : "#999", marginBottom: 2 }}>BUS #</div>
                                <div style={{ fontWeight: 600, color: darkMode ? "#E0E0E0" : "#333" }}>{ticket.bus_number || 'N/A'}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        )}
      </div>
        </>
      )}

      {/* Bulk Ticket Production Section */}
      {activeMenu === 'bulkTickets' && (
        <>
          <div style={{ 
            padding: 20, 
            background: darkMode ? "#2C2C2C" : "white", 
            borderRadius: 12,
            border: darkMode ? "3px solid rgba(194, 24, 91, 0.5)" : "3px solid #FFB6D9",
            boxShadow: darkMode ? "0 4px 6px rgba(0, 0, 0, 0.3)" : "0 4px 6px rgba(255, 105, 180, 0.2)",
            marginBottom: 20
          }}>
            <h3 style={{ color: darkMode ? "#E0E0E0" : "#C2185B", marginBottom: 10 }}>Generate Cash Payment Tickets</h3>
            <p style={{ color: darkMode ? "#B0B0B0" : "#666", fontSize: "0.9em", marginBottom: 15 }}>
              Create multiple tickets for passengers who paid in cash. These tickets will be marked as "PAID IN CASH" when scanned.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 15, marginBottom: 15 }}>
              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: darkMode ? "#E0E0E0" : "#333" }}>Bus:</label>
                <select
                  value={bulkForm.bus_id}
                  onChange={(e) => setBulkForm({ ...bulkForm, bus_id: e.target.value })}
                  className="login-input"
                >
                  <option value="">Select Bus</option>
                  {buses.map(bus => (
                    <option key={bus.id} value={bus.id}>{bus.bus_number}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: darkMode ? "#E0E0E0" : "#333" }}>Departure:</label>
                <select
                  value={bulkForm.departure}
                  onChange={(e) => setBulkForm({ ...bulkForm, departure: e.target.value, destination: "", fare: "" })}
                  className="login-input"
                >
                  <option value="">Select Departure</option>
                  {departures.map(dep => (
                    <option key={dep} value={dep}>{dep}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: darkMode ? "#E0E0E0" : "#333" }}>Destination:</label>
                <select
                  value={bulkForm.destination}
                  onChange={(e) => {
                    const selected = destinations.find(d => d.destination === e.target.value);
                    setBulkForm({ 
                      ...bulkForm, 
                      destination: e.target.value, 
                      fare: selected?.fare || "" 
                    });
                  }}
                  className="login-input"
                  disabled={!bulkForm.departure}
                >
                  <option value="">Select Destination</option>
                  {destinations.map(dest => (
                    <option key={dest.id} value={dest.destination}>{dest.destination}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: darkMode ? "#E0E0E0" : "#333" }}>Fare:</label>
                <input
                  type="number"
                  value={bulkForm.fare}
                  onChange={(e) => setBulkForm({ ...bulkForm, fare: e.target.value })}
                  className="login-input"
                  placeholder="E0.00"
                  step="0.01"
                  readOnly
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: darkMode ? "#E0E0E0" : "#333" }}>Quantity:</label>
                <input
                  type="number"
                  value={bulkForm.quantity}
                  onChange={(e) => setBulkForm({ ...bulkForm, quantity: parseInt(e.target.value) || 0 })}
                  className="login-input"
                  placeholder="Number of tickets"
                  min="1"
                  max="100"
                />
              </div>
            </div>

            <button
              onClick={generateBulkTickets}
              className="login-btn"
              style={{ background: "#C2185B", width: "100%", color: "white", border: "2px solid #C2185B" }}
            >
              <FiFileText style={{ marginRight: 6 }} />
              Generate {bulkForm.quantity || 0} Ticket(s)
            </button>
          </div>

          {generatedTickets.length > 0 && (
            <div style={{ 
              padding: 20, 
              background: darkMode ? "#2C2C2C" : "white", 
              borderRadius: 12,
              border: darkMode ? "3px solid rgba(194, 24, 91, 0.5)" : "3px solid #FFB6D9",
              boxShadow: darkMode ? "0 4px 6px rgba(0, 0, 0, 0.3)" : "0 4px 6px rgba(255, 105, 180, 0.2)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15, flexWrap: "wrap", gap: 10 }}>
                <h4 style={{ margin: 0, color: darkMode ? "#E0E0E0" : "#C2185B" }}>
                  Generated Tickets ({generatedTickets.length})
                </h4>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={downloadTicketsAsPDF}
                    className="login-btn"
                    style={{ background: "#C2185B", padding: "8px 15px", fontSize: "0.9em", color: "white", border: "2px solid #C2185B" }}
                  >
                    <FiFileText style={{ marginRight: 6 }} /> Download as PDF
                  </button>
                  <button
                    onClick={downloadAllQRCodes}
                    className="login-btn"
                    style={{ background: darkMode ? "#3C3C3C" : "white", padding: "8px 15px", fontSize: "0.9em", color: darkMode ? "#E0E0E0" : "#C2185B", border: "2px solid #C2185B" }}
                  >
                    <FiDownload style={{ marginRight: 6 }} /> Download All QR Codes
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 15, maxHeight: 400, overflowY: "auto" }}>
                {generatedTickets.map(ticket => {
                  const qrData = JSON.parse(ticket.qr_code);
                  return (
                    <div key={ticket.id} style={{ 
                      background: darkMode ? "#3C3C3C" : "white", 
                      padding: 15, 
                      borderRadius: 12, 
                      textAlign: "center", 
                      border: darkMode ? "2px solid rgba(194, 24, 91, 0.5)" : "2px solid #C2185B", 
                      boxShadow: darkMode ? "0 2px 8px rgba(0, 0, 0, 0.3)" : "0 2px 8px rgba(194, 24, 91, 0.1)" 
                    }}>
                      <QRCode
                        id={`qr-${ticket.id}`}
                        value={ticket.qr_code}
                        size={150}
                        level="H"
                        includeMargin={true}
                      />
                      <div style={{ marginTop: 10, fontSize: "0.8em", color: darkMode ? "#E0E0E0" : "#333" }}>
                        <div style={{ fontWeight: "bold", color: "#C2185B" }}>CASH PAID</div>
                        <div>{qrData.departure} → {qrData.destination}</div>
                        <div>E{qrData.fare}</div>
                      </div>
                      <button
                        onClick={() => downloadQRCode(ticket.id, ticket.qr_code)}
                        className="login-btn"
                        style={{ 
                          background: darkMode ? "#3C3C3C" : "white", 
                          marginTop: 10, 
                          padding: "5px 10px", 
                          fontSize: "0.8em", 
                          width: "100%", 
                          color: darkMode ? "#E0E0E0" : "#C2185B", 
                          border: "2px solid #C2185B" 
                        }}
                      >
                        <FiDownload style={{ marginRight: 6 }} /> Download
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Scan QR Code Section */}
      {activeMenu === 'scanQR' && (
        <>
          <div style={{ 
            padding: 20, 
            background: darkMode ? "#2C2C2C" : "white", 
            borderRadius: 12,
            border: darkMode ? "3px solid rgba(194, 24, 91, 0.5)" : "3px solid #FFB6D9",
            boxShadow: darkMode ? "0 4px 6px rgba(0, 0, 0, 0.3)" : "0 4px 6px rgba(255, 105, 180, 0.2)",
            marginBottom: 20
          }}>
            <h3 style={{ color: darkMode ? "#E0E0E0" : "#C2185B", marginBottom: 15 }}>Scan Ticket QR Code</h3>
            
            <button
              onClick={handleScanToggle}
              className="login-btn"
              style={{ 
                background: scanMode ? darkMode ? "#3C3C3C" : "white" : "#C2185B", 
                marginRight: 10, 
                color: scanMode ? darkMode ? "#E0E0E0" : "#C2185B" : "white", 
                border: "2px solid #C2185B",
                marginBottom: 15
              }}
            >
              <FiCamera style={{ marginRight: 6 }} />
              {scanMode ? "Close Scanner" : "Start Scanning"}
            </button>

            {scanMode && (
              <div>
                {/* Camera Status Messages */}
                {cameraStatus === "loading" && (
                  <div style={{ 
                    marginBottom: 15, 
                    padding: 15, 
                    background: darkMode ? "#3C3C3C" : "#FFF3F8", 
                    color: darkMode ? "#E0E0E0" : "#C2185B", 
                    borderRadius: 8, 
                    border: darkMode ? "2px solid rgba(194, 24, 91, 0.5)" : "2px solid #FFB6D9", 
                    fontWeight: "500", 
                    textAlign: "center" 
                  }}>
                    <div>Initializing camera...</div>
                    <div style={{ fontSize: "0.85em", marginTop: 5, opacity: 0.8 }}>Please allow camera access when prompted</div>
                  </div>
                )}

                {cameraStatus === "ready" && (
                  <div style={{ 
                    marginBottom: 15, 
                    padding: 10, 
                    background: darkMode ? "#3C3C3C" : "#FFF3F8", 
                    color: darkMode ? "#E0E0E0" : "#C2185B", 
                    borderRadius: 8, 
                    border: darkMode ? "2px solid rgba(194, 24, 91, 0.5)" : "2px solid #FFB6D9", 
                    fontWeight: "500", 
                    textAlign: "center" 
                  }}>
                    Camera ready - Point at QR code to scan
                  </div>
                )}

                {cameraStatus === "error" && (
                  <div style={{ 
                    marginBottom: 15, 
                    padding: 15, 
                    background: darkMode ? "#3C3C3C" : "#FFE4F0", 
                    color: darkMode ? "#E0E0E0" : "#C2185B", 
                    borderRadius: 8, 
                    border: darkMode ? "2px solid rgba(194, 24, 91, 0.5)" : "2px solid #FFB6D9" 
                  }}>
                    <div style={{ fontWeight: "bold", marginBottom: 10 }}>Camera Error</div>
                    <div style={{ marginBottom: 15 }}>{cameraError}</div>
                    <div style={{ fontSize: "0.9em", marginBottom: 15 }}>
                      <strong>How to fix:</strong>
                      <ul style={{ marginTop: 5, marginBottom: 5, paddingLeft: 20, textAlign: "left" }}>
                        <li>Click the camera/lock icon in your browser's address bar</li>
                        <li>Allow camera access for this site</li>
                        <li>Refresh the page and try again</li>
                        {window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && (
                          <li>Make sure you're using HTTPS or localhost</li>
                        )}
                      </ul>
                    </div>
                    <button
                      onClick={retryCamera}
                      className="login-btn"
                      style={{ 
                        padding: "10px 20px", 
                        background: darkMode ? "#2C2C2C" : "white", 
                        color: darkMode ? "#E0E0E0" : "#C2185B", 
                        border: "2px solid #C2185B", 
                        borderRadius: 8, 
                        cursor: "pointer",
                        fontWeight: "bold"
                      }}
                    >
                      Retry Camera
                    </button>
                  </div>
                )}

                {/* QR Reader */}
                <div style={{ 
                  maxWidth: 500, 
                  marginBottom: 20,
                  border: darkMode ? "3px solid rgba(194, 24, 91, 0.5)" : "3px solid #C2185B",
                  borderRadius: 12,
                  overflow: "hidden",
                  boxShadow: darkMode ? "0 2px 8px rgba(0, 0, 0, 0.3)" : "0 2px 8px rgba(194, 24, 91, 0.2)"
                }}>
                  <Scanner
                    onScan={handleScan}
                    onError={handleScanError}
                    constraints={{ facingMode: "environment" }}
                    styles={{
                      container: { width: "100%" },
                      video: {
                        width: "100%",
                        height: "350px",
                        objectFit: "cover"
                      }
                    }}
                  />
                  <div style={{ 
                    position: "relative", 
                    background: darkMode ? "#2C2C2C" : "white", 
                    color: darkMode ? "#E0E0E0" : "#C2185B", 
                    padding: "8px", 
                    textAlign: "center",
                    fontWeight: "bold",
                    fontSize: "0.9em",
                    borderTop: darkMode ? "2px solid rgba(194, 24, 91, 0.5)" : "2px solid #C2185B"
                  }}>
                    {cameraStatus === "loading" && "Loading..."}
                    {cameraStatus === "ready" && "Position QR code in frame"}
                    {cameraStatus === "error" && "Camera unavailable"}
                    {cameraStatus === "idle" && "Camera"}
                  </div>
                </div>
                
                {/* Help Info */}
                <div style={{ 
                  marginTop: 20, 
                  padding: 15, 
                  background: darkMode ? "#3C3C3C" : "#FFF3F8", 
                  borderRadius: 12, 
                  border: darkMode ? "2px solid rgba(194, 24, 91, 0.5)" : "2px solid #FFB6D9", 
                  boxShadow: darkMode ? "0 2px 8px rgba(0, 0, 0, 0.3)" : "0 2px 8px rgba(194, 24, 91, 0.1)" 
                }}>
                  <p style={{ margin: "0 0 10px 0", fontWeight: "bold", color: darkMode ? "#E0E0E0" : "#C2185B" }}>Tips for Better Scanning</p>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: "0.9em", color: darkMode ? "#B0B0B0" : "#666" }}>
                    <li>Hold the QR code 6-12 inches from the camera</li>
                    <li>Make sure there's good lighting</li>
                    <li>Keep the QR code flat and clear</li>
                    <li>Avoid reflections and glare</li>
                    {window.location.hostname.includes('github') && (
                      <li style={{ color: "#C2185B", fontWeight: "bold" }}>
                        Codespaces limitation: Deploy to a live HTTPS URL to access your device camera
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Scan Result */}
          {scanResult && (
            <div style={{ 
              padding: 20,
              marginTop: 20,
              background: scanResult.type === "valid"
                ? (darkMode ? "rgba(76, 175, 80, 0.15)" : "#E8F5E9")
                : (darkMode ? "rgba(244, 67, 54, 0.15)" : "#FFEBEE"),
              borderRadius: 12,
              border: scanResult.type === "valid" ? "3px solid #4CAF50" : "3px solid #F44336",
              boxShadow: darkMode ? "0 4px 6px rgba(0, 0, 0, 0.3)" : "0 4px 6px rgba(0,0,0,0.08)",
              textAlign: "center"
            }}>
              <div style={{
                color: scanResult.type === "valid" ? "#2E7D32" : "#C62828",
                fontSize: "1.35em",
                fontWeight: "800",
                marginBottom: 8
              }}>
                {scanResult.title}
              </div>
              <div style={{ color: darkMode ? "#E0E0E0" : "#444", fontSize: "0.98em" }}>
                {scanResult.message}
              </div>
            </div>
          )}

          {/* Scanned Ticket Details */}
          {scannedTicket && (
            <div style={{ 
              padding: 20, 
              background: darkMode ? "#2C2C2C" : "white", 
              borderRadius: 12, 
              border: darkMode ? "3px solid rgba(194, 24, 91, 0.5)" : "3px solid #FFB6D9", 
              boxShadow: darkMode ? "0 4px 6px rgba(0, 0, 0, 0.3)" : "0 4px 6px rgba(255, 105, 180, 0.2)" 
            }}>
              <h3 style={{ color: darkMode ? "#E0E0E0" : "#C2185B", marginBottom: 15 }}>Scanned Ticket Details</h3>
              {(() => {
                try {
                  const qrData = JSON.parse(scannedTicket.qr_code);
                  if (qrData.payment_type === "CASH") {
                    return (
                      <div style={{ 
                        background: darkMode ? "#3C3C3C" : "#FFE4F0", 
                        color: darkMode ? "#E0E0E0" : "#C2185B", 
                        padding: 10, 
                        borderRadius: 8, 
                        marginBottom: 15, 
                        fontWeight: "bold", 
                        border: darkMode ? "2px solid rgba(194, 24, 91, 0.5)" : "2px solid #C2185B",
                        textAlign: "center",
                        fontSize: "1.1em"
                      }}>
                        💵 PAID IN CASH
                      </div>
                    );
                  }
                } catch (e) {}
                return null;
              })()}
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <strong style={{ color: darkMode ? "#B0B0B0" : "#666" }}>Ticket ID:</strong>
                  <div style={{ color: darkMode ? "#E0E0E0" : "#333", fontSize: "1.1em", fontWeight: "600" }}>{scannedTicket.id}</div>
                </div>
                <div>
                  <strong style={{ color: darkMode ? "#B0B0B0" : "#666" }}>Bus:</strong>
                  <div style={{ color: darkMode ? "#E0E0E0" : "#333" }}>{scannedTicket.buses?.bus_number || 'N/A'}</div>
                </div>
                <div>
                  <strong style={{ color: darkMode ? "#B0B0B0" : "#666" }}>Route:</strong>
                  <div style={{ color: darkMode ? "#E0E0E0" : "#333" }}>{scannedTicket.departure} → {scannedTicket.destination}</div>
                </div>
                <div>
                  <strong style={{ color: darkMode ? "#B0B0B0" : "#666" }}>Fare:</strong>
                  <div style={{ color: "#C2185B", fontWeight: "bold", fontSize: "1.2em" }}>E{scannedTicket.fare}</div>
                </div>
                <div>
                  <strong style={{ color: darkMode ? "#B0B0B0" : "#666" }}>Status:</strong>
                  <div>
                    <span style={{ 
                      padding: "4px 12px", 
                      borderRadius: 8, 
                      background: scannedTicket.status === 'active' ? '#4CAF50' : scannedTicket.status === 'used' ? '#999' : '#f44336',
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "0.9em"
                    }}>
                      {scannedTicket.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <strong style={{ color: darkMode ? "#B0B0B0" : "#666" }}>Created:</strong>
                  <div style={{ color: darkMode ? "#E0E0E0" : "#333" }}>{new Date(scannedTicket.created_at).toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Bus Schedule Section */}
      {activeMenu === 'schedule' && (
        <>
          <div style={{ 
            padding: 20, 
            background: darkMode ? "#2C2C2C" : "white", 
            borderRadius: 12,
            border: darkMode ? "3px solid rgba(194, 24, 91, 0.5)" : "3px solid #FFB6D9",
            boxShadow: darkMode ? "0 4px 6px rgba(0, 0, 0, 0.3)" : "0 4px 6px rgba(255, 105, 180, 0.2)",
            marginBottom: 20
          }}>
            <h3 style={{ color: darkMode ? "#E0E0E0" : "#C2185B", marginBottom: 15 }}>Create New Bus Schedule</h3>
            
            <div style={{ display: "grid", gap: 15, gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: darkMode ? "#E0E0E0" : "#333" }}>Bus: *</label>
                <select
                  value={scheduleForm.bus_id}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, bus_id: e.target.value })}
                  className="login-input"
                >
                  <option value="">Select Bus</option>
                  {buses.map(bus => (
                    <option key={bus.id} value={bus.id}>{bus.bus_number}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: darkMode ? "#E0E0E0" : "#333" }}>Departure Location: *</label>
                <select
                  value={scheduleForm.departure_location}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, departure_location: e.target.value })}
                  className="login-input"
                >
                  <option value="">Select Departure</option>
                  {departures.map(dep => (
                    <option key={dep} value={dep}>{dep}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: darkMode ? "#E0E0E0" : "#333" }}>Destination: *</label>
                <select
                  value={scheduleForm.destination}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, destination: e.target.value })}
                  className="login-input"
                  disabled={!scheduleForm.departure_location}
                >
                  <option value="">
                    {!scheduleForm.departure_location 
                      ? "First select a departure" 
                      : destinations.length === 0 
                        ? "Loading destinations..." 
                        : "Select Destination"}
                  </option>
                  {destinations.map(dest => (
                    <option key={dest.id} value={dest.destination}>{dest.destination}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: darkMode ? "#E0E0E0" : "#333" }}>Departure Time: *</label>
                <input
                  type="datetime-local"
                  value={scheduleForm.scheduled_departure}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_departure: e.target.value })}
                  className="login-input"
                />
              </div>
            </div>

            <div style={{ marginTop: 15 }}>
              <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: darkMode ? "#E0E0E0" : "#333" }}>Notes (optional):</label>
              <textarea
                value={scheduleForm.notes}
                onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                className="login-input"
                placeholder="Any additional information for passengers..."
                rows={3}
                style={{ width: "100%", resize: "vertical" }}
              />
            </div>

            <button
              onClick={createSchedule}
              className="login-btn"
              style={{ background: "#C2185B", width: "100%", color: "white", border: "2px solid #C2185B", marginTop: 15 }}
            >
              Create Schedule & Notify Passengers
            </button>
          </div>

          {/* Schedules List */}
          <div style={{ 
            padding: 20, 
            background: darkMode ? "#2C2C2C" : "white", 
            borderRadius: 12,
            border: darkMode ? "3px solid rgba(194, 24, 91, 0.5)" : "3px solid #FFB6D9",
            boxShadow: darkMode ? "0 4px 6px rgba(0, 0, 0, 0.3)" : "0 4px 6px rgba(255, 105, 180, 0.2)"
          }}>
            <h3 style={{ color: darkMode ? "#E0E0E0" : "#C2185B", marginBottom: 15 }}>Upcoming Schedules</h3>
            <div style={{ display: "grid", gap: 15 }}>
              {schedules.map(schedule => (
                <div key={schedule.id} style={{ 
                  background: darkMode ? "#3C3C3C" : (schedule.status === 'scheduled' ? "white" : 
                             schedule.status === 'departed' ? "#FFE4F0" : "#FFB6D9"),
                  padding: 15, 
                  borderRadius: 12,
                  border: darkMode ? "3px solid rgba(194, 24, 91, 0.5)" : "3px solid #FFB6D9",
                  boxShadow: darkMode ? "0 4px 6px rgba(0, 0, 0, 0.3)" : "0 4px 6px rgba(255, 105, 180, 0.2)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "1.1em", fontWeight: "bold", marginBottom: 5, color: darkMode ? "#E0E0E0" : "#333" }}>
                        {schedule.buses?.bus_number} - {schedule.departure_location} → {schedule.destination}
                      </div>
                      <div style={{ color: darkMode ? "#B0B0B0" : "#666", fontSize: "0.9em", marginBottom: 5 }}>
                        Scheduled: {new Date(schedule.scheduled_departure).toLocaleString()}
                      </div>
                      {schedule.actual_departure && (
                        <div style={{ color: darkMode ? "#B0B0B0" : "#666", fontSize: "0.9em", marginBottom: 5 }}>
                          Departed: {new Date(schedule.actual_departure).toLocaleString()}
                        </div>
                      )}
                      {schedule.notes && (
                        <div style={{ color: darkMode ? "#B0B0B0" : "#666", fontSize: "0.9em", fontStyle: "italic" }}>
                          {schedule.notes}
                        </div>
                      )}
                    </div>
                    <div style={{ marginLeft: 15 }}>
                      <span style={{
                        padding: "6px 12px",
                        borderRadius: 4,
                        background: "white",
                        color: "#C2185B",
                        fontSize: "0.85em",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        border: "2px solid #C2185B"
                      }}>
                        {schedule.status}
                      </span>
                    </div>
                  </div>
                  {schedule.status === 'scheduled' && (
                    <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                      <button
                        onClick={() => updateScheduleStatus(schedule.id, 'departed')}
                        className="login-btn"
                        style={{ background: darkMode ? "#3C3C3C" : "white", padding: "6px 12px", fontSize: "0.9em", color: darkMode ? "#E0E0E0" : "#C2185B", border: "2px solid #C2185B" }}
                      >
                        Mark as Departed
                      </button>
                      <button
                        onClick={() => updateScheduleStatus(schedule.id, 'cancelled')}
                        className="login-btn"
                        style={{ background: darkMode ? "#3C3C3C" : "white", padding: "6px 12px", fontSize: "0.9em", color: darkMode ? "#E0E0E0" : "#C2185B", border: "2px solid #C2185B" }}
                      >
                        Cancel Schedule
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Report Service Alert Section */}
      {activeMenu === 'alerts' && (
        <>
          <div style={{ 
            padding: 20, 
            background: darkMode ? "#2C2C2C" : "white", 
            borderRadius: 12,
            border: darkMode ? "3px solid rgba(194, 24, 91, 0.5)" : "3px solid #FFB6D9",
            boxShadow: darkMode ? "0 4px 6px rgba(0, 0, 0, 0.3)" : "0 4px 6px rgba(255, 105, 180, 0.2)"
          }}>
            <h3 style={{ color: darkMode ? "#E0E0E0" : "#C2185B", marginBottom: 15 }}>Report Service Alert</h3>
            <p style={{ color: darkMode ? "#B0B0B0" : "#666", fontSize: "0.9em", marginBottom: 15 }}>
              Report delays, issues, or important updates that will be visible to admin and passengers
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 15, marginBottom: 15 }}>
              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: darkMode ? "#E0E0E0" : "#333" }}>Alert Type: *</label>
                <select
                  value={alertForm.type}
                  onChange={(e) => setAlertForm({ ...alertForm, type: e.target.value })}
                  className="login-input"
                >
                  <option value="warning">Warning</option>
                  <option value="danger">Urgent</option>
                  <option value="info">Information</option>
                  <option value="success">Update</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: darkMode ? "#E0E0E0" : "#333" }}>Your Name: *</label>
                <input
                  type="text"
                value={alertForm.reportedBy}
                  onChange={(e) => setAlertForm({ ...alertForm, reportedBy: e.target.value })}
                  placeholder="e.g., Driver John"
                  className="login-input"
                />
              </div>
            </div>

            <div style={{ marginBottom: 15 }}>
              <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: darkMode ? "#E0E0E0" : "#333" }}>Alert Title: *</label>
              <input
                type="text"
                value={alertForm.title}
                onChange={(e) => setAlertForm({ ...alertForm, title: e.target.value })}
                placeholder="e.g., Route Delay, Road Closure, Weather Alert"
                className="login-input"
              />
            </div>

            <div style={{ marginBottom: 15 }}>
              <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: darkMode ? "#E0E0E0" : "#333" }}>Message: *</label>
              <textarea
                value={alertForm.message}
                onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })}
                placeholder="Describe the situation in detail..."
                rows={3}
                className="login-input"
                style={{ fontFamily: "inherit", resize: "vertical" }}
              />
            </div>

            <button
              onClick={submitServiceAlert}
              className="login-btn"
              style={{ background: "#C2185B", color: "white", border: "2px solid #C2185B", width: "100%" }}
            >
              Submit Alert
            </button>
          </div>
        </>
      )}

      {activeMenu === 'seating' && (
        <>
          <div style={{ 
            padding: 20, 
            background: darkMode ? "#2C2C2C" : "white", 
            borderRadius: 12,
            border: darkMode ? "3px solid rgba(194, 24, 91, 0.5)" : "3px solid #FFB6D9",
            boxShadow: darkMode ? "0 4px 6px rgba(0, 0, 0, 0.3)" : "0 4px 6px rgba(255, 105, 180, 0.2)",
            marginBottom: 20
          }}>
            <h3 style={{ color: darkMode ? "#E0E0E0" : "#C2185B", marginBottom: 15 }}>Seating Overview</h3>
            <p style={{ color: darkMode ? "#B0B0B0" : "#666", fontSize: "0.9em", marginBottom: 15 }}>
              View seat occupancy for any bus and route
            </p>

            {/* Filters */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 15, marginBottom: 20 }}>
              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: darkMode ? "#E0E0E0" : "#333" }}>Bus: *</label>
                <select
                  value={seatingFilter.bus_id}
                  onChange={(e) => setSeatingFilter({ ...seatingFilter, bus_id: e.target.value })}
                  className="login-input"
                >
                  <option value="">Select Bus</option>
                  {buses.map((bus) => (
                    <option key={bus.id} value={bus.id}>
                      {bus.bus_number} ({bus.capacity} seats)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: darkMode ? "#E0E0E0" : "#333" }}>Departure: *</label>
                <select
                  value={seatingFilter.departure}
                  onChange={(e) => setSeatingFilter({ ...seatingFilter, departure: e.target.value })}
                  className="login-input"
                >
                  <option value="">Select Departure</option>
                  {departures.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: darkMode ? "#E0E0E0" : "#333" }}>Destination: *</label>
                <select
                  value={seatingFilter.destination}
                  onChange={(e) => setSeatingFilter({ ...seatingFilter, destination: e.target.value })}
                  className="login-input"
                  disabled={!seatingFilter.departure}
                >
                  <option value="">Select Destination</option>
                  {destinations.map((dest) => (
                    <option key={dest.id} value={dest.destination}>
                      {dest.destination}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: darkMode ? "#E0E0E0" : "#333" }}>Date: *</label>
                <input
                  type="date"
                  value={seatingFilter.date}
                  onChange={(e) => setSeatingFilter({ ...seatingFilter, date: e.target.value })}
                  className="login-input"
                />
              </div>
            </div>
          </div>

          {/* Seating Chart */}
          {seatingFilter.bus_id && seatingFilter.departure && seatingFilter.destination && seatingFilter.date && (
            <div style={{ 
              padding: 20, 
              background: darkMode ? "#2C2C2C" : "white", 
              borderRadius: 12,
              border: darkMode ? "3px solid rgba(194, 24, 91, 0.5)" : "3px solid #FFB6D9",
              boxShadow: darkMode ? "0 4px 6px rgba(0, 0, 0, 0.3)" : "0 4px 6px rgba(255, 105, 180, 0.2)"
            }}>
              {loadingSeating ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: darkMode ? "#B0B0B0" : "#666" }}>
                  <FiLoader size={40} style={{ animation: "spin 1s linear infinite" }} />
                  <p style={{ marginTop: 10 }}>Loading seating information...</p>
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div style={{ marginBottom: 20 }}>
                    <h4 style={{ color: darkMode ? "#E0E0E0" : "#333", marginBottom: 10 }}>
                      {buses.find(b => b.id === seatingFilter.bus_id)?.bus_number} - {seatingFilter.departure} to {seatingFilter.destination}
                    </h4>
                    <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: "0.9em" }}>
                      <div style={{ color: darkMode ? "#B0B0B0" : "#666" }}>
                        <strong>Date:</strong> {new Date(seatingFilter.date).toLocaleDateString()}
                      </div>
                      <div style={{ color: darkMode ? "#B0B0B0" : "#666" }}>
                        <strong>Total Seats:</strong> {buses.find(b => b.id === seatingFilter.bus_id)?.capacity || 50}
                      </div>
                      <div style={{ color: darkMode ? "#B0B0B0" : "#666" }}>
                        <strong>Booked:</strong> {(() => {
                          const occupied = [];
                          seatingData.forEach(ticket => {
                            if (ticket.seat_numbers && Array.isArray(ticket.seat_numbers)) {
                              occupied.push(...ticket.seat_numbers);
                            }
                          });
                          return occupied.length;
                        })()}
                      </div>
                      <div style={{ color: darkMode ? "#B0B0B0" : "#666" }}>
                        <strong>Available:</strong> {(() => {
                          const capacity = buses.find(b => b.id === seatingFilter.bus_id)?.capacity || 50;
                          const occupied = [];
                          seatingData.forEach(ticket => {
                            if (ticket.seat_numbers && Array.isArray(ticket.seat_numbers)) {
                              occupied.push(...ticket.seat_numbers);
                            }
                          });
                          return capacity - occupied.length;
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div style={{ display: "flex", gap: 20, marginBottom: 20, flexWrap: "wrap", fontSize: "0.9em" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 30,
                        height: 30,
                        background: "#4CAF50",
                        border: "2px solid #4CAF50",
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "bold"
                      }}>✓</div>
                      <span style={{ color: darkMode ? "#E0E0E0" : "#333" }}>Available</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 30,
                        height: 30,
                        background: "#F44336",
                        border: "2px solid #F44336",
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "bold"
                      }}>✗</div>
                      <span style={{ color: darkMode ? "#E0E0E0" : "#333" }}>Booked</span>
                    </div>
                  </div>

                  {/* Seating Grid */}
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "center",
                    padding: "20px 0"
                  }}>
                    <div style={{ 
                      display: "inline-block",
                      padding: 20,
                      background: darkMode ? "#1C1C1C" : "#F5F5F5",
                      borderRadius: 12,
                      border: darkMode ? "2px solid #3C3C3C" : "2px solid #E0E0E0"
                    }}>
                      {/* Driver Cabin */}
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

                      {/* Seat Grid (2-3 layout with aisle) */}
                      {(() => {
                        // Calculate occupied seats once for all seats
                        const occupiedSeats = [];
                        const seatOwners = {};
                        seatingData.forEach(ticket => {
                          if (ticket.seat_numbers && Array.isArray(ticket.seat_numbers)) {
                            ticket.seat_numbers.forEach(seat => {
                              occupiedSeats.push(seat);
                              seatOwners[seat] = ticket.passengerName || 'Passenger';
                            });
                          }
                        });

                        const capacity = buses.find(b => b.id === seatingFilter.bus_id)?.capacity || 50;
                        const numRows = Math.ceil(capacity / 5);

                        return (
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {Array.from({ length: numRows }, (_, rowIndex) => (
                              <div key={rowIndex} style={{ display: "flex", justifyContent: "center", gap: "12px", alignItems: "center" }}>
                                {/* Left side - 2 seats */}
                                <div style={{ display: "flex", gap: "8px" }}>
                                  {[1, 2].map(col => {
                                    const seatNumber = rowIndex * 5 + col;
                                    if (seatNumber > capacity) return null;
                                    
                                    const isOccupied = occupiedSeats.includes(seatNumber);
                                    
                                    return (
                                      <div
                                        key={seatNumber}
                                        title={isOccupied ? `Booked by: ${seatOwners[seatNumber]}` : `Seat ${seatNumber} - Available`}
                                        style={{
                                          width: 45,
                                          height: 45,
                                          borderRadius: 8,
                                          border: isOccupied ? "2px solid #999" : "2px solid #C2185B",
                                          background: isOccupied ? "#999" : "#4CAF50",
                                          color: "white",
                                          fontWeight: "bold",
                                          fontSize: "0.85em",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          transition: "all 0.2s",
                                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                                        }}
                                      >
                                        {isOccupied ? "✗" : seatNumber}
                                      </div>
                                    );
                                  })}
                                </div>
                                
                                {/* Aisle */}
                                <div style={{ width: 30, textAlign: "center", color: darkMode ? "#666" : "#ccc", fontWeight: "bold", fontSize: "1.2em" }}>
                                  │
                                </div>
                                
                                {/* Right side - 3 seats */}
                                <div style={{ display: "flex", gap: "8px" }}>
                                  {[3, 4, 5].map(col => {
                                    const seatNumber = rowIndex * 5 + col;
                                    if (seatNumber > capacity) return null;
                                    
                                    const isOccupied = occupiedSeats.includes(seatNumber);
                                    
                                    return (
                                      <div
                                        key={seatNumber}
                                        title={isOccupied ? `Booked by: ${seatOwners[seatNumber]}` : `Seat ${seatNumber} - Available`}
                                        style={{
                                          width: 45,
                                          height: 45,
                                          borderRadius: 8,
                                          border: isOccupied ? "2px solid #999" : "2px solid #C2185B",
                                          background: isOccupied ? "#999" : "#4CAF50",
                                          color: "white",
                                          fontWeight: "bold",
                                          fontSize: "0.85em",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          transition: "all 0.2s",
                                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                                        }}
                                      >
                                        {isOccupied ? "✗" : seatNumber}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Passenger List */}
                  {seatingData.length > 0 && (
                    <div style={{ marginTop: 30 }}>
                      <h4 style={{ color: darkMode ? "#E0E0E0" : "#333", marginBottom: 15 }}>
                        Booked Passengers ({seatingData.length})
                      </h4>
                      <div style={{ 
                        maxHeight: 300, 
                        overflowY: "auto",
                        border: darkMode ? "1px solid #3C3C3C" : "1px solid #E0E0E0",
                        borderRadius: 8,
                        padding: 10
                      }}>
                        {seatingData.map((ticket, index) => (
                          <div
                            key={ticket.id}
                            style={{
                              padding: 10,
                              marginBottom: 8,
                              background: darkMode ? "#1C1C1C" : "#F9F9F9",
                              borderRadius: 6,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: "0.9em"
                            }}
                          >
                            <div style={{ color: darkMode ? "#E0E0E0" : "#333" }}>
                              <strong>{ticket.passengerName || 'Passenger'}</strong>
                            </div>
                            <div style={{ 
                              color: darkMode ? "#B0B0B0" : "#666",
                              display: "flex",
                              gap: 10
                            }}>
                              <span>Seats: {ticket.seat_numbers?.join(", ") || "N/A"}</span>
                              <span style={{
                                padding: "2px 8px",
                                borderRadius: 4,
                                background: ticket.status === "active" ? "#4CAF50" : "#999",
                                color: "white",
                                fontSize: "0.85em"
                              }}>
                                {ticket.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
    </div>
    </div>
  );
}
