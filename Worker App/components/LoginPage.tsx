import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, Easing, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { APP_LOGO_NAME } from '../constants';
import Modal from './Modal';
import * as api from '../utils/api';

interface LoginPageProps {
  onLoginInitiate: (email: string, password: string, otp?: string) => Promise<void>;
  onSwitchToSignup: () => void;
  error?: string | null;
  loading?: boolean;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginInitiate, onSwitchToSignup, error, loading }) => {
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpResent, setOtpResent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Animation states
  const [fadeAnim] = useState(new Animated.Value(0));
  const [formScale] = useState(new Animated.Value(0.8));
  const [buttonScale] = useState(new Animated.Value(1));
  const emailInputAnim = useRef(new Animated.Value(0)).current;
  const passwordInputAnim = useRef(new Animated.Value(0)).current;
  const otpInputAnim = useRef(new Animated.Value(0)).current;

  // Forgot password modal state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [fpStep, setFpStep] = useState<'email' | 'otp'>('email');
  const [fpEmail, setFpEmail] = useState('');
  const [fpOtp, setFpOtp] = useState('');
  const [fpNewPass, setFpNewPass] = useState('');
  const [fpConfirmPass, setFpConfirmPass] = useState('');
  const [fpError, setFpError] = useState('');
  const [fpSuccess, setFpSuccess] = useState('');
  const [fpLoading, setFpLoading] = useState(false);

  // Animations on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(formScale, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.elastic(1)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Input focus animations
  const animateInput = (anim: Animated.Value, toValue: number) => {
    Animated.timing(anim, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  // Reset OTP state when error changes
  useEffect(() => {
    if (error) {
      setShowOtp(false);
      setOtp('');
      setOtpError('');
    }
  }, [error]);

  const handleSubmit = async () => {
    if (!email || !password) return;

    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (showOtp) {
      if (!otp || otp.length !== 6) {
        setOtpError('Please enter a valid 6-digit OTP');
        return;
      }
      setOtpLoading(true);
      setOtpError('');
      try {
        await onLoginInitiate(loginEmail, loginPassword, otp);
      } catch (err: any) {
        console.error('OTP verification error:', err);
        setOtpError(err.message || 'Failed to verify OTP. Please try again.');
      } finally {
        setOtpLoading(false);
      }
    } else {
      setLoginEmail(email);
      setLoginPassword(password);
      setOtpLoading(true);
      try {
        await onLoginInitiate(email, password);
        setShowOtp(true);
      } catch (err: any) {
        console.error('Login error:', err);
      } finally {
        setOtpLoading(false);
      }
    }
  };

  const handleResendOtp = async () => {
    setOtpLoading(true);
    setOtpError('');
    try {
      const response = await api.sendOtp(loginEmail);
      if (response.message === 'OTP sent') {
        setOtpResent(true);
        setTimeout(() => setOtpResent(false), 5000);
      } else {
        setOtpError('Failed to resend OTP. Please try again.');
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      setOtpError('Failed to resend OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleForgot = async () => {
    setFpError('');
    setFpSuccess('');
    setFpLoading(true);
    try {
      const res = await api.forgotPassword(fpEmail);
      if (res.message === 'OTP sent') {
        setFpStep('otp');
        setFpSuccess('OTP sent to your email.');
      } else {
        setFpError(res.message || 'Failed to send OTP');
      }
    } catch {
      setFpError('Network error');
    } finally {
      setFpLoading(false);
    }
  };

  const handleReset = async () => {
    setFpError('');
    setFpSuccess('');
    setFpLoading(true);
    if (!fpNewPass || fpNewPass.length < 6) {
      setFpError('Password must be at least 6 characters');
      setFpLoading(false);
      return;
    }
    if (fpNewPass !== fpConfirmPass) {
      setFpError('Passwords do not match');
      setFpLoading(false);
      return;
    }
    try {
      const res = await api.resetPassword(fpEmail, fpOtp, fpNewPass);
      if (res.message === 'Password reset successful') {
        setFpSuccess('Password reset! You can now log in.');
        setTimeout(() => {
          setForgotOpen(false);
          setFpStep('email');
        }, 1500);
      } else {
        setFpError(res.message || 'Failed to reset password');
      }
    } catch {
      setFpError('Network error');
    } finally {
      setFpLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.formContainer, { transform: [{ scale: formScale }] }]}>
            <Text style={styles.title}>
              <Text style={styles.titleWe}>We</Text>
              <Text style={styles.titleFix}>Fix</Text>
            </Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>

            <View style={styles.form}>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <Animated.View style={[styles.inputWrapper, { transform: [{ translateY: emailInputAnim }] }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    onFocus={() => animateInput(emailInputAnim, -2)}
                    onBlur={() => animateInput(emailInputAnim, 0)}
                  />
                </Animated.View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <Animated.View style={[styles.inputWrapper, { transform: [{ translateY: passwordInputAnim }] }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    textContentType="password"
                    onFocus={() => animateInput(passwordInputAnim, -2)}
                    onBlur={() => animateInput(passwordInputAnim, 0)}
                  />
                </Animated.View>
              </View>

              {showOtp && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Enter OTP</Text>
                  <Animated.View style={[styles.inputWrapper, { transform: [{ translateY: otpInputAnim }] }]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                      onFocus={() => animateInput(otpInputAnim, -2)}
                      onBlur={() => animateInput(otpInputAnim, 0)}
                    />
                  </Animated.View>
                  {otpError ? <Text style={styles.error}>{otpError}</Text> : null}
                  {otpResent && <Text style={styles.success}>OTP resent successfully!</Text>}
                  <TouchableOpacity
                    onPress={handleResendOtp}
                    disabled={otpLoading}
                    style={styles.resendButton}
                  >
                    <Text style={styles.resendText}>
                      {otpLoading ? 'Sending...' : 'Resend OTP'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  style={[styles.button, (loading || otpLoading) && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading || otpLoading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Sending OTP...' : showOtp ? 'Verify OTP' : 'Continue to OTP'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity
                onPress={() => {
                  setForgotOpen(true);
                  setFpStep('email');
                  setFpEmail(email);
                  setFpError('');
                  setFpSuccess('');
                }}
                disabled={loading || otpLoading}
              >
                <Text
                  style={[
                    styles.forgotText,
                    { color: loading || otpLoading ? '#B0B0B0' : '#FF6200' },
                  ]}
                >
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.signupText}>
              Don't have an account?{' '}
              <Text style={styles.signupLink} onPress={onSwitchToSignup}>
                Sign up
              </Text>
            </Text>
          </Animated.View>
        </ScrollView>

        <Modal isOpen={forgotOpen} onClose={() => setForgotOpen(false)} title="Reset Password">
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            {fpStep === 'email' ? (
              <>
                <Text style={styles.modalSubtitle}>
                  Enter your email to receive an OTP.
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    value={fpEmail}
                    onChangeText={setFpEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                {fpError ? <Text style={styles.error}>{fpError}</Text> : null}
                {fpSuccess ? <Text style={styles.success}>{fpSuccess}</Text> : null}
                <TouchableOpacity
                  style={[styles.button, fpLoading && styles.buttonDisabled]}
                  onPress={handleForgot}
                  disabled={fpLoading}
                >
                  <Text style={styles.buttonText}>
                    {fpLoading ? 'Sending...' : 'Send OTP'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalSubtitle}>
                  Enter the OTP and your new password.
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="6-digit OTP"
                    value={fpOtp}
                    onChangeText={setFpOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    value={fpNewPass}
                    onChangeText={setFpNewPass}
                    secureTextEntry
                  />
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm New Password"
                    value={fpConfirmPass}
                    onChangeText={setFpConfirmPass}
                    secureTextEntry
                  />
                </View>
                {fpError ? <Text style={styles.error}>{fpError}</Text> : null}
                {fpSuccess ? <Text style={styles.success}>{fpSuccess}</Text> : null}
                <TouchableOpacity
                  style={[styles.button, fpLoading && styles.buttonDisabled]}
                  onPress={handleReset}
                  disabled={fpLoading}
                >
                  <Text style={styles.buttonText}>
                    {fpLoading ? 'Resetting...' : 'Reset Password'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Modal>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 10,
    fontFamily: 'System',
    textAlign: 'center',
  },
  titleWe: {
    color: '#000000', // Black for "we"
  },
  titleFix: {
    color: '#FF6200', // Orange for "fix"
  },
  subtitle: {
    color: '#000000', // Black subtitle
    marginBottom: 30,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '400',
  },
  form: {
    width: '100%',
    backgroundColor: '#FFFFFF', // White form background
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  error: {
    color: '#FF0000', // Red for errors
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 8,
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 14,
  },
  success: {
    color: '#388E3C',
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 8,
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#000000', // Black labels
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF', // White input background
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  input: {
    padding: 14,
    fontSize: 16,
    color: '#000000', // Black input text
    borderRadius: 12,
  },
  button: {
    backgroundColor: '#FF6200', // Orange button
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FF6200',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#FF8C4D', // Lighter orange for disabled state
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF', // White button text
    fontWeight: '700',
    fontSize: 16,
    fontFamily: 'System',
  },
  resendButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  resendText: {
    color: '#FF6200', // Orange resend text
    fontSize: 14,
    fontWeight: '600',
  },
  forgotText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  signupText: {
    color: '#000000', // Black signup text
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  signupLink: {
    color: '#FF6200', // Orange signup link
    fontWeight: '700',
  },
  modalContent: {
    padding: 20,
    maxWidth: 380,
    backgroundColor: '#FFFFFF', // White modal background
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    color: '#FF6200', // Orange modal title
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#000000', // Black modal subtitle
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default LoginPage;