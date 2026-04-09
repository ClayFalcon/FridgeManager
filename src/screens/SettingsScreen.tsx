import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { AuthService } from '../services/AuthService';
import { LocalRepository } from '../db/LocalRepository';
import { CloudRepository } from '../db/CloudRepository';
import { migrateToCloud } from '../services/MigrationService';

interface Props {
  onBack: () => void;
  authService: AuthService;
}

export default function SettingsScreen({ onBack, authService }: Props) {
  const { user } = useAuth();
  const [isLinking, setIsLinking] = useState(false);

  const isLinked = user !== null && !user.isAnonymous;

  async function handleLinkGoogle() {
    setIsLinking(true);
    try {
      await authService.linkWithGoogle();
      if (user) {
        const local = new LocalRepository();
        const cloud = new CloudRepository(user.uid);
        await migrateToCloud(local, cloud);
      }
      Alert.alert('完了', '家族との共有を開始しました');
    } catch (e) {
      const message = e instanceof Error ? e.message : '不明なエラー';
      if (message !== 'Google sign-in cancelled or failed') {
        Alert.alert('エラー', message);
      }
    } finally {
      setIsLinking(false);
    }
  }

  return (
    <SafeAreaView style={styles.root} testID="settings-screen">
      <View style={styles.header}>
        <TouchableOpacity testID="btn-back" onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>設定</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>データ共有</Text>

        {isLinked ? (
          <View testID="linked-status" style={styles.linkedCard}>
            <Text style={styles.linkedText}>Googleアカウントで共有中</Text>
            <Text style={styles.linkedSub}>{user?.email}</Text>
          </View>
        ) : (
          <TouchableOpacity
            testID="btn-link-google"
            style={[styles.linkBtn, isLinking && styles.linkBtnDisabled]}
            onPress={handleLinkGoogle}
            disabled={isLinking}
          >
            {isLinking ? (
              <ActivityIndicator testID="link-loading" color="#ffffff" />
            ) : (
              <Text style={styles.linkBtnText}>家族と共有する</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f0f9f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(13, 143, 122, 0.12)',
    backgroundColor: '#ffffff',
    gap: 12,
  },
  backBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  backText: {
    fontSize: 15,
    color: '#0d8f7a',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a2e2a',
  },
  section: {
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(13, 143, 122, 0.15)',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5c7a72',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  linkBtn: {
    backgroundColor: '#0d8f7a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  linkBtnDisabled: {
    opacity: 0.6,
  },
  linkBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  linkedCard: {
    backgroundColor: '#f0f9f5',
    borderRadius: 10,
    padding: 12,
  },
  linkedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0d8f7a',
  },
  linkedSub: {
    fontSize: 12,
    color: '#5c7a72',
    marginTop: 2,
  },
});
