import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableWithoutFeedback, 
  Keyboard, 
  ScrollView,
  StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

const OTP_LENGTH = 6;

export default function OTPScreen({ navigation, route }) {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const { email } = route.params || {};
  const from = route.params?.from;
  const otpInputs = useRef([]);
  const { user, login } = useAuth();
  
  // Removed auto-focus logic for stability and better UX
  
  // Handle countdown for resend OTP
  useEffect(() => {
    let interval;
    if (resendDisabled && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setResendDisabled(false);
      setCountdown(60);
    }
    
    return () => clearInterval(interval);
  }, [resendDisabled, countdown]);

  // Focus the input at activeIndex whenever it changes
  useEffect(() => {
    if (otpInputs.current[activeIndex]) {
      otpInputs.current[activeIndex].focus();
    }
  }, [activeIndex]);

  const handleOtpChange = (text, index) => {
    // Only allow numbers
    if (text && isNaN(Number(text))) return;
    
    // Update the OTP array
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    
    // Move to next input if there's a value and we're not at the last box
    if (text && index < OTP_LENGTH - 1) {
      setActiveIndex(index + 1);
    }
    
    // Auto submit when all fields are filled
    if (newOtp.every(num => num !== '') && newOtp.length === OTP_LENGTH) {
      handleSubmit(newOtp.join(''));
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace on empty field
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      setActiveIndex(index - 1);
    }
  };

  const handleFocus = (index) => {
    setActiveIndex(index);
  };

  const handleSubmit = async (otpValue) => {
    if (otpValue.length !== OTP_LENGTH) {
      Alert.alert('Error', 'Please enter a complete OTP code');
      return;
    }
    
    try {
      setLoading(true);
      
      // Verify OTP with the backend
      const response = await fetch(`${API_URL}verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email || user?.email,
          otp: otpValue,
          from: from || 'login'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (from === 'forgot-password') {
          // For password reset flow
          navigation.navigate('ResetPassword', { 
            email: email || user?.email, 
            otp: otpValue 
          });
        } else if (from === 'login') {
          // For login flow
          // After successful OTP verification, complete the login process
          try {
            // Get the complete user data
            const userRes = await fetch(`${API_URL}user/${email || user?.email}`);
            if (userRes.ok) {
              const userData = await userRes.json();
              // Log the user in with the complete user data
              login(userData);
            } else {
              throw new Error('Failed to fetch user data after OTP verification');
            }
          } catch (error) {
            console.error('Error fetching user data after OTP:', error);
            Alert.alert('Success', 'OTP verified!', [
              { text: 'OK', onPress: () => navigation.navigate('Home') }
            ]);
          }
        } else {
          // For other flows
          navigation.navigate('Home');
        }
      } else {
        Alert.alert('Error', data.message || 'Failed to verify OTP');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'An error occurred while verifying OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendDisabled(true);
    const intervalId = setInterval(() => {
      setCountdown(countdown - 1);
    }, 1000);
    setTimeout(() => {
      clearInterval(intervalId);
      setResendDisabled(false);
      setCountdown(60);
    }, 60000);
    try {
      const res = await fetch(`${API_URL}resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Error', data.message || 'Something went wrong');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error');
    }
  };

  const renderOtpInputs = () => (
    <View style={styles.otpBoxesContainerNew}>
        {otp.map((digit, index) => (
        <TextInput
            key={index}
            style={[
            styles.otpBoxNew,
            activeIndex === index && styles.otpBoxActiveNew,
            digit !== '' && styles.otpBoxFilledNew
          ]}
          value={digit}
          onChangeText={text => {
            // Allow pasting or typing multiple digits
            if (text.length > 1) {
              const chars = text.split('');
              const newOtp = [...otp];
              let nextIndex = index;
              for (let i = 0; i < chars.length && nextIndex < OTP_LENGTH; i++, nextIndex++) {
                if (!isNaN(Number(chars[i]))) {
                  newOtp[nextIndex] = chars[i];
                }
              }
              setOtp(newOtp);
              // Move focus to the last filled box
              if (nextIndex < OTP_LENGTH) {
                setActiveIndex(nextIndex);
              } else {
                setActiveIndex(OTP_LENGTH - 1);
                // Auto submit if all filled
                if (newOtp.every(num => num !== '')) {
                  handleSubmit(newOtp.join(''));
                }
              }
              return;
            }
            // Only allow numbers
            if (text && isNaN(Number(text))) return;
            const newOtp = [...otp];
            newOtp[index] = text;
            setOtp(newOtp);
            if (text && index < OTP_LENGTH - 1) {
              setActiveIndex(index + 1);
            }
            // Auto submit when all fields are filled
            if (newOtp.every(num => num !== '') && newOtp.length === OTP_LENGTH) {
              handleSubmit(newOtp.join(''));
            }
          }}
          onKeyPress={e => {
            if (e.nativeEvent.key === 'Backspace') {
              if (otp[index] === '' && index > 0) {
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                setOtp(newOtp);
                setActiveIndex(index - 1);
              }
            }
          }}
              onFocus={() => handleFocus(index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus={true}
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              autoCorrect={false}
              autoCapitalize="none"
          ref={ref => (otpInputs.current[index] = ref)}
            />
        ))}
      </View>
    );

  return (
    <View style={styles.containerNew}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.cardNew}>
        <View style={styles.headerNew}>
          <Ionicons name="keypad-outline" size={40} color="#FC8019" style={{ marginBottom: 10 }} />
          <Text style={styles.titleNew}>OTP Verification</Text>
          <Text style={styles.subtitleNew}>
            We've sent a 6-digit code to
            <Text style={styles.emailTextNew}> {email}</Text>
              </Text>
            </View>
            {renderOtpInputs()}
            <TouchableOpacity 
          style={[styles.buttonNew, (loading || otp.some(digit => digit === '')) && styles.buttonDisabledNew]}
              onPress={() => handleSubmit(otp.join(''))}
              disabled={loading || otp.some(digit => digit === '')}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
            <Text style={styles.buttonTextNew}>Verify OTP</Text>
              )}
            </TouchableOpacity>
        <View style={styles.resendContainerNew}>
          <Text style={styles.resendTextNew}>Didn't receive the code? </Text>
              <TouchableOpacity 
                onPress={handleResendOTP}
                disabled={resendDisabled}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FC8019" size="small" />
                ) : (
              <Text style={[styles.resendLinkNew, resendDisabled && styles.resendLinkDisabledNew]}>
                    {resendDisabled ? `Resend in ${countdown}s` : 'Resend OTP'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
          style={styles.backButtonNew}
              onPress={() => navigation.goBack()}
            >
          <Ionicons name="arrow-back" size={16} color="#FC8019" style={styles.backIconNew} />
          <Text style={styles.backButtonTextNew}>Back to Login</Text>
            </TouchableOpacity>
          </View>
    </View>
  );
}

