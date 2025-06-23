const mongoose = require('mongoose');

const AnalyticsSummarySchema = new mongoose.Schema({
  userEmail: { type: String, required: true, unique: true },
  totalBookings: { type: Number, default: 0 },
  completedBookings: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  lastBookingDate: { type: Date },
  lastLogin: { type: Date },
  monthlyEarnings: { type: [Number], default: Array(12).fill(0) },
  monthlyBookings: { type: [Number], default: Array(12).fill(0) },
  // Add more fields as needed
});

module.exports = mongoose.model('AnalyticsSummary', AnalyticsSummarySchema); 