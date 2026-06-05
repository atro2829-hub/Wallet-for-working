'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  ArrowLeftRight,
  ShieldCheck,
  Package,
  TrendingUp,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  DollarSign,
  ArrowLeft,
  Search,
  Bell,
  Mail,
  MapPin,
  Hash,
  BarChart3,
  Settings,
  Clock,
  CreditCard,
  Phone,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Gamepad2,
  Gift,
  Wifi,
  ImagePlus,
  RotateCcw,
  AlertTriangle,
  ShoppingBag,
  Eye,
  EyeOff,
  Filter,
} from 'lucide-react';
import { useAppStore, type ServiceProvider, type ProductPackage, type Order } from '@/lib/store';
import { currencySymbols, currencyBadgeColors, generateReference } from '@/lib/utils';
import { ref, set, get, update, remove, push, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';

type AdminTab = 'overview' | 'orders' | 'products' | 'providers' | 'users' | 'settings';

export default function AdminScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { setActiveScreen, user, orders, updateOrderStatus, providers, setProviders, packages, setPackages, addPackage, updatePackage } = useAppStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');

  // Product form
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: 0, currency: 'YER' as 'YER' | 'SAR' | 'USD', providerId: '', executionType: 'manual' as 'manual' | 'auto' });
  const [editingProduct, setEditingProduct] = useState<string | null>(null);

  // Provider form
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [newProvider, setNewProvider] = useState({ name: '', color: '#E60000', categoryId: 'telecom', inputLabel: 'رقم الهاتف', inputType: 'phone' as 'phone' | 'text', inputPrefix: '+967', icon: '' });
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Firebase data
  const [firebaseOrders, setFirebaseOrders] = useState<Order[]>([]);
  const [statsData, setStatsData] = useState({ totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalRevenue: 0 });

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
        const revenue = ordersList.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.amount, 0);
        setStatsData({ totalOrders: ordersList.length, pendingOrders: pending, completedOrders: completed, totalRevenue: revenue });
      }
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

  const handleCompleteOrder = async (order: Order) => {
    updateOrderStatus(order.id, 'completed');
    try {
      await update(ref(database, `orders/${order.id}`), { status: 'completed', completedAt: new Date().toISOString() });
      // Notify user
      const notifId = generateReference();
      await set(ref(database, `notifications/${order.userId}/${notifId}`), {
        id: notifId,
        title: 'تم تنفيذ الطلب',
        body: `تم تنفيذ طلبك ${order.packageName} بنجاح`,
        type: 'transaction',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    } catch {}
  };

  const handleCancelOrder = async (order: Order) => {
    updateOrderStatus(order.id, 'cancelled');
    try {
      await update(ref(database, `orders/${order.id}`), { status: 'cancelled' });
      // Refund user
      const userRef = ref(database, `users/${order.userId}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const userData = snapshot.val();
        const balanceField = `balance${order.currency}`;
        const currentBalance = userData[balanceField] || 0;
        await update(userRef, { [balanceField]: currentBalance + order.amount });
      }
      // Notify user
      const notifId = generateReference();
      await set(ref(database, `notifications/${order.userId}/${notifId}`), {
        id: notifId,
        title: 'تم إلغاء الطلب',
        body: `تم إلغاء طلبك ${order.packageName} وإعادة المبلغ لرصيدك`,
        type: 'info',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    } catch {}
  };

  // Handle icon upload as base64
  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'provider' | 'editProvider') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (target === 'provider') {
        setNewProvider(prev => ({ ...prev, icon: base64 }));
      } else if (target === 'editProvider') {
        // Update provider icon
        setProviders(providers.map(p =>
          p.id === editingProvider ? { ...p, icon: base64 } : p
        ));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddProvider = () => {
    if (!newProvider.name) return;
    const id = newProvider.nameEn || newProvider.name.replace(/\s/g, '-').toLowerCase();
    const provider: ServiceProvider = {
      id,
      categoryId: newProvider.categoryId,
      name: newProvider.name,
      color: newProvider.color,
      icon: newProvider.icon,
      isActive: true,
      inputLabel: newProvider.inputLabel,
      inputType: newProvider.inputType,
      inputPrefix: newProvider.inputPrefix,
    };
    setProviders([...providers, provider]);
    // Save to Firebase
    try {
      set(ref(database, `providers/${id}`), provider);
    } catch {}
    setNewProvider({ name: '', color: '#E60000', categoryId: 'telecom', inputLabel: 'رقم الهاتف', inputType: 'phone', inputPrefix: '+967', icon: '' });
    setShowAddProvider(false);
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.providerId || newProduct.price <= 0) return;
    const id = generateReference();
    const pkg: ProductPackage = {
      id,
      providerId: newProduct.providerId,
      name: newProduct.name,
      price: newProduct.price,
      currency: newProduct.currency,
      executionType: newProduct.executionType,
      isActive: true,
    };
    addPackage(pkg);
    try {
      set(ref(database, `packages/${id}`), pkg);
    } catch {}
    setNewProduct({ name: '', price: 0, currency: 'YER', providerId: '', executionType: 'manual' });
    setShowAddProduct(false);
  };

  const handleToggleProduct = (id: string) => {
    const pkg = packages.find(p => p.id === id);
    if (pkg) {
      updatePackage(id, { isActive: !pkg.isActive });
      try {
        update(ref(database, `packages/${id}`), { isActive: !pkg.isActive });
      } catch {}
    }
  };

  const handleDeleteProduct = (id: string) => {
    setPackages(packages.filter(p => p.id !== id));
    try {
      remove(ref(database, `packages/${id}`));
    } catch {}
  };

  const handleToggleProvider = (id: string) => {
    const provider = providers.find(p => p.id === id);
    if (provider) {
      setProviders(providers.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
      try {
        update(ref(database, `providers/${id}`), { isActive: !provider.isActive });
      } catch {}
    }
  };

  const handleDeleteProvider = (id: string) => {
    setProviders(providers.filter(p => p.id !== id));
    try {
      remove(ref(database, `providers/${id}`));
    } catch {}
  };

  const cardBg = isDark ? '#1A1A1A' : '#FFFFFF';
  const inputBg = isDark ? '#222' : '#F8F8F8';
  const borderColor = isDark ? '#333' : '#EEE';
  const cardShadow = '0 2px 8px rgba(0,0,0,0.04)';

  const tabs: { id: AdminTab; label: string; icon: typeof BarChart3; badge?: number }[] = [
    { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
    { id: 'orders', label: 'الطلبات', icon: ShoppingBag, badge: pendingOrders.length },
    { id: 'products', label: 'المنتجات', icon: Package },
    { id: 'providers', label: 'المزودون', icon: Smartphone },
    { id: 'users', label: 'المستخدمون', icon: Users },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  const statCards = [
    { label: 'إجمالي الطلبات', value: statsData.totalOrders, icon: ShoppingBag, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
    { label: 'طلبات قيد الانتظار', value: statsData.pendingOrders, icon: Clock, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
    { label: 'طلبات مكتملة', value: statsData.completedOrders, icon: CheckCircle2, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'الإيرادات (ر.ي)', value: statsData.totalRevenue, icon: DollarSign, color: '#E60000', bg: 'rgba(230,0,0,0.1)' },
  ];

  const orderStatusStyles: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B', label: 'قيد الانتظار' },
    completed: { bg: 'rgba(16,185,129,0.15)', color: '#10B981', label: 'مكتمل' },
    cancelled: { bg: 'rgba(230,0,0,0.15)', color: '#E60000', label: 'ملغى' },
    refunded: { bg: 'rgba(59,130,246,0.15)', color: '#3B82F6', label: 'مسترد' },
  };

  return (
    <div className="min-h-screen" style={{ background: isDark ? '#0F0F0F' : '#F5F5F5' }}>
      {/* Header */}
      <div className="px-5 pt-4 pb-5" style={{ background: 'linear-gradient(145deg, #1A1A1A 0%, #0F0F0F 100%)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveScreen('main')} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <ArrowLeft size={16} strokeWidth={1.5} color="#FFF" />
          </button>
          <div className="flex-1">
            <h1 className="text-white text-xl font-bold">لوحة التحكم</h1>
            <p className="text-white/40 text-xs">إدارة محفظة فهد نت</p>
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(230,0,0,0.2)' }}>
            <ShieldCheck size={18} strokeWidth={1.5} color="#E60000" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mt-3">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all relative"
                style={{
                  background: isActive ? '#E60000' : isDark ? '#1E1E1E' : '#FFF',
                  color: isActive ? '#FFF' : isDark ? '#BBB' : '#666',
                  boxShadow: isActive ? '0 4px 12px rgba(230,0,0,0.3)' : cardShadow,
                }}
              >
                <Icon size={14} strokeWidth={1.5} />
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-yellow-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </button>
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
              <div className="grid grid-cols-2 gap-3">
                {statCards.map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="rounded-2xl p-4" style={{ background: cardBg, boxShadow: cardShadow }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
                          <Icon size={20} strokeWidth={1.5} color={stat.color} />
                        </div>
                      </div>
                      <p className="text-2xl font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{stat.value.toLocaleString()}</p>
                      <p className="text-xs mt-0.5" style={{ color: isDark ? '#666' : '#AAA' }}>{stat.label}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Recent Pending Orders */}
              {pendingOrders.length > 0 && (
                <div className="rounded-2xl p-4" style={{ background: cardBg, boxShadow: cardShadow }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>طلبات بانتظار التنفيذ</h3>
                    <button onClick={() => setActiveTab('orders')} className="text-xs font-medium" style={{ color: '#E60000' }}>عرض الكل</button>
                  </div>
                  <div className="space-y-2">
                    {pendingOrders.slice(0, 3).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: isDark ? '#222' : '#F8F8F8' }}>
                        <div>
                          <p className="text-xs font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{order.packageName}</p>
                          <p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>{order.userName} - {order.customerInput}</p>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => handleCompleteOrder(order)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
                            <CheckCircle2 size={14} color="#10B981" />
                          </button>
                          <button onClick={() => handleCancelOrder(order)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(230,0,0,0.15)' }}>
                            <XCircle size={14} color="#E60000" />
                          </button>
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
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl" style={{ background: cardBg, boxShadow: cardShadow }}>
                <Search size={18} strokeWidth={1.5} color={isDark ? '#555' : '#AAA'} />
                <input type="text" placeholder="ابحث بالاسم، الرقم، الخدمة..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-transparent outline-none text-sm" style={{ color: isDark ? '#FFF' : '#1a1a1a' }} />
              </div>

              {/* Filter */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {(['all', 'pending', 'completed', 'cancelled'] as const).map((filter) => (
                  <button key={filter} onClick={() => setOrderFilter(filter)} className="px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap" style={{ background: orderFilter === filter ? '#E60000' : isDark ? '#1E1E1E' : '#FFF', color: orderFilter === filter ? '#FFF' : isDark ? '#BBB' : '#666', boxShadow: orderFilter === filter ? '0 2px 8px rgba(230,0,0,0.25)' : cardShadow }}>
                    {filter === 'all' ? 'الكل' : filter === 'pending' ? 'قيد الانتظار' : filter === 'completed' ? 'مكتمل' : 'ملغى'}
                  </button>
                ))}
              </div>

              {/* Orders List */}
              {filteredOrders.map((order) => {
                const statusStyle = orderStatusStyles[order.status] || orderStatusStyles.pending;
                return (
                  <div key={order.id} className="rounded-2xl overflow-hidden" style={{ background: cardBg, boxShadow: order.status === 'pending' ? `0 0 0 2px #F59E0B40, ${cardShadow}` : cardShadow }}>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{order.packageName}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: statusStyle.bg, color: statusStyle.color }}>{statusStyle.label}</span>
                          </div>
                          <p className="text-xs" style={{ color: isDark ? '#888' : '#AAA' }}>{order.providerName}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold" style={{ color: '#E60000' }}>{order.amount.toLocaleString()} {currencySymbols[order.currency]}</p>
                          <p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>{new Date(order.createdAt).toLocaleDateString('ar-SA')}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-3 p-2.5 rounded-xl" style={{ background: isDark ? '#222' : '#F8F8F8' }}>
                        <div>
                          <p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>العميل</p>
                          <p className="text-xs font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{order.userName}</p>
                        </div>
                        <div className="w-px h-6" style={{ background: borderColor }} />
                        <div>
                          <p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>الرقم/المعرف</p>
                          <p className="text-xs font-medium" dir="ltr" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{order.customerInput}</p>
                        </div>
                        <div className="w-px h-6" style={{ background: borderColor }} />
                        <div>
                          <p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>النوع</p>
                          <p className="text-xs font-medium" style={{ color: order.executionType === 'manual' ? '#F59E0B' : '#10B981' }}>{order.executionType === 'manual' ? 'يدوي' : 'تلقائي'}</p>
                        </div>
                      </div>

                      {order.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleCompleteOrder(order)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: '#10B981' }}>
                            <CheckCircle2 size={14} /> تم الشحن
                          </button>
                          <button onClick={() => handleCancelOrder(order)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold" style={{ background: 'rgba(230,0,0,0.1)', color: '#E60000' }}>
                            <RotateCcw size={14} /> إلغاء وإعادة
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredOrders.length === 0 && (
                <div className="flex flex-col items-center py-8">
                  <ShoppingBag size={40} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} />
                  <p className="text-sm mt-2" style={{ color: isDark ? '#666' : '#AAA' }}>لا توجد طلبات</p>
                </div>
              )}
            </motion.div>
          )}

          {/* === PRODUCTS === */}
          {activeTab === 'products' && (
            <motion.div key="products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
              <button onClick={() => setShowAddProduct(!showAddProduct)} className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium" style={{ background: cardBg, color: '#E60000', boxShadow: cardShadow }}>
                <Plus size={18} strokeWidth={1.5} />
                <span>إضافة منتج جديد</span>
              </button>

              <AnimatePresence>
                {showAddProduct && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="rounded-2xl p-4 space-y-3 overflow-hidden" style={{ background: cardBg, boxShadow: cardShadow }}>
                    <select value={newProduct.providerId} onChange={(e) => setNewProduct({ ...newProduct, providerId: e.target.value })} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: inputBg, color: isDark ? '#FFF' : '#1a1a1a' }}>
                      <option value="">اختر المزود</option>
                      {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input type="text" placeholder="اسم المنتج" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: inputBg, color: isDark ? '#FFF' : '#1a1a1a' }} />
                    <div className="flex gap-2">
                      <input type="number" placeholder="السعر" value={newProduct.price || ''} onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })} className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: inputBg, color: isDark ? '#FFF' : '#1a1a1a' }} dir="ltr" />
                      <select value={newProduct.currency} onChange={(e) => setNewProduct({ ...newProduct, currency: e.target.value as 'YER' | 'SAR' | 'USD' })} className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: inputBg, color: isDark ? '#FFF' : '#1a1a1a' }}>
                        <option value="YER">YER</option><option value="SAR">SAR</option><option value="USD">USD</option>
                      </select>
                    </div>
                    <select value={newProduct.executionType} onChange={(e) => setNewProduct({ ...newProduct, executionType: e.target.value as 'manual' | 'auto' })} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: inputBg, color: isDark ? '#FFF' : '#1a1a1a' }}>
                      <option value="manual">تنفيذ يدوي</option>
                      <option value="auto">تنفيذ تلقائي (ربط مستقبلي)</option>
                    </select>
                    <button onClick={handleAddProduct} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ background: '#E60000' }}>إضافة المنتج</button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Products grouped by provider */}
              {providers.map((provider) => {
                const providerProducts = packages.filter(p => p.providerId === provider.id);
                if (providerProducts.length === 0) return null;

                return (
                  <div key={provider.id} className="rounded-2xl overflow-hidden" style={{ background: cardBg, boxShadow: cardShadow }}>
                    <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${borderColor}` }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${provider.color}18` }}>
                        {provider.icon && provider.icon.startsWith('data:') ? (
                          <img src={provider.icon} alt={provider.name} className="w-6 h-6 rounded object-cover" />
                        ) : (
                          <span className="font-bold text-xs" style={{ color: provider.color }}>{provider.name.charAt(0)}</span>
                        )}
                      </div>
                      <span className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{provider.name}</span>
                      <span className="text-[10px] mr-auto" style={{ color: isDark ? '#666' : '#AAA' }}>{providerProducts.length} منتج</span>
                    </div>
                    {providerProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: index < providerProducts.length - 1 ? `1px solid ${borderColor}` : 'none' }}>
                        <div>
                          <p className="text-sm font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{product.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-bold" style={{ color: '#E60000' }}>{product.price.toLocaleString()} {currencySymbols[product.currency]}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: product.executionType === 'manual' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', color: product.executionType === 'manual' ? '#F59E0B' : '#10B981' }}>
                              {product.executionType === 'manual' ? 'يدوي' : 'تلقائي'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => handleToggleProduct(product.id)}>
                            {product.isActive ? <ToggleRight size={22} color="#10B981" /> : <ToggleLeft size={22} color={isDark ? '#444' : '#CCC'} />}
                          </button>
                          <button onClick={() => handleDeleteProduct(product.id)}>
                            <Trash2 size={14} color="#E60000" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}

              {packages.length === 0 && (
                <div className="flex flex-col items-center py-8">
                  <Package size={40} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} />
                  <p className="text-sm mt-2" style={{ color: isDark ? '#666' : '#AAA' }}>لا توجد منتجات</p>
                </div>
              )}
            </motion.div>
          )}

          {/* === PROVIDERS === */}
          {activeTab === 'providers' && (
            <motion.div key="providers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
              <button onClick={() => setShowAddProvider(!showAddProvider)} className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium" style={{ background: cardBg, color: '#E60000', boxShadow: cardShadow }}>
                <Plus size={18} strokeWidth={1.5} />
                <span>إضافة مزود خدمة</span>
              </button>

              <AnimatePresence>
                {showAddProvider && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="rounded-2xl p-4 space-y-3 overflow-hidden" style={{ background: cardBg, boxShadow: cardShadow }}>
                    <input type="text" placeholder="اسم المزود" value={newProvider.name} onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: inputBg, color: isDark ? '#FFF' : '#1a1a1a' }} />
                    <select value={newProvider.categoryId} onChange={(e) => setNewProvider({ ...newProvider, categoryId: e.target.value, inputLabel: e.target.value === 'telecom' ? 'رقم الهاتف' : 'Player ID', inputType: e.target.value === 'telecom' ? 'phone' : 'text', inputPrefix: e.target.value === 'telecom' ? '+967' : '' })} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: inputBg, color: isDark ? '#FFF' : '#1a1a1a' }}>
                      <option value="telecom">الاتصالات والإنترنت</option>
                      <option value="games">الألعاب والبطاقات</option>
                    </select>
                    <div className="flex gap-2">
                      <input type="text" placeholder="تسمية الحقل" value={newProvider.inputLabel} onChange={(e) => setNewProvider({ ...newProvider, inputLabel: e.target.value })} className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: inputBg, color: isDark ? '#FFF' : '#1a1a1a' }} />
                      <input type="text" placeholder="بادئة" value={newProvider.inputPrefix} onChange={(e) => setNewProvider({ ...newProvider, inputPrefix: e.target.value })} className="w-20 px-3 py-2.5 rounded-xl text-sm outline-none text-center" style={{ background: inputBg, color: isDark ? '#FFF' : '#1a1a1a' }} dir="ltr" />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-xs" style={{ color: isDark ? '#AAA' : '#888' }}>اللون</label>
                      <input type="color" value={newProvider.color} onChange={(e) => setNewProvider({ ...newProvider, color: e.target.value })} className="w-10 h-8 rounded cursor-pointer" style={{ background: 'transparent' }} />
                    </div>
                    {/* Icon upload */}
                    <div>
                      <input type="file" ref={fileInputRef} accept="image/*" onChange={(e) => handleIconUpload(e, 'provider')} className="hidden" />
                      <div className="flex items-center gap-3">
                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={{ background: inputBg, color: isDark ? '#AAA' : '#888' }}>
                          <ImagePlus size={14} />
                          <span>رفع أيقونة</span>
                        </button>
                        {newProvider.icon && (
                          <img src={newProvider.icon} alt="icon" className="w-8 h-8 rounded-lg object-cover" />
                        )}
                      </div>
                    </div>
                    <button onClick={handleAddProvider} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ background: '#E60000' }}>إضافة المزود</button>
                  </motion.div>
                )}
              </AnimatePresence>

              {providers.map((provider) => (
                <div key={provider.id} className="rounded-2xl p-4" style={{ background: cardBg, boxShadow: cardShadow }}>
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
                          <span className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>{provider.categoryId === 'telecom' ? 'اتصالات' : 'ألعاب'}</span>
                          <span className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>{provider.inputLabel}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Edit icon */}
                      <input type="file" id={`icon-${provider.id}`} accept="image/*" className="hidden" onChange={(e) => {
                        setEditingProvider(provider.id);
                        handleIconUpload(e, 'editProvider');
                      }} />
                      <button onClick={() => document.getElementById(`icon-${provider.id}`)?.click()} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${provider.color}12` }}>
                        <ImagePlus size={12} color={provider.color} />
                      </button>
                      <button onClick={() => handleToggleProvider(provider.id)}>
                        {provider.isActive ? <ToggleRight size={22} color="#10B981" /> : <ToggleLeft size={22} color={isDark ? '#444' : '#CCC'} />}
                      </button>
                      <button onClick={() => handleDeleteProvider(provider.id)}>
                        <Trash2 size={14} color="#E60000" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* === USERS === */}
          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
              <div className="rounded-2xl p-5" style={{ background: cardBg, boxShadow: cardShadow }}>
                <p className="text-sm" style={{ color: isDark ? '#AAA' : '#888' }}>إدارة المستخدمين متاحة من خلال Firebase Console</p>
                <p className="text-xs mt-1" style={{ color: isDark ? '#666' : '#AAA' }}>يمكنك إدارة المستخدمين والأرصدة مباشرة من Firebase Realtime Database</p>
              </div>
            </motion.div>
          )}

          {/* === SETTINGS === */}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
              <div className="rounded-2xl p-5" style={{ background: cardBg, boxShadow: cardShadow }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(230,0,0,0.1)' }}>
                    <ShieldCheck size={24} strokeWidth={1.5} color="#E60000" />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>مدير النظام</p>
                    <p className="text-xs" style={{ color: isDark ? '#666' : '#AAA' }} dir="ltr">{user?.email}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${borderColor}` }}>
                    <span className="text-xs" style={{ color: isDark ? '#AAA' : '#888' }}>الدور</span>
                    <span className="text-xs font-bold" style={{ color: '#E60000' }}>مدير</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs" style={{ color: isDark ? '#AAA' : '#888' }}>رقم الحساب</span>
                    <span className="text-xs font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }} dir="ltr">{user?.userId}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-5" style={{ background: cardBg, boxShadow: cardShadow }}>
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
