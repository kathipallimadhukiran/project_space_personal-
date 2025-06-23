import React, { useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { Booking, BookingStatus } from '../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BASE_URL } from '../utils/api';

interface BookingCardProps {
  booking: Booking;
  onUpdateStatus: (bookingId: string, newStatus: string) => void;
  onRequestCompletion?: (bookingId: string) => Promise<void>;
  onOpenDetail?: (booking: Booking) => void;
  isClientView?: boolean;
}

const BookingCard: React.FC<BookingCardProps> = ({ 
  booking, 
  onUpdateStatus, 
  onRequestCompletion,
  onOpenDetail,
  isClientView = false 
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Animate on press
  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: 100,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  };

  // Helper function to normalize status for comparison
  const normalizeStatus = (status: BookingStatus | string): string => {
    if (!status) return 'Pending';
    
    const statusStr = typeof status === 'string' ? status : String(status);
    
    const statusLower = statusStr.toLowerCase().trim();
    const statusMap: Record<string, string> = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'in progress': 'In Progress',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'rejected': 'Rejected',
      'cancelled': 'Cancelled'
    };
    
    return statusMap[statusLower] || statusStr;
  };

  // Get theme for status badge
  const getStatusTheme = (status: BookingStatus | string) => {
    const statusNormalized = normalizeStatus(status);
    
    const statusLower = statusNormalized.toLowerCase();
    
    if (statusLower.includes('pending')) {
      return { color: '#FF6200', icon: 'progress-clock' }; // Orange for Pending
    } else if (statusLower.includes('confirm')) {
      return { color: '#FF6200', icon: 'check-circle-outline' }; // Orange for Confirmed
    } else if (statusLower.includes('progress') || statusLower === 'in progress') {
      return { color: '#FF6200', icon: 'hammer-wrench' }; // Orange for In Progress
    } else if (statusLower.includes('complete')) {
      return { color: '#22C55E', icon: 'flag-checkered' }; // Green for Completed
    } else if (statusLower.includes('reject') || statusLower.includes('cancel')) {
      return { color: '#EF4444', icon: 'close-circle-outline' }; // Red for Rejected/Cancelled
    }
    
    return { color: '#64748B', icon: 'information-outline' }; // Gray fallback
  };

  // Handle completion request
  const handleRequestCompletion = async () => {
    if (onRequestCompletion) {
      try {
        await onRequestCompletion(booking._id);
      } catch (error) {
        console.error('Error requesting completion:', error);
      }
    }
  };

  // Format date with error handling
  const formatDate = (dateString: string | Date | undefined): string => {
    if (!dateString) return 'Date not set';
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Helper function to capitalize first letter of each word
  const capitalize = (str: string): string => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get display values with fallbacks
  const displayValues = useMemo(() => {
    console.group('BookingCard - Processing Booking');
    console.log('1. Raw booking status:', {
      value: booking.status,
      type: typeof booking.status,
      isString: typeof booking.status === 'string',
      isEnum: booking.status in BookingStatus
    });
    
    const status = booking.status || 'Pending';
    console.log('2. After fallback:', status);
    
    const normalizedStatus = normalizeStatus(status);
    console.log('3. After normalization:', normalizedStatus);
    
    const capitalizedStatus = capitalize(normalizedStatus);
    console.log('4. After capitalization:', capitalizedStatus);
    
    const finalStatus = Object.values(BookingStatus).includes(capitalizedStatus as BookingStatus)
      ? capitalizedStatus
      : 'Pending';
      
    console.log('5. Final status:', finalStatus);
    console.groupEnd();
    
    return {
      serviceName: booking.serviceName || booking.serviceType || 'Service',
      clientName: booking.clientName || booking.customerEmail?.split('@')[0] || 'Customer',
      clientPhone: booking.clientPhone || booking.customerPhone || 'Phone not provided',
      date: formatDate(booking.bookingDate || booking.date),
      location: booking.address?.text || booking.location || 'Location not provided',
      price: booking.price ? `$${booking.price.toFixed(2)}` : 'Price not set',
      status: finalStatus
    };
  }, [booking]);

  const statusTheme = getStatusTheme(booking.status);

  // Split service name into words and alternate colors
  const renderServiceName = () => {
    const words = displayValues.serviceName.split(' ');
    return words.map((word, index) => (
      <Text key={index} style={index % 2 === 0 ? styles.serviceNameBlack : styles.serviceNameOrange}>
        {word}{index < words.length - 1 ? ' ' : ''}
      </Text>
    ));
  };

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onOpenDetail && onOpenDetail(booking)}
        activeOpacity={onOpenDetail ? 0.8 : 1}
      >
        <View style={styles.headerRow}>
          <Text style={styles.serviceNameContainer} numberOfLines={1} ellipsizeMode="tail">
            {renderServiceName()}
          </Text>
          <View style={[styles.statusBadge, { borderColor: statusTheme.color }]}>
            <Icon name={statusTheme.icon} size={16} color={statusTheme.color} style={{ marginRight: 4 }} />
            <Text style={[styles.statusText, { color: statusTheme.color }]}>
              {displayValues.status}
            </Text>
          </View>
        </View>

        {booking.completionRequested && (
          <View style={styles.pendingBadge}>
            <Icon name="clock" size={14} color="#FF6200" />
            <Text style={styles.pendingText}>Pending Client Confirmation</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Icon name="account" size={15} color="#FF6200" style={styles.infoIcon} />
            <Text style={styles.infoText} numberOfLines={1} ellipsizeMode="tail">
              {displayValues.clientName}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="calendar" size={15} color="#FF6200" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              {displayValues.date}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="map-marker" size={15} color="#FF6200" style={styles.infoIcon} />
            <Text style={styles.infoText} numberOfLines={1} ellipsizeMode="tail">
              {displayValues.location}
            </Text>
          </View>
          {/* Coordinates display */}
          {booking.address && booking.address.coordinates &&
            (typeof booking.address.coordinates.lat === 'number' && typeof booking.address.coordinates.lng === 'number') &&
            (booking.address.coordinates.lat !== 0 || booking.address.coordinates.lng !== 0) && (
              <View style={styles.infoItem}>
                <Icon name="crosshairs-gps" size={15} color="#FF6200" style={styles.infoIcon} />
                <Text style={styles.infoText} numberOfLines={1} ellipsizeMode="tail">
                  Lat: {booking.address.coordinates.lat}, Lng: {booking.address.coordinates.lng}
                </Text>
              </View>
          )}
          <View style={styles.infoItem}>
            <Icon name="cash" size={15} color="#FF6200" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              {displayValues.price}
            </Text>
          </View>
        </View>

        {booking.notes ? (
          <View style={styles.notesContainer}>
            <Text style={styles.notes} numberOfLines={2} ellipsizeMode="tail">
              Notes: {String(booking.notes || '')}
            </Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          {!isClientView && (
            <>
              {normalizeStatus(booking.status) === 'Pending' && (
                <>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.primaryButton]} 
                    onPress={() => onUpdateStatus(booking._id, 'Confirmed')}
                  >
                    <Text style={styles.buttonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.secondaryButton]} 
                    onPress={() => onUpdateStatus(booking._id, 'Rejected')}
                  >
                    <Text style={styles.buttonText}>Reject</Text>
                  </TouchableOpacity>
                </>
              )}
              {normalizeStatus(booking.status) === 'Confirmed' && (
                <>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.primaryButton]} 
                    onPress={() => onUpdateStatus(booking._id, 'In Progress')}
                  >
                    <Text style={styles.buttonText}>Start Job</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.secondaryButton]} 
                    onPress={() => onUpdateStatus(booking._id, 'Cancelled')}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
              {normalizeStatus(booking.status) === 'In Progress' && !booking.completionRequested && (
                <>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.primaryButton]} 
                    onPress={handleRequestCompletion}
                  >
                    <Text style={styles.buttonText}>Request Completion</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.secondaryButton]} 
                    onPress={() => onUpdateStatus(booking._id, 'Cancelled')}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
              {normalizeStatus(booking.status) === 'In Progress' && booking.completionRequested && (
                <View style={styles.buttonRow}>
                  <View style={[styles.statusBadge, { backgroundColor: '#FFF7E6', flex: 1 }]}>
                    <Icon name="clock" size={16} color="#FF6200" style={{ marginRight: 4 }} />
                    <Text style={styles.pendingText}>Completion Requested</Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.secondaryButton, { marginLeft: 8, flex: 0.5 }]} 
                    onPress={() => onUpdateStatus(booking._id, 'Cancelled')}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
              {normalizeStatus(booking.status) === 'Completed' && (
                <View style={[styles.completedBadge, { flex: 1 }]}>
                  <Icon name="check-circle" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.completedText}>
                    Completed {booking.completedAt ? new Date(booking.completedAt).toLocaleDateString() : ''}
                  </Text>
                </View>
              )}
            </>
          )}

          {isClientView && booking.completionRequested && (
            <>
              <TouchableOpacity 
                style={[styles.actionButton, styles.primaryButton]} 
                onPress={async () => {
                  try {
                    const response = await fetch(`${BASE_URL}/api/bookings/${booking._id}/confirm-completion`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    });
                    const result = await response.json();
                    if (result.success) {
                      onUpdateStatus(booking._id, 'Completed');
                    } else {
                      console.error('Failed to confirm completion:', result.message);
                      alert(`Failed to confirm completion: ${result.message}`);
                    }
                  } catch (error) {
                    console.error('Error confirming completion:', error);
                    alert('Failed to confirm completion. Please try again.');
                  }
                }}
              >
                <Text style={styles.buttonText}>Confirm Completion</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.secondaryButton]} 
                onPress={async () => {
                  try {
                    const response = await fetch(`${BASE_URL}/api/bookings/${booking._id}/reject-completion`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    });
                    const result = await response.json();
                    if (result.success) {
                      onUpdateStatus(booking._id, 'In Progress');
                    } else {
                      console.error('Failed to reject completion:', result.message);
                      alert(`Failed to reject completion: ${result.message}`);
                    }
                  } catch (error) {
                    console.error('Error rejecting completion:', error);
                    alert('Failed to reject completion. Please try again.');
                  }
                }}
              >
                <Text style={styles.buttonText}>Reject</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceNameContainer: {
    flex: 1,
    marginRight: 8,
  },
  serviceNameBlack: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000', // Black for alternating words
  },
  serviceNameOrange: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FF6200', // Orange for alternating words
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  statusText: {
    fontWeight: '600',
    fontSize: 12,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#000000',
  },
  notesContainer: {
    marginBottom: 12,
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 8,
  },
  notes: {
    fontSize: 12,
    color: '#000000',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  primaryButton: {
    backgroundColor: '#FF6200', // Orange for primary actions
    shadowColor: '#FF6200',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: '#64748B', // Gray for secondary actions
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completedText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  pendingBadge: {
    backgroundColor: '#FFF7E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6200',
  },
  pendingText: {
    color: '#FF6200',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default BookingCard;