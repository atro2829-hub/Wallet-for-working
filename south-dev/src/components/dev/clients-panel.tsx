'use client';

import { useState } from 'react';
import { useDevStore, AppInstance } from '@/lib/store';
import { database } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import { motion } from 'framer-motion';
import {
  Users, Search, ArrowLeft, Mail, Phone, MapPin,
  CreditCard, Calendar, Copy, Edit3, Eye, DollarSign,
  Filter, UserPlus, TrendingUp, Package
} from 'lucide-react';
import {
  cn, currencySymbols, paymentStatusLabels, paymentStatusColors,
  formatDateAr, getSubscriptionStatus, subscriptionStatusLabels,
  subscriptionStatusColors, buildStatusLabels, buildStatusColors
} from '@/lib/utils';

interface ClientInfo {
  key: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  instances: AppInstance[];
  totalRevenue: Record<string, number>;
  totalPending: Record<string, number>;
}

export default function ClientsPanel() {
  const { instances, setInstances, setActivePanel } = useDevStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [subFilter, setSubFilter] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<ClientInfo | null>(null);
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', address: '' });

  // Build client list from instances
  const clientMap = new Map<string, ClientInfo>();

  instances.forEach(inst => {
    const key = (inst.clientEmail || inst.clientPhone || inst.clientName || inst.id).toLowerCase().trim();
    if (!key) return;

    if (!clientMap.has(key)) {
      clientMap.set(key, {
        key,
        name: inst.clientName || '',
        email: inst.clientEmail || '',
        phone: inst.clientPhone || '',
        address: inst.clientAddress || '',
        instances: [],
        totalRevenue: {},
        totalPending: {},
      });
    }

    const client = clientMap.get(key)!;
    client.instances.push(inst);

    if (inst.paymentStatus === 'paid') {
      const curr = inst.paymentCurrency;
      client.totalRevenue[curr] = (client.totalRevenue[curr] || 0) + inst.paymentAmount;
    }
    if (inst.paymentStatus === 'pending') {
      const curr = inst.paymentCurrency;
      client.totalPending[curr] = (client.totalPending[curr] || 0) + inst.paymentAmount;
    }
  });

  let clients = Array.from(clientMap.values());

  // Search filter
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    clients = clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q)
    );
  }

  // Subscription status filter
  if (subFilter !== 'all') {
    clients = clients.filter(c => {
      if (subFilter === 'active') {
        return c.instances.some(i => {
          if (!i.subscriptionEndDate) return false;
          return getSubscriptionStatus(i.subscriptionEndDate) === 'active';
        });
      }
      if (subFilter === 'expiring') {
        return c.instances.some(i => {
          if (!i.subscriptionEndDate) return false;
          return getSubscriptionStatus(i.subscriptionEndDate) === 'expiring_soon';
        });
      }
      if (subFilter === 'expired') {
        return c.instances.some(i => {
          if (!i.subscriptionEndDate) return false;
          return getSubscriptionStatus(i.subscriptionEndDate) === 'expired';
        });
      }
      if (subFilter === 'no_subscription') {
        return c.instances.every(i => !i.subscriptionEndDate);
      }
      return true;
    });
  }

  // Stats
  const totalClients = clients.length;
  const totalRevenueAll = clients.reduce((sum, c) => {
    Object.entries(c.totalRevenue).forEach(([curr, amt]) => {
      if (!sum[curr]) sum[curr] = 0;
      sum[curr] += amt;
    });
    return sum;
  }, {} as Record<string, number>);

  const handleEditClient = (client: ClientInfo) => {
    setEditForm({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
    });
    setEditingClientId(client.key);
  };

  const handleSaveClient = async () => {
    if (!editingClientId) return;
    try {
      const client = clients.find(c => c.key === editingClientId);
      if (!client) return;

      // Update all instances for this client
      for (const inst of client.instances) {
        await update(ref(database, `appInstances/${inst.id}`), {
          clientName: editForm.name,
          clientEmail: editForm.email,
          clientPhone: editForm.phone,
          clientAddress: editForm.address,
          updatedAt: new Date().toISOString(),
        });
        setInstances(instances.map(i =>
          i.id === inst.id
            ? { ...i, clientName: editForm.name, clientEmail: editForm.email, clientPhone: editForm.phone, clientAddress: editForm.address }
            : i
        ));
      }
      setEditingClientId(null);
      if (selectedClient?.key === editingClientId) {
        setSelectedClient({ ...selectedClient, name: editForm.name, email: editForm.email, phone: editForm.phone, address: editForm.address });
      }
    } catch (error) {
      console.error('Save client error:', error);
    }
  };

  // =========== DETAIL VIEW ===========
  if (view === 'detail' && selectedClient) {
    const client = selectedClient;
    return (
      <div className="space-y-4">
        <button onClick={() => { setView('list'); setSelectedClient(null); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> العودة للقائمة
        </button>

        {/* Client Header */}
        <div className="ios-card p-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-2xl shrink-0 shadow-lg">
              {client.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground">{client.name || 'بدون اسم'}</h2>
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                {client.email && (
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {client.email}</span>
                )}
                {client.phone && (
                  <span className="flex items-center gap-1" dir="ltr"><Phone className="w-3 h-3" /> {client.phone}</span>
                )}
                {client.address && (
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {client.address}</span>
                )}
              </div>
            </div>
          </div>

          {/* Edit Client */}
          <div className="mt-4 pt-4 border-t border-border/30">
            {editingClientId === client.key ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1 px-1">الاسم</label>
                    <input className="w-full h-11 px-4 rounded-xl bg-muted/30 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" value={editForm.name} onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1 px-1">البريد</label>
                    <input className="w-full h-11 px-4 rounded-xl bg-muted/30 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" value={editForm.email} onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))} dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1 px-1">الهاتف</label>
                    <input className="w-full h-11 px-4 rounded-xl bg-muted/30 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" value={editForm.phone} onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))} dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1 px-1">العنوان</label>
                    <input className="w-full h-11 px-4 rounded-xl bg-muted/30 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" value={editForm.address} onChange={e => setEditForm(prev => ({ ...prev, address: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveClient} className="px-4 py-2 bg-purple-500 text-white text-sm font-medium rounded-xl hover:bg-purple-600 transition-colors">حفظ</button>
                  <button onClick={() => setEditingClientId(null)} className="px-4 py-2 bg-muted/30 text-muted-foreground text-sm font-medium rounded-xl hover:bg-muted/50 transition-colors">إلغاء</button>
                </div>
              </div>
            ) : (
              <button onClick={() => handleEditClient(client)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-medium hover:bg-purple-500/20 transition-colors">
                <Edit3 className="w-3.5 h-3.5" /> تعديل معلومات العميل
              </button>
            )}
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="ios-card p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-500" /> ملخص الإيرادات
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">تم تحصيله</p>
              <div className="space-y-1">
                {Object.entries(client.totalRevenue).map(([curr, amt]) => (
                  <p key={curr} className="text-sm font-semibold text-green-600 dark:text-green-400">{amt.toLocaleString()} {currencySymbols[curr]}</p>
                ))}
                {Object.keys(client.totalRevenue).length === 0 && <p className="text-sm text-muted-foreground">—</p>}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">بانتظار التحصيل</p>
              <div className="space-y-1">
                {Object.entries(client.totalPending).map(([curr, amt]) => (
                  <p key={curr} className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">{amt.toLocaleString()} {currencySymbols[curr]}</p>
                ))}
                {Object.keys(client.totalPending).length === 0 && <p className="text-sm text-muted-foreground">—</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Client Instances */}
        <div>
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-purple-500" /> نسخ العميل ({client.instances.length})
          </h3>
          <div className="space-y-3">
            {client.instances.map(inst => {
              const subStatus = inst.subscriptionEndDate ? getSubscriptionStatus(inst.subscriptionEndDate) : null;
              return (
                <motion.div
                  key={inst.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="ios-card p-4 card-press"
                  onClick={() => setActivePanel('instances')}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ background: inst.primaryColor || '#6C3CE1' }}
                    >
                      {inst.appName?.charAt(0) || 'N'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-foreground truncate text-sm">{inst.appName || 'بدون اسم'}</h3>
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', paymentStatusColors[inst.paymentStatus])}>
                          {paymentStatusLabels[inst.paymentStatus]}
                        </span>
                        {subStatus && (
                          <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', subscriptionStatusColors[subStatus])}>
                            {subscriptionStatusLabels[subStatus]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground" dir="ltr">{inst.orderNumber}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {inst.paymentAmount > 0 && (
                          <span className="font-semibold text-foreground">{inst.paymentAmount.toLocaleString()} {currencySymbols[inst.paymentCurrency]}</span>
                        )}
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', buildStatusColors[inst.userAppBuildStatus])}>
                          {buildStatusLabels[inst.userAppBuildStatus]}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // =========== LIST VIEW ===========
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="ios-large-title text-foreground">العملاء</h1>
        <p className="text-muted-foreground text-sm mt-1">إدارة عملاء النسخ والمتابعة</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ios-card p-4">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center mb-2">
            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-xl font-bold text-foreground">{totalClients}</p>
          <p className="text-xs text-muted-foreground">إجمالي العملاء</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="ios-card p-4">
          <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center mb-2">
            <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-xl font-bold text-foreground">
            {Object.entries(totalRevenueAll).map(([c, a]) => `${a.toLocaleString()} ${currencySymbols[c]}`).join(' + ') || '0'}
          </p>
          <p className="text-xs text-muted-foreground">إجمالي الإيرادات</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="ios-card p-4">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center mb-2">
            <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-xl font-bold text-foreground">{instances.length}</p>
          <p className="text-xs text-muted-foreground">إجمالي النسخ</p>
        </motion.div>
      </div>

      {/* Search & Filter */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم أو البريد أو الهاتف..."
              className="w-full h-11 pr-10 pl-4 rounded-2xl bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all text-sm"
            />
          </div>
          <select
            value={subFilter}
            onChange={(e) => setSubFilter(e.target.value)}
            className="h-11 px-4 rounded-2xl bg-muted/30 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          >
            <option value="all">الكل</option>
            <option value="active">اشتراك نشط</option>
            <option value="expiring">ينتهي قريباً</option>
            <option value="expired">منتهي</option>
            <option value="no_subscription">بدون اشتراك</option>
          </select>
        </div>
      </div>

      {/* Clients List */}
      {clients.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg font-medium">لا يوجد عملاء</p>
          <p className="text-muted-foreground/60 text-sm mt-1">سيظهر العملاء هنا عند إنشاء نسخ ببيانات عميل</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map(client => (
            <motion.div
              key={client.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="ios-card p-4 card-press"
              onClick={() => { setSelectedClient(client); setView('detail'); }}
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {client.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm">{client.name || 'بدون اسم'}</h3>
                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                    {client.email && (
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {client.email}</span>
                    )}
                    {client.phone && (
                      <span className="flex items-center gap-1" dir="ltr"><Phone className="w-3 h-3" /> {client.phone}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full font-medium">
                      {client.instances.length} نسخة
                    </span>
                    {Object.entries(client.totalRevenue).map(([curr, amt]) => (
                      <span key={curr} className="text-xs font-semibold text-green-600 dark:text-green-400">
                        {amt.toLocaleString()} {currencySymbols[curr]}
                      </span>
                    ))}
                    {client.instances.some(i => i.subscriptionEndDate && getSubscriptionStatus(i.subscriptionEndDate) === 'expiring_soon') && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-orange-500/10 text-orange-600 dark:text-orange-400">اشتراك ينتهي</span>
                    )}
                    {client.instances.some(i => i.subscriptionEndDate && getSubscriptionStatus(i.subscriptionEndDate) === 'expired') && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-500/10 text-red-600 dark:text-red-400">اشتراك منتهي</span>
                    )}
                  </div>
                </div>
                <Eye className="w-4 h-4 text-muted-foreground/50 shrink-0 mt-1" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
