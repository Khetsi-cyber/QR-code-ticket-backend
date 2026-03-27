/**
 * Payment API Routes for MTN MoMo Integration
 * Express.js API endpoints for handling payments
 */

import express from 'express';
import * as momoService from './momo-payment-service.js';

const router = express.Router();

/**
 * POST /api/payments/initiate
 * Initiate a new payment request
 */
router.post('/initiate', async (req, res) => {
  try {
    const {
      userId,
      busId,
      departure,
      destination,
      fare,
      phoneNumber,
      customerName,
      seatNumber
    } = req.body;

    // Validation
    if (!userId || !busId || !departure || !destination || !fare || !phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Process payment
    const result = await momoService.processTicketPurchase({
      userId,
      busId,
      departure,
      destination,
      fare,
      phoneNumber,
      customerName: customerName || 'Bus Passenger',
      seatNumber
    });

    res.json(result);
  } catch (error) {
    console.error('Payment initiation error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/payments/status/:referenceId
 * Check payment status
 */
router.get('/status/:referenceId', async (req, res) => {
  try {
    const { referenceId } = req.params;

    if (!referenceId) {
      return res.status(400).json({
        success: false,
        error: 'Reference ID required'
      });
    }

    const status = await momoService.getPaymentStatus(referenceId);
    res.json({
      success: true,
      payment: status
    });
  } catch (error) {
    console.error('Status check error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/payments/complete/:referenceId
 * Complete ticket creation after successful payment
 */
router.post('/complete/:referenceId', async (req, res) => {
  try {
    const { referenceId } = req.params;

    if (!referenceId) {
      return res.status(400).json({
        success: false,
        error: 'Reference ID required'
      });
    }

    // First check payment status
    const paymentStatus = await momoService.getPaymentStatus(referenceId);

    if (paymentStatus.status !== 'SUCCESSFUL') {
      return res.status(400).json({
        success: false,
        error: `Payment not successful. Status: ${paymentStatus.status}`,
        status: paymentStatus.status
      });
    }

    // Create ticket
    const result = await momoService.completeTicketCreation(referenceId);

    res.json({
      success: true,
      ticket: result.ticket,
      alreadyCreated: result.alreadyCreated,
      message: result.alreadyCreated ? 'Ticket already created' : 'Ticket created successfully'
    });
  } catch (error) {
    console.error('Ticket creation error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/payments/verify-phone
 * Verify if phone number is active on MTN MoMo
 */
router.post('/verify-phone', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number required'
      });
    }

    const isActive = await momoService.verifyAccountActive(phoneNumber);

    res.json({
      success: true,
      isActive,
      message: isActive ? 'Account is active' : 'Account not found or inactive'
    });
  } catch (error) {
    console.error('Phone verification error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/payments/balance
 * Check account balance (Admin only)
 */
router.get('/balance', async (req, res) => {
  try {
    const balance = await momoService.getAccountBalance();
    res.json({
      success: true,
      balance
    });
  } catch (error) {
    console.error('Balance check error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/payments/callback
 * Webhook callback for payment notifications (optional)
 */
router.post('/callback', async (req, res) => {
  try {
    console.log('Payment callback received:', req.body);
    
    // Process callback notification
    // You can update payment status here if MTN sends webhooks
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Callback error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/payments/test
 * Test endpoint to verify service is running
 */
router.get('/test', async (req, res) => {
  try {
    // Test token generation
    const token = await momoService.getAccessToken();
    
    res.json({
      success: true,
      message: 'MTN MoMo service is running',
      tokenObtained: !!token,
      environment: process.env.MOMO_ENVIRONMENT || 'sandbox'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
