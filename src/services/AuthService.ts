// linked: 今の匿名ユーザーに Google アカウントを新しくつないだ
// signedIn: その Google アカウントは既存ユーザーにつながっていたため、そのユーザーでログインし直した
//           （アプリの入れ直しや機種変更の後に共有を再開した場合）
export type GoogleLinkResult = 'linked' | 'signedIn';

export interface AuthService {
  linkWithGoogle(): Promise<GoogleLinkResult>;
}
