import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';

const renderStars = (rating) => {
  return Array(5).fill(0).map((_, i) => (
    <Ionicons 
      key={i}
      name={i < rating ? "star" : "star-outline"} 
      size={18} 
      color={i < rating ? "#FFD700" : "#ddd"} 
      style={{ marginRight: 2 }}
    />
  ));
};

export default function ReviewsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const reviews = route.params?.reviews || [];

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fc8019" />
        </TouchableOpacity>
        <Text style={styles.title}>My Reviews</Text>
        <View style={{ width: 40 }} />
      </View>
      
      {reviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="star-outline" size={48} color="#ddd" />
          <Text style={styles.emptyText}>No reviews yet</Text>
          <Text style={styles.emptySubtext}>Your reviews will appear here</Text>
        </View>
      ) : (
        <View>
          {reviews.map((review, idx) => (
            <View key={idx} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.workerInfo}>
                  <Image 
                    source={{ uri: review.worker?.avatar || 'https://randomuser.me/api/portraits/men/32.jpg' }} 
                    style={styles.avatar} 
                  />
                  <View>
                    <Text style={styles.workerName}>
                      {review.worker?.name || 'Worker'}
                    </Text>
                    <Text style={styles.serviceType}>
                      {review.serviceType || 'Service'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.date}>
                  {formatDate(review.createdAt)}
                </Text>
              </View>
              
              <View style={styles.ratingContainer}>
                {renderStars(review.rating)}
                <Text style={styles.ratingText}>
                  {review.rating?.toFixed(1) || '0.0'}
                </Text>
              </View>
              
              <View style={styles.reviewContent}>
                <Text style={styles.reviewText}>
                  {review.review || 'No review text provided.'}
                </Text>
                
                <View style={styles.bookingDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={14} color="#666" style={styles.detailIcon} />
                    <Text style={styles.detailText}>
                      {formatDate(review.booking?.date) || 'Date not specified'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={14} color="#666" style={styles.detailIcon} />
                    <Text style={styles.detailText}>
                      {review.booking?.timeSlot || 'Time not specified'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={14} color="#666" style={styles.detailIcon} />
                    <Text style={styles.detailText} numberOfLines={1}>
                      {review.booking?.address?.text || 'Location not specified'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="construct-outline" size={14} color="#666" style={styles.detailIcon} />
                    <Text style={styles.detailText}>
                      {review.serviceType || 'Service type not specified'}
                    </Text>
                  </View>
                </View>
                
                {review.workerResponse?.response && (
                  <View style={styles.responseContainer}>
                    <Text style={styles.responseHeader}>
                      <Text style={styles.responseName}>
                        {review.workerResponse.responderName || 'Worker'}
                      </Text>
                      <Text> responded</Text>
                    </Text>
                    <Text style={styles.responseText}>
                      {review.workerResponse.response}
                    </Text>
                    <Text style={styles.responseDate}>
                      {formatDate(review.workerResponse.respondedAt)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a2a4e',
    marginLeft: 16,
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    maxWidth: 250,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  workerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a2a4e',
    marginBottom: 2,
  },
  serviceType: {
    fontSize: 13,
    color: '#888',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a2a4e',
  },
  reviewContent: {
    marginBottom: 16,
  },
  reviewText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginBottom: 12,
  },
  bookingDetails: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailIcon: {
    width: 20,
    textAlign: 'center',
    marginRight: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#555',
    flex: 1,
  },
  responseContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#fc8019',
  },
  responseHeader: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  responseName: {
    fontWeight: '600',
    color: '#1a2a4e',
  },
  responseText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#444',
    marginBottom: 4,
  },
  responseDate: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
  },
});
