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

describe('BottomTabBar / RecipeScreen', () => {
  beforeAll(async () => {
    await device.launchApp();
    await device.setURLBlacklist(FIREBASE_URL_BLACKLIST);
  });

  beforeEach(async () => {
    await device.launchApp({ delete: true });
    await device.setURLBlacklist(FIREBASE_URL_BLACKLIST);
    await waitFor(element(by.id('btn-add-food'))).toBeVisible().withTimeout(10000);
  });

  // ── タブバー ──────────────────────────────────────────
  it('下部タブバーが表示される', async () => {
    await expect(element(by.id('bottom-tab-bar'))).toBeVisible();
    await expect(element(by.id('bottom-tab-storage'))).toBeVisible();
    await expect(element(by.id('bottom-tab-recipes'))).toBeVisible();
  });

  it('レシピタブに切り替えられ、食品保管に戻れる', async () => {
    await element(by.id('bottom-tab-recipes')).tap();
    await expect(element(by.id('recipe-screen'))).toBeVisible();
    await element(by.id('bottom-tab-storage')).tap();
    await expect(element(by.id('storage-screen'))).toBeVisible();
  });

  // ── 初期レシピとバッジ ────────────────────────────────
  it('初期レシピ3件と在庫照合バッジが表示される', async () => {
    await element(by.id('bottom-tab-recipes')).tap();
    // トマトパスタ: トマト(在庫2)・パスタ(在庫1) → 作れる
    await expect(element(by.text('トマトパスタ'))).toBeVisible();
    await expect(element(by.id('recipe-badge-1'))).toHaveDescendant(by.text('作れる'));
    // 親子丼: 鶏もも肉(在庫0)・卵(在庫0)・米(在庫2) → 不足2品
    await expect(element(by.id('recipe-badge-2'))).toHaveDescendant(by.text('不足2品'));
    // ハムサラダ: レタス(在庫1)・ハム(在庫1)・きゅうり(在庫0) → 不足1品
    await expect(element(by.id('recipe-badge-3'))).toHaveDescendant(by.text('不足1品'));
  });

  it('在庫を変えるとバッジが更新される', async () => {
    // きゅうり(id=8, 野菜室)の在庫を「買ったばかり」に変更
    await element(by.id('tab-vegetable')).tap();
    await element(by.id('stock-btn-8-2')).tap();
    // レシピタブでハムサラダが「作れる」に変わる
    await element(by.id('bottom-tab-recipes')).tap();
    await expect(element(by.id('recipe-badge-3'))).toHaveDescendant(by.text('作れる'));
  });

  // ── レシピCRUD ────────────────────────────────────────
  it('レシピを追加できる', async () => {
    await element(by.id('bottom-tab-recipes')).tap();
    await element(by.id('btn-add-recipe')).tap();
    await expect(element(by.id('recipe-form-sheet'))).toBeVisible();
    // Android CIエミュレーターのIMEは日本語変換不可のためASCII文字を使用
    await element(by.id('recipe-form-name-input')).typeText('TestRecipe');
    await element(by.id('recipe-form-ingredient-name-0')).typeText('TestIng');
    // キーボードでボタンが隠れる場合に備えてスクロール
    await waitFor(element(by.id('recipe-form-submit')))
      .toBeVisible()
      .whileElement(by.id('recipe-form-sheet'))
      .scroll(200, 'down');
    await element(by.id('recipe-form-submit')).tap();
    await waitFor(element(by.text('TestRecipe')))
      .toBeVisible()
      .whileElement(by.id('recipe-list'))
      .scroll(300, 'down');
  });

  it('レシピ名が空のままでは追加できない', async () => {
    await element(by.id('bottom-tab-recipes')).tap();
    await element(by.id('btn-add-recipe')).tap();
    await expect(element(by.id('recipe-form-sheet'))).toBeVisible();
    await element(by.id('recipe-form-ingredient-name-0')).typeText('OnlyIng');
    await element(by.id('recipe-form-submit')).tap();
    // 名前が空なのでモーダルは閉じない
    await expect(element(by.id('recipe-form-sheet'))).toBeVisible();
  });

  it('レシピを編集できる', async () => {
    await element(by.id('bottom-tab-recipes')).tap();
    await element(by.id('recipe-edit-btn-1')).tap();
    await expect(element(by.id('recipe-form-sheet'))).toBeVisible();
    await element(by.id('recipe-form-name-input')).clearText();
    await element(by.id('recipe-form-name-input')).typeText('RecipeEdited');
    await waitFor(element(by.id('recipe-form-submit')))
      .toBeVisible()
      .whileElement(by.id('recipe-form-sheet'))
      .scroll(200, 'down');
    await element(by.id('recipe-form-submit')).tap();
    await expect(element(by.text('RecipeEdited'))).toBeVisible();
  });

  it('レシピを削除できる（確認ダイアログ）', async () => {
    await element(by.id('bottom-tab-recipes')).tap();
    await element(by.id('btn-recipe-delete-mode')).tap();
    await element(by.id('recipe-delete-btn-1')).tap();
    await element(by.text('削除する')).tap();
    await expect(element(by.text('トマトパスタ'))).not.toBeVisible();
  });

  it('レシピ削除の確認ダイアログをキャンセルできる', async () => {
    await element(by.id('bottom-tab-recipes')).tap();
    await element(by.id('btn-recipe-delete-mode')).tap();
    await element(by.id('recipe-delete-btn-1')).tap();
    await element(by.text('キャンセル')).tap();
    await expect(element(by.text('トマトパスタ'))).toBeVisible();
  });

  // ── レシピ詳細 ────────────────────────────────────────
  it('レシピ詳細で材料ごとの在庫状況が見える', async () => {
    await element(by.id('bottom-tab-recipes')).tap();
    // 親子丼(id=2)をタップ → 材料3件の在庫状況
    await element(by.id('recipe-item-2')).tap();
    await expect(element(by.id('recipe-detail-sheet'))).toBeVisible();
    await expect(element(by.id('ingredient-status-0'))).toBeVisible();
    await expect(element(by.id('ingredient-status-1'))).toBeVisible();
    await expect(element(by.id('ingredient-status-2'))).toBeVisible();
    await element(by.id('recipe-detail-close')).tap();
    await expect(element(by.id('recipe-screen'))).toBeVisible();
  });
});

