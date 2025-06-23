import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar, 
  ActivityIndicator, 
  RefreshControl,
  Dimensions,
  Animated,
  Easing,
  Image
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { AppState } from 'react-native';
import HomeSkeleton from '../components/HomeSkeleton';
import { useAuth } from '../contexts/AuthContext';

const MOCK_CATEGORIES = [
  { id: '1', name: 'Plumbing', icon: <MaterialIcons name="plumbing" size={18} color="#fc8019" /> },
  { id: '2', name: 'Electrical', icon: <MaterialIcons name="electrical-services" size={18} color="#fc8019" /> },
  { id: '3', name: 'Carpentry', icon: <FontAwesome5 name="hammer" size={16} color="#fc8019" /> },
];

const MOCK_WORKERS = [
  { id: '1', name: 'John Doe', serviceType: 'Plumbing', rating: 4.8, distance: 1.5, specialties: ['Pipe Repair', 'Drain Cleaning'] },
  { id: '2', name: 'Jane Smith', serviceType: 'Electrical', rating: 4.5, distance: 2.1, specialties: ['Wiring', 'Lighting'] },
  { id: '3', name: 'Alex Brown', serviceType: 'Carpentry', rating: 4.7, distance: 0.9, specialties: ['Furniture', 'Wood Repair'] },
  { id: '4', name: 'Emily Clark', serviceType: 'Plumbing', rating: 4.6, distance: 2.3, specialties: ['Leak Fix', 'Pipe Installation'] },
  { id: '5', name: 'Michael Lee', serviceType: 'Electrical', rating: 4.9, distance: 1.2, specialties: ['Circuit Breaker', 'Fan Installation'] },
];

