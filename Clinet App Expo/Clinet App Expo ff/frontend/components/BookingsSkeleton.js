import React from 'react';
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import ShimmerEffect from './ShimmerEffect';

const { width } = Dimensions.get('window');

const SkeletonPlaceholder = ({ width, height, radius = 4, style }) => (
  <View style={[styles.skeleton, { width, height, borderRadius: radius }, style]}>
    <ShimmerEffect width={width} height={height} />
  </View>
);

const BookingSkeletonItem = () => (
  <View style={styles.bookingCard}>
    <View style={styles.bookingHeader}>
      <SkeletonPlaceholder width={100} height={20} radius={4} />
      <SkeletonPlaceholder width={80} height={16} radius={4} />
    </View>
    
    <View style={styles.bookingBody}>
      <View style={styles.serviceInfo}>
        <SkeletonPlaceholder width={24} height={24} radius={12} />
        <View style={styles.serviceText}>
          <SkeletonPlaceholder width={width * 0.6} height={18} radius={4} />
          <SkeletonPlaceholder width={width * 0.4} height={14} radius={4} style={{ marginTop: 4 }} />
        </View>
      </View>
      
      <View style={styles.workerInfo}>
        <SkeletonPlaceholder width={40} height={40} radius={20} />
        <View style={styles.workerText}>
          <SkeletonPlaceholder width={120} height={16} radius={4} />
          <SkeletonPlaceholder width={100} height={14} radius={4} style={{ marginTop: 4 }} />
        </View>
      </View>
      
      <View style={styles.bookingFooter}>
        <View style={styles.dateTimeContainer}>
          <SkeletonPlaceholder width={width * 0.4} height={14} radius={4} />
          <SkeletonPlaceholder width={width * 0.3} height={14} radius={4} style={{ marginTop: 4 }} />
        </View>
        <SkeletonPlaceholder width={100} height={36} radius={18} />
      </View>
    </View>
  </View>
);

const BookingsSkeleton = () => {
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Status Tabs Skeleton */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {[1, 2, 3, 4].map((item) => (
          <SkeletonPlaceholder 
            key={item} 
            width={80} 
            height={36} 
            radius={18} 
            style={styles.tabItem} 
          />
        ))}
      </ScrollView>

      {/* Booking Items Skeleton */}
      {[1, 2, 3].map((item) => (
        <BookingSkeletonItem key={item} />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
  },
  tabsContainer: {
    paddingBottom: 16,
  },
  tabItem: {
    marginRight: 8,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  bookingBody: {
    paddingTop: 12,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceText: {
    marginLeft: 12,
    flex: 1,
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  workerText: {
    marginLeft: 12,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  dateTimeContainer: {
    flex: 1,
  },
  skeleton: {
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
});

export default BookingsSkeleton;
