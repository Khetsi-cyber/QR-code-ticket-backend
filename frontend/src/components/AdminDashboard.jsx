import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  FiHome,
  FiBarChart2,
  FiShoppingBag,
  FiDollarSign,
  FiSettings,
  FiFileText,
  FiLayers,
  FiBriefcase,
  FiTruck,
  FiMail,
  FiUsers,
  FiImage,
  FiEdit2,
  FiTrash2,
  FiUpload,
  FiAlertTriangle,
  FiBell,
  FiTool,
  FiTrendingUp,
  FiSave,
  FiSmartphone,
  FiUserPlus,
  FiUserCheck,
  FiUserX,
  FiShield,
  FiPlus,
  FiSun,
  FiMoon,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiUser,
  FiCalendar,
  FiMessageSquare,
  FiSend,
  FiCheck,
  FiEdit,
  FiClock,
  FiMapPin,
  FiStar,
  FiPhone,
  FiMap,
  FiInfo
} from "react-icons/fi";

export default function AdminDashboard({ showToast, darkMode = false }) {
  const [tickets, setTickets] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeFilter, setTimeFilter] = useState("today"); // today, week, month, all
  const [expandedStatus, setExpandedStatus] = useState({ active: true, used: false });
  const [expandedDates, setExpandedDates] = useState({});
  const [reviews, setReviews] = useState([]);
  const [showReviews, setShowReviews] = useState(false);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalMode, setUserModalMode] = useState("add"); // add, edit
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUserData, setNewUserData] = useState({ email: "", full_name: "", role: "user" });
  const [settings, setSettings] = useState({
    bookingWindow: 24,
    cancellationPolicy: 2,
    maxReschedules: 1,
    defaultSeatCapacity: 60,
    seatSelectionFee: 0,
    bookingFee: 0
  });
  
  // Shuttle Bookings State
  const [shuttleBookings, setShuttleBookings] = useState([]);
  const [loadingShuttleBookings, setLoadingShuttleBookings] = useState(false);
  const [selectedShuttleBooking, setSelectedShuttleBooking] = useState(null);
  const [showShuttleModal, setShowShuttleModal] = useState(false);
  const [shuttleResponse, setShuttleResponse] = useState({ admin_response: "", status: "confirmed" });
  
  // Page Management State
  const [pages, setPages] = useState([
    { 
      id: 1, 
      page: 'Home Page', 
      status: 'Published', 
      updated: new Date().toISOString(), 
      content: `Welcome to Eswatini Transport Services - Your Premier Bus Ticketing Platform

We are proud to be Eswatini's leading online bus booking service, connecting travelers across the kingdom with reliable, comfortable, and affordable transportation.

Our Mission:
To provide safe, efficient, and modern transportation solutions that make travel accessible to everyone in Eswatini.

Why Choose Us:
• Over 10 years of trusted service
• Modern fleet of well-maintained buses
• Professional and courteous drivers
• Competitive pricing with no hidden fees
• Easy online booking with instant confirmation
• Flexible cancellation and rescheduling policies

Whether you're commuting to work, visiting family, or exploring our beautiful kingdom, we're here to get you there safely and comfortably.` 
    },
    { 
      id: 2, 
      page: 'About Us', 
      status: 'Published', 
      updated: new Date().toISOString(), 
      content: `About Eswatini Transport Services

Established in 2015, Eswatini Transport Services has grown to become the most trusted name in public transportation across the kingdom. What started as a small operation with just 3 buses has expanded into a comprehensive network serving all major cities and towns.

Our Story:
Founded by a team of transportation professionals who saw the need for reliable, modern bus services in Eswatini, we've continuously invested in our fleet, technology, and customer service to deliver the best travel experience possible.

Our Values:
• Safety First - Every bus undergoes rigorous maintenance checks
• Customer Satisfaction - Your comfort and convenience are our priority
• Innovation - Leading the industry with digital ticketing and online booking
• Community - Supporting local communities and creating jobs
• Reliability - On-time departures and arrivals you can count on

Our Team:
We employ over 150 dedicated staff members including experienced drivers, customer service representatives, maintenance technicians, and administrative personnel. Each team member is trained to uphold our high standards of service.

Our Fleet:
30+ modern, air-conditioned buses equipped with comfortable seating, safety features, and maintained to the highest standards.` 
    },
    { 
      id: 3, 
      page: 'Routes & Schedules', 
      status: 'Published', 
      updated: new Date().toISOString(), 
      content: `Routes & Schedules

We operate daily services connecting all major destinations across Eswatini:

Main Routes:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚍 Mbabane ↔ Manzini
• Frequency: Every 30 minutes
• Duration: 45 minutes
• First Departure: 5:30 AM
• Last Departure: 9:00 PM
• Fare: E35

🚍 Mbabane ↔ Siteki
• Frequency: Every hour
• Duration: 2 hours
• First Departure: 6:00 AM
• Last Departure: 6:00 PM
• Fare: E65

🚍 Manzini ↔ Big Bend
• Frequency: Every 90 minutes
• Duration: 1 hour 30 minutes
• First Departure: 6:00 AM
• Last Departure: 7:00 PM
• Fare: E45

🚍 Mbabane ↔ Piggs Peak
• Frequency: Every 2 hours
• Duration: 1 hour 15 minutes
• First Departure: 6:30 AM
• Last Departure: 5:30 PM
• Fare: E50

Special Services:
• Express routes during peak hours
• Weekend special schedules
• Holiday additional services

Note: Schedules may vary on public holidays. Check our website or contact customer service for the most up-to-date information.` 
    },
    { 
      id: 4, 
      page: 'Contact Us', 
      status: 'Published', 
      updated: new Date().toISOString(), 
      content: `Contact Eswatini Transport Services

We're here to help! Get in touch with us for bookings, inquiries, or any assistance you need.

📞 Phone Numbers:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Main Line: +268 7600 0000
Customer Support: +268 7600 0001
WhatsApp: +268 7600 0000
Lost & Found: +268 7600 0002

📧 Email:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
General Inquiries: info@tiyandza.co.sz
Customer Support: support@tiyandza.co.sz
Bookings: bookings@tiyandza.co.sz
Feedback: feedback@tiyandza.co.sz

🏢 Head Office:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Eswatini Transport Services
123 Main Street
Mbabane, Eswatini
P.O. Box 12345

🕐 Office Hours:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Monday - Friday: 7:00 AM - 7:00 PM
Saturday: 8:00 AM - 5:00 PM
Sunday: 9:00 AM - 2:00 PM

🚉 Terminal Locations:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mbabane Terminal: City Center, near Market
Manzini Terminal: Main Bus Rank
Siteki Terminal: Town Center
Big Bend Terminal: Commercial Area

💬 Social Media:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Facebook: @EswatiniTransport
Twitter: @EswatiniTransport
Instagram: @eswatini_transport

For urgent assistance during travel, contact our 24/7 emergency line: +268 7600 0999` 
    },
    { 
      id: 5, 
      page: 'Terms & Conditions', 
      status: 'Published', 
      updated: new Date().toISOString(), 
      content: `Terms & Conditions

Last Updated: February 2026

1. TICKET PURCHASE & BOOKING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1.1 All tickets must be booked through our official website or authorized agents.
1.2 Payment must be completed before a booking is confirmed.
1.3 Each ticket is valid only for the date, time, and route specified.
1.4 Passengers must present their QR code ticket for boarding.

2. CANCELLATION & REFUND POLICY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2.1 Cancellations made 24+ hours before departure: 90% refund
2.2 Cancellations made 12-24 hours before departure: 50% refund
2.3 Cancellations made less than 12 hours before departure: No refund
2.4 No-shows will not be eligible for refunds
2.5 Refunds will be processed within 7 business days

3. RESCHEDULING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3.1 Passengers may reschedule once free of charge if done 24+ hours in advance
3.2 Additional rescheduling will incur a E15 fee
3.3 Rescheduling is subject to seat availability

4. PASSENGER RESPONSIBILITIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4.1 Arrive at the terminal at least 15 minutes before departure
4.2 Carry valid identification
4.3 Ensure luggage complies with size and weight restrictions
4.4 Behave respectfully towards staff and fellow passengers
4.5 No smoking, alcohol, or illegal substances on board

5. LUGGAGE POLICY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5.1 One carry-on bag (max 7kg) and one checked bag (max 20kg) included
5.2 Additional luggage will incur extra charges
5.3 Valuable items should be kept with passenger
5.4 Company is not liable for lost or damaged luggage beyond E500

6. LIABILITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6.1 We are not liable for delays due to circumstances beyond our control
6.2 Maximum liability is limited to the ticket value
6.3 Passengers travel at their own risk

7. COMPLAINTS & DISPUTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7.1 All complaints must be submitted in writing within 7 days
7.2 We will respond to complaints within 14 business days
7.3 Disputes will be governed by Eswatini law

By purchasing a ticket, you agree to these terms and conditions.` 
    },
    { 
      id: 6, 
      page: 'Privacy Policy', 
      status: 'Published', 
      updated: new Date().toISOString(), 
      content: `Privacy Policy

Effective Date: February 2026

At Eswatini Transport Services, we are committed to protecting your privacy and personal information. This policy explains how we collect, use, and safeguard your data.

1. INFORMATION WE COLLECT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
We collect the following information when you use our service:
• Personal Information: Name, email, phone number, ID number
• Booking Information: Travel dates, routes, seat preferences
• Payment Information: Transaction details (we don't store card details)
• Device Information: IP address, browser type, device ID
• Usage Data: Pages visited, booking patterns, preferences

2. HOW WE USE YOUR INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your information is used to:
• Process bookings and issue tickets
• Send booking confirmations and travel updates
• Provide customer support
• Improve our services
• Send promotional offers (with your consent)
• Comply with legal requirements
• Prevent fraud and ensure security

3. INFORMATION SHARING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
We do NOT sell your personal information. We only share data with:
• Payment processors (for transaction processing)
• Government authorities (when legally required)
• Service providers (who help operate our business)
All third parties are bound by confidentiality agreements.

4. DATA SECURITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
We implement industry-standard security measures:
• Encrypted data transmission (SSL/TLS)
• Secure servers with restricted access
• Regular security audits
• Staff training on data protection
• Password-protected accounts

5. YOUR RIGHTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You have the right to:
• Access your personal data
• Correct inaccurate information
• Request deletion of your data
• Opt-out of marketing communications
• Request a copy of your data
• Lodge a complaint with authorities

6. COOKIES & TRACKING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
We use cookies to:
• Remember your preferences
• Analyze website traffic
• Improve user experience
You can disable cookies in your browser settings, though some features may not work properly.

7. DATA RETENTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
We retain your data for:
• Active bookings: Until travel is completed
• Account information: As long as your account is active
• Transaction records: 7 years (for legal/tax purposes)
• Marketing data: Until you opt-out

8. CHILDREN'S PRIVACY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Our service is not directed to children under 13. We do not knowingly collect data from children. Parents/guardians must provide consent for minors aged 13-18.

9. CHANGES TO THIS POLICY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
We may update this policy periodically. Changes will be posted on our website with the updated effective date.

10. CONTACT US
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
For privacy concerns or data requests:
Email: privacy@tiyandza.co.sz
Phone: +268 7600 0000
Mail: Privacy Officer, Eswatini Transport Services, 123 Main Street, Mbabane

By using our service, you agree to this Privacy Policy.` 
    }
  ]);
  const [showPageModal, setShowPageModal] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  
  const [contentSections, setContentSections] = useState([
    { 
      id: 'hero', 
      name: 'Hero Banner', 
      color: '#C2185B', 
      title: 'Travel Across Eswatini with Comfort & Safety', 
      subtitle: 'Book your bus tickets online with instant QR confirmation. Journey starts here!', 
      buttonText: 'Book Your Seat Now' 
    },
    { 
      id: 'features', 
      name: 'Features Section', 
      color: '#C2185B', 
      items: [
        'Instant Online Booking - Reserve your seat in seconds',
        'Smart Seat Selection - Choose your preferred seat on the bus',
        'QR Code Tickets - Digital tickets you can download instantly',
        '24/7 Customer Support - We\'re here whenever you need us',
        'Secure Payments - Multiple payment options including mobile money',
        'Real-time Schedule Updates - Get notified of any changes',
        'Reschedule & Refund Options - Flexible booking policies',
        'Track Your Bus - Know exactly when your bus arrives'
      ] 
    },
    { 
      id: 'testimonials', 
      name: 'Testimonials', 
      color: '#C2185B', 
      testimonials: [
        {
          id: 1,
          name: 'Sipho Dlamini',
          location: 'Manzini',
          rating: 5,
          comment: 'The online booking system is so easy to use! I can book my tickets from anywhere and the QR code feature means no more paper tickets. Highly recommend!',
          date: '2026-02-10'
        },
        {
          id: 2,
          name: 'Thandi Nkosi',
          location: 'Mbabane',
          rating: 5,
          comment: 'Best bus service in Eswatini! The drivers are professional, buses are clean and comfortable. The seat selection feature is a game changer.',
          date: '2026-02-08'
        },
        {
          id: 3,
          name: 'Mandla Simelane',
          location: 'Siteki',
          rating: 4,
          comment: 'Very reliable service. I travel for work weekly and never had any issues. Customer support is responsive and helpful.',
          date: '2026-02-05'
        },
        {
          id: 4,
          name: 'Nomsa Vilakati',
          location: 'Piggs Peak',
          rating: 5,
          comment: 'I was worried about booking online but it was so simple! Got my QR code immediately and boarding was smooth. Will definitely use again.',
          date: '2026-01-28'
        }
      ] 
    },
    { 
      id: 'newsletter', 
      name: 'Newsletter', 
      color: '#C2185B', 
      heading: 'Stay Updated with Travel Offers', 
      description: 'Subscribe to our newsletter and get exclusive discounts, travel tips, and early access to special promotions!' 
    }
  ]);
  const [showContentModal, setShowContentModal] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  
  const [brandAssets, setBrandAssets] = useState({
    logo: null,
    favicon: null,
    banners: []
  });
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [uploadingAssetType, setUploadingAssetType] = useState(null);
  
  // Portfolio Management State
  const [buses, setBuses] = useState([]);
  const [maintenanceSchedule, setMaintenanceSchedule] = useState([]);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState(null);
  const [showAddBusModal, setShowAddBusModal] = useState(false);
  const [newBusData, setNewBusData] = useState({ bus_number: '', capacity: 60, status: 'active' });
  
  // Service Management State
  const [routes, setRoutes] = useState([]);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [serviceHours, setServiceHours] = useState([]);
  const [showServiceHoursModal, setShowServiceHoursModal] = useState(false);
  const [editingServiceHours, setEditingServiceHours] = useState(null);
  const [serviceAlerts, setServiceAlerts] = useState([]);
  
  // Enquiry Management State
  const [enquiries, setEnquiries] = useState([]);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [respondingEnquiry, setRespondingEnquiry] = useState(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    loadTickets();
    loadPayments();
    loadReviews();
    loadUsers();
    loadSettings();
    loadPageManagementData();
    loadBuses();
    loadMaintenanceSchedule();
    loadRoutes();
    loadServiceHours();
    loadServiceAlerts();
    loadEnquiries();
    loadShuttleBookings();
  }, []);

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

  const loadPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("status", "SUCCESSFUL")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("❌ Error loading payments:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        return;
      }
      console.log("✅ Loaded payments:", data?.length || 0);
      if (data && data.length > 0) {
        const totalRevenue = data.reduce((sum, p) => sum + parseFloat(p.amount), 0);
        console.log("   Total payment revenue:", totalRevenue, data[0].currency);
        console.log("   First payment:", data[0]);
      }
      setPayments(data || []);
    } catch (err) {
      console.error("❌ Exception loading payments:", err);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      console.log("Loaded users:", data?.length || 0);
      setUsers(data || []);
    } catch (err) {
      console.error("Error loading users:", err);
      showToast?.("Failed to load users: " + err.message, "error");
    }
  };

  const loadSettings = async () => {
    try {
      // Try to load from database first
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');
      
      if (!error && data && data.length > 0) {
        // Convert array of settings to object
        const settingsObj = {};
        data.forEach(setting => {
          const key = setting.setting_key.replace(/_./g, match => match[1].toUpperCase());
          const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
          settingsObj[camelKey] = parseFloat(setting.setting_value) || 0;
        });
        setSettings(prevSettings => ({ ...prevSettings, ...settingsObj }));
        // Also save to localStorage as backup
        localStorage.setItem('busTicketingSettings', JSON.stringify({ ...settings, ...settingsObj }));
      } else {
        // Fallback to localStorage
        const savedSettings = localStorage.getItem('busTicketingSettings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      }
    } catch (err) {
      console.error("Error loading settings:", err);
      // Try localStorage as final fallback
      try {
        const savedSettings = localStorage.getItem('busTicketingSettings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (e) {
        console.error("Error loading from localStorage:", e);
      }
    }
  };

  const saveSettings = async () => {
    try {
      // Save to localStorage first (always works)
      localStorage.setItem('busTicketingSettings', JSON.stringify(settings));
      
      // Try to save to database
      const settingsArray = [
        { key: 'booking_window', value: settings.bookingWindow },
        { key: 'cancellation_policy', value: settings.cancellationPolicy },
        { key: 'max_reschedules', value: settings.maxReschedules },
        { key: 'default_seat_capacity', value: settings.defaultSeatCapacity },
        { key: 'seat_selection_fee', value: settings.seatSelectionFee },
        { key: 'booking_fee', value: settings.bookingFee }
      ];

      for (const setting of settingsArray) {
        const { error } = await supabase
          .from('system_settings')
          .update({ setting_value: setting.value.toString() })
          .eq('setting_key', setting.key);
        
        if (error) {
          console.warn(`Could not update ${setting.key} in database:`, error.message);
        }
      }
      
      showToast?.("Settings saved successfully", "success");
    } catch (err) {
      console.error("Error saving settings:", err);
      showToast?.("Settings saved locally (database sync may have failed)", "warning");
    }
  };

  const loadPageManagementData = () => {
    try {
      const savedPages = localStorage.getItem('websitePages');
      if (savedPages) setPages(JSON.parse(savedPages));
      
      const savedContent = localStorage.getItem('contentSections');
      if (savedContent) setContentSections(JSON.parse(savedContent));
      
      const savedAssets = localStorage.getItem('brandAssets');
      if (savedAssets) setBrandAssets(JSON.parse(savedAssets));
    } catch (err) {
      console.error("Error loading page management data:", err);
    }
  };

  const savePage = () => {
    if (!editingPage) return;
    const updatedPages = pages.map(p => 
      p.id === editingPage.id ? { ...editingPage, updated: new Date().toISOString() } : p
    );
    setPages(updatedPages);
    localStorage.setItem('websitePages', JSON.stringify(updatedPages));
    showToast?.(`${editingPage.page} updated successfully`, 'success');
    setShowPageModal(false);
    setEditingPage(null);
  };

  const saveContentSection = () => {
    if (!editingContent) return;
    const updatedContent = contentSections.map(c => 
      c.id === editingContent.id ? editingContent : c
    );
    setContentSections(updatedContent);
    localStorage.setItem('contentSections', JSON.stringify(updatedContent));
    showToast?.(`${editingContent.name} configured successfully`, 'success');
    setShowContentModal(false);
    setEditingContent(null);
  };

  const handleFileUpload = (event, assetType) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const newAssets = { ...brandAssets };
      if (assetType === 'banner') {
        newAssets.banners = [...(newAssets.banners || []), { id: Date.now(), name: file.name, data: reader.result }];
      } else {
        newAssets[assetType] = { name: file.name, data: reader.result };
      }
      setBrandAssets(newAssets);
      localStorage.setItem('brandAssets', JSON.stringify(newAssets));
      showToast?.(`${assetType} uploaded successfully`, 'success');
      setShowAssetModal(false);
    };
    reader.readAsDataURL(file);
  };

  const loadBuses = async () => {
    try {
      const { data, error } = await supabase
        .from('buses')
        .select('*')
        .order('bus_number');
      
      if (error) throw error;
      console.log('Loaded buses:', data?.length || 0);
      setBuses(data || []);
    } catch (err) {
      console.error('Error loading buses:', err);
      showToast?.('Failed to load buses: ' + err.message, 'error');
    }
  };

  const loadMaintenanceSchedule = () => {
    try {
      const saved = localStorage.getItem('maintenanceSchedule');
      if (saved) {
        setMaintenanceSchedule(JSON.parse(saved));
      } else {
        // Default maintenance records
        const defaultSchedule = [
          { id: 1, bus_id: null, bus_number: 'SD 003 EF', type: 'Engine Service', date: '2026-02-15', status: 'In Progress', notes: 'Regular engine maintenance' },
          { id: 2, bus_id: null, bus_number: 'SD 001 AB', type: 'Tire Replacement', date: '2026-02-20', status: 'Scheduled', notes: 'All tires replacement' },
          { id: 3, bus_id: null, bus_number: 'SD 005 IJ', type: 'Oil Change', date: '2026-02-25', status: 'Scheduled', notes: 'Routine oil change' }
        ];
        setMaintenanceSchedule(defaultSchedule);
        localStorage.setItem('maintenanceSchedule', JSON.stringify(defaultSchedule));
      }
    } catch (err) {
      console.error('Error loading maintenance schedule:', err);
    }
  };

  const saveMaintenance = () => {
    if (!editingMaintenance) return;
    
    let updatedSchedule;
    if (editingMaintenance.id) {
      // Update existing
      updatedSchedule = maintenanceSchedule.map(m => 
        m.id === editingMaintenance.id ? editingMaintenance : m
      );
    } else {
      // Add new
      updatedSchedule = [...maintenanceSchedule, { ...editingMaintenance, id: Date.now() }];
    }
    
    setMaintenanceSchedule(updatedSchedule);
    localStorage.setItem('maintenanceSchedule', JSON.stringify(updatedSchedule));
    showToast?.('Maintenance record saved', 'success');
    setShowMaintenanceModal(false);
    setEditingMaintenance(null);
  };

  const deleteMaintenance = (id) => {
    if (window.confirm('Delete this maintenance record?')) {
      const updated = maintenanceSchedule.filter(m => m.id !== id);
      setMaintenanceSchedule(updated);
      localStorage.setItem('maintenanceSchedule', JSON.stringify(updated));
      showToast?.('Maintenance record deleted', 'success');
    }
  };

  const addNewBus = async () => {
    if (!newBusData.bus_number || !newBusData.capacity) {
      showToast?.('Please fill in all required fields', 'error');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('buses')
        .insert([{
          bus_number: newBusData.bus_number,
          capacity: newBusData.capacity,
          status: newBusData.status
        }])
        .select();
      
      if (error) throw error;
      showToast?.('Bus added successfully', 'success');
      setShowAddBusModal(false);
      setNewBusData({ bus_number: '', capacity: 60, status: 'active' });
      loadBuses();
    } catch (err) {
      console.error('Error adding bus:', err);
      showToast?.('Failed to add bus: ' + err.message, 'error');
    }
  };

  const getPerformanceMetrics = () => {
    if (!buses.length || !tickets.length) return { utilization: 0, onTime: 0, availability: 0 };
    
    // Calculate average utilization (tickets / total capacity)
    const totalCapacity = buses.reduce((sum, bus) => sum + (bus.capacity || 0), 0);
    const utilization = totalCapacity > 0 ? (tickets.length / totalCapacity * 100).toFixed(0) : 0;
    
    // On-Time Performance - estimate from successful tickets
    const successfulTickets = tickets.filter(t => t.status === 'used' || t.status === 'active');
    const onTime = tickets.length > 0 ? (successfulTickets.length / tickets.length * 100).toFixed(0) : 0;
    
    // Fleet Availability - active buses vs total
    const activeBuses = buses.filter(b => b.status === 'active').length;
    const availability = buses.length > 0 ? (activeBuses / buses.length * 100).toFixed(0) : 0;
    
    return { utilization, onTime, availability };
  };

  const loadRoutes = () => {
    try {
      const saved = localStorage.getItem('routes');
      if (saved) {
        setRoutes(JSON.parse(saved));
      } else {
        // Initialize with default routes based on tickets
        const uniqueRoutes = [...new Set(tickets.map(t => `${t.departure}|${t.destination}`))];
        const defaultRoutes = uniqueRoutes.map((route, idx) => {
          const [from, to] = route.split('|');
          return {
            id: idx + 1,
            from,
            to,
            distance: '45 km',
            fare: 'E35',
            frequency: '30 min',
            active: true
          };
        });
        setRoutes(defaultRoutes);
        localStorage.setItem('routes', JSON.stringify(defaultRoutes));
      }
    } catch (err) {
      console.error('Error loading routes:', err);
    }
  };

  const saveRoute = () => {
    if (!editingRoute || !editingRoute.from || !editingRoute.to) {
      showToast?.('Please fill in all required fields', 'error');
      return;
    }
    
    let updatedRoutes;
    if (editingRoute.id) {
      // Update existing
      updatedRoutes = routes.map(r => r.id === editingRoute.id ? editingRoute : r);
    } else {
      // Add new
      updatedRoutes = [...routes, { ...editingRoute, id: Date.now() }];
    }
    
    setRoutes(updatedRoutes);
    localStorage.setItem('routes', JSON.stringify(updatedRoutes));
    showToast?.('Route saved successfully', 'success');
    setShowRouteModal(false);
    setEditingRoute(null);
  };

  const deleteRoute = (id) => {
    if (window.confirm('Delete this route?')) {
      const updated = routes.filter(r => r.id !== id);
      setRoutes(updated);
      localStorage.setItem('routes', JSON.stringify(updated));
      showToast?.('Route deleted', 'success');
    }
  };

  const loadServiceHours = () => {
    try {
      const saved = localStorage.getItem('serviceHours');
      if (saved) {
        setServiceHours(JSON.parse(saved));
      } else {
        const defaultHours = [
          { id: 1, day: 'Monday - Friday', hours: '5:00 AM - 10:00 PM' },
          { id: 2, day: 'Saturday', hours: '6:00 AM - 9:00 PM' },
          { id: 3, day: 'Sunday', hours: '7:00 AM - 8:00 PM' },
          { id: 4, day: 'Public Holidays', hours: '7:00 AM - 7:00 PM' }
        ];
        setServiceHours(defaultHours);
        localStorage.setItem('serviceHours', JSON.stringify(defaultHours));
      }
    } catch (err) {
      console.error('Error loading service hours:', err);
    }
  };

  const saveServiceHours = () => {
    if (!editingServiceHours || !editingServiceHours.day || !editingServiceHours.hours) {
      showToast?.('Please fill in all fields', 'error');
      return;
    }
    
    const updated = serviceHours.map(sh => 
      sh.id === editingServiceHours.id ? editingServiceHours : sh
    );
    
    setServiceHours(updated);
    localStorage.setItem('serviceHours', JSON.stringify(updated));
    showToast?.('Service hours updated', 'success');
    setShowServiceHoursModal(false);
    setEditingServiceHours(null);
  };

  const getServiceQualityMetrics = () => {
    // On-Time Performance - successful tickets
    const successfulTickets = tickets.filter(t => t.status === 'used' || t.status === 'active');
    const onTimePerformance = tickets.length > 0 ? ((successfulTickets.length / tickets.length) * 100).toFixed(0) : 0;
    
    // Service Reliability - tickets with no issues (not cancelled or expired)
    const reliableTickets = tickets.filter(t => t.status !== 'cancelled' && t.status !== 'expired');
    const serviceReliability = tickets.length > 0 ? ((reliableTickets.length / tickets.length) * 100).toFixed(0) : 0;
    
    // Average Customer Rating from reviews
    const avgRating = reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0';
    
    // Active Routes count
    const activeRoutesCount = [...new Set(tickets.map(t => `${t.departure}-${t.destination}`))].length;
    
    return { onTimePerformance, serviceReliability, avgRating, activeRoutesCount };
  };

  const loadServiceAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('service_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServiceAlerts(data || []);
    } catch (err) {
      console.error('Error loading service alerts:', err);
      showToast?.(`Failed to load service alerts: ${err.message}`, 'error');
    }
  };

  const deleteServiceAlert = async (id) => {
    if (window.confirm('Delete this service alert?')) {
      try {
        const { error } = await supabase
          .from('service_alerts')
          .delete()
          .eq('id', id);

        if (error) throw error;

        showToast?.('Alert deleted', 'success');
        await loadServiceAlerts();
      } catch (err) {
        console.error('Error deleting alert:', err);
        showToast?.('Failed to delete alert', 'error');
      }
    }
  };

  const loadEnquiries = async () => {
    try {
      const { data, error } = await supabase
        .from('enquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEnquiries(data || []);
    } catch (err) {
      console.error('Error loading enquiries:', err);
      showToast?.(`Failed to load enquiries: ${err.message}`, 'error');
    }
  };

  const respondToEnquiry = async () => {
    if (!responseText.trim()) {
      showToast?.('Please enter a response', 'error');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('enquiries')
        .update({
          status: 'responded',
          response: responseText.trim(),
          responded_at: new Date().toISOString(),
          responded_by: user.id
        })
        .eq('id', respondingEnquiry.id);

      if (error) throw error;

      showToast?.('Response sent successfully', 'success');
      setShowResponseModal(false);
      setRespondingEnquiry(null);
      setResponseText('');
      await loadEnquiries();
    } catch (err) {
      console.error('Error responding to enquiry:', err);
      showToast?.(err.message || 'Failed to send response', 'error');
    }
  };

  const deleteEnquiry = async (id) => {
    if (window.confirm('Delete this enquiry?')) {
      try {
        const { error } = await supabase
          .from('enquiries')
          .delete()
          .eq('id', id);

        if (error) throw error;

        showToast?.('Enquiry deleted', 'success');
        await loadEnquiries();
      } catch (err) {
        console.error('Error deleting enquiry:', err);
        showToast?.(err.message || 'Failed to delete enquiry', 'error');
      }
    }
  };

  const loadShuttleBookings = async () => {
    setLoadingShuttleBookings(true);
    try {
      const { data, error } = await supabase
        .from('shuttle_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Loaded shuttle bookings:', data?.length || 0);
      setShuttleBookings(data || []);
    } catch (err) {
      console.error('Error loading shuttle bookings:', err);
      showToast?.(`Failed to load shuttle bookings: ${err.message}`, 'error');
    } finally {
      setLoadingShuttleBookings(false);
    }
  };

  const respondToShuttleBooking = async () => {
    if (!shuttleResponse.admin_response.trim()) {
      showToast?.('Please enter a response message', 'error');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('shuttle_bookings')
        .update({
          status: shuttleResponse.status,
          admin_response: shuttleResponse.admin_response.trim(),
          responded_at: new Date().toISOString(),
          responded_by: user.id
        })
        .eq('id', selectedShuttleBooking.id);

      if (error) throw error;

      showToast?.('Response sent successfully! Customer will be notified via email.', 'success');
      setShowShuttleModal(false);
      setSelectedShuttleBooking(null);
      setShuttleResponse({ admin_response: "", status: "confirmed" });
      await loadShuttleBookings();
    } catch (err) {
      console.error('Error responding to shuttle booking:', err);
      showToast?.(err.message || 'Failed to send response', 'error');
    }
  };

  const deleteShuttleBooking = async (id) => {
    if (window.confirm('Delete this shuttle booking request?')) {
      try {
        const { error } = await supabase
          .from('shuttle_bookings')
          .delete()
          .eq('id', id);

        if (error) throw error;

        showToast?.('Shuttle booking deleted', 'success');
        await loadShuttleBookings();
      } catch (err) {
        console.error('Error deleting shuttle booking:', err);
        showToast?.(err.message || 'Failed to delete shuttle booking', 'error');
      }
    }
  };

  const loadReviews = async () => {
    try {
      // First, try to load reviews with profile join
      let { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          profiles (
            full_name,
            email
          )
        `)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error with join query:", error);
        // Fallback: load reviews without join
        const result = await supabase
          .from("reviews")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (result.error) throw result.error;
        
        // Manually fetch profile data for each review
        const reviewsWithProfiles = await Promise.all(
          (result.data || []).map(async (review) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, email")
              .eq("id", review.user_id)
              .single();
            
            return {
              ...review,
              profiles: profile || { full_name: "Unknown", email: "N/A" }
            };
          })
        );
        
        data = reviewsWithProfiles;
      }
      
      console.log("Loaded reviews:", data?.length || 0);
      setReviews(data || []);
    } catch (err) {
      console.error("Error loading reviews:", err);
      showToast?.("Failed to load reviews: " + err.message, "error");
    }
  };



  const getFilteredTickets = () => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    
    return tickets.filter(t => {
      if (!t.created_at) return false;
      const ticketDate = new Date(t.created_at);
      
      switch (timeFilter) {
        case "today":
          return t.created_at.split("T")[0] === today;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return ticketDate >= weekAgo;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return ticketDate >= monthAgo;
        case "all":
          return true;
        default:
          return true;
      }
    });
  };

  const getStats = () => {
    const filteredTickets = getFilteredTickets();
    
    // Calculate revenue from tickets
    const ticketRevenue = filteredTickets.reduce((sum, t) => {
      const fare = parseFloat(t.fare) || 0;
      return sum + fare;
    }, 0);
    
    // Calculate revenue from successful MoMo payments (filter by time)
    const getFilteredPayments = () => {
      const now = new Date();
      return payments.filter(payment => {
        if (!payment.created_at) return false;
        const paymentDate = new Date(payment.created_at);
        
        if (timeFilter === "today") {
          return paymentDate.toDateString() === now.toDateString();
        } else if (timeFilter === "week") {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return paymentDate >= weekAgo;
        } else if (timeFilter === "month") {
          return paymentDate.getMonth() === now.getMonth() && 
                 paymentDate.getFullYear() === now.getFullYear();
        }
        return true; // "all"
      });
    };
    
    const filteredPayments = getFilteredPayments();
    const paymentRevenue = filteredPayments.reduce((sum, p) => {
      const amount = parseFloat(p.amount) || 0;
      return sum + amount;
    }, 0);
    
    const totalRevenue = ticketRevenue + paymentRevenue;
    
    // Debug logging for revenue calculation
    console.log(`📊 Revenue Calculation (Filter: ${timeFilter}):`);
    console.log(`   Ticket Revenue: ${ticketRevenue.toFixed(2)}`);
    console.log(`   Payment Revenue: ${paymentRevenue.toFixed(2)} (${filteredPayments.length} payments)`);
    console.log(`   Total Revenue: ${totalRevenue.toFixed(2)}`);
    
    return { 
      count: filteredTickets.length, 
      revenue: totalRevenue.toFixed(2),
      filteredTickets,
      paymentCount: filteredPayments.length,
      paymentRevenue: paymentRevenue.toFixed(2)
    };
  };

  const stats = getStats();

  // Analytics data calculations
  const getMonthlyData = () => {
    const monthlyStats = {};
    const last6Months = [];
    const now = new Date();
    
    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      last6Months.push({ key: monthKey, name: monthName });
      monthlyStats[monthKey] = { revenue: 0, count: 0, active: 0, used: 0 };
    }
    
    // Aggregate ticket data by month
    tickets.forEach(ticket => {
      if (!ticket.created_at) return;
      const ticketDate = new Date(ticket.created_at);
      const monthKey = `${ticketDate.getFullYear()}-${String(ticketDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyStats[monthKey]) {
        monthlyStats[monthKey].revenue += parseFloat(ticket.fare) || 0;
        monthlyStats[monthKey].count += 1;
        
        if (ticket.status === 'active') monthlyStats[monthKey].active += 1;
        if (ticket.status === 'used') monthlyStats[monthKey].used += 1;
      }
    });
    
    // Add payment data to monthly stats
    payments.forEach(payment => {
      if (!payment.created_at) return;
      const paymentDate = new Date(payment.created_at);
      const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyStats[monthKey]) {
        monthlyStats[monthKey].revenue += parseFloat(payment.amount) || 0;
      }
    });
    
    return last6Months.map(month => ({
      month: month.name,
      revenue: monthlyStats[month.key].revenue,
      count: monthlyStats[month.key].count,
      active: monthlyStats[month.key].active,
      used: monthlyStats[month.key].used
    }));
  };

  const getStatusBreakdown = () => {
    const breakdown = {
      active: tickets.filter(t => t.status === 'active').length,
      used: tickets.filter(t => t.status === 'used').length,
      cancelled: tickets.filter(t => t.status === 'cancelled').length,
      expired: tickets.filter(t => t.status === 'expired').length
    };
    const total = breakdown.active + breakdown.used + breakdown.cancelled + breakdown.expired;
    
    return Object.entries(breakdown).map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? ((count / total) * 100).toFixed(1) : 0
    }));
  };

  const menuItems = [
    {
      section: "Dashboard",
      icon: <FiHome />,
      items: [
        { id: "dashboard", label: "Dashboard", icon: <FiHome /> },
        { id: "analytics", label: "Analytics", icon: <FiBarChart2 /> },
        { id: "commerce", label: "Commerce", icon: <FiShoppingBag /> },
        { id: "sales", label: "Sales", icon: <FiDollarSign /> }
      ]
    },
    {
      section: "Settings",
      icon: <FiSettings />,
      items: [
        { id: "settings", label: "Settings", icon: <FiSettings /> }
      ]
    },
    {
      section: "Management",
      icon: <FiLayers />,
      items: [
        { id: "page-management", label: "Page Management", icon: <FiFileText /> },
        { id: "content-management", label: "Content Management", icon: <FiLayers /> },
        { id: "portfolio-management", label: "Portfolio Management", icon: <FiBriefcase /> },
        { id: "service-management", label: "Service Management", icon: <FiTruck /> },
        { id: "enquiry-management", label: "Enquiry Management", icon: <FiMail /> },
        { id: "shuttle-bookings", label: "Shuttle Bookings", icon: <FiTruck /> }
      ]
    }
  ];

  return (
    <div style={{ 
      display: "flex", 
      minHeight: "100vh", 
      position: "relative", 
      backgroundImage: "url('/images/banner.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundAttachment: "fixed"
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
      {/* Sidebar Trigger Zone */}
      <div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: sidebarHovered ? "250px" : "20px",
          height: "100vh",
          zIndex: 999,
          transition: "width 0.3s ease"
        }}
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
      >
        {/* Sidebar */}
        <div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: "250px",
            height: "100vh",
            background: darkMode ? "#2C2C2C" : "white",
            transform: sidebarHovered ? "translateX(0)" : "translateX(-230px)",
            transition: "transform 0.3s ease",
            boxShadow: darkMode ? "4px 0 15px rgba(0, 0, 0, 0.5)" : "4px 0 15px rgba(194, 24, 91, 0.2)",
            overflowY: "auto",
            padding: "20px 0",
            zIndex: 1000
          }}
        >
          {/* Logo/Title */}
          <div style={{
            padding: "0 20px 20px",
            borderBottom: darkMode ? "2px solid rgba(194, 24, 91, 0.5)" : "2px solid #C2185B",
            marginBottom: 20
          }}>
            <h3 style={{ color: darkMode ? "#E0E0E0" : "#C2185B", margin: 0, fontSize: "1.3em" }}>Admin Panel</h3>
          </div>

          {/* Menu Items */}
          {menuItems.map((section, idx) => (
            <div key={idx} style={{ marginBottom: 25 }}>
              <div style={{
                padding: "10px 20px",
                color: darkMode ? "#E0E0E0" : "#C2185B",
                fontSize: "0.85em",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "1px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <span style={{ fontSize: "1em" }}>{section.icon}</span>
                {section.section}
              </div>
              {section.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  style={{
                    padding: "12px 20px 12px 30px",
                    color: activeMenu === item.id ? "#C2185B" : (darkMode ? "#B0B0B0" : "#333"),
                    background: activeMenu === item.id ? (darkMode ? "rgba(194, 24, 91, 0.2)" : "#fdf3f7") : "transparent",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontSize: "0.95em",
                    fontWeight: activeMenu === item.id ? "bold" : "normal",
                    borderLeft: activeMenu === item.id ? "4px solid #C2185B" : "4px solid transparent",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px"
                  }}
                  onMouseEnter={(e) => {
                    if (activeMenu !== item.id) {
                      e.target.style.background = darkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.2)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeMenu !== item.id) {
                      e.target.style.background = "transparent";
                    }
                  }}
                >
                  <span style={{ fontSize: "1em" }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          ))}

          {/* Hover Indicator */}
          {!sidebarHovered && (
            <div style={{
              position: "absolute",
              right: -20,
              top: "50%",
              transform: "translateY(-50%)",
              background: darkMode ? "#2C2C2C" : "white",
              borderRadius: "0 8px 8px 0",
              padding: "10px 4px",
              boxShadow: darkMode ? "2px 0 8px rgba(0, 0, 0, 0.5)" : "2px 0 8px rgba(194, 24, 91, 0.2)"
            }}>
              <div style={{ color: "#C2185B", fontSize: "1.2em" }}>▶</div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        marginLeft: "20px", 
        maxWidth: 1200, 
        margin: "0 auto", 
        padding: 20, 
        background: darkMode ? "#2C2C2C" : "white", 
        minHeight: "100vh", 
        borderRadius: 15, 
        width: "100%", 
        border: darkMode ? "2px solid rgba(194, 24, 91, 0.5)" : "2px solid #C2185B",
        position: "relative",
        zIndex: 1
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: 20 }}>
          <img 
            src="/images/logo.png" 
            alt="Logo" 
            style={{ height: "140px", width: "auto", objectFit: "contain" }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h2 style={{ color: darkMode ? "#E0E0E0" : "#C2185B", textAlign: "center", fontSize: "2em", margin: 0 }}>
            {menuItems.flatMap(s => s.items).find(i => i.id === activeMenu)?.label || "Admin Dashboard"}
          </h2>
        </div>

        {activeMenu === "dashboard" && (
          <>

      {/* Time Filter */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ marginRight: 10, fontWeight: "bold", color: darkMode ? "#E0E0E0" : "#C2185B" }}>Show data for:</label>
        <select 
          value={timeFilter} 
          onChange={(e) => setTimeFilter(e.target.value)}
          style={{ padding: "8px 12px", fontSize: "1em", borderRadius: 8, border: "2px solid #C2185B", background: darkMode ? "#3C3C3C" : "white", color: darkMode ? "#E0E0E0" : "#C2185B" }}
        >
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20, marginBottom: 30 }}>
        <div style={{ background: darkMode ? "#3C3C3C" : "white", color: darkMode ? "#E0E0E0" : "#C2185B", padding: 20, borderRadius: 12, border: "2px solid #C2185B", boxShadow: darkMode ? "0 2px 8px rgba(0, 0, 0, 0.3)" : "0 2px 8px rgba(194, 24, 91, 0.1)" }}>
          <div style={{ fontSize: "2em", fontWeight: "bold" }}>{stats.count}</div>
          <div>Tickets {timeFilter === "today" ? "Today" : timeFilter === "week" ? "This Week" : timeFilter === "month" ? "This Month" : "Total"}</div>
        </div>
        <div style={{ background: darkMode ? "#3C3C3C" : "white", color: darkMode ? "#E0E0E0" : "#C2185B", padding: 20, borderRadius: 12, border: "2px solid #C2185B", boxShadow: darkMode ? "0 2px 8px rgba(0, 0, 0, 0.3)" : "0 2px 8px rgba(194, 24, 91, 0.1)" }}>
          <div style={{ fontSize: "2em", fontWeight: "bold" }}>E{stats.revenue}</div>
          <div>Revenue {timeFilter === "today" ? "Today" : timeFilter === "week" ? "This Week" : timeFilter === "month" ? "This Month" : "Total"}</div>
        </div>
        <div style={{ background: darkMode ? "#3C3C3C" : "white", color: darkMode ? "#E0E0E0" : "#C2185B", padding: 20, borderRadius: 12, border: "2px solid #C2185B", boxShadow: darkMode ? "0 2px 8px rgba(0, 0, 0, 0.3)" : "0 2px 8px rgba(194, 24, 91, 0.1)" }}>
          <div style={{ fontSize: "2em", fontWeight: "bold" }}>{tickets.length}</div>
          <div>Total Tickets</div>
        </div>
      </div>

      {/* Reviews Section */}
      <div style={{ marginBottom: 30 }}>
          <button
          onClick={() => setShowReviews(!showReviews)}
          style={{
            background: darkMode ? "#3C3C3C" : "white",
            color: darkMode ? "#E0E0E0" : "#C2185B",
            border: "2px solid #C2185B",
            borderRadius: 8,
            padding: "12px 24px",
            fontSize: "1em",
            fontWeight: "bold",
            cursor: "pointer",
            marginBottom: 15,
            boxShadow: darkMode ? "0 2px 8px rgba(0, 0, 0, 0.3)" : "0 2px 8px rgba(194, 24, 91, 0.1)"
          }}
        >
          {showReviews ? "Hide" : "Show"} Customer Reviews ({reviews.length})
        </button>

        {showReviews && (
          <div style={{
            background: darkMode ? "#3C3C3C" : "white",
            borderRadius: 12,
            padding: 20,
            border: "2px solid #C2185B",
            boxShadow: darkMode ? "0 2px 8px rgba(0, 0, 0, 0.3)" : "0 2px 8px rgba(194, 24, 91, 0.1)"
          }}>
            <h3 style={{ color: darkMode ? "#E0E0E0" : "#C2185B", marginTop: 0 }}>Customer Feedback</h3>
            
            {reviews.length === 0 ? (
              <p style={{ color: darkMode ? "#888" : "#999", textAlign: "center", padding: 20 }}>No reviews yet</p>
            ) : (
              <div style={{ display: "grid", gap: 15 }}>
                {/* Calculate average rating */}
                {(() => {
                  const avgRating = reviews.length > 0 
                    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                    : 0;
                  
                  const ratingCounts = [5, 4, 3, 2, 1].map(rating => ({
                    rating,
                    count: reviews.filter(r => r.rating === rating).length
                  }));

                  return (
                    <div style={{
                      background: "white",
                      padding: 20,
                      borderRadius: 8,
                      marginBottom: 20,
                      border: "2px solid #C2185B"
                    }}>
                      <div style={{ textAlign: "center", marginBottom: 15 }}>
                        <div style={{ fontSize: "3em", color: "#C2185B", fontWeight: "bold" }}>
                          {avgRating}
                        </div>
                        <div style={{ color: "#C2185B", fontSize: "1.5em", marginBottom: 5, display: "flex", alignItems: "center", gap: 4 }}>
                          {[...Array(Math.round(avgRating))].map((_, i) => <FiStar key={i} fill="#C2185B" />)}
                        </div>
                        <div style={{ color: "#999", fontSize: "0.9em" }}>
                          Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                        </div>
                      </div>

                      {/* Rating Distribution */}
                      <div style={{ marginTop: 15 }}>
                        {ratingCounts.map(({ rating, count }) => (
                          <div key={rating} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                            <div style={{ minWidth: 80, color: "#C2185B", fontWeight: "bold", display: "flex", alignItems: "center", gap: 4 }}>
                              {rating} <FiStar />
                            </div>
                            <div style={{ flex: 1, background: "#f0f0f0", borderRadius: 4, height: 20, overflow: "hidden" }}>
                              <div style={{
                                width: `${reviews.length > 0 ? (count / reviews.length) * 100 : 0}%`,
                                background: "#C2185B",
                                height: "100%",
                                transition: "width 0.3s"
                              }} />
                            </div>
                            <div style={{ minWidth: 40, color: "#999", fontSize: "0.9em" }}>
                              ({count})
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Individual Reviews */}
                <div style={{ display: "grid", gap: 12 }}>
                  {reviews.map(review => (
                    <div key={review.id} style={{
                      background: "white",
                      padding: 15,
                      borderRadius: 8,
                      border: "2px solid #C2185B"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 10 }}>
                        <div>
                          <div style={{ fontWeight: "bold", color: "#C2185B", marginBottom: 5 }}>
                            {review.profiles?.full_name || "Anonymous"}
                          </div>
                          <div style={{ color: "#C2185B", fontSize: "1.2em", display: "flex", alignItems: "center", gap: 4 }}>
                            {[...Array(review.rating)].map((_, i) => <FiStar key={i} />)}
                          </div>
                        </div>
                        <div style={{ fontSize: "0.8em", color: "#999" }}>
                          {new Date(review.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      {review.comment && (
                        <div style={{ 
                          color: "#333",
                          fontSize: "0.95em",
                          lineHeight: 1.5,
                          marginTop: 10,
                          padding: 10,
                          background: "white",
                          borderRadius: 6,
                          border: "1px solid #C2185B"
                        }}>
                          "{review.comment}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* All Tickets */}
      <div>
        <h3 style={{ color: "#C2185B" }}>All Tickets</h3>
        {loading ? (
          <p style={{ color: "#C2185B" }}>Loading...</p>
        ) : tickets.length === 0 ? (
          <p style={{ color: "#C2185B" }}>No tickets yet</p>
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
                <div key={status} style={{ background: "white", borderRadius: 12, border: "2px solid #C2185B", boxShadow: "0 2px 8px rgba(194, 24, 91, 0.1)", overflow: "hidden" }}>
                  {/* Status Header */}
                  <div 
                    onClick={() => toggleStatus(status)}
                    style={{ 
                      background: "white",
                      padding: 15, 
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: expandedStatus[status] ? "2px solid #C2185B" : "none"
                    }}
                  >
                    <h4 style={{ margin: 0, color: "#C2185B", textTransform: "uppercase" }}>
                      {status === "active" ? "Active Tickets" : status === "used" ? "Used Tickets" : `${status} Tickets`}
                      <span style={{ marginLeft: 10, fontSize: "0.9em", opacity: 0.9 }}>
                        ({Object.values(grouped[status]).flat().length})
                      </span>
                    </h4>
                    <span style={{ fontSize: "1.5em", color: "#C2185B" }}>
                      {expandedStatus[status] ? "▼" : "▶"}
                    </span>
                  </div>

                  {/* Status Content */}
                  {expandedStatus[status] && (
                    <div style={{ padding: 15 }}>
                      {Object.keys(grouped[status]).sort((a, b) => new Date(b) - new Date(a)).map(date => {
                        const dateKey = `${status}-${date}`;
                        const isDateExpanded = expandedDates[dateKey];
                        const dateTickets = grouped[status][date];

                        return (
                          <div key={date} style={{ marginBottom: 15, border: "2px solid #C2185B", borderRadius: 8, overflow: "hidden" }}>
                            {/* Date Header */}
                            <div 
                              onClick={() => toggleDate(status, date)}
                              style={{ 
                                background: "white",
                                padding: 12, 
                                cursor: "pointer",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                borderBottom: "2px solid #C2185B"
                              }}
                            >
                              <strong style={{ color: "#C2185B" }}>
                                {date} 
                                <span style={{ marginLeft: 10, fontSize: "0.9em", opacity: 0.8 }}>
                                  ({dateTickets.length} tickets)
                                </span>
                              </strong>
                              <span style={{ fontSize: "1.2em", color: "#C2185B" }}>
                                {isDateExpanded ? "▼" : "▶"}
                              </span>
                            </div>

                            {/* Tickets for this date */}
                            {isDateExpanded && (
                              <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                  <thead>
                                    <tr style={{ background: "white", borderBottom: "2px solid #C2185B" }}>
                                      <th style={{ padding: 8, textAlign: "left", color: "#C2185B", fontSize: "0.85em" }}>Bus</th>
                                      <th style={{ padding: 8, textAlign: "left", color: "#C2185B", fontSize: "0.85em" }}>Route</th>
                                      <th style={{ padding: 8, textAlign: "left", color: "#C2185B", fontSize: "0.85em" }}>Fare</th>
                                      <th style={{ padding: 8, textAlign: "left", color: "#C2185B", fontSize: "0.85em" }}>Payment</th>
                                      <th style={{ padding: 8, textAlign: "left", color: "#C2185B", fontSize: "0.85em" }}>Time</th>
                                      {status === "active" && <th style={{ padding: 8, textAlign: "left", color: "#C2185B", fontSize: "0.85em" }}>Action</th>}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {dateTickets.map(ticket => {
                                      let isCashPayment = false;
                                      try {
                                        const qrData = JSON.parse(ticket.qr_code);
                                        isCashPayment = qrData.payment_type === "CASH";
                                      } catch (e) {}
                                      
                                      return (
                                        <tr key={ticket.id} style={{ borderBottom: "1px solid #eee" }}>
                                          <td style={{ padding: 8, fontSize: "0.9em" }}>{ticket.buses?.bus_number || "N/A"}</td>
                                          <td style={{ padding: 8, fontSize: "0.9em" }}>{ticket.departure} → {ticket.destination}</td>
                                          <td style={{ padding: 8, fontSize: "0.9em", fontWeight: "bold", color: "#C2185B" }}>E{ticket.fare}</td>
                                          <td style={{ padding: 8 }}>
                                            {isCashPayment ? (
                                              <span style={{
                                                padding: "3px 6px",
                                                borderRadius: 4,
                                                background: "white",
                                                color: "#C2185B",
                                                fontSize: "0.75em",
                                                fontWeight: "bold",
                                                border: "1px solid #C2185B"
                                              }}>
                                                CASH
                                              </span>
                                            ) : (
                                              <span style={{ fontSize: "0.8em", color: "#C2185B", fontWeight: "500" }}>Online</span>
                                            )}
                                          </td>
                                          <td style={{ padding: 8, fontSize: "0.85em", color: "#666" }}>
                                            {new Date(ticket.created_at).toLocaleTimeString()}
                                          </td>
                                          {status === "active" && (
                                            <td style={{ padding: 8 }}>
                                              <button
                                                onClick={async () => {
                                                  try {
                                                    const { error } = await supabase
                                                      .from("tickets")
                                                      .update({ status: "used", used_at: new Date().toISOString() })
                                                      .eq("id", ticket.id);
                                                    
                                                    if (error) throw error;
                                                    
                                                    showToast?.("Ticket marked as used", "success");
                                                    await loadTickets();
                                                  } catch (err) {
                                                    console.error("Error marking ticket:", err);
                                                    showToast?.("Failed to mark ticket as used", "error");
                                                  }
                                                }}
                                                style={{
                                                  background: "white",
                                                  color: "#C2185B",
                                                  border: "2px solid #C2185B",
                                                  borderRadius: 4,
                                                  padding: "4px 8px",
                                                  fontSize: "0.75em",
                                                  cursor: "pointer",
                                                  fontWeight: "bold"
                                                }}
                                              >
                                                Use
                                              </button>
                                            </td>
                                          )}
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ));
            })()}
          </div>
        )}
      </div>      
      {/* About Us Section */}
      <div style={{
        marginTop: 40,
        padding: "20px",
        background: "white",
        borderRadius: "12px",
        textAlign: "left",
        maxWidth: "800px",
        margin: "40px auto 0",
        border: "2px solid #C2185B",
        boxShadow: "0 2px 8px rgba(194, 24, 91, 0.1)"
      }}>
        <h3 style={{ 
          margin: "0 0 10px 0", 
          fontSize: "1.2em", 
          color: "#C2185B",
          fontWeight: "600"
        }}>
          About Us
        </h3>
        <p style={{ 
          margin: 0, 
          fontSize: "0.95em", 
          color: "#333",
          lineHeight: "1.6"
        }}>
          At Tiyandza Transport, we've taken the stress out of travel. No more long queues at the station or paper tickets lost in your bag. Our digital-first platform allows you to book your seat in seconds, manage your trips on the go, and board with just a scan of your phone.
          <br /><br />
          We combine a modern fleet with cutting-edge booking technology to ensure that from the moment you click "Buy" to the moment you reach your destination, your experience is seamless.
        </p>
      </div>
          </>
        )}

        {/* Placeholder sections for other menu items */}
        {activeMenu === "analytics" && (
          <div>
            {/* Key Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 15, marginBottom: 30 }}>
              <div style={{ background: "white", color: "#C2185B", padding: 20, borderRadius: 12, border: "2px solid #C2185B", textAlign: "center", boxShadow: "0 2px 8px rgba(194, 24, 91, 0.1)" }}>
                <div style={{ fontSize: "2.5em", fontWeight: "bold" }}>{tickets.length}</div>
                <div style={{ fontSize: "0.9em" }}>Total Tickets</div>
              </div>
              <div style={{ background: "white", color: "#C2185B", padding: 20, borderRadius: 12, border: "2px solid #C2185B", textAlign: "center", boxShadow: "0 2px 8px rgba(194, 24, 91, 0.1)" }}>
                <div style={{ fontSize: "2.5em", fontWeight: "bold" }}>{tickets.filter(t => t.status === 'active').length}</div>
                <div style={{ fontSize: "0.9em" }}>Active Tickets</div>
              </div>
              <div style={{ background: "white", color: "#C2185B", padding: 20, borderRadius: 12, border: "2px solid #C2185B", textAlign: "center", boxShadow: "0 2px 8px rgba(194, 24, 91, 0.1)" }}>
                <div style={{ fontSize: "2.5em", fontWeight: "bold" }}>{tickets.filter(t => t.status === 'used').length}</div>
                <div style={{ fontSize: "0.9em" }}>Used Tickets</div>
              </div>
              <div style={{ background: "white", color: "#C2185B", padding: 20, borderRadius: 12, border: "2px solid #C2185B", textAlign: "center", boxShadow: "0 2px 8px rgba(194, 24, 91, 0.1)" }}>
                <div style={{ fontSize: "2.5em", fontWeight: "bold" }}>E{tickets.reduce((sum, t) => sum + (parseFloat(t.fare) || 0), 0).toFixed(2)}</div>
                <div style={{ fontSize: "0.9em" }}>Total Revenue</div>
              </div>
            </div>

            {/* Monthly Sales Chart */}
            <div style={{ background: "white", padding: 25, borderRadius: 12, border: "2px solid #C2185B", marginBottom: 30 }}>
              <h3 style={{ color: "#C2185B", marginTop: 0, marginBottom: 20 }}><FiBarChart2 style={{ marginRight: 8 }} />Monthly Sales Revenue (Last 6 Months)</h3>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", height: 250, borderBottom: "2px solid #C2185B", padding: "20px 0" }}>
                {getMonthlyData().map((month, idx) => {
                  const maxRevenue = Math.max(...getMonthlyData().map(m => m.revenue), 1);
                  const height = (month.revenue / maxRevenue) * 180;
                  
                  return (
                    <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                      <div style={{ 
                        width: "60%", 
                        height: `${height}px`, 
                        background: "#C2185B",
                        borderRadius: "8px 8px 0 0",
                        position: "relative",
                        boxShadow: "0 4px 6px rgba(255, 105, 180, 0.3)"
                      }}>
                        <div style={{ 
                          position: "absolute", 
                          top: -25, 
                          left: "50%", 
                          transform: "translateX(-50%)", 
                          fontSize: "0.85em", 
                          fontWeight: "bold", 
                          color: "#C2185B",
                          whiteSpace: "nowrap"
                        }}>
                          E{month.revenue.toFixed(0)}
                        </div>
                      </div>
                      <div style={{ marginTop: 10, fontSize: "0.75em", color: "#666", textAlign: "center" }}>
                        {month.month}
                      </div>
                      <div style={{ fontSize: "0.7em", color: "#999" }}>
                        {month.count} tickets
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 30 }}>
              {/* Ticket Trends Chart */}
              <div style={{ background: "white", padding: 25, borderRadius: 12, border: "2px solid #C2185B" }}>
                <h3 style={{ color: "#C2185B", marginTop: 0, marginBottom: 20 }}><FiTrendingUp style={{ marginRight: 8 }} />Ticket Trends (Monthly)</h3>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", height: 200, borderBottom: "2px solid #C2185B" }}>
                  {getMonthlyData().map((month, idx) => {
                    const maxCount = Math.max(...getMonthlyData().map(m => m.count), 1);
                    const height = (month.count / maxCount) * 150;
                    
                    return (
                      <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 5 }}>
                        {/* Active bar */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div style={{ 
                            width: 15, 
                            height: `${(month.active / maxCount) * 150}px`, 
                            background: "#C2185B",
                            borderRadius: "4px 4px 0 0",
                            minHeight: 2
                          }}></div>
                        </div>
                        {/* Used bar */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div style={{ 
                            width: 15, 
                            height: `${(month.used / maxCount) * 150}px`, 
                            background: "#C2185B",
                            borderRadius: "4px 4px 0 0",
                            minHeight: 2
                          }}></div>
                        </div>
                        <div style={{ fontSize: "0.65em", color: "#666", marginTop: 5, writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                          {month.month.split(' ')[0]}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 15 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 12, height: 12, background: "#C2185B", borderRadius: 2 }}></div>
                    <span style={{ fontSize: "0.8em", color: "#666" }}>Active</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 12, height: 12, background: "#C2185B", borderRadius: 2 }}></div>
                    <span style={{ fontSize: "0.8em", color: "#666" }}>Used</span>
                  </div>
                </div>
              </div>

              {/* Status Breakdown */}
              <div style={{ background: "white", padding: 25, borderRadius: 12, border: "2px solid #C2185B" }}>
                <h3 style={{ color: "#C2185B", marginTop: 0, marginBottom: 20 }}><FiBarChart2 style={{ marginRight: 8 }} />Ticket Status Breakdown</h3>
                {getStatusBreakdown().map((item, idx) => {
                  const colors = {
                    active: { bg: "#C2185B", light: "#fff" },
                    used: { bg: "#C2185B", light: "#fff" },
                    cancelled: { bg: "#C2185B", light: "#fff" },
                    expired: { bg: "#C2185B", light: "#fff" }
                  };
                  
                  return (
                    <div key={idx} style={{ marginBottom: 15 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: "0.9em" }}>
                        <span style={{ textTransform: "capitalize", fontWeight: "500", color: "#666" }}>{item.status}</span>
                        <span style={{ fontWeight: "bold", color: colors[item.status]?.bg }}>{item.count} ({item.percentage}%)</span>
                      </div>
                      <div style={{ 
                        width: "100%", 
                        height: 20, 
                        background: colors[item.status]?.light, 
                        borderRadius: 10, 
                        overflow: "hidden",
                        border: `1px solid ${colors[item.status]?.bg}`
                      }}>
                        <div style={{ 
                          width: `${item.percentage}%`, 
                          height: "100%", 
                          background: colors[item.status]?.bg
                        }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Average Rating from Reviews */}
            {reviews.length > 0 && (
              <div style={{ background: "white", padding: 25, borderRadius: 12, border: "2px solid #C2185B" }}>
                <h3 style={{ color: "#C2185B", marginTop: 0, marginBottom: 20 }}>Customer Satisfaction</h3>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "3em", fontWeight: "bold", color: "#C2185B" }}>
                      {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                    </div>
                    <div style={{ color: "#666" }}>Average Rating</div>
                    <div style={{ fontSize: "1.5em", color: "#C2185B", display: "flex", alignItems: "center", gap: 4 }}>
                      {[...Array(Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length))].map((_, i) => <FiStar key={i} fill="#C2185B" />)}
                    </div>
                  </div>
                  <div style={{ flex: 1, maxWidth: 400, marginLeft: 40 }}>
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = reviews.filter(r => r.rating === star).length;
                      const percentage = (count / reviews.length) * 100;
                      
                      return (
                        <div key={star} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <span style={{ fontSize: "0.9em", color: "#666", minWidth: 60, display: "flex", alignItems: "center", gap: 4 }}>{star} <FiStar /></span>
                          <div style={{ flex: 1, height: 16, background: "white", borderRadius: 8, overflow: "hidden", border: "1px solid #C2185B" }}>
                            <div style={{ width: `${percentage}%`, height: "100%", background: "#C2185B" }}></div>
                          </div>
                          <span style={{ fontSize: "0.85em", color: "#999", minWidth: 40 }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeMenu === "commerce" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20, marginBottom: 30 }}>
              <div style={{ background: "white", color: "#C2185B", padding: 25, borderRadius: 12, border: "2px solid #C2185B", boxShadow: "0 2px 8px rgba(194, 24, 91, 0.1)" }}>
                <div style={{ fontSize: "0.9em", marginBottom: 5 }}>Total Transactions</div>
                <div style={{ fontSize: "2.5em", fontWeight: "bold" }}>{tickets.length}</div>
              </div>
              <div style={{ background: "white", color: "#C2185B", padding: 25, borderRadius: 12, border: "2px solid #C2185B", boxShadow: "0 2px 8px rgba(194, 24, 91, 0.1)" }}>
                <div style={{ fontSize: "0.9em", marginBottom: 5 }}>Cash Payments</div>
                <div style={{ fontSize: "2.5em", fontWeight: "bold" }}>{tickets.filter(t => {
                  try {
                    const qr = JSON.parse(t.qr_code);
                    return qr.payment_type === 'CASH';
                  } catch { return false; }
                }).length}</div>
              </div>
              <div style={{ background: "white", color: "#C2185B", padding: 25, borderRadius: 12, border: "2px solid #C2185B", boxShadow: "0 2px 8px rgba(194, 24, 91, 0.1)" }}>
                <div style={{ fontSize: "0.9em", marginBottom: 5 }}>Card Payments</div>
                <div style={{ fontSize: "2.5em", fontWeight: "bold" }}>{tickets.filter(t => {
                  try {
                    const qr = JSON.parse(t.qr_code);
                    return qr.payment_type === 'CARD';
                  } catch { return false; }
                }).length}</div>
              </div>
              <div style={{ background: "white", color: "#C2185B", padding: 25, borderRadius: 12, border: "2px solid #C2185B", boxShadow: "0 2px 8px rgba(194, 24, 91, 0.1)" }}>
                <div style={{ fontSize: "0.9em", marginBottom: 5 }}>Mobile Money</div>
                <div style={{ fontSize: "2.5em", fontWeight: "bold" }}>{(() => {
                  const ticketMoMo = tickets.filter(t => {
                    try {
                      const qr = JSON.parse(t.qr_code);
                      return qr.payment_type === 'MOBILE_MONEY';
                    } catch { return false; }
                  }).length;
                  // Add successful MoMo payments from payments table
                  return ticketMoMo + payments.length;
                })()}</div>
              </div>
            </div>

            <div style={{ background: "white", padding: 30, borderRadius: 12, border: "2px solid #C2185B", marginBottom: 20 }}>
              <h3 style={{ color: "#C2185B", marginTop: 0 }}>Payment Methods Overview</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <h4 style={{ color: "#C2185B", marginBottom: 15 }}>Accepted Payment Methods</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ padding: 15, background: "white", borderRadius: 8, border: "2px solid #C2185B" }}>
                      <div style={{ fontWeight: "bold", color: "#C2185B" }}>Cash</div>
                      <div style={{ fontSize: "0.85em", color: "#666" }}>Pay directly to the driver</div>
                    </div>
                    <div style={{ padding: 15, background: "white", borderRadius: 8, border: "2px solid #C2185B" }}>
                      <div style={{ fontWeight: "bold", color: "#C2185B" }}>Credit/Debit Card</div>
                      <div style={{ fontSize: "0.85em", color: "#666" }}>Secure online payment</div>
                    </div>
                    <div style={{ padding: 15, background: "white", borderRadius: 8, border: "2px solid #C2185B" }}>
                      <div style={{ fontWeight: "bold", color: "#C2185B" }}>Mobile Money</div>
                      <div style={{ fontSize: "0.85em", color: "#666" }}>MTN, Eswatini Mobile, etc.</div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 style={{ color: "#C2185B", marginBottom: 15 }}>Transaction Security</h4>
                  <div style={{ fontSize: "0.9em", color: "#666", lineHeight: 1.8 }}>
                    <p>SSL/TLS Encrypted Transactions</p>
                    <p>PCI DSS Compliant</p>
                    <p>Two-Factor Authentication</p>
                    <p>Fraud Detection System</p>
                    <p>Instant Payment Confirmation</p>
                    <p>Automatic Refund Processing</p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: "white", padding: 30, borderRadius: 12, border: "2px solid #C2185B" }}>
              <h3 style={{ color: "#C2185B", marginTop: 0 }}>Revenue Breakdown by Payment Method</h3>
              {[
                {type: 'Cash', color: '#C2185B', paymentType: 'CASH'},
                {type: 'Card', color: '#C2185B', paymentType: 'CARD'},
                {type: 'Mobile Money', color: '#C2185B', paymentType: 'MOBILE_MONEY'}
              ].map(payment => {
                const paymentTickets = tickets.filter(t => {
                  try {
                    const qr = JSON.parse(t.qr_code);
                    return qr.payment_type === payment.paymentType;
                  } catch { return false; }
                });
                let revenue = paymentTickets.reduce((s, t) => s + (parseFloat(t.fare) || 0), 0);
                
                // Add MoMo payments from payments table for Mobile Money
                if (payment.paymentType === 'MOBILE_MONEY') {
                  const momoRevenue = payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
                  revenue += momoRevenue;
                }
                
                const ticketRevenue = tickets.reduce((s, t) => s + (parseFloat(t.fare) || 0), 0);
                const paymentsRevenue = payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
                const totalRevenue = ticketRevenue + paymentsRevenue;
                const percentage = totalRevenue > 0 ? (revenue / totalRevenue * 100).toFixed(1) : 0;
                
                return (
                  <div key={payment.type} style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontWeight: "bold" }}>{payment.type} Payments</span>
                      <span style={{ color: payment.color, fontWeight: "bold" }}>E{revenue.toFixed(2)} ({percentage}%)</span>
                    </div>
                    <div style={{ width: "100%", height: 30, background: "white", borderRadius: 15, overflow: "hidden", border: "1px solid #C2185B" }}>
                      <div style={{ width: `${percentage}%`, height: "100%", background: payment.color }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeMenu === "sales" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 15, marginBottom: 30 }}>
              <div style={{ background: "white", color: "#C2185B", padding: 20, borderRadius: 12, textAlign: "center", border: "2px solid #C2185B" }}>
                <div style={{ fontSize: "2.5em", fontWeight: "bold" }}>E{tickets.reduce((s, t) => s + (parseFloat(t.fare) || 0), 0).toFixed(2)}</div>
                <div style={{ fontSize: "0.9em" }}>Total Sales</div>
              </div>
              <div style={{ background: "white", color: "#C2185B", padding: 20, borderRadius: 12, textAlign: "center", border: "2px solid #C2185B" }}>
                <div style={{ fontSize: "2.5em", fontWeight: "bold" }}>{tickets.filter(t => new Date(t.created_at).toDateString() === new Date().toDateString()).length}</div>
                <div style={{ fontSize: "0.9em" }}>Today's Sales</div>
              </div>
              <div style={{ background: "white", color: "#C2185B", padding: 20, borderRadius: 12, textAlign: "center", border: "2px solid #C2185B" }}>
                <div style={{ fontSize: "2.5em", fontWeight: "bold" }}>{tickets.length > 0 ? (tickets.reduce((s, t) => s + (parseFloat(t.fare) || 0), 0) / tickets.length).toFixed(2) : 0}</div>
                <div style={{ fontSize: "0.9em" }}>Avg Ticket Price</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div style={{ background: "white", padding: 25, borderRadius: 12, border: "2px solid #C2185B" }}>
                <h3 style={{ color: "#C2185B", marginTop: 0 }}>Top Routes by Revenue</h3>
                {Object.entries(
                  tickets.reduce((acc, t) => {
                    const route = `${t.departure} → ${t.destination}`;
                    if (!acc[route]) acc[route] = { count: 0, revenue: 0 };
                    acc[route].count++;
                    acc[route].revenue += parseFloat(t.fare) || 0;
                    return acc;
                  }, {})
                ).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5).map(([route, data], idx) => (
                  <div key={idx} style={{ padding: 12, marginBottom: 10, background: "white", borderRadius: 8, border: "2px solid #C2185B" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontWeight: "bold", color: "#C2185B" }}>{route}</span>
                      <span style={{ color: "#C2185B", fontWeight: "bold" }}>E{data.revenue.toFixed(2)}</span>
                    </div>
                    <div style={{ fontSize: "0.85em", color: "#666" }}>{data.count} tickets sold</div>
                  </div>
                ))}
              </div>

              <div style={{ background: "white", padding: 25, borderRadius: 12, border: "2px solid #C2185B" }}>
                <h3 style={{ color: "#C2185B", marginTop: 0 }}>Peak Sales Hours</h3>
                {tickets.length > 0 ? (
                  Object.entries(
                    tickets.reduce((acc, t) => {
                      const hour = new Date(t.created_at).getHours();
                      const period = hour < 12 ? 'Morning (6-12)' : hour < 18 ? 'Afternoon (12-18)' : 'Evening (18-24)';
                      if (!acc[period]) acc[period] = 0;
                      acc[period]++;
                      return acc;
                    }, {})
                  ).map(([period, count], idx) => {
                    const percentage = (count / tickets.length * 100).toFixed(1);
                    const colors = ['#C2185B', '#C2185B', '#C2185B'];
                    return (
                      <div key={idx} style={{ marginBottom: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ fontWeight: "500" }}>{period}</span>
                          <span style={{ color: colors[idx], fontWeight: "bold" }}>{count} ({percentage}%)</span>
                        </div>
                        <div style={{ width: "100%", height: 25, background: "white", borderRadius: 12, overflow: "hidden", border: "1px solid #C2185B" }}>
                          <div style={{ width: `${percentage}%`, height: "100%", background: colors[idx] }}></div>
                        </div>
                      </div>
                    );
                  })
                ) : <p style={{ color: "#999", textAlign: "center" }}>No data available</p>}
              </div>
            </div>

            <div style={{ background: "white", padding: 25, borderRadius: 12, border: "2px solid #C2185B" }}>
              <h3 style={{ color: "#C2185B", marginTop: 0 }}>Sales Performance Summary</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 15 }}>
                {['Today', 'This Week', 'This Month'].map((period, idx) => {
                  const now = new Date();
                  let filteredTickets = [];
                  
                  if (period === 'Today') {
                    filteredTickets = tickets.filter(t => new Date(t.created_at).toDateString() === now.toDateString());
                  } else if (period === 'This Week') {
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    filteredTickets = tickets.filter(t => new Date(t.created_at) >= weekAgo);
                  } else {
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    filteredTickets = tickets.filter(t => new Date(t.created_at) >= monthAgo);
                  }
                  
                  const revenue = filteredTickets.reduce((s, t) => s + (parseFloat(t.fare) || 0), 0);
                  
                  return (
                    <div key={idx} style={{ padding: 20, background: "white", borderRadius: 10, border: "2px solid #C2185B" }}>
                      <div style={{ fontSize: "0.85em", color: "#C2185B", fontWeight: "bold", marginBottom: 10 }}>{period}</div>
                      <div style={{ fontSize: "1.8em", fontWeight: "bold", color: "#C2185B", marginBottom: 5 }}>E{revenue.toFixed(2)}</div>
                      <div style={{ fontSize: "0.85em", color: "#666" }}>{filteredTickets.length} tickets</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeMenu === "settings" && (
          <div>
            {/* Settings Summary Card */}
            <div style={{ background: "white", padding: 20, borderRadius: 12, marginBottom: 20, color: "#C2185B", border: "2px solid #C2185B" }}>
              <h3 style={{ margin: 0, marginBottom: 15 }}>Current System Settings</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 15 }}>
                <div style={{ background: "white", padding: 12, borderRadius: 8, border: "2px solid #C2185B" }}>
                  <div style={{ fontSize: "0.85em", marginBottom: 5 }}>Booking Window</div>
                  <div style={{ fontSize: "1.5em", fontWeight: "bold" }}>{settings.bookingWindow}h</div>
                </div>
                <div style={{ background: "white", padding: 12, borderRadius: 8, border: "2px solid #C2185B" }}>
                  <div style={{ fontSize: "0.85em", marginBottom: 5 }}>Cancellation Policy</div>
                  <div style={{ fontSize: "1.5em", fontWeight: "bold" }}>{settings.cancellationPolicy === 0 ? 'No Refunds' : `${settings.cancellationPolicy}h`}</div>
                </div>
                <div style={{ background: "white", padding: 12, borderRadius: 8, border: "2px solid #C2185B" }}>
                  <div style={{ fontSize: "0.85em", marginBottom: 5 }}>Max Reschedules</div>
                  <div style={{ fontSize: "1.5em", fontWeight: "bold" }}>{settings.maxReschedules === 999 ? 'Unlimited' : settings.maxReschedules}</div>
                </div>
                <div style={{ background: "white", padding: 12, borderRadius: 8, border: "2px solid #C2185B" }}>
                  <div style={{ fontSize: "0.85em", marginBottom: 5 }}>Seat Capacity</div>
                  <div style={{ fontSize: "1.5em", fontWeight: "bold" }}>{settings.defaultSeatCapacity} seats</div>
                </div>
                <div style={{ background: "white", padding: 12, borderRadius: 8, border: "2px solid #C2185B" }}>
                  <div style={{ fontSize: "0.85em", marginBottom: 5 }}>Seat Selection Fee</div>
                  <div style={{ fontSize: "1.5em", fontWeight: "bold" }}>E{settings.seatSelectionFee.toFixed(2)}</div>
                </div>
                <div style={{ background: "white", padding: 12, borderRadius: 8, border: "2px solid #C2185B" }}>
                  <div style={{ fontSize: "0.85em", marginBottom: 5 }}>Booking Fee</div>
                  <div style={{ fontSize: "1.5em", fontWeight: "bold" }}>E{settings.bookingFee.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div style={{ background: "white", padding: 25, borderRadius: 12, border: "2px solid #C2185B" }}>
                <h3 style={{ color: "#C2185B", marginTop: 0 }}><FiUsers style={{ marginRight: 8 }} />User Management</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ padding: 15, background: "#E8F5E9", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: "bold", color: "#4CAF50" }}>Total Users</div>
                      <div style={{ fontSize: "0.85em", color: "#666" }}>All registered passengers</div>
                    </div>
                    <div style={{ fontSize: "2em", fontWeight: "bold", color: "#4CAF50" }}>{users.filter(u => u.role === 'user').length}</div>
                  </div>
                  <div style={{ padding: 15, background: "#FFE4F0", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: "bold", color: "#C2185B" }}>Drivers</div>
                      <div style={{ fontSize: "0.85em", color: "#666" }}>Active driver accounts</div>
                    </div>
                    <div style={{ fontSize: "2em", fontWeight: "bold", color: "#C2185B" }}>{users.filter(u => u.role === 'driver').length}</div>
                  </div>
                  <div style={{ padding: 15, background: "#E3F2FD", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: "bold", color: "#2196F3" }}>Admins</div>
                      <div style={{ fontSize: "0.85em", color: "#666" }}>Administrator accounts</div>
                    </div>
                    <div style={{ fontSize: "2em", fontWeight: "bold", color: "#2196F3" }}>{users.filter(u => u.role === 'admin').length}</div>
                  </div>
                </div>
              </div>

              <div style={{ background: "white", padding: 25, borderRadius: 12, border: "2px solid #C2185B" }}>
                <h3 style={{ color: "#C2185B", marginTop: 0 }}><FiSettings style={{ marginRight: 8 }} />System Configuration</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                  <div>
                    <label style={{ fontWeight: "bold", color: "#C2185B", display: "block", marginBottom: 5 }}>Booking Window</label>
                    <select 
                      value={settings.bookingWindow}
                      onChange={(e) => setSettings({...settings, bookingWindow: parseInt(e.target.value)})}
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B" }}
                    >
                      <option value={24}>24 hours in advance</option>
                      <option value={48}>48 hours in advance</option>
                      <option value={72}>72 hours in advance</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontWeight: "bold", color: "#C2185B", display: "block", marginBottom: 5 }}>Cancellation Policy</label>
                    <select 
                      value={settings.cancellationPolicy}
                      onChange={(e) => setSettings({...settings, cancellationPolicy: parseInt(e.target.value)})}
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B" }}
                    >
                      <option value={2}>Free cancellation up to 2 hours</option>
                      <option value={24}>Free cancellation up to 24 hours</option>
                      <option value={0}>No refunds</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontWeight: "bold", color: "#C2185B", display: "block", marginBottom: 5 }}>Max Reschedules</label>
                    <select 
                      value={settings.maxReschedules}
                      onChange={(e) => setSettings({...settings, maxReschedules: parseInt(e.target.value)})}
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B" }}
                    >
                      <option value={1}>1 reschedule allowed</option>
                      <option value={2}>2 reschedules allowed</option>
                      <option value={999}>Unlimited reschedules</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: "white", padding: 25, borderRadius: 12, border: "2px solid #C2185B", marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
                <h3 style={{ color: "#C2185B", margin: 0 }}>Bus & Route Settings</h3>
                <button 
                  onClick={saveSettings}
                  style={{ padding: "10px 20px", background: "white", color: "#C2185B", border: "2px solid #C2185B", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}
                >
                  <FiSave style={{ marginRight: 6 }} /> Save All Settings
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 15 }}>
                <div style={{ padding: 20, background: "white", borderRadius: 10, border: "2px solid #C2185B" }}>
                  <div style={{ fontSize: "0.9em", color: "#C2185B", fontWeight: "bold", marginBottom: 10 }}>Default Seat Capacity</div>
                  <input 
                    type="number" 
                    value={settings.defaultSeatCapacity}
                    onChange={(e) => setSettings({...settings, defaultSeatCapacity: parseInt(e.target.value) || 0})}
                    min="1"
                    max="100"
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B" }} 
                  />
                  <div style={{ fontSize: "0.75em", color: "#999", marginTop: 5 }}>Seats per bus (1-100)</div>
                </div>
                <div style={{ padding: 20, background: "white", borderRadius: 10, border: "2px solid #C2185B" }}>
                  <div style={{ fontSize: "0.9em", color: "#C2185B", fontWeight: "bold", marginBottom: 10 }}>Seat Selection Fee</div>
                  <input 
                    type="number" 
                    value={settings.seatSelectionFee}
                    onChange={(e) => setSettings({...settings, seatSelectionFee: parseFloat(e.target.value) || 0})}
                    min="0"
                    step="0.01"
                    placeholder="E0.00" 
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B" }} 
                  />
                  <div style={{ fontSize: "0.75em", color: "#999", marginTop: 5 }}>Extra fee for choosing seat</div>
                </div>
                <div style={{ padding: 20, background: "white", borderRadius: 10, border: "2px solid #C2185B" }}>
                  <div style={{ fontSize: "0.9em", color: "#C2185B", fontWeight: "bold", marginBottom: 10 }}>Booking Fee</div>
                  <input 
                    type="number" 
                    value={settings.bookingFee}
                    onChange={(e) => setSettings({...settings, bookingFee: parseFloat(e.target.value) || 0})}
                    min="0"
                    step="0.01"
                    placeholder="E0.00" 
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B" }} 
                  />
                  <div style={{ fontSize: "0.75em", color: "#999", marginTop: 5 }}>Service fee per booking</div>
                </div>
              </div>
            </div>

            <div style={{ background: "white", padding: 25, borderRadius: 12, border: "2px solid #C2185B" }}>
              <h3 style={{ color: "#C2185B", marginTop: 0 }}>Notification Settings</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <div style={{ padding: 15, background: "white", borderRadius: 8, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", border: "2px solid #C2185B" }}>
                    <span style={{ fontWeight: "500", color: "#C2185B" }}><FiMail style={{ marginRight: 8 }} />Email Notifications</span>
                    <input type="checkbox" defaultChecked style={{ width: 20, height: 20 }} />
                  </div>
                  <div style={{ padding: 15, background: "white", borderRadius: 8, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", border: "2px solid #C2185B" }}>
                    <span style={{ fontWeight: "500", color: "#C2185B" }}><FiSmartphone style={{ marginRight: 8 }} />SMS Notifications</span>
                    <input type="checkbox" defaultChecked style={{ width: 20, height: 20 }} />
                  </div>
                  <div style={{ padding: 15, background: "white", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", border: "2px solid #C2185B" }}>
                    <span style={{ fontWeight: "500", color: "#C2185B" }}><FiBell style={{ marginRight: 8 }} />Push Notifications</span>
                    <input type="checkbox" defaultChecked style={{ width: 20, height: 20 }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.9em", color: "#666", lineHeight: 1.8 }}>
                    <p style={{ marginTop: 0 }}><strong>Notify passengers about:</strong></p>
                    <p>Booking confirmations</p>
                    <p>Schedule changes</p>
                    <p>Trip reminders (2 hours before)</p>
                    <p>Payment receipts</p>
                    <p>Cancellations and refunds</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed User Management */}
            <div style={{ marginTop: 20, background: "white", padding: 25, borderRadius: 12, border: "2px solid #C2185B" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ color: "#C2185B", margin: 0 }}><FiUsers style={{ marginRight: 8 }} />Active Passengers ({users.filter(u => u.role === 'user' && !u.blocked).length})</h3>
                <button 
                  onClick={() => {
                    setUserModalMode('add');
                    setNewUserData({ email: '', full_name: '', role: 'user' });
                    setShowUserModal(true);
                  }}
                  style={{ padding: "10px 20px", background: "white", color: "#C2185B", border: "2px solid #C2185B", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}
                >
                  <FiUserPlus style={{ marginRight: 6 }} /> Add User
                </button>
              </div>
              <div style={{ maxHeight: 400, overflowY: "auto" }}>
                {users.filter(u => u.role === 'user').length > 0 ? (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "white", borderBottom: "2px solid #C2185B" }}>
                        <th style={{ padding: 12, textAlign: "left", color: "#C2185B" }}>Name</th>
                        <th style={{ padding: 12, textAlign: "left", color: "#C2185B" }}>Email</th>
                        <th style={{ padding: 12, textAlign: "left", color: "#C2185B" }}>Status</th>
                        <th style={{ padding: 12, textAlign: "left", color: "#C2185B" }}>Joined</th>
                        <th style={{ padding: 12, textAlign: "center", color: "#C2185B" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter(u => u.role === 'user').map((user, idx) => (
                        <tr key={user.id} style={{ borderBottom: "1px solid #C2185B" }}>
                          <td style={{ padding: 12 }}>{user.full_name || 'N/A'}</td>
                          <td style={{ padding: 12 }}>{user.email}</td>
                          <td style={{ padding: 12 }}>
                            <span style={{ 
                              padding: "4px 10px", 
                              borderRadius: 12, 
                              fontSize: "0.8em", 
                              fontWeight: "bold",
                              background: 'white',
                              color: '#C2185B',
                              border: '2px solid #C2185B'
                            }}>
                              {user.blocked ? 'Blocked' : 'Active'}
                            </span>
                          </td>
                          <td style={{ padding: 12, fontSize: "0.9em", color: "#666" }}>
                            {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td style={{ padding: 12, textAlign: "center" }}>
                            <button
                              onClick={async () => {
                                if (window.confirm(`Are you sure you want to ${user.blocked ? 'unblock' : 'block'} ${user.full_name || user.email}?`)) {
                                  try {
                                    const { error } = await supabase
                                      .from('profiles')
                                      .update({ blocked: !user.blocked })
                                      .eq('id', user.id);
                                    if (error) throw error;
                                    showToast?.(`User ${user.blocked ? 'unblocked' : 'blocked'} successfully`, 'success');
                                    loadUsers();
                                  } catch (err) {
                                    showToast?.('Error: ' + err.message, 'error');
                                  }
                                }
                              }}
                              style={{ 
                                padding: "6px 12px", 
                                background: "white", 
                                color: "#C2185B", 
                                border: "2px solid #C2185B", 
                                borderRadius: 6, 
                                cursor: "pointer", 
                                fontSize: "0.85em",
                                marginRight: 8
                              }}
                            >
                              {user.blocked ? <><FiUserCheck style={{ marginRight: 6 }} /> Unblock</> : <><FiUserX style={{ marginRight: 6 }} /> Block</>}
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm(`Are you sure you want to permanently delete ${user.full_name || user.email}? This cannot be undone.`)) {
                                  try {
                                    const { error } = await supabase
                                      .from('profiles')
                                      .delete()
                                      .eq('id', user.id);
                                    if (error) throw error;
                                    showToast?.('User removed successfully', 'success');
                                    loadUsers();
                                  } catch (err) {
                                    showToast?.('Error: ' + err.message, 'error');
                                  }
                                }
                              }}
                              style={{ 
                                padding: "6px 12px", 
                                background: "white", 
                                color: "#C2185B", 
                                border: "2px solid #C2185B", 
                                borderRadius: 6, 
                                cursor: "pointer", 
                                fontSize: "0.85em"
                              }}
                            >
                              <FiTrash2 style={{ marginRight: 6 }} /> Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ textAlign: 'center', color: '#999', padding: 20 }}>No users found</p>
                )}
              </div>
            </div>

            {/* Driver Management */}
            <div style={{ marginTop: 20, background: "white", padding: 25, borderRadius: 12, border: "2px solid #C2185B" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ color: "#C2185B", margin: 0 }}><FiTruck style={{ marginRight: 8 }} />Drivers ({users.filter(u => u.role === 'driver' && !u.blocked).length})</h3>
                <button 
                  onClick={() => {
                    setUserModalMode('add');
                    setNewUserData({ email: '', full_name: '', role: 'driver' });
                    setShowUserModal(true);
                  }}
                  style={{ padding: "10px 20px", background: "white", color: "#C2185B", border: "2px solid #C2185B", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}
                >
                  <FiUserPlus style={{ marginRight: 6 }} /> Add Driver
                </button>
              </div>
              <div style={{ maxHeight: 400, overflowY: "auto" }}>
                {users.filter(u => u.role === 'driver').length > 0 ? (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "white", borderBottom: "2px solid #C2185B" }}>
                        <th style={{ padding: 12, textAlign: "left", color: "#C2185B" }}>Name</th>
                        <th style={{ padding: 12, textAlign: "left", color: "#C2185B" }}>Email</th>
                        <th style={{ padding: 12, textAlign: "left", color: "#C2185B" }}>Status</th>
                        <th style={{ padding: 12, textAlign: "left", color: "#C2185B" }}>Joined</th>
                        <th style={{ padding: 12, textAlign: "center", color: "#C2185B" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter(u => u.role === 'driver').map((driver, idx) => (
                        <tr key={driver.id} style={{ borderBottom: "1px solid #C2185B" }}>
                          <td style={{ padding: 12 }}>{driver.full_name || 'N/A'}</td>
                          <td style={{ padding: 12 }}>{driver.email}</td>
                          <td style={{ padding: 12 }}>
                            <span style={{ 
                              padding: "4px 10px", 
                              borderRadius: 12, 
                              fontSize: "0.8em", 
                              fontWeight: "bold",
                              background: 'white',
                              color: '#C2185B',
                              border: '2px solid #C2185B'
                            }}>
                              {driver.blocked ? 'Blocked' : 'Active'}
                            </span>
                          </td>
                          <td style={{ padding: 12, fontSize: "0.9em", color: "#666" }}>
                            {new Date(driver.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td style={{ padding: 12, textAlign: "center" }}>
                            <button
                              onClick={async () => {
                                if (window.confirm(`Are you sure you want to ${driver.blocked ? 'unblock' : 'block'} ${driver.full_name || driver.email}?`)) {
                                  try {
                                    const { error } = await supabase
                                      .from('profiles')
                                      .update({ blocked: !driver.blocked })
                                      .eq('id', driver.id);
                                    if (error) throw error;
                                    showToast?.(`Driver ${driver.blocked ? 'unblocked' : 'blocked'} successfully`, 'success');
                                    loadUsers();
                                  } catch (err) {
                                    showToast?.('Error: ' + err.message, 'error');
                                  }
                                }
                              }}
                              style={{ 
                                padding: "6px 12px", 
                                background: "white", 
                                color: "#C2185B", 
                                border: "2px solid #C2185B", 
                                borderRadius: 6, 
                                cursor: "pointer", 
                                fontSize: "0.85em",
                                marginRight: 8
                              }}
                            >
                              {driver.blocked ? <><FiUserCheck style={{ marginRight: 6 }} /> Unblock</> : <><FiUserX style={{ marginRight: 6 }} /> Block</>}
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm(`Are you sure you want to permanently delete ${driver.full_name || driver.email}? This cannot be undone.`)) {
                                  try {
                                    const { error } = await supabase
                                      .from('profiles')
                                      .delete()
                                      .eq('id', driver.id);
                                    if (error) throw error;
                                    showToast?.('Driver removed successfully', 'success');
                                    loadUsers();
                                  } catch (err) {
                                    showToast?.('Error: ' + err.message, 'error');
                                  }
                                }
                              }}
                              style={{ 
                                padding: "6px 12px", 
                                background: "white", 
                                color: "#C2185B", 
                                border: "2px solid #C2185B", 
                                borderRadius: 6, 
                                cursor: "pointer", 
                                fontSize: "0.85em"
                              }}
                            >
                              <FiTrash2 style={{ marginRight: 6 }} /> Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ textAlign: 'center', color: '#999', padding: 20 }}>No drivers found</p>
                )}
              </div>
            </div>

            {/* Admin Users List */}
            <div style={{ marginTop: 20, background: "white", padding: 25, borderRadius: 12, border: "2px solid #C2185B" }}>
              <h3 style={{ color: "#C2185B", marginTop: 0 }}><FiShield style={{ marginRight: 8 }} />Administrator Accounts ({users.filter(u => u.role === 'admin').length})</h3>
              <div style={{ maxHeight: 300, overflowY: "auto" }}>
                {users.filter(u => u.role === 'admin').length > 0 ? (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "white", borderBottom: "2px solid #C2185B" }}>
                        <th style={{ padding: 12, textAlign: "left", color: "#C2185B" }}>Name</th>
                        <th style={{ padding: 12, textAlign: "left", color: "#C2185B" }}>Email</th>
                        <th style={{ padding: 12, textAlign: "left", color: "#C2185B" }}>Status</th>
                        <th style={{ padding: 12, textAlign: "left", color: "#C2185B" }}>Since</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter(u => u.role === 'admin').map((admin, idx) => (
                        <tr key={admin.id} style={{ borderBottom: "1px solid #C2185B" }}>
                          <td style={{ padding: 12, fontWeight: "bold" }}>{admin.full_name || 'N/A'}</td>
                          <td style={{ padding: 12 }}>{admin.email}</td>
                          <td style={{ padding: 12 }}>
                            <span style={{ 
                              padding: "4px 10px", 
                              borderRadius: 12, 
                              fontSize: "0.8em", 
                              fontWeight: "bold",
                              background: 'white',
                              color: '#C2185B',
                              border: '2px solid #C2185B'
                            }}>
                              Admin
                            </span>
                          </td>
                          <td style={{ padding: 12, fontSize: "0.9em", color: "#666" }}>
                            {new Date(admin.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ textAlign: 'center', color: '#999', padding: 20 }}>No admin accounts found</p>
                )}
              </div>
            </div>

            {/* Add User Modal */}
            {showUserModal && (
              <div style={{ 
                position: "fixed", 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                background: "rgba(0,0,0,0.5)", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                zIndex: 1000
              }}>
                <div style={{ 
                  background: "white", 
                  padding: 30, 
                  borderRadius: 12, 
                  width: "90%", 
                  maxWidth: 500,
                  border: "2px solid #C2185B"
                }}>
                  <h3 style={{ color: "#C2185B", marginTop: 0 }}>
                    {userModalMode === 'add' ? 'Add New ' + (newUserData.role === 'driver' ? 'Driver' : 'User') : 'Edit User'}
                  </h3>
                  <div style={{ marginBottom: 15 }}>
                    <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: "#C2185B" }}>Full Name</label>
                    <input
                      type="text"
                      value={newUserData.full_name}
                      onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                      placeholder="Enter full name"
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B" }}
                    />
                  </div>
                  <div style={{ marginBottom: 15 }}>
                    <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: "#C2185B" }}>Email</label>
                    <input
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                      placeholder="Enter email"
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B" }}
                    />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: "#C2185B" }}>Role</label>
                    <select
                      value={newUserData.role}
                      onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B" }}
                    >
                      <option value="user">Passenger</option>
                      <option value="driver">Driver</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button
                      onClick={() => setShowUserModal(false)}
                      style={{ padding: "10px 20px", background: "white", color: "#C2185B", border: "2px solid #C2185B", borderRadius: 8, cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (!newUserData.email || !newUserData.full_name) {
                          showToast?.('Please fill in all fields', 'error');
                          return;
                        }
                        try {
                          // Generate a temporary password for the user
                          const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + '!1';
                          
                          // Create auth user - this will trigger profile creation automatically
                          const { data: authData, error: signUpError } = await supabase.auth.signUp({
                            email: newUserData.email,
                            password: tempPassword,
                            options: {
                              data: {
                                full_name: newUserData.full_name,
                                role: newUserData.role
                              },
                              emailRedirectTo: window.location.origin
                            }
                          });

                          if (signUpError) throw signUpError;

                          // Check if user was created (some Supabase configs require email confirmation)
                          if (authData?.user) {
                            showToast?.(`${newUserData.role === 'driver' ? 'Driver' : 'User'} added successfully! Password reset email sent to ${newUserData.email}`, 'success');
                            
                            // Send password reset email so user can set their own password
                            const { error: resetError } = await supabase.auth.resetPasswordForEmail(
                              newUserData.email,
                              { redirectTo: window.location.origin + '/reset-password' }
                            );
                            
                            if (resetError) {
                              console.warn('Could not send password reset:', resetError.message);
                            }
                          } else {
                            showToast?.(`${newUserData.role === 'driver' ? 'Driver' : 'User'} created. Check email for verification.`, 'info');
                          }

                          setShowUserModal(false);
                          setNewUserData({ email: '', full_name: '', role: 'user' });
                          
                          // Reload users after a short delay to allow profile creation
                          setTimeout(() => loadUsers(), 1000);
                        } catch (err) {
                          showToast?.('Error: ' + err.message, 'error');
                        }
                      }}
                      style={{ padding: "10px 20px", background: "white", color: "#C2185B", border: "2px solid #C2185B", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}
                    >
                      <FiSave style={{ marginRight: 6 }} /> Add {newUserData.role === 'driver' ? 'Driver' : 'User'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeMenu === "page-management" && (
          <div>
            <div style={{ background: "white", padding: 25, borderRadius: 12, border: "2px solid #C2185B", marginBottom: 20 }}>
              <h3 style={{ color: "#333", marginTop: 0 }}><FiFileText style={{ marginRight: 8 }} />Website Pages</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {pages.map((item) => {
                  const timeAgo = (date) => {
                    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
                    if (seconds < 60) return 'just now';
                    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
                    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
                    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
                    if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;
                    return `${Math.floor(seconds / 2592000)} months ago`;
                  };
                  
                  return (
                    <div key={item.id} style={{ padding: 18, background: "white", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", border: "2px solid #C2185B" }}>
                      <div>
                        <div style={{ fontWeight: "bold", color: "#333", marginBottom: 3 }}>{item.page}</div>
                        <div style={{ fontSize: "0.8em", color: "#666" }}>Last updated: {timeAgo(item.updated)}</div>
                      </div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={{ 
                          padding: "5px 12px", 
                          borderRadius: 15, 
                          fontSize: "0.8em", 
                          fontWeight: "bold",
                          background: 'white',
                          color: '#C2185B',
                          border: '2px solid #C2185B'
                        }}>
                          {item.status}
                        </span>
                        <button 
                          onClick={() => {
                            setEditingPage(item);
                            setShowPageModal(true);
                          }}
                          style={{ padding: "8px 15px", background: "white", color: "#C2185B", border: "2px solid #C2185B", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}
                        >
                          <FiEdit2 style={{ marginRight: 6 }} /> Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: "white", padding: 25, borderRadius: 12, border: "2px solid #C2185B", marginBottom: 20 }}>
              <h3 style={{ color: "#333", marginTop: 0 }}><FiLayers style={{ marginRight: 8 }} />Content Sections</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
                {contentSections.map((section) => (
                  <div key={section.id} style={{ padding: 20, background: "white", borderRadius: 10, border: "2px solid #C2185B" }}>
                    <div style={{ fontSize: "1.1em", fontWeight: "bold", color: "#333", marginBottom: 10, display: "flex", alignItems: "center" }}>
                      {section.id === 'hero' && <FiHome style={{ marginRight: 8 }} />}
                      {section.id === 'features' && <FiTrendingUp style={{ marginRight: 8 }} />}
                      {section.id === 'testimonials' && <FiFileText style={{ marginRight: 8 }} />}
                      {section.id === 'newsletter' && <FiMail style={{ marginRight: 8 }} />}
                      {section.name}
                    </div>
                    <div style={{ fontSize: "0.85em", color: "#666", marginBottom: 15 }}>
                      {section.id === 'hero' && `Title: "${section.title}"`}
                      {section.id === 'features' && `${section.items?.length || 0} features configured`}
                      {section.id === 'testimonials' && `${section.testimonials?.length || 0} testimonials`}
                      {section.id === 'newsletter' && `Heading: "${section.heading}"`}
                    </div>
                    <button 
                      onClick={() => {
                        setEditingContent(section);
                        setShowContentModal(true);
                      }}
                      style={{ padding: "8px 15px", background: "white", color: "#C2185B", border: "2px solid #C2185B", borderRadius: 8, cursor: "pointer" }}
                    >
                      <FiSettings style={{ marginRight: 6 }} /> Configure
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "white", padding: 25, borderRadius: 12, border: "2px solid #C2185B" }}>
              <h3 style={{ color: "#333", marginTop: 0 }}><FiImage style={{ marginRight: 8 }} />Brand Assets</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 15 }}>
                <div style={{ padding: 20, background: "white", borderRadius: 10, textAlign: "center", border: "2px solid #C2185B" }}>
                  {brandAssets.logo ? (
                    <img src={brandAssets.logo.data} alt="Logo" style={{ width: "100%", maxHeight: 80, objectFit: "contain", marginBottom: 10 }} />
                  ) : (
                    <FiImage style={{ fontSize: "3em", marginBottom: 10, color: "#C2185B" }} />
                  )}
                  <div style={{ fontWeight: "bold", color: "#333", marginBottom: 5 }}>Logo</div>
                  <div style={{ fontSize: "0.75em", color: "#999", marginBottom: 8 }}>{brandAssets.logo?.name || 'No file uploaded'}</div>
                  <label style={{ padding: "6px 12px", background: "white", color: "#C2185B", border: "2px solid #C2185B", borderRadius: 6, cursor: "pointer", fontSize: "0.85em", display: "inline-block" }}>
                    <FiUpload style={{ marginRight: 6 }} /> Upload New
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFileUpload(e, 'logo')} />
                  </label>
                </div>
                <div style={{ padding: 20, background: "white", borderRadius: 10, textAlign: "center", border: "2px solid #C2185B" }}>
                  {brandAssets.favicon ? (
                    <img src={brandAssets.favicon.data} alt="Favicon" style={{ width: "100%", maxHeight: 80, objectFit: "contain", marginBottom: 10 }} />
                  ) : (
                    <FiImage style={{ fontSize: "3em", marginBottom: 10, color: "#C2185B" }} />
                  )}
                  <div style={{ fontWeight: "bold", color: "#333", marginBottom: 5 }}>Favicon</div>
                  <div style={{ fontSize: "0.75em", color: "#999", marginBottom: 8 }}>{brandAssets.favicon?.name || 'No file uploaded'}</div>
                  <label style={{ padding: "6px 12px", background: "white", color: "#C2185B", border: "2px solid #C2185B", borderRadius: 6, cursor: "pointer", fontSize: "0.85em", display: "inline-block" }}>
                    <FiUpload style={{ marginRight: 6 }} /> Upload New
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFileUpload(e, 'favicon')} />
                  </label>
                </div>
                <div style={{ padding: 20, background: "white", borderRadius: 10, textAlign: "center", border: "2px solid #C2185B" }}>
                  <FiImage style={{ fontSize: "3em", marginBottom: 10, color: "#C2185B" }} />
                  <div style={{ fontWeight: "bold", color: "#333", marginBottom: 5 }}>Banner Images</div>
                  <div style={{ fontSize: "0.75em", color: "#999", marginBottom: 8 }}>{brandAssets.banners?.length || 0} uploaded</div>
                  <label style={{ padding: "6px 12px", background: "white", color: "#C2185B", border: "2px solid #C2185B", borderRadius: 6, cursor: "pointer", fontSize: "0.85em", display: "inline-block" }}>
                    <FiUpload style={{ marginRight: 6 }} /> Upload New
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFileUpload(e, 'banner')} />
                  </label>
                  {brandAssets.banners && brandAssets.banners.length > 0 && (
                    <div style={{ marginTop: 15, display: "flex", flexDirection: "column", gap: 8 }}>
                      {brandAssets.banners.map((banner) => (
                        <div key={banner.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 8, background: "white", borderRadius: 6, border: "1px solid #C2185B" }}>
                          <span style={{ fontSize: "0.75em", color: "#666" }}>{banner.name}</span>
                          <button 
                            onClick={() => {
                              const newAssets = { ...brandAssets, banners: brandAssets.banners.filter(b => b.id !== banner.id) };
                              setBrandAssets(newAssets);
                              localStorage.setItem('brandAssets', JSON.stringify(newAssets));
                              showToast?.('Banner removed', 'success');
                            }}
                            style={{ padding: "4px 8px", background: "white", color: "#C2185B", border: "1px solid #C2185B", borderRadius: 4, cursor: "pointer", fontSize: "0.7em" }}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Page Edit Modal */}
            {showPageModal && editingPage && (
              <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                <div style={{ background: "white", padding: 30, borderRadius: 12, width: "90%", maxWidth: 700, border: "2px solid #C2185B", maxHeight: "90vh", overflowY: "auto" }}>
                  <h3 style={{ color: "#C2185B", marginTop: 0 }}><FiEdit2 style={{ marginRight: 8 }} />Edit {editingPage.page}</h3>
                  <div style={{ marginBottom: 15 }}>
                    <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: "#C2185B" }}>Page Title</label>
                    <input
                      type="text"
                      value={editingPage.page}
                      onChange={(e) => setEditingPage({ ...editingPage, page: e.target.value })}
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B", color: "#333" }}
                    />
                  </div>
                  <div style={{ marginBottom: 15 }}>
                    <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: "#C2185B" }}>Status</label>
                    <select
                      value={editingPage.status}
                      onChange={(e) => setEditingPage({ ...editingPage, status: e.target.value })}
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B", color: "#333" }}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: "#C2185B" }}>Page Content</label>
                    <textarea
                      value={editingPage.content}
                      onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                      rows={10}
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B", fontFamily: "inherit", color: "#333" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button onClick={() => { setShowPageModal(false); setEditingPage(null); }} style={{ padding: "10px 20px", background: "white", color: "#C2185B", border: "2px solid #C2185B", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
                    <button onClick={savePage} style={{ padding: "10px 20px", background: "white", color: "#C2185B", border: "2px solid #C2185B", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}><FiSave style={{ marginRight: 6 }} /> Save Changes</button>
                  </div>
                </div>
              </div>
            )}

            {/* Content Section Config Modal */}
            {showContentModal && editingContent && (
              <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                <div style={{ background: "white", padding: 30, borderRadius: 12, width: "90%", maxWidth: 700, border: "2px solid #C2185B", maxHeight: "90vh", overflowY: "auto" }}>
                  <h3 style={{ color: "#C2185B", marginTop: 0 }}><FiSettings style={{ marginRight: 8 }} />Configure {editingContent.name}</h3>
                  
                  {editingContent.id === 'hero' && (
                    <>
                      <div style={{ marginBottom: 15 }}>
                        <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: "#C2185B" }}>Hero Title</label>
                        <input type="text" value={editingContent.title} onChange={(e) => setEditingContent({ ...editingContent, title: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B", color: "#333" }} />
                      </div>
                      <div style={{ marginBottom: 15 }}>
                        <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: "#C2185B" }}>Subtitle</label>
                        <input type="text" value={editingContent.subtitle} onChange={(e) => setEditingContent({ ...editingContent, subtitle: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B", color: "#333" }} />
                      </div>
                      <div style={{ marginBottom: 15 }}>
                        <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: "#C2185B" }}>Button Text</label>
                        <input type="text" value={editingContent.buttonText} onChange={(e) => setEditingContent({ ...editingContent, buttonText: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B", color: "#333" }} />
                      </div>
                    </>
                  )}
                  
                  {editingContent.id === 'features' && (
                    <div style={{ marginBottom: 15 }}>
                      <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: "#C2185B" }}>Feature Items (one per line)</label>
                      <textarea
                        value={editingContent.items?.join('\n') || ''}
                        onChange={(e) => setEditingContent({ ...editingContent, items: e.target.value.split('\n').filter(i => i.trim()) })}
                        rows={6}
                        style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B", fontFamily: "inherit", color: "#333" }}
                      />
                    </div>
                  )}
                  
                  {editingContent.id === 'newsletter' && (
                    <>
                      <div style={{ marginBottom: 15 }}>
                        <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: "#C2185B" }}>Heading</label>
                        <input type="text" value={editingContent.heading} onChange={(e) => setEditingContent({ ...editingContent, heading: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B", color: "#333" }} />
                      </div>
                      <div style={{ marginBottom: 15 }}>
                        <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: "#C2185B" }}>Description</label>
                        <textarea value={editingContent.description} onChange={(e) => setEditingContent({ ...editingContent, description: e.target.value })} rows={4} style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B", fontFamily: "inherit", color: "#333" }} />
                      </div>
                    </>
                  )}
                  
                  {editingContent.id === 'testimonials' && (
                    <div style={{ marginBottom: 15 }}>
                      <label style={{ display: "block", marginBottom: 10, fontWeight: "bold", color: "#C2185B" }}>Customer Testimonials</label>
                      <p style={{ fontSize: "0.85em", color: "#666", marginBottom: 15 }}>
                        Manage featured customer testimonials displayed on the website.
                      </p>
                      
                      {editingContent.testimonials && editingContent.testimonials.length > 0 ? (
                        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                          {editingContent.testimonials.map((testimonial, index) => (
                            <div key={testimonial.id} style={{ 
                              padding: 15, 
                              background: "#f8f9fa", 
                              borderRadius: 8, 
                              border: "2px solid #C2185B",
                              marginBottom: 12
                            }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 10 }}>
                                <div>
                                  <div style={{ fontWeight: "bold", color: "#C2185B" }}>{testimonial.name}</div>
                                  <div style={{ fontSize: "0.85em", color: "#666", display: "flex", alignItems: "center", gap: 6 }}>
                                    {testimonial.location} • {[...Array(testimonial.rating)].map((_, i) => <FiStar key={i} />)}
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    const updated = { 
                                      ...editingContent, 
                                      testimonials: editingContent.testimonials.filter(t => t.id !== testimonial.id) 
                                    };
                                    setEditingContent(updated);
                                  }}
                                  style={{ 
                                    padding: "4px 8px", 
                                    background: "white", 
                                    color: "#C2185B", 
                                    border: "1px solid #C2185B", 
                                    borderRadius: 4, 
                                    cursor: "pointer",
                                    fontSize: "0.8em"
                                  }}
                                >
                                  <FiTrash2 />
                                </button>
                              </div>
                              <div style={{ fontSize: "0.9em", color: "#555", fontStyle: "italic", marginBottom: 5 }}>
                                "{testimonial.comment}"
                              </div>
                              <div style={{ fontSize: "0.75em", color: "#999" }}>
                                {new Date(testimonial.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ padding: 20, textAlign: "center", color: "#999", background: "#f8f9fa", borderRadius: 8, border: "1px dashed #ccc" }}>
                          No testimonials added yet
                        </div>
                      )}
                      
                      <div style={{ marginTop: 15, padding: 12, background: "#e8f5e9", borderRadius: 8, fontSize: "0.85em", color: "#2e7d32", display: "flex", alignItems: "center", gap: 8 }}>
                        <FiInfo /> Tip: High-quality testimonials with 4-5 star ratings are automatically featured. You can also add custom testimonials here by integrating with the reviews system.
                      </div>
                    </div>
                  )}
                  
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button onClick={() => { setShowContentModal(false); setEditingContent(null); }} style={{ padding: "10px 20px", background: "white", color: "#C2185B", border: "2px solid #C2185B", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
                    <button onClick={saveContentSection} style={{ padding: "10px 20px", background: "white", color: "#C2185B", border: "2px solid #C2185B", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}><FiSave style={{ marginRight: 6 }} /> Save Configuration</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeMenu === "portfolio-management" && (
          <div>
            <div style={{ background: "white", padding: 25, borderRadius: 12, border: "2px solid #C2185B", marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
                <h3 style={{ color: "#C2185B", margin: 0 }}>Bus Fleet Overview</h3>
                <button 
                  onClick={() => {
                    setNewBusData({ bus_number: '', capacity: 60, status: 'active' });
                    setShowAddBusModal(true);
                  }}
                  style={{ padding: "10px 20px", background: "white", color: "#C2185B", border: "2px solid #C2185B", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}
                >
                  <FiPlus style={{ marginRight: 6 }} /> Add New Bus
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 15, marginBottom: 20 }}>
                <div style={{ padding: 20, background: "white", color: "#C2185B", borderRadius: 12, textAlign: "center", border: "2px solid #C2185B" }}>
                  <div style={{ fontSize: "2.5em", fontWeight: "bold" }}>{buses.length}</div>
                  <div>Total Buses</div>
                </div>
                <div style={{ padding: 20, background: "white", color: "#C2185B", borderRadius: 12, textAlign: "center", border: "2px solid #C2185B" }}>
                  <div style={{ fontSize: "2.5em", fontWeight: "bold" }}>{[...new Set(tickets.map(t => `${t.departure}-${t.destination}`))].length}</div>
                  <div>Active Routes</div>
                </div>
                <div style={{ padding: 20, background: "white", color: "#C2185B", borderRadius: 12, textAlign: "center", border: "2px solid #C2185B" }}>
                  <div style={{ fontSize: "2.5em", fontWeight: "bold" }}>{buses.filter(b => b.status === 'maintenance' || b.status === 'inactive').length}</div>
                  <div>In Maintenance</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 15 }}>
                {buses.length > 0 ? buses.map((bus) => {
                  const busTickets = tickets.filter(t => t.bus_id === bus.id);
                  const route = busTickets.length > 0 ? `${busTickets[0].departure} - ${busTickets[0].destination}` : 'No active route';
                  const isActive = bus.status === 'active';
                  
                  return (
                    <div key={bus.id} style={{ 
                      padding: 18, 
                      background: "white", 
                      borderRadius: 10, 
                      border: "2px solid #C2185B" 
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <div style={{ fontWeight: "bold", color: "#C2185B", fontSize: "1.1em" }}>{bus.bus_number}</div>
                        <span style={{ 
                          padding: "4px 10px", 
                          borderRadius: 12, 
                          fontSize: "0.75em", 
                          fontWeight: "bold",
                          background: "white",
                          color: "#C2185B",
                          border: "2px solid #C2185B"
                        }}>
                          {bus.status?.charAt(0).toUpperCase() + bus.status?.slice(1) || 'Active'}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.85em", color: "#666", marginBottom: 5 }}>
                        <strong>Capacity:</strong> {bus.capacity || 60} seats
                      </div>
                      <div style={{ fontSize: "0.85em", color: "#666", marginBottom: 5 }}>
                        <strong>Tickets Sold:</strong> {busTickets.length}
                      </div>
                      <div style={{ fontSize: "0.85em", color: "#666" }}>
                        <strong>Route:</strong> {route}
                      </div>
                    </div>
                  );
                }) : (
                  <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 30, color: "#999" }}>
                    No buses found. Click "Add New Bus" to get started.
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div style={{ background: "white", padding: 25, borderRadius: 12, border: "2px solid #C2185B" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
                  <h3 style={{ color: "#C2185B", margin: 0 }}><FiTool style={{ marginRight: 8 }} />Maintenance Schedule</h3>
                  <button 
                    onClick={() => {
                      setEditingMaintenance({ id: null, bus_number: '', type: '', date: new Date().toISOString().split('T')[0], status: 'Scheduled', notes: '' });
                      setShowMaintenanceModal(true);
                    }}
                    style={{ padding: "8px 15px", background: "white", color: "#C2185B", border: "2px solid #C2185B", borderRadius: 8, cursor: "pointer", fontSize: "0.85em", fontWeight: "bold" }}
                  >
                    <FiPlus style={{ marginRight: 6 }} /> Add
                  </button>
                </div>
                {maintenanceSchedule.length > 0 ? maintenanceSchedule.map((item) => (
                  <div key={item.id} style={{ padding: 15, marginBottom: 10, background: "white", borderRadius: 8, border: "2px solid #C2185B" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontWeight: "bold", color: "#C2185B" }}>{item.bus_number}</span>
                      <span style={{ 
                        fontSize: "0.75em", 
                        padding: "3px 8px", 
                        borderRadius: 10, 
                        background: "white",
                        color: "#C2185B",
                        border: "1px solid #C2185B",
                        fontWeight: "bold"
                      }}>
                        {item.status}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.85em", color: "#666", marginBottom: 3 }}>{item.type}</div>
                    <div style={{ fontSize: "0.8em", color: "#999", marginBottom: 8 }}>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button 
                        onClick={() => {
                          setEditingMaintenance(item);
                          setShowMaintenanceModal(true);
                        }}
                        style={{ padding: "4px 10px", background: "white", color: "#C2185B", border: "1px solid #C2185B", borderRadius: 6, cursor: "pointer", fontSize: "0.75em" }}
                      >
                        <FiEdit2 style={{ marginRight: 6 }} /> Edit
                      </button>
                      <button 
                        onClick={() => deleteMaintenance(item.id)}
                        style={{ padding: "4px 10px", background: "white", color: "#C2185B", border: "1px solid #C2185B", borderRadius: 6, cursor: "pointer", fontSize: "0.75em" }}
                      >
                        <FiTrash2 style={{ marginRight: 6 }} /> Delete
                      </button>
                    </div>
                  </div>
                )) : (
                  <p style={{ textAlign: "center", color: "#999", padding: 20 }}>No maintenance scheduled</p>
                )}
              </div>

              <div style={{ background: "white", padding: 25, borderRadius: 12, border: "2px solid #C2185B" }}>
                <h3 style={{ color: "#C2185B", marginTop: 0 }}><FiTrendingUp style={{ marginRight: 8 }} />Performance Metrics</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                  <div style={{ padding: 15, background: "white", borderRadius: 8, border: "2px solid #C2185B" }}>
                    <div style={{ fontSize: "0.9em", color: "#666", marginBottom: 5 }}>Average Utilization</div>
                    <div style={{ fontSize: "2em", fontWeight: "bold", color: "#C2185B" }}>{getPerformanceMetrics().utilization}%</div>
                    <div style={{ fontSize: "0.75em", color: "#999", marginTop: 5 }}>Based on tickets sold vs capacity</div>
                  </div>
                  <div style={{ padding: 15, background: "white", borderRadius: 8, border: "2px solid #C2185B" }}>
                    <div style={{ fontSize: "0.9em", color: "#666", marginBottom: 5 }}>On-Time Performance</div>
                    <div style={{ fontSize: "2em", fontWeight: "bold", color: "#C2185B" }}>{getPerformanceMetrics().onTime}%</div>
                    <div style={{ fontSize: "0.75em", color: "#999", marginTop: 5 }}>Successful ticket completions</div>
                  </div>
                  <div style={{ padding: 15, background: "white", borderRadius: 8, border: "2px solid #C2185B" }}>
                    <div style={{ fontSize: "0.9em", color: "#666", marginBottom: 5 }}>Fleet Availability</div>
                    <div style={{ fontSize: "2em", fontWeight: "bold", color: "#C2185B" }}>{getPerformanceMetrics().availability}%</div>
                    <div style={{ fontSize: "0.75em", color: "#999", marginTop: 5 }}>{buses.filter(b => b.status === 'active').length} of {buses.length} buses active</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Add Bus Modal */}
            {showAddBusModal && (
              <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                <div style={{ background: "white", padding: 30, borderRadius: 12, width: "90%", maxWidth: 600, border: "2px solid #C2185B" }}>
                  <h3 style={{ color: "#C2185B", marginTop: 0 }}>Add New Bus</h3>
                  <div style={{ marginBottom: 15 }}>
                    <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: "#C2185B" }}>Bus Number *</label>
                    <input
                      type="text"
                      value={newBusData.bus_number}
                      onChange={(e) => setNewBusData({ ...newBusData, bus_number: e.target.value })}
                      placeholder="e.g., SD 007 MN"
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B" }}
                    />
                  </div>
                  <div style={{ marginBottom: 15 }}>
                    <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: "#C2185B" }}>Capacity *</label>
                    <input
                      type="number"
                      value={newBusData.capacity}
                      onChange={(e) => setNewBusData({ ...newBusData, capacity: parseInt(e.target.value) || 0 })}
                      min="1"
                      max="100"
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B" }}
                    />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: "#C2185B" }}>Status</label>
                    <select
                      value={newBusData.status}
                      onChange={(e) => setNewBusData({ ...newBusData, status: e.target.value })}
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B" }}
                    >
                      <option value="active">Active</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button onClick={() => { setShowAddBusModal(false); setNewBusData({ bus_number: '', capacity: 60, status: 'active' }); }} style={{ padding: "10px 20px", background: "white", color: "#C2185B", border: "2px solid #C2185B", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
                    <button onClick={addNewBus} style={{ padding: "10px 20px", background: "white", color: "#C2185B", border: "2px solid #C2185B", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}><FiSave style={{ marginRight: 6 }} /> Add Bus</button>
                  </div>
                </div>
              </div>
            )}

            {/* Maintenance Modal */}
            {showMaintenanceModal && editingMaintenance && (
              <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                <div style={{ background: "white", padding: 30, borderRadius: 12, width: "90%", maxWidth: 600, border: "2px solid #C2185B" }}>
                  <h3 style={{ color: "#C2185B", marginTop: 0 }}><FiTool style={{ marginRight: 8 }} />{editingMaintenance.id ? 'Edit' : 'Add'} Maintenance Record</h3>
                  <div style={{ marginBottom: 15 }}>
                    <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: "#C2185B" }}>Bus Number</label>
                    <select
                      value={editingMaintenance.bus_number}
                      onChange={(e) => setEditingMaintenance({ ...editingMaintenance, bus_number: e.target.value })}
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B" }}
                    >
                      <option value="">Select a bus</option>
                      {buses.map(bus => (
                        <option key={bus.id} value={bus.bus_number}>{bus.bus_number}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ marginBottom: 15 }}>
                    <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: "#C2185B" }}>Maintenance Type</label>
                    <input
                      type="text"
                      value={editingMaintenance.type}
                      onChange={(e) => setEditingMaintenance({ ...editingMaintenance, type: e.target.value })}
                      placeholder="e.g., Engine Service, Tire Replacement"
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B" }}
                    />
                  </div>
                  <div style={{ marginBottom: 15 }}>
                    <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: "#C2185B" }}>Date</label>
                    <input
                      type="date"
                      value={editingMaintenance.date}
                      onChange={(e) => setEditingMaintenance({ ...editingMaintenance, date: e.target.value })}
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B" }}
                    />
                  </div>
                  <div style={{ marginBottom: 15 }}>
                    <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: "#C2185B" }}>Status</label>
                    <select
                      value={editingMaintenance.status}
                      onChange={(e) => setEditingMaintenance({ ...editingMaintenance, status: e.target.value })}
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B" }}
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: "#C2185B" }}>Notes</label>
                    <textarea
                      value={editingMaintenance.notes}
                      onChange={(e) => setEditingMaintenance({ ...editingMaintenance, notes: e.target.value })}
                      rows={3}
                      placeholder="Additional notes..."
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B", fontFamily: "inherit" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button onClick={() => { setShowMaintenanceModal(false); setEditingMaintenance(null); }} style={{ padding: "10px 20px", background: "white", color: "#C2185B", border: "2px solid #C2185B", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
                    <button onClick={saveMaintenance} style={{ padding: "10px 20px", background: "white", color: "#C2185B", border: "2px solid #C2185B", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}><FiSave style={{ marginRight: 6 }} /> Save</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeMenu === "service-management" && (
          <div>
            <div style={{ background: "white", padding: 25, borderRadius: 12, border: "3px solid #C2185B", marginBottom: 20 }}>
              <h3 style={{ color: "#C2185B", marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}><FiMap /> Route Management</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {routes.length > 0 ? routes.map((route) => (
                  <div key={route.id} style={{ 
                    padding: 18, 
                    background: route.active ? '#E8F5E9' : '#FFEBEE', 
                    borderRadius: 10, 
                    border: `3px solid ${route.active ? '#4CAF50' : '#F44336'}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "1.1em", fontWeight: "bold", color: "#C2185B", marginBottom: 8 }}>
                        {route.from} → {route.to}
                      </div>
                      <div style={{ display: "flex", gap: 20, fontSize: "0.85em", color: "#666" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><FiMapPin /> {route.distance}</span>
                        <span>{route.fare}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><FiClock /> Every {route.frequency}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ 
                        padding: "6px 15px", 
                        borderRadius: 15, 
                        fontSize: "0.8em", 
                        fontWeight: "bold",
                        background: route.active ? '#4CAF50' : '#F44336',
                        color: 'white'
                      }}>
                        {route.active ? 'Active' : 'Inactive'}
                      </span>
                      <button 
                        onClick={() => {
                          setEditingRoute(route);
                          setShowRouteModal(true);
                        }}
                        style={{ padding: "8px 15px", background: "#2196F3", color: "white", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                      >
                        <FiEdit /> Edit
                      </button>
                      <button 
                        onClick={() => deleteRoute(route.id)}
                        style={{ padding: "8px 15px", background: "#F44336", color: "white", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                )) : (
                  <p style={{ textAlign: "center", color: "#999", padding: 20 }}>No routes configured. Add your first route below.</p>
                )}
              </div>
              <button 
                onClick={() => {
                  setEditingRoute({ id: null, from: '', to: '', distance: '', fare: '', frequency: '', active: true });
                  setShowRouteModal(true);
                }}
                style={{ marginTop: 15, padding: "12px 24px", background: "#C2185B", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", width: "100%" }}
              >
                + Add New Route
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div style={{ background: "white", padding: 25, borderRadius: 12, border: "3px solid #C2185B" }}>
                <h3 style={{ color: "#C2185B", marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}><FiClock /> Service Hours</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {serviceHours.map((schedule) => (
                    <div key={schedule.id} style={{ padding: 15, background: "#FFE4F0", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: "bold", color: "#C2185B" }}>{schedule.day}</span>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={{ color: "#4CAF50", fontWeight: "500" }}>{schedule.hours}</span>
                        <button 
                          onClick={() => {
                            setEditingServiceHours(schedule);
                            setShowServiceHoursModal(true);
                          }}
                          style={{ padding: "6px 12px", background: "#2196F3", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.8em", display: "flex", alignItems: "center", gap: 4 }}
                        >
                          <FiEdit /> Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: "white", padding: 25, borderRadius: 12, border: "3px solid #C2185B" }}>
                <h3 style={{ color: "#C2185B", marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}><FiAlertTriangle /> Service Alerts</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {serviceAlerts.length > 0 ? serviceAlerts.slice(0, 5).map((alert) => {
                    const alertStyles = {
                      warning: { bg: '#FFF3E0', border: '#FF9800', color: '#FF9800', icon: <FiAlertTriangle /> },
                      info: { bg: '#E3F2FD', border: '#2196F3', color: '#2196F3', icon: <FiAlertCircle /> },
                      success: { bg: '#E8F5E9', border: '#4CAF50', color: '#4CAF50', icon: <FiCheckCircle /> },
                      danger: { bg: '#FFEBEE', border: '#F44336', color: '#F44336', icon: <FiXCircle /> }
                    };
                    const style = alertStyles[alert.type] || alertStyles.info;
                    const timeAgo = new Date(alert.created_at).toLocaleString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    });
                    
                    return (
                      <div key={alert.id} style={{ padding: 15, background: style.bg, borderRadius: 8, borderLeft: `4px solid ${style.border}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 5 }}>
                          <div style={{ fontWeight: "bold", color: style.color }}>{style.icon} {alert.title}</div>
                          <button 
                            onClick={() => deleteServiceAlert(alert.id)}
                            style={{ padding: "3px 8px", background: "#F44336", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "0.7em" }}
                          >
                            ×
                          </button>
                        </div>
                        <div style={{ fontSize: "0.85em", color: "#666", marginBottom: 5 }}>{alert.message}</div>
                        <div style={{ fontSize: "0.75em", color: "#999", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><FiUser /> {alert.reported_by || 'Driver'}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><FiCalendar /> {timeAgo}</span>
                        </div>
                      </div>
                    );
                  }) : (
                    <div style={{ padding: 15, background: "#E8F5E9", borderRadius: 8, borderLeft: "4px solid #4CAF50", textAlign: "center" }}>
                      <div style={{ fontWeight: "bold", color: "#4CAF50", marginBottom: 5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><FiCheckCircle /> All Systems Normal</div>
                      <div style={{ fontSize: "0.85em", color: "#666" }}>No active service alerts</div>
                    </div>
                  )}
                </div>
                {serviceAlerts.length > 5 && (
                  <div style={{ marginTop: 10, textAlign: "center", color: "#999", fontSize: "0.85em" }}>
                    +{serviceAlerts.length - 5} more alerts
                  </div>
                )}
              </div>
            </div>

            <div style={{ background: "white", padding: 25, borderRadius: 12, border: "3px solid #C2185B" }}>
              <h3 style={{ color: "#C2185B", marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}><FiBarChart2 /> Service Quality Metrics</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 15 }}>
                <div style={{ padding: 20, background: "linear-gradient(135deg, #E8F5E9, #FFF)", borderRadius: 10, border: "2px solid #4CAF50", textAlign: "center" }}>
                  <div style={{ fontSize: "2.5em", fontWeight: "bold", color: "#4CAF50" }}>{getServiceQualityMetrics().onTimePerformance}%</div>
                  <div style={{ fontSize: "0.9em", color: "#666" }}>On-Time Performance</div>
                  <div style={{ fontSize: "0.75em", color: "#999", marginTop: 5 }}>Based on ticket usage</div>
                </div>
                <div style={{ padding: 20, background: "linear-gradient(135deg, #E3F2FD, #FFF)", borderRadius: 10, border: "2px solid #2196F3", textAlign: "center" }}>
                  <div style={{ fontSize: "2.5em", fontWeight: "bold", color: "#2196F3" }}>{getServiceQualityMetrics().serviceReliability}%</div>
                  <div style={{ fontSize: "0.9em", color: "#666" }}>Service Reliability</div>
                  <div style={{ fontSize: "0.75em", color: "#999", marginTop: 5 }}>Active tickets ratio</div>
                </div>
                <div style={{ padding: 20, background: "#FFF", borderRadius: 10, border: "2px solid #C2185B", textAlign: "center" }}>
                  <div style={{ fontSize: "2.5em", fontWeight: "bold", color: "#C2185B" }}>{getServiceQualityMetrics().avgRating}</div>
                  <div style={{ fontSize: "0.9em", color: "#666" }}>Avg Customer Rating</div>
                  <div style={{ fontSize: "0.75em", color: "#999", marginTop: 5 }}>From {reviews.length} reviews</div>
                </div>
                <div style={{ padding: 20, background: "linear-gradient(135deg, #FFF3E0, #FFF)", borderRadius: 10, border: "2px solid #FF9800", textAlign: "center" }}>
                  <div style={{ fontSize: "2.5em", fontWeight: "bold", color: "#FF9800" }}>{getServiceQualityMetrics().activeRoutesCount}</div>
                  <div style={{ fontSize: "0.9em", color: "#666" }}>Active Routes</div>
                  <div style={{ fontSize: "0.75em", color: "#999", marginTop: 5 }}>Unique destinations</div>
                </div>
              </div>
            </div>

            {/* Route Modal */}
            {showRouteModal && editingRoute && (
              <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                <div style={{ background: "white", padding: 30, borderRadius: 12, width: "90%", maxWidth: 600, border: "3px solid #C2185B", maxHeight: "90vh", overflow: "auto" }}>
                  <h3 style={{ color: "#C2185B", marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}><FiMapPin /> {editingRoute.id ? 'Edit' : 'Add'} Route</h3>
                  <div style={{ marginBottom: 15 }}>
                    <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: "#C2185B" }}>From (Departure) *</label>
                    <input
                      type="text"
                      value={editingRoute.from}
                      onChange={(e) => setEditingRoute({ ...editingRoute, from: e.target.value })}
                      placeholder="e.g., Mbabane"
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B" }}
                    />
                  </div>
                  <div style={{ marginBottom: 15 }}>
                    <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: "#C2185B" }}>To (Destination) *</label>
                    <input
                      type="text"
                      value={editingRoute.to}
                      onChange={(e) => setEditingRoute({ ...editingRoute, to: e.target.value })}
                      placeholder="e.g., Manzini"
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B" }}
                    />
                  </div>
                  <div style={{ marginBottom: 15 }}>
                    <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: "#C2185B" }}>Distance</label>
                    <input
                      type="text"
                      value={editingRoute.distance}
                      onChange={(e) => setEditingRoute({ ...editingRoute, distance: e.target.value })}
                      placeholder="e.g., 45 km"
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B" }}
                    />
                  </div>
                  <div style={{ marginBottom: 15 }}>
                    <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: "#C2185B" }}>Fare</label>
                    <input
                      type="text"
                      value={editingRoute.fare}
                      onChange={(e) => setEditingRoute({ ...editingRoute, fare: e.target.value })}
                      placeholder="e.g., E35"
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B" }}
                    />
                  </div>
                  <div style={{ marginBottom: 15 }}>
                    <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: "#C2185B" }}>Frequency</label>
                    <input
                      type="text"
                      value={editingRoute.frequency}
                      onChange={(e) => setEditingRoute({ ...editingRoute, frequency: e.target.value })}
                      placeholder="e.g., 30 min"
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B" }}
                    />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={editingRoute.active}
                        onChange={(e) => setEditingRoute({ ...editingRoute, active: e.target.checked })}
                        style={{ width: 20, height: 20, cursor: "pointer" }}
                      />
                      <span style={{ fontWeight: "bold", color: "#C2185B" }}>Active Route</span>
                    </label>
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button onClick={() => { setShowRouteModal(false); setEditingRoute(null); }} style={{ padding: "10px 20px", background: "#999", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
                    <button onClick={saveRoute} style={{ padding: "10px 20px", background: "#4CAF50", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: 6 }}><FiSave /> Save Route</button>
                  </div>
                </div>
              </div>
            )}

            {/* Service Hours Modal */}
            {showServiceHoursModal && editingServiceHours && (
              <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                <div style={{ background: "white", padding: 30, borderRadius: 12, width: "90%", maxWidth: 500, border: "3px solid #C2185B" }}>
                  <h3 style={{ color: "#C2185B", marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}><FiClock /> Edit Service Hours</h3>
                  <div style={{ marginBottom: 15 }}>
                    <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: "#C2185B" }}>Day/Period</label>
                    <input
                      type="text"
                      value={editingServiceHours.day}
                      onChange={(e) => setEditingServiceHours({ ...editingServiceHours, day: e.target.value })}
                      placeholder="e.g., Monday - Friday"
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B" }}
                    />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: "#C2185B" }}>Hours</label>
                    <input
                      type="text"
                      value={editingServiceHours.hours}
                      onChange={(e) => setEditingServiceHours({ ...editingServiceHours, hours: e.target.value })}
                      placeholder="e.g., 5:00 AM - 10:00 PM"
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button onClick={() => { setShowServiceHoursModal(false); setEditingServiceHours(null); }} style={{ padding: "10px 20px", background: "#999", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
                    <button onClick={saveServiceHours} style={{ padding: "10px 20px", background: "#4CAF50", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: 6 }}><FiSave /> Save</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeMenu === "enquiry-management" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 15, marginBottom: 20 }}>
              <div style={{ padding: 20, background: "linear-gradient(135deg, #2196F3, #64B5F6)", color: "white", borderRadius: 12, textAlign: "center" }}>
                <div style={{ fontSize: "2.5em", fontWeight: "bold" }}>{enquiries.length}</div>
                <div>Total Enquiries</div>
              </div>
              <div style={{ padding: 20, background: "linear-gradient(135deg, #FF9800, #FFB74D)", color: "white", borderRadius: 12, textAlign: "center" }}>
                <div style={{ fontSize: "2.5em", fontWeight: "bold" }}>{enquiries.filter(e => e.status === 'pending').length}</div>
                <div>Pending</div>
              </div>
              <div style={{ padding: 20, background: "linear-gradient(135deg, #4CAF50, #81C784)", color: "white", borderRadius: 12, textAlign: "center" }}>
                <div style={{ fontSize: "2.5em", fontWeight: "bold" }}>{enquiries.filter(e => e.status === 'responded').length}</div>
                <div>Responded</div>
              </div>
              <div style={{ padding: 20, background: "linear-gradient(135deg, #C2185B, #C2185B)", color: "white", borderRadius: 12, textAlign: "center" }}>
                <div style={{ fontSize: "2.5em", fontWeight: "bold" }}>{reviews.length}</div>
                <div>Total Reviews</div>
              </div>
            </div>

            <div style={{ background: "white", padding: 25, borderRadius: 12, border: "3px solid #C2185B", marginBottom: 20 }}>
              <h3 style={{ color: "#C2185B", marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}><FiMessageSquare /> Customer Enquiries</h3>
              {enquiries.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {enquiries.slice(0, 10).map((enquiry) => {
                    const isPending = enquiry.status === 'pending';
                    
                    return (
                      <div key={enquiry.id} style={{ 
                        padding: 18, 
                        background: isPending ? '#FFF3E0' : '#E8F5E9', 
                        borderRadius: 10, 
                        border: `2px solid ${isPending ? '#FF9800' : '#4CAF50'}` 
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: "bold", color: "#C2185B", fontSize: "1.05em", marginBottom: 5 }}>
                              {enquiry.subject}
                            </div>
                            <div style={{ fontSize: "0.85em", color: "#666", marginBottom: 8 }}>
                              <span style={{ fontWeight: "500" }}>{enquiry.name}</span> • {enquiry.email}
                            </div>
                            <div style={{ fontSize: "0.9em", color: "#333", marginBottom: 8 }}>
                              {enquiry.message}
                            </div>
                            {enquiry.response && (
                              <div style={{ marginTop: 10, padding: 10, background: "rgba(76, 175, 80, 0.1)", borderRadius: 6, borderLeft: "3px solid #4CAF50" }}>
                                <div style={{ fontSize: "0.8em", fontWeight: "bold", color: "#4CAF50", marginBottom: 3, display: "flex", alignItems: "center", gap: 4 }}><FiCheck /> Admin Response:</div>
                                <div style={{ fontSize: "0.85em", color: "#333" }}>{enquiry.response}</div>
                                <div style={{ fontSize: "0.75em", color: "#999", marginTop: 5 }}>Responded: {new Date(enquiry.responded_at).toLocaleString()}</div>
                              </div>
                            )}
                            <div style={{ fontSize: "0.8em", color: "#999", marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}><FiCalendar /> {new Date(enquiry.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                            <span style={{ 
                              padding: "4px 10px", 
                              borderRadius: 12, 
                              fontSize: "0.75em", 
                              fontWeight: "bold",
                              background: isPending ? '#FF9800' : '#4CAF50',
                              color: 'white'
                            }}>
                              {isPending ? 'Pending' : 'Responded'}
                            </span>
                            {isPending && (
                              <button 
                                onClick={() => {
                                  setRespondingEnquiry(enquiry);
                                  setResponseText('');
                                  setShowResponseModal(true);
                                }}
                                style={{ padding: "6px 12px", background: "#2196F3", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.8em", display: "flex", alignItems: "center", gap: 4 }}
                              >
                                <FiMail /> Respond
                              </button>
                            )}
                            <button 
                              onClick={() => deleteEnquiry(enquiry.id)}
                              style={{ padding: "6px 12px", background: "#F44336", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.8em", display: "flex", alignItems: "center", gap: 4 }}
                            >
                              <FiTrash2 /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#999', padding: 20 }}>No enquiries yet</p>
              )}
            </div>

            <div style={{ background: "white", padding: 25, borderRadius: 12, border: "3px solid #C2185B", marginBottom: 20 }}>
              <h3 style={{ color: "#C2185B", marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}><FiMail /> Recent Customer Feedback</h3>
              {reviews.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {reviews.slice(0, 6).map((review, idx) => {
                    const priority = review.rating <= 2 ? 'High' : review.rating === 3 ? 'Medium' : 'Low';
                    const status = review.rating >= 4 ? 'Resolved' : review.rating === 3 ? 'In Progress' : 'Pending';
                    
                    return (
                      <div key={review.id} style={{ 
                        padding: 18, 
                        background: status === 'Pending' ? '#FFF3E0' : status === 'In Progress' ? '#E3F2FD' : '#E8F5E9', 
                        borderRadius: 10, 
                        border: `2px solid ${status === 'Pending' ? '#FF9800' : status === 'In Progress' ? '#2196F3' : '#4CAF50'}` 
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: "bold", color: "#C2185B", fontSize: "1.05em", marginBottom: 3, display: "flex", alignItems: "center", gap: 4 }}>
                              {[...Array(review.rating)].map((_, i) => <FiStar key={i} />)} {review.rating}-Star Review
                            </div>
                            <div style={{ fontSize: "0.85em", color: "#666", marginBottom: 5 }}>
                              <span style={{ fontWeight: "500" }}>{review.profiles?.full_name || 'Anonymous'}</span> • {review.profiles?.email || 'N/A'}
                            </div>
                            <div style={{ fontSize: "0.9em", color: "#333", marginTop: 8, fontStyle: "italic" }}>
                              "{review.comment || 'No comment provided'}"
                            </div>
                            <div style={{ fontSize: "0.8em", color: "#999", marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}><FiCalendar /> {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ 
                              padding: "4px 10px", 
                              borderRadius: 12, 
                              fontSize: "0.75em", 
                              fontWeight: "bold",
                              background: priority === 'High' ? '#F44336' : priority === 'Medium' ? '#FF9800' : '#4CAF50',
                              color: 'white'
                            }}>
                              {priority}
                            </span>
                            <span style={{ 
                              padding: "4px 10px", 
                              borderRadius: 12, 
                              fontSize: "0.75em", 
                              fontWeight: "bold",
                              background: status === 'Pending' ? '#FF9800' : status === 'In Progress' ? '#2196F3' : '#4CAF50',
                              color: 'white'
                            }}>
                              {status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#999', padding: 20 }}>No reviews yet</p>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ background: "white", padding: 25, borderRadius: 12, border: "3px solid #C2185B" }}>
                <h3 style={{ color: "#C2185B", marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}><FiBarChart2 /> Feedback Categories</h3>
                {reviews.length > 0 ? (
                  [
                    { rating: 5, label: '5 Stars - Excellent', color: '#4CAF50' },
                    { rating: 4, label: '4 Stars - Good', color: '#8BC34A' },
                    { rating: 3, label: '3 Stars - Average', color: '#FF9800' },
                    { rating: 2, label: '2 Stars - Poor', color: '#FF5722' },
                    { rating: 1, label: '1 Star - Very Poor', color: '#F44336' }
                  ].map((cat) => {
                    const count = reviews.filter(r => r.rating === cat.rating).length;
                    const percentage = (count / reviews.length * 100).toFixed(1);
                    
                    return (
                      <div key={cat.rating} style={{ marginBottom: 15 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ fontWeight: "500" }}>{cat.label}</span>
                          <span style={{ fontWeight: "bold", color: cat.color }}>{count} ({percentage}%)</span>
                        </div>
                        <div style={{ width: "100%", height: 20, background: "#f0f0f0", borderRadius: 10, overflow: "hidden" }}>
                          <div style={{ width: `${percentage}%`, height: "100%", background: cat.color }}></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ textAlign: 'center', color: '#999' }}>No reviews to analyze</p>
                )}
              </div>

              <div style={{ background: "white", padding: 25, borderRadius: 12, border: "3px solid #C2185B" }}>
                <h3 style={{ color: "#C2185B", marginTop: 0 }}>⏱️ Response Insights</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                  <div style={{ padding: 20, background: "linear-gradient(135deg, #E8F5E9, #FFF)", borderRadius: 10, border: "2px solid #4CAF50", textAlign: "center" }}>
                    <div style={{ fontSize: "2.5em", fontWeight: "bold", color: "#4CAF50" }}>{reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0.0'}</div>
                    <div style={{ fontSize: "0.9em", color: "#666" }}>Average Rating</div>
                  </div>
                  <div style={{ padding: 15, background: "#FFE4F0", borderRadius: 8 }}>
                    <div style={{ fontSize: "0.85em", color: "#666", marginBottom: 8 }}>Customer Satisfaction</div>
                    <div style={{ width: "100%", height: 30, background: "#f0f0f0", borderRadius: 15, overflow: "hidden" }}>
                      <div style={{ width: `${reviews.length > 0 ? ((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100).toFixed(0) : 0}%`, height: "100%", background: "#4CAF50", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.85em", fontWeight: "bold" }}>
                        {reviews.length > 0 ? ((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100).toFixed(0) : 0}%
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: 15, background: "#E3F2FD", borderRadius: 8 }}>
                    <div style={{ fontSize: "0.85em", color: "#666", marginBottom: 8 }}>Reviews with Comments</div>
                    <div style={{ width: "100%", height: 30, background: "#f0f0f0", borderRadius: 15, overflow: "hidden" }}>
                      <div style={{ width: `${reviews.length > 0 ? ((reviews.filter(r => r.comment && r.comment.trim() !== '').length / reviews.length) * 100).toFixed(0) : 0}%`, height: "100%", background: "#2196F3", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.85em", fontWeight: "bold" }}>
                        {reviews.length > 0 ? ((reviews.filter(r => r.comment && r.comment.trim() !== '').length / reviews.length) * 100).toFixed(0) : 0}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Response Modal */}
            {showResponseModal && respondingEnquiry && (
              <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                <div style={{ background: "white", padding: 30, borderRadius: 12, width: "90%", maxWidth: 600, border: "3px solid #C2185B" }}>
                  <h3 style={{ color: "#C2185B", marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}><FiMail /> Respond to Enquiry</h3>
                  <div style={{ marginBottom: 15, padding: 15, background: "#f5f5f5", borderRadius: 8 }}>
                    <div style={{ fontWeight: "bold", marginBottom: 5 }}>{respondingEnquiry.subject}</div>
                    <div style={{ fontSize: "0.85em", color: "#666", marginBottom: 8 }}>From: {respondingEnquiry.name} ({respondingEnquiry.email})</div>
                    <div style={{ fontSize: "0.9em", color: "#333" }}>{respondingEnquiry.message}</div>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", color: "#C2185B" }}>Your Response: *</label>
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Type your response here..."
                      rows={5}
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #C2185B", fontFamily: "inherit", resize: "vertical" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button onClick={() => { setShowResponseModal(false); setRespondingEnquiry(null); setResponseText(''); }} style={{ padding: "10px 20px", background: "#999", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
                    <button onClick={respondToEnquiry} style={{ padding: "10px 20px", background: "#4CAF50", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: 6 }}><FiSend /> Send Response</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Shuttle Bookings Management */}
        {activeMenu === "shuttle-bookings" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 15, marginBottom: 20 }}>
              <div style={{ padding: 20, background: "linear-gradient(135deg, #FF9800, #FFB74D)", color: "white", borderRadius: 12, textAlign: "center", boxShadow: "0 4px 8px rgba(0,0,0,0.2)" }}>
                <div style={{ fontSize: "2.5em", fontWeight: "bold" }}>{shuttleBookings.length}</div>
                <div>Total Requests</div>
              </div>
              <div style={{ padding: 20, background: "linear-gradient(135deg, #FFC107, #FFD54F)", color: "white", borderRadius: 12, textAlign: "center", boxShadow: "0 4px 8px rgba(0,0,0,0.2)" }}>
                <div style={{ fontSize: "2.5em", fontWeight: "bold" }}>{shuttleBookings.filter(b => b.status === 'pending').length}</div>
                <div>Pending</div>
              </div>
              <div style={{ padding: 20, background: "linear-gradient(135deg, #4CAF50, #81C784)", color: "white", borderRadius: 12, textAlign: "center", boxShadow: "0 4px 8px rgba(0,0,0,0.2)" }}>
                <div style={{ fontSize: "2.5em", fontWeight: "bold" }}>{shuttleBookings.filter(b => b.status === 'confirmed').length}</div>
                <div>Confirmed</div>
              </div>
              <div style={{ padding: 20, background: "linear-gradient(135deg, #F44336, #E57373)", color: "white", borderRadius: 12, textAlign: "center", boxShadow: "0 4px 8px rgba(0,0,0,0.2)" }}>
                <div style={{ fontSize: "2.5em", fontWeight: "bold" }}>{shuttleBookings.filter(b => b.status === 'rejected').length}</div>
                <div>Rejected</div>
              </div>
            </div>

            <div style={{ background: darkMode ? "#2C2C2C" : "white", padding: 25, borderRadius: 12, border: darkMode ? "3px solid rgba(194, 24, 91, 0.5)" : "3px solid #FFB6D9", boxShadow: darkMode ? "0 4px 6px rgba(0, 0, 0, 0.3)" : "0 4px 6px rgba(255, 105, 180, 0.2)" }}>
              <h3 style={{ color: darkMode ? "#E0E0E0" : "#C2185B", marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <FiTruck /> Shuttle Booking Requests
              </h3>
              
              {loadingShuttleBookings ? (
                <div style={{ textAlign: "center", padding: 40, color: darkMode ? "#B0B0B0" : "#666" }}>
                  <div style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</div>
                  <p>Loading shuttle bookings...</p>
                </div>
              ) : shuttleBookings.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                  {shuttleBookings.map((booking) => {
                    const isPending = booking.status === 'pending';
                    const isConfirmed = booking.status === 'confirmed';
                    const isRejected = booking.status === 'rejected';
                    
                    return (
                      <div key={booking.id} style={{ 
                        padding: 20, 
                        background: isPending ? (darkMode ? "rgba(255, 193, 7, 0.1)" : '#FFF8E1') : 
                                    isConfirmed ? (darkMode ? "rgba(76, 175, 80, 0.1)" : '#F1F8E9') : 
                                    (darkMode ? "rgba(244, 67, 54, 0.1)" : '#FFEBEE'), 
                        borderRadius: 12, 
                        border: `2px solid ${isPending ? '#FFC107' : isConfirmed ? '#4CAF50' : '#F44336'}`,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 15 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                              <div style={{ fontSize: "1.2em", fontWeight: "bold", color: darkMode ? "#E0E0E0" : "#333" }}>
                                🚐 {booking.full_name}
                              </div>
                              <span style={{ 
                                padding: "4px 12px", 
                                borderRadius: 12, 
                                fontSize: "0.75em", 
                                fontWeight: "bold",
                                background: isPending ? '#FFC107' : isConfirmed ? '#4CAF50' : '#F44336',
                                color: 'white',
                                textTransform: "uppercase"
                              }}>
                                {booking.status}
                              </span>
                              <span style={{ 
                                padding: "4px 12px", 
                                borderRadius: 12, 
                                fontSize: "0.75em", 
                                fontWeight: "bold",
                                background: booking.trip_type === 'return' ? '#2196F3' : '#9C27B0',
                                color: 'white',
                                textTransform: "uppercase"
                              }}>
                                {booking.trip_type === 'return' ? '↔️ Return' : '➡️ One-Way'}
                              </span>
                            </div>
                            
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginTop: 12, fontSize: "0.9em", color: darkMode ? "#B0B0B0" : "#666" }}>
                              <div><strong style={{ color: darkMode ? "#E0E0E0" : "#333" }}>📧 Email:</strong> {booking.email}</div>
                              <div><strong style={{ color: darkMode ? "#E0E0E0" : "#333" }}>📱 Phone:</strong> {booking.phone}</div>
                              <div><strong style={{ color: darkMode ? "#E0E0E0" : "#333" }}>📍 From:</strong> {booking.departure}</div>
                              <div><strong style={{ color: darkMode ? "#E0E0E0" : "#333" }}>📍 To:</strong> {booking.destination}</div>
                              <div><strong style={{ color: darkMode ? "#E0E0E0" : "#333" }}>📅 Outbound:</strong> {new Date(booking.outbound_date).toLocaleDateString()}</div>
                              {booking.return_date && (
                                <div><strong style={{ color: darkMode ? "#E0E0E0" : "#333" }}>🔄 Return:</strong> {new Date(booking.return_date).toLocaleDateString()}</div>
                              )}
                              <div><strong style={{ color: darkMode ? "#E0E0E0" : "#333" }}>👥 Passengers:</strong> {booking.passengers}</div>
                              <div><strong style={{ color: darkMode ? "#E0E0E0" : "#333" }}>📆 Requested:</strong> {new Date(booking.created_at).toLocaleDateString()}</div>
                            </div>
                            
                            {booking.admin_response && (
                              <div style={{ marginTop: 15, padding: 12, background: darkMode ? "rgba(194, 24, 91, 0.15)" : "rgba(194, 24, 91, 0.05)", borderRadius: 8, borderLeft: `4px solid ${isConfirmed ? '#4CAF50' : '#F44336'}` }}>
                                <div style={{ fontSize: "0.85em", fontWeight: "bold", color: isConfirmed ? '#4CAF50' : '#F44336', marginBottom: 5, display: "flex", alignItems: "center", gap: 4 }}>
                                  <FiCheck /> Admin Response:
                                </div>
                                <div style={{ fontSize: "0.9em", color: darkMode ? "#E0E0E0" : "#333" }}>{booking.admin_response}</div>
                                {booking.responded_at && (
                                  <div style={{ fontSize: "0.75em", color: darkMode ? "#999" : "#999", marginTop: 5 }}>
                                    Responded: {new Date(booking.responded_at).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginLeft: 15 }}>
                            {isPending && (
                              <button 
                                onClick={() => {
                                  setSelectedShuttleBooking(booking);
                                  setShuttleResponse({ admin_response: "", status: "confirmed" });
                                  setShowShuttleModal(true);
                                }}
                                style={{ padding: "8px 16px", background: "#4CAF50", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: "0.85em", fontWeight: "bold", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
                              >
                                <FiCheck /> Respond
                              </button>
                            )}
                            <button 
                              onClick={() => deleteShuttleBooking(booking.id)}
                              style={{ padding: "8px 16px", background: "#F44336", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: "0.85em", fontWeight: "bold", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
                            >
                              <FiTrash2 /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: darkMode ? '#999' : '#999', padding: 40 }}>
                  <div style={{ fontSize: "3em", marginBottom: 10 }}>🚐</div>
                  <p>No shuttle booking requests yet</p>
                </div>
              )}
            </div>
            
            {/* Response Modal */}
            {showShuttleModal && selectedShuttleBooking && (
              <div style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(0, 0, 0, 0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999
              }}>
                <div style={{
                  background: darkMode ? "#2C2C2C" : "white",
                  padding: 30,
                  borderRadius: 12,
                  maxWidth: "600px",
                  width: "90%",
                  maxHeight: "80vh",
                  overflowY: "auto",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                  border: darkMode ? "3px solid rgba(194, 24, 91, 0.5)" : "3px solid #C2185B"
                }}>
                  <h3 style={{ color: darkMode ? "#E0E0E0" : "#C2185B", marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
                    <FiTruck /> Respond to Shuttle Booking
                  </h3>
                  
                  <div style={{ marginBottom: 20, padding: 15, background: darkMode ? "rgba(194, 24, 91, 0.1)" : "#FDF3F7", borderRadius: 8, border: darkMode ? "1px solid rgba(194, 24, 91, 0.3)" : "1px solid #FFB6D9" }}>
                    <div style={{ fontWeight: "bold", color: darkMode ? "#E0E0E0" : "#C2185B", marginBottom: 8 }}>Booking Details:</div>
                    <div style={{ fontSize: "0.9em", color: darkMode ? "#B0B0B0" : "#333" }}>
                      <div><strong>Customer:</strong> {selectedShuttleBooking.full_name}</div>
                      <div><strong>Email:</strong> {selectedShuttleBooking.email}</div>
                      <div><strong>Phone:</strong> {selectedShuttleBooking.phone}</div>
                      <div><strong>Route:</strong> {selectedShuttleBooking.departure} → {selectedShuttleBooking.destination}</div>
                      <div><strong>Trip Type:</strong> {selectedShuttleBooking.trip_type === 'return' ? 'Return' : 'One-Way'}</div>
                      <div><strong>Date:</strong> {new Date(selectedShuttleBooking.outbound_date).toLocaleDateString()}</div>
                      {selectedShuttleBooking.return_date && (
                        <div><strong>Return Date:</strong> {new Date(selectedShuttleBooking.return_date).toLocaleDateString()}</div>
                      )}
                      <div><strong>Passengers:</strong> {selectedShuttleBooking.passengers}</div>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: "bold", color: darkMode ? "#E0E0E0" : "#C2185B" }}>Response Status: *</label>
                    <select
                      value={shuttleResponse.status}
                      onChange={(e) => setShuttleResponse({ ...shuttleResponse, status: e.target.value })}
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: darkMode ? "2px solid rgba(194, 24, 91, 0.5)" : "2px solid #C2185B", fontFamily: "inherit", background: darkMode ? "#1C1C1C" : "white", color: darkMode ? "#E0E0E0" : "#333" }}
                    >
                      <option value="confirmed">✅ Confirmed - Available</option>
                      <option value="rejected">❌ Rejected - Not Available</option>
                    </select>
                  </div>
                  
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: "bold", color: darkMode ? "#E0E0E0" : "#C2185B" }}>
                      Your Message: *
                      <span style={{ fontSize: "0.8em", fontWeight: "normal", color: darkMode ? "#999" : "#666", display: "block", marginTop: 4 }}>
                        {shuttleResponse.status === 'confirmed' 
                          ? 'Include payment details, pickup location, and any other important information.' 
                          : 'Explain why the shuttle is not available and suggest alternative dates if possible.'}
                      </span>
                    </label>
                    <textarea
                      value={shuttleResponse.admin_response}
                      onChange={(e) => setShuttleResponse({ ...shuttleResponse, admin_response: e.target.value })}
                      placeholder={shuttleResponse.status === 'confirmed' 
                        ? "Dear [Customer],\n\nThank you for your shuttle booking request! We're pleased to confirm availability for your trip.\n\nPayment Details:\n- Amount: E XXX\n- Payment Method: [Bank Transfer/Cash/MTN MoMo]\n- Account: [Details]\n\nPickup Details:\n- Location: [Address]\n- Time: [Time]\n\nPlease complete payment within 24 hours to secure your booking.\n\nBest regards,\nEswatini Transport"
                        : "Dear [Customer],\n\nThank you for your interest. Unfortunately, we don't have availability for your requested dates.\n\nAlternative Options:\n- [Alternative dates]\n- [Alternative routes]\n\nPlease let us know if any of these work for you.\n\nBest regards,\nEswatini Transport"}
                      rows={12}
                      style={{ width: "100%", padding: 12, borderRadius: 8, border: darkMode ? "2px solid rgba(194, 24, 91, 0.5)" : "2px solid #C2185B", fontFamily: "inherit", resize: "vertical", background: darkMode ? "#1C1C1C" : "white", color: darkMode ? "#E0E0E0" : "#333" }}
                    />
                  </div>
                  
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button 
                      onClick={() => { 
                        setShowShuttleModal(false); 
                        setSelectedShuttleBooking(null); 
                        setShuttleResponse({ admin_response: "", status: "confirmed" }); 
                      }} 
                      style={{ padding: "10px 20px", background: "#999", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={respondToShuttleBooking} 
                      style={{ padding: "10px 20px", background: shuttleResponse.status === 'confirmed' ? '#4CAF50' : '#FF9800', color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <FiSend /> Send Response via Email
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
