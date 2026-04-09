import { AuthService } from './AuthService';

// TODO: Google Cloud ConsoleでAndroid Client IDを取得後に実装する
// 必要な手順:
//   1. Google Cloud Console でOAuth 2.0クライアントID（Androidアプリ）を作成
//   2. androidClientId に設定
//   3. expo-auth-session の Google.useAuthRequest を使ったOAuthフローを実装

export function useFirebaseAuthService(): AuthService {
  return {
    async linkWithGoogle(): Promise<void> {
      throw new Error('Google OAuth は未設定です。Android Client ID を設定してください。');
    },
  };
}
