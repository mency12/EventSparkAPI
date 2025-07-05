const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  startDateTime: { type: Date, required: true },
  endDateTime: { type: Date, required: true },
  venue: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    capacity: { type: Number, required: true }
  },
  status: { 
    type: String, 
    enum: ['draft', 'published', 'sold_out', 'cancelled'], 
    default: 'published' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);