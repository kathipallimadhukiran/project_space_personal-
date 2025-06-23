import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import SplashScreen from './components/SplashScreen';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import OtpVerificationPage from './components/OtpVerificationPage';
import ProfileSection from './components/ProfileSection';
import BookingSection from './components/BookingSection';
import ServiceSection from './components/ServiceSection';
import ReviewsSection from './components/ReviewsSection';
import ActivityFeedSection from './components/ActivityFeedSection';
import AnalyticsSection from './components/AnalyticsSection';
import BookingDetailModal from './components/BookingDetailModal';
import { AppView, AuthView, OtpContext, WorkerProfile, Booking, Service, Review, PortfolioItem, ActivityItem, Theme, BookingStatus } from './types';
import {
  DEFAULT_PROFILE,
  INITIAL_BOOKINGS,
  INITIAL_SERVICES,
  INITIAL_REVIEWS,
  INITIAL_PORTFOLIO_ITEMS,
  INITIAL_ACTIVITY_ITEMS,
} from './constants';
import Modal from './components/Modal';
import * as api from './utils/api';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const AuthStack = createNativeStackNavigator();
const MainTab = createBottomTabNavigator();

function MainTabs({
  profile,
  setProfile,
  bookings,
  setBookings,
  services,
  setServices,
  reviews,
  setReviews,
  activityItems,
  setActivityItems,
  theme,
  setTheme,
  onLogout,
  onUpdateProfile,
  onUpdateBookingStatus,
  onRefreshBookings,
  isLoadingBookings,
}: any) {
  const insets = useSafeAreaInsets();
  // Modal open/close handlers (TODO: implement real modal logic)
  const [shareProfileModalOpen, setShareProfileModalOpen] = useState(false);
  const [bookingDetailModalOpen, setBookingDetailModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const handleOpenBookingDetail = (booking: Booking) => {
    setSelectedBooking(booking);
    setBookingDetailModalOpen(true);
  };
  const handleCloseBookingDetail = () => {
    setBookingDetailModalOpen(false);
    setSelectedBooking(null);
  };

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FF6200',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: { 
          fontSize: 11, 
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarIcon: ({ focused }) => {
          let iconName = '';
          switch (route.name) {
            case 'Bookings': 
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Services': 
              iconName = 'tools';
              break;
            case 'Reviews': 
              iconName = focused ? 'star' : 'star-outline';
              break;
            case 'Activity': 
              iconName = focused ? 'clock-time-four' : 'clock-time-four-outline';
              break;
            case 'Analytics': 
              iconName = focused ? 'chart-box' : 'chart-box-outline';
              break;
            case 'Profile': 
              iconName = focused ? 'account' : 'account-outline';
              break;
            default: 
              iconName = 'help-circle-outline';
          }
          return (
            <Icon 
              name={iconName} 
              size={24} 
              color={focused ? '#FF6200' : '#888'} 
            />
          );
        },
      })}
      initialRouteName="Bookings"
    >
      <MainTab.Screen name="Bookings" options={{ tabBarLabel: 'Bookings' }}>
        {() => (
          <>
            <BookingSection
              bookings={bookings}
              onUpdateBookingStatus={onUpdateBookingStatus}
              onOpenDetailModal={handleOpenBookingDetail}
              onRefreshBookings={onRefreshBookings}
              isLoadingBookings={isLoadingBookings}
            />
            {selectedBooking && (
              <BookingDetailModal
                isOpen={bookingDetailModalOpen}
                onClose={handleCloseBookingDetail}
                booking={selectedBooking}
                onUpdateStatus={async (bookingId, newStatus) => {
                  await onUpdateBookingStatus(bookingId, newStatus);
                  handleCloseBookingDetail();
                }}
              />
            )}
          </>
        )}
      </MainTab.Screen>
      <MainTab.Screen name="Services" options={{ tabBarLabel: 'Services' }}>
        {() => (
          <ServiceSection
            profile={profile}
            services={services}
            bookings={bookings}
            setServices={setServices}
            onAddService={() => {}}
            onUpdateService={() => {}}
            onDeleteService={() => {}}
            onOpenServiceDetail={() => {}}
          />
        )}
      </MainTab.Screen>
      <MainTab.Screen name="Reviews" options={{ tabBarLabel: 'Reviews' }}>
        {() => (
          <ReviewsSection workerEmail={profile?.email || ''} onOpenRespondModal={() => {}} onOpenAppealModal={() => {}} />
        )}
      </MainTab.Screen>
      <MainTab.Screen name="Profile" options={{ tabBarLabel: 'Profile' }}>
        {() => (
          <ProfileSection
            profile={profile}
            bookings={bookings}
            onUpdateProfile={onUpdateProfile}
            onLogout={onLogout}
            onToggleAvailability={() => {}}
            onToggleTodayAvailability={() => {}}
            theme={theme}
            setTheme={setTheme}
            onOpenShareProfileModal={() => setShareProfileModalOpen(true)}
          />
        )}
      </MainTab.Screen>
    </MainTab.Navigator>
  );
}

