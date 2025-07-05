// routes/bookings.js - MINIMAL TEST VERSION
const express = require('express');
const router = express.Router();

// Test endpoint - no model imports
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Routes are working!', 
    timestamp: new Date(),
    status: 'success'
  });
});

// Simple seats endpoint test - no database calls
router.get('/events/:eventId/seats', (req, res) => {
  const { eventId } = req.params;
  res.json({
    success: true,
    message: 'Seat endpoint reached successfully',
    eventId: eventId,
    note: 'This is a test response - no database connection yet'
  });
});

// Simple booking endpoint test - no database calls  
router.post('/bookings', (req, res) => {
  res.json({
    success: true,
    message: 'Booking endpoint reached successfully',
    body: req.body,
    note: 'This is a test response - no database connection yet'
  });
});

module.exports = router;