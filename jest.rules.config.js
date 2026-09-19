// Firestore セキュリティルールのテスト用設定（npm run test:rules でエミュレータ上で実行する）
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/firestore-rules-tests/**/*.test.ts'],
  testTimeout: 20000,
};
