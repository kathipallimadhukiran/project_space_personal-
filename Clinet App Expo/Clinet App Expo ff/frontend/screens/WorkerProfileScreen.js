import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Linking, Dimensions, FlatList } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { API_URL } from '../config';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppState } from 'react-native';

export default function WorkerProfileScreen({ route, navigation }) {
  const nav = navigation || useNavigation();
  const r = route || useRoute();
  const passedWorker = r.params?.worker;
  const [worker, setWorker] = useState(passedWorker || null);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState('');
  const [workerData, setWorkerData] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('App resumed, forcing layout refresh');
        setRefreshKey((prev) => prev + 1);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const fetchWorkerDetails = async () => {
    if (!passedWorker?.userEmail) {
      console.error('No userEmail provided in passedWorker:', passedWorker);
      setError('Worker email is missing');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching worker with email:', passedWorker.userEmail);
      const response = await fetch(`${API_URL}/worker/${encodeURIComponent(passedWorker.userEmail)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Worker fetch error response:', errorData);
        throw new Error(`Failed to fetch worker: ${errorData.message || response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Worker data received:', data);
      
      if (data.success && data.worker) {
        setWorkerData(data.worker);
        setWorker(data.worker);
        generateAiSummary(data.worker);
      } else {
        throw new Error('Worker data not found or invalid format');
      }
    } catch (error) {
      console.error('Error fetching worker details:', error);
      setError(`Failed to load worker details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkerDetails();
  }, [passedWorker.userEmail]);

  const generateAiSummary = async (workerData) => {
    if (!workerData) {
      setAiSummary('Professional information not available.');
      return;
    }
    
    setSummaryLoading(true);
    try {
      const workerName = workerData?.name || 'This professional';
      const serviceCategory = workerData?.serviceCategory || 'service provider';
      const experience = workerData?.experienceLevel ? `${workerData.experienceLevel} years of experience` : 'considerable experience';
      const bio = workerData?.bio ? ` ${workerData.bio}` : '';
      const availability = workerData?.availabilityStatus === 'Available' ? 'currently available' : 'not currently available';
      
      const summary = `${workerName} is a professional ${serviceCategory} with ${experience} in the field.` +
                     `${bio} ` +
                     `They are ${availability} for new projects. ` +
                     `Contact them at ${workerData?.phone || 'the provided contact number'} for inquiries.`;
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAiSummary(summary);
    } catch (error) {
      console.error('Error generating AI summary:', error);
      setAiSummary('Professional summary not available at the moment.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchReviews = async (workerEmail) => {
    if (!workerEmail) {
      console.error('No worker email provided');
      setReviewsError('Worker email is missing');
      return;
    }
    
    setReviewsLoading(true);
    setReviewsError('');
    
    try {
      const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
      const baseApiUrl = baseUrl.replace('/api/client', '');
      const endpoint = `/api/clientreviews/worker/${encodeURIComponent(workerEmail)}`;
      const reviewsUrl = `${baseApiUrl}${endpoint}`;
      
      console.log('API_URL:', API_URL);
      console.log('Constructed reviews URL:', reviewsUrl);
      
      console.log('Making request to:', reviewsUrl);
      const startTime = Date.now();
      
      const response = await fetch(reviewsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const responseTime = Date.now() - startTime;
      console.log(`Request completed in ${responseTime}ms`);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response text:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        throw new Error(`Failed to fetch reviews: ${errorData.message || response.status}`);
      }
      
      const responseData = await response.json();
      console.log('Reviews response data:', responseData);
      
      if (responseData.success && Array.isArray(responseData.reviews)) {
        const formattedReviews = responseData.reviews.map(review => {
          console.log('Raw review data:', JSON.stringify(review, null, 2));
          
          const rating = review.rating || review.worker?.rating || 0;
          
          return {
            _id: review._id,
            customerName: review.client?.name || review.customerName || 'Anonymous',
            customerEmail: review.client?.email || review.customerEmail,
            rating: Number(rating),
            comment: review.comment || review.worker?.review || '',
            createdAt: review.createdAt,
            workerResponse: review.workerResponse?.response,
            workerResponseDate: review.workerResponse?.respondedAt
          };
        });
        
        console.log('Formatted reviews:', formattedReviews);
        
        const totalRating = formattedReviews.reduce((sum, review) => sum + (review.rating || 0), 0);
        const avgRating = formattedReviews.length > 0 ? (totalRating / formattedReviews.length).toFixed(1) : 0;
        
        setReviews(formattedReviews);
        setAverageRating(parseFloat(avgRating));
        setTotalReviews(formattedReviews.length);
        
        if (worker) {
          setWorker(prev => ({
            ...prev,
            rating: parseFloat(avgRating),
            totalReviews: formattedReviews.length
          }));
        }
      } else {
        console.warn('No reviews found or unexpected response format:', responseData);
        setReviewsError(responseData.message || 'No reviews found');
      }
    } catch (error) {
      console.error('Error in fetchReviews:', error);
      setReviewsError(error.message || 'Failed to load reviews');
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchWorkerDataCalled = React.useRef(false);

  useEffect(() => {
    console.log('useEffect triggered');
    console.log('passedWorker:', passedWorker);
    
    const fetchWorkerData = async () => {
      if (fetchWorkerDataCalled.current) {
        console.log('fetchWorkerData already called, skipping');
        return;
      }
      fetchWorkerDataCalled.current = true;
      
      const workerEmail = passedWorker?.email || passedWorker?.userEmail;
      console.log('fetchWorkerData - workerEmail:', workerEmail);
      
      if (!workerEmail) {
        console.error('No email found in passedWorker');
        setError('Worker information is incomplete');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      try {
        const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
        const workerUrl = `${baseUrl}/worker/${encodeURIComponent(workerEmail)}`;
        console.log('Fetching worker data from:', workerUrl);
        
        const res = await fetch(workerUrl);
        console.log('Worker data response status:', res.status);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Worker data error response:', errorText);
          throw new Error(`Failed to fetch worker data: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('Worker data API Response:', data);
        
        if (data.success && data.worker) {
          const newWorkerData = {
            ...data.worker,
            name: data.worker.name || 'Service Professional',
            email: data.worker.email || passedWorker?.email || '',
            phone: data.worker.phone || data.worker.phoneNumber || 'Not provided',
            serviceCategory: data.worker.serviceCategory || 'General Service',
            experienceLevel: data.worker.experienceLevel || 'Intermediate',
            bio: data.worker.bio || 'No bio available',
            availabilityStatus: data.worker.availabilityStatus || 'Available',
            rating: data.worker.rating || 0,
            totalReviews: data.worker.totalReviews || 0,
            location: data.worker.location || 'Location not specified',
            profilePictureUrl: data.worker.profilePicture?.url || 
                             data.worker.avatar || 
                             passedWorker?.profilePictureUrl || 
                             'https://randomuser.me/api/portraits/men/32.jpg'
          };
          
          console.log('Setting worker data from API:', newWorkerData);
          setWorker(newWorkerData);
          setWorkerData(newWorkerData);
          
          console.log('Generating AI summary...');
          generateAiSummary(newWorkerData);
          
          const emailToUse = newWorkerData.email || passedWorker?.email || passedWorker?.userEmail;
          console.log('Preparing to fetch reviews for email:', emailToUse);
          
          if (emailToUse) {
            console.log('Calling fetchReviews with email:', emailToUse);
            await fetchReviews(emailToUse);
          } else {
            console.error('No valid email found to fetch reviews');
          }
        } else {
          console.error('Worker data not found or invalid response:', data);
          setError(data?.message || 'Failed to load worker details');
        }
      } catch (e) {
        console.error('Error fetching worker:', e);
        setError(e.message || 'An error occurred while loading worker data');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkerData();
  }, [passedWorker?.email, passedWorker?.userEmail]);

  if (loading || !worker) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom', 'left', 'right']}>
          <StatusBar barStyle="dark-content" backgroundColor="#f6f7fa" translucent={false} hidden={false} />
          <ActivityIndicator color="#fc8019" size="large" />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (error) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom', 'left', 'right']}>
          <StatusBar barStyle="dark-content" backgroundColor="#f6f7fa" translucent={false} hidden={false} />
          <Text style={styles.errorText}>{error}</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const avatar = worker.profilePicture?.url
    ? `${worker.profilePicture.url.replace('0.0.0.0', '192.168.31.126')}?t=${Date.now()}`
    : worker.avatar
      ? worker.avatar
      : 'https://randomuser.me/api/portraits/men/32.jpg';

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']} key={refreshKey}>
        <StatusBar barStyle="dark-content" backgroundColor="#f6f7fa" translucent={false} hidden={false} />
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.header}>
            <Text style={styles.logo}>We<Text style={{ color: '#fc8019' }}>Fix</Text>It</Text>
          </View>
          <View style={styles.profileCard}>
            <View style={styles.profileBg} />
            <View style={styles.avatarWrap}>
              <Image 
                source={{ uri: avatar }} 
                style={styles.avatar} 
                onError={(e) => console.log('Failed to load image:', e.nativeEvent.error)}
              />
            </View>
            <Text style={styles.name}>{worker.name || 'Worker Name'}</Text>
            <Text style={styles.status}>
              Status: {worker.availabilityStatus || worker.status || 'Available'}
            </Text>
            <Text style={styles.phone}>
              Phone: {worker.phone || worker.phoneNumber || 'Not provided'}
            </Text>
            <Text style={styles.service}>
              {worker.serviceCategory || worker.serviceType || worker.category || 'Service Professional'}
            </Text>
            <View style={styles.ratingRow}>
              <View style={styles.starContainer}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = star <= Math.round(averageRating);
                  const halfFilled = star - 0.5 <= averageRating && star > averageRating;
                  
                  return (
                    <View key={star} style={styles.starIconContainer}>
                      <Ionicons 
                        name={filled ? 'star' : halfFilled ? 'star-half' : 'star-outline'}
                        size={18} 
                        color="#FFD700"
                        style={styles.starIcon}
                      />
                    </View>
                  );
                })}
              </View>
              <Text style={styles.ratingText}>
                {averageRating || 'No'} {averageRating <= 1 ? 'star' : 'stars'} • {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
              </Text>
              {worker.verified && (
                <>
                  <MaterialIcons name="verified" size={18} color="#4ade80" style={{ marginLeft: 8 }} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </>
              )}
            </View>
            <View style={styles.tagsRow}>
              {worker.experienceLevel && <View style={styles.tag}><Text style={styles.tagText}>{worker.experienceLevel}</Text></View>}
              {worker.availabilityStatus && <View style={styles.tag}><Text style={styles.tagText}>{worker.availabilityStatus}</Text></View>}
              {worker.bio && <View style={[styles.tag, { backgroundColor: '#f3e8ff' }]}><Text style={[styles.tagText, { color: '#a21caf' }]}>{worker.bio}</Text></View>}
            </View>
          </View>
          <TouchableOpacity style={styles.bookNowBtn} onPress={() => nav.navigate('BookService', { worker })}>
            <Ionicons name="calendar" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.bookNowText}>Book Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.callBtn} onPress={() => worker.phone && Linking.openURL(`tel:${worker.phone}`)}>
            <Ionicons name="call" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.bookNowText}>Call</Text>
          </TouchableOpacity>
          <View style={styles.summaryContainer}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            {summaryLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fc8019" />
                <Text style={styles.loadingText}>Generating professional summary...</Text>
              </View>
            ) : (
              <Text style={styles.summaryText}>
                {aiSummary || 'No professional summary available.'}
              </Text>
            )}
          </View>
          <View style={styles.skillsContainer}>
            <Text style={styles.sectionTitle}>Skills & Expertise</Text>
            <View style={styles.skillsGrid}>
              {[
                worker.serviceCategory,
                worker.experienceLevel,
                worker.bio?.split('.')[0],
                'Customer Service',
                'Professional'
              ].filter(Boolean).map((skill, index) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.reviewsContainer}>
            <Text style={styles.sectionTitle}>Customer Reviews</Text>
            {reviewsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fc8019" />
                <Text style={styles.loadingText}>Loading reviews...</Text>
              </View>
            ) : reviewsError ? (
              <Text style={styles.noReviewsText}>{reviewsError}</Text>
            ) : reviews.length === 0 ? (
              <Text style={styles.noReviewsText}>No reviews yet. Be the first to review!</Text>
            ) : (
              <FlatList
                data={reviews}
                keyExtractor={(item, index) => item._id || `review-${index}`}
                renderItem={({ item }) => (
                  <View style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewerInfo}>
                        <Ionicons name="person-circle" size={32} color="#fc8019" />
                        <View style={styles.reviewerDetails}>
                          <Text style={styles.reviewerName}>
                            {item.customerName}
                          </Text>
                          <View style={styles.ratingContainer}>
                            {[...Array(5)].map((_, i) => (
                              <Ionicons
                                key={i}
                                name={i < item.rating ? 'star' : 'star-outline'}
                                size={16}
                                color="#FFD700"
                                style={styles.starIcon}
                              />
                            ))}
                            <Text style={styles.reviewDate}>
                              {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    {item.comment && (
                      <Text style={styles.reviewComment}>{item.comment}</Text>
                    )}
                    {item.workerResponse && (
                      <View style={styles.workerResponseContainer}>
                        <Text style={styles.workerResponseTitle}>
                          <Ionicons name="chatbubbles" size={16} color="#fc8019" /> Worker's Response
                        </Text>
                        <Text style={styles.workerResponseText}>{item.workerResponse}</Text>
                        {item.workerResponseDate && (
                          <Text style={styles.workerResponseDate}>
                            {new Date(item.workerResponseDate).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                )}
                scrollEnabled={false}
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7fa',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f6f7fa',
  },
  scrollViewContent: {
    paddingBottom: 80,
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
  profileCard: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    marginHorizontal: 18,
    marginTop: 8,
    marginBottom: 0,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  profileBg: {
    backgroundColor: 'white',
    height: 100,
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    zIndex: 1,
  },
  avatarWrap: {
    marginTop: 60,
    marginBottom: 8,
    zIndex: 2,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#fff',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#222',
    marginTop: 4,
    zIndex: 2,
  },
  service: {
    color: '#888',
    fontSize: 15,
    marginBottom: 2,
    zIndex: 2,
  },
  status: {
    color: '#888',
    fontSize: 15,
    marginBottom: 2,
    zIndex: 2,
  },
  phone: {
    color: '#888',
    fontSize: 15,
    marginBottom: 2,
    zIndex: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  starContainer: {
    flexDirection: 'row',
    marginRight: 8,
    alignItems: 'center',
  },
  starIcon: {
    marginRight: 2,
  },
  starIconContainer: {
    marginRight: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    color: '#222',
    fontWeight: 'bold',
    fontSize: 14,
  },
  verifiedText: {
    marginLeft: 2,
    color: '#4ade80',
    fontWeight: 'bold',
    fontSize: 13,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    marginBottom: 8,
    zIndex: 2,
  },
  tag: {
    backgroundColor: '#fff7f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    color: '#fc8019',
    fontWeight: 'bold',
    fontSize: 12,
  },
  bookNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fc8019',
    borderRadius: 10,
    paddingVertical: 14,
    marginHorizontal: 18,
    marginTop: 18,
    marginBottom: 8,
    justifyContent: 'center',
  },
  bookNowText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fc8019',
    borderRadius: 10,
    paddingVertical: 14,
    marginHorizontal: 18,
    marginTop: 18,
    marginBottom: 8,
    justifyContent: 'center',
  },
  reviewsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reviewCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewerDetails: {
    marginLeft: 10,
    flex: 1,
  },
  reviewerName: {
    fontWeight: '600',
    fontSize: 15,
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  starIcon: {
    marginRight: 2,
  },
  reviewDate: {
    marginLeft: 8,
    fontSize: 12,
    color: '#888',
  },
  reviewComment: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginTop: 8,
  },
  noReviewsText: {
    textAlign: 'center',
    color: '#888',
    marginVertical: 16,
    fontStyle: 'italic',
  },
  workerResponseContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#fc8019',
  },
  workerResponseTitle: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  workerResponseText: {
    color: '#555',
    fontSize: 14,
    lineHeight: 20,
  },
  workerResponseDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    textAlign: 'right',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f7fa',
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
    color: '#ff0000',
    textAlign: 'center',
    margin: 20,
  },
  skillsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillTag: {
    backgroundColor: '#f0f4ff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    margin: 4,
    borderWidth: 1,
    borderColor: '#d0e3ff',
  },
  skillText: {
    color: '#0066cc',
    fontSize: 13,
    fontWeight: '500',
  },
  portfolioHeader: {
    display: 'none',
  },
  portfolioGrid: {
    display: 'none',
  },
});