import { initializeApp } from 'firebase/app';
import { initializeAuth, inMemoryPersistence } from 'firebase/auth';
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

export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, { persistence: inMemoryPersistence });
export const db = getFirestore(app);
