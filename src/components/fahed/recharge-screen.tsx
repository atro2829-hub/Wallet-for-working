'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Phone,
  Wifi,
  Check,
  AlertTriangle,
  Loader2,
  Tag,
  RotateCcw,
  Receipt,
  Copy,
  CheckCircle2,
  Zap,
  Package,
  Edit3,
} from 'lucide-react';
import { useAppStore, type Order } from '@/lib/store';
import { currencySymbols, currencyBadgeColors, generateReference } from '@/lib/utils';
import { ref, set, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useToast } from '@/components/fahed/toast-provider';
import { serviceIcons } from '@/lib/service-icons';

const telecomCompanies = [
  { id: 'yemen-mobile', name: 'يمن موبايل', nameEn: 'Yemen Mobile', color: '#E60000', letter: 'YM', inputLabel: 'رقم الهاتف', inputType: 'phone' as const, inputPrefix: '+967' },
  { id: 'yo', name: 'يو', nameEn: 'YO', color: '#FF6B00', letter: 'YO', inputLabel: 'رقم الهاتف', inputType: 'phone' as const, inputPrefix: '+967' },
  { id: 'sabafon', name: 'سبأفون', nameEn: 'Sabafon', color: '#2563EB', letter: 'S', inputLabel: 'رقم الهاتف', inputType: 'phone' as const, inputPrefix: '+967' },
  { id: 'y', name: 'واي', nameEn: 'Y', color: '#059669', letter: 'Y', inputLabel: 'رقم الهاتف', inputType: 'phone' as const, inputPrefix: '+967' },
  { id: 'yemen-net', name: 'يمن نت', nameEn: 'Yemen Net', color: '#8B5CF6', letter: 'YN', inputLabel: 'رقم الحساب', inputType: 'text' as const, inputPrefix: '' },
];

type RechargeMode = 'packages' | 'instant';
type OrderResult = 'success' | 'insufficient' | 'error' | null;

