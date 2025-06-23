import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Review } from '../types';
import Modal from './Modal';

interface ReviewAppealModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review;
  onSubmit: (reviewId: string, appealReason: string) => void;
}

const ReviewAppealModal: React.FC<ReviewAppealModalProps> = ({ isOpen, onClose, review, onSubmit }) => {
  const [appealReason, setAppealReason] = useState('');

  const handleSubmit = () => {
    if (appealReason.trim()) {
      onSubmit(review.id, appealReason.trim());
      setAppealReason('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Appeal Rating for ${review.clientName}`}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.ratingBox}>
          <Text style={styles.label}>Client's Rating: <Text style={styles.rating}>{review.rating}/5</Text></Text>
          <Text style={styles.label}>Client's Comment:</Text>
          <Text style={styles.comment}>&quot;{review.comment}&quot;</Text>
        </View>
        <View style={styles.inputBox}>
          <Text style={styles.inputLabel}>Reason for Appeal:</Text>
          <TextInput
            value={appealReason}
            onChangeText={setAppealReason}
            multiline
            numberOfLines={4}
            style={styles.textarea}
            placeholder="Explain why you believe this rating is unfair or inaccurate. Provide any context or evidence details."
            placeholderTextColor="#64748b"
          />
        </View>
        <View style={styles.evidenceBox}>
          <Text style={styles.evidenceLabel}>Evidence (Optional):</Text>
          <TouchableOpacity style={styles.mockAttachButton}>
            <Text style={styles.mockAttachText}>Attach Files (Mock)</Text>
          </TouchableOpacity>
          <Text style={styles.evidenceHint}>e.g., photos of completed work, communication screenshots.</Text>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.submitButton, !appealReason.trim() && styles.disabledButton]} onPress={handleSubmit} disabled={!appealReason.trim()}>
            <Text style={styles.submitButtonText}>Submit Appeal</Text>
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
  ratingBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#22223b',
  },
  rating: {
    fontSize: 18,
    color: '#f59e42',
    fontWeight: 'bold',
  },
  comment: {
    fontStyle: 'italic',
    color: '#64748b',
    fontSize: 13,
    marginTop: 2,
  },
  inputBox: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#22223b',
    marginBottom: 4,
  },
  textarea: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    backgroundColor: '#f1f5f9',
    color: '#22223b',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  evidenceBox: {
    marginBottom: 12,
  },
  evidenceLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#22223b',
    marginBottom: 2,
  },
  mockAttachButton: {
    marginTop: 2,
  },
  mockAttachText: {
    color: '#0ea5e9',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  evidenceHint: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#64748b',
    marginTop: 2,
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
  submitButton: {
    backgroundColor: '#f59e42',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#f1f5f9',
  },
});

export default ReviewAppealModal; 