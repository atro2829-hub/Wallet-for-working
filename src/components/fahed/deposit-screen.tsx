'use client';

import { useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Plus,
  Minus,
  Upload,
  CreditCard,
  Building2,
  MapPin,
  Gift,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  Receipt,
  ChevronDown,
  Image as ImageIcon,
  Tag,
  Info,
  Wallet,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatNumber, currencySymbols, currencyBadgeColors, generateReference, compressBase64Image } from '@/lib/utils';
import { database } from '@/lib/firebase';
import { ref, push, set } from 'firebase/database';

type Tab = 'deposit' | 'withdraw';
type DepositMethod = 'bank_transfer' | 'cash' | 'card';
type WithdrawMethod = 'bank_transfer' | 'cash';

const depositMethods: { id: DepositMethod; label: string; icon: typeof Building2; desc: string }[] = [
  { id: 'bank_transfer', label: 'حوالة بنكية', icon: Building2, desc: 'تحويل عبر البنك' },
  { id: 'cash', label: 'نقطة بيع', icon: MapPin, desc: 'الدفع نقداً' },
  { id: 'card', label: 'كرت شحن', icon: CreditCard, desc: 'إدخال كرت شحن' },
];

const withdrawMethods: { id: WithdrawMethod; label: string; icon: typeof Building2; desc: string }[] = [
  { id: 'bank_transfer', label: 'حوالة بنكية', icon: Building2, desc: 'تحويل لحسابك' },
  { id: 'cash', label: 'نقطة بيع', icon: MapPin, desc: 'استلام نقداً' },
];

const bankDetails = {
  bankName: 'بنك الكريمي',
  accountName: 'محفظة الجنوب',
  accountNumber: '0123-4567-8901-2345',
};

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof CheckCircle2 }> = {
  pending: { label: 'قيد الانتظار', color: '#F59E0B', bgColor: 'rgba(245,158,11,0.12)', icon: Clock },
  approved: { label: 'تمت الموافقة', color: '#10B981', bgColor: 'rgba(16,185,129,0.12)', icon: CheckCircle2 },
  rejected: { label: 'مرفوض', color: '#E60000', bgColor: 'rgba(230,0,0,0.12)', icon: XCircle },
};

