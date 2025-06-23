const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Keep both booking and bookingId for backward compatibility
  booking: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Booking',
    required: true,
    index: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true,
    index: true
  },
  client: {
    id: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true,
      default: new mongoose.Types.ObjectId()
    },
    name: { 
      type: String, 
      required: true,
      default: 'Anonymous'
    },
    email: { 
      type: String, 
      required: true,
      default: 'unknown@example.com'
    }
  },
  worker: {
    id: { 
      type: String, 
      required: true,
      default: 'unknown-worker-id'
    },
    name: { 
      type: String, 
      required: true,
      default: 'Worker'
    },
    email: { 
      type: String, 
      required: false, // Made optional
      default: 'worker@example.com'
    }
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  review: { 
    type: String, 
    required: true, 
    trim: true 
  },
  workerResponse: {
    response: { 
      type: String, 
      trim: true,
      default: ''
    },
    respondedAt: { 
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'responded'],
      default: 'pending'
    },
    // Additional fields for response
    responderId: {
      type: String,
      default: ''
    },
    responderName: {
      type: String,
      default: ''
    },
    responderRole: {
      type: String,
      enum: ['worker', 'admin'],
      default: 'worker'
    }
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const Review = mongoose.model('Review', reviewSchema, 'reviews');

module.exports = Review; 