import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, linkWithCredential } from 'firebase/auth';
import { auth } from '../config/firebase';
import { AuthService } from './AuthService';

WebBrowser.maybeCompleteAuthSession();

export function useFirebaseAuthService(): AuthService {
  const [, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '',
  });

  return {
    async linkWithGoogle() {
      const result = await promptAsync();
      if (result.type !== 'success') {
        throw new Error('Google sign-in cancelled or failed');
      }
      const { id_token } = result.params;
      const credential = GoogleAuthProvider.credential(id_token);
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No current user');
      await linkWithCredential(currentUser, credential);
    },
  };
}