export default function DepositScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user, depositRequests, addDepositRequest, withdrawRequests, addWithdrawRequest, applyPromoCode } = useAppStore();

  const [activeTab, setActiveTab] = useState<Tab>('deposit');

  // Deposit form
  const [depositAmount, setDepositAmount] = useState('');
  const [depositCurrency, setDepositCurrency] = useState<'YER' | 'SAR' | 'USD'>('YER');
  const [depositMethod, setDepositMethod] = useState<DepositMethod>('bank_transfer');
  const [receiptImage, setReceiptImage] = useState('');
  const [cardCode, setCardCode] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);

  // Withdraw form
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawCurrency, setWithdrawCurrency] = useState<'YER' | 'SAR' | 'USD'>('YER');
  const [withdrawMethod, setWithdrawMethod] = useState<WithdrawMethod>('bank_transfer');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const getBalance = (currency: string): number => {
    if (!user) return 0;
    const field = `balance${currency}` as keyof typeof user;
    return (user[field] as number) || 0;
  };

  const currentBalance = getBalance(depositCurrency);
  const depositAmountNum = parseFloat(depositAmount) || 0;
  const balanceAfterDeposit = currentBalance + depositAmountNum + promoDiscount;

  const withdrawAmountNum = parseFloat(withdrawAmount) || 0;
  const withdrawBalance = getBalance(withdrawCurrency);
  const balanceAfterWithdraw = withdrawBalance - withdrawAmountNum;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      try {
        const compressed = await compressBase64Image(base64, 400, 0.7);
        setReceiptImage(compressed);
      } catch {
        setReceiptImage(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyPromo = () => {
    if (!promoCode.trim()) return;
    const result = applyPromoCode(promoCode.trim().toUpperCase());
    if (result) {
      setPromoApplied(true);
      if (result.type === 'fixed') {
        setPromoDiscount(result.discount);
      } else {
        setPromoDiscount(Math.round(depositAmountNum * result.discount / 100));
      }
    }
  };

  const handleSubmitDeposit = async () => {
    if (!user || !depositAmountNum || depositAmountNum <= 0) return;

    setIsSubmitting(true);
    try {
      const requestId = generateReference();
      const request = {
        id: requestId,
        userId: user.id,
        userName: user.name,
        amount: depositAmountNum + promoDiscount,
        currency: depositCurrency,
        method: depositMethod,
        receiptImage: depositMethod === 'bank_transfer' ? receiptImage : '',
        status: 'pending' as const,
        notes: promoApplied ? `كود خصم مطبق: ${promoCode}` : '',
        createdAt: new Date().toISOString(),
      };

      // Save to Firebase
      const depositRef = ref(database, `depositRequests/${requestId}`);
      await set(depositRef, request);

      // Update local store
      addDepositRequest(request);

      // Reset form
      setDepositAmount('');
      setReceiptImage('');
      setCardCode('');
      setPromoCode('');
      setPromoApplied(false);
      setPromoDiscount(0);
    } catch (error) {
      console.error('Error submitting deposit:', error);
    }
    setIsSubmitting(false);
  };

  const handleSubmitWithdraw = async () => {
    if (!user || !withdrawAmountNum || withdrawAmountNum <= 0) return;
    if (withdrawAmountNum > withdrawBalance) return;

    setIsSubmitting(true);
    try {
      const requestId = generateReference();
      const request = {
        id: requestId,
        userId: user.id,
        userName: user.name,
        amount: withdrawAmountNum,
        currency: withdrawCurrency,
        method: withdrawMethod,
        bankDetails: withdrawMethod === 'bank_transfer' ? `${bankName} - ${bankAccountNumber}` : '',
        status: 'pending' as const,
        notes: '',
        createdAt: new Date().toISOString(),
      };

      // Save to Firebase
      const withdrawRef = ref(database, `withdrawRequests/${requestId}`);
      await set(withdrawRef, request);

      // Update local store
      addWithdrawRequest(request);

      // Reset form
      setWithdrawAmount('');
      setBankAccountNumber('');
      setBankName('');
    } catch (error) {
      console.error('Error submitting withdraw:', error);
    }
    setIsSubmitting(false);
  };

  const methodLabel = (method: string): string => {
    switch (method) {
      case 'bank_transfer': return 'حوالة بنكية';
      case 'cash': return 'نقطة بيع';
      case 'card': return 'كرت شحن';
      default: return method;
    }
  };

  return (
    <div className="min-h-screen pb-6" style={{ background: isDark ? '#0F0F0F' : '#F5F5F5' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-4 pb-3"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => useAppStore.getState().setActiveScreen('main')}
            className="w-10 h-10 rounded-2xl flex items-center justify-center glass"
          >
            <ArrowRight size={18} strokeWidth={1.5} style={{ color: isDark ? '#FFF' : '#333' }} />
          </button>
          <h1 className="text-xl font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
            {activeTab === 'deposit' ? 'إيداع' : 'سحب'}
          </h1>
        </div>
      </motion.div>

      {/* Tab Toggle */}
      <div className="px-5 mt-2">
        <div
          className="flex rounded-2xl p-1"
          style={{
            background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
          }}
        >
          <button
            onClick={() => setActiveTab('deposit')}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all"
            style={{
              background: activeTab === 'deposit' ? '#E60000' : 'transparent',
              color: activeTab === 'deposit' ? '#FFF' : (isDark ? '#AAA' : '#666'),
              boxShadow: activeTab === 'deposit' ? '0 2px 8px rgba(230,0,0,0.25)' : 'none',
            }}
          >
            <Plus size={14} strokeWidth={2} />
            إيداع
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all"
            style={{
              background: activeTab === 'withdraw' ? '#E60000' : 'transparent',
              color: activeTab === 'withdraw' ? '#FFF' : (isDark ? '#AAA' : '#666'),
              boxShadow: activeTab === 'withdraw' ? '0 2px 8px rgba(230,0,0,0.25)' : 'none',
            }}
          >
            <Minus size={14} strokeWidth={2} />
            سحب
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'deposit' ? (
          <motion.div
            key="deposit"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="px-5 mt-4"
          >
            {/* Deposit Form */}
            {/* Amount Input */}
            <div className="space-y-3">
              <div
                className="rounded-2xl p-4"
                style={{
                  background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                }}
              >
                <label className="text-xs font-medium block mb-2" style={{ color: isDark ? '#AAA' : '#666' }}>المبلغ</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0"
                    className="flex-1 bg-transparent outline-none text-2xl font-bold"
                    style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                    dir="ltr"
                  />
                  <span className="text-sm font-medium" style={{ color: isDark ? '#888' : '#AAA' }}>
                    {currencySymbols[depositCurrency]}
                  </span>
                </div>
              </div>

              {/* Currency Selector */}
              <div
                className="rounded-2xl p-4"
                style={{
                  background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                }}
              >
                <label className="text-xs font-medium block mb-2" style={{ color: isDark ? '#AAA' : '#666' }}>العملة</label>
                <div className="flex gap-2">
                  {(['YER', 'SAR', 'USD'] as const).map((curr) => (
                    <button
                      key={curr}
                      onClick={() => setDepositCurrency(curr)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      style={{
                        background: depositCurrency === curr ? currencyBadgeColors[curr] : (isDark ? '#1A1A1A' : '#F5F5F5'),
                        color: depositCurrency === curr ? '#FFF' : (isDark ? '#AAA' : '#666'),
                        boxShadow: depositCurrency === curr ? `0 2px 8px ${currencyBadgeColors[curr]}44` : 'none',
                      }}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Method Selector */}
              <div
                className="rounded-2xl p-4"
                style={{
                  background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                }}
              >
                <label className="text-xs font-medium block mb-2" style={{ color: isDark ? '#AAA' : '#666' }}>طريقة الإيداع</label>
                <div className="space-y-2">
                  {depositMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setDepositMethod(method.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl transition-all"
                        style={{
                          background: depositMethod === method.id ? 'rgba(230,0,0,0.08)' : (isDark ? '#1A1A1A' : '#F8F8F8'),
                          border: depositMethod === method.id ? '1px solid rgba(230,0,0,0.2)' : '1px solid transparent',
                        }}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: depositMethod === method.id ? 'rgba(230,0,0,0.12)' : (isDark ? '#222' : '#F0F0F0') }}>
                          <Icon size={16} strokeWidth={1.5} color={depositMethod === method.id ? '#E60000' : (isDark ? '#666' : '#AAA')} />
                        </div>
                        <div className="text-right flex-1">
                          <p className="text-sm font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{method.label}</p>
                          <p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>{method.desc}</p>
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: depositMethod === method.id ? '#E60000' : (isDark ? '#333' : '#DDD') }}>
                          {depositMethod === method.id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#E60000' }} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Method-specific content */}
              {depositMethod === 'bank_transfer' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-2xl p-4"
                  style={{
                    background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 size={14} color="#E60000" strokeWidth={1.5} />
                    <span className="text-xs font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>بيانات التحويل البنكي</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: isDark ? '#1A1A1A' : '#F8F8F8' }}>
                      <span className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>البنك</span>
                      <span className="text-xs font-medium" style={{ color: isDark ? '#CCC' : '#333' }}>{bankDetails.bankName}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: isDark ? '#1A1A1A' : '#F8F8F8' }}>
                      <span className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>اسم الحساب</span>
                      <span className="text-xs font-medium" style={{ color: isDark ? '#CCC' : '#333' }}>{bankDetails.accountName}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: isDark ? '#1A1A1A' : '#F8F8F8' }}>
                      <span className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>رقم الحساب</span>
                      <span className="text-xs font-medium font-mono" style={{ color: isDark ? '#CCC' : '#333' }} dir="ltr">{bankDetails.accountNumber}</span>
                    </div>
                  </div>

                  {/* Receipt Upload */}
                  <div className="mt-3">
                    <label className="text-xs font-medium block mb-2" style={{ color: isDark ? '#AAA' : '#666' }}>إيصال التحويل</label>
                    {receiptImage ? (
                      <div className="relative rounded-xl overflow-hidden">
                        <img src={receiptImage} alt="Receipt" className="w-full h-40 object-cover rounded-xl" />
                        <button
                          onClick={() => setReceiptImage('')}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: 'rgba(0,0,0,0.6)' }}
                        >
                          <XCircle size={14} color="#FFF" />
                        </button>
                      </div>
                    ) : (
                      <label className="block rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer" style={{ background: isDark ? '#1A1A1A' : '#F8F8F8', border: `2px dashed ${isDark ? '#333' : '#DDD'}` }}>
                        <ImageIcon size={24} strokeWidth={1.5} color={isDark ? '#444' : '#CCC'} />
                        <span className="text-xs" style={{ color: isDark ? '#555' : '#AAA' }}>اضغط لرفع الإيصال</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    )}
                  </div>
                </motion.div>
              )}

              {depositMethod === 'cash' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-2xl p-4"
                  style={{
                    background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin size={14} color="#E60000" strokeWidth={1.5} />
                    <span className="text-xs font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>أقرب نقاط البيع</span>
                  </div>
                  <div className="space-y-2">
                    {['عدن - المنصورة', 'عدن - خور مكسر', 'لحج - الحوطة', 'أبين - زنجبار'].map((loc, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: isDark ? '#1A1A1A' : '#F8F8F8' }}>
                        <MapPin size={12} color="#E60000" strokeWidth={1.5} />
                        <span className="text-xs" style={{ color: isDark ? '#CCC' : '#333' }}>{loc}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {depositMethod === 'card' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-2xl p-4"
                  style={{
                    background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                  }}
                >
                  <label className="text-xs font-medium block mb-2" style={{ color: isDark ? '#AAA' : '#666' }}>رقم كرت الشحن</label>
                  <input
                    type="text"
                    value={cardCode}
                    onChange={(e) => setCardCode(e.target.value)}
                    placeholder="أدخل رقم كرت الشحن"
                    className="w-full bg-transparent outline-none text-lg font-bold tracking-wider p-2 rounded-xl"
                    style={{
                      color: isDark ? '#FFF' : '#1a1a1a',
                      background: isDark ? '#1A1A1A' : '#F8F8F8',
                    }}
                    dir="ltr"
                  />
                </motion.div>
              )}

              {/* Promo Code */}
              <div
                className="rounded-2xl p-4"
                style={{
                  background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                }}
              >
                <label className="text-xs font-medium block mb-2" style={{ color: isDark ? '#AAA' : '#666' }}>كود الخصم</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => { setPromoCode(e.target.value); setPromoApplied(false); setPromoDiscount(0); }}
                    placeholder="أدخل كود الخصم"
                    className="flex-1 bg-transparent outline-none text-sm p-2.5 rounded-xl"
                    style={{
                      color: isDark ? '#FFF' : '#1a1a1a',
                      background: isDark ? '#1A1A1A' : '#F8F8F8',
                    }}
                  />
                  <button
                    onClick={handleApplyPromo}
                    disabled={promoApplied || !promoCode.trim()}
                    className="px-4 py-2.5 rounded-xl text-xs font-medium"
                    style={{
                      background: promoApplied ? 'rgba(16,185,129,0.12)' : '#E60000',
                      color: promoApplied ? '#10B981' : '#FFF',
                    }}
                  >
                    {promoApplied ? 'مطبق' : 'تطبيق'}
                  </button>
                </div>
                {promoApplied && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Tag size={10} color="#10B981" />
                    <span className="text-[10px]" style={{ color: '#10B981' }}>خصم {formatNumber(promoDiscount)} {currencySymbols[depositCurrency]}</span>
                  </div>
                )}
              </div>

              {/* Balance After Deposit Preview */}
              {depositAmountNum > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-4"
                  style={{
                    background: 'linear-gradient(145deg, #E60000 0%, #8B0000 100%)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/50 text-[10px]">الرصيد بعد الإيداع</p>
                      <p className="text-white text-xl font-bold">{formatNumber(balanceAfterDeposit)} {currencySymbols[depositCurrency]}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                      <Wallet size={18} color="#FFF" strokeWidth={1.5} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmitDeposit}
                disabled={!depositAmountNum || depositAmountNum <= 0 || isSubmitting}
                className="w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                style={{
                  background: depositAmountNum > 0 ? '#E60000' : (isDark ? '#1A1A1A' : '#EEE'),
                  color: depositAmountNum > 0 ? '#FFF' : (isDark ? '#444' : '#AAA'),
                  boxShadow: depositAmountNum > 0 ? '0 4px 16px rgba(230,0,0,0.3)' : 'none',
                }}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={16} strokeWidth={2} />
                    تأكيد الطلب
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="withdraw"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="px-5 mt-4"
          >
            <div className="space-y-3">
              {/* Withdraw Amount */}
              <div
                className="rounded-2xl p-4"
                style={{
                  background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                }}
              >
                <label className="text-xs font-medium block mb-2" style={{ color: isDark ? '#AAA' : '#666' }}>المبلغ</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0"
                    className="flex-1 bg-transparent outline-none text-2xl font-bold"
                    style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                    dir="ltr"
                  />
                  <span className="text-sm font-medium" style={{ color: isDark ? '#888' : '#AAA' }}>
                    {currencySymbols[withdrawCurrency]}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Info size={10} color={isDark ? '#666' : '#AAA'} />
                  <span className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>
                    الرصيد المتاح: {formatNumber(withdrawBalance)} {currencySymbols[withdrawCurrency]}
                  </span>
                </div>
              </div>

              {/* Currency Selector */}
              <div
                className="rounded-2xl p-4"
                style={{
                  background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                }}
              >
                <label className="text-xs font-medium block mb-2" style={{ color: isDark ? '#AAA' : '#666' }}>العملة</label>
                <div className="flex gap-2">
                  {(['YER', 'SAR', 'USD'] as const).map((curr) => (
                    <button
                      key={curr}
                      onClick={() => setWithdrawCurrency(curr)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                      style={{
                        background: withdrawCurrency === curr ? currencyBadgeColors[curr] : (isDark ? '#1A1A1A' : '#F5F5F5'),
                        color: withdrawCurrency === curr ? '#FFF' : (isDark ? '#AAA' : '#666'),
                      }}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Method Selector */}
              <div
                className="rounded-2xl p-4"
                style={{
                  background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                }}
              >
                <label className="text-xs font-medium block mb-2" style={{ color: isDark ? '#AAA' : '#666' }}>طريقة السحب</label>
                <div className="space-y-2">
                  {withdrawMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setWithdrawMethod(method.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl transition-all"
                        style={{
                          background: withdrawMethod === method.id ? 'rgba(230,0,0,0.08)' : (isDark ? '#1A1A1A' : '#F8F8F8'),
                          border: withdrawMethod === method.id ? '1px solid rgba(230,0,0,0.2)' : '1px solid transparent',
                        }}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: withdrawMethod === method.id ? 'rgba(230,0,0,0.12)' : (isDark ? '#222' : '#F0F0F0') }}>
                          <Icon size={16} strokeWidth={1.5} color={withdrawMethod === method.id ? '#E60000' : (isDark ? '#666' : '#AAA')} />
                        </div>
                        <div className="text-right flex-1">
                          <p className="text-sm font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{method.label}</p>
                          <p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>{method.desc}</p>
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: withdrawMethod === method.id ? '#E60000' : (isDark ? '#333' : '#DDD') }}>
                          {withdrawMethod === method.id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#E60000' }} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bank Details for bank transfer */}
              {withdrawMethod === 'bank_transfer' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-2xl p-4"
                  style={{
                    background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                  }}
                >
                  <label className="text-xs font-medium block mb-2" style={{ color: isDark ? '#AAA' : '#666' }}>اسم البنك</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="مثال: بنك الكريمي"
                    className="w-full bg-transparent outline-none text-sm p-2.5 rounded-xl mb-3"
                    style={{
                      color: isDark ? '#FFF' : '#1a1a1a',
                      background: isDark ? '#1A1A1A' : '#F8F8F8',
                    }}
                  />
                  <label className="text-xs font-medium block mb-2" style={{ color: isDark ? '#AAA' : '#666' }}>رقم الحساب</label>
                  <input
                    type="text"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="أدخل رقم الحساب البنكي"
                    className="w-full bg-transparent outline-none text-sm p-2.5 rounded-xl"
                    style={{
                      color: isDark ? '#FFF' : '#1a1a1a',
                      background: isDark ? '#1A1A1A' : '#F8F8F8',
                    }}
                    dir="ltr"
                  />
                </motion.div>
              )}

              {/* Balance After Withdraw */}
              {withdrawAmountNum > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-4"
                  style={{
                    background: balanceAfterWithdraw >= 0
                      ? 'linear-gradient(145deg, #E60000 0%, #8B0000 100%)'
                      : 'linear-gradient(145deg, #8B0000 0%, #5C0000 100%)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/50 text-[10px]">الرصيد بعد السحب</p>
                      <p className="text-white text-xl font-bold">{formatNumber(Math.max(0, balanceAfterWithdraw))} {currencySymbols[withdrawCurrency]}</p>
                      {balanceAfterWithdraw < 0 && (
                        <p className="text-[10px] mt-1" style={{ color: '#FCA5A5' }}>المبلغ يتجاوز الرصيد المتاح</p>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                      <Wallet size={18} color="#FFF" strokeWidth={1.5} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmitWithdraw}
                disabled={!withdrawAmountNum || withdrawAmountNum <= 0 || withdrawAmountNum > withdrawBalance || isSubmitting}
                className="w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                style={{
                  background: withdrawAmountNum > 0 && withdrawAmountNum <= withdrawBalance ? '#E60000' : (isDark ? '#1A1A1A' : '#EEE'),
                  color: withdrawAmountNum > 0 && withdrawAmountNum <= withdrawBalance ? '#FFF' : (isDark ? '#444' : '#AAA'),
                  boxShadow: withdrawAmountNum > 0 && withdrawAmountNum <= withdrawBalance ? '0 4px 16px rgba(230,0,0,0.3)' : 'none',
                }}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={16} strokeWidth={2} />
                    تأكيد طلب السحب
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Section */}
      <div className="px-5 mt-6">
        <h3 className="text-sm font-bold mb-3" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>السجل</h3>

        <AnimatePresence mode="wait">
          {activeTab === 'deposit' ? (
            <motion.div
              key="deposit-history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              {depositRequests.length === 0 ? (
                <div
                  className="rounded-2xl p-6 flex flex-col items-center"
                  style={{
                    background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                  }}
                >
                  <Receipt size={28} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} />
                  <p className="text-xs mt-2" style={{ color: isDark ? '#555' : '#AAA' }}>لا توجد طلبات إيداع</p>
                </div>
              ) : (
                depositRequests.map((req, index) => {
                  const status = statusConfig[req.status] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  return (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.03 * index }}
                      className="flex items-center gap-3 p-3 rounded-2xl"
                      style={{
                        background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                      }}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: status.bgColor }}>
                        <StatusIcon size={16} strokeWidth={1.5} color={status.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                            {formatNumber(req.amount)} {currencySymbols[req.currency]}
                          </p>
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold text-white" style={{ background: currencyBadgeColors[req.currency] }}>
                            {req.currency}
                          </span>
                        </div>
                        <p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>{methodLabel(req.method)}</p>
                      </div>
                      <span className="text-[10px] px-2 py-1 rounded-full font-medium" style={{ background: status.bgColor, color: status.color }}>
                        {status.label}
                      </span>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          ) : (
            <motion.div
              key="withdraw-history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              {withdrawRequests.length === 0 ? (
                <div
                  className="rounded-2xl p-6 flex flex-col items-center"
                  style={{
                    background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                  }}
                >
                  <Receipt size={28} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} />
                  <p className="text-xs mt-2" style={{ color: isDark ? '#555' : '#AAA' }}>لا توجد طلبات سحب</p>
                </div>
              ) : (
                withdrawRequests.map((req, index) => {
                  const status = statusConfig[req.status] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  return (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.03 * index }}
                      className="flex items-center gap-3 p-3 rounded-2xl"
                      style={{
                        background: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                      }}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: status.bgColor }}>
                        <StatusIcon size={16} strokeWidth={1.5} color={status.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                            {formatNumber(req.amount)} {currencySymbols[req.currency]}
                          </p>
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold text-white" style={{ background: currencyBadgeColors[req.currency] }}>
                            {req.currency}
                          </span>
                        </div>
                        <p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>{methodLabel(req.method)}</p>
                      </div>
                      <span className="text-[10px] px-2 py-1 rounded-full font-medium" style={{ background: status.bgColor, color: status.color }}>
                        {status.label}
                      </span>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