describe('ShoppingList', () => {
  beforeAll(async () => {
    await device.launchApp();
    await device.setURLBlacklist(FIREBASE_URL_BLACKLIST);
  });

  beforeEach(async () => {
    await device.launchApp({ delete: true });
    await device.setURLBlacklist(FIREBASE_URL_BLACKLIST);
    await waitFor(element(by.id('btn-add-food'))).toBeVisible().withTimeout(10000);
    await element(by.id('bottom-tab-recipes')).tap();
  });

  it('不足分を買い物リストに追加できる', async () => {
    // 親子丼(id=2)の不足材料（鶏もも肉・卵）を追加 → 買い物リストへ自動遷移
    await element(by.id('recipe-item-2')).tap();
    await element(by.id('btn-add-missing-to-shopping')).tap();
    await expect(element(by.id('shopping-list'))).toBeVisible();
    await expect(element(by.text('鶏もも肉'))).toBeVisible();
    await expect(element(by.text('卵'))).toBeVisible();
  });

  it('手動で品目を追加できる', async () => {
    await element(by.id('segment-shopping')).tap();
    await element(by.id('shopping-add-input')).typeText('Bread');
    await element(by.id('btn-shopping-add')).tap();
    await expect(element(by.text('Bread'))).toBeVisible();
  });

  it('チェックを付けてチェック済みを一括削除できる', async () => {
    await element(by.id('segment-shopping')).tap();
    await element(by.id('shopping-add-input')).typeText('AAA');
    await element(by.id('btn-shopping-add')).tap();
    await element(by.id('shopping-add-input')).typeText('BBB');
    await element(by.id('btn-shopping-add')).tap();
    // 品名タップでチェックが付く
    await element(by.text('AAA')).tap();
    await element(by.id('btn-clear-checked')).tap();
    await expect(element(by.text('AAA'))).not.toBeVisible();
    await expect(element(by.text('BBB'))).toBeVisible();
  });

  it('品目を個別削除できる', async () => {
    await element(by.id('segment-shopping')).tap();
    await element(by.id('shopping-add-input')).typeText('CCC');
    await element(by.id('btn-shopping-add')).tap();
    await expect(element(by.text('CCC'))).toBeVisible();
    // 品目が1件のみなのでゴミ箱アイコンは一意
    await element(by.text('🗑')).tap();
    await expect(element(by.text('CCC'))).not.toBeVisible();
  });
});
