import { create } from 'zustand';
import { ref, set, get, update, push, remove, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import {
  Banner,
  InvestmentPlan,
  UserInvestment,
  GiftCode,
  CryptoWallet,
  ServiceCategory,
  ServiceProvider,
  ServiceProduct,
  AppSettings,
  User,
} from '../types';
import { DEFAULT_APP_SETTINGS } from '../utils/constants';
import { generateGiftCode } from '../utils/helpers';

interface AppState {
  settings: AppSettings;
  banners: Banner[];
  investmentPlans: InvestmentPlan[];
  userInvestments: UserInvestment[];
  giftCodes: GiftCode[];
  cryptoWallets: CryptoWallet[];
  serviceCategories: ServiceCategory[];
  serviceProviders: ServiceProvider[];
  serviceProducts: ServiceProduct[];
  allUsers: User[];
  isLoading: boolean;
  error: string | null;

  // Settings
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;

  // Banners
  fetchBanners: () => Promise<void>;
  listenBanners: () => () => void;
  addBanner: (banner: Omit<Banner, 'id'>) => Promise<void>;
  updateBanner: (id: string, data: Partial<Banner>) => Promise<void>;
  deleteBanner: (id: string) => Promise<void>;

  // Investment Plans
  fetchInvestmentPlans: () => Promise<void>;
  addInvestmentPlan: (plan: Omit<InvestmentPlan, 'id'>) => Promise<void>;
  updateInvestmentPlan: (id: string, data: Partial<InvestmentPlan>) => Promise<void>;
  deleteInvestmentPlan: (id: string) => Promise<void>;
  investInPlan: (userId: string, planId: string, amount: number) => Promise<void>;
  fetchUserInvestments: (userId: string) => Promise<void>;

  // Gift Codes
  fetchGiftCodes: () => Promise<void>;
  createGiftCode: (data: { amount: number; currency: any; message?: string; createdBy: string; expiresAt?: number }) => Promise<string>;
  addBulkGiftCodes: (data: { amount: number; currency: any; count: number; createdBy: string }) => Promise<void>;
  deleteGiftCode: (id: string) => Promise<void>;

  // Crypto Wallets
  fetchCryptoWallets: () => Promise<void>;
  addCryptoWallet: (wallet: Omit<CryptoWallet, 'id'>) => Promise<void>;
  updateCryptoWallet: (id: string, data: Partial<CryptoWallet>) => Promise<void>;
  deleteCryptoWallet: (id: string) => Promise<void>;

  // Services
  fetchServiceCategories: () => Promise<void>;
  fetchServiceProviders: (categoryId: string) => Promise<void>;
  fetchServiceProducts: (providerId: string) => Promise<void>;
  addServiceProvider: (provider: Omit<ServiceProvider, 'id'>) => Promise<void>;
  updateServiceProvider: (id: string, data: Partial<ServiceProvider>) => Promise<void>;
  deleteServiceProvider: (id: string) => Promise<void>;
  addServiceProduct: (product: Omit<ServiceProduct, 'id'>) => Promise<void>;
  updateServiceProduct: (id: string, data: Partial<ServiceProduct>) => Promise<void>;
  deleteServiceProduct: (id: string) => Promise<void>;

  // Users (Admin)
  fetchAllUsers: () => Promise<void>;
  blockUser: (uid: string) => Promise<void>;
  unblockUser: (uid: string) => Promise<void>;
  verifyKYC: (uid: string) => Promise<void>;
  rejectKYC: (uid: string) => Promise<void>;
  setAdminRole: (uid: string) => Promise<void>;
  removeAdminRole: (uid: string) => Promise<void>;

  clearError: () => void;
}

export const useAppStore = create<AppState>()((set, get) => ({
  settings: DEFAULT_APP_SETTINGS,
  banners: [],
  investmentPlans: [],
  userInvestments: [],
  giftCodes: [],
  cryptoWallets: [],
  serviceCategories: [],
  serviceProviders: [],
  serviceProducts: [],
  allUsers: [],
  isLoading: false,
  error: null,

  // Settings
  fetchSettings: async () => {
    try {
      const snapshot = await get(ref(database, 'adminSettings'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        set({ settings: { ...DEFAULT_APP_SETTINGS, ...data } });
      }
    } catch (error: any) {
      console.log('Fetch settings error:', error);
    }
  },

  updateSettings: async (settings) => {
    try {
      const { settings: currentSettings } = get();
      const newSettings = { ...currentSettings, ...settings };
      await set(ref(database, 'adminSettings'), newSettings);
      set({ settings: newSettings });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Banners
  fetchBanners: async () => {
    try {
      const snapshot = await get(ref(database, 'adminSettings/banners'));
      if (snapshot.exists()) {
        const banners = Object.values(snapshot.val() as Record<string, Banner>);
        set({ banners: banners.filter(b => b.isActive).sort((a, b) => a.order - b.order) });
      }
    } catch (error: any) {
      console.log('Fetch banners error:', error);
    }
  },

  listenBanners: () => {
    const bannersRef = ref(database, 'adminSettings/banners');
    const unsubscribe = onValue(bannersRef, (snapshot) => {
      if (snapshot.exists()) {
        const banners = Object.values(snapshot.val() as Record<string, Banner>);
        set({ banners: banners.filter(b => b.isActive).sort((a, b) => a.order - b.order) });
      } else {
        set({ banners: [] });
      }
    });
    return unsubscribe;
  },

  addBanner: async (banner) => {
    try {
      const bannerRef = push(ref(database, 'adminSettings/banners'));
      await set(bannerRef, { ...banner, id: bannerRef.key });
      get().fetchBanners();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateBanner: async (id, data) => {
    try {
      await update(ref(database, `adminSettings/banners/${id}`), data);
      get().fetchBanners();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteBanner: async (id) => {
    try {
      await remove(ref(database, `adminSettings/banners/${id}`));
      get().fetchBanners();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Investment Plans
  fetchInvestmentPlans: async () => {
    try {
      const snapshot = await get(ref(database, 'investmentPlans'));
      if (snapshot.exists()) {
        const plans = Object.values(snapshot.val() as Record<string, InvestmentPlan>);
        set({ investmentPlans: plans.filter(p => p.isActive) });
      }
    } catch (error: any) {
      console.log('Fetch investment plans error:', error);
    }
  },

  addInvestmentPlan: async (plan) => {
    try {
      const planRef = push(ref(database, 'investmentPlans'));
      await set(planRef, { ...plan, id: planRef.key });
      get().fetchInvestmentPlans();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateInvestmentPlan: async (id, data) => {
    try {
      await update(ref(database, `investmentPlans/${id}`), data);
      get().fetchInvestmentPlans();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteInvestmentPlan: async (id) => {
    try {
      await remove(ref(database, `investmentPlans/${id}`));
      get().fetchInvestmentPlans();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  investInPlan: async (userId, planId, amount) => {
    set({ isLoading: true, error: null });
    try {
      const planSnapshot = await get(ref(database, `investmentPlans/${planId}`));
      const plan = planSnapshot.val() as InvestmentPlan;
      if (!plan) throw new Error('خطة الاستثمار غير موجودة');
      if (amount < plan.minAmount || amount > plan.maxAmount) throw new Error('المبلغ خارج النطاق المسموح');

      const userSnapshot = await get(ref(database, `users/${userId}`));
      const user = userSnapshot.val();
      if (!user) throw new Error('المستخدم غير موجود');
      if (user.balances[plan.currency] < amount) throw new Error('رصيد غير كافي');

      await update(ref(database, `users/${userId}/balances`), {
        [plan.currency]: user.balances[plan.currency] - amount,
      });

      const investRef = push(ref(database, 'userInvestments'));
      const investment: UserInvestment = {
        id: investRef.key!,
        userId,
        planId,
        amount,
        currency: plan.currency,
        returnRate: plan.returnRate,
        startDate: Date.now(),
        endDate: Date.now() + plan.durationDays * 86400000,
        status: 'active',
        earnedSoFar: 0,
        lastCalculationDate: Date.now(),
      };
      await set(investRef, investment);

      const txRef = push(ref(database, 'transactions'));
      await set(txRef, {
        id: txRef.key!,
        userId,
        type: 'investment',
        amount,
        currency: plan.currency,
        description: `استثمار في خطة ${plan.nameAr}`,
        status: 'completed',
        createdAt: Date.now(),
        metadata: { planId, investmentId: investRef.key },
      });

      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchUserInvestments: async (userId) => {
    try {
      const snapshot = await get(ref(database, 'userInvestments'));
      if (snapshot.exists()) {
        const allInvestments = Object.values(snapshot.val() as Record<string, UserInvestment>);
        const userInvestments = allInvestments.filter((inv) => inv.userId === userId);
        set({ userInvestments });
      }
    } catch (error: any) {
      console.log('Fetch user investments error:', error);
    }
  },

  // Gift Codes
  fetchGiftCodes: async () => {
    try {
      const snapshot = await get(ref(database, 'giftCodes'));
      if (snapshot.exists()) {
        const codes = Object.values(snapshot.val() as Record<string, GiftCode>);
        set({ giftCodes: codes.sort((a, b) => b.createdAt - a.createdAt) });
      }
    } catch (error: any) {
      console.log('Fetch gift codes error:', error);
    }
  },

  createGiftCode: async (data) => {
    try {
      const code = generateGiftCode();
      const giftRef = push(ref(database, 'giftCodes'));
      const giftCode: GiftCode = {
        id: giftRef.key!,
        code,
        amount: data.amount,
        currency: data.currency,
        createdBy: data.createdBy,
        isUsed: false,
        message: data.message,
        createdAt: Date.now(),
        expiresAt: data.expiresAt,
      };
      await set(giftRef, giftCode);
      get().fetchGiftCodes();
      return code;
    } catch (error: any) {
      set({ error: error.message });
      return '';
    }
  },

  addBulkGiftCodes: async (data) => {
    try {
      for (let i = 0; i < data.count; i++) {
        const code = generateGiftCode();
        const giftRef = push(ref(database, 'giftCodes'));
        await set(giftRef, {
          id: giftRef.key!,
          code,
          amount: data.amount,
          currency: data.currency,
          createdBy: data.createdBy,
          isUsed: false,
          createdAt: Date.now(),
        });
      }
      get().fetchGiftCodes();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteGiftCode: async (id) => {
    try {
      await remove(ref(database, `giftCodes/${id}`));
      get().fetchGiftCodes();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Crypto Wallets
  fetchCryptoWallets: async () => {
    try {
      const snapshot = await get(ref(database, 'cryptoWallets'));
      if (snapshot.exists()) {
        const wallets = Object.values(snapshot.val() as Record<string, CryptoWallet>);
        set({ cryptoWallets: wallets.filter(w => w.isActive) });
      }
    } catch (error: any) {
      console.log('Fetch crypto wallets error:', error);
    }
  },

  addCryptoWallet: async (wallet) => {
    try {
      const walletRef = push(ref(database, 'cryptoWallets'));
      await set(walletRef, { ...wallet, id: walletRef.key });
      get().fetchCryptoWallets();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateCryptoWallet: async (id, data) => {
    try {
      await update(ref(database, `cryptoWallets/${id}`), data);
      get().fetchCryptoWallets();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteCryptoWallet: async (id) => {
    try {
      await remove(ref(database, `cryptoWallets/${id}`));
      get().fetchCryptoWallets();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Services
  fetchServiceCategories: async () => {
    try {
      const snapshot = await get(ref(database, 'serviceCategories'));
      if (snapshot.exists()) {
        const categories = Object.values(snapshot.val() as Record<string, ServiceCategory>);
        set({ serviceCategories: categories.filter(c => c.isActive).sort((a, b) => a.order - b.order) });
      }
    } catch (error: any) {
      console.log('Fetch service categories error:', error);
    }
  },

  fetchServiceProviders: async (categoryId) => {
    try {
      const snapshot = await get(ref(database, 'serviceProviders'));
      if (snapshot.exists()) {
        const allProviders = Object.values(snapshot.val() as Record<string, ServiceProvider>);
        const providers = allProviders
          .filter(p => p.categoryId === categoryId && p.isActive)
          .sort((a, b) => a.order - b.order);
        set({ serviceProviders: providers });
      }
    } catch (error: any) {
      console.log('Fetch service providers error:', error);
    }
  },

  fetchServiceProducts: async (providerId) => {
    try {
      const snapshot = await get(ref(database, 'serviceProducts'));
      if (snapshot.exists()) {
        const allProducts = Object.values(snapshot.val() as Record<string, ServiceProduct>);
        const products = allProducts
          .filter(p => p.providerId === providerId && p.isActive)
          .sort((a, b) => a.order - b.order);
        set({ serviceProducts: products });
      }
    } catch (error: any) {
      console.log('Fetch service products error:', error);
    }
  },

  addServiceProvider: async (provider) => {
    try {
      const providerRef = push(ref(database, 'serviceProviders'));
      await set(providerRef, { ...provider, id: providerRef.key });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateServiceProvider: async (id, data) => {
    try {
      await update(ref(database, `serviceProviders/${id}`), data);
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteServiceProvider: async (id) => {
    try {
      await remove(ref(database, `serviceProviders/${id}`));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  addServiceProduct: async (product) => {
    try {
      const productRef = push(ref(database, 'serviceProducts'));
      await set(productRef, { ...product, id: productRef.key });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateServiceProduct: async (id, data) => {
    try {
      await update(ref(database, `serviceProducts/${id}`), data);
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteServiceProduct: async (id) => {
    try {
      await remove(ref(database, `serviceProducts/${id}`));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Users (Admin)
  fetchAllUsers: async () => {
    try {
      const snapshot = await get(ref(database, 'users'));
      if (snapshot.exists()) {
        const users = Object.values(snapshot.val() as Record<string, User>);
        set({ allUsers: users.sort((a, b) => b.createdAt - a.createdAt) });
      }
    } catch (error: any) {
      console.log('Fetch all users error:', error);
    }
  },

  blockUser: async (uid) => {
    try {
      await update(ref(database, `users/${uid}`), { isBlocked: true });
      get().fetchAllUsers();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  unblockUser: async (uid) => {
    try {
      await update(ref(database, `users/${uid}`), { isBlocked: false });
      get().fetchAllUsers();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  verifyKYC: async (uid) => {
    try {
      await update(ref(database, `users/${uid}`), { kycStatus: 'approved' });
      get().fetchAllUsers();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  rejectKYC: async (uid) => {
    try {
      await update(ref(database, `users/${uid}`), { kycStatus: 'rejected' });
      get().fetchAllUsers();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  setAdminRole: async (uid) => {
    try {
      await update(ref(database, `users/${uid}`), { role: 'admin' });
      get().fetchAllUsers();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  removeAdminRole: async (uid) => {
    try {
      await update(ref(database, `users/${uid}`), { role: 'user' });
      get().fetchAllUsers();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  clearError: () => set({ error: null }),
}));
