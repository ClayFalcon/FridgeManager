import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * 自分の端末のプッシュ通知トークンを登録する。
 * 実機以外・通知権限拒否・EASプロジェクト未設定の場合は静かに諦める（フェイルソフト）。
 */
export async function registerPushToken(ownerUid: string, uid: string): Promise<void> {
  try {
    if (!Device.isDevice) return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return;

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (!token) return;

    const tokenDoc =
      uid === ownerUid
        ? doc(db, 'users', ownerUid, 'pushTokens', token)
        : doc(db, 'users', ownerUid, 'members', uid, 'pushTokens', token);

    await setDoc(tokenDoc, {
      token,
      platform: Platform.OS,
      updatedAt: serverTimestamp(),
    });
  } catch {
    // フェイルソフト
  }
}
