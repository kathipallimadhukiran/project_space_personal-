const mongoose = require('mongoose');
const AnalyticsSummary = require('./models/AnalyticsSummary');

mongoose.connect('mongodb://localhost:27017/expoapp');

AnalyticsSummary.create({
  userEmail: "testuser@example.com",
  totalBookings: 12,
  completedBookings: 10,
  totalEarnings: 25000,
  lastBookingDate: new Date('2024-06-01T12:00:00Z'),
  lastLogin: new Date('2024-06-02T09:00:00Z')
}).then(() => {
  console.log('Dummy analytics data inserted!');
  mongoose.disconnect();
}).catch(err => {
  console.error('Error inserting dummy data:', err);
  mongoose.disconnect();
}); 