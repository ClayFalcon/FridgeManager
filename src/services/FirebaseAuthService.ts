import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, linkWithCredential } from 'firebase/auth';
import { auth } from '../config/firebase';
import { AuthService } from './AuthService';

WebBrowser.maybeCompleteAuthSession();

const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

// .env 未設定時に useIdTokenAuthRequest がレンダー時に throw してアプリ全体が
// 起動不能になるのを防ぐためのダミー値（実際のリンク操作は linkWithGoogle 内のガードで弾く）
const PLACEHOLDER_CLIENT_ID = 'missing-client-id.apps.googleusercontent.com';

export function useFirebaseAuthService(): AuthService {
  const [, , promptAsync] = Google.useIdTokenAuthRequest({
    androidClientId: ANDROID_CLIENT_ID ?? PLACEHOLDER_CLIENT_ID,
    webClientId: WEB_CLIENT_ID ?? PLACEHOLDER_CLIENT_ID,
  });

  return {
    async linkWithGoogle(): Promise<void> {
      if (!ANDROID_CLIENT_ID || !WEB_CLIENT_ID) {
        throw new Error(
          'Google OAuth が未設定です。.env ファイルに EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID と EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID を設定してください。',
        );
      }
      const result = await promptAsync();
      if (result.type !== 'success') {
        throw new Error('Google sign-in cancelled or failed');
      }
      const idToken = result.params.id_token;
      if (!idToken) {
        throw new Error('Google から ID トークンを取得できませんでした');
      }
      const credential = GoogleAuthProvider.credential(idToken);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('ログイン中のユーザーが見つかりません');
      }
      await linkWithCredential(currentUser, credential);
    },
  };
}
