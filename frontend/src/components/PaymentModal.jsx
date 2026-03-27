/**
 * Payment Modal Component
 * Handles MTN MoMo payment processing for bus tickets
 */

import React, { useState, useEffect } from 'react';
import { FiX, FiLoader, FiCheckCircle, FiXCircle, FiPhone, FiDollarSign } from 'react-icons/fi';
import axios from 'axios';

// Detect Codespace environment and construct proper URL
const getPaymentAPIUrl = () => {
  // Check if we're in a GitHub Codespace
  const hostname = window.location.hostname;
  
  if (hostname.includes('app.github.dev') || hostname.includes('preview.app.github.dev')) {
    // In Codespaces, use the same hostname but change port to 3001
    const baseUrl = hostname.replace('-3000', '-3001');
    return `https://${baseUrl}/api/payments`;
  }
  
  // Use environment variable or fallback to localhost
  return process.env.REACT_APP_PAYMENT_API_URL || 'http://localhost:3001/api/payments';
};

const PAYMENT_API_URL = getPaymentAPIUrl();

console.log('Payment API URL detected:', PAYMENT_API_URL);

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  bookingData, 
  onPaymentSuccess,
  showToast 
}) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, pending, checking, successful, failed
  const [paymentReference, setPaymentReference] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Auto-check payment status when pending
  useEffect(() => {
    if (paymentStatus === 'pending' && paymentReference) {
      const checkStatus = async () => {
        try {
          const response = await axios.get(`${PAYMENT_API_URL}/status/${paymentReference}`);
          const status = response.data.payment.status;

          if (status === 'SUCCESSFUL') {
            setPaymentStatus('successful');
            // Create ticket
            await completeTicketCreation();
          } else if (status === 'FAILED') {
            setPaymentStatus('failed');
            setErrorMessage('Payment was declined or cancelled');
          }
        } catch (error) {
          console.error('Status check error:', error);
        }
      };

      // Check immediately, then every 3 seconds
      checkStatus();
      const interval = setInterval(checkStatus, 3000);

      // Timeout after 2 minutes
      const timeout = setTimeout(() => {
        if (paymentStatus === 'pending') {
          setPaymentStatus('failed');
          setErrorMessage('Payment timeout. Please try again.');
        }
      }, 120000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [paymentStatus, paymentReference]);

  // Countdown timer
  useEffect(() => {
    if (paymentStatus === 'pending' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, paymentStatus]);

  const formatPhoneNumber = (phone) => {
    // Remove all non-digits (but keep + for test numbers)
    let cleaned = phone.replace(/\s+/g, '');
    
    // Check if it's an MTN sandbox test number (e.g., 46733123450)
    if (/^\+?467[0-9]{8}$/.test(cleaned)) {
      // Keep test numbers as-is, remove + if present
      return cleaned.replace(/^\+/, '');
    }
    
    // Handle Eswatini numbers
    cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('268')) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // Add Eswatini prefix
    return `268${cleaned}`;
  };

  const validatePhoneNumber = (phone) => {
    const cleaned = phone.replace(/\s+/g, '');
    
    // Allow MTN sandbox test numbers (467XXXXXXXX)
    if (/^\+?467[0-9]{8}$/.test(cleaned)) {
      return true;
    }
    
    // Eswatini phone numbers: 7XXXXXXX (8 digits starting with 7)
    const digitsOnly = cleaned.replace(/\D/g, '');
    return /^(268|0)?7[0-9]{7}$/.test(digitsOnly);
  };

  const initiatePayment = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setErrorMessage('Please enter a valid phone number. Eswatini: 76001234 or MTN Test: 46733123450');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      console.log('Payment API URL:', PAYMENT_API_URL);
      console.log('Sending payment request with data:', {
        userId: bookingData.userId,
        busId: bookingData.busId,
        departure: bookingData.departure,
        destination: bookingData.destination,
        fare: bookingData.fare,
        phoneNumber: formatPhoneNumber(phoneNumber)
      });

      const response = await axios.post(`${PAYMENT_API_URL}/initiate`, {
        userId: bookingData.userId,
        busId: bookingData.busId,
        departure: bookingData.departure,
        destination: bookingData.destination,
        fare: bookingData.fare,
        phoneNumber: formatPhoneNumber(phoneNumber),
        customerName: bookingData.customerName || 'Bus Passenger',
        seatNumber: Array.isArray(bookingData.seatNumbers) 
          ? bookingData.seatNumbers.join(', ') 
          : bookingData.seatNumber
      });

      console.log('Payment response:', response.data);

      if (response.data.success) {
        setPaymentReference(response.data.paymentReferenceId);
        setPaymentStatus('pending');
        setCountdown(120); // 2 minutes
        showToast?.('Payment request sent to your phone. Please approve.', 'info');
      } else {
        throw new Error(response.data.error || 'Payment initiation failed');
      }
    } catch (error) {
      console.error('Payment error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code
      });
      
      let errorMsg = 'Failed to initiate payment';
      
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        errorMsg = `Cannot connect to payment server. Please ensure:\n1. Payment server is running on port 3001\n2. Browser can access http://localhost:3001\n3. CORS is enabled`;
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
      setPaymentStatus('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const completeTicketCreation = async () => {
    try {
      // Just notify success with the payment reference
      // The parent component (UserDashboard) will handle ticket creation
      showToast?.('✓ Payment successful! Creating your ticket...', 'success');
      onPaymentSuccess?.(paymentReference);
    } catch (error) {
      console.error('Ticket creation error:', error);
      setErrorMessage('Payment successful but ticket creation failed. Please contact support with reference: ' + paymentReference);
    }
  };

  const handleClose = () => {
    if (paymentStatus === 'pending') {
      if (!window.confirm('Payment is in progress. Are you sure you want to close?')) {
        return;
      }
    }
    onClose();
  };

  const resetPayment = () => {
    setPaymentStatus('idle');
    setPaymentReference(null);
    setErrorMessage('');
    setCountdown(0);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: 30,
        maxWidth: 500,
        width: '90%',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: 15,
            right: 15,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.5em',
            color: '#999'
          }}
        >
          <FiX />
        </button>

        {/* Header */}
        <h2 style={{ color: '#C2185B', marginTop: 0, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <FiDollarSign /> Payment
        </h2>

        {/* Booking Summary */}
        <div style={{
          background: '#f5f5f5',
          padding: 15,
          borderRadius: 8,
          marginBottom: 20
        }}>
          <div style={{ marginBottom: 8 }}>
            <strong>Route:</strong> {bookingData.departure} → {bookingData.destination}
          </div>
          {bookingData.busName && (
            <div style={{ marginBottom: 8 }}>
              <strong>Bus:</strong> {bookingData.busName}
            </div>
          )}
          <div style={{ marginBottom: 8 }}>
            <strong>Seats:</strong> {Array.isArray(bookingData.seatNumbers) 
              ? bookingData.seatNumbers.join(', ') 
              : bookingData.seatNumber || 'Any'}
          </div>
          {bookingData.totalPassengers && (
            <div style={{ marginBottom: 8 }}>
              <strong>Passengers:</strong> {bookingData.numAdults} Adult(s){bookingData.numChildren > 0 && `, ${bookingData.numChildren} Child(ren)`}
            </div>
          )}
          <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#C2185B' }}>
            Total Amount: E{bookingData.fare.toFixed(2)}
          </div>
        </div>

        {/* Payment Form - Idle State */}
        {paymentStatus === 'idle' && (
          <>
            <div style={{ marginBottom: 15 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#333' }}>
                <FiPhone style={{ marginRight: 5 }} />
                MTN MoMo Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="7600 1234"
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  border: '2px solid #ddd',
                  fontSize: '1em'
                }}
                disabled={isProcessing}
              />
              <div style={{ fontSize: '0.85em', color: '#666', marginTop: 5 }}>
                Enter your MTN Mobile Money number
              </div>
            </div>

            {errorMessage && (
              <div style={{
                background: '#ffebee',
                color: '#c62828',
                padding: 12,
                borderRadius: 8,
                marginBottom: 15,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <FiXCircle />
                {errorMessage}
              </div>
            )}

            <button
              onClick={initiatePayment}
              disabled={isProcessing || !phoneNumber}
              style={{
                width: '100%',
                padding: 15,
                background: isProcessing || !phoneNumber ? '#ccc' : '#C2185B',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: '1.1em',
                fontWeight: 'bold',
                cursor: isProcessing || !phoneNumber ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10
              }}
            >
              {isProcessing ? (
                <>
                  <FiLoader style={{ animation: 'spin 1s linear infinite' }} />
                  Processing...
                </>
              ) : (
                'Pay with MTN MoMo'
              )}
            </button>
          </>
        )}

        {/* Payment Pending State */}
        {paymentStatus === 'pending' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '4em',
              color: '#FFA500',
              marginBottom: 20,
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              <FiLoader style={{ animation: 'spin 2s linear infinite' }} />
            </div>
            <h3 style={{ color: '#333', marginBottom: 10 }}>Waiting for Payment Approval</h3>
            <p style={{ color: '#666', marginBottom: 15 }}>
              Please check your phone and approve the payment request from MTN MoMo.
            </p>
            <div style={{
              background: '#fff9c4',
              padding: 15,
              borderRadius: 8,
              marginBottom: 15
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: 5 }}>
                Phone Number: {phoneNumber}
              </div>
              <div style={{ fontSize: '0.9em', color: '#666' }}>
                Amount: E{bookingData.fare.toFixed(2)}
              </div>
            </div>
            {countdown > 0 && (
              <div style={{ fontSize: '0.9em', color: '#999' }}>
                Time remaining: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
              </div>
            )}
          </div>
        )}

        {/* Payment Successful State */}
        {paymentStatus === 'successful' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4em', color: '#4CAF50', marginBottom: 20 }}>
              <FiCheckCircle />
            </div>
            <h3 style={{ color: '#4CAF50', marginBottom: 10 }}>Payment Successful!</h3>
            <p style={{ color: '#666' }}>
              Your ticket has been created successfully.
            </p>
            <div style={{
              background: '#e8f5e9',
              padding: 15,
              borderRadius: 8,
              marginTop: 15,
              fontSize: '0.9em',
              color: '#2e7d32'
            }}>
              Reference: {paymentReference}
            </div>
          </div>
        )}

        {/* Payment Failed State */}
        {paymentStatus === 'failed' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4em', color: '#F44336', marginBottom: 20 }}>
              <FiXCircle />
            </div>
            <h3 style={{ color: '#F44336', marginBottom: 10 }}>Payment Failed</h3>
            <p style={{ color: '#666', marginBottom: 15 }}>
              {errorMessage || 'The payment could not be completed.'}
            </p>
            <button
              onClick={resetPayment}
              style={{
                width: '100%',
                padding: 12,
                background: '#C2185B',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
