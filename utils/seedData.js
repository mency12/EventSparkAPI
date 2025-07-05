const mongoose = require('mongoose');
const Event = require('../models/Event');
const Seat = require('../models/Seat');
require('dotenv').config();

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Clear existing data
    await Event.deleteMany({});
    await Seat.deleteMany({});

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
    console.log('Created event:', event.title);

    // Create sample seats
    const sections = [
      { name: 'VIP', rows: 2, seatsPerRow: 5, price: 150 },
      { name: 'Premium', rows: 3, seatsPerRow: 10, price: 100 },
      { name: 'General', rows: 5, seatsPerRow: 15, price: 50 }
    ];

    for (const section of sections) {
      for (let row = 1; row <= section.rows; row++) {
        for (let seatNum = 1; seatNum <= section.seatsPerRow; seatNum++) {
          const seat = new Seat({
            eventId: event._id,
            section: section.name,
            row: String.fromCharCode(64 + row), // A, B, C...
            seatNumber: seatNum.toString(),
            price: section.price,
            status: 'available'
          });
          await seat.save();
        }
      }
    }

    console.log('Created sample seats');
    console.log('Event ID for testing:', event._id);
    process.exit(0);

  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();