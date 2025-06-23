import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  Platform,
  KeyboardAvoidingView,
  Image
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_URL } from '../config';
import AIService from '../services/AIIntegrationService';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppState } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const NVIDIA_API_KEY = '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';
const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

async function sendImageToNvidiaAPI(imageUri) {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
    const headers = {
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    const payload = {
      model: 'meta/llama-4-maverick-17b-128e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `You are an expert home repair and maintenance assistant for the WeFix It app. Look at this image and return ONLY the following in plain text (no extra explanation):\n\nProblem: <describe the problem in one sentence>\nSolution: <describe the recommended solution in one sentence>` },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } }
          ]
        }
      ],
      max_tokens: 512,
      temperature: 1.0,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      stream: false
    };
    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      return data.choices[0].message.content;
    } else {
      return 'Sorry, I could not understand the image.';
    }
  } catch (error) {
    console.error('NVIDIA API error:', error);
    return 'Sorry, there was an error processing the image.';
  }
}

const BookServiceScreen = ({ route, navigation }) => {
  const navigationHook = useNavigation();
  const nav = navigation || navigationHook;
  const worker = route?.params?.worker || {};
  const serviceTypeFromParams = route?.params?.serviceType || worker?.serviceType || '';
  const [refreshKey, setRefreshKey] = useState(0); // For forcing layout refresh

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('App resumed, forcing layout refresh');
        setRefreshKey((prev) => prev + 1); // Trigger re-render
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!worker?._id) {
      nav.reset({
        index: 0,
        routes: [
          { name: 'ServiceWorkers', params: { serviceType: serviceTypeFromParams } }
        ]
      });
    }
  }, [worker, nav, serviceTypeFromParams]);

  if (!worker?._id) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom', 'left', 'right']}>
          <StatusBar barStyle="dark-content" backgroundColor="#f6f7fa" translucent={false} hidden={false} />
          <ActivityIndicator size="large" color="#fc8019" />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const workerWithDefaults = {
    _id: worker._id || 'unknown',
    userEmail: worker.userEmail || 'unknown@example.com',
    serviceType: worker.serviceType || worker.category || 'General Service',
    price: worker.price || worker.rate || 0,
    name: worker.name || worker.title || 'Unknown Worker',
    category: worker.category || worker.serviceType || 'General Service',
    rating: worker.rating || 4.5,
    ...worker
  };

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState('');
  const [serviceType, setServiceType] = useState(workerWithDefaults.serviceType);
  const { user, loading: authLoading } = useAuth();
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [problemImage, setProblemImage] = useState(null);
  const [aiImageNotes, setAiImageNotes] = useState('');

  useEffect(() => {
    if (user?.phone) {
      setPhoneNumber(user.phone);
    }
  }, [user]);

  if (authLoading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom', 'left', 'right']}>
          <StatusBar barStyle="dark-content" backgroundColor="#f6f7fa" translucent={false} hidden={false} />
          <ActivityIndicator size="large" color="#0000ff" />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (!user?.email) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
          <StatusBar barStyle="dark-content" backgroundColor="#f6f7fa" translucent={false} hidden={false} />
          <Text style={styles.errorText}>Please log in to book a service</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const now = new Date();
  const [selectedDate, setSelectedDate] = useState(now);
  const [selectedTime, setSelectedTime] = useState(now);
  const [formattedDate, setFormattedDate] = useState(formatDate(now));
  const [formattedTime, setFormattedTime] = useState(formatTime(now));
  
  const basePrice = worker.price || 150;
  const serviceFee = 10;
  const total = basePrice + serviceFee;

  const onDateChange = (event, selected) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selected) {
      setSelectedDate(selected);
      setFormattedDate(formatDate(selected));
    }
  };

  const onTimeChange = (event, selected) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selected) {
      const hours = selected.getHours();
      if (hours < 8 || hours >= 18) {
        Alert.alert(
          'Invalid Time',
          'Booking time must be between 8:00 AM and 6:00 PM. Please select a different time.',
          [
            { 
              text: 'OK',
              onPress: () => {
                const defaultTime = new Date(selected);
                defaultTime.setHours(8, 0, 0, 0);
                setSelectedTime(defaultTime);
                setFormattedTime(formatTime(defaultTime));
              }
            }
          ]
        );
        return;
      }
      setSelectedTime(selected);
      setFormattedTime(formatTime(selected));
    }
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const showTimepicker = () => {
    setShowTimePicker(true);
  };

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Permission to access location was denied');
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
        
        let address = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (address && address[0]) {
          const { street, city, region, postalCode, country } = address[0];
          const formattedAddress = `${street || ''} ${city || ''} ${region || ''} ${postalCode || ''} ${country || ''}`;
          setAddress(formattedAddress.trim());
        }
      } catch (error) {
        console.error('Error getting location:', error);
        setLocationError('Unable to fetch location');
      }
    })();
  }, []);

  const handleEnhanceNotes = async () => {
    if (!notes.trim()) {
      console.log('No notes to enhance');
      return;
    }
    
    console.log('Starting notes enhancement...');
    setIsEnhancing(true);
    
    try {
      const prompt = `Please enhance the following service request notes to be more detailed and professional. 
Keep the original meaning but make it clearer and more comprehensive. Return only the enhanced text without any additional comments or formatting.

Original notes: ${notes}`;
      
      console.log('Sending prompt to AI service...');
      console.log('Prompt:', prompt);
      
      const enhancedNotes = await AIService.sendMessage(prompt);
      
      console.log('Received enhanced notes:', enhancedNotes);
      
      if (enhancedNotes && typeof enhancedNotes === 'string') {
        const cleanedNotes = enhancedNotes
          .replace(/^\s*["']|["']\s*$/g, '')
          .trim();
        
        setNotes(cleanedNotes);
        console.log('Notes enhanced successfully');
      } else {
        console.warn('Unexpected response format from AI:', enhancedNotes);
        Alert.alert('Error', 'Received an unexpected response from the AI service.');
      }
      
    } catch (error) {
      console.error('Error enhancing notes:', error);
      Alert.alert(
        'Enhancement Failed', 
        error.message || 'Failed to enhance notes. Please try again later.'
      );
    } finally {
      setIsEnhancing(false);
      console.log('Enhancement process completed');
    }
  };

  const pickProblemImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photo library.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0] && result.assets[0].uri) {
        setProblemImage(result.assets[0].uri);
        setAiImageNotes(''); // Reset previous AI notes
        setIsEnhancing(true);
        const aiResponse = await sendImageToNvidiaAPI(result.assets[0].uri);
        setAiImageNotes(aiResponse);
        setIsEnhancing(false);
        // Append only Problem and Solution to notes for user to see/edit
        if (aiResponse) {
          const problemLine = aiResponse.match(/Problem:.*$/im);
          const solutionLine = aiResponse.match(/Solution:.*$/im);
          let summary = '';
          if (problemLine) summary += problemLine[0] + '\n';
          if (solutionLine) summary += solutionLine[0];
          setNotes(prev => prev ? `${prev}\n\n[AI Image Analysis]: ${summary}` : `[AI Image Analysis]: ${summary}`);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick or process image.');
      setIsEnhancing(false);
    }
  };

  const validateForm = () => {
    if (!problemImage) {
      Alert.alert('Image Required', 'Please upload a photo of the damage or problem.');
      return false;
    }
    const errors = [];
    
    if (!formattedDate || formattedDate.trim() === '') {
      errors.push('Please select a date');
    } else {
      const dateRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
      if (!dateRegex.test(formattedDate)) {
        errors.push('Please enter a valid date in DD-MM-YYYY format');
      }
    }
    
    if (!formattedTime || formattedTime.trim() === '') {
      errors.push('Please select a time');
    } else {
      const timeRegex = /^(1[0-2]|0?[1-9]):([0-5][0-9])\s(AM|PM)$/i;
      if (!timeRegex.test(formattedTime)) {
        errors.push('Please enter a valid time in HH:MM AM/PM format');
      }
    }
    
    if (!address || address.trim() === '') {
      errors.push('Please provide a valid address');
    }
    
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
      errors.push('Please enter a valid phone number (10-15 digits)');
    }
    
    return errors.length === 0;
  };

  const handleConfirmBooking = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    setError('');
    try {
      // Combine notes and AI image notes
      const combinedNotes = aiImageNotes
        ? `${notes}\n\n[AI Image Analysis]: ${aiImageNotes}`
        : notes;

      const selectedDateTime = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        selectedTime.getHours(),
        selectedTime.getMinutes()
      );
      
      if (isNaN(selectedDateTime.getTime())) {
        throw new Error('Invalid date or time selected');
      }
      
      if (selectedDateTime < new Date()) {
        Alert.alert(
          'Invalid Date/Time',
          'Please select a future date and time for your booking.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      const hours = selectedTime.getHours();
      if (hours < 8 || hours >= 18) {
        Alert.alert(
          'Invalid Time',
          'Booking time must be between 8:00 AM and 6:00 PM. Please select a different time.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      const customerEmail = user.email;
      const customerId = customerEmail;
      
      if (!workerWithDefaults._id || !workerWithDefaults.userEmail) {
        navigation.replace('ServiceWorkers', { 
          serviceType: workerWithDefaults.serviceType || '' 
        });
        return null;
      }
      
      if (!location || !location.coords) {
        throw new Error('Could not determine your location. Please enable location services and try again.');
      }

      const bookingData = {
        serviceId: workerWithDefaults._id,
        workerId: workerWithDefaults._id,
        workerEmail: workerWithDefaults.userEmail,
        serviceType: workerWithDefaults.serviceType,
        customerId: customerId,
        customerEmail: customerEmail,
        customerPhone: phoneNumber,
        bookingDate: selectedDateTime.toISOString(),
        address: {
          text: address,
          coordinates: {
            lat: location.coords.latitude,
            lng: location.coords.longitude
          }
        },
        notes: combinedNotes,
        price: basePrice,
        serviceFee: serviceFee,
        totalAmount: total,
        status: 'pending',
        paymentStatus: 'pending'
      };

      console.log('Sending booking data:', JSON.stringify(bookingData, null, 2));

      const requiredFields = [
        { field: bookingData.serviceId, name: 'serviceId' },
        { field: bookingData.workerId, name: 'workerId' },
        { field: bookingData.workerEmail, name: 'workerEmail' },
        { field: bookingData.customerId, name: 'customerId' },
        { field: bookingData.customerEmail, name: 'customerEmail' },
        { field: bookingData.customerPhone, name: 'customerPhone' },
        { field: bookingData.serviceType, name: 'serviceType' },
        { field: bookingData.bookingDate, name: 'bookingDate' },
        { field: bookingData.address?.text, name: 'address.text' },
        { field: bookingData.price, name: 'price' },
        { field: bookingData.totalAmount, name: 'totalAmount' }
      ];

      const missingFields = requiredFields
        .filter(({ field }) => field === undefined || field === null || field === '')
        .map(({ name }) => name);

      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      const response = await fetch(`${API_URL}bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('API Error Response:', result);
        throw new Error(result.message || `Failed to create booking. Status: ${response.status}`);
      }

      // Navigate to success screen with booking details
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            { 
              name: 'Success', 
              params: { 
                message: 'Your booking has been confirmed!\n\nYou will receive a confirmation email with all the details shortly.',
                buttonText: 'Back to Home'
              } 
            },
          ],
        })
      );
    } catch (error) {
      if(!error.message.includes('This time slot is not available. Please select a different time.')){
        console.error('Booking error:', error);
      }
      Alert.alert(
        'Message',
        error.message || 'Failed to create booking. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']} key={refreshKey}>
        <StatusBar barStyle="dark-content" backgroundColor="#f6f7fa" translucent={false} hidden={false} />
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollViewContent}
          >
            <View style={styles.header}>
              <Text style={styles.logo}>We<Text style={{ color: '#fc8019' }}>Fix</Text>It</Text>
            </View>
            <Text style={styles.sectionTitle}>Book a Service</Text>
            <View style={styles.cardBox}>
              <Text style={styles.cardTitle}>Service Provider</Text>
              <View style={styles.workerBox}>
                <View style={styles.workerInfoContainer}>
                  <View style={styles.workerAvatar}>
                    <Ionicons name="person" size={32} color="#fff" />
                  </View>
                  <View style={styles.workerDetails}>
                    <Text style={styles.workerName}>{workerWithDefaults.name}</Text>
                    <Text style={styles.workerType}>{workerWithDefaults.category}</Text>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={16} color="#FFD700" />
                      <Text style={styles.ratingText}>{workerWithDefaults.rating.toFixed(1)}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.changeBtn}
                  onPress={() => navigation.navigate('ServiceWorkers', { 
                    serviceType: workerWithDefaults.serviceType 
                  })}
                >
                  <Text style={styles.changeBtnText}>Change</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.cardBox}>
              <Text style={styles.cardTitle}>Service Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Service Type</Text>
                <Text style={styles.detailValue}>{workerWithDefaults.serviceType}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Rate</Text>
                <Text style={[styles.detailValue, styles.priceText]}>
                  ₹{workerWithDefaults.price.toFixed(2)} {workerWithDefaults.rateType === 'hourly' ? '/hour' : '/service'}
                </Text>
              </View>
              <Text style={styles.label}>Date <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity onPress={showDatepicker} style={styles.inputBox}>
                <TextInput
                  value={formattedDate}
                  placeholder="Select date"
                  style={styles.input}
                  editable={false}
                  pointerEvents="none"
                />
                <Ionicons name="calendar-outline" size={20} color="#bbb" style={styles.inputIcon} />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  minimumDate={new Date()}
                />
              )}
              <Text style={styles.label}>Time <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity onPress={showTimepicker} style={styles.inputBox}>
                <TextInput
                  value={formattedTime}
                  placeholder="Select time (8:00 AM - 5:45 PM)"
                  style={styles.input}
                  editable={false}
                  pointerEvents="none"
                />
                <Ionicons name="time-outline" size={20} color="#bbb" style={styles.inputIcon} />
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onTimeChange}
                  minuteInterval={15}
                  minimumTime={new Date(0, 0, 0, 8, 0, 0)}
                  maximumTime={new Date(0, 0, 0, 17, 45, 0)}
                />
              )}
              <Text style={styles.label}>Location (Address) <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputBox}>
                <Ionicons name="location-outline" size={20} color="#bbb" style={styles.inputIconLeft} />
                <TextInput 
                  value={address} 
                  onChangeText={setAddress} 
                  placeholder="Enter service address" 
                  style={[styles.input, { paddingLeft: 32 }]} 
                />
              </View>
              <Text style={styles.label}>Phone Number <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputBox}>
                <Ionicons name="call-outline" size={20} color="#bbb" style={styles.inputIconLeft} />
                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Enter your phone number"
                  style={[styles.input, { paddingLeft: 32 }]}
                  keyboardType="phone-pad"
                  maxLength={15}
                />
              </View>
              <View style={styles.formSection}>
                <Text style={styles.label}>Upload a Photo of the Problem <Text style={{ color: 'red' }}>*</Text></Text>
                <TouchableOpacity style={styles.uploadBtn} onPress={pickProblemImage} disabled={isEnhancing}>
                  <Ionicons name="image-outline" size={24} color="#fc8019" />
                  <Text style={styles.uploadBtnText}>{problemImage ? 'Change Photo' : 'Upload Photo'}</Text>
                  {isEnhancing && <ActivityIndicator size="small" color="#fc8019" style={{ marginLeft: 8 }} />}
                </TouchableOpacity>
                {problemImage && (
                  <View style={styles.imagePreviewWrap}>
                    <Image source={{ uri: problemImage }} style={styles.imagePreview} />
                    {aiImageNotes ? (
                      <View style={styles.aiNotesWrap}>
                        <Text style={styles.aiNotesLabel}>AI Analysis:</Text>
                        <Text style={styles.aiNotesText}>{aiImageNotes}</Text>
                      </View>
                    ) : isEnhancing ? (
                      <Text style={styles.aiNotesText}>Analyzing image...</Text>
                    ) : null}
                  </View>
                )}
              </View>
              <View style={styles.notesHeader}>
                <Text style={styles.label}>Additional Notes (Optional)</Text>
                {notes.length > 0 && (
                  <TouchableOpacity 
                    style={styles.enhanceButton}
                    onPress={handleEnhanceNotes}
                    disabled={isEnhancing}
                  >
                    {isEnhancing ? (
                      <ActivityIndicator size="small" color="#fc8019" />
                    ) : (
                      <Text style={styles.enhanceButtonText}>
                        <Ionicons name="star" size={14} color="#fc8019" /> Enhance with AI
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
              <View style={[styles.inputBox, { position: 'relative' }]}>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any specific instructions or details..."
                  style={[styles.input, { 
                    height: 80, 
                    textAlignVertical: 'top',
                    paddingRight: 40
                  }]}
                  multiline
                />
                {notes.length > 0 && (
                  <TouchableOpacity 
                    style={styles.clearNotesButton}
                    onPress={() => setNotes('')}
                  >
                    <Ionicons name="close-circle" size={20} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <View style={styles.footerContainer}>
              <TouchableOpacity 
                style={[styles.confirmBtn, (isLoading || authLoading) && styles.disabledBtn]} 
                onPress={handleConfirmBooking}
                disabled={isLoading || authLoading}
              >
                {isLoading || authLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Confirm Booking</Text>
                )}
              </TouchableOpacity>
              <Text style={styles.footerText}>© 2025 WeFixIt Client App. All rights reserved. (Demo Version)</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default BookServiceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7fa',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f6f7fa',
  },
  scrollViewContent: {
    paddingBottom: 80,
  },
  workerInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  workerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fc8019',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workerDetails: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  workerType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#888',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  priceText: {
    color: '#fc8019',
    fontWeight: '600',
    fontSize: 16,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  logo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a2a4e',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginHorizontal: 18,
    marginBottom: 10,
    marginTop: 8,
  },
  cardBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 18,
    marginBottom: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontWeight: 'bold',
    color: '#222',
    fontSize: 16,
    marginBottom: 8,
  },
  workerBox: {
    backgroundColor: '#f6f7fa',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    marginTop: 6,
    marginBottom: 2,
  },
  changeBtn: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 18,
  },
  changeBtnText: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 15,
  },
  label: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 10,
    marginBottom: 4,
  },
  required: {
    color: '#ff0000',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6f7fa',
    borderRadius: 8,
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  inputIcon: {
    marginLeft: -28,
  },
  inputIconLeft: {
    position: 'absolute',
    left: 10,
    zIndex: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  priceLabel: {
    color: '#222',
    fontSize: 15,
  },
  priceValue: {
    color: '#222',
    fontSize: 15,
  },
  priceLabelBold: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 16,
  },
  priceValueBold: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmBtn: {
    backgroundColor: '#fc8019',
    borderRadius: 10,
    paddingVertical: 14,
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    alignSelf: 'center',
    elevation: 3,
    shadowColor: '#fc8019',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginTop: 10,
    marginBottom: 5,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 6,
  },
  loginButton: {
    backgroundColor: '#fc8019',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footerContainer: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 16,
  },
  footerText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 16,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  enhanceButton: {
    padding: 4,
    borderRadius: 12,
  },
  enhanceButtonText: {
    color: '#fc8019',
    fontSize: 12,
    fontWeight: '500',
  },
  clearNotesButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f7fa',
  },
  errorText: {
    fontSize: 16,
    color: '#ff0000',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputError: {
    borderWidth: 1,
    borderColor: 'red',
  },
  formSection: {
    marginBottom: 10,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6f7fa',
    borderRadius: 8,
    padding: 10,
  },
  uploadBtnText: {
    color: '#222',
    fontSize: 15,
    marginLeft: 8,
  },
  imagePreviewWrap: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  aiNotesWrap: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  aiNotesLabel: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  aiNotesText: {
    color: '#666',
    fontSize: 15,
  },
});