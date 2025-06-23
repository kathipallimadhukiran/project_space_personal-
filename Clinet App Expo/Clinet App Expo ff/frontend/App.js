import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Alert } from 'react-native';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { API_URL } from './config';

// Screens
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import OTPScreen from './screens/OTPScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import HomeScreen from './screens/HomeScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import AccountScreen from './screens/AccountScreen';
import PaymentsScreen from './screens/PaymentsScreen';
import BookingsScreen from './screens/BookingsScreen';
import WorkerProfileScreen from './screens/WorkerProfileScreen';
import ChatScreen from './screens/ChatScreen';
import BookServiceScreen from './screens/BookServiceScreen';
import ServiceWorkersScreen from './screens/ServiceWorkersScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import ReviewsScreen from './screens/ReviewsScreen';
import SuccessScreen from './screens/SuccessScreen';
import SplashScreen from './screens/SplashScreen';

// Context and Navigation
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { navigationRef } from './navigation/RootNavigation';
import ProtectedRoute from './components/ProtectedRoute';

const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();

const AuthNavigator = () => (
  <AuthStack.Navigator 
    initialRouteName="Login"
    screenOptions={{ 
      headerShown: false, 
      animation: 'fade',
      gestureEnabled: false
    }}
  >
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Signup" component={SignupScreen} />
    <AuthStack.Screen name="OTP" component={OTPScreen} />
    <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
  </AuthStack.Navigator>
);

const MainAppNavigator = () => (
  <MainStack.Navigator 
    initialRouteName="Home"
    screenOptions={{ 
      headerShown: false, 
      animation: 'slide_from_right',
      gestureEnabled: true
    }}
  >
    <MainStack.Screen 
      name="Home"
      component={HomeScreen}
      options={{
        headerShown: false,
        gestureEnabled: true
      }}
    />
    <MainStack.Screen name="Account">
      {({ navigation }) => (
        <ProtectedRoute>
          <AccountScreen navigation={navigation} />
        </ProtectedRoute>
      )}
    </MainStack.Screen>
    <MainStack.Screen name="Payments">
      {({ navigation }) => (
        <ProtectedRoute>
          <PaymentsScreen navigation={navigation} />
        </ProtectedRoute>
      )}
    </MainStack.Screen>
    <MainStack.Screen name="Bookings">
      {({ navigation }) => (
        <ProtectedRoute>
          <BookingsScreen navigation={navigation} />
        </ProtectedRoute>
      )}
    </MainStack.Screen>
    <MainStack.Screen name="WorkerProfile">
      {({ navigation, route }) => (
        <ProtectedRoute>
          <WorkerProfileScreen navigation={navigation} route={route} />
        </ProtectedRoute>
      )}
    </MainStack.Screen>
    <MainStack.Screen name="Chat">
      {({ navigation, route }) => (
        <ProtectedRoute>
          <ChatScreen navigation={navigation} route={route} />
        </ProtectedRoute>
      )}
    </MainStack.Screen>
    <MainStack.Screen name="ServiceWorkers">
      {({ navigation, route }) => (
        <ProtectedRoute>
          <ServiceWorkersScreen navigation={navigation} route={route} />
        </ProtectedRoute>
      )}
    </MainStack.Screen>
    <MainStack.Screen name="BookService">
      {({ navigation, route }) => (
        <ProtectedRoute>
          <BookServiceScreen navigation={navigation} route={route} />
        </ProtectedRoute>
      )}
    </MainStack.Screen>
    <MainStack.Screen name="EditProfile">
      {({ navigation, route }) => (
        <ProtectedRoute>
          <EditProfileScreen navigation={navigation} route={route} />
        </ProtectedRoute>
      )}
    </MainStack.Screen>
    <MainStack.Screen name="Reviews">
      {({ navigation, route }) => (
        <ProtectedRoute>
          <ReviewsScreen navigation={navigation} route={route} />
        </ProtectedRoute>
      )}
    </MainStack.Screen>
    <MainStack.Screen 
      name="Success" 
      component={SuccessScreen} 
      options={{ 
        headerShown: false, 
        gestureEnabled: false,
        animation: 'fade'
      }} 
    />
  </MainStack.Navigator>
);

function AppContent() {
  const { user, loading } = useAuth();
  const [location, setLocation] = useState(null);
  const [minSplashTimeElapsed, setMinSplashTimeElapsed] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Handle minimum splash screen time
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinSplashTimeElapsed(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Handle app initialization
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize any resources here
        if (user?.email) {
          await handleLocationUpdate();
        }
      } catch (error) {
        console.warn('Initialization error:', error);
      }
    };

    const handleLocationUpdate = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let loc = await Location.getCurrentPositionAsync({});
          setLocation(loc);
          let address = '';
          try {
            let geocode = await Location.reverseGeocodeAsync({ 
              latitude: loc.coords.latitude, 
              longitude: loc.coords.longitude 
            });
            if (geocode && geocode[0]) {
              address = `${geocode[0].name || ''} ${geocode[0].street || ''}, ${geocode[0].city || ''}, ${geocode[0].region || ''}, ${geocode[0].country || ''}`;
            }
          } catch (geocodeError) {
            console.error('Geocoding error:', geocodeError);
          }
          // Update user's location on the server
          try {
            const locationUpdateUrl = API_URL.replace('/api/client', '/api/update-location');
            await fetch(locationUpdateUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: user.email, 
              address, 
              lat: loc.coords.latitude, 
              lng: loc.coords.longitude 
            })
          });
          } catch (networkError) {
            console.error('Network error updating location:', networkError);
            Alert.alert('Network Error', 'Could not update your location on the server. Please check your connection.');
          }
        } else {
          Alert.alert('Permission Denied', 'Location permission is required for full app functionality.');
        }
      } catch (error) {
        console.error('Location error:', error);
        Alert.alert('Location Error', error.message || 'Failed to get your location. Please enable location services and try again.');
      }
    };

    initializeApp();
  }, [user?.email]);

  // Only show the app content when both conditions are met:
  // 1. Minimum splash time has elapsed
  // 2. Auth state is not loading
  const shouldShowApp = minSplashTimeElapsed && !loading;

  // Show splash screen while loading or if minimum time hasn't elapsed
  if (!shouldShowApp) {
    return <SplashScreen />;
  }

      // Main app navigation
  return (
    <NavigationContainer 
      ref={navigationRef}
      onReady={() => {
        console.log('Navigation is ready');
      }}
    >
      {user ? (
        <MainAppNavigator />
      ) : (
        <AuthNavigator />
      )}
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
