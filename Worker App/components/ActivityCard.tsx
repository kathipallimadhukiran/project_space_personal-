import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ActivityItem } from '../types';

interface ActivityCardProps {
  item: ActivityItem;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ item }) => {
  const getIcon = () => {
    switch (item.iconName) {
      case 'CalendarDaysIcon': return '📅';
      case 'StarIcon': return '⭐';
      case 'CheckCircleIcon': return '✅';
      case 'SparklesIcon': return '✨';
      case 'UserCircleIcon': return '👤';
      default: return 'ℹ️';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{getIcon()}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.text}>{item.text}</Text>
        <Text style={styles.meta}>{formatDate(item.date)} - {item.type}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 1,
  },
  iconContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 8,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  text: {
    fontSize: 13,
    color: '#22223b',
    marginBottom: 2,
  },
  meta: {
    fontSize: 10,
    color: '#64748b',
  },
});

export default ActivityCard; 