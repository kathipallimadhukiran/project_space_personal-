import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { APP_LOGO_NAME } from '../constants';
import { OtpContext } from '../types';
import * as api from '../utils/api';

interface OtpVerificationPageProps {
  email: string;
  context: OtpContext;
  onOtpVerified: (otp: string, setOtpError: (msg: string) => void) => void;
  onBackToAuth: () => void;
}

const OTP_LENGTH = 6;

const OtpVerificationPage: React.FC<OtpVerificationPageProps> = ({ email, context, onOtpVerified, onBackToAuth }) => {
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
    setSuccessInfo(`A ${OTP_LENGTH}-digit OTP has been sent to ${email}.`);
  }, [email, context]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = () => {
    setError('');
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== OTP_LENGTH) {
      setError(`Please enter a ${OTP_LENGTH}-digit OTP.`);
      return;
    }
    onOtpVerified(enteredOtp, setError);
  };

  const handleResendOtp = async () => {
    setResendTimer(30);
    setOtp(new Array(OTP_LENGTH).fill(''));
    setError('');
    setSuccessInfo('Sending new OTP...');
    try {
      const otpRes = await api.sendOtp(email);
      if (otpRes.message === 'OTP sent') {
        setSuccessInfo(`A new ${OTP_LENGTH}-digit OTP has been sent to ${email}.`);
      } else {
        setError(otpRes.message || 'Failed to resend OTP');
      }
    } catch {
      setError('Network error');
    }
    inputRefs.current[0]?.focus();
  };

  return (
    <View style={styles.container}>
      {/* Replace with ShieldCheckIcon SVG or Image if needed */}
      <Text style={styles.icon}>🛡️</Text>
      <Text style={styles.title}>Verify Action</Text>
      <Text style={styles.subtitle}>{successInfo || `Enter the ${OTP_LENGTH}-digit code sent to ${email}.`}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.form}>
        <View style={styles.otpRow}>
          {otp.map((data, index) => (
            <TextInput
              key={index}
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={1}
              value={data}
              onChangeText={value => handleChange(value, index)}
              onKeyPress={e => handleKeyPress(e, index)}
              ref={el => { inputRefs.current[index] = el; }}
              returnKeyType="next"
              textContentType="oneTimeCode"
              accessible
              accessibilityLabel={`OTP digit ${index + 1}`}
            />
          ))}
        </View>
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Verify OTP</Text>
        </TouchableOpacity>
        <View style={styles.resendRow}>
          {resendTimer > 0 ? (
            <Text style={styles.resendText}>Resend OTP in {resendTimer}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResendOtp}>
              <Text style={styles.resendLink}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Text style={styles.backText}>
        Need to change details?{' '}
        <Text style={styles.backLink} onPress={onBackToAuth}>
          Go Back
        </Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f6f8fa',
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#22223b',
  },
  subtitle: {
    color: '#64748b',
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 14,
  },
  error: {
    color: '#ef4444',
    backgroundColor: '#fee2e2',
    padding: 8,
    borderRadius: 8,
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 12,
    width: '100%',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
    alignItems: 'center',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  otpInput: {
    width: 44,
    height: 54,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    marginHorizontal: 4,
    backgroundColor: '#f1f5f9',
    color: '#22223b',
  },
  button: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resendRow: {
    marginTop: 12,
    alignItems: 'center',
  },
  resendText: {
    color: '#64748b',
    fontSize: 13,
  },
  resendLink: {
    color: '#0ea5e9',
    fontWeight: 'bold',
    fontSize: 13,
  },
  backText: {
    marginTop: 24,
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
  },
  backLink: {
    color: '#0ea5e9',
    fontWeight: 'bold',
  },
});

export default OtpVerificationPage; 