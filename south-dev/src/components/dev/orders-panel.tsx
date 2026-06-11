'use client';

import { useState } from 'react';
import { useDevStore, AppInstance } from '@/lib/store';
import { database } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import { motion } from 'framer-motion';
import {
  ShoppingCart, Search, Clock, CheckCircle,
  XCircle, DollarSign, Copy, ArrowLeft,
  Download, Calendar, Filter, RefreshCw, Eye,
  CreditCard, TrendingUp
} from 'lucide-react';
import {
  cn, currencySymbols, paymentStatusLabels, paymentStatusColors,
  formatDateAr, buildStatusLabels, getSubscriptionStatus,
  subscriptionStatusLabels, subscriptionStatusColors
} from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function OrdersPanel() {
  const { instances, setInstances, addNotification } = useDevStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<AppInstance | null>(null);
  const [view, setView] = useState<'list' | 'detail'>('list');

  const ordersWithPayments = instances.filter(i => i.paymentAmount > 0 || i.paymentStatus !== 'pending' || i.orderNumber);

  const filteredOrders = ordersWithPayments.filter(i => {
    const matchSearch = !searchQuery ||
      i.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.appName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus = statusFilter === 'all' || i.paymentStatus === statusFilter;

    let matchDate = true;
    if (dateFrom) {
      const from = new Date(dateFrom);
      const orderDate = new Date(i.orderDate || i.createdAt);
      matchDate = orderDate >= from;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59);
      const orderDate = new Date(i.orderDate || i.createdAt);
      matchDate = matchDate && orderDate <= to;
    }

    return matchSearch && matchStatus && matchDate;
  });

  const totalPaid = ordersWithPayments
    .filter(i => i.paymentStatus === 'paid')
    .reduce((acc, i) => {
      const key = i.paymentCurrency;
      if (!acc[key]) acc[key] = 0;
      acc[key] += i.paymentAmount;
      return acc;
    }, {} as Record<string, number>);

  const totalPending = ordersWithPayments
    .filter(i => i.paymentStatus === 'pending')
    .reduce((acc, i) => {
      const key = i.paymentCurrency;
      if (!acc[key]) acc[key] = 0;
      acc[key] += i.paymentAmount;
      return acc;
    }, {} as Record<string, number>);

  const totalRefunded = ordersWithPayments
    .filter(i => i.paymentStatus === 'refunded')
    .reduce((acc, i) => {
      const key = i.paymentCurrency;
      if (!acc[key]) acc[key] = 0;
      acc[key] += i.paymentAmount;
      return acc;
    }, {} as Record<string, number>);

  // Revenue over time chart
  const revenueOverTime = (() => {
    const months: Record<string, { paid: number; pending: number }> = {};
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    ordersWithPayments.forEach(i => {
      const date = new Date(i.orderDate || i.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) months[key] = { paid: 0, pending: 0 };
      if (i.paymentStatus === 'paid') months[key].paid += i.paymentAmount;
      else if (i.paymentStatus === 'pending') months[key].pending += i.paymentAmount;
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, val]) => {
        const [y, m] = key.split('-');
        return {
          name: monthNames[parseInt(m) - 1],
          مدفوع: val.paid,
          معلق: val.pending,
        };
      });
  })();

  const stats = [
    { label: 'إجمالي الطلبات', value: ordersWithPayments.length, icon: ShoppingCart, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'مدفوعة', value: ordersWithPayments.filter(i => i.paymentStatus === 'paid').length, icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
    { label: 'معلّقة', value: ordersWithPayments.filter(i => i.paymentStatus === 'pending').length, icon: Clock, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'مستردة', value: ordersWithPayments.filter(i => i.paymentStatus === 'refunded').length, icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
  ];

  const handlePaymentStatusUpdate = async (instance: AppInstance, newStatus: 'pending' | 'paid' | 'refunded') => {
    try {
      await update(ref(database, `appInstances/${instance.id}`), {
        paymentStatus: newStatus,
        updatedAt: new Date().toISOString(),
      });
      const updated = { ...instance, paymentStatus: newStatus };
      setInstances(instances.map(i => i.id === instance.id ? updated : i));
      if (selectedOrder?.id === instance.id) setSelectedOrder(updated);

      if (newStatus === 'paid') {
        addNotification({
          type: 'payment_received',
          title: 'دفعة مستلمة',
          message: `تم استلام دفعة "${instance.appName}" - ${instance.paymentAmount} ${currencySymbols[instance.paymentCurrency] || ''}`,
          read: false,
          instanceId: instance.id,
        });
      }
    } catch (error) {
      console.error('Payment status update error:', error);
    }
  };

  const handleExportCSV = () => {
    const headers = ['رقم الطلب', 'اسم التطبيق', 'اسم العميل', 'المبلغ', 'العملة', 'حالة الدفع', 'تاريخ الطلب', 'تاريخ الإكمال'];
    const rows = filteredOrders.map(o => [
      o.orderNumber,
      o.appName,
      o.clientName || '',
      o.paymentAmount.toString(),
      o.paymentCurrency,
      paymentStatusLabels[o.paymentStatus],
      o.orderDate ? new Date(o.orderDate).toLocaleDateString('ar-SA') : '',
      o.completionDate ? new Date(o.completionDate).toLocaleDateString('ar-SA') : '',
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // =========== DETAIL VIEW ===========
  if (view === 'detail' && selectedOrder) {
    const order = selectedOrder;
    return (
      <div className="space-y-4">
        <button onClick={() => { setView('list'); setSelectedOrder(null); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> العودة للقائمة
        </button>

        <div className="ios-card p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0" style={{ background: order.primaryColor || '#6C3CE1' }}>
              {order.appName?.charAt(0) || 'N'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="text-lg font-bold text-foreground">{order.appName || 'بدون اسم'}</h2>
                <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', paymentStatusColors[order.paymentStatus])}>
                  {paymentStatusLabels[order.paymentStatus]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground" dir="ltr">{order.orderNumber}</p>
            </div>
          </div>

          {/* Payment Status Quick Actions */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-border/30">
            <span className="text-xs text-muted-foreground self-center ml-2">تحديث حالة الدفع:</span>
            {(['paid', 'pending', 'refunded'] as const).map(status => (
              <button
                key={status}
                onClick={() => handlePaymentStatusUpdate(order, status)}
                disabled={order.paymentStatus === status}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors disabled:opacity-30',
                  status === 'paid' && 'bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20',
                  status === 'pending' && 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/20',
                  status === 'refunded' && 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20',
                )}
              >
                {status === 'paid' && <CheckCircle className="w-3.5 h-3.5" />}
                {status === 'pending' && <Clock className="w-3.5 h-3.5" />}
                {status === 'refunded' && <XCircle className="w-3.5 h-3.5" />}
                {paymentStatusLabels[status]}
              </button>
            ))}
          </div>
        </div>

        {/* Order Details */}
        <div className="ios-card p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-purple-500" /> تفاصيل الطلب
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-muted-foreground">المبلغ</p><p className="font-semibold text-foreground">{order.paymentAmount.toLocaleString()} {currencySymbols[order.paymentCurrency]}</p></div>
            <div><p className="text-xs text-muted-foreground">العملة</p><p className="font-medium text-foreground">{order.paymentCurrency}</p></div>
            <div><p className="text-xs text-muted-foreground">تاريخ الطلب</p><p className="font-medium text-foreground">{order.orderDate ? formatDateAr(order.orderDate) : '—'}</p></div>
            <div><p className="text-xs text-muted-foreground">تاريخ الإكمال</p><p className="font-medium text-foreground">{order.completionDate ? formatDateAr(order.completionDate) : '—'}</p></div>
            <div><p className="text-xs text-muted-foreground">حالة بناء المستخدم</p><p className="font-medium text-foreground">{buildStatusLabels[order.userAppBuildStatus]}</p></div>
            <div><p className="text-xs text-muted-foreground">حالة بناء الإدارة</p><p className="font-medium text-foreground">{buildStatusLabels[order.adminAppBuildStatus]}</p></div>
          </div>
        </div>

        {/* Client Info */}
        <div className="ios-card p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Copy className="w-4 h-4 text-amber-500" /> معلومات العميل
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-muted-foreground">الاسم</p><p className="font-medium text-foreground">{order.clientName || '—'}</p></div>
            <div><p className="text-xs text-muted-foreground">البريد</p><p className="font-medium text-foreground" dir="ltr">{order.clientEmail || '—'}</p></div>
            <div><p className="text-xs text-muted-foreground">الهاتف</p><p className="font-medium text-foreground" dir="ltr">{order.clientPhone || '—'}</p></div>
            <div><p className="text-xs text-muted-foreground">العنوان</p><p className="font-medium text-foreground">{order.clientAddress || '—'}</p></div>
          </div>
        </div>

        {/* Subscription */}
        {order.subscriptionEndDate && (
          <div className="ios-card p-5">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-500" /> الاشتراك
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">الحالة</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${subscriptionStatusColors[getSubscriptionStatus(order.subscriptionEndDate)]}`}>
                  {subscriptionStatusLabels[getSubscriptionStatus(order.subscriptionEndDate)]}
                </span>
              </div>
              <div><p className="text-xs text-muted-foreground">تاريخ الانتهاء</p><p className="font-medium text-foreground">{formatDateAr(order.subscriptionEndDate)}</p></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========== LIST VIEW ===========
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="ios-large-title text-foreground">إدارة الطلبات</h1>
          <p className="text-muted-foreground text-sm mt-1">تتبع طلبات العملاء والمدفوعات</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 text-green-600 dark:text-green-400 font-medium rounded-xl hover:bg-green-500/20 transition-all active:scale-[0.98]"
        >
          <Download className="w-4 h-4" />
          <span className="text-sm">تصدير CSV</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="ios-card p-4">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-2', stat.bg)}>
                <Icon className={cn('w-4 h-4', stat.color)} />
              </div>
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="ios-card p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" /> ملخص الإيرادات
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">تم تحصيله</p>
              <div className="space-y-1">
                {Object.entries(totalPaid).map(([currency, amount]) => (
                  <p key={currency} className="text-sm font-semibold text-green-600 dark:text-green-400">{amount.toLocaleString()} {currencySymbols[currency]}</p>
                ))}
                {Object.keys(totalPaid).length === 0 && <p className="text-sm text-muted-foreground">—</p>}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">بانتظار التحصيل</p>
              <div className="space-y-1">
                {Object.entries(totalPending).map(([currency, amount]) => (
                  <p key={currency} className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">{amount.toLocaleString()} {currencySymbols[currency]}</p>
                ))}
                {Object.keys(totalPending).length === 0 && <p className="text-sm text-muted-foreground">—</p>}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">مسترد</p>
              <div className="space-y-1">
                {Object.entries(totalRefunded).map(([currency, amount]) => (
                  <p key={currency} className="text-sm font-semibold text-red-600 dark:text-red-400">{amount.toLocaleString()} {currencySymbols[currency]}</p>
                ))}
                {Object.keys(totalRefunded).length === 0 && <p className="text-sm text-muted-foreground">—</p>}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Revenue Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="ios-card p-5">
          <h3 className="font-semibold text-foreground mb-3">الإيرادات عبر الوقت</h3>
          {revenueOverTime.length > 0 ? (
            <div className="h-40" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueOverTime} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#888' }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(128,128,128,0.15)', fontSize: 11 }} />
                  <Bar dataKey="مدفوع" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="معلق" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">لا توجد بيانات</p>
            </div>
          )}
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
              placeholder="بحث بالاسم أو رقم الطلب..."
              className="w-full h-11 pr-10 pl-4 rounded-2xl bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 px-4 rounded-2xl bg-muted/30 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          >
            <option value="all">الكل</option>
            <option value="pending">معلّق</option>
            <option value="paid">مدفوع</option>
            <option value="refunded">مسترد</option>
          </select>
        </div>
        {/* Date Range */}
        <div className="flex gap-3 items-center">
          <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-10 px-3 rounded-xl bg-muted/30 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          />
          <span className="text-xs text-muted-foreground">إلى</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-10 px-3 rounded-xl bg-muted/30 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="text-xs text-purple-600 dark:text-purple-400 font-medium"
            >
              مسح
            </button>
          )}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingCart className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg font-medium">لا توجد طلبات</p>
          <p className="text-muted-foreground/60 text-sm mt-1">ستظهر الطلبات هنا عند إنشاء نسخ جديدة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map(order => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="ios-card p-4 card-press"
              onClick={() => { setSelectedOrder(order); setView('detail'); }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ background: order.primaryColor || '#6C3CE1' }}
                >
                  {order.appName?.charAt(0) || 'N'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate text-sm">{order.appName || 'بدون اسم'}</h3>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', paymentStatusColors[order.paymentStatus])}>
                      {paymentStatusLabels[order.paymentStatus]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1" dir="ltr">{order.orderNumber}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {order.clientName && <span>العميل: {order.clientName}</span>}
                    {order.paymentAmount > 0 && (
                      <span className="font-semibold text-foreground">
                        {order.paymentAmount.toLocaleString()} {currencySymbols[order.paymentCurrency]}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span>تاريخ الطلب: {order.orderDate ? new Date(order.orderDate).toLocaleDateString('ar-SA') : '—'}</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  {order.paymentStatus === 'pending' && (
                    <button
                      onClick={() => handlePaymentStatusUpdate(order, 'paid')}
                      className="p-2 rounded-lg hover:bg-green-500/10 text-green-500 transition-colors"
                      title="تحديد كمدفوع"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  {order.paymentStatus === 'paid' && (
                    <button
                      onClick={() => handlePaymentStatusUpdate(order, 'refunded')}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                      title="استرداد"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => { setSelectedOrder(order); setView('detail'); }}
                    className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
