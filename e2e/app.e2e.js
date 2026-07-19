// Firebase Auth/Firestoreの長ポーリング接続をDetoxの同期監視から除外するURLリスト。
// これらは常時接続のため、除外しないとDetoxが「アプリが非アイドル」と誤判定し
// waitFor系のアサーションが永遠にタイムアウトする。
// setURLBlacklistはアプリ起動後に呼ぶ必要があり、launchApp({ delete: true })で
// リセットされるためbeforeEachでも再設定する。
const FIREBASE_URL_BLACKLIST = [
  '.*firebaseauth\\.googleapis\\.com.*',
  '.*firestore\\.googleapis\\.com.*',
  '.*identitytoolkit\\.googleapis\\.com.*',
  '.*firebase\\.googleapis\\.com.*',
  '.*securetoken\\.googleapis\\.com.*',
];

describe('StorageScreen', () => {
  beforeAll(async () => {
    await device.launchApp();
    await device.setURLBlacklist(FIREBASE_URL_BLACKLIST);
  });

  beforeEach(async () => {
    // アプリデータ（SQLite含む）をリセットして再起動し初期データを再シード
    // delete: true は adb shell pm clear でユーザーデータを全消去してから起動
    await device.launchApp({ delete: true });
    // アプリ再起動後にFirebase URLブラックリストを再設定（再起動でリセットされるため）
    await device.setURLBlacklist(FIREBASE_URL_BLACKLIST);
    // ローディング完了（btn-add-foodが表示される）まで待機
    await waitFor(element(by.id('btn-add-food'))).toBeVisible().withTimeout(10000);
  });

  // ── 基本表示 ──────────────────────────────────────────
  it('食品保管画面が表示される', async () => {
    await expect(element(by.id('storage-screen'))).toBeVisible();
    await expect(element(by.id('storage-title'))).toBeVisible();
    await expect(element(by.text('食品保管'))).toBeVisible();
  });

  it('保管場所タブが4つ表示される', async () => {
    await expect(element(by.id('tab-fridge'))).toBeVisible();
    await expect(element(by.id('tab-vegetable'))).toBeVisible();
    await expect(element(by.id('tab-freezer'))).toBeVisible();
    await expect(element(by.id('tab-pantry'))).toBeVisible();
  });

  it('冷蔵庫タブに初期食品が表示される', async () => {
    await expect(element(by.text('牛乳'))).toBeVisible();
    // 「卵」はタグにも同名があるため testID で確認
    await expect(element(by.id('food-item-2'))).toBeVisible();
  });

  // ── タブ切り替え ──────────────────────────────────────
  it('野菜室タブに切り替えると対応する食品が表示される', async () => {
    await element(by.id('tab-vegetable')).tap();
    await expect(element(by.text('レタス'))).toBeVisible();
    await expect(element(by.text('トマト'))).toBeVisible();
  });

  it('冷凍庫タブに切り替えると対応する食品が表示される', async () => {
    await element(by.id('tab-freezer')).tap();
    await expect(element(by.text('冷凍餃子'))).toBeVisible();
  });

  it('パントリータブに切り替えると対応する食品が表示される', async () => {
    await element(by.id('tab-pantry')).tap();
    await expect(element(by.text('米'))).toBeVisible();
  });

  // ── 在庫ステータス変更 ────────────────────────────────
  it('在庫ステータスを変更できる', async () => {
    // 牛乳(id=1)のステータスを「全くない」に変更
    await element(by.id('stock-btn-1-0')).tap();
    await expect(element(by.id('stock-btn-1-0'))).toBeVisible();
  });

  // ── 食品追加 ──────────────────────────────────────────
  it('食品を追加できる', async () => {
    await element(by.id('btn-add-food')).tap();
    await expect(element(by.id('add-food-sheet'))).toBeVisible();
    // Android CIエミュレーターのIMEは日本語キーイベントを変換できないため ASCII 文字を使用
    await element(by.id('add-food-name-input')).typeText('TestFood');
    await element(by.id('add-food-submit')).tap();
    // 追加アイテムはリスト末尾に追加されるためスクロールしながら確認
    await waitFor(element(by.text('TestFood')))
      .toBeVisible()
      .whileElement(by.id('food-list'))
      .scroll(300, 'down');
  });

  it('名前が空のまま追加ボタンを押しても追加されない', async () => {
    await element(by.id('btn-add-food')).tap();
    await expect(element(by.id('add-food-sheet'))).toBeVisible();
    await element(by.id('add-food-submit')).tap();
    await expect(element(by.id('add-food-sheet'))).toBeVisible();
  });

  it('追加モーダルをキャンセルできる', async () => {
    await element(by.id('btn-add-food')).tap();
    await expect(element(by.id('add-food-sheet'))).toBeVisible();
    await element(by.id('add-food-cancel')).tap();
    await expect(element(by.id('storage-screen'))).toBeVisible();
  });

  // ── 削除 ──────────────────────────────────────────────
  it('削除モードで削除ボタンが表示され、食品を削除できる', async () => {
    await element(by.id('btn-delete-mode')).tap();
    await expect(element(by.id('delete-btn-1'))).toBeVisible();
    await element(by.id('delete-btn-1')).tap();
    // 確認ダイアログを承認
    await element(by.text('削除する')).tap();
    await expect(element(by.text('牛乳'))).not.toBeVisible();
  });

  // ── 編集 ──────────────────────────────────────────────
  it('食品を編集できる', async () => {
    await element(by.id('edit-btn-1')).tap();
    await expect(element(by.id('edit-food-sheet'))).toBeVisible();
    await element(by.id('edit-food-name-input')).clearText();
    await element(by.id('edit-food-name-input')).typeText('MilkEdited');
    // キーボード表示でボタンが画面外に押し出されるためスクロールして表示
    await waitFor(element(by.id('edit-food-submit')))
      .toBeVisible()
      .whileElement(by.id('edit-food-sheet'))
      .scroll(300, 'down');
    await element(by.id('edit-food-submit')).tap();
    await expect(element(by.text('MilkEdited'))).toBeVisible();
  });

  it('編集モーダルをキャンセルできる', async () => {
    await element(by.id('edit-btn-1')).tap();
    await expect(element(by.id('edit-food-sheet'))).toBeVisible();
    await element(by.id('edit-food-cancel')).tap();
    await expect(element(by.id('storage-screen'))).toBeVisible();
  });

  // ── 削除確認ダイアログ ────────────────────────────────
  it('削除確認ダイアログが表示され、削除できる', async () => {
    await element(by.id('btn-delete-mode')).tap();
    await element(by.id('delete-btn-1')).tap();
    // ネイティブ確認ダイアログの「削除する」をタップ
    await element(by.text('削除する')).tap();
    await expect(element(by.text('牛乳'))).not.toBeVisible();
  });

  it('削除確認ダイアログをキャンセルできる', async () => {
    await element(by.id('btn-delete-mode')).tap();
    await element(by.id('delete-btn-1')).tap();
    await element(by.text('キャンセル')).tap();
    // キャンセル後は牛乳が残っている
    await expect(element(by.text('牛乳'))).toBeVisible();
  });

  // ── 賞味期限警告 ──────────────────────────────────────
  it('期限切れ食品に警告バッジが表示される', async () => {
    // 豆腐(id=4)は expiryDate=2000-01-01 で常に期限切れ（4番目のアイテムのためスクロールして確認）
    await waitFor(element(by.id('expiry-badge-4')))
      .toBeVisible()
      .whileElement(by.id('food-list'))
      .scroll(300, 'down');
  });

  it('期限内食品には警告バッジが表示されない', async () => {
    // 卵(id=2)は expiryDate=2099-12-31 で常に期限内
    await expect(element(by.id('expiry-badge-2'))).not.toBeVisible();
  });

  it('賞味期限未設定の食品には警告バッジが表示されない', async () => {
    // ハム(id=3)は expiryDate 未設定
    await expect(element(by.id('expiry-badge-3'))).not.toBeVisible();
  });

  // ── 表示切替 ──────────────────────────────────────────
  it('一括簡易表示に切り替えられる', async () => {
    await expect(element(by.id('btn-bulk-view'))).toBeVisible();
    await element(by.id('btn-bulk-view')).tap();
    await expect(element(by.text('一括: 詳細表示'))).toBeVisible();
  });

  it('個別の表示切替ができる', async () => {
    await expect(element(by.id('view-toggle-1'))).toBeVisible();
    await element(by.id('view-toggle-1')).tap();
  });

  // ── 賞味期限順表示（ローカルSQLiteのみで完結するため自動化対象） ──
  it('賞味期限順表示に切り替えると保管場所を横断して表示される', async () => {
    await element(by.id('btn-expiry-sort-view')).tap();
    // 豆腐（id=4, expiryDate=2000-01-01）が全食品中もっとも賞味期限が早い
    await expect(element(by.text('豆腐'))).toBeVisible();
    // 通常は冷蔵庫タブでは表示されない野菜室の食品も表示される
    await waitFor(element(by.text('レタス')))
      .toBeVisible()
      .whileElement(by.id('food-list'))
      .scroll(300, 'down');
  });

  it('保管場所タブをタップすると賞味期限順表示から通常表示に戻る', async () => {
    await element(by.id('btn-expiry-sort-view')).tap();
    await expect(element(by.text('豆腐'))).toBeVisible();
    await element(by.id('tab-fridge')).tap();
    // 通常表示に戻ると冷蔵庫タブの食品のみ表示される
    await expect(element(by.text('牛乳'))).toBeVisible();
  });

  // ── 設定画面 ──────────────────────────────────────────
  // NOTE: 設定画面遷移テストは自動化から除外（手動テスト手順書: e2e/manual/settings-screen.md）
  // 原因: Firebase Auth の onAuthStateChanged が登録する内部 setTimeout が
  //       Detox の ReactNativeTimersIdlingResource をブロックし waitFor がタイムアウトする。
  //       RN 0.79 New Architecture + Detox + Firebase Auth の既知の非互換問題。
});
