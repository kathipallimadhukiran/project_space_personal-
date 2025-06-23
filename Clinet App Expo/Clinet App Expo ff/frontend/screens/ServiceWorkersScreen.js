import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Platform,
  AppState,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

const ServiceWorkersScreen = ({ route, navigation }) => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const { serviceType } = route.params || {};

  const fetchWorkers = async () => {
    try {
      const response = await fetch(`${API_URL}services?category=${serviceType || ''}`);
      const data = await response.json();
      setWorkers(data);
    } catch (error) {
      console.error('Error fetching workers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkers();

    // Handle app state changes (e.g., resuming from background)
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        fetchWorkers(); // Refresh data when app resumes
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove(); // Clean up listener
    };
  }, [serviceType]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWorkers();
  };

  const handleBookNow = (worker) => {
    navigation.navigate('BookService', {
      worker: {
        ...worker,
        serviceType: worker.category || serviceType || 'General Service',
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <ActivityIndicator size="large" color="#fc8019" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {serviceType ? `${serviceType} Workers` : 'Available Workers'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {workers.length > 0 ? (
          workers.map((worker) => (
            <View key={worker._id} style={[styles.workerCard, { borderRadius: 18, padding: 20, margin: 16, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 10, elevation: 4, borderWidth: 1, borderColor: '#f3f4f6' }]}>
              <View style={styles.workerRow}>
                <View style={[styles.workerAvatar, { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f5f5f5', marginRight: 18, justifyContent: 'center', alignItems: 'center' }]}>
                  {worker.profilePicture?.url ? (
                    <Image source={{ uri: worker.profilePicture.url }} style={{ width: 64, height: 64, borderRadius: 32 }} />
                  ) : (
                  <Ionicons name="person" size={40} color="#888" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 2 }}>{worker.title || worker.name}</Text>
                  {worker.category && (
                    <View style={{ alignSelf: 'flex-start', backgroundColor: '#fc8019', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 4, marginTop: 2 }}>
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>{worker.category}</Text>
                    </View>
                  )}
                  {worker.availabilityStatus && (
                    <View style={{ alignSelf: 'flex-start', backgroundColor: worker.availabilityStatus === 'Available' ? '#e8f5e9' : worker.availabilityStatus === 'Busy' ? '#fffbe6' : '#f3f4f6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 4 }}>
                      <Text style={{ color: worker.availabilityStatus === 'Available' ? '#2e7d32' : worker.availabilityStatus === 'Busy' ? '#bfa100' : '#888', fontWeight: 'bold', fontSize: 13 }}>
                        {worker.availabilityStatus}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.workerEmail}>{worker.userEmail}</Text>
                  {worker.locationName && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                      <Ionicons name="location-outline" size={15} color="#fc8019" style={{ marginRight: 3 }} />
                      <Text style={{ fontSize: 13, color: '#666', flex: 1 }} numberOfLines={1} ellipsizeMode="tail">{worker.locationName}</Text>
                    </View>
                  )}
                  {worker.tags && worker.tags.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10, marginTop: 2 }}>
                      {worker.tags.slice(0, 3).map((tag, i) => (
                        <View key={i} style={{ backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6, marginBottom: 4 }}>
                          <Text style={{ color: '#fc8019', fontSize: 12 }} numberOfLines={1} ellipsizeMode="tail">{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                    <TouchableOpacity
                      style={{ backgroundColor: '#fc8019', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 28, shadowColor: '#fc8019', shadowOpacity: 0.12, shadowRadius: 8, elevation: 2 }}
                      onPress={() => handleBookNow(worker)}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Book Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noWorkersContainer}>
            <Ionicons name="sad-outline" size={48} color="#888" />
            <Text style={styles.noWorkersText}>No workers available at the moment</Text>
            <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    // Remove top padding to let SafeAreaView handle it
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  workerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workerRow: {
    flexDirection: 'row',
  },
  workerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  workerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  workerType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  workerEmail: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    marginLeft: 4,
    color: '#333',
    fontWeight: 'bold',
  },
  ratingSubText: {
    marginLeft: 6,
    color: '#888',
    fontSize: 12,
  },
  distance: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  specialtiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  specialtyChip: {
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  specialtyText: {
    fontSize: 12,
    color: '#377dff',
  },
  workerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  bookNowBtn: {
    backgroundColor: '#fc8019',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bookNowBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  noWorkersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noWorkersText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#fc8019',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ServiceWorkersScreen;