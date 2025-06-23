// API Configuration for React Native/Expo
import Constants from 'expo-constants';

// Get the local IP from environment variables or constants
const LOCAL_IP = Constants.expoConfig?.extra?.LOCAL_IP || '192.168.125.111';

// API Configuration
const API_CONFIG = {
  // For development - using local IP
  development: `http://192.168.125.111:1000/api/client`,
  
  // For production - replace with your production API URL
  production: 'https://your-production-api.com/api/client',
};

// Determine the environment
const ENV = __DEV__ ? 'development' : 'production';

// Get the appropriate API URL
const API_URL = API_CONFIG[ENV];

// For debugging
console.log('Environment:', ENV);
console.log('API URL:', API_URL);
console.log('LOCAL_IP:', LOCAL_IP);

// Export the API URL
export { API_URL, LOCAL_IP };

export const REVIEW_API_URL = "http://192.168.125.111:1000/api";
