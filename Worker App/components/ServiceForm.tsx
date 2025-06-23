import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Service, WorkerProfile } from '../types';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

interface ServiceFormProps {
  profile: WorkerProfile;
  initialService?: Service | null;
  onSave: (service: Service) => void;
  onCancel: () => void;
}

// Define a local type for the form state
interface ServiceFormState {
  title: string;
  description: string;
  price: string;
  priceType: 'fixed' | 'hourly';
  category: string;
  availability: string;
  locationName: string;
  locationCoords: { lat: number; lng: number } | null;
  tags: string;
  maxDistance: string;
  experienceRequired: string;
  images: string[];
}

const ServiceForm: React.FC<ServiceFormProps> = ({ profile, initialService, onSave, onCancel }) => {
  const [form, setForm] = useState<ServiceFormState>({
    title: initialService?.title || '',
    description: initialService?.description || '',
    price: initialService?.price?.toString() || '',
    priceType: (initialService as any)?.priceType || 'fixed',
    category: (initialService as any)?.category || 'Plumbing',
    availability: (initialService as any)?.availability || 'Mon-Fri, 9 AM-5 PM',
    locationName: initialService?.locationName || '',
    locationCoords: initialService?.locationCoords || null,
    tags: initialService?.tags ? initialService.tags.join(', ') : '',
    maxDistance: initialService?.maxDistance?.toString() || '',
    experienceRequired: initialService?.experienceRequired || '',
    images: initialService?.images || [],
  });
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    if (initialService) {
      setForm({
        title: initialService.title || '',
        description: initialService.description || '',
        price: initialService.price?.toString() || '',
        priceType: (initialService as any)?.priceType || 'fixed',
        category: (initialService as any)?.category || 'Plumbing',
        availability: (initialService as any)?.availability || 'Mon-Fri, 9 AM-5 PM',
        locationName: initialService.locationName || '',
        locationCoords: initialService.locationCoords || null,
        tags: initialService.tags ? initialService.tags.join(', ') : '',
        maxDistance: initialService.maxDistance?.toString() || '',
        experienceRequired: initialService.experienceRequired || '',
        images: initialService.images || [],
      });
    }
  }, [initialService]);

  useEffect(() => {
    if (form.locationName) return; // Don't overwrite if already set (from edit)
    (async () => {
      setLocationLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setForm(f => ({ ...f, locationName: 'Permission denied' }));
        setLocationLoading(false);
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      let coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setForm(f => ({ ...f, locationCoords: coords }));
      let rev = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      if (rev && rev.length > 0) {
        const place = rev[0];
        setForm(f => ({ ...f, locationName: [place.name, place.city || place.district, place.region, place.country].filter(Boolean).join(', ') }));
      }
      setLocationLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (name: keyof ServiceFormState, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.7 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setForm(prev => ({ ...prev, images: [...prev.images, result.assets[0].uri] }));
    }
  };

  const handleSubmit = () => {
    const priceNum = parseFloat(form.price);
    if (!form.title.trim() || !form.description.trim() || isNaN(priceNum) || !form.locationName || locationLoading) return;
    const serviceData: any = {
      title: form.title,
      description: form.description,
      price: priceNum,
      priceType: form.priceType,
      category: form.category,
      availability: form.availability,
      locationName: form.locationName,
      locationCoords: form.locationCoords,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      maxDistance: form.maxDistance ? parseFloat(form.maxDistance) : undefined,
      experienceRequired: form.experienceRequired,
      images: form.images,
      phoneNumber: profile.phone, // Add worker's phone number from profile
    };
    if (initialService && (initialService as any)._id) {
      serviceData._id = (initialService as any)._id;
    }
    onSave(serviceData);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.inputBox}>
        <Text style={styles.label}>Service Name</Text>
        <TextInput
          value={form.title}
          onChangeText={value => handleChange('title', value)}
          style={styles.input}
          placeholder="Service Name"
          placeholderTextColor="#64748b"
        />
      </View>
      <View style={styles.inputBox}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          value={form.description}
          onChangeText={value => handleChange('description', value)}
          style={styles.input}
          placeholder="Description"
          placeholderTextColor="#64748b"
          multiline
          numberOfLines={3}
        />
      </View>
      <View style={styles.row}>
        <View style={[styles.inputBox, { flex: 1, marginRight: 8 }]}> 
          <Text style={styles.label}>Price ($)</Text>
          <TextInput
            value={form.price}
            onChangeText={value => handleChange('price', value.replace(/[^0-9.]/g, ''))}
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#64748b"
            keyboardType="numeric"
          />
        </View>
        <View style={[styles.inputBox, { flex: 1 }]}> 
          <Text style={styles.label}>Price Type</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={form.priceType}
              onValueChange={value => handleChange('priceType', value)}
              style={styles.picker}
            >
              <Picker.Item label="Fixed" value="fixed" />
              <Picker.Item label="Hourly" value="hourly" />
            </Picker>
          </View>
        </View>
      </View>
      <View style={styles.inputBox}>
        <Text style={styles.label}>Location</Text>
        <TextInput
          value={form.locationName}
          onChangeText={value => handleChange('locationName', value)}
          style={styles.input}
          placeholder="Fetching current location..."
          placeholderTextColor="#64748b"
          editable={!locationLoading}
        />
        {locationLoading && <Text style={{ color: '#0ea5e9', fontSize: 12 }}>Detecting location...</Text>}
      </View>
      <View style={styles.inputBox}>
        <Text style={styles.label}>Tags/Keywords (comma separated)</Text>
        <TextInput
          value={form.tags}
          onChangeText={value => handleChange('tags', value)}
          style={styles.input}
          placeholder="e.g. plumbing, emergency, home"
          placeholderTextColor="#64748b"
        />
      </View>
      <View style={styles.inputBox}>
        <Text style={styles.label}>Max Distance Willing to Travel (km)</Text>
        <TextInput
          value={form.maxDistance}
          onChangeText={value => handleChange('maxDistance', value)}
          style={styles.input}
          placeholder="e.g. 10"
          placeholderTextColor="#64748b"
          keyboardType="numeric"
        />
      </View>
      <View style={styles.inputBox}>
        <Text style={styles.label}>Experience Required (optional)</Text>
        <TextInput
          value={form.experienceRequired}
          onChangeText={value => handleChange('experienceRequired', value)}
          style={styles.input}
          placeholder="e.g. 2+ years in plumbing"
          placeholderTextColor="#64748b"
        />
      </View>
      <View style={styles.inputBox}>
        <Text style={styles.label}>Service Images (optional)</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {form.images.map((img, idx) => (
            <View key={idx} style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', marginRight: 8, marginBottom: 8, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 24 }}>🖼️</Text>
            </View>
          ))}
          <TouchableOpacity onPress={pickImage} style={{ width: 56, height: 56, borderRadius: 8, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e5e7eb' }}>
            <Text style={{ fontSize: 28, color: '#0ea5e9' }}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, (!form.title.trim() || !form.description.trim() || isNaN(parseFloat(form.price)) || !form.locationName || locationLoading) && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={!form.title.trim() || !form.description.trim() || isNaN(parseFloat(form.price)) || !form.locationName || locationLoading}
        >
          <Text style={styles.saveButtonText}>{locationLoading ? 'Detecting location...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  inputBox: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#22223b',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    backgroundColor: '#f1f5f9',
    color: '#22223b',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  picker: {
    height: 44,
    color: '#22223b',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#22223b',
    fontSize: 13,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#f1f5f9',
  },
});

export default ServiceForm; 