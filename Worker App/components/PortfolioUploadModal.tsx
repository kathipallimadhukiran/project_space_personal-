import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { PortfolioItem } from '../types';
import Modal from './Modal';

interface PortfolioUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPortfolioItem: (item: Omit<PortfolioItem, 'id' | 'dateAdded'>) => void;
}

const PortfolioUploadModal: React.FC<PortfolioUploadModalProps> = ({ isOpen, onClose, onAddPortfolioItem }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [serviceTag, setServiceTag] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImagePreview(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (title.trim() && imagePreview) {
      onAddPortfolioItem({
        title: title.trim(),
        description: description.trim(),
        imageUrl: imagePreview,
        serviceTag: serviceTag.trim() || undefined,
        clientVerified: false,
      });
      resetForm();
      onClose();
    } else {
      Alert.alert('Missing Info', 'Please provide a title and upload an image.');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setServiceTag('');
    setImagePreview(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Portfolio Item">
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.inputBox}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            placeholder="Title"
            placeholderTextColor="#64748b"
          />
        </View>
        <View style={styles.inputBox}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            style={styles.input}
            placeholder="Description"
            placeholderTextColor="#64748b"
            multiline
            numberOfLines={3}
          />
        </View>
        <View style={styles.inputBox}>
          <Text style={styles.label}>Service Tag (e.g., Plumbing, Electrical)</Text>
          <TextInput
            value={serviceTag}
            onChangeText={setServiceTag}
            style={styles.input}
            placeholder="Service Tag"
            placeholderTextColor="#64748b"
          />
        </View>
        <View style={styles.imageSection}>
          <Text style={styles.label}>Image</Text>
          <TouchableOpacity style={styles.imagePicker} onPress={handleImagePick}>
            {imagePreview ? (
              <Image source={{ uri: imagePreview }} style={styles.imagePreview} />
            ) : (
              <Text style={styles.imageIcon}>🖼️</Text>
            )}
            <Text style={styles.imagePickerText}>{imagePreview ? 'Change Image' : 'Upload Image'}</Text>
          </TouchableOpacity>
          <Text style={styles.imageHint}>PNG, JPG, GIF up to 10MB (Mock)</Text>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.saveButton, (!title.trim() || !imagePreview) && styles.disabledButton]} onPress={handleSubmit} disabled={!title.trim() || !imagePreview}>
            <Text style={styles.saveButtonText}>Save Item</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Modal>
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
  imageSection: {
    marginBottom: 12,
  },
  imagePicker: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 16,
    marginBottom: 4,
  },
  imageIcon: {
    fontSize: 36,
    color: '#64748b',
    marginBottom: 4,
  },
  imagePreview: {
    width: 96,
    height: 96,
    borderRadius: 8,
    marginBottom: 4,
    resizeMode: 'cover',
  },
  imagePickerText: {
    fontSize: 12,
    color: '#0ea5e9',
    textDecorationLine: 'underline',
  },
  imageHint: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
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

export default PortfolioUploadModal; 