const styles = StyleSheet.create({
  containerNew: {
    flex: 1,
    backgroundColor: '#f6f7fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardNew: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 28,
    width: '90%',
    maxWidth: 400,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    alignItems: 'center',
  },
  headerNew: {
    alignItems: 'center',
    marginBottom: 24,
  },
  titleNew: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleNew: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  emailTextNew: {
    fontWeight: '600',
    color: '#111827',
  },
  otpBoxesContainerNew: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'nowrap',
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  otpBoxNew: {
    width: 42,
    height: 52,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    textAlign: 'center',
    fontSize: 24,
    color: '#111827',
    fontWeight: '600',
    marginHorizontal: 2,
    shadowColor: '#FC8019',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  otpBoxActiveNew: {
    borderColor: '#FC8019',
    backgroundColor: '#FFF9F5',
    shadowOpacity: 0.12,
  },
  otpBoxFilledNew: {
    borderColor: '#FC8019',
    backgroundColor: '#FFF9F5',
  },
  buttonNew: {
    width: '100%',
    height: 52,
    backgroundColor: '#FC8019',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabledNew: {
    opacity: 0.7,
  },
  buttonTextNew: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainerNew: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resendTextNew: {
    color: '#6B7280',
    fontSize: 14,
  },
  resendLinkNew: {
    color: '#FC8019',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 4,
  },
  resendLinkDisabledNew: {
    color: '#bbb',
  },
  backButtonNew: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  backIconNew: {
    marginRight: 6,
  },
  backButtonTextNew: {
    color: '#FC8019',
    fontWeight: '600',
    fontSize: 15,
  },
}); 