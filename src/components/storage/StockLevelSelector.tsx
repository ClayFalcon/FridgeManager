import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { StockLevel } from '../../types/food';
import { useAppSettings } from '../../context/AppSettingsContext';
import { stepButtons, isButtonActive } from '../../utils/stockDisplay';

interface Props {
  itemId: string;
  level: StockLevel;
  onChange: (level: StockLevel) => void;
}

const LEVEL_COLORS: Record<StockLevel, { bg: string; text: string }> = {
  0: { bg: '#f0f0f0', text: '#666666' },
  1: { bg: '#c5ebe2', text: '#2a8f6e' },
  2: { bg: '#0d8f7a', text: '#ffffff' },
};

export default function StockLevelSelector({ itemId, level, onChange }: Props) {
  const { statusMode } = useAppSettings();
  const buttons = stepButtons(statusMode);

  return (
    <View style={styles.container} testID={`stock-selector-${itemId}`}>
      {buttons.map((btn) => {
        const isSelected = isButtonActive(statusMode, btn.level, level);
        const colors = LEVEL_COLORS[btn.level];
        return (
          <TouchableOpacity
            key={btn.level}
            testID={`stock-btn-${itemId}-${btn.level}`}
            style={[
              styles.btn,
              { backgroundColor: isSelected ? colors.bg : '#f5f5f5' },
              isSelected && styles.btnSelected,
            ]}
            onPress={() => onChange(btn.level)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={btn.label}
          >
            <Text
              style={[
                styles.label,
                { color: isSelected ? colors.text : '#999999' },
                isSelected && styles.labelSelected,
              ]}
            >
              {btn.label}
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
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(13, 143, 122, 0.15)',
  },
  btn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnSelected: {
    shadowColor: '#0d8f7a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
  labelSelected: {
    fontWeight: '700',
  },
});