export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // TODO: Replace with real auth logic
  const [authView, setAuthView] = useState<AuthView>('login');
  const [otpContext, setOtpContext] = useState<OtpContext>('login');
  const [email, setEmail] = useState('');
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([] as Booking[]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>(INITIAL_ACTIVITY_ITEMS);
  const [theme, setTheme] = useState<Theme>('light');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBookings = async (email: string) => {
    if (!email) return;
    
    try {
      setIsLoadingBookings(true);
      const bookings = await api.getBookings(email);
      setBookings(bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Failed to load bookings. Please try again.');
      setBookings([]); // Clear bookings on error
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      // Map the status to the correct BookingStatus enum value
      const statusMap: Record<string, BookingStatus> = {
        'confirmed': BookingStatus.CONFIRMED,
        'rejected': BookingStatus.REJECTED,
        'in progress': BookingStatus.IN_PROGRESS,
        'completed': BookingStatus.COMPLETED,
        'cancelled': BookingStatus.CANCELLED,
        'pending': BookingStatus.PENDING,
        'Confirmed': BookingStatus.CONFIRMED,
        'Rejected': BookingStatus.REJECTED,
        'In Progress': BookingStatus.IN_PROGRESS,
        'Completed': BookingStatus.COMPLETED,
        'Cancelled': BookingStatus.CANCELLED,
        'Pending': BookingStatus.PENDING
      };
      
      // Get the correct BookingStatus value or use the provided status if it's already valid
      const status = statusMap[newStatus] || BookingStatus.PENDING;
      
      // Update the booking status in the backend
      await api.updateBookingStatus(bookingId, status);
      
      // Update the booking in the local state
      setBookings(prev => 
        prev.map(booking => 
          booking._id === bookingId ? { ...booking, status } : booking
        )
      );
      
      return true;
    } catch (error) {
      console.error('Error updating booking status:', error);
      Alert.alert(
        'Update Failed', 
        error instanceof Error ? error.message : 'Failed to update booking status. Please try again.'
      );
      return false;
    }
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
    setAuthView('login');
    await SecureStore.deleteItemAsync('userLogin');
  };

  const [otpEmail, setOtpEmail] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const handleLogin = async (email: string, password: string, otp?: string) => {
    setLoading(true);
    setAuthError(null);
    
    try {
      if (!otp) {
        // First step: Request OTP
        const otpResponse = await api.login(email, password);
        console.log('OTP Response:', otpResponse);
        
        if (otpResponse.success || otpResponse.message === 'OTP sent' || otpResponse.message === 'OTP sent to your email') {
          // Store email and password for the OTP verification step
          setOtpEmail(email);
          // The LoginPage will handle showing the OTP input
          return; // Return early since we're showing OTP input now
        } else {
          throw new Error(otpResponse.message || 'Failed to send OTP');
        }
      } else {
        // Second step: Verify OTP and complete login
        const verifyResponse = await api.verifyOtp(email, otp);
        console.log('Verify OTP Response:', verifyResponse);
        
        if (verifyResponse.success || verifyResponse.message === 'OTP verified') {
          // OTP verified, complete login
          await SecureStore.setItemAsync('userLogin', JSON.stringify({
            email,
            timestamp: new Date().toISOString()
          }));
          
          // Get user profile
          const userProfile = await api.getProfile(email);
          console.log('User Profile:', userProfile);
          
          if (userProfile && !userProfile.message) {
            setProfile(userProfile);
            setIsAuthenticated(true);
            setOtpVerified(true);
            // Fetch bookings after successful login
            await fetchBookings(email);
          } else {
            throw new Error('Failed to load user profile');
          }
        } else {
          throw new Error(verifyResponse.message || 'Invalid OTP');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setAuthError(error.message || 'An error occurred during login');
      throw error; // Re-throw to let the LoginPage know there was an error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timeout = setTimeout(() => setIsSplashVisible(false), 3000); // Always hide splash after 3s
    async function checkLogin() {
      const data = await SecureStore.getItemAsync('userLogin');
      if (data) {
        try {
          const { email: storedEmail, timestamp } = JSON.parse(data);
          if (storedEmail && Date.now() - timestamp < 3 * 30 * 24 * 60 * 60 * 1000) {
            // Auto-login: fetch profile, services, etc.
            const userProfile = await api.getProfile(storedEmail);
            if (userProfile && !userProfile.message) {
              setProfile(userProfile);
              setEmail(storedEmail);
              setIsAuthenticated(true);
              const userServices = await api.getServices(storedEmail);
              setServices(userServices);
              // Fetch bookings after auto-login
              await fetchBookings(storedEmail);
            }
          } else {
            await SecureStore.deleteItemAsync('userLogin');
          }
        } catch {
          await SecureStore.deleteItemAsync('userLogin');
        }
      }
      setIsSplashVisible(false); // Hide splash if API is fast
    }
    checkLogin();
    return () => clearTimeout(timeout);
  }, []);

  if (isSplashVisible) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {isAuthenticated ? (
          <MainTabs
            profile={profile || { id: '', name: '', email: '' }}
            setProfile={setProfile}
            bookings={bookings}
            setBookings={setBookings}
            services={services}
            setServices={setServices}
            reviews={reviews}
            setReviews={setReviews}
            activityItems={activityItems}
            setActivityItems={setActivityItems}
            theme={theme}
            setTheme={setTheme}
            onLogout={handleLogout}
            onUpdateProfile={setProfile}
            onUpdateBookingStatus={handleUpdateBookingStatus}
            onRefreshBookings={async () => {
              if (profile && 'email' in profile) {
                await fetchBookings(profile.email);
              }
            }}
            isLoadingBookings={isLoadingBookings}
          />
        ) : (
          <AuthStack.Navigator screenOptions={{ headerShown: false }}>
            {authView === 'login' && (
              <AuthStack.Screen name="Login">
                {() => (
                  <LoginPage
                    onLoginInitiate={handleLogin}
                    onSwitchToSignup={() => setAuthView('signup')}
                    error={authError}
                    loading={loading}
                  />
                )}
              </AuthStack.Screen>
            )}
            {authView === 'signup' && (
              <AuthStack.Screen name="Signup">
                {() => (
                  <SignupPage
                    onSignupInitiate={async (name, email, pass) => {
                      setAuthError(null);
                      setLoading(true);
                      try {
                        const signupRes = await api.signup(name, email, pass);
                        if (signupRes.message !== 'Signup successful') {
                          setAuthError(signupRes.message || 'Signup failed');
                          setLoading(false);
                          return;
                        }
                        const otpRes = await api.sendOtp(email);
                        if (otpRes.message !== 'OTP sent') {
                          setAuthError(otpRes.message || 'Failed to send OTP');
                          setLoading(false);
                          return;
                        }
                        setEmail(email);
                        setOtpContext('signup');
                        setAuthView('otp');
                      } catch (err) {
                        if (err instanceof Error) {
                          setAuthError(err.message);
                        } else {
                          setAuthError('Network error');
                        }
                      } finally {
                        setLoading(false);
                      }
                    }}
                    onSwitchToLogin={() => setAuthView('login')}
                    error={authError}
                    loading={loading}
                  />
                )}
              </AuthStack.Screen>
            )}
            {authView === 'otp' && (
              <AuthStack.Screen name="OtpVerification">
                {() => (
                  <OtpVerificationPage
                    email={email}
                    context={otpContext}
                    onOtpVerified={async (otp: string, setOtpError: (msg: string) => void) => {
                      try {
                        const verifyRes = await api.verifyOtp(email, otp);
                        console.log('OTP verification response:', verifyRes);
                        if (verifyRes.success || verifyRes.message === 'OTP verified') {
                          // Fetch profile and services after successful login/signup
                          const userProfile = await api.getProfile(email);
                          if (!userProfile || userProfile.message === 'User not found') {
                            setOtpError('Failed to load profile. Please try again.');
                            return;
                          }
                          
                          // Update state with user data
                          setProfile(userProfile);
                          
                          // Fetch user services
                          try {
                            const userServices = await api.getServices(email);
                            setServices(userServices);
                          } catch (serviceErr) {
                            console.error('Error fetching services:', serviceErr);
                            // Continue even if services fail to load
                          }
                          
                          // Save login info for persistent login
                          await SecureStore.setItemAsync('userLogin', JSON.stringify({ 
                            email, 
                            timestamp: Date.now() 
                          }));
                          
                          // Fetch bookings
                          try {
                            await fetchBookings(email);
                          } catch (bookingErr) {
                            console.error('Error fetching bookings:', bookingErr);
                            // Continue even if bookings fail to load
                          }
                          
                          // Set authenticated state to navigate to main app
                          setIsAuthenticated(true);
                          
                          // Reset auth state
                          setEmail('');
                          setOtpContext('login');
                          setAuthView('login');
                        } else {
                          setOtpError(verifyRes.message || 'OTP verification failed');
                        }
                      } catch (err) {
                        console.error('OTP verification error:', err);
                        setOtpError('An error occurred. Please try again.');
                      }
                    }}
                    onBackToAuth={() => setAuthView(otpContext === 'login' ? 'login' : 'signup')}
                  />
                )}
              </AuthStack.Screen>
            )}
          </AuthStack.Navigator>
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
