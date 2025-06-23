import { createNavigationContainerRef, CommonActions, StackActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    // Use navigationRef.current.navigate for better type safety
    navigationRef.navigate(name, params);
  } else {
    console.warn('Navigation ref is not ready');
  }
}

export function resetToLogin() {
  if (navigationRef.isReady()) {
    try {
      // Simple reset to Login screen
      navigationRef.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error resetting to login:', error);
      // Fallback to simple navigation if reset fails
      navigationRef.navigate('Login');
    }
  } else {
    console.warn('Navigation ref is not ready for reset');
  }
}

export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  } else {
    console.warn('Cannot go back: navigation ref not ready or at root');
  }
}
