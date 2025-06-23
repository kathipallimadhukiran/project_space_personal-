import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, TextInput, Animated, RefreshControl } from 'react-native';
import { WorkerProfile, Booking, Theme } from '../types';
import { MOCK_EARNINGS_SUMMARY } from '../constants';
import * as api from '../utils/api';
import Modal from './Modal';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { BASE_URL } from '../utils/api';

interface ProfileSectionProps {
  profile: WorkerProfile;
  bookings: Booking[];
  onUpdateProfile: (profile: WorkerProfile) => void;
  onLogout: () => void;
  onToggleAvailability: (status: any) => void;
  onToggleTodayAvailability: (isAvailable: boolean) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onOpenShareProfileModal: () => void;
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
    <View style={[{ width, height, borderRadius, backgroundColor: '#e5e7eb', overflow: 'hidden' }, style]}>
      <Animated.View
        style={{
          width: width * 2,
          height,
          borderRadius,
          backgroundColor: '#f1f5f9',
          opacity: 0.7,
          transform: [{ translateX }],
        }}
      />
    </View>
  );
};

const ProfileSection = (props: ProfileSectionProps) => {
  const { profile, bookings, onUpdateProfile, onLogout, theme, setTheme, onOpenShareProfileModal } = props;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [serviceCategory, setServiceCategory] = useState(profile?.serviceCategory || 'Plumbing');
  const [experienceLevel, setExperienceLevel] = useState(profile?.experienceLevel || 'Beginner');
  const [availabilityStatus, setAvailabilityStatus] = useState(profile?.availabilityStatus || 'Available');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [localImage, setLocalImage] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [logoutScale] = useState(new Animated.Value(1));
  const [resetScale] = useState(new Animated.Value(1));
  const [refreshing, setRefreshing] = React.useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [reportType, setReportType] = useState<null | 'bug' | 'problem' | 'improvement' | 'issue'>(null);
  const [reportForm, setReportForm] = useState<any>({});
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSuccess, setReportSuccess] = useState('');
  const [reportError, setReportError] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setBio(profile.bio || '');
      if (profile.availabilityStatus && profile.availabilityStatus !== availabilityStatus) {
        setAvailabilityStatus(profile.availabilityStatus);
      }
    }
  }, [profile]);

  const getProfileImageUrl = () => {
    if (localImage && localImage.uri) return localImage.uri;
    if (profile.profilePicture && profile.profilePicture.url)
      return `${BASE_URL}${profile.profilePicture.url}?t=${Date.now()}`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent((profile.name && profile.name[0]) ? profile.name[0] : 'W')}`;
  };

  const uploadProfilePicture = async (imageAsset: any) => {
    if (!imageAsset) return;
    try {
      const formData = new FormData();
      formData.append('email', profile.email);
      formData.append('profilePicture', {
        uri: imageAsset.uri,
        name: 'profile.jpg',
        type: 'image/jpeg',
      } as any);

      const res = await fetch(`${BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      const updated = await res.json();
      onUpdateProfile(updated);
      setLocalImage(null);
    } catch (err) {
      setError('Failed to upload profile picture');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const formData = new FormData();
      formData.append('email', profile.email);
      formData.append('name', name);
      formData.append('phone', phone);
      formData.append('serviceCategory', serviceCategory);
      formData.append('experienceLevel', experienceLevel);
      formData.append('availabilityStatus', availabilityStatus);
      formData.append('bio', bio);
      if (localImage) {
        formData.append('profilePicture', {
          uri: localImage.uri,
          name: 'profile.jpg',
          type: 'image/jpeg',
        } as any);
      }
      const res = await fetch(`${BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      const updated = await res.json();
      onUpdateProfile(updated);
      setSuccess('Profile updated!');
      setEditModalOpen(false);
      setLocalImage(null);
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setAvailabilityStatus(newStatus);
    setStatusLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/profile/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email, availabilityStatus: newStatus }),
      });
      const updated = await res.json();
      if (updated && updated.availabilityStatus) {
        setAvailabilityStatus(updated.availabilityStatus);
        onUpdateProfile(updated);
      }
    } catch (e) {
      setError('Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const completedBookings = bookings.filter(b => b.status === 'Completed');

  const refreshProfile = async () => {
    setRefreshing(true);
    try {
      if (!profile?.email) return;
      const res = await fetch(`${BASE_URL}/profile?email=${encodeURIComponent(profile.email)}`);
      const data = await res.json();
      onUpdateProfile(data);
    } catch (err) {
      setError('Failed to refresh profile');
    } finally {
      setRefreshing(false);
    }
  };

  if (!profile) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={{ height: 24 }} />
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}><Skeleton width={120} height={120} borderRadius={60} /></View>
          <Skeleton width={120} height={22} style={{ marginTop: 16, marginBottom: 8 }} />
          <Skeleton width={180} height={16} style={{ marginBottom: 18 }} />
          <Skeleton width={80} height={16} style={{ marginBottom: 12 }} />
          <Skeleton width={220} height={60} borderRadius={16} style={{ marginBottom: 18 }} />
          <View style={styles.profileInfoRow}>
            <Skeleton width={90} height={18} style={{ marginRight: 12 }} />
            <Skeleton width={90} height={18} />
          </View>
          <View style={styles.profileInfoRow}>
            <Skeleton width={90} height={18} style={{ marginRight: 12 }} />
            <Skeleton width={90} height={18} />
          </View>
          <Skeleton width={80} height={18} style={{ marginTop: 18, marginBottom: 8 }} />
          <Skeleton width={260} height={40} borderRadius={12} />
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
            <Skeleton width={120} height={44} borderRadius={12} />
            <Skeleton width={120} height={44} borderRadius={12} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshProfile} tintColor="#f97316" colors={["#f97316"]} />
        }
      >
        <View style={{ height: 24 }} />
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Image
              source={{ uri: getProfileImageUrl() }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.editPicButtonModern} onPress={async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
              });
              if (!result.canceled && result.assets && result.assets.length > 0) {
                setLocalImage(result.assets[0]);
                await uploadProfilePicture(result.assets[0]);
              }
            }}>
              <Text style={styles.editPicButtonTextModern}>Change Photo</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileEmail}>{profile.email}</Text>
          <View style={styles.statusContainer}>
            <Text style={styles.profileStatusLabel}>Status</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={availabilityStatus} onValueChange={handleStatusChange} style={styles.picker}>
                <Picker.Item label="Available" value="Available" />
                <Picker.Item label="Busy" value="Busy" />
                <Picker.Item label="On Leave" value="On Leave" />
              </Picker>
              {statusLoading && <Text style={styles.statusLoading}>Saving...</Text>}
            </View>
          </View>
          <View style={styles.profileInfoRow}>
            <View style={styles.profileInfoBox}>
              <Text style={styles.profileInfoLabel}>Phone</Text>
              <Text style={styles.profileInfoValue}>{profile.phone || '-'}</Text>
            </View>
            <View style={styles.profileInfoBox}>
              <Text style={styles.profileInfoLabel}>Category</Text>
              <Text style={styles.profileInfoValue}>{profile.serviceCategory || '-'}</Text>
            </View>
          </View>
          <View style={styles.profileInfoRow}>
            <View style={styles.profileInfoBox}>
              <Text style={styles.profileInfoLabel}>Experience</Text>
              <Text style={styles.profileInfoValue}>{profile.experienceLevel || '-'}</Text>
            </View>
            <View style={styles.profileInfoBox}>
              <Text style={styles.profileInfoLabel}>Status</Text>
              <Text style={styles.profileInfoValue}>{availabilityStatus}</Text>
            </View>
          </View>
          <Text style={styles.profileBioHeader}>Bio</Text>
          <Text style={styles.profileBio}>{profile.bio || 'No bio provided.'}</Text>
          <TouchableOpacity style={styles.editProfileButton} onPress={() => setEditModalOpen(true)}>
            <Text style={styles.editProfileButtonText}>✏️ Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Completed Tasks</Text>
          <Text style={styles.statValue}>{completedBookings.length}</Text>
          <Text style={styles.statLabel}>Total completed tasks</Text>
          <Text style={styles.statLabel}>Rating: <Text style={styles.statValue}>Coming soon</Text></Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Earnings Snapshot</Text>
          <Text style={styles.earnings}>{MOCK_EARNINGS_SUMMARY.currentWeek.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} <Text style={styles.earningsSub}>this week</Text></Text>
          <Text style={styles.earningsSub}>Last week: {MOCK_EARNINGS_SUMMARY.lastWeek.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Achievements & Badges</Text>
          <View style={styles.achievementsRow}>
            <View style={styles.achievementBadge}><Text style={styles.achievementIcon}>✨</Text><Text style={styles.achievementLabel}>Pro Worker</Text></View>
            <View style={styles.achievementBadge}><Text style={styles.achievementIcon}>🏆</Text><Text style={styles.achievementLabel}>Top Rated</Text></View>
            <View style={styles.achievementBadge}><Text style={styles.achievementIcon}>💯</Text><Text style={styles.achievementLabel}>100+ Jobs</Text></View>
            <View style={styles.achievementBadge}><Text style={styles.achievementIcon}>⏰</Text><Text style={styles.achievementLabel}>On Time</Text></View>
          </View>
        </View>

        <View style={styles.profileDetailsCard}>
          <Text style={styles.profileDetailsHeader}>Profile Details</Text>
          <View style={styles.profileDetailsList}>
            <View style={styles.detailRow}><Text style={styles.detailIcon}>📧</Text><Text style={styles.detailLabel}>Email: <Text style={styles.detailValue}>{profile.email}</Text></Text></View>
            <View style={styles.detailRow}><Text style={styles.detailIcon}>📱</Text><Text style={styles.detailLabel}>Phone: <Text style={styles.detailValue}>{profile.phone || '-'}</Text></Text></View>
            <View style={styles.detailRow}><Text style={styles.detailIcon}>🛠️</Text><Text style={styles.detailLabel}>Service Category: <Text style={styles.detailValue}>{profile.serviceCategory || '-'}</Text></Text></View>
            <View style={styles.detailRow}><Text style={styles.detailIcon}>🎓</Text><Text style={styles.detailLabel}>Experience Level: <Text style={styles.detailValue}>{profile.experienceLevel || '-'}</Text></Text></View>
            <View style={styles.detailRow}><Text style={styles.detailIcon}>⏰</Text><Text style={styles.detailLabel}>General Availability: <Text style={styles.detailValue}>{profile.availability || '-'}</Text></Text></View>
            {profile.location && (
              <View style={styles.detailRow}><Text style={styles.detailIcon}>📍</Text><Text style={styles.detailLabel}>Last Known Location: <Text style={styles.detailValue}>({profile.location.latitude.toFixed(3)}, {profile.location.longitude.toFixed(3)})</Text></Text></View>
            )}
          </View>
        </View>

        <View style={styles.actionRow}>
          <Animated.View style={{ transform: [{ scale: logoutScale }], flex: 1 }}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onLogout}
              activeOpacity={0.8}
              onPressIn={() => Animated.spring(logoutScale, { toValue: 0.95, useNativeDriver: true }).start()}
              onPressOut={() => Animated.spring(logoutScale, { toValue: 1, useNativeDriver: true }).start()}
            >
              <Text style={styles.actionButtonText}>🚪 Logout</Text>
            </TouchableOpacity>
          </Animated.View>
          <Animated.View style={{ transform: [{ scale: resetScale }], flex: 1 }}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => { setResetModalOpen(true); setCurPass(''); setNewPass(''); setConfirmPass(''); setResetError(''); setResetSuccess(''); }}
              activeOpacity={0.8}
              onPressIn={() => Animated.spring(resetScale, { toValue: 0.95, useNativeDriver: true }).start()}
              onPressOut={() => Animated.spring(resetScale, { toValue: 1, useNativeDriver: true }).start()}
            >
              <Text style={styles.actionButtonText}>🔒 Reset Password</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => setHelpModalOpen(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.helpButtonText}>❓ Help</Text>
        </TouchableOpacity>

        <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Profile">
          <View style={styles.modalContent}>
            <View style={styles.avatarWrap}>
              <Image
                source={{ uri: getProfileImageUrl() }}
                style={styles.modalAvatar}
              />
              <TouchableOpacity style={styles.editPicButtonModern} onPress={async () => {
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [1, 1],
                  quality: 0.7,
                });
                if (!result.canceled && result.assets && result.assets.length > 0) {
                  setLocalImage(result.assets[0]);
                  await uploadProfilePicture(result.assets[0]);
                }
              }}>
                <Text style={styles.editPicButtonTextModern}>Change Photo</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput value={name} onChangeText={setName} style={styles.input} />
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput value={phone} onChangeText={setPhone} style={styles.input} />
            <Text style={styles.inputLabel}>Service Category</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={serviceCategory} onValueChange={setServiceCategory} style={styles.picker}>
                <Picker.Item label="Plumbing" value="Plumbing" />
                <Picker.Item label="Electrical" value="Electrical" />
                <Picker.Item label="Cleaning" value="Cleaning" />
                <Picker.Item label="Painting" value="Painting" />
                <Picker.Item label="Handyman" value="Handyman" />
                <Picker.Item label="Other" value="Other" />
              </Picker>
            </View>
            <Text style={styles.inputLabel}>Experience Level</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={experienceLevel} onValueChange={setExperienceLevel} style={styles.picker}>
                <Picker.Item label="Beginner" value="Beginner" />
                <Picker.Item label="Intermediate" value="Intermediate" />
                <Picker.Item label="Expert" value="Expert" />
              </Picker>
            </View>
            <Text style={styles.inputLabel}>Availability Status</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={availabilityStatus} onValueChange={setAvailabilityStatus} style={styles.picker}>
                <Picker.Item label="Available" value="Available" />
                <Picker.Item label="Busy" value="Busy" />
                <Picker.Item label="On Leave" value="On Leave" />
              </Picker>
            </View>
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput value={bio} onChangeText={setBio} style={[styles.input, styles.bioInput]} multiline />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {success ? <Text style={styles.success}>{success}</Text> : null}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
              <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        <Modal isOpen={resetModalOpen} onClose={() => setResetModalOpen(false)} title="Reset Password">
          <View style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Current Password"
              value={curPass}
              onChangeText={setCurPass}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              value={newPass}
              onChangeText={setNewPass}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              value={confirmPass}
              onChangeText={setConfirmPass}
              secureTextEntry
            />
            {resetError ? <Text style={styles.error}>{resetError}</Text> : null}
            {resetSuccess ? <Text style={styles.success}>{resetSuccess}</Text> : null}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={async () => {
                setResetError('');
                setResetSuccess('');
                setResetLoading(true);
                if (!curPass || !newPass || !confirmPass) {
                  setResetError('All fields required');
                  setResetLoading(false);
                  return;
                }
                if (newPass.length < 6) {
                  setResetError('New password must be at least 6 characters');
                  setResetLoading(false);
                  return;
                }
                if (newPass !== confirmPass) {
                  setResetError('Passwords do not match');
                  setResetLoading(false);
                  return;
                }
                try {
                  const res = await api.changePassword(profile.email, curPass, newPass);
                  if (res.message === 'Password changed successfully') {
                    setResetSuccess('Password changed!');
                    setTimeout(() => setResetModalOpen(false), 1500);
                  } else {
                    setResetError(res.message || 'Failed to change password');
                  }
                } catch {
                  setResetError('Network error');
                } finally {
                  setResetLoading(false);
                }
              }}
              disabled={resetLoading}
            >
              <Text style={styles.saveButtonText}>{resetLoading ? 'Saving...' : 'Change Password'}</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        <Modal isOpen={helpModalOpen} onClose={() => { setHelpModalOpen(false); setReportType(null); setReportForm({}); setReportSuccess(''); setReportError(''); }} title="Help & Feedback">
          <View style={styles.modalContent}>
            {!reportType ? (
              <>
                <Text style={styles.modalTitle}>How can we help you?</Text>
                <TouchableOpacity style={styles.reportButton} onPress={() => setReportType('bug')}>
                  <Text style={styles.reportButtonText}>🐞 Report Bug</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.reportButton} onPress={() => setReportType('problem')}>
                  <Text style={styles.reportButtonText}>⚠️ Problem Reporting</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.reportButton} onPress={() => setReportType('improvement')}>
                  <Text style={styles.reportButtonText}>💡 Suggest Improvement</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.reportButton} onPress={() => setReportType('issue')}>
                  <Text style={styles.reportButtonText}>🚩 Report Issue</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={() => { setReportType(null); setReportForm({}); setReportSuccess(''); setReportError(''); }} style={styles.backButton}>
                  <Text style={styles.backButtonText}>← Back to options</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {reportType === 'bug' ? '🐞 Report a Bug' :
                   reportType === 'problem' ? '⚠️ Report a Problem' :
                   reportType === 'improvement' ? '💡 Suggest an Improvement' :
                   '🚩 Report an Issue'}
                </Text>
                <Text style={styles.inputLabel}>Your Email</Text>
                <TextInput
                  value={reportForm.email ?? profile.email ?? ''}
                  onChangeText={v => setReportForm((f: any) => ({ ...f, email: v }))}
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <Text style={styles.inputLabel}>Details</Text>
                <TextInput
                  value={reportForm.details ?? ''}
                  onChangeText={v => setReportForm((f: any) => ({ ...f, details: v }))}
                  style={[styles.input, styles.bioInput]}
                  multiline
                />
                {reportType === 'bug' && (
                  <>
                    <Text style={styles.inputLabel}>Steps to Reproduce</Text>
                    <TextInput
                      value={reportForm.steps ?? ''}
                      onChangeText={v => setReportForm((f: any) => ({ ...f, steps: v }))}
                      style={[styles.input, styles.bioInput]}
                      multiline
                    />
                    <Text style={styles.inputLabel}>Expected Result</Text>
                    <TextInput
                      value={reportForm.expected ?? ''}
                      onChangeText={v => setReportForm((f: any) => ({ ...f, expected: v }))}
                      style={styles.input}
                    />
                    <Text style={styles.inputLabel}>Actual Result</Text>
                    <TextInput
                      value={reportForm.actual ?? ''}
                      onChangeText={v => setReportForm((f: any) => ({ ...f, actual: v }))}
                      style={styles.input}
                    />
                  </>
                )}
                {reportType === 'problem' && (
                  <>
                    <Text style={styles.inputLabel}>Problem Type</Text>
                    <TextInput
                      value={reportForm.problemType ?? ''}
                      onChangeText={v => setReportForm((f: any) => ({ ...f, problemType: v }))}
                      style={styles.input}
                      placeholder="e.g. Login, Booking, Payment"
                    />
                    <Text style={styles.inputLabel}>Urgency</Text>
                    <TextInput
                      value={reportForm.urgency ?? ''}
                      onChangeText={v => setReportForm((f: any) => ({ ...f, urgency: v }))}
                      style={styles.input}
                      placeholder="e.g. High, Medium, Low"
                    />
                  </>
                )}
                {reportType === 'improvement' && (
                  <>
                    <Text style={styles.inputLabel}>Suggestion Title</Text>
                    <TextInput
                      value={reportForm.suggestionTitle ?? ''}
                      onChangeText={v => setReportForm((f: any) => ({ ...f, suggestionTitle: v }))}
                      style={styles.input}
                    />
                  </>
                )}
                {reportType === 'issue' && (
                  <>
                    <Text style={styles.inputLabel}>Issue Type</Text>
                    <TextInput
                      value={reportForm.issueType ?? ''}
                      onChangeText={v => setReportForm((f: any) => ({ ...f, issueType: v }))}
                      style={styles.input}
                      placeholder="e.g. Account, Booking, Payment"
                    />
                  </>
                )}
                {reportError ? <Text style={styles.error}>{reportError}</Text> : null}
                {reportSuccess ? <Text style={styles.success}>{reportSuccess}</Text> : null}
                <TouchableOpacity
                  style={[styles.saveButton, { opacity: reportLoading ? 0.7 : 1 }]}
                  disabled={reportLoading}
                  onPress={async () => {
                    setReportError('');
                    setReportSuccess('');
                    setReportLoading(true);
                    if (!reportForm.email || !reportForm.details) {
                      setReportError('Email and details are required.');
                      setReportLoading(false);
                      return;
                    }
                    try {
                      const res = await fetch(`${BASE_URL}/report`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          email: reportForm.email,
                          type: reportType,
                          details: reportForm.details,
                          extra: (() => {
                            if (reportType === 'bug') return { steps: reportForm.steps, expected: reportForm.expected, actual: reportForm.actual };
                            if (reportType === 'problem') return { problemType: reportForm.problemType, urgency: reportForm.urgency };
                            if (reportType === 'improvement') return { suggestionTitle: reportForm.suggestionTitle };
                            if (reportType === 'issue') return { issueType: reportForm.issueType };
                            return {};
                          })(),
                        }),
                      });
                      const data = await res.json();
                      if (res.ok) {
                        setReportSuccess('Thank you! Your report has been submitted.');
                        setReportForm({ email: profile.email });
                        setTimeout(() => { setHelpModalOpen(false); setReportType(null); setReportForm({}); setReportSuccess(''); }, 1200);
                      } else {
                        setReportError(data.message || 'Failed to submit report.');
                      }
                    } catch (e) {
                      setReportError('Network error.');
                    } finally {
                      setReportLoading(false);
                    }
                  }}
                >
                  <Text style={styles.saveButtonText}>{reportLoading ? 'Submitting...' : 'Submit'}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.1)',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#f97316',
    backgroundColor: '#ffffff',
  },
  editPicButtonModern: {
    backgroundColor: '#f97316',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  editPicButtonTextModern: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileStatusLabel: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
    marginBottom: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    borderColor: 'rgba(249, 115, 22, 0.2)',
    backgroundColor: '#ffffff',
    width: 220,
    height: 50,
    justifyContent: 'center',
    position: 'relative',
  },
  picker: {
    height: 50,
    fontSize: 16,
    color: '#1e293b',
  },
  statusLoading: {
    position: 'absolute',
    right: 12,
    top: 15,
    color: '#f97316',
    fontSize: 12,
  },
  profileInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
    gap: 12,
  },
  profileInfoBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.1)',
  },
  profileInfoLabel: {
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 4,
  },
  profileInfoValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  profileBioHeader: {
    fontSize: 14,
    color: '#f97316',
    fontWeight: '600',
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  profileBio: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 12,
    alignSelf: 'flex-start',
    lineHeight: 20,
  },
  editProfileButton: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  editProfileButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.1)',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f97316',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  earnings: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f97316',
    marginBottom: 4,
    textAlign: 'center',
  },
  earningsSub: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
  },
  achievementsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    gap: 8,
  },
  achievementBadge: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.1)',
    minWidth: 80,
  },
  achievementIcon: {
    fontSize: 20,
    marginBottom: 4,
    color: '#f97316',
  },
  achievementLabel: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '600',
    textAlign: 'center',
  },
  profileDetailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    width: '100%',
    maxWidth: 420,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.1)',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  profileDetailsHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'left',
  },
  profileDetailsList: {
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#f97316',
    width: 24,
    textAlign: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#4b5563',
  },
  detailValue: {
    color: '#1e293b',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 420,
    marginBottom: 12,
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  helpButton: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    marginBottom: 20,
  },
  helpButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  modalContent: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#f97316',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    fontSize: 14,
    color: '#1e293b',
  },
  bioInput: {
    minHeight: 60,
  },
  error: {
    color: '#dc2626',
    marginBottom: 8,
    textAlign: 'center',
  },
  success: {
    color: '#16a34a',
    marginBottom: 8,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  reportButton: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  reportButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ProfileSection;