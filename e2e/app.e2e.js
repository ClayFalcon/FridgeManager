describe('StorageScreen', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    try {
      await element(by.text('OK')).tap();
    } catch (_) {}
    await device.reloadReactNative();
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
    await expect(element(by.text('牛乳'))).not.toBeVisible();
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
});
