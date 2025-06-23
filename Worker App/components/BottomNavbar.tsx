import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppView } from '../types';

interface BottomNavbarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

const navItems: { view: AppView; label: string; icon: string; iconFilled: string }[] = [
  { view: 'bookings', label: 'Bookings', icon: 'calendar-outline', iconFilled: 'calendar' },
  { view: 'services', label: 'Services', icon: 'tools', iconFilled: 'tools' },
  { view: 'reviews', label: 'Reviews', icon: 'star-outline', iconFilled: 'star' },
  { view: 'portfolio', label: 'Portfolio', icon: 'image-multiple-outline', iconFilled: 'image-multiple' },
  { view: 'activity', label: 'Activity', icon: 'clock-time-four-outline', iconFilled: 'clock-time-four' },
  { view: 'analytics', label: 'Analytics', icon: 'chart-box-outline', iconFilled: 'chart-box' },
  { view: 'profile', label: 'Profile', icon: 'account-outline', iconFilled: 'account' },
];

const BottomNavbar: React.FC<BottomNavbarProps> = ({ currentView, setView }) => {
  const handlePress = (view: AppView) => {
    // Add a slight delay to allow the animation to complete
    setTimeout(() => setView(view), 50);
  };

  return (
    <View style={styles.navbar}>
      {navItems.map((item) => {
        const isActive = currentView === item.view;
        return (
          <TouchableOpacity
            key={item.view}
            style={[styles.navItem, isActive && styles.activeNavItem]}
            onPress={() => handlePress(item.view)}
            activeOpacity={0.8}
          >
            <View style={styles.navItemContent}>
              <Icon
                name={isActive ? item.iconFilled : item.icon}
                size={24}
                style={[
                  styles.icon,
                  isActive && styles.activeIcon
                ]}
              />
              <Text style={[
                styles.label,
                isActive && styles.activeLabel
              ]}>
                {item.label}
              </Text>
            </View>
            {isActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 70,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    paddingHorizontal: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
    paddingVertical: 8,
  },
  navItemContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeNavItem: {
    // Active state styling is handled by the activeIndicator
  },
  icon: {
    fontSize: 22,
    color: '#888888',
    marginBottom: 4,
    opacity: 0.8,
  },
  activeIcon: {
    color: '#FF6200',
    opacity: 1,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 10,
    color: '#888888',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activeLabel: {
    color: '#000000',
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#FF6200',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
});

export default BottomNavbar;