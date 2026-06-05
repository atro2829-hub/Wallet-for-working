import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyC5ageYEQl2KGteXFFxuGp7IHMnFBXuHSQ",
  authDomain: "fahed-net.firebaseapp.com",
  databaseURL: "https://fahed-net-default-rtdb.firebaseio.com",
  projectId: "fahed-net",
  storageBucket: "fahed-net.firebasestorage.app",
  messagingSenderId: "483525695699",
  appId: "1:483525695699:android:623d3c31e2f637de591c26"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);
export default app;
