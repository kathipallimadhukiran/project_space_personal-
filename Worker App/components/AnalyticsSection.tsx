import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator, Animated, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Booking, BookingStatus, Service } from '../types';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BASE_URL } from '../utils/api';

interface AnalyticsSectionProps {
  email: string;
}

interface AnalyticsSummary {
  userEmail: string;
  totalBookings: number;
  completedBookings: number;
  totalEarnings: number;
  lastBookingDate?: string;
  lastLogin?: string;
  monthlyEarnings?: number[];
  monthlyBookings?: number[];
}

// Skeleton loader component
interface SkeletonProps {
  width: number;
  height: number;
  borderRadius?: number;
  style?: any;
}
const Skeleton = ({ width, height, borderRadius = 8, style = {} }: SkeletonProps) => {
  const shimmer = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);
  const translateX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-width, width] });
  return (
    <View style={[{ width, height, borderRadius, backgroundColor: '#e5e7eb', overflow: 'hidden' }, style]}>
      <Animated.View
        style={{
          width: width * 2,
          height,
          borderRadius,
          backgroundColor: '#f1f5f9',
          opacity: 0.7,
          transform: [{ translateX }],
        }}
      />
    </View>
  );
};

const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ email }) => {
  if (!email) {
    console.warn('No email provided to AnalyticsSection! Not rendering.');
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f6f8fa' }}>
        <Text style={{ color: '#ef4444', marginTop: 32 }}>No user email found. Please log in again.</Text>
      </View>
    );
  }
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const screenWidth = Dimensions.get('window').width;
  // Animated values for counters
  const bookingsAnim = React.useRef(new Animated.Value(0)).current;
  const completedAnim = React.useRef(new Animated.Value(0)).current;
  const earningsAnim = React.useRef(new Animated.Value(0)).current;
  const [bookingsDisplay, setBookingsDisplay] = useState(0);
  const [completedDisplay, setCompletedDisplay] = useState(0);
  const [earningsDisplay, setEarningsDisplay] = useState(0);
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    const bookingsListener = bookingsAnim.addListener(({ value }) => setBookingsDisplay(Math.round(value)));
    const completedListener = completedAnim.addListener(({ value }) => setCompletedDisplay(Math.round(value)));
    const earningsListener = earningsAnim.addListener(({ value }) => setEarningsDisplay(Math.round(value)));
    return () => {
      bookingsAnim.removeListener(bookingsListener);
      completedAnim.removeListener(completedListener);
      earningsAnim.removeListener(earningsListener);
    };
  }, []);

  useEffect(() => {
    if (summary) {
      Animated.timing(bookingsAnim, { toValue: summary.totalBookings, duration: 1200, useNativeDriver: false }).start();
      Animated.timing(completedAnim, { toValue: summary.completedBookings, duration: 1200, useNativeDriver: false }).start();
      Animated.timing(earningsAnim, { toValue: summary.totalEarnings, duration: 1200, useNativeDriver: false }).start();
    }
  }, [summary]);

  useEffect(() => {
    if (!email) return;
    let intervalId;
    const fetchAnalytics = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${BASE_URL}/analytics?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        console.log('Analytics data from backend:', data);
        setSummary(data);
      } catch (err) {
        setError('Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
    intervalId = setInterval(fetchAnalytics, 30000); // update every 30 seconds
    return () => clearInterval(intervalId);
  }, [email]);

  const refreshAnalytics = async () => {
    setRefreshing(true);
    try {
      // Fetch analytics data again
      if (!email) return;
      setError('');
      const res = await fetch(`${BASE_URL}/analytics?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      setError('Failed to load analytics.');
    } finally {
      setRefreshing(false);
    }
  };

  // Pie chart for bookings
  const bookingsPieData = summary && summary.totalBookings > 0 ? [
    {
      name: 'Completed',
      population: summary.completedBookings,
      color: '#22c55e',
      legendFontColor: '#222',
      legendFontSize: 13,
    },
    {
      name: 'Pending',
      population: summary.totalBookings - summary.completedBookings,
      color: '#6366f1',
      legendFontColor: '#222',
      legendFontSize: 13,
    },
  ] : [];

  // Only use real backend data for monthly earnings/bookings
  const monthlyEarnings = summary?.monthlyEarnings && summary.monthlyEarnings.length === 12 ? summary.monthlyEarnings : null;
  const monthlyBookings = summary?.monthlyBookings && summary.monthlyBookings.length === 12 ? summary.monthlyBookings : null;

  // Bar chart for monthly earnings (real data only)
  const earningsBarData = monthlyEarnings ? {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      { data: monthlyEarnings },
    ],
  } : null;

  // Line chart for monthly bookings (real data only)
  const bookingsLineData = monthlyBookings ? {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      { data: monthlyBookings, color: () => '#6366f1' },
    ],
  } : null;

  // Completion rate
  const completionRate = summary && summary.totalBookings > 0 ? Math.round((summary.completedBookings / summary.totalBookings) * 100) : 0;

  // Best month (by earnings)
  let bestMonth = null;
  if (monthlyEarnings) {
    const max = Math.max(...monthlyEarnings);
    if (max > 0) {
      const idx = monthlyEarnings.indexOf(max);
      bestMonth = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][idx];
    }
  }

  const isEmpty = !summary || (
    summary.totalBookings === 0 &&
    summary.completedBookings === 0 &&
    summary.totalEarnings === 0
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#e0e7ef' }}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshAnalytics} tintColor="#2563eb" colors={["#2563eb"]} />
        }
      >
        <Text style={styles.title}>📊 Analytics Dashboard</Text>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 40, width: '100%' }}>
            {/* Skeleton for stats card */}
            <View style={[styles.statsModernCard, { marginBottom: 24 }]}> 
              <View style={styles.statCol}><Skeleton width={36} height={36} borderRadius={18} style={{ marginBottom: 8 }} /><Skeleton width={40} height={18} /><Skeleton width={50} height={12} style={{ marginTop: 6 }} /></View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}><Skeleton width={36} height={36} borderRadius={18} style={{ marginBottom: 8 }} /><Skeleton width={40} height={18} /><Skeleton width={50} height={12} style={{ marginTop: 6 }} /></View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}><Skeleton width={36} height={36} borderRadius={18} style={{ marginBottom: 8 }} /><Skeleton width={60} height={18} /><Skeleton width={50} height={12} style={{ marginTop: 6 }} /></View>
            </View>
            {/* Skeleton for chart/card */}
            <View style={styles.cardShadow}><Skeleton width={Dimensions.get('window').width - 48} height={180} borderRadius={16} /></View>
            {/* Skeleton for section titles */}
            <Skeleton width={120} height={18} style={{ marginTop: 32, marginBottom: 12 }} />
            <Skeleton width={Dimensions.get('window').width - 48} height={120} borderRadius={16} />
          </View>
        ) : error ? (
          <View><Text style={{ color: '#ef4444', textAlign: 'center', marginTop: 32 }}>{error}</Text></View>
        ) : isEmpty ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <View><Text style={styles.emptyTitle}>No analytics data yet.</Text></View>
            <View><Text style={styles.emptySubtitle}>Complete bookings and earn to see your performance metrics. You're just getting started!</Text></View>
          </View>
        ) : (
          <>
            <View style={styles.statsModernCard}>
              <View style={styles.statCol}>
                <Icon name="calendar" size={36} color="#6366f1" style={{ marginBottom: 4 }} />
                <Text style={styles.statValueModern}>{bookingsDisplay}</Text>
                <Text style={styles.statLabelModern}>Bookings</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Icon name="flag-checkered" size={36} color="#22c55e" style={{ marginBottom: 4 }} />
                <Text style={styles.statValueModern}>{completedDisplay}</Text>
                <Text style={styles.statLabelModern}>Completed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Icon name="currency-inr" size={36} color="#0ea5e9" style={{ marginBottom: 4 }} />
                <Text style={[styles.statValueModern, { fontSize: 15 , marginTop: 7 }]}>{Math.round(earningsDisplay).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</Text>
                <Text style={[styles.statLabelModern , {marginTop:7}]}>Earnings</Text>
              </View>
            </View>
            <View style={styles.cardShadow}>
              <Text style={styles.sectionTitle}>Bookings Completion</Text>
              <View style={{overflow: 'hidden', borderRadius: 12, padding: 2}}>
                {bookingsPieData.length === 0 ? (
                  <View><Text style={styles.placeholder}>No bookings yet.</Text></View>
                ) : (
                  <PieChart
                    data={bookingsPieData}
                    width={screenWidth - 48}
                    height={180}
                    chartConfig={{
                      color: () => '#000',
                      labelColor: () => '#222',
                      backgroundColor: '#fff',
                      backgroundGradientFrom: '#fff',
                      backgroundGradientTo: '#fff',
                      decimalPlaces: 0,
                    }}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="16"
                    absolute
                  />
                )}
              </View>
            </View>
            <View style={styles.cardShadow}>
              <Text style={styles.sectionTitle}>Monthly Earnings</Text>
              <View style={{overflow: 'hidden', borderRadius: 12, padding: 2}}>
                {earningsBarData ? (
                  <BarChart
                    data={earningsBarData}
                    width={screenWidth - 48}
                    height={180}
                    yAxisLabel="₹"
                    yAxisSuffix=""
                    chartConfig={{
                      backgroundColor: '#fff',
                      backgroundGradientFrom: '#fff',
                      backgroundGradientTo: '#fff',
                      decimalPlaces: 0,
                      color: () => '#6366f1',
                      labelColor: () => '#222',
                      style: { borderRadius: 12 },
                    }}
                    style={{ borderRadius: 12 }}
                  />
                ) : (
                  <View><Text style={styles.placeholder}>No monthly earnings data yet.</Text></View>
                )}
              </View>
              {bestMonth && (
                <View><Text style={styles.statText}>Best Month: <Text style={{ color: '#22c55e', fontWeight: 'bold' }}>{bestMonth}</Text></Text></View>
              )}
            </View>
            <View style={styles.cardShadow}>
              <Text style={styles.sectionTitle}>Monthly Bookings Trend</Text>
              <View style={{overflow: 'hidden', borderRadius: 12, padding: 2}}>
                {bookingsLineData ? (
                  <LineChart
                    data={bookingsLineData}
                    width={screenWidth - 48}
                    height={180}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={{
                      backgroundColor: '#fff',
                      backgroundGradientFrom: '#fff',
                      backgroundGradientTo: '#fff',
                      decimalPlaces: 0,
                      color: () => '#6366f1',
                      labelColor: () => '#222',
                      style: { borderRadius: 12 },
                    }}
                    style={{ borderRadius: 12 }}
                  />
                ) : (
                  <View><Text style={styles.placeholder}>No monthly bookings data yet.</Text></View>
                )}
              </View>
            </View>
            <View style={styles.cardShadow}>
              <Text style={styles.sectionTitle}>Completion Rate</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <View style={{ flex: 1, height: 16, backgroundColor: '#e5e7eb', borderRadius: 8, overflow: 'hidden', marginRight: 12 }}>
                  <View style={{ width: `${completionRate}%`, height: '100%', backgroundColor: '#22c55e', borderRadius: 8 }} />
                </View>
                <View><Text style={{ fontWeight: 'bold', color: '#22c55e', fontSize: 16 }}>{completionRate}%</Text></View>
              </View>
            </View>
            <View style={styles.cardShadow}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <View><Text style={styles.statText}>Last Booking: {summary.lastBookingDate ? new Date(summary.lastBookingDate).toLocaleDateString() : '—'}</Text></View>
              <View><Text style={styles.statText}>Last Login: {summary.lastLogin ? new Date(summary.lastLogin).toLocaleDateString() : '—'}</Text></View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#e0e7ef',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#22223b',
    marginBottom: 18,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  statsModernCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e0e7ef', // fallback for native
    borderRadius: 24,
    padding: 18,
    marginBottom: 28,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 8,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    paddingHorizontal: 4,
  },
  statValueModern: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#22223b',
    marginBottom: 2,
    maxWidth: 110,
    textAlign: 'center',
  },
  statLabelModern: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 2,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  statDivider: {
    width: 1.5,
    height: 48,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
    borderRadius: 2,
    alignSelf: 'center',
  },
  cardShadow: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 22,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#22223b',
    marginBottom: 8,
  },
  statText: {
    fontSize: 15,
    color: '#222',
    marginBottom: 4,
  },
  placeholder: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: 'transparent',
    elevation: 0,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },
});

export default AnalyticsSection; 