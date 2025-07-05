// routes/bookings.js - Gradual model integration
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Test if models can be imported
let Event, Seat, Booking;
try {
  Event = require('../models/Event');
  Seat = require('../models/Seat');
  Booking = require('../models/Booking');
  console.log('✅ All models imported successfully');
} catch (error) {
  console.error('❌ Model import error:', error.message);
}

// Test endpoint - always works
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Routes are working!', 
    timestamp: new Date(),
    status: 'success',
    modelsLoaded: !!(Event && Seat && Booking)
  });
});

// Real seat endpoint with database
router.get('/events/:eventId/seats', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Check if models are loaded
    if (!Event || !Seat) {
      return res.status(500).json({
        success: false,
        message: 'Models not loaded properly'
      });
    }
    
    // Validate ObjectId formats
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Get seats for this event
    const seats = await Seat.find({ eventId });
    
    // Group by section
    const seatMap = {};
    seats.forEach(seat => {
      if (!seatMap[seat.section]) {
        seatMap[seat.section] = {
          totalSeats: 0,
          availableSeats: 0,
          price: seat.price,
          seats: []
        };
      }
      
      seatMap[seat.section].totalSeats++;
      if (seat.status === 'available') {
        seatMap[seat.section].availableSeats++;
      }
      
      seatMap[seat.section].seats.push({
        seatId: seat._id,
        row: seat.row,
        number: seat.seatNumber,
        status: seat.status
      });
    });

    res.json({
      success: true,
      data: {
        eventId,
        event: {
          title: event.title,
          dateTime: event.startDateTime,
          venue: event.venue.name
        },
        seatMap,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Seat endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Real booking endpoint with database
router.post('/bookings', async (req, res) => {
  try {
    const { eventId, seatIds, contactInfo } = req.body;

    // Check if models are loaded
    if (!Event || !Seat || !Booking) {
      return res.status(500).json({
        success: false,
        message: 'Models not loaded properly'
      });
    }

    // Validate input
    if (!eventId || !seatIds || !contactInfo) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: eventId, seatIds, contactInfo'
      });
    }

    // Validate ObjectId formats
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if seats are available
    const seats = await Seat.find({
      _id: { $in: seatIds },
      status: 'available'
    });

    if (seats.length !== seatIds.length) {
      return res.status(409).json({
        success: false,
        message: 'Some seats are no longer available'
      });
    }

    // Calculate total amount
    const totalAmount = seats.reduce((sum, seat) => sum + seat.price, 0);

    // Create booking
    const booking = new Booking({
      userId: 'demo_user_123',
      eventId,
      seats: seatIds,
      totalAmount,
      contactInfo
    });

    await booking.save();

    // Update seat status
    await Seat.updateMany(
      { _id: { $in: seatIds } },
      { status: 'booked' }
    );

    // Generate simple tickets
    const tickets = seats.map(seat => ({
      ticketId: `ticket_${booking._id}_${seat._id}`,
      seatInfo: `${seat.section} - Row ${seat.row}, Seat ${seat.seatNumber}`,
      qrCode: `QR_${eventId}_${booking._id}_${seat._id}`
    }));

    res.status(201).json({
      success: true,
      data: {
        bookingId: booking._id,
        eventId,
        eventTitle: event.title,
        totalAmount,
        bookingStatus: 'confirmed',
        tickets,
        bookingDate: booking.createdAt
      },
      message: 'Booking created successfully'
    });

  } catch (error) {
    console.error('Booking endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;