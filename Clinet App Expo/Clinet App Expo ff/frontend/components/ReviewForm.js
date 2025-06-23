import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView, Alert, ActivityIndicator, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Rating } from 'react-native-ratings';
import LottieView from 'lottie-react-native';
import { API_URL, REVIEW_API_URL } from '../config';

const ReviewForm = ({ visible, onClose, bookingId, worker, client }) => {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleSubmit = async () => {
    try {
      // Log the received props for debugging
      console.log('ReviewForm Props:', {
        bookingId,
        worker,
        client,
        hasRating: !!rating,
        hasReview: !!review.trim()
      });

      // Validate review text
      if (!review.trim()) {
        Alert.alert('Error', 'Please write your review before submitting');
        return;
      }

      // Validate rating
      if (!rating || rating < 1 || rating > 5) {
        Alert.alert('Error', 'Please select a rating between 1 and 5 stars');
        return;
      }

      // Validate required fields with detailed error messages
      if (!bookingId) {
        console.error('Booking ID is missing in review submission');
        Alert.alert('Error', 'Unable to submit review: Missing booking information. Please try again.');
        return;
      }

      if (!client?.email) {
        console.error('Client email is missing in review submission');
        Alert.alert('Error', 'Unable to submit review: Client information is missing.');
        return;
      }

      if (!worker?.email) {
        console.error('Worker email is missing in review submission');
        Alert.alert('Error', 'Unable to submit review: Worker information is missing.');
        return;
      }

      console.log('Submitting review with bookingId:', bookingId);
      console.log('Booking ID type:', typeof bookingId);
      
      // Ensure bookingId is a string and not an object
      let bookingIdStr = bookingId;
      
      // If bookingId is an object, try to get the _id field
      if (typeof bookingId === 'object' && bookingId !== null) {
        console.log('Booking ID is an object, extracting _id');
        bookingIdStr = bookingId._id || bookingId.id || bookingId.bookingId || bookingId.booking;
        console.log('Extracted bookingId:', bookingIdStr);
      }
      
      // Convert to string and trim any whitespace
      bookingIdStr = bookingIdStr.toString().trim();
      console.log('Final formatted bookingId:', bookingIdStr);
      
      if (!bookingIdStr) {
        throw new Error('Invalid booking ID: Could not extract a valid ID');
      }
      
      setIsSubmitting(true);
      
      // Prepare review data with all required fields
      const reviewData = {
        booking: bookingIdStr,
        bookingId: bookingIdStr, // Include both fields for backward compatibility
        client: {
          id: client?.id?.toString() || 'unknown-client-id',
          name: client?.name?.toString() || 'Anonymous',
          email: client.email.toString()
        },
        worker: {
          id: worker?.id?.toString() || 'unknown-worker-id',
          name: worker?.name?.toString() || 'Worker',
          email: worker.email.toString()
        },
        rating: Number(rating),
        review: review.trim()
      };

      console.log('Submitting review with data:', JSON.stringify(reviewData, null, 2));

      // Use the specific endpoint that matches the backend route
      const response = await fetch(`${REVIEW_API_URL}/clientreviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });
      
      console.log('Review submission response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        try {
          // Try to parse as JSON if possible
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || 'Failed to submit review');
        } catch (e) {
          // If not JSON, use the raw text
          throw new Error(errorText || 'Failed to submit review');
        }
      }

      const data = await response.json();

      // Show success animation
      setShowSuccess(true);
      
      // Start fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Hide animation and close form after delay (4 seconds total)
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowSuccess(false);
          onClose(true);
        });
      }, 3700); // 4000ms total - 300ms for the fade out animation
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', error.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => !isSubmitting && onClose(false)}
    >
      <View style={styles.centeredView}>
        {showSuccess ? (
          <Animated.View style={[styles.animationContainer, { opacity: fadeAnim }]}>
            <LottieView
              source={require('../assets/Animation - 1749832471755.json')}
              autoPlay
              loop={false}
              style={styles.animation}
            />
            <Text style={styles.successText}>
              {review ? 'Review Updated!' : 'Review Submitted!'}
            </Text>
          </Animated.View>
        ) : (
          <View style={styles.modalView}>
            <View style={styles.header}>
              <Text style={styles.title}>Leave a Review</Text>
              <TouchableOpacity 
                onPress={() => !isSubmitting && onClose(false)}
                disabled={isSubmitting}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
              <View style={styles.ratingContainer}>
                <Text style={styles.label}>Your Rating</Text>
                <Rating
                  type="star"
                  ratingCount={5}
                  imageSize={40}
                  showRating={false}
                  startingValue={rating}
                  onFinishRating={setRating}
                  style={styles.rating}
                />
              </View>


              <View style={styles.inputContainer}>
                <Text style={styles.label}>Your Review</Text>
                <TextInput
                  style={styles.input}
                  multiline
                  numberOfLines={5}
                  placeholder="Share your experience..."
                  value={review}
                  onChangeText={setReview}
                  editable={!isSubmitting}
                />
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Submit Review</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  animationContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxWidth: 400,
    height: 400,
  },
  animation: {
    width: 250,
    height: 250,
  },
  successText: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '90%',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    marginBottom: 20,
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#555',
  },
  rating: {
    paddingVertical: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 120,
    backgroundColor: '#f9f9f9',
  },
  footer: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: '#fc8019',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReviewForm;
