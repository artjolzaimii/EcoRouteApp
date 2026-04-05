import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow } from '@/constants/theme';

const recentSearches = [
  { id: '1', from: 'Home', to: 'Office', time: '2 hours ago' },
  { id: '2', from: 'Office', to: 'Whole Foods', time: 'Yesterday' },
  { id: '3', from: 'Home', to: 'City Park', time: '2 days ago' },
];

const popularDestinations = [
  { id: '1', name: 'Downtown Station', address: 'Main Street, City Center' },
  { id: '2', name: 'City Park', address: 'Green Avenue' },
  { id: '3', name: 'University Campus', address: 'Campus Drive' },
  { id: '4', name: 'Shopping District', address: 'Commerce Street' },
];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [toValue, setToValue] = useState('');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header with Back */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back-outline" size={20} color={Colors.emerald600} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Search Inputs */}
      <View style={styles.inputsSection}>
        {/* From Field */}
        <View style={styles.inputRow}>
          <View style={styles.dotGreen}>
            <View style={styles.dotGreenInner} />
          </View>
          <TextInput
            style={styles.locationInput}
            value="Current location"
            editable={false}
            selectTextOnFocus={false}
          />
        </View>

        {/* Dashed connector */}
        <View style={styles.connector} />

        {/* To Field */}
        <View style={styles.inputRow}>
          <View style={styles.dotRed}>
            <Ionicons name="location-outline" size={16} color={Colors.red600} />
          </View>
          <TextInput
            style={styles.toInput}
            placeholder="Where to?"
            placeholderTextColor={Colors.gray400}
            value={toValue}
            onChangeText={setToValue}
            autoFocus
          />
        </View>
      </View>

      {/* Results */}
      <ScrollView style={styles.results} showsVerticalScrollIndicator={false}>
        {/* Recent Searches */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent</Text>
          <View style={styles.listWrap}>
            {recentSearches.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.listItem}
                onPress={() => router.push('/(tabs)/routes')}
                activeOpacity={0.7}
              >
                <View style={styles.listIconBox}>
                  <Ionicons name="time-outline" size={20} color={Colors.gray600} />
                </View>
                <View style={styles.listText}>
                  <Text style={styles.listPrimary}>{item.from} → {item.to}</Text>
                  <Text style={styles.listSecondary}>{item.time}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Popular Destinations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular destinations</Text>
          <View style={styles.listWrap}>
            {popularDestinations.map((dest) => (
              <TouchableOpacity
                key={dest.id}
                style={styles.listItem}
                onPress={() => router.push('/(tabs)/routes')}
                activeOpacity={0.7}
              >
                <View style={[styles.listIconBox, styles.listIconGreen]}>
                  <Ionicons name="trending-up-outline" size={20} color={Colors.emerald600} />
                </View>
                <View style={styles.listText}>
                  <Text style={styles.listPrimary}>{dest.name}</Text>
                  <Text style={styles.listSecondary}>{dest.address}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backText: { color: Colors.emerald600, fontWeight: '600', fontSize: 16 },

  // Search inputs
  inputsSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    gap: 0,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dotGreen: {
    width: 32,
    height: 32,
    backgroundColor: Colors.emerald100,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dotGreenInner: { width: 12, height: 12, backgroundColor: Colors.emerald600, borderRadius: 6 },
  dotRed: {
    width: 32,
    height: 32,
    backgroundColor: Colors.red100,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  locationInput: {
    flex: 1,
    color: '#1A1A1A',
    fontWeight: '500',
    fontSize: 15,
    paddingVertical: 0,
  },
  toInput: { flex: 1, color: '#1A1A1A', fontSize: 15, paddingVertical: 0 },
  connector: {
    height: 20,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.gray200,
    marginLeft: 15,
    marginVertical: 4,
  },

  // Results
  results: { flex: 1 },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  sectionTitle: { color: '#1A1A1A', fontWeight: '700', fontSize: 17, marginBottom: 12 },
  listWrap: { gap: 4 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderRadius: 12,
  },
  listIconBox: {
    width: 40,
    height: 40,
    backgroundColor: Colors.gray100,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  listIconGreen: { backgroundColor: Colors.emerald50 },
  listText: { flex: 1 },
  listPrimary: { color: '#1A1A1A', fontWeight: '600', fontSize: 15, marginBottom: 2 },
  listSecondary: { color: Colors.gray500, fontSize: 13 },
});
