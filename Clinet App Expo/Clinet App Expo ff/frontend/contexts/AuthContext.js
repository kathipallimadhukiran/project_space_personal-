import React, { createContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resetToLogin, navigationRef } from '../navigation/RootNavigation';

const AuthContext = createContext();
const USER_KEY = '@user';
const TOKEN_EXPIRY_KEY = '@token_expiry';
const SESSION_DURATION = 90 * 24 * 60 * 60 * 1000; // 3 months

// Navigation is now handled through RootNavigation.js

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from storage on initial load
  useEffect(() => {
    const loadUser = async () => {
      try {
        const [storedUser, expiryTime] = await Promise.all([
          AsyncStorage.getItem(USER_KEY),
          AsyncStorage.getItem(TOKEN_EXPIRY_KEY)
        ]);

        if (storedUser && expiryTime) {
          const expiryDate = new Date(parseInt(expiryTime, 10));
          const now = new Date();
          
          if (expiryDate > now) {
            setUser(JSON.parse(storedUser));
          } else {
            await AsyncStorage.multiRemove([USER_KEY, TOKEN_EXPIRY_KEY]);
          }
        }
      } catch (error) {
        console.error('Failed to load user', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

  const login = async (userData) => {
    try {
      const expiryTime = Date.now() + SESSION_DURATION;
      await AsyncStorage.multiSet([
        [USER_KEY, JSON.stringify(userData)],
        [TOKEN_EXPIRY_KEY, expiryTime.toString()]
      ]);
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Failed to save user data', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // First, clear the user data
      await AsyncStorage.multiRemove([USER_KEY, TOKEN_EXPIRY_KEY]);
      
      // Then update the state
      setUser(null);
      
      // Add a small delay to ensure state updates propagate
      setTimeout(() => {
        // Reset navigation to Login screen using RootNavigation
        if (resetToLogin) {
          resetToLogin();
        } else {
          console.warn('resetToLogin function is not available');
          // Fallback to simple navigation if resetToLogin is not available
          navigationRef.navigate('Auth', { screen: 'Login' });
        }
      }, 100);
      
      return true;
    } catch (error) {
      console.error('Failed to logout', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout,
      isAuthenticated: !!user
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
