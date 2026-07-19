import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface Props {
  /** 'HH:mm' 形式 */
  value: string;
  onChange: (value: string) => void;
  testID?: string;
}

function toDate(time: string): Date {
  const [hours, minutes] = time.split(':').map((s) => parseInt(s, 10));
  const d = new Date();
  d.setHours(isNaN(hours) ? 9 : hours, isNaN(minutes) ? 0 : minutes, 0, 0);
  return d;
}

function toHHmm(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export default function TimePickerField({ value, onChange, testID }: Props) {
  const [show, setShow] = useState(false);

  function handleChange(_event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') setShow(false);
    if (date) onChange(toHHmm(date));
  }

  return (
    <View>
      <TouchableOpacity
        testID={testID}
        style={styles.field}
        onPress={() => setShow(true)}
        accessibilityLabel="通知時刻を選択"
      >
        <Text style={styles.fieldText}>{value}</Text>
        <Text style={styles.clockIcon}>🕒</Text>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={toDate(value)}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
          onChange={handleChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(13, 143, 122, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f6fbf9',
  },
  fieldText: {
    fontSize: 16,
    color: '#1a2e2a',
    flex: 1,
  },
  clockIcon: {
    fontSize: 18,
    marginLeft: 8,
  },
});
