import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { DISPLAY_NAME_MAX_LENGTH, validateDisplayName } from '../services/DisplayNameService';

export const DISPLAY_NAME_PRIVACY_NOTE =
  'この名前は、一緒に共有している家族（メンバー）にだけ表示されます。家族以外には公開されません。';

interface Props {
  visible: boolean;
  // 共有を始めた直後など、見出しの上に添える一言（任意）
  lead?: string;
  initialName?: string | null;
  onSave: (name: string) => Promise<void>;
  onCancel: () => void;
  cancelLabel?: string;
}

// 家族に表示する名前の入力ダイアログ
export default function DisplayNameModal({
  visible,
  lead,
  initialName,
  onSave,
  onCancel,
  cancelLabel = 'キャンセル',
}: Props) {
  const [name, setName] = useState(initialName ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(initialName ?? '');
      setError(null);
    }
  }, [visible, initialName]);

  async function handleSave() {
    const result = validateDisplayName(name);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setIsSaving(true);
    try {
      await onSave(result.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存できませんでした');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card} testID="display-name-modal">
          {lead ? <Text style={styles.lead}>{lead}</Text> : null}
          <Text style={styles.title}>家族に表示する名前</Text>
          <Text style={styles.note} testID="display-name-privacy-note">
            {DISPLAY_NAME_PRIVACY_NOTE}
          </Text>
          <TextInput
            testID="display-name-input"
            style={styles.input}
            value={name}
            onChangeText={(t) => {
              setName(t);
              setError(null);
            }}
            placeholder="例: はやと"
            placeholderTextColor="#9ab3ac"
            maxLength={DISPLAY_NAME_MAX_LENGTH}
            autoFocus
          />
          {error ? (
            <Text style={styles.error} testID="display-name-error">
              {error}
            </Text>
          ) : null}
          <View style={styles.buttons}>
            <TouchableOpacity
              testID="btn-display-name-cancel"
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={isSaving}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="btn-display-name-save"
              style={[styles.button, styles.saveButton, isSaving && styles.disabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.saveText}>保存</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
  },
  lead: {
    fontSize: 14,
    color: '#0d8f7a',
    fontWeight: '700',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2d2a',
  },
  note: {
    marginTop: 8,
    fontSize: 13,
    color: '#5c7a72',
    lineHeight: 19,
  },
  input: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#b8ddd4',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2d2a',
  },
  error: {
    marginTop: 6,
    fontSize: 12,
    color: '#c53d3d',
  },
  buttons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#b8ddd4',
  },
  cancelText: {
    color: '#5c7a72',
    fontSize: 15,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#0d8f7a',
  },
  saveText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
});
