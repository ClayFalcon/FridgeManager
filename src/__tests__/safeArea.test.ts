import * as fs from 'fs';
import * as path from 'path';

// react-native 標準の SafeAreaView は iOS でしか余白を取らない。Android（edge-to-edge 表示）では
// 画面上部のボタンがステータスバーの下に潜り込み、タップできなくなる。
// 画面は react-native-safe-area-context の SafeAreaView を使い、上端の余白を必ず取ること。

const SCREENS_DIR = path.join(__dirname, '..', 'screens');
const screens = fs
  .readdirSync(SCREENS_DIR)
  .filter((f) => f.endsWith('.tsx'))
  .map((f) => ({ name: f, source: fs.readFileSync(path.join(SCREENS_DIR, f), 'utf8') }))
  .filter(({ source }) => source.includes('<SafeAreaView'));

describe('画面のセーフエリア', () => {
  it('SafeAreaView を使う画面がある', () => {
    expect(screens.map((s) => s.name)).toEqual(
      expect.arrayContaining(['StorageScreen.tsx', 'RecipeScreen.tsx', 'SettingsScreen.tsx']),
    );
  });

  it.each(screens.map((s) => [s.name, s.source]))(
    '%s は react-native-safe-area-context の SafeAreaView を使い、上端の余白を取る',
    (_name, source) => {
      const rnImport = source.match(/import\s*\{([^}]*)\}\s*from\s*'react-native';/)?.[1] ?? '';
      expect(rnImport).not.toMatch(/\bSafeAreaView\b/);
      expect(source).toMatch(
        /import\s*\{[^}]*\bSafeAreaView\b[^}]*\}\s*from\s*'react-native-safe-area-context';/,
      );
      const edges = [...source.matchAll(/<SafeAreaView[^>]*edges=\{\[([^\]]*)\]\}/g)];
      const openings = source.match(/<SafeAreaView\b/g) ?? [];
      expect(edges).toHaveLength(openings.length);
      edges.forEach((m) => expect(m[1]).toContain("'top'"));
    },
  );
});
