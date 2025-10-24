# 🧪 Detox自動テスト設定

## 📋 概要

FridgeManagerのDetox自動テスト設定とCI/CDパイプラインの詳細設定です。

## 🔧 Detox設定

### detox.config.js

```javascript
const { DetoxCircusEnvironment, SpecReporter, WorkerAssignReporter } = require('detox/runners/jest');

const config = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'e2e/config.json'
    },
    jest: {
      setupFilesAfterEnv: ['<rootDir>/e2e/init.js']
    }
  },
  apps: {
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [
        {
          host: 8081,
          device: 8081
        }
      ]
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release'
    },
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/FridgeManager.app',
      build: 'cd ios && xcodebuild -workspace FridgeManager.xcworkspace -scheme FridgeManager -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
      reversePorts: [
        {
          host: 8081,
          device: 8081
        }
      ]
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/FridgeManager.app',
      build: 'cd ios && xcodebuild -workspace FridgeManager.xcworkspace -scheme FridgeManager -configuration Release -sdk iphonesimulator -derivedDataPath ios/build'
    }
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 14'
      }
    },
    attached: {
      type: 'android.attached',
      device: {
        adbName: '.*'
      }
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_4_API_30'
      }
    }
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug'
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release'
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug'
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release'
    },
    'android.att.debug': {
      device: 'attached',
      app: 'android.debug'
    },
    'android.att.release': {
      device: 'attached',
      app: 'android.release'
    }
  }
};

module.exports = config;
```

### e2e/config.json

```json
{
  "testEnvironment": "node",
  "testRunner": "jest-circus/runner",
  "testTimeout": 120000,
  "testRegex": "\\.e2e\\.js$",
  "reporters": ["default"],
  "verbose": true,
  "bail": false,
  "maxWorkers": 1,
  "globalSetup": "detox/runners/jest/globalSetup",
  "globalTeardown": "detox/runners/jest/globalTeardown",
  "testEnvironmentOptions": {
    "eventListeners": [
      {
        "event": "test_done",
        "handler": "detox/runners/jest/eventListeners/testDone"
      },
      {
        "event": "test_start",
        "handler": "detox/runners/jest/eventListeners/testStart"
      }
    ]
  }
}
```

### e2e/init.js

```javascript
const { DetoxCircusEnvironment, SpecReporter, WorkerAssignReporter } = require('detox/runners/jest');

const config = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'e2e/config.json'
    },
    jest: {
      setupFilesAfterEnv: ['<rootDir>/e2e/init.js']
    }
  }
};

module.exports = config;
```

## 🧪 テストケース例

### e2e/auth.e2e.js

```javascript
describe('認証フロー', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('ユーザー登録が正常に動作する', async () => {
    // ユーザー登録画面に移動
    await element(by.id('signup-button')).tap();
    
    // メールアドレス入力
    await element(by.id('email-input')).typeText('test@example.com');
    
    // パスワード入力
    await element(by.id('password-input')).typeText('password123');
    
    // 登録ボタンタップ
    await element(by.id('register-button')).tap();
    
    // 成功メッセージ確認
    await expect(element(by.id('success-message'))).toBeVisible();
  });

  it('ログインが正常に動作する', async () => {
    // ログイン画面に移動
    await element(by.id('login-button')).tap();
    
    // メールアドレス入力
    await element(by.id('email-input')).typeText('test@example.com');
    
    // パスワード入力
    await element(by.id('password-input')).typeText('password123');
    
    // ログインボタンタップ
    await element(by.id('login-submit-button')).tap();
    
    // ホーム画面に遷移することを確認
    await expect(element(by.id('home-screen'))).toBeVisible();
  });
});
```

### e2e/refrigerator.e2e.js

```javascript
describe('冷蔵庫管理', () => {
  beforeAll(async () => {
    await device.launchApp();
    // ログイン状態にする
    await loginUser();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('冷蔵庫の在庫状況を更新できる', async () => {
    // 冷蔵庫画面に移動
    await element(by.id('refrigerator-tab')).tap();
    
    // 食品アイテムをタップ
    await element(by.id('food-item-milk')).tap();
    
    // 在庫状況を「ちょっとある」に変更
    await element(by.id('status-partial')).tap();
    
    // 保存ボタンタップ
    await element(by.id('save-button')).tap();
    
    // 更新が反映されることを確認
    await expect(element(by.id('food-item-milk'))).toHaveValue('ちょっとある');
  });

  it('新しい食品を追加できる', async () => {
    // 食品追加ボタンタップ
    await element(by.id('add-food-button')).tap();
    
    // 食品名入力
    await element(by.id('food-name-input')).typeText('りんご');
    
    // カテゴリ選択
    await element(by.id('category-vegetables')).tap();
    
    // 保管場所選択
    await element(by.id('storage-refrigerator')).tap();
    
    // 追加ボタンタップ
    await element(by.id('add-submit-button')).tap();
    
    // 食品が追加されることを確認
    await expect(element(by.id('food-item-apple'))).toBeVisible();
  });
});
```

