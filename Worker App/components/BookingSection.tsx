import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated, RefreshControl, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { Booking, BookingStatus } from '../types';
import BookingCard from './BookingCard';
import { BOOKING_STATUS_OPTIONS } from '../constants';
import { BASE_URL } from '../utils/api';

interface BookingSectionProps {
  bookings: Booking[];
  onUpdateBookingStatus: (bookingId: string, newStatus: string) => Promise<void>;
  onOpenDetailModal: (booking: Booking) => void;
  onRefreshBookings: () => Promise<void>;
  isLoadingBookings: boolean;
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
    <View style={[{ width, height, borderRadius, backgroundColor: '#F5F5F5', overflow: 'hidden' }, style]}>
      <Animated.View
        style={{
          width: width * 2,
          height,
          borderRadius,
          backgroundColor: '#E0E0E0',
          opacity: 0.5,
          transform: [{ translateX }],
        }}
      />
    </View>
  );
};

const BookingSection: React.FC<BookingSectionProps> = ({ 
  bookings, 
  onUpdateBookingStatus, 
  onOpenDetailModal, 
  onRefreshBookings,
  isLoadingBookings 
}) => {
  const [filterStatus, setFilterStatus] = useState<BookingStatus | 'ALL'>('ALL');
  const [refreshing, setRefreshing] = React.useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Fade-in animation on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  // Helper function to normalize status for comparison
  const normalizeStatus = (status: string): string => {
    if (!status) return 'Pending';
    const statusStr = String(status).trim().toLowerCase();
    
    if (statusStr === 'pending') return 'Pending';
    if (statusStr === 'confirmed' || statusStr === 'confirm') return 'Confirmed';
    if (statusStr === 'in progress' || statusStr === 'in_progress') return 'In Progress';
    if (statusStr === 'completed') return 'Completed';
    if (statusStr === 'cancelled') return 'Cancelled';
    if (statusStr === 'rejected') return 'Rejected';
    
    return status;
  };

  // Log all received bookings with their statuses
  console.log('All bookings:', (bookings || []).map(b => ({
    id: b._id,
    status: b.status,
    service: b.serviceName,
    rawStatus: b.status,
    statusType: typeof b.status
  })));
  
  // Include all statuses for the filter
  const statusOptionsForFilter = [
    'ALL',
    ...Object.values(BookingStatus)
  ] as const;

  // Filter and sort bookings
  const filteredBookings = (bookings || [])
    .map(booking => ({
      ...booking,
      status: normalizeStatus(booking.status)
    }))
    .filter(booking => {
      const statusMatches = filterStatus === 'ALL' || booking.status === filterStatus;
      const isActive = filterStatus !== 'ALL' || (
        booking.status !== 'Completed' && 
        booking.status !== 'Cancelled' && 
        booking.status !== 'Rejected'
      );
      const matches = statusMatches && isActive;
      
      if (matches) {
        console.log('Booking included:', {
          id: booking._id,
          status: booking.status,
          filter: filterStatus,
          isActive,
          statusMatches
        });
      }
      
      return matches;
    })
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(0);
      const dateB = b.date ? new Date(b.date) : new Date(0);
      return dateA.getTime() - dateB.getTime();
    });
    
  console.log('Final filtered bookings:', {
    count: filteredBookings.length,
    bookings: filteredBookings.map(b => ({
      id: b._id,
      status: b.status,
      rawStatus: b.status,
      statusType: typeof b.status,
      service: b.serviceName
    }))
  });

  const refreshBookings = async () => {
    setRefreshing(true);
    try {
      await onRefreshBookings();
    } finally {
      setRefreshing(false);
    }
  };

  const handleRequestCompletion = async (bookingId: string) => {
    console.log('Initiating completion request for booking:', bookingId);
    
    try {
      const url = `${BASE_URL}/api/bookings/${bookingId}/request-completion`;
      console.log('Making request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      console.log('Response status:', response.status);
      
      const responseText = await response.text();
      let result;
      
      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error('Failed to parse JSON response:', responseText);
        throw new Error('Invalid response from server');
      }
      
      console.log('API Response:', result);
      
      if (!response.ok) {
        const errorMsg = result.message || `Server responded with status ${response.status}`;
        console.error('Server error:', errorMsg);
        throw new Error(errorMsg);
      }
      
      if (result.success) {
        console.log('Successfully requested completion for booking:', bookingId);
        return result;
      } 
      
      const errorMsg = result.message || 'Request failed without error message';
      console.error('API error:', errorMsg);
      throw new Error(errorMsg);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error in handleRequestCompletion:', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : 'No stack trace available'
      });
      throw new Error(`Failed to request completion: ${errorMessage}`);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshBookings} tintColor="#FF6200" colors={["#FF6200"]} />
          }
        >
          <View style={styles.filterRow}>
            <Text style={styles.title}>
              <Text style={styles.titleCurrent}>Current </Text>
              <Text style={styles.titleBookings}>Bookings</Text>
            </Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={filterStatus}
                style={styles.picker}
                onValueChange={(itemValue: string | BookingStatus) => setFilterStatus(itemValue as BookingStatus | 'ALL')}
                dropdownIconColor="#FF6200"
              >
                <Picker.Item label="All Active" value="ALL" />
                {statusOptionsForFilter.map(status => (
                  <Picker.Item key={status} label={status} value={status} />
                ))}
              </Picker>
            </View>
          </View>
          {isLoadingBookings || !bookings ? (
            <View>
              {[1, 2, 3].map(i => (
                <View key={i} style={styles.skeletonCard}>
                  <Skeleton width={120} height={16} style={{ marginBottom: 8 }} />
                  <Skeleton width={80} height={14} style={{ marginBottom: 8 }} />
                  <Skeleton width={180} height={16} style={{ marginBottom: 8 }} />
                  <Skeleton width={220} height={24} borderRadius={8} />
                </View>
              ))}
            </View>
          ) : filteredBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>
                {filterStatus === 'ALL' ? "No active bookings." : `No bookings with status \"${filterStatus}\".`}
              </Text>
              <Text style={styles.emptySubtitle}>New client bookings will appear here.</Text>
            </View>
          ) : (
            <View>
              {filteredBookings.map(booking => (
                <BookingCard
                  key={booking._id}
                  booking={{
                    ...booking,
                    _id: booking._id,
                    workerEmail: booking.workerEmail || '',
                    clientName: booking.clientName || 'Unknown Client',
                    clientPhone: booking.clientPhone || 'Not provided',
                    serviceName: booking.serviceName || 'Unknown Service',
                    serviceId: booking.serviceId || 'unknown',
                    date: booking.date || new Date(),
                    time: booking.time || '00:00',
                    location: booking.location || 'Location not specified',
                    status: normalizeStatus(booking.status) as BookingStatus,
                    notes: booking.notes || '',
                    completionRequested: Boolean(booking.completionRequested)
                  }}
                  onUpdateStatus={async (bookingId, newStatus) => {
                    try {
                      await onUpdateBookingStatus(bookingId, newStatus);
                    } catch (error) {
                      console.error('Error updating booking status:', error);
                    }
                  }}
                  onRequestCompletion={async (bookingId) => {
                    try {
                      console.log('Handling completion request for booking:', bookingId);
                      const result = await handleRequestCompletion(bookingId);
                      console.log('Completion request result:', result);
                      if (result?.success) {
                        alert('Completion request sent successfully!');
                        await onRefreshBookings();
                      } else {
                        throw new Error(result?.message || 'Failed to request completion');
                      }
                    } catch (error) {
                      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                      console.error('Error in onRequestCompletion:', errorMessage);
                      alert(`Error: ${errorMessage}`);
                    }
                  }}
                  onOpenDetail={onOpenDetailModal}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
  },
  titleCurrent: {
    color: '#000000', // Black for "Current"
  },
  titleBookings: {
    color: '#FF6200', // Orange for "Bookings"
  },
  pickerWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6200',
    overflow: 'hidden',
    minWidth: 120,
    maxWidth: 180,
    width: 140,
    flex: 0,
  },
  picker: {
    width: 140,
    height: 36,
    backgroundColor: '#FFFFFF',
    color: '#FF6200',
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
  },
});

export default BookingSection;