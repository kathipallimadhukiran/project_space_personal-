import React from 'react';
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import ShimmerEffect from './ShimmerEffect';

const { width } = Dimensions.get('window');

const SkeletonPlaceholder = ({ width, height, radius = 4, style }) => (
  <View style={[styles.skeleton, { width, height, borderRadius: radius }, style]}>
    <ShimmerEffect width={width} height={height} />
  </View>
);

const HomeSkeleton = () => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Search Bar Skeleton */}
      <View style={styles.searchContainer}>
        <SkeletonPlaceholder width={width * 0.85} height={50} radius={25} />
      </View>

      {/* Categories Skeleton */}
      <View style={styles.sectionContainer}>
        <SkeletonPlaceholder width={120} height={24} style={styles.sectionTitle} />
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {[1, 2, 3, 4].map((item) => (
            <View key={item} style={styles.categoryItem}>
              <SkeletonPlaceholder width={64} height={64} radius={32} />
              <SkeletonPlaceholder width={60} height={16} radius={4} style={styles.categoryText} />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Popular Services Skeleton */}
      <View style={styles.sectionContainer}>
        <SkeletonPlaceholder width={180} height={24} style={styles.sectionTitle} />
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.servicesContainer}
        >
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.serviceCard}>
              <SkeletonPlaceholder width={width * 0.6} height={120} radius={12} />
              <View style={styles.serviceInfo}>
                <SkeletonPlaceholder width={120} height={20} radius={4} />
                <View style={styles.ratingContainer}>
                  <SkeletonPlaceholder width={60} height={16} radius={4} />
                  <SkeletonPlaceholder width={80} height={16} radius={4} />
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Nearby Workers Skeleton */}
      <View style={[styles.sectionContainer, { paddingBottom: 30 }]}>
        <SkeletonPlaceholder width={200} height={24} style={styles.sectionTitle} />
        <View style={styles.workersContainer}>
          {[1, 2].map((item) => (
            <View key={item} style={styles.workerCard}>
              <View style={styles.workerInfo}>
                <SkeletonPlaceholder width={60} height={60} radius={30} />
                <View style={styles.workerDetails}>
                  <SkeletonPlaceholder width={120} height={18} radius={4} />
                  <SkeletonPlaceholder width={100} height={16} radius={4} style={{ marginTop: 4 }} />
                  <View style={styles.workerRating}>
                    <SkeletonPlaceholder width={80} height={14} radius={4} />
                  </View>
                </View>
              </View>
              <SkeletonPlaceholder width={80} height={36} radius={18} />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    padding: 16,
    alignItems: 'center',
  },
  sectionContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  categoriesContainer: {
    paddingRight: 16,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  categoryText: {
    marginTop: 8,
  },
  servicesContainer: {
    paddingRight: 16,
  },
  serviceCard: {
    width: width * 0.6,
    marginRight: 12,
  },
  serviceInfo: {
    marginTop: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  workersContainer: {
    marginTop: 8,
  },
  workerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 12,
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workerDetails: {
    marginLeft: 12,
  },
  workerRating: {
    marginTop: 4,
  },
  skeleton: {
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
});

export default HomeSkeleton;
