import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import ShimmerEffect from './ShimmerEffect';

const { width } = Dimensions.get('window');

const SkeletonPlaceholder = ({ width, height, style }) => (
  <View style={[styles.skeleton, { width, height }, style]}>
    <ShimmerEffect width={width} height={height} />
  </View>
);

const AccountSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Profile Header Skeleton */}
      <View style={styles.profileHeader}>
        <SkeletonPlaceholder width={80} height={80} style={styles.avatarSkeleton} />
        <View style={styles.textContainer}>
          <SkeletonPlaceholder width={width * 0.4} height={24} style={styles.nameSkeleton} />
          <SkeletonPlaceholder width={width * 0.6} height={16} style={styles.emailSkeleton} />
          <SkeletonPlaceholder width={width * 0.5} height={16} style={styles.phoneSkeleton} />
        </View>
      </View>

      {/* Menu Items Skeleton */}
      <View style={styles.menuContainer}>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <View key={item} style={styles.menuItem}>
            <SkeletonPlaceholder width={24} height={24} style={styles.iconSkeleton} />
            <SkeletonPlaceholder width={width * 0.5} height={16} style={styles.menuTextSkeleton} />
            <SkeletonPlaceholder width={24} height={24} style={styles.arrowSkeleton} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  profileHeader: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarSkeleton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  nameSkeleton: {
    marginBottom: 8,
    borderRadius: 4,
  },
  emailSkeleton: {
    marginBottom: 4,
    borderRadius: 4,
  },
  phoneSkeleton: {
    borderRadius: 4,
  },
  menuContainer: {
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  menuTextSkeleton: {
    marginLeft: 20,
    flex: 1,
    borderRadius: 4,
  },
  iconSkeleton: {
    borderRadius: 4,
  },
  arrowSkeleton: {
    marginLeft: 'auto',
    borderRadius: 4,
  },
});

export default AccountSkeleton;
