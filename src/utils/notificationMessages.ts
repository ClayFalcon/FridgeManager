/** 賞味期限が近い食品をまとめた通知本文を作る */
export function formatExpiryMessage(itemNames: string[], offsetDays: number): string {
  if (itemNames.length === 0) return '';

  const periodText = offsetDays === 0 ? '今日までです' : `${offsetDays}日以内です`;

  if (itemNames.length === 1) {
    return `${itemNames[0]}の賞味期限が${periodText}。`;
  }

  const [first, second] = itemNames;
  return `${first}や${second}など${itemNames.length}つの食材の賞味期限が${periodText}。`;
}

export function formatManualNotifyMessage(senderDisplayName: string | null): {
  title: string;
  body: string;
} {
  const name = senderDisplayName && senderDisplayName.trim() ? senderDisplayName : '共有メンバー';
  return {
    title: 'FridgeManager',
    body: `${name}さんが在庫状況を最新化しました！`,
  };
}
