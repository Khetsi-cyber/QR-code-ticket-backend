import React, { useState, useEffect, useRef } from "react";
import { client } from "../api";

const POLL_INTERVAL_MS = 5000;   // check status every 5 s
const MAX_POLL_ATTEMPTS = 24;    // give up after 2 minutes
const MAX_CONSECUTIVE_STATUS_ERRORS = 3;

export default function PaymentModal({
  isOpen,
  onClose,
  bookingData,
  onPaymentSuccess,
  showToast,
}) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [stage, setStage] = useState("form"); // "form" | "pending" | "success" | "failed"
  const [errorMsg, setErrorMsg] = useState("");
  const [referenceId, setReferenceId] = useState(null);

  const pollIntervalRef = useRef(null);
  const pollCountRef = useRef(0);
  const statusErrorCountRef = useRef(0);

  // Clear polling on unmount or when modal closes
  useEffect(() => {
    return () => stopPolling();
  }, []);

  if (!isOpen || !bookingData) return null;

  function stopPolling() {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    pollCountRef.current = 0;
    statusErrorCountRef.current = 0;
  }

  function handleClose() {
    stopPolling();
    setStage("form");
    setPhoneNumber("");
    setErrorMsg("");
    setReferenceId(null);
    onClose();
  }

  async function checkStatus(refId) {
    try {
      const res = await client.get(`/api/payments/status/${refId}`);
      const status = (res.data?.payment?.status || "").toUpperCase();
      const reason = res.data?.payment?.reason;
      statusErrorCountRef.current = 0;

      if (status === "SUCCESSFUL") {
        stopPolling();
        setStage("success");
        showToast?.("Payment confirmed!", "success");
        // Give the user a moment to see the success message then complete
        setTimeout(() => onPaymentSuccess(refId), 1500);
      } else if (["FAILED", "REJECTED", "TIMEOUT", "EXPIRED", "CANCELLED"].includes(status)) {
        stopPolling();
        setStage("failed");
        setErrorMsg(reason || `Payment ${status.toLowerCase()}. Please try again.`);
        showToast?.("Payment failed.", "error");
      }
    } catch (err) {
      statusErrorCountRef.current += 1;

      // If status endpoint keeps failing, stop endless spinner and surface the issue.
      if (statusErrorCountRef.current >= MAX_CONSECUTIVE_STATUS_ERRORS) {
        stopPolling();
        setStage("failed");
        const msg = err?.message || "Could not verify payment status. Please try again.";
        setErrorMsg(msg);
        showToast?.(msg, "error");
      }
    }
  }

  function startPolling(refId) {
    pollCountRef.current = 0;
    pollIntervalRef.current = setInterval(async () => {
      pollCountRef.current += 1;

      if (pollCountRef.current >= MAX_POLL_ATTEMPTS) {
        stopPolling();
        setStage("failed");
        setErrorMsg("Payment timed out. Please check your phone and try again.");
        showToast?.("Payment timed out.", "error");
        return;
      }

      await checkStatus(refId);
    }, POLL_INTERVAL_MS);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!phoneNumber.trim()) {
      setErrorMsg("Please enter your MTN MoMo phone number.");
      return;
    }

    setStage("pending");

    try {
      const res = await client.post("/api/payments/initiate", {
        userId: bookingData.userId,
        busId: bookingData.busId,
        departure: bookingData.departure,
        destination: bookingData.destination,
        fare: bookingData.fare,
        phoneNumber: phoneNumber.trim(),
        customerName: bookingData.customerName,
        seatNumber: bookingData.seatNumbers,
      });

      if (!res.data?.success) {
        throw new Error(res.data?.error || "Payment initiation failed.");
      }

      const refId = res.data?.referenceId || res.data?.paymentReferenceId;
      if (!refId) {
        throw new Error("Payment started but no reference ID was returned.");
      }

      setReferenceId(refId);
      startPolling(refId);
    } catch (err) {
      setStage("failed");
      const msg = err.message || "Payment initiation failed. Please try again.";
      setErrorMsg(msg);
      showToast?.(msg, "error");
    }
  }

  function handleRetry() {
    stopPolling();
    setStage("form");
    setErrorMsg("");
    setReferenceId(null);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => {
        // Only close on backdrop click if not mid-payment
        if (e.target === e.currentTarget && stage !== "pending") handleClose();
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "2rem",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>MTN MoMo Payment</h2>
          {stage !== "pending" && (
            <button
              onClick={handleClose}
              style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#666" }}
              aria-label="Close"
            >
              &times;
            </button>
          )}
        </div>

        {/* Booking summary */}
        <div
          style={{
            background: "#f8f9fa",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1.5rem",
            fontSize: "0.9rem",
          }}
        >
          <p style={{ margin: "0 0 4px" }}><strong>Route:</strong> {bookingData.departure} → {bookingData.destination}</p>
          <p style={{ margin: "0 0 4px" }}><strong>Seats:</strong> {bookingData.seatNumbers?.join(", ")}</p>
          <p style={{ margin: 0 }}><strong>Total:</strong> SZL {bookingData.fare}</p>
        </div>

        {/* FORM stage */}
        {stage === "form" && (
          <form onSubmit={handleSubmit}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
              MTN MoMo Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. 76123456"
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "1rem",
                marginBottom: "0.75rem",
                boxSizing: "border-box",
              }}
              autoFocus
            />
            {errorMsg && (
              <p style={{ color: "#dc3545", fontSize: "0.9rem", margin: "0 0 0.75rem" }}>{errorMsg}</p>
            )}
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "0.875rem",
                background: "#ffcc00",
                color: "#000",
                border: "none",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "1rem",
                cursor: "pointer",
              }}
            >
              Pay SZL {bookingData.fare}
            </button>
          </form>
        )}

        {/* PENDING stage */}
        {stage === "pending" && (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                border: "5px solid #f0f0f0",
                borderTop: "5px solid #ffcc00",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 1rem",
              }}
            />
            <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Waiting for payment approval…</p>
            <p style={{ color: "#666", fontSize: "0.9rem" }}>
              A payment prompt has been sent to <strong>{phoneNumber}</strong>.<br />
              Please approve it on your phone.
            </p>
          </div>
        )}

        {/* SUCCESS stage */}
        {stage === "success" && (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>✅</div>
            <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "#28a745" }}>Payment Successful!</p>
            <p style={{ color: "#666", fontSize: "0.9rem" }}>Creating your ticket…</p>
          </div>
        )}

        {/* FAILED stage */}
        {stage === "failed" && (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>❌</div>
            <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "#dc3545" }}>Payment Failed</p>
            {errorMsg && (
              <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1rem" }}>{errorMsg}</p>
            )}
            <button
              onClick={handleRetry}
              style={{
                padding: "0.75rem 2rem",
                background: "#ffcc00",
                border: "none",
                borderRadius: "8px",
                fontWeight: 700,
                cursor: "pointer",
                marginRight: "0.5rem",
              }}
            >
              Try Again
            </button>
            <button
              onClick={handleClose}
              style={{
                padding: "0.75rem 2rem",
                background: "#e9ecef",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
