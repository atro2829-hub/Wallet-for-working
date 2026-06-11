import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBY9UTcryFEoq8VA1zD7OVnku-fjLxw-p4',
  authDomain: 'southern-portfolio.firebaseapp.com',
  databaseURL: 'https://southern-portfolio-default-rtdb.firebaseio.com',
  projectId: 'southern-portfolio',
  storageBucket: 'southern-portfolio.firebasestorage.app',
  messagingSenderId: '501045825605',
  appId: '1:501045825605:android:a0b11c5db57c9831d3932c',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);
export default app;
