/**
 * MTN MoMo Payment Service
 * Handles payment integration for bus ticket purchases
 * Using MTN MoMo Collection API (Sandbox)
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MTN MoMo Configuration
const MOMO_CONFIG = {
  baseUrl: process.env.MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com',
  subscriptionKey: process.env.MOMO_SUBSCRIPTION_KEY,
  apiUser: process.env.MOMO_API_USER,
  apiKey: process.env.MOMO_API_KEY,
  environment: process.env.MOMO_ENVIRONMENT || 'sandbox',
  currency: process.env.MOMO_CURRENCY || 'SZL', // Swazi Lilangeni
  callbackUrl: process.env.MOMO_CALLBACK_URL
};

// Supabase Configuration
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Token cache
let accessToken = null;
let tokenExpiry = null;

/**
 * Generate OAuth Access Token
 */
export async function getAccessToken() {
  // Return cached token if still valid
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    const authString = Buffer.from(`${MOMO_CONFIG.apiUser}:${MOMO_CONFIG.apiKey}`).toString('base64');
    
    const response = await axios.post(
      `${MOMO_CONFIG.baseUrl}/collection/token/`,
      {},
      {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Ocp-Apim-Subscription-Key': MOMO_CONFIG.subscriptionKey
        }
      }
    );

    accessToken = response.data.access_token;
    // Token typically expires in 3600 seconds, cache for 55 minutes
    tokenExpiry = Date.now() + (55 * 60 * 1000);
    
    console.log('✓ MTN MoMo access token obtained');
    return accessToken;
  } catch (error) {
    console.error('✗ Failed to get access token:', error.response?.data || error.message);
    throw new Error('Authentication failed with MTN MoMo');
  }
}

/**
 * Request Payment from Customer
 * @param {Object} paymentData - Payment information
 * @returns {Object} Payment reference and status
 */
export async function requestToPay(paymentData) {
  const {
    amount,
    phoneNumber,
    customerName,
    ticketDetails,
    userId
  } = paymentData;

  // Validate phone number format
  const cleanPhone = phoneNumber.replace(/\s+/g, '');
  
  // In sandbox, allow MTN test numbers (e.g., 46733123450, 46733123451)
  // These are special numbers used to test different payment scenarios
  const isSandbox = MOMO_CONFIG.environment === 'sandbox';
  const isMTNTestNumber = cleanPhone.match(/^\+?467[0-9]{8}$/);
  
  if (!isSandbox && !cleanPhone.match(/^(\+268|268|0)?7[0-9]{7}$/)) {
    throw new Error('Invalid Eswatini phone number format');
  }
  
  if (isSandbox && !cleanPhone.match(/^(\+268|268|0)?7[0-9]{7}$/) && !isMTNTestNumber) {
    throw new Error('Invalid phone number. Use Eswatini format or MTN test numbers (e.g., 46733123450)');
  }

  // Format phone number for MTN
  let formattedPhone;
  if (isMTNTestNumber) {
    // Keep test numbers as-is, remove + if present
    formattedPhone = cleanPhone.replace(/^\+/, '');
  } else {
    // Format Eswatini numbers (268XXXXXXXX without +)
    formattedPhone = cleanPhone.replace(/^\+?268/, '268').replace(/^0/, '2680');
  }

  try {
    const token = await getAccessToken();
    const referenceId = uuidv4();
    
    const requestBody = {
      amount: amount.toString(),
      currency: MOMO_CONFIG.currency,
      externalId: referenceId,
      payer: {
        partyIdType: 'MSISDN',
        partyId: formattedPhone
      },
      payerMessage: `Bus Ticket: ${ticketDetails.departure} to ${ticketDetails.destination}`,
      payeeNote: `Ticket payment for ${customerName}`
    };

    console.log(`Requesting payment of ${MOMO_CONFIG.currency} ${amount} from ${formattedPhone}...`);

    const response = await axios.post(
      `${MOMO_CONFIG.baseUrl}/collection/v1_0/requesttopay`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Reference-Id': referenceId,
          'X-Target-Environment': MOMO_CONFIG.environment,
          'Ocp-Apim-Subscription-Key': MOMO_CONFIG.subscriptionKey,
          'Content-Type': 'application/json'
        }
      }
    );

    // Store payment record in database
    const { error: dbError } = await supabase
      .from('payments')
      .insert({
        reference_id: referenceId,
        user_id: userId,
        amount: amount,
        currency: MOMO_CONFIG.currency,
        phone_number: formattedPhone,
        status: 'PENDING',
        ticket_details: ticketDetails,
        created_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Database error:', dbError);
    }

    console.log(`✓ Payment request sent. Reference: ${referenceId}`);

    return {
      success: true,
      referenceId,
      message: 'Payment request sent. Please approve on your phone.',
      status: 'PENDING'
    };
  } catch (error) {
    console.error('✗ Payment request failed:', error.response?.data || error.message);
    
    // Store failed payment
    await supabase
      .from('payments')
      .insert({
        reference_id: uuidv4(),
        user_id: userId,
        amount: amount,
        currency: MOMO_CONFIG.currency,
        phone_number: formattedPhone,
        status: 'FAILED',
        error_message: error.message,
        ticket_details: ticketDetails,
        created_at: new Date().toISOString()
      });

    throw new Error(error.response?.data?.message || 'Payment request failed');
  }
}

