const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Seat = require('../models/Seat');
const Booking = require('../models/Booking');
const mongoose = require('mongoose'); // Add this if not already there

// Route 1: GET /api/events/:eventId/seats
router.get('/events/:eventId/seats', async (req, res) => {
  try {
    const { eventId } = req.params;
    
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
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Route 2: POST /api/bookings
router.post('/bookings', async (req, res) => {
  try {
    const { eventId, seatIds, contactInfo } = req.body;

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

    // Validate seat IDs
    const invalidSeatIds = seatIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidSeatIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid seat ID format'
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
      userId: 'demo_user_123', // Simplified for demo
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
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ADD THIS TO THE BOTTOM OF YOUR EXISTING FILE
// (keep everything else you already have)

// Database reset endpoint - ADD THIS ONLY
router.post('/reset-database', async (req, res) => {
  try {
    // Clear all collections
    await Event.deleteMany({});
    await Seat.deleteMany({});
    await Booking.deleteMany({});

    // Create sample event
    const event = new Event({
      title: 'Summer Music Festival 2025',
      description: 'Annual outdoor music festival featuring top artists',
      category: 'Music',
      startDateTime: new Date('2025-08-15T19:00:00Z'),
      endDateTime: new Date('2025-08-15T23:00:00Z'),
      venue: {
        name: 'Central Park Amphitheater',
        address: '123 Park Ave, New York, NY',
        capacity: 150
      }
    });

    await event.save();

    // Create sample seats
    const sections = [
      { name: 'VIP', rows: 2, seatsPerRow: 5, price: 150 },
      { name: 'Premium', rows: 3, seatsPerRow: 10, price: 100 },
      { name: 'General', rows: 5, seatsPerRow: 15, price: 50 }
    ];

    let seatCount = 0;
    for (const section of sections) {
      for (let row = 1; row <= section.rows; row++) {
        for (let seatNum = 1; seatNum <= section.seatsPerRow; seatNum++) {
          const seat = new Seat({
            eventId: event._id,
            section: section.name,
            row: String.fromCharCode(64 + row),
            seatNumber: seatNum.toString(),
            price: section.price,
            status: 'available'
          });
          await seat.save();
          seatCount++;
        }
      }
    }

    res.json({
      success: true,
      message: 'Database reset and seeded successfully',
      data: {
        eventId: event._id.toString(),
        eventTitle: event.title,
        totalSeats: seatCount,
        database: 'eventspark',
        testUrl: `/api/events/${event._id}/seats`
      }
    });

  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Database reset failed',
      error: error.message
    });
  }
});

module.exports = router;