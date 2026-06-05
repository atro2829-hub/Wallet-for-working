'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, ArrowLeftRight, ShieldCheck, Package, TrendingUp, Lock, Unlock,
  CheckCircle2, XCircle, Plus, Trash2, ToggleLeft, ToggleRight, DollarSign,
  ArrowLeft, Search, Bell, Mail, MapPin, Hash, BarChart3, Settings, Clock,
  CreditCard, Phone, ChevronDown, ChevronUp, Smartphone, Gamepad2, Gift,
  Wifi, ImagePlus, RotateCcw, AlertTriangle, ShoppingBag, Eye, EyeOff,
  Filter, Send, X, Copy, Tag, Percent, Calendar, UserCheck, UserX,
  FileText, Image as ImageIcon, MessageSquare, Globe, RefreshCw, ArrowRightLeft,
  Banknote, Wallet, BadgeCheck, Ban, Edit3, Save, ChevronLeft, Activity,
  Zap, Layers, PieChart, Radio
} from 'lucide-react';
import { useAppStore, type ServiceProvider, type ProductPackage, type Order } from '@/lib/store';
import { currencySymbols, currencyBadgeColors, currencyNames, generateReference, formatNumber, timeAgo, compressBase64Image, defaultExchangeRates } from '@/lib/utils';
import { ref, set, get, update, remove, push, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';
import { LOGO_BASE64 } from '@/lib/logo';

type AdminTab = 'overview' | 'orders' | 'products' | 'providers' | 'users' | 'deposit' | 'withdraw' | 'kyc' | 'codes' | 'settings';

interface FirebaseUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  userId: string;
  kycStatus: 'pending' | 'submitted' | 'verified' | 'rejected';
  isBlocked: boolean;
  balanceYER: number;
  balanceSAR: number;
  balanceUSD: number;
  cardType?: string;
  cardNumber?: string;
  governorate?: string;
  idPhotoUrl?: string;
  selfieUrl?: string;
  avatar?: string;
  createdAt?: string;
}

interface DepositReq {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  currency: 'YER' | 'SAR' | 'USD';
  method: string;
  receiptImage: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string;
  createdAt: string;
}

interface WithdrawReq {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  currency: 'YER' | 'SAR' | 'USD';
  method: string;
  bankDetails: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string;
  createdAt: string;
}

interface PromoCodeData {
  id: string;
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  currency: 'YER' | 'SAR' | 'USD';
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
}

