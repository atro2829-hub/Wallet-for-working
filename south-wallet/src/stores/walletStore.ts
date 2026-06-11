import { create } from 'zustand';
import { ref, push, set, get, update, onValue, query, orderByChild, equalTo, limitToLast } from 'firebase/database';
import { database } from '../config/firebase';
import { Transaction, Currency, Deposit, Withdrawal, Order } from '../types';
import { convertCurrency, generateGiftCode } from '../utils/helpers';

interface WalletState {
  transactions: Transaction[];
  deposits: Deposit[];
  withdrawals: Withdrawal[];
  orders: Order[];
  isLoading: boolean;
  error: string | null;

  fetchTransactions: (userId: string) => Promise<void>;
  listenTransactions: (userId: string) => () => void;
  createDeposit: (data: Omit<Deposit, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  createWithdrawal: (data: Omit<Withdrawal, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  createTransfer: (fromUserId: string, toUserId: string, amount: number, currency: Currency) => Promise<void>;
  createExchange: (userId: string, fromCurrency: Currency, toCurrency: Currency, amount: number) => Promise<void>;
  createOrder: (data: Omit<Order, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  redeemGiftCode: (userId: string, code: string) => Promise<void>;
  fetchAllDeposits: () => Promise<void>;
  fetchAllWithdrawals: () => Promise<void>;
  fetchAllOrders: () => Promise<void>;
  processDeposit: (depositId: string, status: 'approved' | 'rejected', processedBy: string) => Promise<void>;
  processWithdrawal: (withdrawalId: string, status: 'approved' | 'rejected', processedBy: string) => Promise<void>;
  processOrder: (orderId: string, status: 'approved' | 'rejected' | 'completed', processedBy: string, notes?: string) => Promise<void>;
  clearError: () => void;
}

export const useWalletStore = create<WalletState>()((set, get) => ({
  transactions: [],
  deposits: [],
  withdrawals: [],
  orders: [],
  isLoading: false,
  error: null,

  fetchTransactions: async (userId: string) => {
    set({ isLoading: true });
    try {
      const snapshot = await get(ref(database, 'transactions'));
      if (snapshot.exists()) {
        const allTx = Object.values(snapshot.val() as Record<string, Transaction>);
        const userTx = allTx
          .filter((tx) => tx.userId === userId || tx.fromUserId === userId || tx.toUserId === userId)
          .sort((a, b) => b.createdAt - a.createdAt);
        set({ transactions: userTx, isLoading: false });
      } else {
        set({ transactions: [], isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  listenTransactions: (userId: string) => {
    const txRef = ref(database, 'transactions');
    const unsubscribe = onValue(txRef, (snapshot) => {
      if (snapshot.exists()) {
        const allTx = Object.values(snapshot.val() as Record<string, Transaction>);
        const userTx = allTx
          .filter((tx) => tx.userId === userId || tx.fromUserId === userId || tx.toUserId === userId)
          .sort((a, b) => b.createdAt - a.createdAt);
        set({ transactions: userTx });
      }
    });
    return unsubscribe;
  },

  createDeposit: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const depositRef = push(ref(database, 'deposits'));
      const deposit: Deposit = {
        id: depositRef.key!,
        ...data,
        status: 'pending',
        createdAt: Date.now(),
      };
      await set(depositRef, deposit);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createWithdrawal: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const userSnapshot = await get(ref(database, `users/${data.userId}`));
      const user = userSnapshot.val();
      if (!user) throw new Error('المستخدم غير موجود');
      if (user.balances[data.currency] < data.amount) throw new Error('رصيد غير كافي');

      const withdrawalRef = push(ref(database, 'withdrawals'));
      const withdrawal: Withdrawal = {
        id: withdrawalRef.key!,
        ...data,
        status: 'pending',
        createdAt: Date.now(),
      };
      await set(withdrawalRef, withdrawal);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createTransfer: async (fromUserId, toUserId, amount, currency) => {
    set({ isLoading: true, error: null });
    try {
      const fromSnapshot = await get(ref(database, `users/${fromUserId}`));
      const fromUser = fromSnapshot.val();
      if (!fromUser) throw new Error('المستخدم المرسل غير موجود');
      if (fromUser.balances[currency] < amount) throw new Error('رصيد غير كافي');

      const toSnapshot = await get(ref(database, `users/${toUserId}`));
      const toUser = toSnapshot.val();
      if (!toUser) throw new Error('المستخدم المستلم غير موجود');

      await update(ref(database, `users/${fromUserId}/balances`), {
        [currency]: fromUser.balances[currency] - amount,
      });
      await update(ref(database, `users/${toUserId}/balances`), {
        [currency]: toUser.balances[currency] + amount,
      });

      const txRef = push(ref(database, 'transactions'));
      const transaction: Transaction = {
        id: txRef.key!,
        userId: fromUserId,
        type: 'transfer',
        amount,
        currency,
        fromUserId,
        toUserId,
        description: `تحويل ${amount} ${currency} إلى ${toUser.firstName} ${toUser.lastName}`,
        status: 'completed',
        createdAt: Date.now(),
      };
      await set(txRef, transaction);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createExchange: async (userId, fromCurrency, toCurrency, amount) => {
    set({ isLoading: true, error: null });
    try {
      const userSnapshot = await get(ref(database, `users/${userId}`));
      const user = userSnapshot.val();
      if (!user) throw new Error('المستخدم غير موجود');
      if (user.balances[fromCurrency] < amount) throw new Error('رصيد غير كافي');

      const convertedAmount = convertCurrency(amount, fromCurrency, toCurrency);
      if (convertedAmount <= 0) throw new Error('مبلغ التحويل غير صالح');

      await update(ref(database, `users/${userId}/balances`), {
        [fromCurrency]: user.balances[fromCurrency] - amount,
        [toCurrency]: user.balances[toCurrency] + convertedAmount,
      });

      const txRef = push(ref(database, 'transactions'));
      const transaction: Transaction = {
        id: txRef.key!,
        userId,
        type: 'exchange',
        amount,
        currency: fromCurrency,
        description: `صرف ${amount} ${fromCurrency} إلى ${convertedAmount.toFixed(2)} ${toCurrency}`,
        status: 'completed',
        createdAt: Date.now(),
        metadata: { toCurrency, convertedAmount },
      };
      await set(txRef, transaction);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createOrder: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const userSnapshot = await get(ref(database, `users/${data.userId}`));
      const user = userSnapshot.val();
      if (!user) throw new Error('المستخدم غير موجود');
      if (user.balances[data.currency] < data.amount) throw new Error('رصيد غير كافي');

      await update(ref(database, `users/${data.userId}/balances`), {
        [data.currency]: user.balances[data.currency] - data.amount,
      });

      const orderRef = push(ref(database, 'orders'));
      const order: Order = {
        id: orderRef.key!,
        ...data,
        status: 'pending',
        createdAt: Date.now(),
      };
      await set(orderRef, order);

      const txRef = push(ref(database, 'transactions'));
      await set(txRef, {
        id: txRef.key!,
        userId: data.userId,
        type: 'service',
        amount: data.amount,
        currency: data.currency,
        description: `طلب خدمة - ${data.productId}`,
        status: 'pending',
        createdAt: Date.now(),
        metadata: { orderId: orderRef.key },
      });

      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  redeemGiftCode: async (userId, code) => {
    set({ isLoading: true, error: null });
    try {
      const snapshot = await get(ref(database, 'giftCodes'));
      if (!snapshot.exists()) throw new Error('رمز الهدية غير صالح');

      const giftCodes = snapshot.val() as Record<string, any>;
      const giftEntry = Object.entries(giftCodes).find(([_, gc]) => gc.code === code);

      if (!giftEntry) throw new Error('رمز الهدية غير صالح');
      const [giftId, giftCode] = giftEntry;

      if (giftCode.isUsed) throw new Error('تم استخدام هذا الرمز بالفعل');
      if (giftCode.expiresAt && giftCode.expiresAt < Date.now()) throw new Error('انتهت صلاحية هذا الرمز');

      await update(ref(database, `giftCodes/${giftId}`), {
        isUsed: true,
        usedBy: userId,
        usedAt: Date.now(),
      });

      const userSnapshot = await get(ref(database, `users/${userId}`));
      const user = userSnapshot.val();
      await update(ref(database, `users/${userId}/balances`), {
        [giftCode.currency]: user.balances[giftCode.currency] + giftCode.amount,
      });

      const txRef = push(ref(database, 'transactions'));
      await set(txRef, {
        id: txRef.key!,
        userId,
        type: 'gift',
        amount: giftCode.amount,
        currency: giftCode.currency,
        description: `هدية - ${giftCode.message || 'رمز هدية'}`,
        status: 'completed',
        createdAt: Date.now(),
        metadata: { giftCodeId: giftId },
      });

      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchAllDeposits: async () => {
    try {
      const snapshot = await get(ref(database, 'deposits'));
      if (snapshot.exists()) {
        const deposits = Object.values(snapshot.val() as Record<string, Deposit>);
        set({ deposits: deposits.sort((a, b) => b.createdAt - a.createdAt) });
      }
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  fetchAllWithdrawals: async () => {
    try {
      const snapshot = await get(ref(database, 'withdrawals'));
      if (snapshot.exists()) {
        const withdrawals = Object.values(snapshot.val() as Record<string, Withdrawal>);
        set({ withdrawals: withdrawals.sort((a, b) => b.createdAt - a.createdAt) });
      }
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  fetchAllOrders: async () => {
    try {
      const snapshot = await get(ref(database, 'orders'));
      if (snapshot.exists()) {
        const orders = Object.values(snapshot.val() as Record<string, Order>);
        set({ orders: orders.sort((a, b) => b.createdAt - a.createdAt) });
      }
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  processDeposit: async (depositId, status, processedBy) => {
    try {
      const depositSnapshot = await get(ref(database, `deposits/${depositId}`));
      const deposit = depositSnapshot.val() as Deposit;
      if (!deposit) throw new Error('الإيداع غير موجود');

      await update(ref(database, `deposits/${depositId}`), {
        status,
        processedBy,
        processedAt: Date.now(),
      });

      if (status === 'approved') {
        const userSnapshot = await get(ref(database, `users/${deposit.userId}`));
        const user = userSnapshot.val();
        if (user) {
          await update(ref(database, `users/${deposit.userId}/balances`), {
            [deposit.currency]: user.balances[deposit.currency] + deposit.amount,
          });
        }
      }
      get().fetchAllDeposits();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  processWithdrawal: async (withdrawalId, status, processedBy) => {
    try {
      const withdrawalSnapshot = await get(ref(database, `withdrawals/${withdrawalId}`));
      const withdrawal = withdrawalSnapshot.val() as Withdrawal;
      if (!withdrawal) throw new Error('السحب غير موجود');

      await update(ref(database, `withdrawals/${withdrawalId}`), {
        status,
        processedBy,
        processedAt: Date.now(),
      });

      if (status === 'approved') {
        const userSnapshot = await get(ref(database, `users/${withdrawal.userId}`));
        const user = userSnapshot.val();
        if (user) {
          await update(ref(database, `users/${withdrawal.userId}/balances`), {
            [withdrawal.currency]: user.balances[withdrawal.currency] - withdrawal.amount,
          });
        }
      } else if (status === 'rejected') {
        // Refund the amount that was held
      }
      get().fetchAllWithdrawals();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  processOrder: async (orderId, status, processedBy, notes) => {
    try {
      const updateData: any = {
        status,
        processedBy,
        processedAt: Date.now(),
      };
      if (notes) updateData.notes = notes;
      await update(ref(database, `orders/${orderId}`), updateData);

      if (status === 'rejected') {
        const orderSnapshot = await get(ref(database, `orders/${orderId}`));
        const order = orderSnapshot.val() as Order;
        if (order) {
          const userSnapshot = await get(ref(database, `users/${order.userId}`));
          const user = userSnapshot.val();
          if (user) {
            await update(ref(database, `users/${order.userId}/balances`), {
              [order.currency]: user.balances[order.currency] + order.amount,
            });
          }
        }
      }
      get().fetchAllOrders();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  clearError: () => set({ error: null }),
}));
