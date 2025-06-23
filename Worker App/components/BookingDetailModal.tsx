import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking, Platform } from 'react-native';
import { Booking, BookingStatus } from '../types';
import { BOOKING_STATUS_OPTIONS } from '../constants';
import Modal from './Modal';

interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  onUpdateStatus: (bookingId: string, newStatus: BookingStatus) => void;
}

const getStatusTheme = (status: BookingStatus) => {
  switch (status) {
    case BookingStatus.PENDING:
      return { bg: '#FEF3C7', text: '#F59E42', icon: 'ℹ️' };
    case BookingStatus.CONFIRMED:
      return { bg: '#E0F2FE', text: '#38BDF8', icon: '✅' };
    case BookingStatus.IN_PROGRESS:
      return { bg: '#E0E7FF', text: '#6366F1', icon: 'ℹ️' };
    case BookingStatus.COMPLETED:
      return { bg: '#DCFCE7', text: '#22C55E', icon: '✅' };
    case BookingStatus.REJECTED:
    case BookingStatus.CANCELLED:
      return { bg: '#FECACA', text: '#EF4444', icon: '❌' };
    default:
      return { bg: '#F1F5F9', text: '#64748b', icon: 'ℹ️' };
  }
};

const formatDate = (dateString: string | Date | undefined): string => {
  if (!dateString) return 'Date not set';
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

const BookingDetailModal: React.FC<BookingDetailModalProps> = ({ isOpen, onClose, booking, onUpdateStatus }) => {
  if (!isOpen || !booking) return null;

  // Get display values with fallbacks
  const displayValues = useMemo(() => ({
    serviceName: booking.serviceName || booking.serviceType || 'Service',
    clientName: booking.clientName || booking.customerEmail?.split('@')[0] || 'Customer',
    clientPhone: booking.clientPhone || booking.customerPhone || 'Phone not provided',
    date: formatDate(booking.bookingDate || booking.date),
    location: booking.address?.text || booking.location || 'Location not provided',
    price: booking.price ? `$${booking.price.toFixed(2)}` : 'Price not set',
    status: booking.status || 'Pending',
    phoneForCall: booking.clientPhone || booking.customerPhone,
    canCall: !!(booking.clientPhone || booking.customerPhone)
  }), [booking]);

  const statusTheme = getStatusTheme(booking.status);
  
  const availableActions = BOOKING_STATUS_OPTIONS.filter(status => {
    if (booking.status === BookingStatus.PENDING) {
      return [
        BookingStatus.CONFIRMED, 
        BookingStatus.REJECTED, 
        BookingStatus.CANCELLED
      ].includes(status);
    }
    if (booking.status === BookingStatus.CONFIRMED) {
      return [
        BookingStatus.IN_PROGRESS, 
        BookingStatus.CANCELLED
      ].includes(status);
    }
    if (booking.status === BookingStatus.IN_PROGRESS) {
      return [
        BookingStatus.COMPLETED, 
        BookingStatus.CANCELLED
      ].includes(status);
    }
    return false;
  });

  const handleCallPress = () => {
    if (!displayValues.phoneForCall) return;
    const phoneUrl = Platform.OS === 'android' 
      ? `tel:${displayValues.phoneForCall}` 
      : `telprompt:${displayValues.phoneForCall}`;
    Linking.openURL(phoneUrl);
  };

  const handleNavigatePress = () => {
    // Prefer coordinates if available and valid
    if (
      booking.address && booking.address.coordinates &&
      typeof booking.address.coordinates.lat === 'number' &&
      typeof booking.address.coordinates.lng === 'number' &&
      (booking.address.coordinates.lat !== 0 || booking.address.coordinates.lng !== 0)
    ) {
      const { lat, lng } = booking.address.coordinates;
      Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`);
      return;
    }
    // Fallback to address text
    if (displayValues.location && displayValues.location !== 'Location not provided') {
      Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(displayValues.location)}`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={displayValues.serviceName}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.statusBox, { backgroundColor: statusTheme.bg }]}> 
          <Text style={[styles.statusIcon, { color: statusTheme.text }]}>{statusTheme.icon}</Text>
          <Text style={[styles.statusText, { color: statusTheme.text }]}>Status: {displayValues.status}</Text>
        </View>
        
        <View style={[styles.infoBox, styles.infoBoxCard]}>
          <Text style={styles.label}>Client:</Text>
          <Text style={styles.value}>{displayValues.clientName}</Text>
        </View>
        
        <View style={[styles.infoBox, styles.infoBoxCard]}>
          <Text style={styles.label}>Date & Time:</Text>
          <Text style={styles.value}>{displayValues.date}</Text>
        </View>
        
        <View style={[styles.infoBox, styles.infoBoxCard]}>
          <Text style={styles.label}>Location:</Text>
          <Text style={styles.value}>{displayValues.location}</Text>
        </View>
        
        <View style={[styles.infoBox, styles.infoBoxCard]}>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>{displayValues.clientPhone}</Text>
        </View>
        
        {booking.notes ? (
          <View style={[styles.infoBox, styles.infoBoxCard]}>
            <Text style={styles.label}>Notes:</Text>
            <Text style={styles.notes}>{booking.notes}</Text>
          </View>
        ) : null}
        
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary, !displayValues.location && { opacity: 0.5 }]}
            onPress={handleNavigatePress}
            disabled={!displayValues.location || displayValues.location === 'Location not provided'}
          >
            <Text style={styles.actionIcon}>📍</Text>
            <Text style={styles.actionLabel}>Navigate</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary, !displayValues.canCall && { opacity: 0.5 }]}
            onPress={handleCallPress}
            disabled={!displayValues.canCall}
          >
            <Text style={styles.actionIcon}>📞</Text>
            <Text style={styles.actionLabel}>{displayValues.canCall ? 'Call Client' : 'No Phone'}</Text>
          </TouchableOpacity>
        </View>
        
        {availableActions.length > 0 && (
          <View style={styles.statusUpdateBox}>
            <Text style={styles.statusUpdateLabel}>Update Status:</Text>
            <View style={styles.statusUpdateRow}>
              {availableActions.map(status => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusUpdateButton, 
                    (status === BookingStatus.CONFIRMED || status === BookingStatus.COMPLETED) 
                      ? styles.statusUpdateButtonSuccess 
                      : status === BookingStatus.IN_PROGRESS 
                        ? styles.statusUpdateButtonPrimary 
                        : styles.statusUpdateButtonDanger
                  ]}
                  onPress={() => onUpdateStatus(booking._id, status)}
                >
                  <Text style={styles.statusUpdateButtonText}>Mark as {status}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  infoBox: {
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#22223b',
  },
  value: {
    fontSize: 13,
    color: '#22223b',
  },
  notes: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
    backgroundColor: '#f1f5f9',
    padding: 6,
    borderRadius: 6,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 10,
    marginHorizontal: 4,
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  actionLabel: {
    fontSize: 13,
    color: '#fff',
    fontWeight: 'bold',
  },
  statusUpdateBox: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  statusUpdateLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 6,
  },
  statusUpdateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusUpdateButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statusUpdateButtonSuccess: {
    backgroundColor: '#22C55E',
  },
  statusUpdateButtonPrimary: {
    backgroundColor: '#0ea5e9',
  },
  statusUpdateButtonDanger: {
    backgroundColor: '#ef4444',
  },
  statusUpdateButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  infoBoxCard: {
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 10,
  },
  actionButtonPrimary: {
    backgroundColor: '#000',
  },
});

export default BookingDetailModal; 