import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Service, Booking, BookingStatus } from '../types';
import Modal from './Modal';

interface ServiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  bookings: Booking[];
}

const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({ isOpen, onClose, service, bookings }) => {
  const [visible, setVisible] = React.useState(isOpen);
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isOpen) {
      setVisible(true);
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
      ]).start(() => setVisible(false));
    }
  }, [isOpen]);

  if (!visible || !service) return null;

  const timesCompleted = bookings.filter(
    booking => booking.serviceId === service._id && booking.status === BookingStatus.COMPLETED
  ).length;

  const DetailItem: React.FC<{ label: string; value: string | number | undefined; icon?: string }> = ({ label, value, icon }) => (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{icon ? `${icon} ` : ''}{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2} ellipsizeMode="tail">{value || 'N/A'}</Text>
    </View>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={service.title}>
      <Animated.View style={{
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
        backgroundColor: '#fff7ed',
        borderRadius: 20,
        shadowColor: '#f97316',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
        margin: 12,
        padding: 0,
      }}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Description */}
          {service.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.description} numberOfLines={3} ellipsizeMode="tail">
                {service.description}
              </Text>
            </View>
          )}

          {/* Details List */}
          <View style={styles.detailList}>
            <DetailItem
              label="Price"
              value={`${service.priceType === 'hourly' ? `$${service.price}/hr` : `$${service.price}`}`}
              icon="💲"
            />
            <DetailItem
              label="Price Type"
              value={service.priceType === 'hourly' ? 'Hourly' : 'Fixed'}
              icon="🏷️"
            />
            {service.locationName && (
              <DetailItem
                label="Location"
                value={service.locationName}
                icon="📍"
              />
            )}
            {service.maxDistance !== undefined && (
              <DetailItem
                label="Max Distance (km)"
                value={service.maxDistance}
                icon="🗺️"
              />
            )}
            {service.experienceRequired && (
              <DetailItem
                label="Experience Required"
                value={service.experienceRequired}
                icon="🧑‍🔧"
              />
            )}
            {service.availability && (
              <DetailItem
                label="Availability"
                value={service.availability}
                icon="🕒"
              />
            )}
            <DetailItem
              label="Times Completed"
              value={timesCompleted.toString()}
              icon="✅"
            />
          </View>

          {/* Tags */}
          {service.tags && service.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              <Text style={styles.detailLabel}>🏷️ Tags:</Text>
              <View style={styles.tagsWrapper}>
                {service.tags.map((tag, idx) => (
                  <Text key={idx} style={styles.tag}>#{tag}</Text>
                ))}
              </View>
            </View>
          )}

          {/* Images */}
          {service.images && service.images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
              {service.images.map((img, idx) => (
                <View key={idx} style={styles.imageWrapper}>
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>🖼️</Text>
                    {/* <Image source={{ uri: img }} style={styles.image} /> */}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            activeOpacity={0.8}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff7ed',
  },
  descriptionContainer: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.1)',
  },
  description: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    fontWeight: '400',
    textAlign: 'left',
  },
  detailList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.1)',
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(249, 115, 22, 0.1)',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#f97316',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    maxWidth: '60%',
  },
  tagsContainer: {
    marginBottom: 16,
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  tag: {
    backgroundColor: '#f97316',
    color: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  imagesContainer: {
    marginBottom: 16,
  },
  imageWrapper: {
    marginRight: 12,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.2)',
  },
  imagePlaceholderText: {
    fontSize: 24,
  },
  closeButton: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
    alignSelf: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  closeButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ServiceDetailModal;