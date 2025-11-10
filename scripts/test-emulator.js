#!/usr/bin/env node

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const EMULATOR_NAME = 'Medium_Phone_API_36.0';
const AVD_PATH = 'C:\\Users\\hayab\\AppData\\Local\\Android\\Sdk\\emulator';
const ADB_PATH =
  'C:\\Users\\hayab\\AppData\\Local\\Android\\Sdk\\platform-tools';

async function checkEmulatorRunning() {
  try {
    const { stdout } = await execAsync(`${ADB_PATH}\\adb.exe devices`);
    const lines = stdout
      .split('\n')
      .filter((line) => line.trim() && !line.includes('List of devices'));
    return lines.length > 0;
  } catch (error) {
    return false;
  }
}

async function startEmulator() {
  console.log(`エミュレータ "${EMULATOR_NAME}" を起動しています...`);
  const { spawn } = require('child_process');

  const emulator = spawn(`${AVD_PATH}\\emulator.exe`, ['-avd', EMULATOR_NAME]);

  // エミュレータが起動するまで待機
  let bootCompleted = false;
  for (let i = 0; i < 120; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      const { stdout } = await execAsync(
        `${ADB_PATH}\\adb.exe shell getprop sys.boot_completed`
      );
      if (stdout.trim() === '1') {
        bootCompleted = true;
        console.log('✓ エミュレータが起動しました');
        break;
      }
    } catch (error) {
      // まだ起動していない
    }

    if (i % 10 === 0 && i > 0) {
      console.log(`起動待機中... (${i}秒)`);
    }
  }

  if (!bootCompleted) {
    console.log('⚠️ エミュレータの起動がタイムアウトしました');
    process.exit(1);
  }
}

async function runTests() {
  console.log('Detoxテストを実行しています...');
  const { spawn } = require('child_process');

  return new Promise((resolve, reject) => {
    const test = spawn(
      'detox',
      ['test', '--configuration', 'android.emu.debug'],
      {
        stdio: 'inherit',
        shell: true,
      }
    );

    test.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`テストが失敗しました (終了コード: ${code})`));
      }
    });
  });
}

async function main() {
  const isRunning = await checkEmulatorRunning();

  if (!isRunning) {
    await startEmulator();
  } else {
    console.log('✓ エミュレータは既に起動しています');
  }

  await runTests();
}

main().catch((error) => {
  console.error('エラー:', error);
  process.exit(1);
});
