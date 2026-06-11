import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { ref, set, get, update } from 'firebase/database';
import { auth, database } from '../config/firebase';
import { User, UserRole, KYCStatus, Gender } from '../types';
import { generateUserId, validateYemenPhone, formatPhone } from '../utils/helpers';
import { ADMIN_EMAIL, USER_ID_PREFIX } from '../utils/constants';
import { registerForPushNotificationsAsync } from '../utils/notifications';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    gender: Gender;
    nationalId: string;
    signature: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  recoverPassword: (email: string, nationalId: string) => Promise<void>;
  fetchUserProfile: (uid: string) => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  updateFCMToken: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const credential = await signInWithEmailAndPassword(auth, email, password);
          await get().fetchUserProfile(credential.user.uid);
          get().updateFCMToken();
          set({ isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          let message = 'حدث خطأ في تسجيل الدخول';
          if (error.code === 'auth/user-not-found') message = 'المستخدم غير موجود';
          else if (error.code === 'auth/wrong-password') message = 'كلمة المرور غير صحيحة';
          else if (error.code === 'auth/invalid-email') message = 'البريد الإلكتروني غير صالح';
          else if (error.code === 'auth/too-many-requests') message = 'محاولات كثيرة، حاول لاحقاً';
          set({ error: message, isLoading: false });
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          if (!validateYemenPhone(data.phone)) {
            throw new Error('رقم الهاتف غير صالح');
          }

          const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
          const uid = credential.user.uid;

          let userId = generateUserId();
          const userIdSnapshot = await get(ref(database, `users`));
          const existingUsers = userIdSnapshot.val() || {};
          const existingIds = Object.values(existingUsers).map((u: any) => u.userId);
          while (existingIds.includes(userId)) {
            userId = generateUserId();
          }

          let role: UserRole = 'user';
          if (data.email === ADMIN_EMAIL) {
            role = 'owner';
          }

          const formattedPhone = formatPhone(data.phone);
          const newUser: User = {
            uid,
            userId,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: formattedPhone,
            gender: data.gender,
            nationalId: data.nationalId,
            role,
            kycStatus: KYCStatus.none,
            signature: data.signature,
            isBlocked: false,
            createdAt: Date.now(),
            balances: {
              YER: 0,
              SAR: 0,
              USD: 0,
            },
          };

          await set(ref(database, `users/${uid}`), newUser);

          set({ user: newUser, isAuthenticated: true, isLoading: false });
          get().updateFCMToken();
        } catch (error: any) {
          let message = 'حدث خطأ في التسجيل';
          if (error.code === 'auth/email-already-in-use') message = 'البريد الإلكتروني مستخدم بالفعل';
          else if (error.code === 'auth/weak-password') message = 'كلمة المرور ضعيفة';
          else if (error.code === 'auth/invalid-email') message = 'البريد الإلكتروني غير صالح';
          else if (error.message) message = error.message;
          set({ error: message, isLoading: false });
        }
      },

      logout: async () => {
        try {
          await signOut(auth);
          set({ user: null, isAuthenticated: false });
        } catch (error) {
          console.log('Logout error:', error);
        }
      },

      recoverPassword: async (email: string, nationalId: string) => {
        set({ isLoading: true, error: null });
        try {
          const snapshot = await get(ref(database, 'users'));
          const users = snapshot.val() || {};
          const foundUser = Object.values(users as Record<string, User>).find(
            (u) => u.email === email && u.nationalId === nationalId
          );

          if (!foundUser) {
            throw new Error('لم يتم العثور على حساب بهذه البيانات');
          }

          await sendPasswordResetEmail(auth, email);
          set({ isLoading: false });
        } catch (error: any) {
          set({ error: error.message || 'حدث خطأ', isLoading: false });
        }
      },

      fetchUserProfile: async (uid: string) => {
        try {
          const snapshot = await get(ref(database, `users/${uid}`));
          if (snapshot.exists()) {
            const userData = snapshot.val() as User;
            set({ user: userData, isAuthenticated: true });
          }
        } catch (error) {
          console.log('Fetch profile error:', error);
        }
      },

      updateUserProfile: async (data: Partial<User>) => {
        const { user } = get();
        if (!user) return;
        try {
          await update(ref(database, `users/${user.uid}`), data);
          set({ user: { ...user, ...data } });
        } catch (error) {
          console.log('Update profile error:', error);
        }
      },

      updateFCMToken: async () => {
        try {
          const token = await registerForPushNotificationsAsync();
          if (token) {
            const { user } = get();
            if (user) {
              await update(ref(database, `users/${user.uid}`), { fcmToken: token });
            }
          }
        } catch (error) {
          console.log('FCM token error:', error);
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
