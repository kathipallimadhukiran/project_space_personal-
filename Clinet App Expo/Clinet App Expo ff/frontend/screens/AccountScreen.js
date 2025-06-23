import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  RefreshControl,
  Dimensions 
} from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppState } from 'react-native';
import AccountSkeleton from '../components/AccountSkeleton';

const USER_EMAIL = globalThis.loggedInUserEmail || 'manieerr@gmail.com';

const AccountScreen = ({ navigation }) => {
  const navigationHook = useNavigation();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // For forcing layout refresh
  const { logout } = useAuth();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } catch (error) {
      console.error('Refresh error:', error);
      Alert.alert('Error', 'Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const fetchData = async () => {
    // Only show loading indicator if it's not a pull-to-refresh action
    if (!refreshing) {
      setLoading(true);
    }
    
    try {
      // Fetch user data
      const userRes = await fetch(`${API_URL}user/${USER_EMAIL}`);
      let userData = await userRes.json();
      
      // Ensure avatar URL is properly constructed
      if (userData.avatar) {
        console.log('Original avatar path:', userData.avatar);
        
        if (userData.avatar.startsWith('http')) {
          // Replace 0.0.0.0 with actual local IP if present
          if (userData.avatar.includes('0.0.0.0')) {
            const { LOCAL_IP } = require('../config');
            userData.avatar = userData.avatar.replace('0.0.0.0', LOCAL_IP);
            console.log('Replaced 0.0.0.0 in avatar URL:', userData.avatar);
          } else {
            // Already a full URL, use as is
            console.log('Using full avatar URL:', userData.avatar);
          }
        } else if (userData.avatar.startsWith('/uploads/')) {
          // Local path, construct full URL using LOCAL_IP
          const { LOCAL_IP } = require('../config');
          userData.avatar = `http://${LOCAL_IP}:1000${userData.avatar}`;
          console.log('Constructed avatar URL:', userData.avatar);
        } else {
          // Handle other cases or relative paths
          console.log('Unexpected avatar path format:', userData.avatar);
          userData.avatar = null; // Fallback to initials
        }
      } else {
        console.log('No avatar found for user');
      }
      
      setUser(userData);
      
      // Fetch other data in parallel
      const [bookingsRes, reviewsRes, paymentsRes] = await Promise.all([
        fetch(`${API_URL}bookings/user/${USER_EMAIL}`),
        fetch(`${API_URL}reviews?user=${USER_EMAIL}`),
        fetch(`${API_URL}payments?user=${USER_EMAIL}`)
      ]);
      
      const bookingsData = await bookingsRes.json();
      const reviewsData = await reviewsRes.json();
      const paymentsData = await paymentsRes.json();
      
      // Log completed works
      const completedBookings = Array.isArray(bookingsData) ? 
        bookingsData.filter(booking => booking.status === 'completed') : [];
      
      console.log('=== COMPLETED WORKS ===');
      console.log('Total completed bookings:', completedBookings.length);
      completedBookings.forEach((booking, index) => {
        console.log(`\n--- Completed Work #${index + 1} ---`);
        console.log('Booking ID:', booking._id);
        console.log('Service Type:', booking.serviceType);
        console.log('Worker ID:', booking.workerId);
        console.log('Worker Email:', booking.workerEmail);
        console.log('Booking Date:', booking.bookingDate);
        console.log('Status:', booking.status);
        console.log('Price:', booking.price);
        console.log('Service Fee:', booking.serviceFee);
        console.log('Total Amount:', booking.totalAmount);
        console.log('Created At:', booking.createdAt);
        console.log('Updated At:', booking.updatedAt);
        console.log('Is Reviewed:', booking.isReviewed);
        console.log('Review ID:', booking.reviewId);
      });
      
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load profile data. Please try again.');
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

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

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', { user });
  };
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Logout', 
        style: 'destructive', 
        onPress: async () => {
          await logout();
        }
      }
    ]);
  };
  const handleDeleteAccount = async () => {
    Alert.alert('Delete Account', 'Are you sure you want to delete your account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await fetch(`${API_URL}user/${USER_EMAIL}`, { method: 'DELETE' });
        handleLogout();
      }}
    ]);
  };
  const handleResetPassword = () => {
    navigation.navigate('ResetPassword', { email: USER_EMAIL });
  };
  const handleHelpCenter = () => {
    Alert.alert('Help Center', 'For help, contact support@wefixit.com or call 1800-123-456.');
  };
  const handleReportProblem = () => {
    Alert.alert('Report a Problem', 'Please email your issue to support@wefixit.com or use the in-app chat.');
  };

  if (loading || !user) {
    return <AccountSkeleton />;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']} key={refreshKey}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} hidden={false} />
        <ScrollView 
          style={styles.scrollView}
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
          contentContainerStyle={styles.scrollViewContent}
        >
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarShadow}>
              {user.avatar ? (
                <Image 
                  source={{ uri: user.avatar, cache: 'reload', headers: { 'Cache-Control': 'no-cache' } }} 
                  style={styles.avatar}
                  onError={(e) => {
                    setUser(prev => ({ ...prev, avatar: null, failedToLoadAvatar: true }));
                  }}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.username}>{user.name || user.email}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <TouchableOpacity style={styles.editProfileBtn} onPress={handleEditProfile}>
              <Feather name="edit" size={18} color="#fc8019" />
              <Text style={styles.editProfileBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{bookings.length}</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{reviews.length}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{payments.length}</Text>
              <Text style={styles.statLabel}>Payments</Text>
            </View>
          </View>

          {/* Features Section */}
          <View style={styles.sectionCard}>
            <TouchableOpacity style={styles.featureItem} onPress={() => navigation.navigate('Bookings')}>
              <MaterialIcons name="event-note" size={20} color="#fc8019" style={{ marginRight: 10 }} />
              <Text style={styles.featureText}>My Bookings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.featureItem} onPress={() => navigation.navigate('Reviews', { reviews })}>
              <Ionicons name="star-outline" size={20} color="#fc8019" style={{ marginRight: 10 }} />
              <Text style={styles.featureText}>My Reviews</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.featureItem} onPress={() => navigation.navigate('Payments', { payments })}>
              <MaterialIcons name="payment" size={20} color="#fc8019" style={{ marginRight: 10 }} />
              <Text style={styles.featureText}>Payments</Text>
            </TouchableOpacity>
          </View>

          {/* Help Section */}
          <View style={styles.sectionCard}>
            <TouchableOpacity style={styles.featureItem} onPress={handleHelpCenter}>
              <Ionicons name="help-circle-outline" size={20} color="#fc8019" style={{ marginRight: 10 }} />
              <Text style={styles.featureText}>Help Center</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.featureItem} onPress={handleReportProblem}>
              <MaterialIcons name="report-problem" size={20} color="#fc8019" style={{ marginRight: 10 }} />
              <Text style={styles.featureText}>Report a Problem</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Actions */}
          <View style={styles.bottomActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.resetBtn]} 
              onPress={handleResetPassword}
            >
              <MaterialIcons name="lock-reset" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Reset Password</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.logoutBtn]} 
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={18} color="#fc8019" />
              <Text style={[styles.actionButtonText, styles.logoutBtnText]}>Logout</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteBtn]} 
              onPress={handleDeleteAccount}
            >
              <MaterialIcons name="delete-outline" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default AccountScreen;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollViewContent: {
    paddingBottom: 80, // Increased to ensure content is not cut off
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  logo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a2a4e',
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 18,
  },
  avatarShadow: {
    shadowColor: '#fc8019',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    borderRadius: 70,
    backgroundColor: '#fff',
    padding: 4,
    marginBottom: 8,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#fc8019',
    backgroundColor: '#f0f0f0',
    resizeMode: 'cover',
  },
  avatarFallback: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#fc8019',
    backgroundColor: '#fc8019',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 100,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 6,
    marginBottom: 2,
    textAlign: 'center',
  },
  userEmail: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fc8019',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  editProfileBtnText: {
    color: '#fc8019',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 24,
    marginBottom: 18,
    marginTop: 2,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#fc8019',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fc8019',
  },
  statLabel: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 18,
    marginVertical: 8,
    padding: 12,
    elevation: 2,
    shadowColor: '#fc8019',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  featureText: {
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
  },
  bottomActions: {
    marginTop: 24,
    marginBottom: 32,
    marginHorizontal: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    paddingVertical: 12,
    marginBottom: 12,
    elevation: 1,
  },
  resetBtn: {
    backgroundColor: '#fc8019',
  },
  logoutBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fc8019',
  },
  logoutBtnText: {
    color: '#fc8019',
    fontWeight: 'bold',
  },
  deleteBtn: {
    backgroundColor: '#e53935',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});