export default function AdminScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const {
    setActiveScreen, user, orders, updateOrderStatus, providers, setProviders,
    packages, setPackages, addPackage, updatePackage, setExchangeRates,
    addNotification
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');

  // Product form
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', price: 0, currency: 'YER' as 'YER' | 'SAR' | 'USD', providerId: '', executionType: 'manual' as 'manual' | 'auto' });
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editProductData, setEditProductData] = useState({ name: '', price: 0 });

  // Provider form
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [newProvider, setNewProvider] = useState({ name: '', color: '#E60000', categoryId: 'telecom', inputLabel: 'رقم الهاتف', inputType: 'phone' as 'phone' | 'text', inputPrefix: '+967', icon: '' });
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Firebase data
  const [firebaseOrders, setFirebaseOrders] = useState<Order[]>([]);
  const [statsData, setStatsData] = useState({ totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalRevenue: 0, revenueYER: 0, revenueSAR: 0, revenueUSD: 0 });

  // Users
  const [firebaseUsers, setFirebaseUsers] = useState<FirebaseUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [balanceAdjustUser, setBalanceAdjustUser] = useState<string | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceCurrency, setBalanceCurrency] = useState<'YER' | 'SAR' | 'USD'>('YER');
  const [balanceAction, setBalanceAction] = useState<'add' | 'subtract'>('add');

  // Deposit
  const [depositRequests, setDepositRequests] = useState<DepositReq[]>([]);
  const [depositFilter, setDepositFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [viewReceipt, setViewReceipt] = useState<string | null>(null);

  // Withdraw
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawReq[]>([]);
  const [withdrawFilter, setWithdrawFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // KYC
  const [kycUsers, setKycUsers] = useState<FirebaseUser[]>([]);
  const [viewKycPhoto, setViewKycPhoto] = useState<{ type: 'id' | 'selfie'; url: string } | null>(null);
  const [kycRejectReason, setKycRejectReason] = useState<string>('');

  // Promo Codes
  const [promoCodes, setPromoCodes] = useState<PromoCodeData[]>([]);
  const [showAddCode, setShowAddCode] = useState(false);
  const [newCode, setNewCode] = useState({ code: '', discount: 0, type: 'percentage' as 'percentage' | 'fixed', currency: 'YER' as 'YER' | 'SAR' | 'USD', maxUses: 100, expiresAt: '' });

  // Settings
  const [exchangeRatesForm, setExchangeRatesForm] = useState({ YER: 1, SAR: 0.037, USD: 0.0099 });
  const [commissionRate, setCommissionRate] = useState('2');
  const [bulkNotif, setBulkNotif] = useState({ title: '', body: '' });
  const [auditLog, setAuditLog] = useState<{ action: string; time: string }[]>([]);

  // Revenue chart data (last 7 days)
  const [revenueChart, setRevenueChart] = useState<{ day: string; amount: number }[]>([]);

  const addAuditEntry = useCallback((action: string) => {
    setAuditLog(prev => [{ action, time: new Date().toISOString() }, ...prev].slice(0, 20));
  }, []);

  // Listen to Firebase orders
  useEffect(() => {
    const ordersRef = ref(database, 'orders');
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const ordersList = Object.values(data) as Order[];
        setFirebaseOrders(ordersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        const pending = ordersList.filter(o => o.status === 'pending').length;
        const completed = ordersList.filter(o => o.status === 'completed').length;
        const revYER = ordersList.filter(o => o.status === 'completed' && o.currency === 'YER').reduce((s, o) => s + o.amount, 0);
        const revSAR = ordersList.filter(o => o.status === 'completed' && o.currency === 'SAR').reduce((s, o) => s + o.amount, 0);
        const revUSD = ordersList.filter(o => o.status === 'completed' && o.currency === 'USD').reduce((s, o) => s + o.amount, 0);
        setStatsData({ totalOrders: ordersList.length, pendingOrders: pending, completedOrders: completed, totalRevenue: revYER, revenueYER: revYER, revenueSAR: revSAR, revenueUSD: revUSD });

        // Revenue chart - last 7 days
        const days: { day: string; amount: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(); d.setDate(d.getDate() - i);
          const dayStr = d.toLocaleDateString('ar-SA', { weekday: 'short' });
          const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
          const dayEnd = dayStart + 86400000;
          const dayRev = ordersList.filter(o => o.status === 'completed' && new Date(o.createdAt).getTime() >= dayStart && new Date(o.createdAt).getTime() < dayEnd).reduce((s, o) => s + o.amount, 0);
          days.push({ day: dayStr, amount: dayRev });
        }
        setRevenueChart(days);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to Firebase users
  useEffect(() => {
    const usersRef = ref(database, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const usersList = Object.entries(data).map(([key, val]: [string, any]) => ({
          id: key, name: val.name || '', email: val.email || '', phone: val.phone || '',
          userId: val.userId || key, kycStatus: val.kycStatus || 'pending',
          isBlocked: val.isBlocked || false, balanceYER: val.balanceYER || 0,
          balanceSAR: val.balanceSAR || 0, balanceUSD: val.balanceUSD || 0,
          cardType: val.cardType, cardNumber: val.cardNumber, governorate: val.governorate,
          idPhotoUrl: val.idPhotoUrl, selfieUrl: val.selfieUrl, avatar: val.avatar,
          createdAt: val.createdAt
        }));
        setFirebaseUsers(usersList);
        setKycUsers(usersList.filter(u => u.kycStatus === 'submitted'));
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to deposit requests
  useEffect(() => {
    const depRef = ref(database, 'deposit-requests');
    const unsubscribe = onValue(depRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.values(data) as DepositReq[];
        setDepositRequests(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } else { setDepositRequests([]); }
    });
    return () => unsubscribe();
  }, []);

  // Listen to withdraw requests
  useEffect(() => {
    const withRef = ref(database, 'withdraw-requests');
    const unsubscribe = onValue(withRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.values(data) as WithdrawReq[];
        setWithdrawRequests(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } else { setWithdrawRequests([]); }
    });
    return () => unsubscribe();
  }, []);

  // Listen to promo codes
  useEffect(() => {
    const codesRef = ref(database, 'promo-codes');
    const unsubscribe = onValue(codesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setPromoCodes(Object.values(data) as PromoCodeData[]);
      } else { setPromoCodes([]); }
    });
    return () => unsubscribe();
  }, []);

  const allOrders = [...firebaseOrders, ...orders].filter(
    (order, index, self) => index === self.findIndex(o => o.id === order.id)
  );

  const filteredOrders = allOrders.filter(o => {
    if (orderFilter !== 'all' && o.status !== orderFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return o.userName?.toLowerCase().includes(q) || o.customerInput?.includes(q) || o.providerName?.includes(q) || o.packageName?.includes(q);
    }
    return true;
  });

  const pendingOrders = allOrders.filter(o => o.status === 'pending');
  const filteredUsers = firebaseUsers.filter(u => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q) || u.userId?.includes(q);
  });

  const handleCompleteOrder = async (order: Order) => {
    updateOrderStatus(order.id, 'completed');
    try {
      await update(ref(database, `orders/${order.id}`), { status: 'completed', completedAt: new Date().toISOString() });
      const notifId = generateReference();
      await set(ref(database, `notifications/${order.userId}/${notifId}`), {
        id: notifId, title: 'تم تنفيذ الطلب', body: `تم تنفيذ طلبك ${order.packageName} بنجاح`,
        type: 'transaction', isRead: false, createdAt: new Date().toISOString(),
      });
      addAuditEntry(`تم تنفيذ طلب ${order.packageName} للمستخدم ${order.userName}`);
    } catch {}
  };

  const handleCancelOrder = async (order: Order) => {
    updateOrderStatus(order.id, 'cancelled');
    try {
      await update(ref(database, `orders/${order.id}`), { status: 'cancelled' });
      const userRef = ref(database, `users/${order.userId}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const userData = snapshot.val();
        const balanceField = `balance${order.currency}`;
        const currentBalance = userData[balanceField] || 0;
        await update(userRef, { [balanceField]: currentBalance + order.amount });
      }
      const notifId = generateReference();
      await set(ref(database, `notifications/${order.userId}/${notifId}`), {
        id: notifId, title: 'تم إلغاء الطلب', body: `تم إلغاء طلبك ${order.packageName} وإعادة المبلغ لرصيدك`,
        type: 'info', isRead: false, createdAt: new Date().toISOString(),
      });
      addAuditEntry(`تم إلغاء طلب ${order.packageName} وإعادة المبلغ`);
    } catch {}
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'provider' | 'editProvider') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (target === 'provider') {
        setNewProvider(prev => ({ ...prev, icon: base64 }));
      } else if (target === 'editProvider') {
        setProviders(providers.map(p => p.id === editingProvider ? { ...p, icon: base64 } : p));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddProvider = () => {
    if (!newProvider.name) return;
    const id = newProvider.name.replace(/\s/g, '-').toLowerCase();
    const provider: ServiceProvider = {
      id, categoryId: newProvider.categoryId, name: newProvider.name, color: newProvider.color,
      icon: newProvider.icon, isActive: true, inputLabel: newProvider.inputLabel,
      inputType: newProvider.inputType, inputPrefix: newProvider.inputPrefix,
    };
    setProviders([...providers, provider]);
    try { set(ref(database, `providers/${id}`), provider); } catch {}
    setNewProvider({ name: '', color: '#E60000', categoryId: 'telecom', inputLabel: 'رقم الهاتف', inputType: 'phone', inputPrefix: '+967', icon: '' });
    setShowAddProvider(false);
    addAuditEntry(`تم إضافة مزود ${provider.name}`);
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.providerId || newProduct.price <= 0) return;
    const id = generateReference();
    const pkg: ProductPackage = {
      id, providerId: newProduct.providerId, name: newProduct.name, price: newProduct.price,
      currency: newProduct.currency, executionType: newProduct.executionType, isActive: true,
    };
    addPackage(pkg);
    try { set(ref(database, `packages/${id}`), pkg); } catch {}
    setNewProduct({ name: '', price: 0, currency: 'YER', providerId: '', executionType: 'manual' });
    setShowAddProduct(false);
    addAuditEntry(`تم إضافة منتج ${pkg.name}`);
  };

  const handleToggleProduct = (id: string) => {
    const pkg = packages.find(p => p.id === id);
    if (pkg) {
      updatePackage(id, { isActive: !pkg.isActive });
      try { update(ref(database, `packages/${id}`), { isActive: !pkg.isActive }); } catch {}
    }
  };

  const handleDeleteProduct = (id: string) => {
    const pkg = packages.find(p => p.id === id);
    setPackages(packages.filter(p => p.id !== id));
    try { remove(ref(database, `packages/${id}`)); } catch {}
    addAuditEntry(`تم حذف منتج ${pkg?.name || id}`);
  };

  const handleToggleProvider = (id: string) => {
    const provider = providers.find(p => p.id === id);
    if (provider) {
      setProviders(providers.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
      try { update(ref(database, `providers/${id}`), { isActive: !provider.isActive }); } catch {}
    }
  };

  const handleDeleteProvider = (id: string) => {
    const provider = providers.find(p => p.id === id);
    setProviders(providers.filter(p => p.id !== id));
    try { remove(ref(database, `providers/${id}`)); } catch {}
    addAuditEntry(`تم حذف مزود ${provider?.name || id}`);
  };

  // User management
  const handleToggleBlock = async (u: FirebaseUser) => {
    try {
      await update(ref(database, `users/${u.id}`), { isBlocked: !u.isBlocked });
      addAuditEntry(`${u.isBlocked ? 'تم إلغاء حظر' : 'تم حظر'} المستخدم ${u.name}`);
    } catch {}
  };

  const handleBalanceAdjust = async (u: FirebaseUser) => {
    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount <= 0) return;
    try {
      const userRef = ref(database, `users/${u.id}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const field = `balance${balanceCurrency}`;
        const current = data[field] || 0;
        const newBalance = balanceAction === 'add' ? current + amount : Math.max(0, current - amount);
        await update(userRef, { [field]: newBalance });
        const notifId = generateReference();
        await set(ref(database, `notifications/${u.id}/${notifId}`), {
          id: notifId, title: 'تحديث الرصيد',
          body: `تم ${balanceAction === 'add' ? 'إضافة' : 'خصم'} ${amount} ${currencySymbols[balanceCurrency]} ${balanceAction === 'add' ? 'إلى' : 'من'} رصيدك`,
          type: 'transaction', isRead: false, createdAt: new Date().toISOString(),
        });
        addAuditEntry(`تم ${balanceAction === 'add' ? 'إضافة' : 'خصم'} ${amount} ${currencySymbols[balanceCurrency]} ${balanceAction === 'add' ? 'للمستخدم' : 'من المستخدم'} ${u.name}`);
        setBalanceAdjustUser(null); setBalanceAmount('');
      }
    } catch {}
  };

  // Deposit handling
  const handleApproveDeposit = async (dep: DepositReq) => {
    try {
      await update(ref(database, `deposit-requests/${dep.id}`), { status: 'approved', reviewedAt: new Date().toISOString() });
      const userRef = ref(database, `users/${dep.userId}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const field = `balance${dep.currency}`;
        await update(userRef, { [field]: (data[field] || 0) + dep.amount });
      }
      const notifId = generateReference();
      await set(ref(database, `notifications/${dep.userId}/${notifId}`), {
        id: notifId, title: 'تم قبول الإيداع', body: `تم إضافة ${dep.amount} ${currencySymbols[dep.currency]} إلى رصيدك`,
        type: 'transaction', isRead: false, createdAt: new Date().toISOString(),
      });
      addAuditEntry(`تم قبول إيداع ${dep.amount} ${currencySymbols[dep.currency]} للمستخدم ${dep.userName}`);
    } catch {}
  };

  const handleRejectDeposit = async (dep: DepositReq) => {
    try {
      await update(ref(database, `deposit-requests/${dep.id}`), { status: 'rejected', reviewedAt: new Date().toISOString() });
      const notifId = generateReference();
      await set(ref(database, `notifications/${dep.userId}/${notifId}`), {
        id: notifId, title: 'تم رفض الإيداع', body: `تم رفض طلب إيداع ${dep.amount} ${currencySymbols[dep.currency]}`,
        type: 'info', isRead: false, createdAt: new Date().toISOString(),
      });
      addAuditEntry(`تم رفض إيداع ${dep.amount} ${currencySymbols[dep.currency]} للمستخدم ${dep.userName}`);
    } catch {}
  };

  // Withdraw handling
  const handleApproveWithdraw = async (w: WithdrawReq) => {
    try {
      await update(ref(database, `withdraw-requests/${w.id}`), { status: 'approved', reviewedAt: new Date().toISOString() });
      const userRef = ref(database, `users/${w.userId}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const field = `balance${w.currency}`;
        await update(userRef, { [field]: Math.max(0, (data[field] || 0) - w.amount) });
      }
      const notifId = generateReference();
      await set(ref(database, `notifications/${w.userId}/${notifId}`), {
        id: notifId, title: 'تم قبول السحب', body: `تم سحب ${w.amount} ${currencySymbols[w.currency]} من رصيدك`,
        type: 'transaction', isRead: false, createdAt: new Date().toISOString(),
      });
      addAuditEntry(`تم قبول سحب ${w.amount} ${currencySymbols[w.currency]} للمستخدم ${w.userName}`);
    } catch {}
  };

  const handleRejectWithdraw = async (w: WithdrawReq) => {
    try {
      await update(ref(database, `withdraw-requests/${w.id}`), { status: 'rejected', reviewedAt: new Date().toISOString() });
      const notifId = generateReference();
      await set(ref(database, `notifications/${w.userId}/${notifId}`), {
        id: notifId, title: 'تم رفض السحب', body: `تم رفض طلب سحب ${w.amount} ${currencySymbols[w.currency]}`,
        type: 'info', isRead: false, createdAt: new Date().toISOString(),
      });
      addAuditEntry(`تم رفض سحب ${w.amount} ${currencySymbols[w.currency]} للمستخدم ${w.userName}`);
    } catch {}
  };

  // KYC handling
  const handleApproveKyc = async (u: FirebaseUser) => {
    try {
      await update(ref(database, `users/${u.id}`), { kycStatus: 'verified' });
      const notifId = generateReference();
      await set(ref(database, `notifications/${u.id}/${notifId}`), {
        id: notifId, title: 'تم التحقق من هويتك', body: 'تم قبول وثائق التحقق الخاصة بك',
        type: 'security', isRead: false, createdAt: new Date().toISOString(),
      });
      addAuditEntry(`تم التحقق من هوية المستخدم ${u.name}`);
    } catch {}
  };

  const handleRejectKyc = async (u: FirebaseUser) => {
    try {
      await update(ref(database, `users/${u.id}`), { kycStatus: 'rejected' });
      const notifId = generateReference();
      await set(ref(database, `notifications/${u.id}/${notifId}`), {
        id: notifId, title: 'تم رفض التحقق', body: kycRejectReason ? `السبب: ${kycRejectReason}` : 'تم رفض وثائق التحقق الخاصة بك',
        type: 'security', isRead: false, createdAt: new Date().toISOString(),
      });
      addAuditEntry(`تم رفض التحقق من هوية المستخدم ${u.name}`);
      setKycRejectReason('');
    } catch {}
  };

  // Promo code handling
  const handleAddPromoCode = () => {
    if (!newCode.code || newCode.discount <= 0) return;
    const id = generateReference();
    const code: PromoCodeData = { ...newCode, id, usedCount: 0, isActive: true };
    try { set(ref(database, `promo-codes/${id}`), code); } catch {}
    setNewCode({ code: '', discount: 0, type: 'percentage', currency: 'YER', maxUses: 100, expiresAt: '' });
    setShowAddCode(false);
    addAuditEntry(`تم إضافة كود خصم ${code.code}`);
  };

  const handleTogglePromoCode = async (c: PromoCodeData) => {
    try { await update(ref(database, `promo-codes/${c.id}`), { isActive: !c.isActive }); } catch {}
    addAuditEntry(`تم ${c.isActive ? 'تعطيل' : 'تفعيل'} كود ${c.code}`);
  };

  // Settings handlers
  const handleSaveRates = () => {
    setExchangeRates(exchangeRatesForm);
    try { set(ref(database, 'settings/exchangeRates'), exchangeRatesForm); } catch {}
    addAuditEntry('تم تحديث أسعار الصرف');
  };

  const handleSendBulkNotif = async () => {
    if (!bulkNotif.title || !bulkNotif.body) return;
    try {
      for (const u of firebaseUsers) {
        const notifId = generateReference();
        await set(ref(database, `notifications/${u.id}/${notifId}`), {
          id: notifId, title: bulkNotif.title, body: bulkNotif.body,
          type: 'info', isRead: false, createdAt: new Date().toISOString(),
        });
      }
      setBulkNotif({ title: '', body: '' });
      addAuditEntry(`تم إرسال إشعار جماعي: ${bulkNotif.title}`);
    } catch {}
  };

  const maxRevenue = Math.max(...revenueChart.map(d => d.amount), 1);

  const tabs: { id: AdminTab; label: string; icon: typeof BarChart3; badge?: number }[] = [
    { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
    { id: 'orders', label: 'الطلبات', icon: ShoppingBag, badge: pendingOrders.length },
    { id: 'products', label: 'المنتجات', icon: Package },
    { id: 'providers', label: 'المزودون', icon: Smartphone },
    { id: 'users', label: 'المستخدمون', icon: Users, badge: firebaseUsers.length },
    { id: 'deposit', label: 'الإيداع', icon: Banknote, badge: depositRequests.filter(d => d.status === 'pending').length },
    { id: 'withdraw', label: 'السحب', icon: Wallet, badge: withdrawRequests.filter(w => w.status === 'pending').length },
    { id: 'kyc', label: 'التحقق', icon: ShieldCheck, badge: kycUsers.length },
    { id: 'codes', label: 'الأكواد', icon: Tag },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B', label: 'قيد الانتظار' },
    completed: { bg: 'rgba(16,185,129,0.15)', color: '#10B981', label: 'مكتمل' },
    cancelled: { bg: 'rgba(230,0,0,0.15)', color: '#E60000', label: 'ملغى' },
    approved: { bg: 'rgba(16,185,129,0.15)', color: '#10B981', label: 'مقبول' },
    rejected: { bg: 'rgba(230,0,0,0.15)', color: '#E60000', label: 'مرفوض' },
    open: { bg: 'rgba(59,130,246,0.15)', color: '#3B82F6', label: 'مفتوح' },
  };

  const kycStatusStyle: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B', label: 'معلق' },
    submitted: { bg: 'rgba(59,130,246,0.15)', color: '#3B82F6', label: 'مُقدم' },
    verified: { bg: 'rgba(16,185,129,0.15)', color: '#10B981', label: 'موثق' },
    rejected: { bg: 'rgba(230,0,0,0.15)', color: '#E60000', label: 'مرفوض' },
  };

  // Categories for bar chart
  const categoryData = [
    { name: 'اتصالات', count: allOrders.filter(o => providers.find(p => p.id === o.providerId)?.categoryId === 'telecom').length, color: '#E60000' },
    { name: 'ألعاب', count: allOrders.filter(o => providers.find(p => p.id === o.providerId)?.categoryId === 'games').length, color: '#F59E0B' },
    { name: 'إنترنت', count: allOrders.filter(o => providers.find(p => p.id === o.providerId)?.categoryId === 'internet').length, color: '#3B82F6' },
  ];
  const maxCatCount = Math.max(...categoryData.map(c => c.count), 1);

  return (
    <div className="min-h-screen" style={{ background: isDark ? '#0F0F0F' : '#F5F5F5' }}>
      {/* Header */}
      <div className="animated-gradient relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #1A1A1A 0%, #2A0A0A 50%, #0F0F0F 100%)' }}>
        <div className="absolute inset-0 glass-dark opacity-30" />
        <div className="relative px-5 pt-4 pb-5">
          <div className="flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setActiveScreen('main')} className="w-10 h-10 rounded-xl glass flex items-center justify-center">
              <ArrowLeft size={18} strokeWidth={1.5} color="#FFF" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-white text-xl font-bold">لوحة التحكم</h1>
              <p className="text-white/40 text-xs">إدارة محفظة الجنوب</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center glow-red" style={{ background: 'rgba(230,0,0,0.2)' }}>
              <ShieldCheck size={20} strokeWidth={1.5} color="#E60000" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mt-3">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin" style={{ scrollbarWidth: 'none' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button key={tab.id} whileTap={{ scale: 0.95 }} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all relative ${isActive ? 'glow-red' : ''}`}
                style={{
                  background: isActive ? 'rgba(230,0,0,0.2)' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(20px)',
                  border: isActive ? '1px solid rgba(230,0,0,0.3)' : isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                  color: isActive ? '#FFF' : isDark ? '#BBB' : '#666',
                }}
              >
                <Icon size={14} strokeWidth={1.5} />
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1 -left-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold px-1"
                    style={{ background: '#E60000', color: '#FFF' }}>
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-5 mt-4 pb-8">
        <AnimatePresence mode="wait">

          {/* === OVERVIEW === */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'إجمالي الطلبات', value: statsData.totalOrders, icon: ShoppingBag, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
                  { label: 'قيد الانتظار', value: statsData.pendingOrders, icon: Clock, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', glow: true },
                  { label: 'مكتملة', value: statsData.completedOrders, icon: CheckCircle2, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
                  { label: 'الإيرادات (ر.ي)', value: statsData.revenueYER, icon: DollarSign, color: '#E60000', bg: 'rgba(230,0,0,0.12)' },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                      className={`rounded-2xl p-4 ${stat.glow ? 'glow-red' : ''}`}
                      style={{
                        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)',
                        backdropFilter: 'blur(20px)',
                        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
                      }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
                          <Icon size={20} strokeWidth={1.5} color={stat.color} />
                        </div>
                      </div>
                      <p className="text-2xl font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{formatNumber(stat.value)}</p>
                      <p className="text-xs mt-0.5" style={{ color: isDark ? '#777' : '#999' }}>{stat.label}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Revenue Chart */}
              <div className="rounded-2xl p-4" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Activity size={16} color="#E60000" />
                  <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>الإيرادات - آخر 7 أيام</h3>
                </div>
                <div className="flex items-end gap-2 h-32">
                  {revenueChart.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max((d.amount / maxRevenue) * 100, 4)}%` }} transition={{ delay: i * 0.05, duration: 0.5 }}
                        className="w-full rounded-t-lg min-h-[4px]" style={{ background: 'linear-gradient(to top, #E60000, #FF4444)' }} />
                      <span className="text-[9px]" style={{ color: isDark ? '#666' : '#AAA' }}>{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Orders by Category */}
              <div className="rounded-2xl p-4" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <PieChart size={16} color="#E60000" />
                  <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>الطلبات حسب الفئة</h3>
                </div>
                <div className="space-y-2">
                  {categoryData.map((cat) => (
                    <div key={cat.name} className="flex items-center gap-3">
                      <span className="text-xs w-14" style={{ color: isDark ? '#AAA' : '#666' }}>{cat.name}</span>
                      <div className="flex-1 h-6 rounded-lg overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(cat.count / maxCatCount) * 100}%` }} transition={{ duration: 0.8 }}
                          className="h-full rounded-lg" style={{ background: cat.color, opacity: 0.7 }} />
                      </div>
                      <span className="text-xs font-bold w-8 text-left" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{cat.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Pending Orders */}
              {pendingOrders.length > 0 && (
                <div className="rounded-2xl p-4" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock size={14} color="#F59E0B" />
                      <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>طلبات بانتظار التنفيذ</h3>
                    </div>
                    <button onClick={() => setActiveTab('orders')} className="text-xs font-medium" style={{ color: '#E60000' }}>عرض الكل</button>
                  </div>
                  <div className="space-y-2">
                    {pendingOrders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderRight: '3px solid #F59E0B' }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{order.packageName}</p>
                          <p className="text-[10px] truncate" style={{ color: isDark ? '#666' : '#AAA' }}>{order.userName} - {order.customerInput}</p>
                        </div>
                        <div className="flex gap-1.5 mr-2">
                          <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleCompleteOrder(order)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
                            <CheckCircle2 size={14} color="#10B981" />
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleCancelOrder(order)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(230,0,0,0.15)' }}>
                            <XCircle size={14} color="#E60000" />
                          </motion.button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* === ORDERS === */}
          {activeTab === 'orders' && (
            <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
              {/* Search */}
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                <Search size={18} strokeWidth={1.5} color={isDark ? '#555' : '#AAA'} />
                <input type="text" placeholder="ابحث بالاسم، الرقم، الخدمة..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-transparent outline-none text-sm" style={{ color: isDark ? '#FFF' : '#1a1a1a' }} />
              </div>
              {/* Filter */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {(['all', 'pending', 'completed', 'cancelled'] as const).map((filter) => (
                  <motion.button key={filter} whileTap={{ scale: 0.95 }} onClick={() => setOrderFilter(filter)}
                    className="px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap"
                    style={{ background: orderFilter === filter ? 'rgba(230,0,0,0.2)' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)', color: orderFilter === filter ? '#FFF' : isDark ? '#BBB' : '#666', border: orderFilter === filter ? '1px solid rgba(230,0,0,0.3)' : isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                    {filter === 'all' ? 'الكل' : filter === 'pending' ? 'قيد الانتظار' : filter === 'completed' ? 'مكتمل' : 'ملغى'}
                  </motion.button>
                ))}
              </div>
              {/* Orders List */}
              {filteredOrders.map((order) => {
                const statusStyle = statusStyles[order.status] || statusStyles.pending;
                const provider = providers.find(p => p.id === order.providerId);
                return (
                  <div key={order.id} className="rounded-2xl overflow-hidden" style={{
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
                    border: order.status === 'pending' ? '1px solid rgba(245,158,11,0.3)' : isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
                    borderRight: order.status === 'pending' ? '3px solid #F59E0B' : undefined,
                    boxShadow: order.status === 'pending' ? '0 0 15px rgba(245,158,11,0.1)' : undefined,
                  }}>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {provider?.icon && provider.icon.startsWith('data:') ? (
                            <img src={provider.icon} alt={provider.name} className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${provider?.color || '#E60000'}18` }}>
                              <span className="font-bold text-xs" style={{ color: provider?.color || '#E60000' }}>{(provider?.name || order.providerName)?.charAt(0)}</span>
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{order.packageName}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: statusStyle.bg, color: statusStyle.color }}>{statusStyle.label}</span>
                            </div>
                            <p className="text-xs" style={{ color: isDark ? '#888' : '#AAA' }}>{order.providerName}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold" style={{ color: '#E60000' }}>{order.amount.toLocaleString()} {currencySymbols[order.currency]}</p>
                          <p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>{timeAgo(order.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mb-3 p-2.5 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                        <div><p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>العميل</p><p className="text-xs font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{order.userName}</p></div>
                        <div className="w-px h-6" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                        <div><p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>الرقم/المعرف</p><p className="text-xs font-medium" dir="ltr" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{order.customerInput}</p></div>
                        <div className="w-px h-6" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                        <div><p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>النوع</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: order.executionType === 'manual' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', color: order.executionType === 'manual' ? '#F59E0B' : '#10B981' }}>
                            {order.executionType === 'manual' ? 'يدوي' : 'تلقائي'}
                          </span>
                        </div>
                      </div>
                      {order.status === 'pending' && (
                        <div className="flex gap-2">
                          <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleCompleteOrder(order)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: '#10B981' }}>
                            <CheckCircle2 size={14} /> تم الشحن
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleCancelOrder(order)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold" style={{ background: 'rgba(230,0,0,0.1)', color: '#E60000' }}>
                            <RotateCcw size={14} /> إلغاء وإعادة
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredOrders.length === 0 && (
                <div className="flex flex-col items-center py-8"><ShoppingBag size={40} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} /><p className="text-sm mt-2" style={{ color: isDark ? '#666' : '#AAA' }}>لا توجد طلبات</p></div>
              )}
            </motion.div>
          )}

          {/* === PRODUCTS === */}
          {activeTab === 'products' && (
            <motion.div key="products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAddProduct(!showAddProduct)}
                className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium"
                style={{ background: 'rgba(230,0,0,0.1)', color: '#E60000', border: '1px solid rgba(230,0,0,0.2)', backdropFilter: 'blur(20px)' }}>
                <Plus size={18} strokeWidth={1.5} /><span>إضافة منتج جديد</span>
              </motion.button>

              <AnimatePresence>
                {showAddProduct && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="rounded-2xl p-4 space-y-3 overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                    <select value={newProduct.providerId} onChange={(e) => setNewProduct({ ...newProduct, providerId: e.target.value })} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: isDark ? '#FFF' : '#1a1a1a' }}>
                      <option value="">اختر المزود</option>
                      {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input type="text" placeholder="اسم المنتج" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: isDark ? '#FFF' : '#1a1a1a' }} />
                    <div className="flex gap-2">
                      <input type="number" placeholder="السعر" value={newProduct.price || ''} onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })} className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: isDark ? '#FFF' : '#1a1a1a' }} dir="ltr" />
                      <select value={newProduct.currency} onChange={(e) => setNewProduct({ ...newProduct, currency: e.target.value as 'YER' | 'SAR' | 'USD' })} className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: isDark ? '#FFF' : '#1a1a1a' }}>
                        <option value="YER">YER</option><option value="SAR">SAR</option><option value="USD">USD</option>
                      </select>
                    </div>
                    <select value={newProduct.executionType} onChange={(e) => setNewProduct({ ...newProduct, executionType: e.target.value as 'manual' | 'auto' })} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: isDark ? '#FFF' : '#1a1a1a' }}>
                      <option value="manual">تنفيذ يدوي</option><option value="auto">تنفيذ تلقائي</option>
                    </select>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={handleAddProduct} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ background: '#E60000' }}>إضافة المنتج</motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Product search */}
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                <Search size={16} color={isDark ? '#555' : '#AAA'} />
                <input type="text" placeholder="بحث في المنتجات..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="flex-1 bg-transparent outline-none text-sm" style={{ color: isDark ? '#FFF' : '#1a1a1a' }} />
              </div>

              {/* Products grouped by provider */}
              {providers.map((provider) => {
                const providerProducts = packages.filter(p => p.providerId === provider.id && (!productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase())));
                if (providerProducts.length === 0) return null;
                return (
                  <div key={provider.id} className="rounded-2xl overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                    <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)' }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${provider.color}18` }}>
                        {provider.icon && provider.icon.startsWith('data:') ? (
                          <img src={provider.icon} alt={provider.name} className="w-6 h-6 rounded object-cover" />
                        ) : <span className="font-bold text-xs" style={{ color: provider.color }}>{provider.name.charAt(0)}</span>}
                      </div>
                      <span className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{provider.name}</span>
                      <span className="text-[10px] mr-auto" style={{ color: isDark ? '#666' : '#AAA' }}>{providerProducts.length} منتج</span>
                    </div>
                    {providerProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: index < providerProducts.length - 1 ? (isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)') : 'none' }}>
                        <div>
                          {editingProduct === product.id ? (
                            <div className="flex items-center gap-2">
                              <input type="text" value={editProductData.name} onChange={e => setEditProductData({ ...editProductData, name: e.target.value })} className="px-2 py-1 rounded text-xs outline-none w-28" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: isDark ? '#FFF' : '#1a1a1a' }} />
                              <input type="number" value={editProductData.price} onChange={e => setEditProductData({ ...editProductData, price: parseFloat(e.target.value) || 0 })} className="px-2 py-1 rounded text-xs outline-none w-16" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: isDark ? '#FFF' : '#1a1a1a' }} dir="ltr" />
                              <button onClick={() => { updatePackage(product.id, { name: editProductData.name, price: editProductData.price }); try { update(ref(database, `packages/${product.id}`), { name: editProductData.name, price: editProductData.price }); } catch {} setEditingProduct(null); }}><Save size={14} color="#10B981" /></button>
                              <button onClick={() => setEditingProduct(null)}><X size={14} color="#E60000" /></button>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{product.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-bold" style={{ color: '#E60000' }}>{product.price.toLocaleString()} {currencySymbols[product.currency]}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: product.executionType === 'manual' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', color: product.executionType === 'manual' ? '#F59E0B' : '#10B981' }}>
                                  {product.executionType === 'manual' ? 'يدوي' : 'تلقائي'}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                        {editingProduct !== product.id && (
                          <div className="flex items-center gap-3">
                            <button onClick={() => { setEditingProduct(product.id); setEditProductData({ name: product.name, price: product.price }); }}><Edit3 size={12} color={isDark ? '#888' : '#AAA'} /></button>
                            <button onClick={() => handleToggleProduct(product.id)}>
                              {product.isActive ? <ToggleRight size={22} color="#10B981" /> : <ToggleLeft size={22} color={isDark ? '#444' : '#CCC'} />}
                            </button>
                            <button onClick={() => handleDeleteProduct(product.id)}><Trash2 size={14} color="#E60000" /></button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
              {packages.length === 0 && (
                <div className="flex flex-col items-center py-8"><Package size={40} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} /><p className="text-sm mt-2" style={{ color: isDark ? '#666' : '#AAA' }}>لا توجد منتجات</p></div>
              )}
            </motion.div>
          )}

          {/* === PROVIDERS === */}
          {activeTab === 'providers' && (
            <motion.div key="providers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAddProvider(!showAddProvider)}
                className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium"
                style={{ background: 'rgba(230,0,0,0.1)', color: '#E60000', border: '1px solid rgba(230,0,0,0.2)', backdropFilter: 'blur(20px)' }}>
                <Plus size={18} strokeWidth={1.5} /><span>إضافة مزود خدمة</span>
              </motion.button>

              <AnimatePresence>
                {showAddProvider && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="rounded-2xl p-4 space-y-3 overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                    <input type="text" placeholder="اسم المزود" value={newProvider.name} onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: isDark ? '#FFF' : '#1a1a1a' }} />
                    <select value={newProvider.categoryId} onChange={(e) => setNewProvider({ ...newProvider, categoryId: e.target.value, inputLabel: e.target.value === 'telecom' ? 'رقم الهاتف' : 'Player ID', inputType: e.target.value === 'telecom' ? 'phone' : 'text', inputPrefix: e.target.value === 'telecom' ? '+967' : '' })} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: isDark ? '#FFF' : '#1a1a1a' }}>
                      <option value="telecom">الاتصالات والإنترنت</option><option value="games">الألعاب والبطاقات</option>
                    </select>
                    <div className="flex gap-2">
                      <input type="text" placeholder="تسمية الحقل" value={newProvider.inputLabel} onChange={(e) => setNewProvider({ ...newProvider, inputLabel: e.target.value })} className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: isDark ? '#FFF' : '#1a1a1a' }} />
                      <input type="text" placeholder="بادئة" value={newProvider.inputPrefix} onChange={(e) => setNewProvider({ ...newProvider, inputPrefix: e.target.value })} className="w-20 px-3 py-2.5 rounded-xl text-sm outline-none text-center" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: isDark ? '#FFF' : '#1a1a1a' }} dir="ltr" />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-xs" style={{ color: isDark ? '#AAA' : '#888' }}>اللون</label>
                      <input type="color" value={newProvider.color} onChange={(e) => setNewProvider({ ...newProvider, color: e.target.value })} className="w-10 h-8 rounded cursor-pointer" style={{ background: 'transparent' }} />
                    </div>
                    <div>
                      <input type="file" ref={fileInputRef} accept="image/*" onChange={(e) => handleIconUpload(e, 'provider')} className="hidden" />
                      <div className="flex items-center gap-3">
                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: isDark ? '#AAA' : '#888' }}>
                          <ImagePlus size={14} /><span>رفع أيقونة</span>
                        </button>
                        {newProvider.icon && <img src={newProvider.icon} alt="icon" className="w-8 h-8 rounded-lg object-cover" />}
                      </div>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={handleAddProvider} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ background: '#E60000' }}>إضافة المزود</motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {providers.map((provider) => (
                <div key={provider.id} className="rounded-2xl p-4" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {provider.icon && provider.icon.startsWith('data:') ? (
                        <img src={provider.icon} alt={provider.name} className="w-10 h-10 rounded-xl object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${provider.color}18` }}>
                          <span className="font-bold" style={{ color: provider.color }}>{provider.name.charAt(0)}</span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{provider.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${provider.color}15`, color: provider.color }}>{provider.categoryId === 'telecom' ? 'اتصالات' : 'ألعاب'}</span>
                          <span className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>{provider.inputLabel}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="file" id={`icon-${provider.id}`} accept="image/*" className="hidden" onChange={(e) => { setEditingProvider(provider.id); handleIconUpload(e, 'editProvider'); }} />
                      <button onClick={() => document.getElementById(`icon-${provider.id}`)?.click()} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${provider.color}12` }}>
                        <ImagePlus size={12} color={provider.color} />
                      </button>
                      <button onClick={() => handleToggleProvider(provider.id)}>
                        {provider.isActive ? <ToggleRight size={22} color="#10B981" /> : <ToggleLeft size={22} color={isDark ? '#444' : '#CCC'} />}
                      </button>
                      <button onClick={() => handleDeleteProvider(provider.id)}><Trash2 size={14} color="#E60000" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* === USERS === */}
          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
              {/* Total count */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs" style={{ color: isDark ? '#888' : '#888' }}>إجمالي المستخدمين: {firebaseUsers.length}</span>
              </div>
              {/* Search */}
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                <Search size={16} color={isDark ? '#555' : '#AAA'} />
                <input type="text" placeholder="ابحث بالاسم، البريد، الهاتف..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="flex-1 bg-transparent outline-none text-sm" style={{ color: isDark ? '#FFF' : '#1a1a1a' }} />
              </div>

              {filteredUsers.map((u) => {
                const kyc = kycStatusStyle[u.kycStatus] || kycStatusStyle.pending;
                return (
                  <div key={u.id} className="rounded-2xl p-4" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(230,0,0,0.1)' }}>
                          <span className="font-bold text-sm" style={{ color: '#E60000' }}>{u.name?.charAt(0) || '?'}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{u.name || 'بدون اسم'}</p>
                          <p className="text-[10px] dir-ltr" style={{ color: isDark ? '#666' : '#AAA' }} dir="ltr">{u.email}</p>
                          <p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>{u.phone}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', color: isDark ? '#AAA' : '#888' }} dir="ltr">{u.userId}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: kyc.bg, color: kyc.color }}>{kyc.label}</span>
                      </div>
                    </div>
                    {/* Balances */}
                    <div className="flex gap-2 mb-3">
                      {(['YER', 'SAR', 'USD'] as const).map(cur => (
                        <div key={cur} className="flex-1 p-2 rounded-xl text-center" style={{ background: `${currencyBadgeColors[cur]}12` }}>
                          <p className="text-[10px]" style={{ color: currencyBadgeColors[cur] }}>{currencySymbols[cur]}</p>
                          <p className="text-xs font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{formatNumber(u[`balance${cur}`] || 0)}</p>
                        </div>
                      ))}
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleToggleBlock(u)}
                        className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium ${u.isBlocked ? '' : ''}`}
                        style={{ background: u.isBlocked ? 'rgba(16,185,129,0.15)' : 'rgba(230,0,0,0.1)', color: u.isBlocked ? '#10B981' : '#E60000' }}>
                        {u.isBlocked ? <Unlock size={12} /> : <Lock size={12} />}
                        <span>{u.isBlocked ? 'إلغاء الحظر' : 'حظر'}</span>
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => setBalanceAdjustUser(balanceAdjustUser === u.id ? null : u.id)}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium"
                        style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}>
                        <DollarSign size={12} /><span>تعديل الرصيد</span>
                      </motion.button>
                    </div>
                    {/* Balance adjustment panel */}
                    <AnimatePresence>
                      {balanceAdjustUser === u.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3">
                          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                            <select value={balanceAction} onChange={e => setBalanceAction(e.target.value as 'add' | 'subtract')} className="px-2 py-1.5 rounded-lg text-xs outline-none" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: isDark ? '#FFF' : '#1a1a1a' }}>
                              <option value="add">إضافة</option><option value="subtract">خصم</option>
                            </select>
                            <input type="number" placeholder="المبلغ" value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} className="flex-1 px-2 py-1.5 rounded-lg text-xs outline-none" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: isDark ? '#FFF' : '#1a1a1a' }} dir="ltr" />
                            <select value={balanceCurrency} onChange={e => setBalanceCurrency(e.target.value as 'YER' | 'SAR' | 'USD')} className="px-2 py-1.5 rounded-lg text-xs outline-none" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: isDark ? '#FFF' : '#1a1a1a' }}>
                              <option value="YER">YER</option><option value="SAR">SAR</option><option value="USD">USD</option>
                            </select>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleBalanceAdjust(u)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: '#E60000' }}>تطبيق</motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
              {filteredUsers.length === 0 && (
                <div className="flex flex-col items-center py-8"><Users size={40} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} /><p className="text-sm mt-2" style={{ color: isDark ? '#666' : '#AAA' }}>لا يوجد مستخدمون</p></div>
              )}
            </motion.div>
          )}

          {/* === DEPOSIT === */}
          {activeTab === 'deposit' && (
            <motion.div key="deposit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
                  <button key={f} onClick={() => setDepositFilter(f)} className="px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap"
                    style={{ background: depositFilter === f ? 'rgba(230,0,0,0.2)' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)', color: depositFilter === f ? '#FFF' : isDark ? '#BBB' : '#666', border: depositFilter === f ? '1px solid rgba(230,0,0,0.3)' : isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                    {f === 'pending' ? 'قيد الانتظار' : f === 'approved' ? 'مقبول' : f === 'rejected' ? 'مرفوض' : 'الكل'}
                  </button>
                ))}
              </div>

              {depositRequests.filter(d => depositFilter === 'all' || d.status === depositFilter).map((dep) => {
                const s = statusStyles[dep.status] || statusStyles.pending;
                return (
                  <div key={dep.id} className="rounded-2xl p-4" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)', borderRight: dep.status === 'pending' ? '3px solid #F59E0B' : undefined }}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{dep.userName}</p>
                        <p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>{dep.method === 'bank_transfer' ? 'تحويل بنكي' : dep.method === 'cash' ? 'نقدي' : 'بطاقة'} - {timeAgo(dep.createdAt)}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold" style={{ color: '#E60000' }}>{dep.amount.toLocaleString()} {currencySymbols[dep.currency]}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                      </div>
                    </div>
                    {dep.receiptImage && (
                      <button onClick={() => setViewReceipt(dep.receiptImage)} className="flex items-center gap-1 mb-2 px-2 py-1 rounded-lg text-[10px]" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>
                        <ImageIcon size={10} /> عرض الإيصال
                      </button>
                    )}
                    {dep.status === 'pending' && (
                      <div className="flex gap-2">
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleApproveDeposit(dep)} className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: '#10B981' }}>
                          <CheckCircle2 size={14} /> قبول
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleRejectDeposit(dep)} className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-bold" style={{ background: 'rgba(230,0,0,0.1)', color: '#E60000' }}>
                          <XCircle size={14} /> رفض
                        </motion.button>
                      </div>
                    )}
                  </div>
                );
              })}
              {depositRequests.filter(d => depositFilter === 'all' || d.status === depositFilter).length === 0 && (
                <div className="flex flex-col items-center py-8"><Banknote size={40} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} /><p className="text-sm mt-2" style={{ color: isDark ? '#666' : '#AAA' }}>لا توجد طلبات إيداع</p></div>
              )}
            </motion.div>
          )}

          {/* === WITHDRAW === */}
          {activeTab === 'withdraw' && (
            <motion.div key="withdraw" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
                  <button key={f} onClick={() => setWithdrawFilter(f)} className="px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap"
                    style={{ background: withdrawFilter === f ? 'rgba(230,0,0,0.2)' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)', color: withdrawFilter === f ? '#FFF' : isDark ? '#BBB' : '#666', border: withdrawFilter === f ? '1px solid rgba(230,0,0,0.3)' : isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                    {f === 'pending' ? 'قيد الانتظار' : f === 'approved' ? 'مقبول' : f === 'rejected' ? 'مرفوض' : 'الكل'}
                  </button>
                ))}
              </div>

              {withdrawRequests.filter(w => withdrawFilter === 'all' || w.status === withdrawFilter).map((w) => {
                const s = statusStyles[w.status] || statusStyles.pending;
                return (
                  <div key={w.id} className="rounded-2xl p-4" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)', borderRight: w.status === 'pending' ? '3px solid #F59E0B' : undefined }}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{w.userName}</p>
                        <p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>{w.method === 'bank_transfer' ? 'تحويل بنكي' : 'نقدي'} - {timeAgo(w.createdAt)}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold" style={{ color: '#E60000' }}>{w.amount.toLocaleString()} {currencySymbols[w.currency]}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                      </div>
                    </div>
                    {w.bankDetails && (
                      <div className="p-2 rounded-lg mb-2" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                        <p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>تفاصيل البنك</p>
                        <p className="text-xs" style={{ color: isDark ? '#CCC' : '#333' }}>{w.bankDetails}</p>
                      </div>
                    )}
                    {w.status === 'pending' && (
                      <div className="flex gap-2">
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleApproveWithdraw(w)} className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: '#10B981' }}>
                          <CheckCircle2 size={14} /> قبول
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleRejectWithdraw(w)} className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-bold" style={{ background: 'rgba(230,0,0,0.1)', color: '#E60000' }}>
                          <XCircle size={14} /> رفض
                        </motion.button>
                      </div>
                    )}
                  </div>
                );
              })}
              {withdrawRequests.filter(w => withdrawFilter === 'all' || w.status === withdrawFilter).length === 0 && (
                <div className="flex flex-col items-center py-8"><Wallet size={40} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} /><p className="text-sm mt-2" style={{ color: isDark ? '#666' : '#AAA' }}>لا توجد طلبات سحب</p></div>
              )}
            </motion.div>
          )}

          {/* === KYC === */}
          {activeTab === 'kyc' && (
            <motion.div key="kyc" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <ShieldCheck size={16} color="#3B82F6" />
                <span className="text-xs" style={{ color: isDark ? '#888' : '#888' }}>طلبات التحقق: {kycUsers.length}</span>
              </div>

              {kycUsers.map((u) => (
                <div key={u.id} className="rounded-2xl p-4" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)', borderRight: '3px solid #3B82F6' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
                      <UserCheck size={18} color="#3B82F6" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{u.name}</p>
                      <p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>معرف: {u.userId}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {u.cardType && <div className="p-2 rounded-lg" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}><p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>نوع الوثيقة</p><p className="text-xs font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{u.cardType}</p></div>}
                    {u.cardNumber && <div className="p-2 rounded-lg" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}><p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>رقم الوثيقة</p><p className="text-xs font-medium" dir="ltr" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{u.cardNumber}</p></div>}
                    {u.governorate && <div className="p-2 rounded-lg" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}><p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>المحافظة</p><p className="text-xs font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{u.governorate}</p></div>}
                  </div>
                  <div className="flex gap-2 mb-3">
                    {u.idPhotoUrl && <button onClick={() => setViewKycPhoto({ type: 'id', url: u.idPhotoUrl! })} className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}><ImageIcon size={12} /> صورة الوثيقة</button>}
                    {u.selfieUrl && <button onClick={() => setViewKycPhoto({ type: 'selfie', url: u.selfieUrl! })} className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}><ImageIcon size={12} /> الصورة الشخصية</button>}
                  </div>
                  <div className="flex gap-2">
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleApproveKyc(u)} className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: '#10B981' }}>
                      <BadgeCheck size={14} /> توثيق
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleRejectKyc(u)} className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-bold" style={{ background: 'rgba(230,0,0,0.1)', color: '#E60000' }}>
                      <UserX size={14} /> رفض
                    </motion.button>
                  </div>
                  {/* Reject reason input */}
                  <div className="mt-2">
                    <input type="text" placeholder="سبب الرفض (اختياري)" value={kycRejectReason} onChange={e => setKycRejectReason(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs outline-none" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', color: isDark ? '#FFF' : '#1a1a1a' }} />
                  </div>
                </div>
              ))}
              {kycUsers.length === 0 && (
                <div className="flex flex-col items-center py-8"><ShieldCheck size={40} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} /><p className="text-sm mt-2" style={{ color: isDark ? '#666' : '#AAA' }}>لا توجد طلبات تحقق</p></div>
              )}
            </motion.div>
          )}

          {/* === PROMO CODES === */}
          {activeTab === 'codes' && (
            <motion.div key="codes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAddCode(!showAddCode)}
                className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium"
                style={{ background: 'rgba(230,0,0,0.1)', color: '#E60000', border: '1px solid rgba(230,0,0,0.2)', backdropFilter: 'blur(20px)' }}>
                <Plus size={18} strokeWidth={1.5} /><span>إضافة كود خصم</span>
              </motion.button>

              <AnimatePresence>
                {showAddCode && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="rounded-2xl p-4 space-y-3 overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                    <input type="text" placeholder="الكود" value={newCode.code} onChange={e => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-mono" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: isDark ? '#FFF' : '#1a1a1a' }} dir="ltr" />
                    <div className="flex gap-2">
                      <input type="number" placeholder="الخصم" value={newCode.discount || ''} onChange={e => setNewCode({ ...newCode, discount: parseFloat(e.target.value) || 0 })} className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: isDark ? '#FFF' : '#1a1a1a' }} dir="ltr" />
                      <select value={newCode.type} onChange={e => setNewCode({ ...newCode, type: e.target.value as 'percentage' | 'fixed' })} className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: isDark ? '#FFF' : '#1a1a1a' }}>
                        <option value="percentage">نسبة مئوية</option><option value="fixed">مبلغ ثابت</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <select value={newCode.currency} onChange={e => setNewCode({ ...newCode, currency: e.target.value as 'YER' | 'SAR' | 'USD' })} className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: isDark ? '#FFF' : '#1a1a1a' }}>
                        <option value="YER">YER</option><option value="SAR">SAR</option><option value="USD">USD</option>
                      </select>
                      <input type="number" placeholder="الحد الأقصى" value={newCode.maxUses || ''} onChange={e => setNewCode({ ...newCode, maxUses: parseInt(e.target.value) || 100 })} className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: isDark ? '#FFF' : '#1a1a1a' }} dir="ltr" />
                    </div>
                    <input type="date" value={newCode.expiresAt} onChange={e => setNewCode({ ...newCode, expiresAt: e.target.value })} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: isDark ? '#FFF' : '#1a1a1a' }} />
                    <motion.button whileTap={{ scale: 0.95 }} onClick={handleAddPromoCode} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ background: '#E60000' }}>إضافة الكود</motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {promoCodes.map((c) => (
                <div key={c.id} className="rounded-2xl p-4" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-mono font-bold" style={{ color: '#E60000' }} dir="ltr">{c.code}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(230,0,0,0.15)', color: '#E60000' }}>
                        {c.type === 'percentage' ? `${c.discount}%` : `${c.discount} ${currencySymbols[c.currency]}`}
                      </span>
                    </div>
                    <button onClick={() => handleTogglePromoCode(c)}>
                      {c.isActive ? <ToggleRight size={22} color="#10B981" /> : <ToggleLeft size={22} color={isDark ? '#444' : '#CCC'} />}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>{c.type === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت'}</span>
                    <span className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>استخدام: {c.usedCount}/{c.maxUses}</span>
                    {c.expiresAt && <span className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>ينتهي: {new Date(c.expiresAt).toLocaleDateString('ar-SA')}</span>}
                  </div>
                  {/* Usage bar */}
                  <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min((c.usedCount / c.maxUses) * 100, 100)}%`, background: '#E60000' }} />
                  </div>
                </div>
              ))}
              {promoCodes.length === 0 && (
                <div className="flex flex-col items-center py-8"><Tag size={40} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} /><p className="text-sm mt-2" style={{ color: isDark ? '#666' : '#AAA' }}>لا توجد أكواد خصم</p></div>
              )}
            </motion.div>
          )}

          {/* === SETTINGS === */}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
              {/* Admin info */}
              <div className="rounded-2xl p-5" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center glow-red" style={{ background: 'rgba(230,0,0,0.15)' }}>
                    <ShieldCheck size={24} strokeWidth={1.5} color="#E60000" />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>مدير النظام</p>
                    <p className="text-xs" style={{ color: isDark ? '#666' : '#AAA' }} dir="ltr">{user?.email}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)' }}>
                    <span className="text-xs" style={{ color: isDark ? '#AAA' : '#888' }}>الدور</span>
                    <span className="text-xs font-bold" style={{ color: '#E60000' }}>مدير</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs" style={{ color: isDark ? '#AAA' : '#888' }}>رقم الحساب</span>
                    <span className="text-xs font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }} dir="ltr">{user?.userId}</span>
                  </div>
                </div>
              </div>

              {/* System info */}
              <div className="rounded-2xl p-5" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                <h3 className="text-sm font-bold mb-3" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>معلومات النظام</h3>
                <div className="space-y-3">
                  {[
                    { icon: AlertTriangle, label: 'وضع التنفيذ', value: 'يدوي', color: '#F59E0B' },
                    { icon: Clock, label: 'متوسط وقت التنفيذ', value: '5-30 دقيقة', color: '#3B82F6' },
                    { icon: ShieldCheck, label: 'التحقق المطلوب', value: 'مفعّل', color: '#10B981' },
                    { icon: Bell, label: 'الإشعارات', value: 'مفعّلة', color: '#EC4899' },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <Icon size={14} strokeWidth={1.5} color={item.color} />
                          <span className="text-xs" style={{ color: isDark ? '#CCC' : '#666' }}>{item.label}</span>
                        </div>
                        <span className="text-xs font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{item.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Exchange rates */}
              <div className="rounded-2xl p-5" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={16} color="#E60000" />
                  <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>أسعار الصرف</h3>
                </div>
                <div className="space-y-2">
                  {(['YER', 'SAR', 'USD'] as const).map(cur => (
                    <div key={cur} className="flex items-center gap-3">
                      <span className="text-xs w-16 font-bold" style={{ color: currencyBadgeColors[cur] }}>{currencyNames[cur]}</span>
                      <input type="number" step="0.0001" value={exchangeRatesForm[cur]} onChange={e => setExchangeRatesForm({ ...exchangeRatesForm, [cur]: parseFloat(e.target.value) || 0 })} className="flex-1 px-3 py-2 rounded-xl text-xs outline-none" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: isDark ? '#FFF' : '#1a1a1a' }} dir="ltr" />
                    </div>
                  ))}
                  <motion.button whileTap={{ scale: 0.95 }} onClick={handleSaveRates} className="w-full py-2.5 rounded-xl text-xs font-bold text-white mt-2" style={{ background: '#E60000' }}>حفظ أسعار الصرف</motion.button>
                </div>
              </div>

              {/* Commission rates */}
              <div className="rounded-2xl p-5" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Percent size={16} color="#E60000" />
                  <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>نسبة العمولة</h3>
                </div>
                <div className="flex items-center gap-3">
                  <input type="number" value={commissionRate} onChange={e => setCommissionRate(e.target.value)} className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: isDark ? '#FFF' : '#1a1a1a' }} dir="ltr" />
                  <span className="text-xs" style={{ color: isDark ? '#AAA' : '#888' }}>%</span>
                </div>
              </div>

              {/* Bulk notification */}
              <div className="rounded-2xl p-5" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Send size={16} color="#E60000" />
                  <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>إرسال إشعار جماعي</h3>
                </div>
                <div className="space-y-2">
                  <input type="text" placeholder="عنوان الإشعار" value={bulkNotif.title} onChange={e => setBulkNotif({ ...bulkNotif, title: e.target.value })} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: isDark ? '#FFF' : '#1a1a1a' }} />
                  <textarea placeholder="نص الإشعار" value={bulkNotif.body} onChange={e => setBulkNotif({ ...bulkNotif, body: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: isDark ? '#FFF' : '#1a1a1a' }} />
                  <motion.button whileTap={{ scale: 0.95 }} onClick={handleSendBulkNotif} className="w-full py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: '#E60000' }}>إرسال لجميع المستخدمين ({firebaseUsers.length})</motion.button>
                </div>
              </div>

              {/* Audit log */}
              {auditLog.length > 0 && (
                <div className="rounded-2xl p-5" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={16} color="#E60000" />
                    <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>سجل العمليات</h3>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                    {auditLog.map((entry, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#E60000' }} />
                        <div className="flex-1">
                          <p className="text-xs" style={{ color: isDark ? '#CCC' : '#333' }}>{entry.action}</p>
                          <p className="text-[10px]" style={{ color: isDark ? '#555' : '#AAA' }}>{timeAgo(entry.time)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Receipt Modal */}
      <AnimatePresence>
        {viewReceipt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="w-full max-w-sm">
              <div className="rounded-2xl overflow-hidden" style={{ background: isDark ? '#1A1A1A' : '#FFF' }}>
                <div className="flex items-center justify-between p-4" style={{ borderBottom: isDark ? '1px solid #333' : '1px solid #EEE' }}>
                  <span className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>الإيصال</span>
                  <button onClick={() => setViewReceipt(null)}><X size={18} color={isDark ? '#FFF' : '#333'} /></button>
                </div>
                <div className="p-4">
                  {viewReceipt.startsWith('data:') ? (
                    <img src={viewReceipt} alt="receipt" className="w-full rounded-xl" />
                  ) : (
                    <img src={viewReceipt} alt="receipt" className="w-full rounded-xl" crossOrigin="anonymous" />
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KYC Photo Modal */}
      <AnimatePresence>
        {viewKycPhoto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="w-full max-w-sm">
              <div className="rounded-2xl overflow-hidden" style={{ background: isDark ? '#1A1A1A' : '#FFF' }}>
                <div className="flex items-center justify-between p-4" style={{ borderBottom: isDark ? '1px solid #333' : '1px solid #EEE' }}>
                  <span className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{viewKycPhoto.type === 'id' ? 'صورة الوثيقة' : 'الصورة الشخصية'}</span>
                  <button onClick={() => setViewKycPhoto(null)}><X size={18} color={isDark ? '#FFF' : '#333'} /></button>
                </div>
                <div className="p-4">
                  {viewKycPhoto.url.startsWith('data:') ? (
                    <img src={viewKycPhoto.url} alt="kyc" className="w-full rounded-xl" />
                  ) : (
                    <img src={viewKycPhoto.url} alt="kyc" className="w-full rounded-xl" crossOrigin="anonymous" />
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
