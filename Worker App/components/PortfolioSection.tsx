import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { PortfolioItem } from '../types';
import PortfolioCard from './PortfolioCard';

interface PortfolioSectionProps {
  portfolioItems: PortfolioItem[];
  onOpenUploadModal: () => void;
  onEditItem: (item: PortfolioItem) => void;
  onDeleteItem: (itemId: string) => void;
  onShareItem: (item: PortfolioItem) => void;
}

const PortfolioSection: React.FC<PortfolioSectionProps> = ({ portfolioItems, onOpenUploadModal, onEditItem, onDeleteItem, onShareItem }) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>My Portfolio</Text>
        <TouchableOpacity style={styles.addButton} onPress={onOpenUploadModal}>
          <Text style={styles.addButtonText}>➕ Add Item</Text>
        </TouchableOpacity>
      </View>
      {portfolioItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🖼️</Text>
          <Text style={styles.emptyTitle}>Your portfolio is empty</Text>
          <Text style={styles.emptySubtitle}>Showcase your best work by adding items</Text>
          <TouchableOpacity style={styles.addEmptyButton} onPress={onOpenUploadModal}>
            <Text style={styles.addEmptyButtonText}>Add Your First Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.portfolioList}>
          {portfolioItems.map(item => (
            <PortfolioCard
              key={item.id}
              item={item}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
              onShare={onShareItem}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff7ed', // Light orange tint for warmth
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.1)',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  addButton: {
    backgroundColor: '#f97316',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.1)',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    color: '#f97316',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 16,
  },
  addEmptyButton: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  addEmptyButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  portfolioList: {
    flexDirection: 'column',
    gap: 12,
  },
});

export default PortfolioSection;