// Firebase Configuration for South Dev App (Copy Center)
// Uses the SAME Firebase project as the admin app
// Dev appId is unique to this app so it can be distributed separately

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, browserLocalPersistence, indexedDBLocalPersistence } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBY9UTcryFEoq8VA1zD7OVnku-fjLxw-p4",
  authDomain: "southern-portfolio.firebaseapp.com",
  databaseURL: "https://southern-portfolio-default-rtdb.firebaseio.com",
  projectId: "southern-portfolio",
  storageBucket: "southern-portfolio.firebasestorage.app",
  messagingSenderId: "501045825605",
  // Dev-specific appId - different from admin and user app
  appId: "1:501045825605:android:161bf71e15799e25d3932d"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let auth;
try {
  if (getApps().length === 0) {
    auth = initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
    });
  } else {
    auth = getAuth(app);
  }
} catch (error) {
  auth = getAuth(app);
}

export { auth };
export const database = getDatabase(app);
export const storage = getStorage(app);
export default app;
