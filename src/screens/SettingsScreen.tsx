import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useSharing } from '../context/SharingContext';
import { AuthService } from '../services/AuthService';
import { LocalRepository } from '../db/LocalRepository';
import { CloudRepository } from '../db/CloudRepository';
import { migrateToCloud } from '../services/MigrationService';
import {
  generateInviteCode,
  joinWithCode,
  getMembers,
  removeMember,
  leaveSharing,
  Member,
  MEMBER_LIMIT,
} from '../services/SharingService';

interface Props {
  onBack: () => void;
  authService: AuthService;
}

export default function SettingsScreen({ onBack, authService }: Props) {
  const { user, signInAnon } = useAuth();
  const { ownerUid, isOwner, refresh } = useSharing();

  const [isLinking, setIsLinking] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inviteInput, setInviteInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const isLinked = user !== null && !user.isAnonymous;

  useEffect(() => {
    if (isLinked && isOwner && user) {
      setIsLoadingMembers(true);
      getMembers(user.uid)
        .then(setMembers)
        .catch(() => {})
        .finally(() => setIsLoadingMembers(false));
    }
  }, [isLinked, isOwner, user?.uid]);

  async function handleLinkGoogle() {
    setIsLinking(true);
    try {
      await signInAnon();
      await authService.linkWithGoogle();
      if (user) {
        const local = new LocalRepository();
        const cloud = new CloudRepository(user.uid);
        await migrateToCloud(local, cloud);
      }
      await refresh();
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

  async function handleGenerateCode() {
    if (!user) return;
    setIsGenerating(true);
    try {
      const code = await generateInviteCode(user.uid);
      setGeneratedCode(code);
    } catch (e) {
      Alert.alert('エラー', e instanceof Error ? e.message : '不明なエラー');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleJoinWithCode() {
    if (!user || !inviteInput.trim()) return;
    setIsJoining(true);
    try {
      await joinWithCode(inviteInput.trim(), user.uid);
      await refresh();
      setInviteInput('');
      Alert.alert('完了', 'フリッジに参加しました');
    } catch (e) {
      Alert.alert('エラー', e instanceof Error ? e.message : '不明なエラー');
    } finally {
      setIsJoining(false);
    }
  }

  function handleLeaveSharing() {
    if (!user || !ownerUid) return;
    Alert.alert(
      '共有を解除',
      '解除するとこのデバイスのローカルデータに戻ります。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '解除する',
          style: 'destructive',
          onPress: async () => {
            setIsLeaving(true);
            try {
              await leaveSharing(user.uid, ownerUid);
              await refresh();
            } catch (e) {
              Alert.alert('エラー', e instanceof Error ? e.message : '不明なエラー');
            } finally {
              setIsLeaving(false);
            }
          },
        },
      ],
    );
  }

  function handleRemoveMember(memberUid: string) {
    if (!user) return;
    Alert.alert('メンバーを削除', 'このメンバーを削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除する',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeMember(user.uid, memberUid);
            setMembers((prev) => prev.filter((m) => m.uid !== memberUid));
          } catch (e) {
            Alert.alert('エラー', e instanceof Error ? e.message : '不明なエラー');
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.root} testID="settings-screen">
      <View style={styles.header}>
        <TouchableOpacity testID="btn-back" onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>設定</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Googleアカウントリンク */}
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

        {/* オーナー向け: 招待コード生成 */}
        {isLinked && isOwner && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>仲間を招待する</Text>
            <TouchableOpacity
              testID="btn-generate-code"
              style={[styles.linkBtn, isGenerating && styles.linkBtnDisabled]}
              onPress={handleGenerateCode}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.linkBtnText}>招待コードを生成</Text>
              )}
            </TouchableOpacity>
            {generatedCode !== null && (
              <View style={styles.codeCard} testID="invite-code-display">
                <Text style={styles.codeText} testID="invite-code-value">
                  {generatedCode}
                </Text>
                <Text style={styles.codeHint}>このコードを仲間に伝えてください（24時間有効）</Text>
              </View>
            )}
          </View>
        )}

        {/* オーナー向け: メンバー一覧 */}
        {isLinked && isOwner && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              メンバー ({members.length}/{MEMBER_LIMIT - 1}人)
            </Text>
            {isLoadingMembers ? (
              <ActivityIndicator color="#0d8f7a" />
            ) : members.length === 0 ? (
              <Text style={styles.emptyText}>まだメンバーがいません</Text>
            ) : (
              members.map((member) => (
                <View
                  key={member.uid}
                  style={styles.memberRow}
                  testID={`member-row-${member.uid.substring(0, 8)}`}
                >
                  <Text style={styles.memberUid}>{member.uid.substring(0, 12)}...</Text>
                  <TouchableOpacity
                    testID={`btn-remove-member-${member.uid.substring(0, 8)}`}
                    onPress={() => handleRemoveMember(member.uid)}
                  >
                    <Text style={styles.removeMemberText}>削除</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* オーナー向け: 招待コードで参加 */}
        {isLinked && isOwner && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>招待コードで参加する</Text>
            <TextInput
              testID="invite-code-input"
              style={styles.codeInput}
              value={inviteInput}
              onChangeText={(t) => setInviteInput(t.toUpperCase())}
              placeholder="6桁のコードを入力"
              placeholderTextColor="#9ab3ac"
              autoCapitalize="characters"
              maxLength={6}
            />
            <TouchableOpacity
              testID="btn-join-with-code"
              style={[
                styles.linkBtn,
                styles.joinBtn,
                (!inviteInput.trim() || isJoining) && styles.linkBtnDisabled,
              ]}
              onPress={handleJoinWithCode}
              disabled={!inviteInput.trim() || isJoining}
            >
              {isJoining ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.linkBtnText}>参加する</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* メンバー向け: 共有状態・解除 */}
        {isLinked && !isOwner && ownerUid && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>共有状態</Text>
            <View style={styles.linkedCard}>
              <Text style={styles.linkedText}>オーナーのフリッジに参加中</Text>
              <Text style={styles.linkedSub}>{ownerUid.substring(0, 12)}...</Text>
            </View>
            <TouchableOpacity
              testID="btn-leave-sharing"
              style={[styles.leaveBtn, isLeaving && styles.linkBtnDisabled]}
              onPress={handleLeaveSharing}
              disabled={isLeaving}
            >
              {isLeaving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.linkBtnText}>共有を解除</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(13, 143, 122, 0.15)',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5c7a72',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  linkBtn: {
    backgroundColor: '#0d8f7a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinBtn: {
    backgroundColor: '#5c7a72',
  },
  leaveBtn: {
    backgroundColor: '#c73e3e',
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
  codeCard: {
    backgroundColor: '#f0f9f5',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  codeText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a2e2a',
    letterSpacing: 6,
  },
  codeHint: {
    fontSize: 12,
    color: '#5c7a72',
    textAlign: 'center',
  },
  codeInput: {
    borderWidth: 1,
    borderColor: 'rgba(13, 143, 122, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#1a2e2a',
    letterSpacing: 4,
    textAlign: 'center',
    backgroundColor: '#f6fbf9',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(13, 143, 122, 0.1)',
  },
  memberUid: {
    fontSize: 13,
    color: '#1a2e2a',
    fontFamily: 'monospace',
  },
  removeMemberText: {
    fontSize: 13,
    color: '#c73e3e',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
    color: '#9ab3ac',
    textAlign: 'center',
    paddingVertical: 8,
  },
});
