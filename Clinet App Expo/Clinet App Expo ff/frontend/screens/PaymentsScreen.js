import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const MOCK_PENDING = [
  { id: '1', title: 'Install Ceiling Fan', amount: 180.0 },
];
const MOCK_CARDS = [
  { id: '1', last4: '1234', exp: '12/25', isDefault: true },
  { id: '2', last4: '5678', exp: '06/26', isDefault: false },
];
const MOCK_HISTORY = [
  { id: '1', title: 'Leaky Faucet Repair', worker: 'John Doe', date: '2024-07-20', amount: 50.0, status: 'Paid' },
];

const PaymentsScreen = ({ navigation }) => {
  const navigationHook = useNavigation();
  const nav = navigation || navigationHook;

  return (
    <ScrollView style={{ backgroundColor: '#f6f7fa' }} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.header}>
        <Text style={styles.logo}>We<Text style={{ color: '#fc8019' }}>Fix</Text>It</Text>
      </View>
      <Text style={styles.sectionTitle}>Payments</Text>
      {/* Pending Payments */}
      <View style={styles.cardBox}>
        <Text style={styles.cardTitle}>Pending Payments ({MOCK_PENDING.length})</Text>
        <Text style={styles.cardSub}>Action required for these payments.</Text>
        {MOCK_PENDING.map(item => (
          <View key={item.id} style={styles.pendingBox}>
            <View>
              <Text style={styles.pendingTitle}>{item.title}</Text>
              <Text style={styles.pendingAmount}>${item.amount.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.payNowBtn}>
              <Text style={styles.payNowText}>Pay Now</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      {/* Payment Methods */}
      <View style={styles.cardBox}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Payment Methods</Text>
          <TouchableOpacity style={styles.addCardBtn}>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.addCardText}>Add Card</Text>
          </TouchableOpacity>
        </View>
        {MOCK_CARDS.map(card => (
          <View key={card.id} style={styles.methodBox}>
            <FontAwesome name="credit-card" size={20} color="#fc8019" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.methodText}>Card ending in {card.last4}</Text>
              <Text style={styles.methodSub}>Expires: {card.exp}</Text>
            </View>
            {card.isDefault ? (
              <View style={styles.defaultTag}><Text style={styles.defaultTagText}>Default</Text></View>
            ) : (
              <TouchableOpacity style={styles.setDefaultBtn}><Text style={styles.setDefaultText}>Set Default</Text></TouchableOpacity>
            )}
            <TouchableOpacity style={styles.deleteBtn}><MaterialIcons name="delete" size={18} color="#fc8019" /></TouchableOpacity>
          </View>
        ))}
      </View>
      {/* Payment History */}
      <View style={styles.cardBox}>
        <Text style={styles.cardTitle}>Payment History</Text>
        {MOCK_HISTORY.map(item => (
          <View key={item.id} style={styles.historyBox}>
            <Text style={styles.historyTitle}>{item.title}</Text>
            <Text style={styles.historySub}>For: {item.worker}</Text>
            <Text style={styles.historySub}>Date: {item.date}</Text>
            <Text style={styles.historyAmount}>${item.amount.toFixed(2)}</Text>
            <View style={styles.paidTag}><Text style={styles.paidTagText}>Paid</Text></View>
          </View>
        ))}
      </View>
      <Text style={styles.footer}>© 2025 WeFixIt Client App. All rights reserved. (Demo Version)</Text>
    </ScrollView>
  );
};

export default PaymentsScreen;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  logo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a2a4e',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginHorizontal: 18,
    marginBottom: 10,
    marginTop: 8,
  },
  cardBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 18,
    marginBottom: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontWeight: 'bold',
    color: '#222',
    fontSize: 16,
    marginBottom: 2,
  },
  cardSub: {
    color: '#888',
    fontSize: 13,
    marginBottom: 10,
  },
  pendingBox: {
    backgroundColor: '#fffbe6',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    marginTop: 6,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: '#ffe7b3',
    shadowColor: '#fc8019',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  pendingTitle: {
    fontWeight: 'bold',
    color: '#222',
    fontSize: 15,
  },
  pendingAmount: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  payNowBtn: {
    backgroundColor: '#377dff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  payNowText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#377dff',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  addCardText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 4,
  },
  methodBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6f7fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  methodText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 15,
  },
  methodSub: {
    color: '#888',
    fontSize: 13,
  },
  defaultTag: {
    backgroundColor: '#e6ffed',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  defaultTagText: {
    color: 'green',
    fontWeight: 'bold',
    fontSize: 12,
  },
  setDefaultBtn: {
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  setDefaultText: {
    color: '#fc8019',
    fontWeight: 'bold',
    fontSize: 12,
  },
  deleteBtn: {
    marginLeft: 2,
    padding: 4,
  },
  historyBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#fc8019',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  historyTitle: {
    fontWeight: 'bold',
    color: '#222',
    fontSize: 15,
    marginBottom: 2,
  },
  historySub: {
    color: '#888',
    fontSize: 13,
    marginBottom: 2,
  },
  historyAmount: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 4,
  },
  paidTag: {
    backgroundColor: '#e6ffed',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  paidTagText: {
    color: 'green',
    fontWeight: 'bold',
    fontSize: 12,
  },
  footer: {
    textAlign: 'center',
    color: '#888',
    fontSize: 12,
    marginTop: 18,
  },
}); 