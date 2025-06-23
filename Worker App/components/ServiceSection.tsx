import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Button, Image, useColorScheme, Animated, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Service, WorkerProfile, Booking } from '../types';
import ServiceCard from './ServiceCard';
import Modal from './Modal';
import ServiceForm from './ServiceForm';
import * as api from '../utils/api';
import { Picker } from '@react-native-picker/picker';
import ServiceDetailModal from './ServiceDetailModal';

interface ServiceSectionProps {
  profile: WorkerProfile;
  services: Service[];
  bookings: Booking[];
  onAddService: (service: Service) => void;
  onUpdateService: (service: Service) => void;
  onDeleteService: (serviceId: string) => void;
  onOpenServiceDetail: (service: Service) => void;
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
}

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
    <View style={[{ width, height, borderRadius, backgroundColor: '#FFE6CC', overflow: 'hidden' }, style]}>
      <Animated.View
        style={{
          width: width * 2,
          height,
          borderRadius,
          backgroundColor: '#FFF5E6',
          opacity: 0.7,
          transform: [{ translateX }],
        }}
      />
    </View>
  );
};

const ServiceSection: React.FC<ServiceSectionProps> = ({ profile, services, bookings, onAddService, onUpdateService, onDeleteService, onOpenServiceDetail, setServices }) => {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Plumbing');
  const [priceType, setPriceType] = useState<'fixed' | 'hourly'>('fixed');
  const [availability, setAvailability] = useState('Mon-Fri, 9 AM-5 PM');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const openAddModal = () => setAddModalOpen(true);
  const closeAddModal = () => setAddModalOpen(false);
  const openEditModal = (service: Service) => {
    setEditingService(service);
    setEditModalOpen(true);
  };
  const closeEditModal = () => {
    setEditingService(null);
    setEditModalOpen(false);
  };

  const openDetailModal = (service: Service) => {
    setSelectedService(service);
    setDetailModalOpen(true);
  };
  const closeDetailModal = () => {
    setSelectedService(null);
    setDetailModalOpen(false);
  };

  const handleAddService = async (service: Service) => {
    setLoading(true);
    setError('');
    try {
      await api.addService({ ...service, userEmail: profile.email });
      await fetchServices();
      closeAddModal();
    } catch (err) {
      console.error('Error adding service:', err);
      setError('Failed to add service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    setLoading(true);
    setError('');
    try {
      await api.deleteService(id);
      setServices(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      setError('Failed to delete service');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateService = async (service: Service) => {
    setLoading(true);
    setError('');
    try {
      await api.updateService(service);
      await fetchServices();
      closeEditModal();
    } catch (err) {
      console.error('Error updating service:', err);
      setError('Failed to update service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      const newServices = await api.getServices(profile.email);
      setServices(newServices);
    } catch (error) {
      console.error('Failed to fetch services:', error);
      setError('Failed to load services. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshServices = async () => {
    setRefreshing(true);
    await fetchServices();
  };

  useEffect(() => {
    fetchServices();
  }, [profile.email]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshServices} tintColor="#FC8019" colors={["#FC8019"]} />
        }
      >
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleBlack}>My </Text>
            <Text style={styles.titleOrange}>Services</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Text style={styles.addButtonText}>+ Add Service</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <View style={styles.cardList}>
            {[1, 2, 3].map(i => (
              <View key={i} style={styles.skeletonCard}>
                <Skeleton width={120} height={22} style={{ marginBottom: 12 }} />
                <Skeleton width={80} height={18} style={{ marginBottom: 8 }} />
                <Skeleton width={180} height={16} style={{ marginBottom: 8 }} />
                <Skeleton width={220} height={16} style={{ marginBottom: 8 }} />
                <Skeleton width={260} height={40} borderRadius={12} />
              </View>
            ))}
          </View>
        ) : services.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🛠️</Text>
            <Text style={styles.emptyTitle}>No services yet!</Text>
            <Text style={styles.emptySubtitle}>Tap "Add Service" to showcase your offerings.</Text>
          </View>
        ) : (
          <View style={styles.cardList}>
            {services.map(service => (
              <ServiceCard
                key={service._id}
                service={service}
                onEdit={openEditModal}
                onDelete={handleDeleteService}
                onOpenDetail={openDetailModal}
              />
            ))}
          </View>
        )}
        <Modal isOpen={addModalOpen} onClose={closeAddModal} title="Add Service">
          <ServiceForm
            profile={profile}
            onSave={async (service) => {
              setLoading(true);
              setError('');
              try {
                const newService = await api.addService({ ...service, userEmail: profile.email });
                setServices(prev => [...prev, newService]);
                closeAddModal();
              } catch (err) {
                setError('Failed to add service');
              } finally {
                setLoading(false);
              }
            }}
            onCancel={closeAddModal}
          />
          {error ? <Text style={{ color: '#EF4444', margin: 8 }}>{error}</Text> : null}
        </Modal>
        <Modal isOpen={editModalOpen} onClose={closeEditModal} title="Edit Service">
          {editingService && (
            <ServiceForm
              profile={profile}
              initialService={editingService}
              onSave={service => { handleUpdateService(service); closeEditModal(); }}
              onCancel={closeEditModal}
            />
          )}
        </Modal>
        <ServiceDetailModal
          isOpen={detailModalOpen}
          onClose={closeDetailModal}
          service={selectedService}
          bookings={bookings}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleBlack: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  titleOrange: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FC8019',
  },
  addButton: {
    backgroundColor: '#FC8019',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#FFE6CC',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
    color: '#FC8019',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
  },
  cardList: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 16,
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE6CC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceCardFull: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE6CC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
  },
  serviceCardFullDark: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
  },
  cardContent: {
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  cardCategory: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    backgroundColor: '#FC8019',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FC8019',
    marginBottom: 8,
    marginTop: 4,
  },
  cardInfo: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 4,
    marginTop: 2,
  },
  cardDesc: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 12,
    marginTop: 2,
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 14,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  editButton: {
    backgroundColor: '#FFF5E6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  editButtonDark: {
    backgroundColor: '#374151',
  },
  editButtonText: {
    color: '#FC8019',
    fontWeight: '600',
    fontSize: 14,
  },
  priceTypeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#FFE6CC',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  priceTypeButtonActive: {
    backgroundColor: '#FC8019',
    borderColor: '#FC8019',
  },
  priceTypeButtonText: {
    color: '#FC8019',
    fontWeight: '600',
    fontSize: 14,
  },
  priceTypeButtonTextActive: {
    color: '#FFFFFF',
  },
});

export default ServiceSection;