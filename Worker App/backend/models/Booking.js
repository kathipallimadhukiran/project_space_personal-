const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  workerEmail: { type: String, required: true },
  customerEmail: { type: String, required: true },
  clientName: { type: String, required: true },
  clientPhone: { type: String, required: true },
  customerPhone: { type: String, required: true }, // Added customer phone
  serviceName: { type: String, required: true },
  serviceId: { type: String, required: true },
  bookingDate: { type: Date, required: true }, // Combined date and time
  date: { type: Date }, // Legacy field
  time: { type: String }, // Legacy field
  location: { type: String, required: true }, // Text address
  address: {
    text: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  notes: { type: String },
  status: { 
    type: String, 
    enum: ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'Rejected'],
    default: 'Pending' 
  },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  completionRequested: { type: Boolean, default: false },
  price: { type: Number },
  serviceFee: { type: Number },
  totalAmount: { type: Number },
  paymentStatus: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
bookingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
