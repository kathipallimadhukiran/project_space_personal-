import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { PortfolioItem } from '../types';

interface PortfolioCardProps {
  item: PortfolioItem;
  onEdit: (item: PortfolioItem) => void;
  onDelete: (itemId: string) => void;
  onShare: (item: PortfolioItem) => void;
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({ item, onEdit, onDelete, onShare }) => {
  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.icon}>🖼️</Text>
          </View>
        )}
        {item.clientVerified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✔️ Verified</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
        {item.serviceTag && (
          <Text style={styles.serviceTag}>{item.serviceTag}</Text>
        )}
        <Text style={styles.dateText}>Added: {new Date(item.dateAdded).toLocaleDateString()}</Text>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.iconButton} onPress={() => onShare(item)}>
          <Text style={styles.icon}>🔗</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => onEdit(item)}>
          <Text style={styles.icon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => onDelete(item.id)}>
          <Text style={styles.icon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 32,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  verifiedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#22223b',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  serviceTag: {
    fontSize: 10,
    backgroundColor: '#bae6fd',
    color: '#0ea5e9',
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 6,
  },
  iconButton: {
    padding: 6,
    marginLeft: 2,
  },
});

export default PortfolioCard; 