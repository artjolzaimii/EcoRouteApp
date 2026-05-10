import { Colors } from '@/constants/theme';
import { MOOD_LIST } from '@/lib/mood';
import { RouteMood } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  selected: RouteMood | undefined;
  onSelect: (mood: RouteMood | undefined) => void;
  /** Show "How are you feeling?" header + helper text. Default true. */
  showHeader?: boolean;
};

export function MoodSelector({ selected, onSelect, showHeader = true }: Props) {
  return (
    <View>
      {showHeader && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>How are you feeling?</Text>
            <Text style={styles.subtitle}>Personalise your route recommendations</Text>
          </View>
          {selected && (
            <TouchableOpacity
              onPress={() => onSelect(undefined)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <FlatList
        data={MOOD_LIST}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const active = selected === item.id;
          return (
            <TouchableOpacity
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onSelect(active ? undefined : item.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={item.icon as React.ComponentProps<typeof Ionicons>['name']}
                size={16}
                color={active ? Colors.emerald700 : Colors.gray400}
              />
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerLeft: { flex: 1, gap: 2 },
  title: { color: Colors.gray900, fontWeight: '600', fontSize: 14 },
  subtitle: { color: Colors.gray400, fontSize: 11 },
  clearText: { color: Colors.emerald600, fontSize: 13, fontWeight: '600' },

  list: { gap: 8, paddingVertical: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    backgroundColor: Colors.gray50,
  },
  chipActive: {
    backgroundColor: Colors.emerald50,
    borderColor: Colors.emerald400,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.gray600,
  },
  chipLabelActive: {
    color: Colors.emerald700,
    fontWeight: '600',
  },
});
