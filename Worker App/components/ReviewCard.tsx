import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Review } from '../types';

interface ReviewCardProps {
  review: Review;
  onRespond: (review: Review) => void;
  onAppeal: (review: Review) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, onRespond, onAppeal }) => {
  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Text key={i} style={styles.star}>{i < rating ? '★' : '☆'}</Text>
    ));
  };

  const canAppeal = review.rating < 3 && !review.workerResponse?.status;
  const clientName = review.client?.name || 'Anonymous';
  const bookingId = review.bookingId || review._id;
  const reviewDate = review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Unknown date';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.clientName}>{clientName}</Text>
          <Text style={styles.bookingId}>For Booking ID: <Text style={styles.bookingIdValue}>{bookingId.slice(-6)}</Text></Text>
        </View>
        <View style={styles.ratingRow}>
          {renderStars(review.rating)}
          <Text style={styles.ratingText}>({review.rating}/5)</Text>
        </View>
      </View>
      <Text style={styles.comment}>{review.review || 'No review text provided'}</Text>
      {review.workerResponse && review.workerResponse.status === 'responded' && (
        <View style={styles.responseBox}>
          <Text style={styles.responseLabel}>Your Response:</Text>
          <Text style={styles.responseText}>{review.workerResponse.response}</Text>
          <Text style={styles.responseDate}>
            Responded on: {new Date(review.workerResponse.respondedAt).toLocaleDateString()}
          </Text>
        </View>
      )}
      <View style={styles.buttonRow}>
        {(!review.workerResponse || review.workerResponse.status === 'pending') && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#FF6200' }]} 
            onPress={() => onRespond(review)}
          >
            <Text style={styles.buttonText}>💬 Respond</Text>
          </TouchableOpacity>
        )}
        {canAppeal && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#f59e42' }]} 
            onPress={() => onAppeal(review)}
          >
            <Text style={styles.buttonText}>⚠️ Appeal Rating</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.dateText}>Reviewed on: {reviewDate}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clientName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#22223b',
  },
  bookingId: {
    fontSize: 12,
    color: '#64748b',
  },
  bookingIdValue: {
    fontWeight: 'bold',
    color: '#FF6200',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    color: '#FF6200',
    fontSize: 16,
    marginRight: 1,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF6200',
  },
  comment: {
    fontSize: 13,
    color: '#22223b',
    fontStyle: 'italic',
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  responseBox: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF6200',
    marginBottom: 2,
  },
  responseText: {
    fontSize: 13,
    color: '#22223b',
    fontStyle: 'italic',
    backgroundColor: '#fff5f2',
    padding: 8,
    borderRadius: 8,
  },
  responseDate: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'right',
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  dateText: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'right',
    marginTop: 8,
  },
});

export default ReviewCard; 