/**
 * Check Payment Status
 * @param {string} referenceId - Payment reference ID
 * @returns {Object} Payment status
 */
export async function getPaymentStatus(referenceId) {
  try {
    const token = await getAccessToken();

    const response = await axios.get(
      `${MOMO_CONFIG.baseUrl}/collection/v1_0/requesttopay/${referenceId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Target-Environment': MOMO_CONFIG.environment,
          'Ocp-Apim-Subscription-Key': MOMO_CONFIG.subscriptionKey
        }
      }
    );

    const paymentData = response.data;
    
    // Log full response for debugging
    console.log(`Payment ${referenceId} full response:`, JSON.stringify(paymentData, null, 2));
    
    // Update database with payment status
    await supabase
      .from('payments')
      .update({
        status: paymentData.status,
        financial_transaction_id: paymentData.financialTransactionId,
        updated_at: new Date().toISOString()
      })
      .eq('reference_id', referenceId);

    console.log(`Payment ${referenceId} status: ${paymentData.status}${paymentData.reason ? ` - Reason: ${paymentData.reason}` : ''}`);

    return {
      referenceId,
      status: paymentData.status, // PENDING, SUCCESSFUL, FAILED
      amount: paymentData.amount,
      currency: paymentData.currency,
      financialTransactionId: paymentData.financialTransactionId,
      reason: paymentData.reason
    };
  } catch (error) {
    console.error('✗ Status check failed:', error.response?.data || error.message);
    throw new Error('Failed to check payment status');
  }
}

/**
 * Check Account Balance (Admin/Debug)
 */
export async function getAccountBalance() {
  try {
    const token = await getAccessToken();

    const response = await axios.get(
      `${MOMO_CONFIG.baseUrl}/collection/v1_0/account/balance`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Target-Environment': MOMO_CONFIG.environment,
          'Ocp-Apim-Subscription-Key': MOMO_CONFIG.subscriptionKey
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('✗ Balance check failed:', error.response?.data || error.message);
    throw new Error('Failed to check balance');
  }
}

/**
 * Verify Account is Active
 */
export async function verifyAccountActive(phoneNumber) {
  try {
    const token = await getAccessToken();
    const formattedPhone = phoneNumber.replace(/^\+?268/, '268').replace(/^0/, '2680');

    const response = await axios.get(
      `${MOMO_CONFIG.baseUrl}/collection/v1_0/accountholder/msisdn/${formattedPhone}/active`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Target-Environment': MOMO_CONFIG.environment,
          'Ocp-Apim-Subscription-Key': MOMO_CONFIG.subscriptionKey
        }
      }
    );

    return response.data.result === true;
  } catch (error) {
    console.error('Account verification failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Process Complete Ticket Purchase with Payment
 * @param {Object} bookingData - Complete booking information
 * @returns {Object} Ticket and payment details
 */
export async function processTicketPurchase(bookingData) {
  const {
    userId,
    busId,
    departure,
    destination,
    fare,
    phoneNumber,
    customerName,
    seatNumber
  } = bookingData;

  try {
    // Step 1: Request payment
    const paymentResult = await requestToPay({
      amount: fare,
      phoneNumber,
      customerName,
      ticketDetails: { departure, destination, seatNumber },
      userId
    });

    // Step 2: Return payment reference for status checking
    return {
      success: true,
      paymentReferenceId: paymentResult.referenceId,
      message: 'Payment initiated. Waiting for customer approval...',
      status: 'PENDING_PAYMENT'
    };
  } catch (error) {
    console.error('Ticket purchase failed:', error.message);
    throw error;
  }
}

/**
 * Complete Ticket Creation After Successful Payment
 * @param {string} referenceId - Payment reference
 * @returns {Object} Ticket details
 */
export async function completeTicketCreation(referenceId) {
  try {
    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('reference_id', referenceId)
      .single();

    if (paymentError || !payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'SUCCESSFUL') {
      throw new Error(`Payment not successful. Status: ${payment.status}`);
    }

    // Check if ticket already created
    if (payment.ticket_id) {
      const { data: existingTicket } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', payment.ticket_id)
        .single();
      
      if (existingTicket) {
        return { ticket: existingTicket, alreadyCreated: true };
      }
    }

    // Create ticket
    const qrCode = `TICKET-${referenceId}-${Date.now()}`;
    const ticketDetails = payment.ticket_details;

    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        user_id: payment.user_id,
        bus_id: ticketDetails.busId,
        departure: ticketDetails.departure,
        destination: ticketDetails.destination,
        fare: payment.amount,
        qr_code: qrCode,
        status: 'active',
        payment_status: 'completed',
        payment_reference: referenceId,
        seat_number: ticketDetails.seatNumber,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (ticketError) {
      throw new Error('Failed to create ticket: ' + ticketError.message);
    }

    // Update payment with ticket ID
    await supabase
      .from('payments')
      .update({ ticket_id: ticket.id })
      .eq('reference_id', referenceId);

    console.log(`✓ Ticket created for payment ${referenceId}`);

    return { ticket, alreadyCreated: false };
  } catch (error) {
    console.error('Ticket creation failed:', error.message);
    throw error;
  }
}
