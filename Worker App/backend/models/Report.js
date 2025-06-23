const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  email: { type: String, required: true },
  type: { type: String, enum: ['bug', 'problem', 'improvement', 'issue'], required: true },
  details: { type: String, required: true },
  extra: { type: Object },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Report', ReportSchema); 