import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, StatusBar, Dimensions, Text, Animated } from 'react-native';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();

    return () => {
      // Cleanup animations
      fadeAnim.setValue(0);
      slideAnim.setValue(20);
    };
  }, [fadeAnim, slideAnim]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Animated.View 
        style={[
          styles.animationContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <LottieView
          source={require('../assets/Animation - 1749833614947.json')}
          autoPlay
          loop={false}
          style={styles.animation}
          resizeMode="contain"
          speed={1.2} // Slightly faster playback
        />
      </Animated.View>
      <Animated.View 
        style={[
          styles.textContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: Animated.multiply(slideAnim, -0.5) }]
          }
        ]}
      >
        <View style={styles.weFixContainer}>
          <Text style={[styles.weFixText, styles.weText]}>We</Text>
          <Text style={[styles.weFixText, styles.fixText]}>Fix</Text>
        </View>
        <Text style={styles.tagline}>Your Trusted Home Service Partner</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  animationContainer: {
    flex: 0.7,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    flex: 0.3,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  weFixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  weFixText: {
    fontSize: 42,
    fontWeight: 'bold',
    fontFamily: 'sans-serif-medium',
  },
  weText: {
    color: '#000000', // Black color for 'We'
  },
  fixText: {
    color: '#FF6B35', // Orange color for 'Fix'
  },
  tagline: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default SplashScreen;