export default function RechargeScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user, packages, addOrder, addNotification, addTransaction, setUser, orders } = useAppStore();
  const { showToast } = useToast();

  // Step state
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [rechargeMode, setRechargeMode] = useState<RechargeMode>('packages');
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [customerInput, setCustomerInput] = useState('');

  // Order processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResult>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [completedOrderId, setCompletedOrderId] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);

  // Promo
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);

  // Refs
  const rechargeTypeRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const selectedCompany = telecomCompanies.find(c => c.id === selectedCompanyId);
  const providerPackages = packages.filter(
    pkg => pkg.providerId === selectedCompanyId && pkg.isActive
  );
  const selectedPackage = providerPackages.find(pkg => pkg.id === selectedPackageId);

  // Always YER for recharge
  const CURRENCY = 'YER';

  const getBalance = (): number => {
    if (!user) return 0;
    return user.balanceYER || 0;
  };

  const effectivePrice = rechargeMode === 'packages' && selectedPackage
    ? (promoApplied ? Math.max(0, selectedPackage.price - promoDiscount) : selectedPackage.price)
    : rechargeMode === 'instant'
      ? (parseInt(customAmount) || 0)
      : 0;

  // Quick recharge - find last order with this provider
  const lastOrder = orders.find(o => o.providerId === selectedCompanyId);

  // Reset on company change
  useEffect(() => {
    setRechargeMode('packages');
    setSelectedPackageId(null);
    setCustomAmount('');
    setCustomerInput('');
    setOrderResult(null);
    setErrorMessage('');
    setPromoCode('');
    setPromoApplied(false);
    setPromoDiscount(0);
    setShowReceipt(false);
    setCompletedOrderId('');
  }, [selectedCompanyId]);

  // Scroll to recharge type on company select
  useEffect(() => {
    if (selectedCompanyId && rechargeTypeRef.current) {
      setTimeout(() => {
        rechargeTypeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    }
  }, [selectedCompanyId]);

  const handleCompanySelect = (companyId: string) => {
    setSelectedCompanyId(companyId);
  };

  const handleApplyPromo = () => {
    if (!promoCode.trim() || !selectedPackage) return;
    const promo = useAppStore.getState().applyPromoCode(promoCode.trim().toUpperCase());
    if (promo) {
      const discount = promo.type === 'percentage'
        ? Math.round(selectedPackage.price * promo.discount / 100)
        : promo.type === 'fixed' ? promo.discount : 0;
      setPromoApplied(true);
      setPromoDiscount(discount);
      showToast('success', 'تم تطبيق الكود', `خصم ${discount.toLocaleString('ar-SA')} ${currencySymbols[CURRENCY]}`);
    } else {
      showToast('error', 'كود غير صالح', 'الكود الترويجي غير صالح أو منتهي الصلاحية');
    }
  };

  const handleQuickRecharge = () => {
    if (lastOrder) {
      setCustomerInput(lastOrder.customerInput);
      if (lastOrder.packageId) {
        setSelectedPackageId(lastOrder.packageId);
        setRechargeMode('packages');
      }
      showToast('info', 'إعادة الطلب', 'تم ملء بيانات آخر طلب');
    }
  };

  const handleConfirm = async () => {
    if (!user || !selectedCompany) {
      setErrorMessage('يرجى اختيار الشركة');
      return;
    }

    if (!customerInput.trim()) {
      setErrorMessage('يرجى إدخال رقم الهاتف أو الحساب');
      return;
    }

    let amount = 0;
    let packageName = '';
    let packageId = '';

    if (rechargeMode === 'packages') {
      if (!selectedPackage) {
        setErrorMessage('يرجى اختيار الباقة');
        return;
      }
      amount = effectivePrice;
      packageName = selectedPackage.name;
      packageId = selectedPackage.id;
    } else {
      amount = parseInt(customAmount) || 0;
      if (amount < 50) {
        setErrorMessage('الحد الأدنى للشحن 50 ر.ي');
        return;
      }
      packageName = `شحن فوري ${amount.toLocaleString()} ر.ي`;
      packageId = `instant-${selectedCompany.id}`;
    }

    const currentBalance = getBalance();
    if (currentBalance < amount) {
      setOrderResult('insufficient');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const newBalance = currentBalance - amount;
      const updatedUser = { ...user, balanceYER: newBalance };

      const orderId = generateReference();
      const newOrder: Order = {
        id: orderId,
        userId: user.id,
        userName: user.name,
        userPhone: user.phone,
        providerId: selectedCompany.id,
        providerName: selectedCompany.name,
        packageId: packageId,
        packageName: packageName,
        customerInput: customerInput.trim(),
        amount: amount,
        currency: CURRENCY,
        status: 'pending',
        executionType: 'manual',
        createdAt: new Date().toISOString(),
      };

      try {
        const orderRef = ref(database, `orders/${orderId}`);
        await set(orderRef, newOrder);
      } catch {
        // Continue locally even if Firebase fails
      }

      try {
        const userRef = ref(database, `users/${user.id}`);
        await update(userRef, { balanceYER: newBalance });
      } catch {
        // Continue locally
      }

      const txId = generateReference();
      const newTx = {
        id: txId,
        fromUserId: user.id,
        toUserId: 'system',
        amount: amount,
        currency: 'YER' as const,
        type: 'order' as const,
        status: 'completed' as const,
        description: `${packageName} - ${selectedCompany.name}`,
        createdAt: new Date().toISOString(),
      };

      try {
        const txRef = ref(database, `transactions/${txId}`);
        await set(txRef, newTx);
      } catch {
        // Continue locally
      }

      try {
        const adminNotifId = generateReference();
        const adminNotifRef = ref(database, `admin-notifications/${adminNotifId}`);
        await set(adminNotifRef, {
          id: adminNotifId,
          type: 'new_order',
          orderId: orderId,
          message: `العميل ${user.name} طلب ${packageName} من ${selectedCompany.name} للرقم ${customerInput.trim()}`,
          createdAt: new Date().toISOString(),
          isRead: false,
        });
      } catch {
        // Non-critical
      }

      setUser(updatedUser);
      addOrder(newOrder);
      addTransaction(newTx);
      addNotification({
        id: generateReference(),
        title: 'تم إنشاء الطلب',
        body: `طلب ${packageName} من ${selectedCompany.name} قيد المعالجة`,
        type: 'transaction',
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      setCompletedOrderId(orderId);
      setOrderResult('success');
    } catch {
      setOrderResult('error');
      setErrorMessage('حدث خطأ أثناء المعالجة');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetOrder = () => {
    setOrderResult(null);
    setShowReceipt(false);
    setSelectedPackageId(null);
    setCustomAmount('');
    setCustomerInput('');
    setPromoApplied(false);
    setPromoDiscount(0);
    setPromoCode('');
    setErrorMessage('');
  };

  const cardBg = isDark ? '#1A1A1A' : '#FFFFFF';
  const inputBg = isDark ? '#222' : '#F8F8F8';
  const borderColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
  const subTextColor = isDark ? '#888' : '#AAA';

  return (
    <div className="min-h-screen pb-4" style={{ background: isDark ? '#0A0A0A' : '#F5F5F5' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-4 pb-3"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => useAppStore.getState().setActiveTab('services')}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
          >
            <ChevronLeft size={20} strokeWidth={1.5} color={isDark ? '#FFF' : '#666'} />
          </button>
          <h1 className="text-xl font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
            شحن الرصيد
          </h1>
        </div>
      </motion.div>

      <div ref={contentRef} className="px-4 space-y-4">
        {/* ==========================================
            SECTION 1: Company Selection
            ========================================== */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <h3 className="text-sm font-bold mb-3" style={{ color: isDark ? '#AAA' : '#888' }}>
            اختر شركة الاتصالات
          </h3>
          <div className="grid grid-cols-3 gap-2.5">
            {telecomCompanies.map((company, index) => (
              <motion.button
                key={company.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.03 * index }}
                onClick={() => handleCompanySelect(company.id)}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all active:scale-[0.97]"
                style={{
                  background: selectedCompanyId === company.id
                    ? isDark ? '#1A1A1A' : '#FFFFFF'
                    : isDark ? '#141414' : '#FAFAFA',
                  border: selectedCompanyId === company.id
                    ? `2px solid ${company.color}`
                    : `1px solid ${borderColor}`,
                  boxShadow: selectedCompanyId === company.id
                    ? `0 4px 16px ${company.color}25`
                    : 'none',
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
                  style={{ background: 'transparent' }}
                >
                  <img src={serviceIcons[company.id]} alt={company.name} className="w-full h-full object-contain" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold leading-tight" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                    {company.name}
                  </p>
                  <p className="text-[9px] mt-0.5" style={{ color: subTextColor }}>
                    {company.nameEn}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ==========================================
            SECTION 2+: After company selection
            ========================================== */}
        <AnimatePresence mode="wait">
          {selectedCompany && orderResult !== 'success' && orderResult !== 'insufficient' && (
            <motion.div
              key={selectedCompany.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Section 2: Recharge Type Toggle */}
              <div ref={rechargeTypeRef}>
                <h3 className="text-sm font-bold mb-3" style={{ color: isDark ? '#AAA' : '#888' }}>
                  نوع الشحن
                </h3>
                <div
                  className="flex rounded-2xl p-1"
                  style={{ background: isDark ? '#141414' : '#F0F0F0' }}
                >
                  <button
                    onClick={() => { setRechargeMode('packages'); setSelectedPackageId(null); setPromoApplied(false); setPromoDiscount(0); setPromoCode(''); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: rechargeMode === 'packages' ? selectedCompany.color : 'transparent',
                      color: rechargeMode === 'packages' ? '#FFF' : subTextColor,
                      boxShadow: rechargeMode === 'packages' ? `0 2px 8px ${selectedCompany.color}30` : 'none',
                    }}
                  >
                    <Package size={14} strokeWidth={2} />
                    باقات محددة
                  </button>
                  <button
                    onClick={() => { setRechargeMode('instant'); setSelectedPackageId(null); setPromoApplied(false); setPromoDiscount(0); setPromoCode(''); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: rechargeMode === 'instant' ? selectedCompany.color : 'transparent',
                      color: rechargeMode === 'instant' ? '#FFF' : subTextColor,
                      boxShadow: rechargeMode === 'instant' ? `0 2px 8px ${selectedCompany.color}30` : 'none',
                    }}
                  >
                    <Zap size={14} strokeWidth={2} />
                    شحن فوري
                  </button>
                </div>
              </div>

              {/* Section 3a: Packages Mode */}
              <AnimatePresence mode="wait">
                {rechargeMode === 'packages' && (
                  <motion.div
                    key="packages"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {providerPackages.length === 0 ? (
                      <div
                        className="rounded-2xl p-6 flex flex-col items-center"
                        style={{ background: cardBg, border: `1px solid ${borderColor}` }}
                      >
                        <Package size={28} strokeWidth={1.5} color={subTextColor} />
                        <p className="text-sm mt-2 font-medium" style={{ color: subTextColor }}>
                          لا توجد باقات متاحة حالياً
                        </p>
                        <p className="text-[11px] mt-1" style={{ color: isDark ? '#444' : '#CCC' }}>
                          يمكنك استخدام الشحن الفوري
                        </p>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-sm font-bold mb-3" style={{ color: isDark ? '#AAA' : '#888' }}>
                          اختر الباقة
                        </h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                          {providerPackages.map((pkg) => (
                            <button
                              key={pkg.id}
                              onClick={() => {
                                setSelectedPackageId(pkg.id);
                                setOrderResult(null);
                                setErrorMessage('');
                                setPromoApplied(false);
                                setPromoDiscount(0);
                              }}
                              className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98]"
                              style={{
                                background: selectedPackageId === pkg.id
                                  ? isDark ? '#1E1E1E' : '#FFFFFF'
                                  : inputBg,
                                border: selectedPackageId === pkg.id
                                  ? `2px solid ${selectedCompany.color}`
                                  : `1px solid ${borderColor}`,
                                boxShadow: selectedPackageId === pkg.id
                                  ? `0 2px 12px ${selectedCompany.color}20`
                                  : 'none',
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                                  style={{
                                    border: selectedPackageId === pkg.id
                                      ? `2px solid ${selectedCompany.color}`
                                      : `2px solid ${isDark ? '#333' : '#DDD'}`,
                                    background: selectedPackageId === pkg.id
                                      ? selectedCompany.color
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
                                <span className="text-sm font-bold" style={{ color: selectedCompany.color }}>
                                  {pkg.price.toLocaleString()}
                                </span>
                                <span
                                  className="text-[10px] px-1.5 py-0.5 rounded font-bold text-white"
                                  style={{ background: currencyBadgeColors[CURRENCY] }}
                                >
                                  {currencySymbols[CURRENCY]}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Section 3b: Instant Recharge Mode */}
                {rechargeMode === 'instant' && (
                  <motion.div
                    key="instant"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <h3 className="text-sm font-bold mb-1" style={{ color: isDark ? '#AAA' : '#888' }}>
                      أدخل مبلغ الشحن
                    </h3>
                    {/* Amount Input */}
                    <div
                      className="flex items-center gap-2 px-4 py-3.5 rounded-2xl"
                      style={{
                        background: inputBg,
                        border: `1px solid ${borderColor}`,
                      }}
                    >
                      <Edit3 size={18} strokeWidth={1.5} color={selectedCompany.color} />
                      <input
                        type="number"
                        placeholder="أدخل المبلغ بالريال اليمني"
                        value={customAmount}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || parseInt(val) >= 0) {
                            setCustomAmount(val);
                          }
                        }}
                        className="flex-1 bg-transparent outline-none text-sm font-medium"
                        style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                        dir="ltr"
                        min="50"
                      />
                      <span
                        className="text-[10px] px-2 py-1 rounded-lg font-bold text-white shrink-0"
                        style={{ background: currencyBadgeColors[CURRENCY] }}
                      >
                        {currencySymbols[CURRENCY]}
                      </span>
                    </div>
                    {/* Quick Amount Buttons */}
                    <div className="flex gap-2">
                      {[100, 200, 500, 1000, 2000, 5000].map(amount => (
                        <button
                          key={amount}
                          onClick={() => setCustomAmount(String(amount))}
                          className="flex-1 py-2 rounded-xl text-[11px] font-bold transition-all active:scale-[0.97]"
                          style={{
                            background: customAmount === String(amount) ? selectedCompany.color : (isDark ? '#1A1A1A' : '#F0F0F0'),
                            color: customAmount === String(amount) ? '#FFF' : (isDark ? '#CCC' : '#666'),
                            border: `1px solid ${customAmount === String(amount) ? selectedCompany.color : borderColor}`,
                          }}
                        >
                          {amount.toLocaleString()}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px]" style={{ color: subTextColor }}>
                      الحد الأدنى للشحن: 50 ر.ي
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Section 4: Customer Input */}
              <div>
                <h3 className="text-sm font-bold mb-3" style={{ color: isDark ? '#AAA' : '#888' }}>
                  {selectedCompany.inputLabel}
                </h3>
                {/* Quick Recharge */}
                {lastOrder && (
                  <button
                    onClick={handleQuickRecharge}
                    className="w-full py-2.5 rounded-2xl flex items-center justify-center gap-2 text-xs font-medium mb-3"
                    style={{
                      background: 'rgba(230,0,0,0.06)',
                      border: '1px solid rgba(230,0,0,0.15)',
                      color: '#E60000',
                    }}
                  >
                    <RotateCcw size={14} strokeWidth={1.5} />
                    <span>إعادة آخر طلب ({lastOrder.packageName})</span>
                  </button>
                )}
                <div
                  className="flex items-center gap-2 px-4 py-3.5 rounded-2xl"
                  style={{ background: inputBg, border: `1px solid ${borderColor}` }}
                >
                  <Phone size={18} strokeWidth={1.5} color={selectedCompany.color} />
                  {selectedCompany.inputPrefix && (
                    <>
                      <span
                        className="text-sm font-medium shrink-0"
                        style={{ color: subTextColor }}
                        dir="ltr"
                      >
                        {selectedCompany.inputPrefix}
                      </span>
                      <div className="w-px h-5 shrink-0" style={{ background: isDark ? '#333' : '#DDD' }} />
                    </>
                  )}
                  <input
                    type={selectedCompany.inputType === 'phone' ? 'tel' : 'text'}
                    placeholder={selectedCompany.inputLabel}
                    value={customerInput}
                    onChange={(e) => {
                      if (selectedCompany.inputType === 'phone') {
                        const cleaned = e.target.value.replace(/\D/g, '').slice(0, 9);
                        setCustomerInput(cleaned);
                      } else {
                        setCustomerInput(e.target.value);
                      }
                    }}
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                    dir={selectedCompany.inputType === 'phone' ? 'ltr' : 'auto'}
                  />
                </div>
              </div>

              {/* Promo Code (packages mode only) */}
              {rechargeMode === 'packages' && selectedPackage && (
                <div>
                  <h3 className="text-sm font-bold mb-3" style={{ color: isDark ? '#AAA' : '#888' }}>
                    كود ترويجي
                  </h3>
                  <div className="flex gap-2">
                    <div
                      className="flex items-center gap-2 px-4 py-2.5 rounded-2xl flex-1"
                      style={{
                        background: inputBg,
                        border: promoApplied ? '1px solid #10B981' : `1px solid ${borderColor}`,
                      }}
                    >
                      <Tag size={16} strokeWidth={1.5} color={promoApplied ? '#10B981' : '#E60000'} />
                      <input
                        type="text"
                        placeholder="أدخل الكود"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        disabled={promoApplied}
                        className="flex-1 bg-transparent outline-none text-xs"
                        style={{ color: promoApplied ? '#10B981' : isDark ? '#FFF' : '#1a1a1a' }}
                        dir="ltr"
                      />
                      {promoApplied && <CheckCircle2 size={14} color="#10B981" strokeWidth={1.5} />}
                    </div>
                    <button
                      onClick={handleApplyPromo}
                      disabled={promoApplied || !promoCode.trim()}
                      className="px-4 rounded-2xl text-[10px] font-medium text-white disabled:opacity-40"
                      style={{ background: promoApplied ? '#10B981' : '#E60000' }}
                    >
                      {promoApplied ? 'مطبق' : 'تطبيق'}
                    </button>
                  </div>
                </div>
              )}

              {/* Section 5: Confirm / Balance Check */}
              {((rechargeMode === 'packages' && selectedPackage) || (rechargeMode === 'instant' && parseInt(customAmount) >= 50)) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Balance Summary */}
                  <div
                    className="rounded-2xl p-4 mb-3"
                    style={{ background: cardBg, border: `1px solid ${borderColor}` }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Receipt size={16} strokeWidth={1.5} color="#E60000" />
                      <span className="text-xs font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                        ملخص العملية
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs" style={{ color: subTextColor }}>الشركة</span>
                        <span className="text-xs font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                          {selectedCompany.name}
                        </span>
                      </div>
                      {customerInput && (
                        <div className="flex justify-between">
                          <span className="text-xs" style={{ color: subTextColor }}>
                            {selectedCompany.inputLabel}
                          </span>
                          <span className="text-xs font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }} dir="ltr">
                            {selectedCompany.inputPrefix}{customerInput}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-xs" style={{ color: subTextColor }}>الخدمة</span>
                        <span className="text-xs font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                          {rechargeMode === 'packages' ? selectedPackage?.name : `شحن فوري ${parseInt(customAmount).toLocaleString()} ر.ي`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs" style={{ color: subTextColor }}>المبلغ</span>
                        <span className="text-xs font-bold" style={{ color: '#E60000' }}>
                          {effectivePrice.toLocaleString()} {currencySymbols[CURRENCY]}
                        </span>
                      </div>
                      {promoApplied && promoDiscount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-xs" style={{ color: '#10B981' }}>الخصم</span>
                          <span className="text-xs font-bold" style={{ color: '#10B981' }}>
                            -{promoDiscount.toLocaleString()} {currencySymbols[CURRENCY]}
                          </span>
                        </div>
                      )}
                      <div className="h-px" style={{ background: isDark ? '#333' : '#EEE' }} />
                      <div className="flex justify-between">
                        <span className="text-xs" style={{ color: subTextColor }}>رصيدك الحالي</span>
                        <span className="text-xs font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                          {getBalance().toLocaleString()} {currencySymbols[CURRENCY]}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs font-medium" style={{ color: isDark ? '#AAA' : '#888' }}>الرصيد بعد العملية</span>
                        <span
                          className="text-sm font-bold"
                          style={{
                            color: getBalance() - effectivePrice >= 0 ? '#10B981' : '#E60000',
                          }}
                        >
                          {(getBalance() - effectivePrice).toLocaleString()} {currencySymbols[CURRENCY]}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {errorMessage && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-center mb-3"
                      style={{ color: '#E60000' }}
                    >
                      {errorMessage}
                    </motion.p>
                  )}

                  {/* Confirm Button */}
                  <button
                    onClick={handleConfirm}
                    disabled={
                      isProcessing ||
                      !customerInput.trim() ||
                      (rechargeMode === 'packages' ? !selectedPackageId : parseInt(customAmount) < 50)
                    }
                    className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-white text-sm transition-all active:scale-[0.98] disabled:opacity-40"
                    style={{
                      background: `linear-gradient(135deg, ${selectedCompany.color} 0%, ${selectedCompany.color}CC 100%)`,
                      boxShadow: `0 4px 16px ${selectedCompany.color}40`,
                    }}
                  >
                    {isProcessing ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <span>تأكيد الشراء</span>
                        <span className="opacity-70">
                          ({effectivePrice.toLocaleString()} {currencySymbols[CURRENCY]})
                        </span>
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Success Result */}
          {selectedCompany && orderResult === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-6"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'rgba(16,185,129,0.15)' }}
              >
                <CheckCircle2 size={32} strokeWidth={2} color="#10B981" />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                تم إنشاء الطلب بنجاح
              </h3>
              <p className="text-sm text-center mb-4" style={{ color: subTextColor }}>
                سيتم تنفيذ طلبك في أقرب وقت ممكن
              </p>

              {/* Receipt */}
              {showReceipt && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full rounded-2xl p-4 mb-4"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.02)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Receipt size={16} strokeWidth={1.5} color="#E60000" />
                    <span className="text-xs font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                      إيصال الطلب
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[10px]" style={{ color: subTextColor }}>رقم المرجع</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-mono font-bold" style={{ color: '#E60000' }} dir="ltr">{completedOrderId}</span>
                        <button
                          onClick={async () => {
                            try { await navigator.clipboard.writeText(completedOrderId); showToast('success', 'تم النسخ', 'تم نسخ رقم المرجع'); } catch {}
                          }}
                        >
                          <Copy size={10} color="#E60000" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px]" style={{ color: subTextColor }}>الشركة</span>
                      <span className="text-[10px] font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{selectedCompany.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px]" style={{ color: subTextColor }}>الخدمة</span>
                      <span className="text-[10px] font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                        {rechargeMode === 'packages' ? selectedPackage?.name : `شحن فوري ${parseInt(customAmount).toLocaleString()} ر.ي`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px]" style={{ color: subTextColor }}>المبلغ</span>
                      <span className="text-[10px] font-bold" style={{ color: '#E60000' }}>
                        {effectivePrice.toLocaleString()} {currencySymbols[CURRENCY]}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px]" style={{ color: subTextColor }}>الحالة</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                        قيد الانتظار
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {!showReceipt && (
                <button
                  onClick={() => setShowReceipt(true)}
                  className="w-full py-2.5 rounded-2xl text-xs font-medium mb-3"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                    color: isDark ? '#FFF' : '#1a1a1a',
                  }}
                >
                  <Receipt size={14} className="inline ml-1" />
                  عرض الإيصال
                </button>
              )}

              <div className="flex gap-2 w-full">
                <button
                  onClick={() => useAppStore.getState().setActiveTab('services')}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-white text-sm"
                  style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
                >
                  حسناً
                </button>
                <button
                  onClick={handleResetOrder}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-1.5"
                  style={{
                    background: isDark ? '#2D2D2D' : '#F0F0F0',
                    color: isDark ? '#FFF' : '#1a1a1a',
                  }}
                >
                  <RotateCcw size={14} strokeWidth={1.5} />
                  <span>إعادة الطلب</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Insufficient Balance Result */}
          {selectedCompany && orderResult === 'insufficient' && (
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
              <p className="text-sm text-center mb-2" style={{ color: subTextColor }}>
                رصيدك الحالي لا يكفي لإتمام هذه العملية
              </p>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs" style={{ color: subTextColor }}>رصيدك:</span>
                <span className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                  {getBalance().toLocaleString()} {currencySymbols[CURRENCY]}
                </span>
              </div>
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => useAppStore.getState().setActiveTab('services')}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-white text-sm"
                  style={{ background: 'linear-gradient(135deg, #E60000 0%, #B30000 100%)' }}
                >
                  حسناً
                </button>
                <button
                  onClick={() => setOrderResult(null)}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-1.5"
                  style={{
                    background: isDark ? '#2D2D2D' : '#F0F0F0',
                    color: isDark ? '#FFF' : '#1a1a1a',
                  }}
                >
                  <RotateCcw size={14} strokeWidth={1.5} />
                  <span>رجوع</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
