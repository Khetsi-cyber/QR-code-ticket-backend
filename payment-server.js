/**
 * Payment Server - Express.js backend for MTN MoMo payments
 * Handles all payment-related API requests
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import paymentRoutes from './payment-routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || process.env.PAYMENT_PORT || 3001;

// Configure CORS for development and production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || true
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MTN MoMo Payment Service',
    environment: process.env.MOMO_ENVIRONMENT || 'sandbox',
    timestamp: new Date().toISOString()
  });
});

// Root service info
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'MTN MoMo Payment Service',
    message: 'Service is running. Use /health or /api/payments/* endpoints.',
    endpoints: {
      health: '/health',
      test: '/api/payments/test',
      initiate: '/api/payments/initiate'
    }
  });
});

// Payment routes
app.use('/api/payments', paymentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('========================================');
  console.log('MTN MoMo Payment Service Started');
  console.log('========================================');
  console.log(`⚡ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.MOMO_ENVIRONMENT || 'sandbox'}`);
  console.log(`💰 Currency: ${process.env.MOMO_CURRENCY || 'SZL'}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/payments/test`);
  console.log('========================================');
  console.log('Available endpoints:');
  console.log('  POST /api/payments/initiate - Start payment');
  console.log('  GET  /api/payments/status/:ref - Check status');
  console.log('  POST /api/payments/complete/:ref - Create ticket');
  console.log('  POST /api/payments/verify-phone - Verify phone');
  console.log('  GET  /api/payments/balance - Check balance');
  console.log('========================================\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});

export default app;
