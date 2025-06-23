const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

// Get reviews by worker email
router.get('/worker/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const reviews = await Review.find({ 'worker.email': email })
      .sort({ createdAt: -1 })
      .populate('booking', 'serviceType bookingDate status');
    
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Add worker response to a review
router.post('/:reviewId/respond', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { response, responderId, responderName } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    review.workerResponse = {
      response,
      respondedAt: new Date(),
      status: 'responded',
      responderId,
      responderName,
      responderRole: 'worker'
    };

    await review.save();
    res.json(review);
  } catch (error) {
    console.error('Error adding response:', error);
    res.status(500).json({ error: 'Failed to add response' });
  }
});

module.exports = router; 