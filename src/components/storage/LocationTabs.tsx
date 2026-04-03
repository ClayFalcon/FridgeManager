import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { STORAGE_LOCATIONS, LOCATION_LABELS, StorageLocation } from '../../types/food';

interface Props {
  selected: StorageLocation;
  onSelect: (location: StorageLocation) => void;
}

export default function LocationTabs({ selected, onSelect }: Props) {
  return (
    <View style={styles.container} testID="location-tabs">
      {STORAGE_LOCATIONS.map((loc) => {
        const isSelected = loc === selected;
        return (
          <TouchableOpacity
            key={loc}
            testID={`tab-${loc}`}
            style={[styles.tab, isSelected && styles.tabSelected]}
            onPress={() => onSelect(loc)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {LOCATION_LABELS[loc]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  tab: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: '#eef6f3',
    alignItems: 'center',
  },
  tabSelected: {
    backgroundColor: '#0d8f7a',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5c7a72',
  },
  labelSelected: {
    color: '#ffffff',
  },
});
