import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Clipboard,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import ReviewForm from '../components/ReviewForm';
import { API_URL } from '../config';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppState } from 'react-native';
import BookingsSkeleton from '../components/BookingsSkeleton';

// Utility function to normalize status
const normalizeStatus = (status) => {
  if (!status) return '';
  return status.toLowerCase().replace(/\s+/g, '-');
};

const TABS = [
  { 
    label: 'Upcoming', 
    status: ['pending', 'confirmed', 'in-progress'],
    filter: (booking) => {
      const normalizedStatus = normalizeStatus(booking.status);
      const isUpcoming = ['pending', 'confirmed', 'in-progress'].includes(normalizedStatus);
      console.log(`Booking ${booking._id} - Status: ${booking.status} (normalized: ${normalizedStatus}), Is Upcoming: ${isUpcoming}`);
      return isUpcoming;
    }
  },
  { 
    label: 'Completed', 
    status: ['completed'],
    filter: (booking) => {
      const normalizedStatus = normalizeStatus(booking.status);
      const isCompleted = normalizedStatus === 'completed';
      console.log(`Booking ${booking._id} - Status: ${booking.status} (normalized: ${normalizedStatus}), Is Completed: ${isCompleted}`);
      return isCompleted;
    }
  },
  { 
    label: 'Cancelled', 
    status: ['cancelled'],
    filter: (booking) => {
      const normalizedStatus = normalizeStatus(booking.status);
      return normalizedStatus === 'cancelled';
    }
  },
];

const BookingsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // For forcing layout refresh
  const navigationHook = useNavigation();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [expandedBookingId, setExpandedBookingId] = useState(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('App resumed, forcing layout refresh');
        setRefreshKey((prev) => prev + 1); // Trigger re-render
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      const nav = navigation || navigationHook;
      if (nav) {
        nav.navigate('Login');
      }
      return;
    }
    fetchBookings();
  }, [user, navigation]);

  if (!user) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom', 'left', 'right']}>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} hidden={false} />
          <Text>Please log in to view your bookings</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const fetchBookings = async () => {
    if (!user?.email) {
      console.log('No user email found');
      return;
    }
    
    try {
      // Only show loading indicator if it's not a pull-to-refresh action
      if (!refreshing) {
        setLoading(true);
      }
      const activeTabData = TABS.find(tab => tab.label === activeTab);
      
      console.log(`Fetching bookings for: ${user.email}, Active tab: ${activeTab}`);
      
      const response = await fetch(
        `${API_URL}bookings/user/${encodeURIComponent(user.email)}`
      );
      console.log('Fetching from URL:', `${API_URL}bookings/user/${encodeURIComponent(user.email)}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to fetch bookings: ${response.status} ${response.statusText}`);
      }
      
      let data = await response.json();
      if (!Array.isArray(data)) {
        console.log('No bookings data received or invalid format');
        data = [];
      } else {
        console.log(`Received ${data.length} total bookings from API`);
        console.log('All booking statuses:', data.map(b => ({
          id: b._id,
          status: b.status,
          normalizedStatus: normalizeStatus(b.status),
          serviceType: b.serviceType,
          date: b.bookingDate,
          completionRequested: b.completionRequested,
          completed: b.completed
        })));
        
        if (data.length > 0) {
          console.log('First booking details:', JSON.stringify(data[0], null, 2));
        }
      }
      
      const filteredBookings = data.filter(activeTabData.filter);
      console.log(`Found ${filteredBookings.length} ${activeTab.toLowerCase()} bookings`);
      console.log('Filtered bookings:', filteredBookings.map(b => ({
        id: b._id,
        status: b.status,
        serviceType: b.serviceType
      })));
      
      setBookings(filteredBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', error.message || 'Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [activeTab, user?.email]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchBookings();
      // Reset any active tab filters if needed
      // setActiveTab('Upcoming'); // Uncomment if you want to reset to Upcoming tab on refresh
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCancelBooking = (bookingId) => {
    setCancellingBookingId(bookingId);
    setShowCancelModal(true);
  };

  const submitCancelBooking = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for cancellation.');
      return;
    }
    try {
      const response = await fetch(`${API_URL}bookings/${cancellingBookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', cancellationReason: cancelReason }),
      });
      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }
      setShowCancelModal(false);
      setCancelReason('');
      setCancellingBookingId(null);
      fetchBookings();
      Alert.alert('Success', 'Booking has been cancelled');
    } catch (error) {
      setShowCancelModal(false);
      setCancelReason('');
      setCancellingBookingId(null);
      Alert.alert('Error', 'Failed to cancel booking. Please try again.');
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    try {
      Alert.alert(
        'Complete Booking',
        'Are you sure you want to confirm the service is completed?',
        [
          {
            text: 'No',
            style: 'cancel',
          },
          {
            text: 'Yes, Complete',
            onPress: async () => {
              try {
                let response = await updateBookingStatus(bookingId, true);
                
                if (!response.ok) {
                  console.log('Status update endpoint failed, trying general update endpoint');
                  response = await updateBookingStatus(bookingId, false);
                }

                const responseText = await response.text();
                let data = {};
                
                try {
                  data = responseText ? JSON.parse(responseText) : {};
                } catch (e) {
                  console.error('Failed to parse JSON:', e, 'Response:', responseText);
                  if (responseText.includes('<html>')) {
                    throw new Error('Server returned an error page. Please check the server logs.');
                  }
                  throw new Error('Received invalid response from server');
                }
                
                if (!response.ok) {
                  throw new Error(data.message || `Server returned ${response.status}`);
                }

                await fetchBookings();
                Alert.alert('Success', 'Thank you for confirming the service completion!');
              } catch (error) {
                console.error('Error updating booking status:', error);
                Alert.alert(
                  'Error', 
                  error.message || 'Failed to update booking status. Please try again.'
                );
              }
            },
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Error in handleCompleteBooking:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const updateBookingStatus = async (bookingId, useStatusEndpoint) => {
    const url = useStatusEndpoint 
      ? `${API_URL}bookings/${bookingId}/status`
      : `${API_URL}bookings/${bookingId}`;
    
    const updateData = {
      status: 'completed',
      completed: true,
      completedAt: new Date().toISOString(),
      completionRequested: false
    };
    
    console.log('Updating booking with data:', updateData);
    
    return fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
  };

  const getStatusBadgeStyle = (status) => {
    const normalized = normalizeStatus(status);
    console.log(`Getting style for status: ${status} (normalized: ${normalized})`);
    
    switch (normalized) {
      case 'pending':
        return styles.statusBadgePending;
      case 'confirmed':
        return styles.statusBadgeConfirmed;
      case 'in-progress':
        return styles.statusBadgeInProgress;
      case 'completed':
        return styles.statusBadgeCompleted;
      case 'cancelled':
        return styles.statusBadgeCancelled;
      default:
        console.warn(`Unknown status: ${status} (normalized: ${normalized}), using default style`);
        return styles.statusBadgeDefault;
    }
  };

  const getStatusLabel = (status) => {
    const normalized = normalizeStatus(status);
    
    if (normalized === 'in-progress') return 'In Progress';
    if (normalized === 'accepted') return 'Accepted';
    
    return status
      .split(/[-\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatDate = (dateString) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) return 'Date not available';
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getStatusIcon = (status) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case 'pending': return 'time-outline';
      case 'confirmed': return 'checkmark-circle-outline';
      case 'in-progress': return 'play-circle-outline';
      case 'completed': return 'checkmark-done-circle-outline';
      case 'cancelled': return 'close-circle-outline';
      default: return 'ellipse-outline';
    }
  };

  const filteredBookings = bookings
    .filter(b => {
      const q = search.toLowerCase();
      return (
        (b.serviceId?.title || b.serviceType || '').toLowerCase().includes(q) ||
          (b.workerId?.name || '').toLowerCase().includes(q) ||
          (typeof b.address === 'object' ? b.address.text : b.address || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.bookingDate) - new Date(a.bookingDate);
      if (sortBy === 'status') return (a.status || '').localeCompare(b.status || '');
      return 0;
    });

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']} key={refreshKey}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} hidden={false} />
        {selectedBooking && (
          <ReviewForm
            visible={showReviewForm}
            onClose={(success) => {
              setShowReviewForm(false);
              setSelectedBooking(null);
              if (success) {
                fetchBookings();
              }
            }}
            bookingId={selectedBooking._id}
            worker={{
              id: selectedBooking.workerId?._id || selectedBooking.workerId || 'unknown-worker-id',
              name: selectedBooking.workerId?.name || selectedBooking.workerName || 'Worker',
              email: (typeof selectedBooking.workerId === 'object' && selectedBooking.workerId?.email)
                || selectedBooking.workerEmail
                || (typeof selectedBooking.workerId === 'string' ? selectedBooking.workerId : '')
                || 'worker@example.com'
            }}
            client={{
              id: user?._id,
              name: user?.name || 'You',
              email: user?.email || ''
            }}
          />
        )}
        <Modal
          visible={showCancelModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCancelModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}
          >
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '85%' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Cancel Booking</Text>
              <Text style={{ fontSize: 15, marginBottom: 8 }}>Please provide a reason for cancellation:</Text>
              <TextInput
                value={cancelReason}
                onChangeText={setCancelReason}
                placeholder="Enter reason..."
                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 16, minHeight: 40 }}
                multiline
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity onPress={() => { setShowCancelModal(false); setCancelReason(''); setCancellingBookingId(null); }} style={{ marginRight: 16 }}>
                  <Text style={{ color: '#888', fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={submitCancelBooking}>
                  <Text style={{ color: '#fc8019', fontWeight: 'bold', fontSize: 16 }}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh} 
              colors={['#fc8019']}
              tintColor="#fc8019"
              title="Refreshing..."
              titleColor="#666"
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.logo}>We<Text style={{ color: '#fc8019' }}>Fix</Text>It</Text>
          </View>
          <Text style={styles.sectionTitle}>My Bookings</Text>
          
          <View style={styles.tabsRow}>
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab.label}
                style={[styles.tabBtn, activeTab === tab.label && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab.label)}
              >
                <Text style={[styles.tabText, activeTab === tab.label && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 18, marginBottom: 12 }}>
            <TextInput
              style={{ flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#eee', marginRight: 8 }}
              placeholder="Search by service, worker, or address..."
              value={search}
              onChangeText={setSearch}
            />
            <TouchableOpacity onPress={() => setSortBy(sortBy === 'date' ? 'status' : 'date')} style={{ padding: 8, backgroundColor: '#fc8019', borderRadius: 8 }}>
              <Ionicons name={sortBy === 'date' ? 'calendar-outline' : 'funnel-outline'} size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <BookingsSkeleton />
          ) : bookings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No {activeTab.toLowerCase()} bookings found</Text>
            </View>
          ) : (
            <View style={styles.bookingsList}>
              {filteredBookings.map(booking => {
                const isExpanded = expandedBookingId === booking._id;
                const serviceImage = booking.serviceId?.images?.[0]
                  ? { uri: booking.serviceId.images[0] }
                  : require('../assets/logo.png');
                const workerAvatar = booking.workerId?.profilePicture?.url
                  ? { uri: booking.workerId.profilePicture.url }
                  : null;
                const startTime = new Date(booking.bookingDate);
                const endTime = new Date(booking.endDate || startTime.getTime() + 2 * 60 * 60 * 1000);
                const durationHrs = Math.round((endTime - startTime) / (60 * 60 * 1000));
                return (
                  <View key={booking._id} style={[styles.bookingCard, {
                    overflow: 'visible',
                    borderLeftWidth: 5,
                    borderLeftColor: getStatusBadgeStyle(booking.status).backgroundColor,
                    width: '99%',
                    alignSelf: 'center',
                    borderRadius: 18,
                    minHeight: 160,
                    justifyContent: 'space-between',
                    marginBottom: 18
                  }]}> 
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                      <Image source={serviceImage} style={{ width: 54, height: 54, borderRadius: 14, marginRight: 14, backgroundColor: '#eee' }} />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={[styles.bookingTitle, { fontSize: 19, fontWeight: 'bold', marginBottom: 2 }]}>{(booking.serviceId?.title || booking.serviceType || 'Service').toUpperCase()}</Text>
                          {/* Completion Request Indicator */}
                          {booking.completionRequested && !booking.completed && (
                            <View style={styles.completionIndicator}></View>
                          )}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                          {workerAvatar ? (
                            <Image source={workerAvatar} style={{ width: 26, height: 26, borderRadius: 13, marginRight: 6 }} />
                          ) : (
                            <Ionicons name="person-circle-outline" size={24} color="#888" style={{ marginRight: 6 }} />
                          )}
                          <Text style={[styles.bookingWorker, { fontSize: 15, fontWeight: '600' }]}>{booking.workerId?.name || 'Service Professional'}</Text>
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => setExpandedBookingId(isExpanded ? null : booking._id)} style={{ marginLeft: 8 }}>
                        <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={24} color="#888" />
                      </TouchableOpacity>
                    </View>
                    {/* Status and Time Row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[styles.statusBadge, getStatusBadgeStyle(booking.status), { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 14 }]}> 
                          <Ionicons name={getStatusIcon(booking.status)} size={15} color="#fff" style={{ marginRight: 5 }} />
                          <Text style={[styles.statusText, { fontSize: 13 }]}>{getStatusLabel(booking.status)}</Text>
                        </View>
                        {/* Completion Request Notification Badge */}
                        {booking.completionRequested && !booking.completed && (
                          <View style={styles.notificationBadge}>
                            <Ionicons name="notifications" size={12} color="#fff" />
                            <Text style={styles.notificationText}>Action Required</Text>
                          </View>
                        )}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="time-outline" size={17} color="#666" style={{ marginRight: 3 }} />
                        <Text style={{ fontSize: 14, color: '#333', fontWeight: '600' }}>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({durationHrs} hr{durationHrs > 1 ? 's' : ''})</Text>
                      </View>
                    </View>
                    {/* Date and Address Row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Ionicons name="calendar-outline" size={17} color="#666" style={{ marginRight: 3 }} />
                      <Text style={{ fontSize: 14, color: '#333', fontWeight: '500', marginRight: 10 }}>{startTime.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                      <Ionicons name="location-outline" size={17} color="#666" style={{ marginRight: 3 }} />
                      <Text style={{ fontSize: 14, color: '#333', flex: 1 }} numberOfLines={1} ellipsizeMode="tail">{typeof booking.address === 'object' ? booking.address.text : (booking.address || 'Address not specified')}</Text>
                      <TouchableOpacity onPress={() => Clipboard.setString(typeof booking.address === 'object' ? booking.address.text : (booking.address || ''))} style={{ marginLeft: 6 }}>
                        <Ionicons name="copy-outline" size={15} color="#888" />
                      </TouchableOpacity>
                    </View>
                    {/* Booking ID Row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ color: '#888', fontSize: 12, fontWeight: '600' }}>Booking ID: {booking._id.slice(-6)}</Text>
                    </View>
                    {isExpanded && (
                      <View style={{ marginTop: 10 }}>
                        <Text style={{ color: '#888', fontSize: 13, marginBottom: 4 }}>Notes:</Text>
                        <Text style={{ color: '#333', fontSize: 14, marginBottom: 8 }}>{booking.notes || 'No additional notes.'}</Text>
                        <Text style={{ color: '#888', fontSize: 13, marginBottom: 4 }}>Price Details:</Text>
                        <Text style={{ color: '#333', fontSize: 14, marginBottom: 8 }}>Service Fee: ${booking.serviceFee || 0} | Price: ${booking.price} | Total: ${booking.totalAmount}</Text>
                        <Text style={{ color: '#888', fontSize: 13, marginBottom: 4 }}>Payment Status:</Text>
                        <Text style={{ color: '#333', fontSize: 14, marginBottom: 8 }}>{booking.paymentStatus || 'pending'}</Text>
                        {booking.invoiceUrl && (
                          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }} onPress={() => Linking.openURL(booking.invoiceUrl)}>
                            <Ionicons name="document-outline" size={18} color="#fc8019" style={{ marginRight: 4 }} />
                            <Text style={{ color: '#fc8019', fontWeight: 'bold' }}>View Invoice</Text>
                          </TouchableOpacity>
                        )}
                        {/* Leave Review Button for Completed Bookings */}
                        {activeTab === 'Completed' && (
                          booking.isReviewed || booking.reviewId ? (
                            <View style={styles.reviewedBadge}>
                              <Ionicons name="checkmark-circle-outline" size={18} color="#2e7d32" style={styles.reviewedIcon} />
                              <Text style={styles.reviewedText}>Reviewed</Text>
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={styles.reviewButton}
                              onPress={() => {
                                setSelectedBooking(booking);
                                setShowReviewForm(true);
                              }}
                            >
                              <Text style={styles.reviewButtonText}>Leave Review</Text>
                            </TouchableOpacity>
                          )
                        )}
                      </View>
                    )}
                    {activeTab === 'Upcoming' && (normalizeStatus(booking.status) === 'pending' || normalizeStatus(booking.status) === 'confirmed') && (
                      <TouchableOpacity
                        style={{ backgroundColor: '#e53935', borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginTop: 8 }}
                        onPress={() => handleCancelBooking(booking._id)}
                      >
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Cancel Booking</Text>
                      </TouchableOpacity>
                    )}
                    
                    {/* Completion Request Handling */}
                    {activeTab === 'Upcoming' && normalizeStatus(booking.status) === 'in-progress' && booking.completionRequested && !booking.completed && (
                      <View style={styles.completionRequestContainer}>
                        <View style={styles.completionRequestHeader}>
                          <Ionicons name="checkmark-circle-outline" size={20} color="#4caf50" style={styles.completionIcon} />
                          <Text style={styles.completionRequestText}>
                            The worker has requested to mark this service as completed
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.completeButton}
                          onPress={() => handleCompleteBooking(booking._id)}
                        >
                          <Text style={styles.completeButtonText}>Complete Work</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    {/* In-Progress Status Indicator */}
                    {activeTab === 'Upcoming' && normalizeStatus(booking.status) === 'in-progress' && !booking.completionRequested && !booking.completed && (
                      <View style={[styles.completionRequestContainer, { backgroundColor: '#e3f2fd', borderLeftColor: '#1976d2' }]}>
                        <View style={styles.completionRequestHeader}>
                          <Ionicons name="play-circle-outline" size={20} color="#1976d2" style={styles.completionIcon} />
                          <Text style={[styles.completionRequestText, { color: '#1565c0' }]}>
                            The worker is currently providing the service
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
          
          <Text style={styles.footer}>
            {new Date().getFullYear()} WeFixIt Client App. All rights reserved.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7fa',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f6f7fa',
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 80, // Increased to ensure content clears bottom
  },
  header: {
    marginBottom: 16,
  },
  logo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a2a4e',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    marginHorizontal: 18,
    marginBottom: 12,
    marginTop: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    marginHorizontal: 18,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 16,
  },
  tabBtnActive: {
    borderBottomColor: '#fc8019',
  },
  tabText: {
    color: '#888',
    fontWeight: '600',
    fontSize: 16,
  },
  tabTextActive: {
    color: '#fc8019',
  },
  bookingsList: {
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
  footer: {
    textAlign: 'center',
    color: '#888',
    fontSize: 12,
    marginTop: 24,
    marginBottom: 24,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workerIcon: {
    marginRight: 8,
  },
  bookingWorker: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusBadgePending: {
    backgroundColor: '#ffb300',
  },
  statusBadgeConfirmed: {
    backgroundColor: '#4caf50',
  },
  statusBadgeInProgress: {
    backgroundColor: '#1976d2',
  },
  statusBadgeCompleted: {
    backgroundColor: '#7b1fa2',
  },
  statusBadgeCancelled: {
    backgroundColor: '#d32f2f',
  },
  statusBadgeDefault: {
    backgroundColor: '#616161',
  },
  completionRequestContainer: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  completionRequestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  completionIcon: {
    marginRight: 8,
  },
  completionRequestText: {
    color: '#2e7d32',
    fontSize: 14,
    flex: 1,
  },
  completeButton: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bookingDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailIcon: {
    width: 24,
    textAlign: 'center',
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  completedSection: {
    marginBottom: 16,
  },
  completedText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  reviewedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  reviewedIcon: {
    marginRight: 6,
  },
  reviewedText: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  notificationBadge: {
    backgroundColor: '#d32f2f',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  completionIndicator: {
    marginLeft: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d32f2f',
  },
});

export default BookingsScreen;