## 🔄 CI/CDパイプライン設定

### .github/workflows/ci.yml

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '18'
  ANDROID_API_LEVEL: 30
  ANDROID_BUILD_TOOLS: 30.0.3

jobs:
  # ユニットテスト
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run unit tests
        run: npm run test:unit
        
      - name: Generate coverage report
        run: npm run test:coverage
        
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  # Detox Androidテスト
  detox-android:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '11'
          
      - name: Setup Android SDK
        uses: android-actions/setup-android@v2
        
      - name: Install dependencies
        run: npm ci
        
      - name: Build Android app
        run: npm run test:detox:build
        
      - name: Run Detox tests
        run: npm run test:detox:test
        env:
          DETOX_CONFIGURATION: android.emu.debug

  # Detox iOSテスト
  detox-ios:
    runs-on: macos-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build iOS app
        run: npm run test:detox:ios:build
        
      - name: Run Detox tests
        run: npm run test:detox:ios:test
        env:
          DETOX_CONFIGURATION: ios.sim.debug

  # コード品質チェック
  code-quality:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run ESLint
        run: npm run lint
        
      - name: Run TypeScript check
        run: npm run type-check
        
      - name: Check code formatting
        run: npm run format:check
```

### .github/workflows/release.yml

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

env:
  NODE_VERSION: '18'

jobs:
  # リリース前テスト
  pre-release-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run all tests
        run: npm run test:all

  # Android リリースビルド
  build-android:
    needs: pre-release-tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '11'
          
      - name: Setup Android SDK
        uses: android-actions/setup-android@v2
        
      - name: Install dependencies
        run: npm ci
        
      - name: Build Android release
        run: npm run build:android:prod
        
      - name: Upload Android APK
        uses: actions/upload-artifact@v3
        with:
          name: android-release
          path: android/app/build/outputs/apk/release/

  # iOS リリースビルド
  build-ios:
    needs: pre-release-tests
    runs-on: macos-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build iOS release
        run: npm run build:ios:prod
        
      - name: Upload iOS build
        uses: actions/upload-artifact@v3
        with:
          name: ios-release
          path: ios/build/

  # リリースノート生成
  generate-release-notes:
    needs: [build-android, build-ios]
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          fetch-depth: 0
          
      - name: Generate changelog
        run: |
          npm install -g conventional-changelog-cli
          conventional-changelog -p angular -i CHANGELOG.md -s
          
      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          body_path: CHANGELOG.md
          draft: false
          prerelease: false
```

## 📱 パッケージスクリプト設定

### package.json の scripts セクション

```json
{
  "scripts": {
    "test:detox:build": "detox build --configuration android.emu.debug",
    "test:detox:test": "detox test --configuration android.emu.debug",
    "test:detox:ios:build": "detox build --configuration ios.sim.debug",
    "test:detox:ios:test": "detox test --configuration ios.sim.debug",
    "test:detox:build:release": "detox build --configuration android.emu.release",
    "test:detox:test:release": "detox test --configuration android.emu.release",
    "test:all": "npm run test:unit && npm run test:detox:test",
    "test:coverage": "jest --coverage",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "clean": "rm -rf node_modules && npm install"
  }
}
```

## 🔧 環境変数設定

### .env.test

```bash
# テスト環境用Firebase設定
FIREBASE_API_KEY=test_api_key
FIREBASE_AUTH_DOMAIN=test_project.firebaseapp.com
FIREBASE_PROJECT_ID=test_project
FIREBASE_STORAGE_BUCKET=test_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef

# テスト用設定
DETOX_CONFIGURATION=android.emu.debug
TEST_TIMEOUT=120000
```

## 📊 テストレポート設定

### jest.config.js

```javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

---

**最終更新**: 2025年1月27日  
**バージョン**: 1.0.0  
**ステータス**: 開発中
