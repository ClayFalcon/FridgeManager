import { initializeApp } from 'firebase/app';
// getReactNativePersistence は firebase/auth の React Native ビルドにのみ存在する。
// Metro は @firebase/auth を react-native 条件で dist/rn/index.js に解決するため実行時には利用可能だが、
// TypeScript の型解決は非RNビルドを参照し型に含まれないことがあるため、名前空間import経由で実行時に取り込む。
import * as FirebaseAuth from 'firebase/auth';
import { initializeAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCYHWs-hEXr3iJbQ94-BtwuA0u193g92FQ',
  authDomain: 'fridgemanager-64c00.firebaseapp.com',
  projectId: 'fridgemanager-64c00',
  storageBucket: 'fridgemanager-64c00.firebasestorage.app',
  messagingSenderId: '426293253192',
  appId: '1:426293253192:web:aa54adf9e99e59098eb47d',
  measurementId: 'G-WTV6VT907G',
};

// React Native 用の永続化（AsyncStorage）。これによりアプリ再起動後もログイン状態が保持され、
// Google 連携ユーザーが共有中の冷蔵庫に継続してアクセスできる。
const getReactNativePersistence = (
  FirebaseAuth as unknown as {
    getReactNativePersistence: (storage: unknown) => import('firebase/auth').Persistence;
  }
).getReactNativePersistence;

export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);
