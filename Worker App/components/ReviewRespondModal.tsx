import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Review } from '../types';
import Modal from './Modal';

interface ReviewRespondModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review | null;
  onSubmit: (reviewId: string, responseText: string) => void;
}

const ReviewRespondModal: React.FC<ReviewRespondModalProps> = ({ isOpen, onClose, review, onSubmit }) => {
  const [responseText, setResponseText] = useState('');

  if (!review) return null;

  const handleSubmit = () => {
    if (responseText.trim()) {
      onSubmit(review._id, responseText.trim());
      setResponseText('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Respond to ${review.client?.name || 'Client'}'s Review`}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.commentBox}>
          <Text style={styles.label}>Client's Comment:</Text>
          <Text style={styles.comment}>&quot;{review.review || ''}&quot;</Text>
        </View>
        <View style={styles.inputBox}>
          <Text style={styles.inputLabel}>Your Response:</Text>
          <TextInput
            value={responseText}
            onChangeText={setResponseText}
            multiline
            numberOfLines={4}
            style={styles.textarea}
            placeholder="Write your public response here..."
            placeholderTextColor="#64748b"
          />
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.submitButton, !responseText.trim() && styles.disabledButton]} onPress={handleSubmit} disabled={!responseText.trim()}>
            <Text style={styles.submitButtonText}>Submit Response</Text>
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
  commentBox: {
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
    backgroundColor: '#0ea5e9',
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

export default ReviewRespondModal; 