const NAV_ITEMS = [
  { label: 'Home', icon: <Ionicons name="home" size={22} />, active: true },
  { label: 'Bookings', icon: <MaterialIcons name="event-note" size={22} /> },
  { label: 'Chat', icon: <Ionicons name="chatbubble-ellipses" size={22} /> },
  { label: 'Payments', icon: <FontAwesome name="credit-card" size={20} /> },
  { label: 'Account', icon: <MaterialCommunityIcons name="account-circle" size={22} /> },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // For forcing layout refresh
  const navigation = useNavigation();
  const [cardAnim] = useState(new Animated.Value(0));
  const [userProfile, setUserProfile] = useState(null);

  // Fetch user profile (name, avatar) on mount if user is logged in
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.email) {
        try {
          const res = await fetch(`${API_URL.replace('/api/client', '/api/clientuser/')}${user.email}`);
          if (res.ok) {
            const data = await res.json();
            setUserProfile(data);
          }
        } catch (err) {
          // fallback to nothing
        }
      }
    };
    fetchUserProfile();
  }, [user?.email]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchWorkers();
      // Reset any active filters
      setSearchTerm('');
      setActiveCategory(null);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

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
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();
  }, [filteredWorkers]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    setLoading(true);

    try {
      const filtered = workers.filter(worker => {
        return (
          worker.title?.toLowerCase().includes(term.toLowerCase()) ||
          worker.category?.toLowerCase().includes(term.toLowerCase()) ||
          (worker.tags && worker.tags.some(tag => 
            tag.toLowerCase().includes(term.toLowerCase())
          ))
        );
      });

      setFilteredWorkers(filtered);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter workers based on search term and active category
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      let filtered = [...workers];
      
      // Apply search filter if search term exists
      if (searchTerm) {
        filtered = filtered.filter(worker => {
          return (
            worker.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            worker.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (worker.tags && worker.tags.some(tag => 
              tag.toLowerCase().includes(searchTerm.toLowerCase())
            ))
          );
        });
      }
      
      // Apply category filter if active
      if (activeCategory) {
        filtered = filtered.filter(worker => 
          worker.category?.toLowerCase() === activeCategory.toLowerCase()
        );
      }
      
      setFilteredWorkers(filtered);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, workers, activeCategory]);

  const fetchWorkers = async () => {
    try {
      // Only show loading indicator if it's not a pull-to-refresh action
      if (!refreshing) {
        setLoading(true);
      }
      
      const response = await fetch(`${API_URL}services`);
      const data = await response.json();
      setServices(data);
      setWorkers(data);
      setFilteredWorkers(data);
    } catch (error) {
      console.error('Error fetching workers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleViewProfile = (worker) => {
    navigation.navigate('WorkerProfile', { worker });
  };

  const handleBookNow = (worker) => {
    navigation.navigate('BookService', { worker });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 18) return 'Good afternoon,';
    return 'Good evening,';
  };

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} hidden={false} />
          <HomeSkeleton />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']} key={refreshKey}>
        <StatusBar barStyle="light-content" backgroundColor="white"/>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#fc8019']}
              tintColor="#fc8019"
              title="Refreshing..."
              titleColor="#666"
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>We<Text style={{ color: '#fc8019' }}>Fix</Text>It</Text>
          </View>
          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#aaa" style={{ marginLeft: 10 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search services, workers, or keywords..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor="#bbb"
            />
          </View>
          {/* Personalized Greeting */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 18, marginTop: 10, marginBottom: 8 }}>
            <Image source={userProfile?.avatar ? { uri: userProfile.avatar } : require('../assets/logo.png')} style={{ width: 38, height: 38, borderRadius: 19, marginRight: 12, backgroundColor: '#eee' }} />
            <View>
              <Text style={{ fontSize: 16, color: '#888' }}>{getGreeting()}</Text>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#222' }}>{userProfile?.name || user?.name || user?.email || 'User'}!</Text>
            </View>
          </View>
          {/* Featured Carousel */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18, marginHorizontal: 0, paddingLeft: 18 }}>
            {[1,2,3].map(i => (
              <View key={i} style={{ backgroundColor: i === 1 ? '#fc8019' : i === 2 ? '#1976d2' : '#7b1fa2', borderRadius: 10, width: 260, height: 110, marginRight: 16, justifyContent: 'center', padding: 18, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2, borderWidth: 2, borderColor: '#fff',marginRight: 30 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18, marginBottom: 4 }}>Featured Service {i}</Text>
                <Text style={{ color: '#fff7f0', fontSize: 14 }}>Special offer or highlight goes here.</Text>
              </View>
            ))}
          </ScrollView>
          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.primaryBtn} 
              onPress={() => navigation.navigate('ServiceWorkers', { serviceType: '' })}
            >
              <Text style={styles.primaryBtnText}>Book a Service</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Bookings')}>
              <Text style={styles.secondaryBtnText}>View My Bookings</Text>
            </TouchableOpacity>
          </View>
          {/* Categories */}
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow}>
            {MOCK_CATEGORIES.map(category => {
              const isActive = activeCategory === category.name.toLowerCase();
              return (
                <Animated.View key={category.id} style={{
                  transform: [{ scale: isActive ? 1.12 : 1 }],
                  opacity: isActive ? 1 : 0.8,
                }}>
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 18,
                        paddingVertical: 10,
                        marginRight: 14,
                        marginBottom: 4,
                        backgroundColor: isActive ? '#000' : '#f3f4f6',
                        borderRadius: 18,
                        shadowColor: isActive ? '#000' : 'transparent',
                        shadowOpacity: isActive ? 0.12 : 0,
                        shadowRadius: isActive ? 8 : 0,
                        elevation: isActive ? 2 : 0,
                      },
                    ]}
                    onPress={() => setActiveCategory(isActive ? null : category.name.toLowerCase())}
                  >
                    {category.icon}
                    <Text style={{
                      color: isActive ? '#fff' : '#000',
                      fontWeight: 'bold',
                      fontSize: 16,
                      marginLeft: 8,
                      letterSpacing: 0.5,
                    }}>{category.name}</Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </ScrollView>
          {/* Nearby Workers */}
          <View style={styles.nearbyHeader}>
            <Text style={styles.sectionTitle}>Nearby Workers</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ServiceWorkers', { serviceType: '' })}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0066cc" />
              <Text style={styles.loadingText}>Finding the best matches...</Text>
            </View>
          ) : filteredWorkers.length > 0 ? (
            filteredWorkers.map((worker, idx) => (
              <Animated.View key={worker._id || idx} style={{
                opacity: cardAnim,
                transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
              }}>
                <View style={[styles.workerCard, { backgroundColor: '#fff', borderRadius: 18, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2, marginHorizontal: 18, marginBottom: 18, padding: 16 }]}> 
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image source={worker.profilePicture?.url ? { uri: worker.profilePicture.url } : require('../assets/logo.png')} style={{ width: 54, height: 54, borderRadius: 14, marginRight: 14, backgroundColor: '#eee' }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 2 }}>{worker.title || worker.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                        <Text style={{ fontSize: 13, color: '#888', marginLeft: 0 }}>{worker.distance ? `${worker.distance} km` : worker.locationName || 'Location not specified'}</Text>
                      </View>
                      {/* Highlighted Service/Category Badge */}
                      {worker.category && (
                        <View style={{ alignSelf: 'flex-start', backgroundColor: '#fc8019', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 4, marginTop: 2 }}>
                          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>{worker.category}</Text>
                        </View>
                      )}
                      {/* Availability Status Badge below category */}
                      {worker.availabilityStatus && (
                        <View style={{ alignSelf: 'flex-start', backgroundColor: worker.availabilityStatus === 'Available' ? '#e8f5e9' : worker.availabilityStatus === 'Busy' ? '#fffbe6' : '#f3f4f6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 4 }}>
                          <Text style={{ color: worker.availabilityStatus === 'Available' ? '#2e7d32' : worker.availabilityStatus === 'Busy' ? '#bfa100' : '#888', fontWeight: 'bold', fontSize: 13 }}>
                            {worker.availabilityStatus}
                          </Text>
                        </View>
                      )}
                      {/* Address Row (one line, ellipsis) */}
                      {worker.locationName && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                          <Ionicons name="location-outline" size={15} color="#fc8019" style={{ marginRight: 3 }} />
                          <Text style={{ fontSize: 13, color: '#666', flex: 1 }} numberOfLines={1} ellipsizeMode="tail">{worker.locationName}</Text>
                        </View>
                      )}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 }}>
                        {worker.tags && worker.tags.map((spec, i) => (
                          <View key={i} style={{ backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6, marginBottom: 4 }}>
                            <Text style={{ color: '#fc8019', fontSize: 12 }} numberOfLines={1} ellipsizeMode="tail">{spec}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                    <TouchableOpacity style={{ backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#fc8019', paddingVertical: 8, paddingHorizontal: 18, marginRight: 10 }} onPress={() => handleViewProfile(worker)}>
                      <Text style={{ color: '#fc8019', fontWeight: 'bold' }}>View Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ backgroundColor: '#fc8019', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 18 }} onPress={() => handleBookNow(worker)}>
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Book Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            ))
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No services found</Text>
              <Text style={styles.noResultsSubText}>Try adjusting your search terms</Text>
            </View>
          )}
        </ScrollView>
        {/* Bottom Navigation Bar */}
        <View style={styles.bottomNav}>
          {NAV_ITEMS.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.navItem}
              onPress={() => {
                if (item.label === 'Account') navigation.navigate('Account');
                else if (item.label === 'Payments') navigation.navigate('Payments');
                else if (item.label === 'Home') navigation.navigate('Home');
                else if (item.label === 'Bookings') navigation.navigate('Bookings');
                else if (item.label === 'Chat') navigation.navigate('Chat');
              }}
            >
              {React.cloneElement(item.icon, { color: item.active ? '#fc8019' : '#888' })}
              <Text style={[styles.navLabel, item.active && { color: '#fc8019' }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollViewContent: {
    paddingBottom: 80, // Increased to ensure content clears bottom nav
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 5,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  logo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a2a4e',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginHorizontal: 18,
    marginBottom: 16,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    color: '#222',
    backgroundColor: 'transparent',
  },
  promoBanner: {
    backgroundColor: '#fc8019',
    borderRadius: 16,
    marginHorizontal: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#fc8019',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  promoTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 4,
  },
  promoText: {
    color: '#fff7f0',
    fontSize: 14,
    marginBottom: 12,
  },
  promoButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
  },
  promoButtonText: {
    color: '#fc8019',
    fontWeight: 'bold',
    fontSize: 15,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 18,
    marginBottom: 18,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#fc8019',
    borderRadius: 10,
    paddingVertical: 14,
    marginRight: 8,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingVertical: 14,
    marginLeft: 8,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
    marginHorizontal: 18,
    marginBottom: 8,
    marginTop: 8,
  },
  categoriesRow: {
    flexDirection: 'row',
    marginHorizontal: 10,
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#fc8019',
  },
  chipLabel: {
    marginLeft: 6,
    color: '#222',
    fontWeight: '500',
    fontSize: 14,
  },
  nearbyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 18,
    marginTop: 18,
    marginBottom: 8,
  },
  viewAll: {
    color: '#fc8019',
    fontWeight: 'bold',
    fontSize: 15,
  },
  workerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 18,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontWeight: '700',
    fontSize: 16,
    color: '#000000',
    marginBottom: 4,
  },
  workerType: {
    color: '#fc8019',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  workerEmail: {
    color: '#000000',
    fontSize: 12,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingText: {
    marginLeft: 4,
    color: '#000000',
    fontWeight: '600',
    fontSize: 14,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  distance: {
    color: '#000000',
    fontSize: 12,
    marginLeft: 4,
  },
  specialtiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specialtyChip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  specialtyText: {
    color: '#fc8019',
    fontSize: 12,
    fontWeight: '500',
  },
  workerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileBtn: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  profileBtnText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 14,
  },
  bookNowBtn: {
    flex: 1,
    backgroundColor: '#fc8019',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  bookNowBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  noResultsContainer: {
    padding: 32,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  noResultsSubText: {
    fontSize: 14,
    color: '#888',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 16,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    height: 60,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: -2 },
    // shadowOpacity: 0.06,
    // shadowRadius: 6,
    // elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    fontWeight: '500',
  },
});