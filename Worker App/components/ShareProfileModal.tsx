import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { WorkerProfile } from '../types';
import Modal from './Modal';

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: WorkerProfile;
}

const ShareProfileModal: React.FC<ShareProfileModalProps> = ({ isOpen, onClose, profile }) => {
  const profileUrl = `https://wefix.app/worker/${profile.id}`;
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    await Clipboard.setStringAsync(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Your Profile">
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.infoText}>
          Share your unique profile link with potential clients.
        </Text>
        <View style={styles.qrBox}>
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrIcon}>#️⃣</Text>
          </View>
          <Text style={styles.qrHint}>(Mock QR Code for {profileUrl})</Text>
        </View>
        <View style={styles.inputRow}>
          <TextInput
            value={profileUrl}
            editable={false}
            style={styles.urlInput}
          />
          <TouchableOpacity
            onPress={handleCopyUrl}
            style={[styles.copyButton, copied && styles.copiedButton]}
          >
            <Text style={styles.copyButtonText}>{copied ? 'Copied!' : 'Copy'}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.doneButton} onPress={onClose}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 12,
  },
  qrBox: {
    alignItems: 'center',
    marginBottom: 12,
  },
  qrPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 6,
  },
  qrIcon: {
    fontSize: 64,
    color: '#64748b',
  },
  qrHint: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  urlInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 13,
    backgroundColor: '#f1f5f9',
    color: '#22223b',
  },
  copyButton: {
    marginLeft: 8,
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  copiedButton: {
    backgroundColor: '#22C55E',
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  doneButton: {
    marginTop: 8,
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ShareProfileModal; 