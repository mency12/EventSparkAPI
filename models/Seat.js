const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  section: { type: String, required: true },
  row: { type: String, required: true },
  seatNumber: { type: String, required: true },
  price: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['available', 'reserved', 'booked'], 
    default: 'available' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Seat', seatSchema);