import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface Props {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  testID?: string;
}

function toDate(iso: string | undefined): Date {
  if (!iso) return new Date();
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date() : d;
}

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatJP(iso: string): string {
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return `${parseInt(parts[0])}年${parseInt(parts[1])}月${parseInt(parts[2])}日`;
}

export default function DatePickerField({ value, onChange, testID }: Props) {
  const [show, setShow] = useState(false);

  function handleChange(_event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') setShow(false);
    if (date) onChange(toISO(date));
  }

  function handleClear() {
    setShow(false);
    onChange(undefined);
  }

  return (
    <View>
      <TouchableOpacity
        testID={testID}
        style={styles.field}
        onPress={() => setShow(true)}
        accessibilityLabel="賞味期限を選択"
      >
        <Text style={[styles.fieldText, !value && styles.placeholder]}>
          {value ? formatJP(value) : '未設定（タップして選択）'}
        </Text>
        <Text style={styles.calIcon}>📅</Text>
      </TouchableOpacity>

      {value && (
        <TouchableOpacity
          testID={testID ? `${testID}-clear` : undefined}
          style={styles.clearBtn}
          onPress={handleClear}
        >
          <Text style={styles.clearText}>クリア</Text>
        </TouchableOpacity>
      )}

      {show && (
        <DateTimePicker
          value={toDate(value)}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
          onChange={handleChange}
          minimumDate={new Date(2000, 0, 1)}
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
  placeholder: {
    color: '#9ab3ac',
  },
  calIcon: {
    fontSize: 18,
    marginLeft: 8,
  },
  clearBtn: {
    alignSelf: 'flex-end',
    marginTop: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  clearText: {
    fontSize: 12,
    color: '#5c7a72',
    textDecorationLine: 'underline',
  },
});
