import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useSharing } from '../context/SharingContext';
import { subscribeHistory, HistoryEntry } from '../services/HistoryService';
import { STOCK_LABELS } from '../types/food';

function formatDateTime(d: Date | null): string {
  if (!d) return '';
  const m = String(d.getMonth() + 1);
  const day = String(d.getDate());
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${m}月${day}日 ${hh}:${mm}`;
}

export default function HistoryScreen() {
  const { user } = useAuth();
  const { ownerUid } = useSharing();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [detail, setDetail] = useState<HistoryEntry | null>(null);

  const isLinked = user !== null && !user.isAnonymous;

  useEffect(() => {
    if (!isLinked || !ownerUid) return;
    const unsubscribe = subscribeHistory(ownerUid, setEntries);
    return unsubscribe;
  }, [isLinked, ownerUid]);

  return (
    <SafeAreaView style={styles.root} testID="history-screen">
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} testID="history-title">履歴</Text>
        <Text style={styles.headerSub}>通知ごとの在庫変更を記録</Text>
      </View>

      {!isLinked ? (
        <View style={styles.guide} testID="history-guide">
          <Text style={styles.guideText}>
            共有グループで使えます。設定から家族と共有すると、通知ごとの在庫変更履歴が見られます。
          </Text>
        </View>
      ) : (
        <FlatList
          testID="history-list"
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>まだ履歴はありません</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              testID={`history-item-${item.id}`}
              onPress={() => setDetail(item)}
            >
              <View style={styles.cardHead}>
                <Text style={styles.cardWho}>{item.notifiedByName ?? '共有メンバー'}さん</Text>
                <Text style={styles.cardTime}>{formatDateTime(item.notifiedAt)}</Text>
              </View>
              <Text style={styles.cardSummary}>
                {item.changes.length === 0 ? '変更なし' : `${item.changes.length}件の在庫変更`}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* 詳細モーダル */}
      <Modal
        visible={detail !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setDetail(null)}
        testID="history-detail-modal"
      >
        <View style={styles.overlay}>
          <View style={styles.sheet} testID="history-detail-sheet">
            <Text style={styles.detailTitle}>
              {detail?.notifiedByName ?? '共有メンバー'}さんの更新
            </Text>
            <Text style={styles.detailTime}>{formatDateTime(detail?.notifiedAt ?? null)}</Text>

            <ScrollView style={styles.detailList}>
              {detail && detail.changes.length === 0 ? (
                <Text style={styles.emptyText}>在庫レベルの変更はありませんでした</Text>
              ) : (
                detail?.changes.map((c, index) => (
                  <View style={styles.changeRow} key={index} testID={`history-change-${index}`}>
                    <Text style={styles.changeName}>{c.foodName}</Text>
                    <Text style={styles.changeArrow}>
                      {STOCK_LABELS[c.fromLevel]} → {STOCK_LABELS[c.toLevel]}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              testID="history-detail-close"
              style={styles.btnClose}
              onPress={() => setDetail(null)}
            >
              <Text style={styles.btnCloseText}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f0f9f5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(13, 143, 122, 0.12)',
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a2e2a',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    color: '#5c7a72',
    marginTop: 2,
  },
  guide: {
    padding: 24,
    alignItems: 'center',
  },
  guideText: {
    fontSize: 14,
    color: '#5c7a72',
    lineHeight: 22,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    marginBottom: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(13, 143, 122, 0.15)',
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardWho: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a2e2a',
  },
  cardTime: {
    fontSize: 12,
    color: '#9ab3ac',
  },
  cardSummary: {
    fontSize: 13,
    color: '#0d8f7a',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 48,
    color: '#5c7a72',
    fontSize: 14,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a2e2a',
  },
  detailTime: {
    fontSize: 12,
    color: '#9ab3ac',
    marginTop: 4,
    marginBottom: 12,
  },
  detailList: {
    flexGrow: 0,
  },
  changeRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(13, 143, 122, 0.1)',
  },
  changeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a2e2a',
  },
  changeArrow: {
    fontSize: 13,
    color: '#5c7a72',
    marginTop: 2,
  },
  btnClose: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(13, 143, 122, 0.3)',
    alignItems: 'center',
  },
  btnCloseText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5c7a72',
  },
});
