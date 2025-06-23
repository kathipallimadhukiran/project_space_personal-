import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { Review } from '../types';
import ReviewCard from './ReviewCard';
import ReviewRespondModal from './ReviewRespondModal';
import * as api from '../utils/api';

interface ReviewsSectionProps {
  onOpenRespondModal: (review: Review) => void;
  onOpenAppealModal: (review: Review) => void;
  workerEmail: string;
}

interface SkeletonProps {
  width: number;
  height: number;
  borderRadius?: number;
  style?: any;
}

const Skeleton = ({ width, height, borderRadius = 8, style = {} }: SkeletonProps) => {
  const shimmer = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);
  const translateX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-width, width] });
  return (
    <View style={[{ width, height, borderRadius, backgroundColor: '#e5e7eb', overflow: 'hidden' }, style]}>
      <Animated.View
        style={{
          width: width * 2,
          height,
          borderRadius,
          backgroundColor: '#f1f5f9',
          opacity: 0.7,
          transform: [{ translateX }],
        }}
      />
    </View>
  );
};

const ReviewsSection: React.FC<ReviewsSectionProps & { loading?: boolean }> = ({ 
  onOpenRespondModal, 
  onOpenAppealModal, 
  workerEmail,
  loading: initialLoading 
}) => {
  const [filterRating, setFilterRating] = useState<number | 'ALL'>('ALL');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(initialLoading || false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [respondModalOpen, setRespondModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [respondLoading, setRespondLoading] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.fetchReviews(workerEmail);
      if (Array.isArray(data)) {
        setReviews(data);
      } else {
        setError('Invalid response format');
        console.error('Invalid reviews data format:', data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError('Failed to load reviews');
      Alert.alert('Error', 'Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (workerEmail) {
      fetchReviews();
    }
  }, [workerEmail]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReviews();
  };

  const handleOpenRespondModal = (review: Review) => {
    setSelectedReview(review);
    setRespondModalOpen(true);
  };

  const handleCloseRespondModal = () => {
    setRespondModalOpen(false);
    setSelectedReview(null);
  };

  const handleSubmitResponse = async (reviewId: string, responseText: string) => {
    if (!selectedReview) return;
    setRespondLoading(true);
    try {
      // Use worker info from review
      await api.respondToReview(
        reviewId,
        responseText,
        selectedReview.worker?.id || '',
        selectedReview.worker?.name || ''
      );
      handleCloseRespondModal();
      fetchReviews();
      Alert.alert('Success', 'Your response has been posted.');
    } catch (err) {
      Alert.alert('Error', 'Failed to submit response.');
    } finally {
      setRespondLoading(false);
    }
  };

  const sortedReviews = [...(reviews || [])].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  const filteredReviews = sortedReviews.filter(review =>
    filterRating === 'ALL' || review.rating === filterRating
  );

  const averageRating = reviews && reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : 'N/A';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f8fa' }} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6200']}
            tintColor="#FF6200"
          />
        }
      >
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Client Reviews</Text>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Filter by Rating:</Text>
              <Picker
                selectedValue={filterRating}
                style={styles.picker}
                onValueChange={(itemValue: string | number) => setFilterRating(itemValue === 'ALL' ? 'ALL' : Number(itemValue))}
              >
                <Picker.Item label="All Ratings" value="ALL" />
                {[5, 4, 3, 2, 1].map(r => <Picker.Item key={r} label={`${r} Stars`} value={r} />)}
              </Picker>
            </View>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>Average Rating: <Text style={styles.statsValue}>{averageRating}</Text> ⭐</Text>
            <Text style={styles.statsSubText}>Total Reviews: {reviews ? reviews.length : 0}</Text>
          </View>
        </View>
        {error ? (
          <View style={styles.errorState}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchReviews}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <View>
            {[1,2,3].map(i => (
              <View key={i} style={styles.skeletonCard}>
                <Skeleton width={60} height={16} style={{ marginBottom: 8 }} />
                <Skeleton width={120} height={14} style={{ marginBottom: 8 }} />
                <Skeleton width={80} height={16} style={{ marginBottom: 8 }} />
                <Skeleton width={180} height={16} style={{ marginBottom: 8 }} />
                <Skeleton width={220} height={24} borderRadius={8} />
              </View>
            ))}
          </View>
        ) : filteredReviews.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⭐</Text>
            <Text style={styles.emptyTitle}>No reviews match your filter.</Text>
            <Text style={styles.emptySubtitle}>Client feedback will appear here once received.</Text>
          </View>
        ) : (
          <View>
            {filteredReviews.map(review => (
              <ReviewCard
                key={review._id}
                review={review}
                onRespond={handleOpenRespondModal}
                onAppeal={onOpenAppealModal}
              />
            ))}
          </View>
        )}
        <ReviewRespondModal
          isOpen={respondModalOpen}
          onClose={handleCloseRespondModal}
          review={selectedReview}
          onSubmit={handleSubmitResponse}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f6f8fa',
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#22223b',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f6f8fa',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  filterLabel: {
    fontSize: 12,
    color: '#64748b',
    marginRight: 8,
  },
  picker: {
    width: 120,
    height: 36,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsText: {
    fontSize: 14,
    color: '#22223b',
  },
  statsValue: {
    fontWeight: 'bold',
    color: '#FF6200',
  },
  statsSubText: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    marginTop: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22223b',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  errorState: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    marginTop: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FF6200',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default ReviewsSection; 