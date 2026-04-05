export type ExpiryStatus = 'expired' | 'near' | 'ok' | 'none';

/** 賞味期限の状態を返す。near は残り3日以内（当日含まず）*/
export function getExpiryStatus(expiryDate: string | undefined): ExpiryStatus {
  if (!expiryDate || !expiryDate.trim()) return 'none';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  if (expiry <= today) return 'expired';

  const diffDays = (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays <= 3) return 'near';

  return 'ok';
}
