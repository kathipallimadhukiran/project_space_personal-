import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ActivityItem } from '../types';
import ActivityCard from './ActivityCard';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ActivityFeedSectionProps {
  activityItems: ActivityItem[];
}

const ActivityFeedSection: React.FC<ActivityFeedSectionProps> = ({ activityItems }) => {
  const sortedItems = [...activityItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f8fa' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>Recent Activity</Text>
        </View>
        {sortedItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>No recent activity.</Text>
            <Text style={styles.emptySubtitle}>Updates about your bookings and profile will appear here.</Text>
          </View>
        ) : (
          <View>
            {sortedItems.map(item => (
              <ActivityCard key={item.id} item={item} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: 'transparent',
    elevation: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: 'transparent',
    elevation: 0,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },
});

export default ActivityFeedSection; 