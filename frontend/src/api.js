import axios from "axios";

// Default to same-origin so CRA proxy (or relative requests) will work in dev.
// Set `REACT_APP_API_BASE` to an absolute URL in production or when needed.
const API_BASE = process.env.REACT_APP_API_BASE || "";

const DEBUG_API = process.env.REACT_APP_DEBUG_API === "true" || localStorage.getItem("DEBUG_API") === "1";
const AUTO_WORKAROUNDS = process.env.REACT_APP_AUTO_WORKAROUNDS === "true" || localStorage.getItem("AUTO_WORKAROUNDS") === "1";

const instance = axios.create({
  baseURL: API_BASE || undefined,
  headers: {
    "Content-Type": "application/json",
  },
});

function emitDebug(detail) {
  if (!DEBUG_API) return;
  try {
    if (typeof window !== "undefined" && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent("api:debug", { detail }));
    }
  } catch (e) {
    // ignore
    console.warn("Failed to emit api:debug event", e);
  }
}

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  emitDebug({ type: "request", url: config.url, method: config.method, data: config.data });
  return config;
});

// Log responses and normalize errors for easier debugging during development
instance.interceptors.response.use(
  (resp) => {
    emitDebug({ type: "response", url: resp.config?.url, method: resp.config?.method, status: resp.status, data: resp.data });
    return resp;
  },
  (error) => {
    // Attach normalized info to the error and log to console
    const status = error.response?.status;
    const data = error.response?.data;
    console.error("API request failed", { status, data, url: error.config?.url, method: error.config?.method });
    emitDebug({ type: "error", url: error.config?.url, method: error.config?.method, status, data, message: error.message });
    // add helpful message when server returns non-standard payloads
    if (data && typeof data === "object") {
      error.normalized = { status, data };
      const maybeMsg = data.message || data.error || data.msg || JSON.stringify(data);
      error.message = `${status || "ERR"} - ${maybeMsg}`;
    } else if (status) {
      error.normalized = { status, data };
      error.message = `${status} - ${error.message}`;
    }
    // If we receive a 401 from the API, remove stored auth and redirect to login.
    // This avoids leaving the app in a broken state when the token is invalid/expired.
    try {
      if (status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Avoid interfering with login requests and make redirect non-blocking
        if (typeof window !== "undefined") {
          const current = window.location.pathname;
          if (!current.startsWith('/login')) {
            // Add a small delay so any UI updates can finish
            setTimeout(() => { window.location.href = '/login?expired=1'; }, 200);
          }
        }
      }
    } catch (e) {
      // swallow any errors during cleanup
      console.warn('Error handling 401 redirect', e);
    }
    return Promise.reject(error);
  }
);

// Expose the instance for direct calls and export default convenience API
export const client = instance;

export default {
  login: (payload) => instance.post("/api/auth/login", payload),
  createTicket: (payload) => instance.post("/api/tickets", payload),
  listTickets: (params) => instance.get("/api/tickets", { params }),
  verifyTicket: (payload) => instance.post("/api/tickets/verify", payload),
  recordScan: (payload) => instance.post("/api/tickets/scan", payload),
  DEBUG_API,
  AUTO_WORKAROUNDS,
};

