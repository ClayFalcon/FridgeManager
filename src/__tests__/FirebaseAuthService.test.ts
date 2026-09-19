const mockPromptAsync = jest.fn();
const mockExchangeCodeAsync = jest.fn();
const mockLinkWithCredential = jest.fn();
const mockCredential = jest.fn((idToken: string) => ({ idToken }));
const mockRequest = {
  redirectUri: 'com.terrastrix.fridgemanager:/oauthredirect',
  codeVerifier: 'verifier-123',
};
const mockUseIdTokenAuthRequest = jest.fn((_config: unknown) => [mockRequest, null, mockPromptAsync]);
const mockAuth: { currentUser: unknown } = { currentUser: { uid: 'anon-uid' } };

// babel-preset-expo は process.env.EXPO_PUBLIC_* を expo/virtual/env（ESM）経由に書き換えるため差し替える
jest.mock('expo/virtual/env', () => ({ env: process.env }));
jest.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: jest.fn() }));
jest.mock('expo-auth-session', () => ({
  exchangeCodeAsync: (...args: unknown[]) => mockExchangeCodeAsync(...args),
}));
jest.mock('expo-auth-session/providers/google', () => ({
  useIdTokenAuthRequest: (config: unknown) => mockUseIdTokenAuthRequest(config),
  discovery: { tokenEndpoint: 'https://oauth2.googleapis.com/token' },
}));
jest.mock('firebase/auth', () => ({
  GoogleAuthProvider: { credential: (idToken: string) => mockCredential(idToken) },
  linkWithCredential: (...args: unknown[]) => mockLinkWithCredential(...args),
}));
jest.mock('../config/firebase', () => ({ auth: mockAuth }));

const ANDROID_CLIENT_ID = 'android-client.apps.googleusercontent.com';

function loadService() {
  let service!: import('../services/AuthService').AuthService;
  jest.isolateModules(() => {
    const { useFirebaseAuthService } = require('../services/FirebaseAuthService');
    service = useFirebaseAuthService();
  });
  return service;
}

describe('FirebaseAuthService.linkWithGoogle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID = ANDROID_CLIENT_ID;
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = 'web-client.apps.googleusercontent.com';
    mockAuth.currentUser = { uid: 'anon-uid' };
  });

  it('フックの自動コード交換を無効にする（コードは1回しか交換できないため）', () => {
    loadService();
    expect(mockUseIdTokenAuthRequest).toHaveBeenCalledWith(
      expect.objectContaining({ shouldAutoExchangeCode: false }),
    );
  });

  it('Android の認可コードを ID トークンに交換して匿名ユーザーにリンクする', async () => {
    mockPromptAsync.mockResolvedValue({ type: 'success', params: { code: 'auth-code' } });
    mockExchangeCodeAsync.mockResolvedValue({ idToken: 'id-token-from-exchange' });

    await loadService().linkWithGoogle();

    expect(mockExchangeCodeAsync).toHaveBeenCalledWith(
      {
        clientId: ANDROID_CLIENT_ID,
        code: 'auth-code',
        redirectUri: mockRequest.redirectUri,
        extraParams: { code_verifier: mockRequest.codeVerifier },
      },
      { tokenEndpoint: 'https://oauth2.googleapis.com/token' },
    );
    expect(mockCredential).toHaveBeenCalledWith('id-token-from-exchange');
    expect(mockLinkWithCredential).toHaveBeenCalledWith(mockAuth.currentUser, {
      idToken: 'id-token-from-exchange',
    });
  });

  it('結果に ID トークンが直接含まれる場合はコード交換しない', async () => {
    mockPromptAsync.mockResolvedValue({ type: 'success', params: { id_token: 'direct-id-token' } });

    await loadService().linkWithGoogle();

    expect(mockExchangeCodeAsync).not.toHaveBeenCalled();
    expect(mockCredential).toHaveBeenCalledWith('direct-id-token');
  });

  it('コード交換で ID トークンが得られなければエラーにする', async () => {
    mockPromptAsync.mockResolvedValue({ type: 'success', params: { code: 'auth-code' } });
    mockExchangeCodeAsync.mockResolvedValue({ accessToken: 'only-access-token' });

    await expect(loadService().linkWithGoogle()).rejects.toThrow(
      'Google から ID トークンを取得できませんでした',
    );
    expect(mockLinkWithCredential).not.toHaveBeenCalled();
  });

  it('サインインがキャンセルされたらエラーにする', async () => {
    mockPromptAsync.mockResolvedValue({ type: 'cancel' });

    await expect(loadService().linkWithGoogle()).rejects.toThrow(
      'Google sign-in cancelled or failed',
    );
    expect(mockExchangeCodeAsync).not.toHaveBeenCalled();
  });

  it('クライアントIDが未設定ならサインイン画面を開かずにエラーにする', async () => {
    delete process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

    await expect(loadService().linkWithGoogle()).rejects.toThrow('Google OAuth が未設定です');
    expect(mockPromptAsync).not.toHaveBeenCalled();
  });
});
