import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export interface TabDef {
  key: string;
  label: string;
  icon: string;
}

interface Props {
  tabs: TabDef[];
  activeKey: string;
  onSelect: (key: string) => void;
}

export default function BottomTabBar({ tabs, activeKey, onSelect }: Props) {
  return (
    <View style={styles.container} testID="bottom-tab-bar">
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <TouchableOpacity
            key={tab.key}
            testID={`bottom-tab-${tab.key}`}
            style={styles.tab}
            onPress={() => onSelect(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={styles.icon}>{tab.icon}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(13, 143, 122, 0.12)',
    paddingBottom: 6,
    paddingTop: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5c7a72',
  },
  labelActive: {
    color: '#0d8f7a',
    fontWeight: '700',
  },
});
