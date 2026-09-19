import { exchangeCodeAsync } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, linkWithCredential, signInWithCredential } from 'firebase/auth';
import type { FirebaseError } from 'firebase/app';
import { auth } from '../config/firebase';
import { AuthService, GoogleLinkResult } from './AuthService';

WebBrowser.maybeCompleteAuthSession();

const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

// .env 未設定時に useIdTokenAuthRequest がレンダー時に throw してアプリ全体が
// 起動不能になるのを防ぐためのダミー値（実際のリンク操作は linkWithGoogle 内のガードで弾く）
const PLACEHOLDER_CLIENT_ID = 'missing-client-id.apps.googleusercontent.com';

export function useFirebaseAuthService(): AuthService {
  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    androidClientId: ANDROID_CLIENT_ID ?? PLACEHOLDER_CLIENT_ID,
    webClientId: WEB_CLIENT_ID ?? PLACEHOLDER_CLIENT_ID,
    // Android では認可コード（PKCE）が返り、ID トークンはコード交換で得る。
    // フックの自動交換は結果を promptAsync の戻り値ではなく response に反映するため、
    // ここでは自動交換を止めて linkWithGoogle 内で交換する（コードは1回しか交換できない）。
    shouldAutoExchangeCode: false,
  });

  return {
    async linkWithGoogle(): Promise<GoogleLinkResult> {
      if (!ANDROID_CLIENT_ID || !WEB_CLIENT_ID) {
        throw new Error(
          'Google OAuth が未設定です。.env ファイルに EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID と EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID を設定してください。',
        );
      }
      const result = await promptAsync();
      if (result.type !== 'success') {
        throw new Error('Google sign-in cancelled or failed');
      }
      let idToken: string | undefined = result.params.id_token;
      if (!idToken && result.params.code && request) {
        const tokens = await exchangeCodeAsync(
          {
            clientId: ANDROID_CLIENT_ID,
            code: result.params.code,
            redirectUri: request.redirectUri,
            extraParams: { code_verifier: request.codeVerifier ?? '' },
          },
          Google.discovery,
        );
        idToken = tokens.idToken;
      }
      if (!idToken) {
        throw new Error('Google から ID トークンを取得できませんでした');
      }
      const credential = GoogleAuthProvider.credential(idToken);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('ログイン中のユーザーが見つかりません');
      }
      try {
        await linkWithCredential(currentUser, credential);
        return 'linked';
      } catch (e) {
        // 入れ直し・機種変更後など、この Google アカウントが既存ユーザーにつながっている場合は
        // そのユーザーでログインし直して共有を再開する（匿名ユーザーは使われなくなる）
        if ((e as FirebaseError).code === 'auth/credential-already-in-use') {
          const existing = GoogleAuthProvider.credentialFromError(e as FirebaseError) ?? credential;
          await signInWithCredential(auth, existing);
          return 'signedIn';
        }
        throw e;
      }
    },
  };
}
