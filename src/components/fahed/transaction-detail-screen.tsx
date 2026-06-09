'use client';

import { useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  CheckCircle2,
  XCircle,
  Clock,
  ShoppingCart,
  CreditCard,
  Smartphone,
  Receipt,
  Plus,
  Minus,
  Share2,
  AlertTriangle,
  RefreshCw,
  Check,
  User,
  Hash,
  Calendar,
  Wallet,
  MessageCircle,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatNumber, currencySymbols, currencyBadgeColors, transactionTypeLabels, transactionTypeColors, timeAgo } from '@/lib/utils';

export default function TransactionDetailScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user, transactions, orders, setActiveScreen, addNotification, setSelectedProvider, setOrderOpen, providers, packages } = useAppStore();

  // Get selected transaction - use the last one that's from the current user for demo
  const selectedTransactionId = useAppStore.getState().activeScreen === 'transaction-detail'
    ? (useAppStore.getState() as any).selectedTransactionId || null
    : null;

  const tx = useMemo(() => {
    if (selectedTransactionId) {
      return transactions.find(t => t.id === selectedTransactionId) || null;
    }
    // If no specific selection, use the most recent transaction
    const userTx = transactions.filter(t => t.fromUserId === user?.id || t.toUserId === user?.id);
    return userTx.length > 0 ? userTx[0] : null;
  }, [selectedTransactionId, transactions, user]);

  const [copiedRef, setCopiedRef] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  if (!tx || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: isDark ? '#0F0F0F' : '#F5F5F5' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: isDark ? '#1A1A1A' : '#FFF' }}>
          <Receipt size={32} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} />
        </div>
        <p className="text-sm font-medium" style={{ color: isDark ? '#666' : '#AAA' }}>لم يتم العثور على المعاملة</p>
        <button
          onClick={() => setActiveScreen('main')}
          className="mt-4 px-6 py-2.5 rounded-xl text-sm font-medium text-white"
          style={{ background: '#E60000' }}
        >
          العودة
        </button>
      </div>
    );
  }

  const isIncoming = tx.toUserId === user.id;
  const txColor = transactionTypeColors[tx.type] || '#E60000';
  const txLabel = transactionTypeLabels[tx.type] || 'معاملة';

  // Get associated order if this is an order-type transaction
  const associatedOrder = tx.type === 'order' || tx.type === 'purchase'
    ? orders.find(o => o.id === tx.id || (tx.description && tx.description.includes(o.packageName)))
    : null;

  // Status config
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed': return { label: 'مكتملة', color: '#10B981', icon: CheckCircle2, bg: 'rgba(16,185,129,0.1)' };
      case 'pending': return { label: 'قيد الانتظار', color: '#F59E0B', icon: Clock, bg: 'rgba(245,158,11,0.1)' };
      case 'failed': return { label: 'فشلت', color: '#E60000', icon: XCircle, bg: 'rgba(230,0,0,0.1)' };
      case 'refunded': return { label: 'مستردة', color: '#6366F1', icon: RefreshCw, bg: 'rgba(99,102,241,0.1)' };
      default: return { label: status, color: '#666', icon: Clock, bg: 'rgba(102,102,102,0.1)' };
    }
  };

  const getTransactionIcon = () => {
    switch (tx.type) {
      case 'transfer': return isIncoming ? ArrowDownLeft : ArrowUpRight;
      case 'deposit': return Plus;
      case 'withdraw': return Minus;
      case 'payment': return CreditCard;
      case 'recharge': return Smartphone;
      case 'bill': return Receipt;
      case 'purchase': return ShoppingCart;
      case 'order': return ShoppingCart;
      default: return isIncoming ? ArrowDownLeft : ArrowUpRight;
    }
  };

  const Icon = getTransactionIcon();
  const statusConfig = getStatusConfig(tx.status);
  const StatusIcon = statusConfig.icon;

  const handleCopyRef = async () => {
    try {
      await navigator.clipboard.writeText(tx.id);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    } catch {}
  };

  const handleShareReceipt = () => {
    const receiptText = `
إيصال معاملة - محفظة الجنوب
═══════════════════════
النوع: ${txLabel}
المبلغ: ${tx.amount.toLocaleString()} ${currencySymbols[tx.currency]}
الحالة: ${statusConfig.label}
التاريخ: ${new Date(tx.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
رقم المرجع: ${tx.id}
الوصف: ${tx.description || '-'}
═══════════════════════
    `.trim();

    if (navigator.share) {
      navigator.share({ title: 'إيصال معاملة', text: receiptText });
    } else {
      navigator.clipboard.writeText(receiptText);
      addNotification({
        id: `share-${Date.now()}`,
        title: 'تم نسخ الإيصال',
        body: 'تم نسخ نص الإيصال إلى الحافظة',
        type: 'info',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const handleRepeatTransaction = () => {
    if (tx.type === 'transfer') {
      useAppStore.getState().setTransferOpen(true);
    } else if (tx.type === 'order' || tx.type === 'purchase') {
      const provider = providers.find(p =>
        tx.description && tx.description.includes(p.name)
      );
      if (provider) {
        setSelectedProvider(provider);
        setOrderOpen(true);
      }
    }
  };

  const handleReportIssue = () => {
    setReportSent(true);
    addNotification({
      id: `report-${Date.now()}`,
      title: 'تم إرسال البلاغ',
      body: 'سيتم مراجعة مشكلتك والرد عليك في أقرب وقت',
      type: 'info',
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    setTimeout(() => {
      setShowReportDialog(false);
      setReportSent(false);
    }, 2000);
  };

  const cardBg = isDark ? '#1A1A1A' : '#FFFFFF';
  const inputBg = isDark ? '#222' : '#F8F8F8';
  const borderColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';

  return (
    <div className="min-h-screen pb-8" style={{ background: isDark ? '#0F0F0F' : '#F5F5F5' }}>
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              useAppStore.getState().setActiveTab('wallet');
              setActiveScreen('main');
            }}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
          >
            <ArrowLeft size={18} strokeWidth={1.5} color={isDark ? '#FFF' : '#666'} />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>تفاصيل المعاملة</h1>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-4">
        {/* Main Amount Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{ background: cardBg, border: `1px solid ${borderColor}` }}
        >
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-1" style={{ background: `linear-gradient(90deg, ${txColor}, transparent)` }} />

          <div className="flex flex-col items-center">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${txColor}15` }}>
              <Icon size={28} strokeWidth={1.5} color={txColor} />
            </div>

            {/* Type Label */}
            <p className="text-xs font-medium mb-1" style={{ color: isDark ? '#888' : '#AAA' }}>{txLabel}</p>

            {/* Amount */}
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-3xl font-bold" style={{ color: isIncoming ? '#10B981' : '#E60000' }}>
                {isIncoming ? '+' : '-'}{tx.amount.toLocaleString()}
              </span>
              <span className="text-sm px-2 py-1 rounded-lg font-bold text-white" style={{ background: currencyBadgeColors[tx.currency] || '#666' }}>
                {currencySymbols[tx.currency]}
              </span>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: statusConfig.bg }}>
              <StatusIcon size={14} strokeWidth={1.5} color={statusConfig.color} />
              <span className="text-xs font-medium" style={{ color: statusConfig.color }}>{statusConfig.label}</span>
            </div>
          </div>
        </motion.div>

        {/* Transaction Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-4"
          style={{ background: cardBg, border: `1px solid ${borderColor}` }}
        >
          <h3 className="text-sm font-bold mb-3" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>معلومات المعاملة</h3>
          <div className="space-y-3">
            {/* Reference Number */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash size={14} strokeWidth={1.5} color={isDark ? '#666' : '#AAA'} />
                <span className="text-xs" style={{ color: isDark ? '#888' : '#AAA' }}>رقم المرجع</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold" style={{ color: '#E60000' }} dir="ltr">{tx.id}</span>
                <button
                  onClick={handleCopyRef}
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(230,0,0,0.1)' }}
                >
                  {copiedRef ? <Check size={10} color="#10B981" /> : <Copy size={10} color="#E60000" />}
                </button>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={14} strokeWidth={1.5} color={isDark ? '#666' : '#AAA'} />
                <span className="text-xs" style={{ color: isDark ? '#888' : '#AAA' }}>التاريخ والوقت</span>
              </div>
              <span className="text-xs font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                {new Date(tx.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={14} strokeWidth={1.5} color={isDark ? '#666' : '#AAA'} />
                <span className="text-xs" style={{ color: isDark ? '#888' : '#AAA' }}>الوقت</span>
              </div>
              <span className="text-xs font-medium" dir="ltr" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                {new Date(tx.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            {/* Type */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet size={14} strokeWidth={1.5} color={isDark ? '#666' : '#AAA'} />
                <span className="text-xs" style={{ color: isDark ? '#888' : '#AAA' }}>نوع المعاملة</span>
              </div>
              <span className="text-xs font-bold" style={{ color: txColor }}>{txLabel}</span>
            </div>

            {/* Description */}
            {tx.description && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle size={14} strokeWidth={1.5} color={isDark ? '#666' : '#AAA'} />
                  <span className="text-xs" style={{ color: isDark ? '#888' : '#AAA' }}>الوصف</span>
                </div>
                <span className="text-xs font-medium max-w-[60%] text-left" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                  {tx.description}
                </span>
              </div>
            )}

            {/* Divider */}
            <div className="h-px" style={{ background: borderColor }} />

            {/* Sender/Receiver Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User size={14} strokeWidth={1.5} color={isDark ? '#666' : '#AAA'} />
                <span className="text-xs" style={{ color: isDark ? '#888' : '#AAA' }}>
                  {isIncoming ? 'المرسل' : 'المستقبل'}
                </span>
              </div>
              <span className="text-xs font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                {isIncoming
                  ? (tx.fromUserId === 'system' ? 'النظام' : tx.fromUserId)
                  : (tx.toUserId === 'system' ? 'النظام' : tx.toUserId)}
              </span>
            </div>

            {/* User ID */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash size={14} strokeWidth={1.5} color={isDark ? '#666' : '#AAA'} />
                <span className="text-xs" style={{ color: isDark ? '#888' : '#AAA' }}>
                  {isIncoming ? 'معرف المرسل' : 'معرف المستقبل'}
                </span>
              </div>
              <span className="text-xs font-mono" style={{ color: isDark ? '#888' : '#888' }} dir="ltr">
                {isIncoming ? tx.fromUserId : tx.toUserId}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Associated Order Details */}
        {associatedOrder && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl p-4"
            style={{ background: cardBg, border: `1px solid ${borderColor}` }}
          >
            <h3 className="text-sm font-bold mb-3" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>تفاصيل الطلب</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: isDark ? '#888' : '#AAA' }}>مزود الخدمة</span>
                <span className="text-xs font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{associatedOrder.providerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: isDark ? '#888' : '#AAA' }}>الباقة</span>
                <span className="text-xs font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{associatedOrder.packageName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: isDark ? '#888' : '#AAA' }}>رقم العميل</span>
                <span className="text-xs font-mono" style={{ color: isDark ? '#FFF' : '#1a1a1a' }} dir="ltr">{associatedOrder.customerInput}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: isDark ? '#888' : '#AAA' }}>نوع التنفيذ</span>
                <span className="text-xs font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                  {associatedOrder.executionType === 'auto' ? 'تلقائي' : 'يدوي'}
                </span>
              </div>

              {/* Order Timeline Visualization */}
              <div className="mt-3">
                <div className="flex items-center gap-1 mb-2">
                  <Clock size={12} color="#E60000" />
                  <span className="text-[10px] font-bold" style={{ color: isDark ? '#AAA' : '#888' }}>حالة الطلب</span>
                </div>
                <div className="flex items-center gap-1">
                  {['pending', 'completed', 'cancelled'].map((step, i) => {
                    const isCompleted = associatedOrder.status === 'completed' && i <= 1;
                    const isCurrent = (step === 'pending' && associatedOrder.status === 'pending') ||
                                     (step === 'completed' && associatedOrder.status === 'completed') ||
                                     (step === 'cancelled' && associatedOrder.status === 'cancelled');
                    const stepLabels: Record<string, string> = { pending: 'قيد الانتظار', completed: 'مكتمل', cancelled: 'ملغي' };
                    const stepColors: Record<string, string> = { pending: '#F59E0B', completed: '#10B981', cancelled: '#E60000' };
                    return (
                      <div key={step} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center mb-1"
                          style={{
                            background: isCurrent || isCompleted ? stepColors[step] : (isDark ? '#2D2D2D' : '#EEE'),
                          }}
                        >
                          {isCurrent || isCompleted ? (
                            <Check size={10} color="#FFF" />
                          ) : (
                            <div className="w-2 h-2 rounded-full" style={{ background: isDark ? '#444' : '#CCC' }} />
                          )}
                        </div>
                        <span className="text-[8px]" style={{ color: isCurrent ? stepColors[step] : isDark ? '#555' : '#BBB' }}>
                          {stepLabels[step]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          {/* Send Receipt */}
          <button
            onClick={handleShareReceipt}
            className="w-full flex items-center gap-3 p-4 rounded-2xl transition-all active:scale-[0.98]"
            style={{ background: cardBg, border: `1px solid ${borderColor}` }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)' }}>
              <Share2 size={18} strokeWidth={1.5} color="#10B981" />
            </div>
            <div className="flex-1 text-right">
              <p className="text-sm font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>إرسال إيصال</p>
              <p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>مشاركة تفاصيل المعاملة</p>
            </div>
          </button>

          {/* Report Issue */}
          <button
            onClick={() => setShowReportDialog(true)}
            className="w-full flex items-center gap-3 p-4 rounded-2xl transition-all active:scale-[0.98]"
            style={{ background: cardBg, border: `1px solid ${borderColor}` }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)' }}>
              <AlertTriangle size={18} strokeWidth={1.5} color="#F59E0B" />
            </div>
            <div className="flex-1 text-right">
              <p className="text-sm font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>الإبلاغ عن مشكلة</p>
              <p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>إبلاغ عن مشكلة في هذه المعاملة</p>
            </div>
          </button>

          {/* Repeat Transaction */}
          <button
            onClick={handleRepeatTransaction}
            className="w-full flex items-center gap-3 p-4 rounded-2xl transition-all active:scale-[0.98]"
            style={{ background: cardBg, border: `1px solid ${borderColor}` }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(230,0,0,0.1)' }}>
              <RefreshCw size={18} strokeWidth={1.5} color="#E60000" />
            </div>
            <div className="flex-1 text-right">
              <p className="text-sm font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>تكرار المعاملة</p>
              <p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>تنفيذ معاملة مشابهة</p>
            </div>
          </button>

          {/* Cancel Order - only for pending orders */}
          {associatedOrder && associatedOrder.status === 'pending' && (
            <button
              onClick={() => {
                // Navigate to order tracking where cancel is available
                useAppStore.getState().setActiveScreen('order-tracking');
              }}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #E60000 0%, #B30000 100%)' }}
            >
              إلغاء الطلب
            </button>
          )}
        </motion.div>
      </div>

      {/* Report Dialog */}
      <AnimatePresence>
        {showReportDialog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => { setShowReportDialog(false); setReportSent(false); }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[85%] max-w-sm rounded-2xl p-6"
              style={{ background: isDark ? '#1E1E1E' : '#FFFFFF' }}
            >
              {reportSent ? (
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: 'rgba(16,185,129,0.15)' }}>
                    <CheckCircle2 size={28} color="#10B981" />
                  </div>
                  <p className="text-sm font-bold mb-1" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>تم إرسال البلاغ</p>
                  <p className="text-xs" style={{ color: isDark ? '#888' : '#AAA' }}>سيتم مراجعة مشكلتك قريباً</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle size={20} color="#F59E0B" />
                    <h3 className="text-base font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>الإبلاغ عن مشكلة</h3>
                  </div>
                  <p className="text-xs mb-4" style={{ color: isDark ? '#888' : '#AAA' }}>
                    هل تريد الإبلاغ عن مشكلة في المعاملة رقم <span className="font-mono font-bold" style={{ color: '#E60000' }} dir="ltr">{tx.id}</span>؟
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowReportDialog(false); setReportSent(false); }}
                      className="flex-1 py-3 rounded-xl text-sm font-medium"
                      style={{ background: isDark ? '#2D2D2D' : '#F0F0F0', color: isDark ? '#FFF' : '#1a1a1a' }}
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleReportIssue}
                      className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
                      style={{ background: '#F59E0B' }}
                    >
                      إرسال البلاغ
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
