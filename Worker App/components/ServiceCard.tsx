import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { Service } from '../types';

interface ServiceCardProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (serviceId: string) => void;
  onOpenDetail?: (service: Service) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onEdit, onDelete, onOpenDetail }) => {
  const scaleAnim = React.useRef(new Animated.Value(0.98)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const [pressed, setPressed] = React.useState(false);
  const iconScale = React.useRef(new Animated.Value(1)).current;
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    setPressed(true);
    Animated.spring(iconScale, { toValue: 1.15, useNativeDriver: true, friction: 5 }).start();
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.cubic),
    }).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.spring(iconScale, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.cubic),
    }).start();
  };

  const slideStyle = (index: number) => ({
    transform: [
      {
        translateX: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 600 + index * 40],
        }),
      },
    ],
    opacity: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
  });

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          transform: [{ scale: pressed ? 0.96 : scaleAnim }],
          opacity: opacityAnim,
          shadowColor: pressed ? '#f97316' : '#1e293b',
          shadowOpacity: pressed ? 0.4 : 0.2,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => onOpenDetail && onOpenDetail(service)}
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Title */}
        {service.title && (
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
              {service.title}
            </Text>
          </View>
        )}

        {/* Location */}
        {service.locationName && (
          <View style={styles.locationContainer}>
            <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
              {service.locationName}
            </Text>
          </View>
        )}

        {/* Data */}
        {service.data && (
          <View style={styles.dataContainer}>
            <Text style={styles.dataText} numberOfLines={1} ellipsizeMode="tail">
              {service.data}
            </Text>
          </View>
        )}

        {/* Description */}
        {service.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
              {service.description}
            </Text>
          </View>
        )}

        {/* Price */}
        {(service.minPrice || service.maxPrice || service.price) && (
          <View style={styles.priceContainer}>
            {service.minPrice && <Text style={styles.priceText}>${service.minPrice} Min</Text>}
            {service.maxPrice && <Text style={styles.priceText}>${service.maxPrice} Max</Text>}
            {service.price && (
              <View style={styles.priceTag}>
                <Text style={styles.priceTagText}>${service.price}</Text>
              </View>
            )}
          </View>
        )}

        {/* Pagination Dots */}
        {service.images && service.images.length > 1 && (
          <View style={styles.paginationContainer}>
            {service.images.map((_, index) => (
              <View key={index} style={styles.paginationDot} />
            ))}
          </View>
        )}
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={() => onEdit(service)}>
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDelete(service._id)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginVertical: 12,
    marginHorizontal: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.1)',
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
    backgroundColor: '#fff7ed',
  },
  titleContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'left',
  },
  locationContainer: {
    marginBottom: 8,
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  locationText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
    textAlign: 'left',
  },
  dataContainer: {
    marginBottom: 8,
  },
  dataText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '400',
    textAlign: 'left',
  },
  descriptionContainer: {
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    fontWeight: '400',
    textAlign: 'left',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  priceText: {
    fontSize: 14,
    color: '#f97316',
    fontWeight: '600',
  },
  priceTag: {
    backgroundColor: '#f97316',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  priceTagText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f97316',
    opacity: 0.7,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: 'rgba(249, 115, 22, 0.2)',
  },
  actionButton: {
    backgroundColor: '#f97316',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  deleteButton: {
    backgroundColor: 'grey',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ServiceCard;