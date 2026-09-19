// 共有（参加）まわりで利用者に見せる文言。オーナーが名前を決めていなければ「招待した人」と呼ぶ
function ownerLabel(ownerName?: string | null): string {
  return ownerName ? `${ownerName} さん` : '招待した人';
}

export const JOINED_TITLE = '参加しました';

export function joinedMessage(ownerName?: string | null): string {
  return `${ownerLabel(ownerName)}の冷蔵庫を一緒に使えるようになりました。食品・レシピ・買い物リストが共有されます。`;
}

export function sharingStatusLabel(ownerName?: string | null): string {
  return `${ownerLabel(ownerName)}の冷蔵庫を共有中`;
}
