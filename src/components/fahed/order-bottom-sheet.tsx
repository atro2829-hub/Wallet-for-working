'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronDown,
  Check,
  AlertTriangle,
  Loader2,
  Wifi,
} from 'lucide-react';
import { useAppStore, type ServiceProvider, type ProductPackage, type Order } from '@/lib/store';
import { currencySymbols, currencyBadgeColors, generateReference } from '@/lib/utils';
import { ref, push, set, get, update } from 'firebase/database';
import { database } from '@/lib/firebase';

export default function OrderBottomSheet() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const {
    isOrderOpen,
    setOrderOpen,
    selectedProvider,
    setSelectedProvider,
    packages,
    user,
    addOrder,
    addNotification,
    addTransaction,
    setUser,
  } = useAppStore();

  const [customerInput, setCustomerInput] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderResult, setOrderResult] = useState<'success' | 'insufficient' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset state when provider changes
  useEffect(() => {
    setCustomerInput('');
    setSelectedPackageId(null);
    setOrderResult(null);
    setErrorMessage('');
  }, [selectedProvider]);

  if (!selectedProvider) return null;

  const providerPackages = packages.filter(
    (pkg) => pkg.providerId === selectedProvider.id && pkg.isActive
  );

  const selectedPackage = providerPackages.find((pkg) => pkg.id === selectedPackageId);

  const getBalance = (currency: string): number => {
    if (!user) return 0;
    const field = `balance${currency}` as keyof typeof user;
    return (user[field] as number) || 0;
  };

  const handleClose = () => {
    setOrderOpen(false);
    setTimeout(() => setSelectedProvider(null), 300);
  };

  const handleConfirm = async () => {
    if (!user || !selectedPackage || !customerInput.trim()) {
      setErrorMessage('يرجى ملء جميع البيانات');
      return;
    }

    const currentBalance = getBalance(selectedPackage.currency);
    if (currentBalance < selectedPackage.price) {
      setOrderResult('insufficient');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      // Deduct balance locally
      const balanceField = `balance${selectedPackage.currency}` as keyof typeof user;
      const newBalance = currentBalance - selectedPackage.price;

      const updatedUser = {
        ...user,
        [balanceField]: newBalance,
      };

      // Create order
      const orderId = generateReference();
      const newOrder: Order = {
        id: orderId,
        userId: user.id,
        userName: user.name,
        userPhone: user.phone,
        providerId: selectedProvider.id,
        providerName: selectedProvider.name,
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        customerInput: customerInput.trim(),
        amount: selectedPackage.price,
        currency: selectedPackage.currency,
        status: 'pending',
        executionType: selectedPackage.executionType,
        createdAt: new Date().toISOString(),
      };

      // Save order to Firebase
      try {
        const orderRef = ref(database, `orders/${orderId}`);
        await set(orderRef, newOrder);
      } catch {
        // Continue locally even if Firebase fails
      }

      // Update user balance in Firebase
      try {
        const userRef = ref(database, `users/${user.id}`);
        await update(userRef, { [balanceField]: newBalance });
      } catch {
        // Continue locally
      }

      // Create transaction record
      const txId = generateReference();
      const newTx = {
        id: txId,
        fromUserId: user.id,
        toUserId: 'system',
        amount: selectedPackage.price,
        currency: selectedPackage.currency,
        type: 'order' as const,
        status: 'completed' as const,
        description: `${selectedPackage.name} - ${selectedProvider.name}`,
        createdAt: new Date().toISOString(),
      };

      try {
        const txRef = ref(database, `transactions/${txId}`);
        await set(txRef, newTx);
      } catch {
        // Continue locally
      }

      // Send notification to admin
      try {
        const adminNotifId = generateReference();
        const adminNotifRef = ref(database, `admin-notifications/${adminNotifId}`);
        await set(adminNotifRef, {
          id: adminNotifId,
          type: 'new_order',
          orderId: orderId,
          message: `العميل ${user.name} طلب ${selectedPackage.name} من ${selectedProvider.name} للرقم ${customerInput.trim()}`,
          createdAt: new Date().toISOString(),
          isRead: false,
        });
      } catch {
        // Non-critical
      }

      // Update local state
      setUser(updatedUser);
      addOrder(newOrder);
      addTransaction(newTx);
      addNotification({
        id: generateReference(),
        title: 'تم إنشاء الطلب',
        body: `طلب ${selectedPackage.name} من ${selectedProvider.name} قيد المعالجة`,
        type: 'transaction',
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      setOrderResult('success');
    } catch {
      setOrderResult('error');
      setErrorMessage('حدث خطأ أثناء المعالجة');
    } finally {
      setIsProcessing(false);
    }
  };

  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const inputBg = isDark ? '#222' : '#F8F8F8';
  const borderColor = isDark ? '#333' : '#EEE';

  return (
    <AnimatePresence>
      {isOrderOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 rounded-t-3xl overflow-hidden"
            style={{
              background: isDark ? '#141414' : '#FAFAFA',
              maxHeight: '85vh',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: isDark ? '#444' : '#DDD' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                {/* Provider color indicator */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${selectedProvider.color}18` }}
                >
                  {selectedProvider.icon && selectedProvider.icon.startsWith('data:') ? (
                    <img
                      src={selectedProvider.icon}
                      alt={selectedProvider.name}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="font-bold text-lg" style={{ color: selectedProvider.color }}>
                      {selectedProvider.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-base font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                    {selectedProvider.name}
                  </h2>
                  <p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>
                    {selectedProvider.inputLabel}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: isDark ? '#2D2D2D' : '#F0F0F0' }}
              >
                <X size={16} strokeWidth={1.5} color={isDark ? '#FFF' : '#666'} />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 pb-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
              <AnimatePresence mode="wait">
                {orderResult === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center py-8"
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                      style={{ background: 'rgba(16,185,129,0.15)' }}
                    >
                      <Check size={32} strokeWidth={2} color="#10B981" />
                    </div>
                    <h3 className="text-lg font-bold mb-2" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                      تم إنشاء الطلب بنجاح
                    </h3>
                    <p className="text-sm text-center mb-4" style={{ color: isDark ? '#888' : '#AAA' }}>
                      سيتم تنفيذ طلبك في أقرب وقت ممكن
                    </p>
                    <div
                      className="w-full rounded-2xl p-4 mb-4"
                      style={{ background: isDark ? '#1E1E1E' : '#FFF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs" style={{ color: isDark ? '#888' : '#AAA' }}>الخدمة</span>
                        <span className="text-xs font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                          {selectedPackage?.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs" style={{ color: isDark ? '#888' : '#AAA' }}>المبلغ</span>
                        <span className="text-xs font-bold" style={{ color: '#E60000' }}>
                          {selectedPackage?.price.toLocaleString()} {currencySymbols[selectedPackage?.currency || 'YER']}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: isDark ? '#888' : '#AAA' }}>الحالة</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                          قيد الانتظار
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleClose}
                      className="w-full py-3.5 rounded-2xl font-bold text-white text-sm"
                      style={{
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      }}
                    >
                      حسناً
                    </button>
                  </motion.div>
                ) : orderResult === 'insufficient' ? (
                  <motion.div
                    key="insufficient"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center py-8"
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                      style={{ background: 'rgba(230,0,0,0.15)' }}
                    >
                      <AlertTriangle size={32} strokeWidth={2} color="#E60000" />
                    </div>
                    <h3 className="text-lg font-bold mb-2" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                      رصيد غير كافٍ
                    </h3>
                    <p className="text-sm text-center mb-2" style={{ color: isDark ? '#888' : '#AAA' }}>
                      رصيدك الحالي لا يكفي لإتمام هذه العملية
                    </p>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs" style={{ color: isDark ? '#888' : '#AAA' }}>رصيدك:</span>
                      <span className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                        {getBalance(selectedPackage?.currency || 'YER').toLocaleString()} {currencySymbols[selectedPackage?.currency || 'YER']}
                      </span>
                    </div>
                    <button
                      onClick={handleClose}
                      className="w-full py-3.5 rounded-2xl font-bold text-white text-sm"
                      style={{
                        background: 'linear-gradient(135deg, #E60000 0%, #B30000 100%)',
                      }}
                    >
                      حسناً
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    {/* Customer Input */}
                    <div>
                      <label className="text-xs font-medium mb-2 block" style={{ color: isDark ? '#AAA' : '#888' }}>
                        {selectedProvider.inputLabel}
                      </label>
                      <div
                        className="flex items-center gap-2 px-4 py-3.5 rounded-2xl"
                        style={{ background: inputBg, border: `1px solid ${borderColor}` }}
                      >
                        {selectedProvider.inputPrefix && (
                          <>
                            <span
                              className="text-sm font-medium shrink-0"
                              style={{ color: isDark ? '#AAA' : '#888' }}
                              dir="ltr"
                            >
                              {selectedProvider.inputPrefix}
                            </span>
                            <div className="w-px h-5 shrink-0" style={{ background: borderColor }} />
                          </>
                        )}
                        <input
                          type={selectedProvider.inputType === 'phone' ? 'tel' : 'text'}
                          placeholder={selectedProvider.inputLabel}
                          value={customerInput}
                          onChange={(e) => {
                            if (selectedProvider.inputType === 'phone') {
                              const cleaned = e.target.value.replace(/\D/g, '').slice(0, 9);
                              setCustomerInput(cleaned);
                            } else {
                              setCustomerInput(e.target.value);
                            }
                          }}
                          className="flex-1 bg-transparent outline-none text-sm"
                          style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                          dir={selectedProvider.inputType === 'phone' ? 'ltr' : 'auto'}
                        />
                      </div>
                    </div>

                    {/* Package Selection */}
                    <div>
                      <label className="text-xs font-medium mb-2 block" style={{ color: isDark ? '#AAA' : '#888' }}>
                        اختر الباقة
                      </label>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin">
                        {providerPackages.map((pkg) => (
                          <button
                            key={pkg.id}
                            onClick={() => {
                              setSelectedPackageId(pkg.id);
                              setOrderResult(null);
                              setErrorMessage('');
                            }}
                            className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98]"
                            style={{
                              background: selectedPackageId === pkg.id
                                ? isDark ? '#222' : '#FFF'
                                : inputBg,
                              border: selectedPackageId === pkg.id
                                ? `2px solid ${selectedProvider.color}`
                                : `1px solid ${borderColor}`,
                              boxShadow: selectedPackageId === pkg.id
                                ? `0 2px 12px ${selectedProvider.color}20`
                                : 'none',
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                                style={{
                                  border: selectedPackageId === pkg.id
                                    ? `2px solid ${selectedProvider.color}`
                                    : `2px solid ${borderColor}`,
                                  background: selectedPackageId === pkg.id
                                    ? selectedProvider.color
                                    : 'transparent',
                                }}
                              >
                                {selectedPackageId === pkg.id && (
                                  <Check size={12} strokeWidth={3} color="#FFF" />
                                )}
                              </div>
                              <span
                                className="text-sm font-medium text-right"
                                style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                              >
                                {pkg.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold" style={{ color: selectedProvider.color }}>
                                {pkg.price.toLocaleString()}
                              </span>
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded font-bold text-white"
                                style={{ background: currencyBadgeColors[pkg.currency] }}
                              >
                                {currencySymbols[pkg.currency]}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Balance Check */}
                    {selectedPackage && (
                      <div
                        className="rounded-2xl p-4"
                        style={{
                          background: isDark ? '#1A1A1A' : '#F8F8F8',
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs" style={{ color: isDark ? '#888' : '#AAA' }}>رصيدك الحالي</span>
                          <span className="text-xs font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                            {getBalance(selectedPackage.currency).toLocaleString()} {currencySymbols[selectedPackage.currency]}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs" style={{ color: isDark ? '#888' : '#AAA' }}>سعر الباقة</span>
                          <span className="text-xs font-bold" style={{ color: '#E60000' }}>
                            -{selectedPackage.price.toLocaleString()} {currencySymbols[selectedPackage.currency]}
                          </span>
                        </div>
                        <div className="h-px my-2" style={{ background: borderColor }} />
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium" style={{ color: isDark ? '#AAA' : '#888' }}>الرصيد بعد الشراء</span>
                          <span
                            className="text-sm font-bold"
                            style={{
                              color: getBalance(selectedPackage.currency) - selectedPackage.price >= 0
                                ? '#10B981'
                                : '#E60000',
                            }}
                          >
                            {(getBalance(selectedPackage.currency) - selectedPackage.price).toLocaleString()} {currencySymbols[selectedPackage.currency]}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {errorMessage && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-center"
                        style={{ color: '#E60000' }}
                      >
                        {errorMessage}
                      </motion.p>
                    )}

                    {/* Confirm Button */}
                    <button
                      onClick={handleConfirm}
                      disabled={isProcessing || !selectedPackageId || !customerInput.trim()}
                      className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-white text-sm transition-all active:scale-[0.98] disabled:opacity-40"
                      style={{
                        background: `linear-gradient(135deg, ${selectedProvider.color} 0%, ${selectedProvider.color}CC 100%)`,
                        boxShadow: `0 4px 16px ${selectedProvider.color}40`,
                      }}
                    >
                      {isProcessing ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <>
                          <span>تأكيد الشراء</span>
                          {selectedPackage && (
                            <span className="opacity-70">
                              ({selectedPackage.price.toLocaleString()} {currencySymbols[selectedPackage.currency]})
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
