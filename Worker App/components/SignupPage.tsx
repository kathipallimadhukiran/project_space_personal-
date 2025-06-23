import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, Easing, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { APP_LOGO_NAME } from '../constants';

interface SignupPageProps {
  onSignupInitiate: (name: string, email: string, pass: string) => void;
  onSwitchToLogin: () => void;
  error?: string | null;
  loading?: boolean;
}

const SignupPage: React.FC<SignupPageProps> = ({ onSignupInitiate, onSwitchToLogin, error, loading }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Animation states
  const [fadeAnim] = useState(new Animated.Value(0));
  const [formScale] = useState(new Animated.Value(0.8));
  const [buttonScale] = useState(new Animated.Value(1));
  const nameInputAnim = useRef(new Animated.Value(0)).current;
  const emailInputAnim = useRef(new Animated.Value(0)).current;
  const passwordInputAnim = useRef(new Animated.Value(0)).current;
  const confirmPasswordInputAnim = useRef(new Animated.Value(0)).current;

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

  const handleSubmit = () => {
    console.log('Signup submit clicked', name, email, password, confirmPassword);
    if (!name || !email || !password || !confirmPassword) {
      return;
    }
    if (password !== confirmPassword) {
      return;
    }
    if (password.length < 6) {
      return;
    }

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

    onSignupInitiate(name, email, password);
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
            <Text style={styles.subtitle}>Create your worker account.</Text>

            <View style={styles.form}>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <Animated.View style={[styles.inputWrapper, { transform: [{ translateY: nameInputAnim }] }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="John Doe"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    textContentType="name"
                    onFocus={() => animateInput(nameInputAnim, -2)}
                    onBlur={() => animateInput(nameInputAnim, 0)}
                  />
                </Animated.View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email address</Text>
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
                    placeholder="•••••••• (min. 6 characters)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    textContentType="newPassword"
                    onFocus={() => animateInput(passwordInputAnim, -2)}
                    onBlur={() => animateInput(passwordInputAnim, 0)}
                  />
                </Animated.View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <Animated.View style={[styles.inputWrapper, { transform: [{ translateY: confirmPasswordInputAnim }] }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    textContentType="newPassword"
                    onFocus={() => animateInput(confirmPasswordInputAnim, -2)}
                    onBlur={() => animateInput(confirmPasswordInputAnim, 0)}
                  />
                </Animated.View>
              </View>

              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Loading...' : 'Continue to OTP Verification'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>

            <Text style={styles.signinText}>
              Already have an account?{' '}
              <Text style={styles.signinLink} onPress={onSwitchToLogin}>
                Sign in
              </Text>
            </Text>
          </Animated.View>
        </ScrollView>
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
  signinText: {
    color: '#000000', // Black signin text
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  signinLink: {
    color: '#FF6200', // Orange signin link
    fontWeight: '700',
  },
});

export default SignupPage;