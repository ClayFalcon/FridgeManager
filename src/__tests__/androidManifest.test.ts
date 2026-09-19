import * as fs from 'fs';
import * as path from 'path';

// android/ はコミット済み（prebuild を CI で実行しない）ため、app.json の設定が
// ネイティブ側に反映されているかをここで検証する。
// 特に Google サインイン（expo-auth-session）はサインイン後に
// `${applicationId}:/oauthredirect` でアプリへ戻るため、その scheme を受け取れないと
// ブラウザからアプリに戻れなくなる。

const ROOT = path.join(__dirname, '..', '..');
const read = (relativePath: string) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');

const appJson = JSON.parse(read('app.json')).expo;
const manifest = read('android/app/src/main/AndroidManifest.xml');
const appBuildGradle = read('android/app/build.gradle');

const mainActivity = manifest.match(
  /<activity[^>]*android:name="\.MainActivity"[^>]*>([\s\S]*?)<\/activity>/,
)?.[1];

function deepLinkSchemes(activityXml: string): string[] {
  const filters = activityXml.match(/<intent-filter[\s\S]*?<\/intent-filter>/g) ?? [];
  return filters
    .filter(
      (filter) =>
        filter.includes('android.intent.action.VIEW') &&
        filter.includes('android.intent.category.DEFAULT') &&
        filter.includes('android.intent.category.BROWSABLE'),
    )
    .flatMap((filter) =>
      [...filter.matchAll(/<data[^>]*android:scheme="([^"]+)"/g)].map((match) => match[1]),
    );
}

describe('AndroidManifest.xml', () => {
  it('MainActivity が存在する', () => {
    expect(mainActivity).toBeDefined();
  });

  it('app.json の scheme をディープリンクとして受け取れる', () => {
    expect(deepLinkSchemes(mainActivity!)).toContain(appJson.scheme);
  });

  it('Google サインインのリダイレクト先（パッケージ名の scheme）を受け取れる', () => {
    expect(deepLinkSchemes(mainActivity!)).toContain(appJson.android.package);
  });
});

describe('android/app/build.gradle', () => {
  it('applicationId と namespace が app.json の android.package と一致する', () => {
    const applicationId = appBuildGradle.match(/applicationId\s+'([^']+)'/)?.[1];
    const namespace = appBuildGradle.match(/namespace\s+'([^']+)'/)?.[1];
    expect(applicationId).toBe(appJson.android.package);
    expect(namespace).toBe(appJson.android.package);
  });
});
