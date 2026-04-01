describe('FridgeManager App', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    // Dismiss any open native dialog before reloading (e.g. Alert left open by previous test)
    try {
      await element(by.text('OK')).tap();
    } catch (_) {
      // No dialog open, ignore
    }
    await device.reloadReactNative();
  });

  it('アプリが正常に起動する', async () => {
    await expect(element(by.id('app-title'))).toBeVisible();
    await expect(element(by.id('dialog-button'))).toBeVisible();
  });

  it('ボタンを押すとダイアログが表示される', async () => {
    // ボタンをタップ
    await element(by.id('dialog-button')).tap();
    
    // ダイアログが表示されることを確認
    await expect(element(by.text('メッセージ'))).toBeVisible();
    await expect(element(by.text('ボタンが押されました！'))).toBeVisible();
    await expect(element(by.text('OK'))).toBeVisible();
  });

  it('ダイアログのメッセージが正しく表示される', async () => {
    // ボタンをタップ
    await element(by.id('dialog-button')).tap();
    
    // ダイアログのタイトルとメッセージを確認
    await expect(element(by.text('メッセージ'))).toBeVisible();
    await expect(element(by.text('ボタンが押されました！'))).toBeVisible();
  });

  it('OKボタンを押すとダイアログが閉じる', async () => {
    // ボタンをタップ
    await element(by.id('dialog-button')).tap();
    
    // ダイアログが表示されることを確認
    await expect(element(by.text('メッセージ'))).toBeVisible();
    
    // OKボタンをタップ
    await element(by.text('OK')).tap();
    
    // ダイアログが閉じることを確認（ダイアログの要素が見えなくなる）
    await expect(element(by.text('メッセージ'))).not.toBeVisible();
  });

  it('アプリのタイトルが正しく表示される', async () => {
    await expect(element(by.id('app-title'))).toBeVisible();
    await expect(element(by.text('FridgeManager'))).toBeVisible();
  });

  it('ボタンのテキストが正しく表示される', async () => {
    await expect(element(by.id('dialog-button'))).toBeVisible();
    await expect(element(by.text('ダイアログを表示'))).toBeVisible();
  });
});
