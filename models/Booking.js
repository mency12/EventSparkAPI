const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Simplified for demo
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  seats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Seat' }],
  totalAmount: { type: Number, required: true },
  bookingStatus: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled'], 
    default: 'confirmed' 
  },
  contactInfo: {
    email: { type: String, required: true },
    name: { type: String, required: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);