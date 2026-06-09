'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRightLeft, RefreshCw, TrendingUp, TrendingDown,
  Globe, Calculator, History, X, CheckCircle2, Copy, Share2, Download,
  FileText, Wallet, Shield
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { currencySymbols, currencyNames, currencyBadgeColors, formatNumber, formatBalance, timeAgo, defaultExchangeRates } from '@/lib/utils';
import { LOGO_BASE64 } from '@/lib/logo';
import { ref, get, update } from 'firebase/database';
import { database } from '@/lib/firebase';

interface ConversionRecord {
  fromAmount: number;
  fromCurrency: string;
  toAmount: number;
  toCurrency: string;
  rate: number;
  commission: number;
  date: string;
  referenceNumber?: string;
}

interface VoucherData {
  fromAmount: number;
  fromCurrency: string;
  toAmount: number;
  toCurrency: string;
  rate: number;
  commission: number;
  commissionAmount: number;
  rawResult: number;
  referenceNumber: string;
  date: string;
  userName: string;
  userId: string;
  senderAccount: string;
}

function generateReferenceNumber(): string {
  const prefix = 'EXC';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

function formatVoucherDate(isoString: string): string {
  const d = new Date(isoString);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} - ${hours}:${minutes}`;
}

export default function ExchangeScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user, setUser, setActiveScreen, exchangeRates, setExchangeRates, addNotification } = useAppStore();

  // Check if user is verified - block currency exchange if not
  const isVerified = user?.kycStatus === 'verified';

  // Show verification block on mount if not verified
  useEffect(() => {
    if (!isVerified) {
      addNotification({
        id: Date.now().toString(),
        title: 'يرجى توثيق حسابك أولاً',
        body: 'لا يمكنك تبديل العملات إلا بعد توثيق حسابك',
        type: 'security',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      setActiveScreen('kyc');
    }
  }, [isVerified, addNotification, setActiveScreen]);

  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toISOString());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [commission, setCommission] = useState<number>(1.5);

  // Converter state
  const [fromAmount, setFromAmount] = useState('1000');
  const [fromCurrency, setFromCurrency] = useState<'YER' | 'SAR' | 'USD'>('YER');
  const [toCurrency, setToCurrency] = useState<'YER' | 'SAR' | 'USD'>('SAR');
  const [conversionHistory, setConversionHistory] = useState<ConversionRecord[]>([]);

  // Voucher state
  const [showVoucher, setShowVoucher] = useState(false);
  const [voucherData, setVoucherData] = useState<VoucherData | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Confirm dialog state
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Receipt ref for download
  const receiptRef = useRef<HTMLDivElement>(null);

  // Rate pairs with trend
  const [trends, setTrends] = useState<Record<string, 'up' | 'down' | 'stable'>>({
    'YER-SAR': 'stable', 'YER-USD': 'stable', 'SAR-USD': 'stable'
  });

  // Fetch exchange rates from Firebase on mount
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const snapshot = await get(ref(database, 'adminSettings/exchangeRates'));
        if (snapshot.exists()) {
          const data = snapshot.val();
          const rates = {
            YER: 1,
            SAR: data.YER_SAR ?? defaultExchangeRates.SAR,
            USD: data.YER_USD ?? defaultExchangeRates.USD,
          };
          setExchangeRates(rates);
          if (typeof data.commission === 'number') {
            setCommission(data.commission);
          }
        }
      } catch {
        // Fall back to default rates from store (already initialized)
      }
    };
    fetchRates();
  }, [setExchangeRates]);

  // Calculate conversion result inline
  const getRate = (from: string, to: string): number => {
    if (from === to) return 1;
    if (from === 'YER' && to === 'SAR') return 1 / exchangeRates.SAR;
    if (from === 'YER' && to === 'USD') return 1 / exchangeRates.USD;
    if (from === 'SAR' && to === 'YER') return exchangeRates.SAR;
    if (from === 'SAR' && to === 'USD') return exchangeRates.USD / exchangeRates.SAR;
    if (from === 'USD' && to === 'YER') return exchangeRates.USD;
    if (from === 'USD' && to === 'SAR') return exchangeRates.SAR / exchangeRates.USD;
    return 1;
  };

  const currentRate = getRate(fromCurrency, toCurrency);
  const rawResult = (parseFloat(fromAmount) || 0) * currentRate;
  const commissionAmount = rawResult * (commission / 100);
  const result = rawResult - commissionAmount;

  // Get balance for currency
  const getBalance = (currency: string): number => {
    if (!user) return 0;
    switch (currency) {
      case 'YER': return user.balanceYER || 0;
      case 'SAR': return user.balanceSAR || 0;
      case 'USD': return user.balanceUSD || 0;
      default: return 0;
    }
  };

  const fromBalance = getBalance(fromCurrency);

  const handleSwap = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const snapshot = await get(ref(database, 'adminSettings/exchangeRates'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const newRates = {
          YER: 1,
          SAR: data.YER_SAR ?? exchangeRates.SAR,
          USD: data.YER_USD ?? exchangeRates.USD,
        };
        setTrends({
          'YER-SAR': newRates.SAR > exchangeRates.SAR ? 'up' : newRates.SAR < exchangeRates.SAR ? 'down' : 'stable',
          'YER-USD': newRates.USD > exchangeRates.USD ? 'up' : newRates.USD < exchangeRates.USD ? 'down' : 'stable',
          'SAR-USD': (newRates.USD / newRates.SAR) > (exchangeRates.USD / exchangeRates.SAR) ? 'up' : 'down',
        });
        setExchangeRates(newRates);
        if (typeof data.commission === 'number') {
          setCommission(data.commission);
        }
      }
    } catch {
      // Keep existing rates on error
    }
    setLastUpdate(new Date().toISOString());
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleConfirmExchange = () => {
    const amount = parseFloat(fromAmount) || 0;
    if (!amount || result <= 0) return;
    if (amount > fromBalance) return;
    setShowConfirm(true);
  };

  const handleSaveConversion = async () => {
    const amount = parseFloat(fromAmount) || 0;
    if (!amount || result <= 0) return;
    if (!user) return;

    setIsProcessing(true);

    try {
      // Deduct from source and add to destination
      const fromBalanceField = `balance${fromCurrency}` as 'balanceYER' | 'balanceSAR' | 'balanceUSD';
      const toBalanceField = `balance${toCurrency}` as 'balanceYER' | 'balanceSAR' | 'balanceUSD';

      const currentFromBalance = (user as Record<string, unknown>)[fromBalanceField] as number;
      const currentToBalance = (user as Record<string, unknown>)[toBalanceField] as number;

      const newFromBalance = currentFromBalance - amount;
      const newToBalance = currentToBalance + result;

      // Update Firebase
      const updates: Record<string, unknown> = {};
      updates[`users/${user.id}/${fromBalanceField}`] = newFromBalance;
      updates[`users/${user.id}/${toBalanceField}`] = newToBalance;

      // Add transaction record
      const txId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      updates[`transactions/${txId}`] = {
        id: txId,
        fromUserId: user.id,
        toUserId: user.id,
        amount: amount,
        currency: fromCurrency,
        type: 'exchange',
        status: 'completed',
        description: `تبديل ${formatNumber(amount)} ${currencyNames[fromCurrency]} إلى ${formatNumber(parseFloat(result.toFixed(2)))} ${currencyNames[toCurrency]}`,
        createdAt: new Date().toISOString(),
        exchangeRate: currentRate,
        exchangeFromCurrency: fromCurrency,
        exchangeToCurrency: toCurrency,
        exchangeFromAmount: amount,
        exchangeToAmount: result,
        exchangeCommission: commission,
      };

      // Add notification
      const notifId = `notif-${Date.now()}`;
      updates[`notifications/${user.id}/${notifId}`] = {
        title: 'تم التبديل بنجاح',
        body: `تم تبديل ${formatNumber(amount)} ${currencySymbols[fromCurrency]} إلى ${result < 1 ? result.toFixed(4) : formatNumber(parseFloat(result.toFixed(2)))} ${currencySymbols[toCurrency]}`,
        type: 'transaction',
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      await update(ref(database), updates);

      // Generate voucher
      const refNum = generateReferenceNumber();
      const now = new Date().toISOString();

      const record: ConversionRecord = {
        fromAmount: amount,
        fromCurrency,
        toAmount: result,
        toCurrency,
        rate: currentRate,
        commission,
        date: now,
        referenceNumber: refNum,
      };
      setConversionHistory(prev => [record, ...prev].slice(0, 10));

      // Show voucher
      setVoucherData({
        fromAmount: amount,
        fromCurrency,
        toAmount: result,
        toCurrency,
        rate: currentRate,
        commission,
        commissionAmount,
        rawResult,
        referenceNumber: refNum,
        date: now,
        userName: user.name || 'مستخدم',
        userId: user.userId || '------',
        senderAccount: user.userId || '------',
      });
      setShowVoucher(true);
      setShowConfirm(false);
    } catch {
      // Handle error silently
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyRef = () => {
    if (voucherData) {
      navigator.clipboard.writeText(voucherData.referenceNumber).catch(() => {});
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const handleShareReceipt = async () => {
    if (!voucherData) return;
    const text = `
سند التحويل - محفظة الجنوب
══════════════════════════════
رقم السند: ${voucherData.referenceNumber}
التاريخ: ${formatVoucherDate(voucherData.date)}
══════════════════════════════
من: ${voucherData.userName}
رقم الحساب: ${voucherData.senderAccount}
══════════════════════════════
المبلغ المرسل: ${formatNumber(voucherData.fromAmount)} ${currencySymbols[voucherData.fromCurrency]} (${currencyNames[voucherData.fromCurrency]})
المبلغ المستلم: ${voucherData.toAmount < 1 ? voucherData.toAmount.toFixed(4) : formatNumber(parseFloat(voucherData.toAmount.toFixed(2)))} ${currencySymbols[voucherData.toCurrency]} (${currencyNames[voucherData.toCurrency]})
══════════════════════════════
سعر الصرف: 1 ${currencySymbols[voucherData.fromCurrency]} = ${voucherData.rate < 1 ? voucherData.rate.toFixed(4) : voucherData.rate.toFixed(2)} ${currencySymbols[voucherData.toCurrency]}
العمولة (${voucherData.commission}%): ${voucherData.commissionAmount < 1 ? voucherData.commissionAmount.toFixed(4) : formatNumber(parseFloat(voucherData.commissionAmount.toFixed(2)))} ${currencySymbols[voucherData.toCurrency]}
صافي المبلغ: ${voucherData.toAmount < 1 ? voucherData.toAmount.toFixed(4) : formatNumber(parseFloat(voucherData.toAmount.toFixed(2)))} ${currencySymbols[voucherData.toCurrency]}
══════════════════════════════
محفظة الجنوب - محفظتك الرقمية
`.trim();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'سند التحويل - محفظة الجنوب',
          text,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: isDark ? '#0F0F0F' : '#FFFFFF',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `receipt-${voucherData?.referenceNumber || 'exchange'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      // Fallback to share
      handleShareReceipt();
    }
  };

  // Live rate pairs for display
  const liveRateCards = [
    { from: 'USD', to: 'YER', rate: exchangeRates.USD, key: 'YER-USD', fromSymbol: '$', toSymbol: 'ر.ي' },
    { from: 'SAR', to: 'YER', rate: exchangeRates.SAR, key: 'YER-SAR', fromSymbol: 'ر.س', toSymbol: 'ر.ي' },
    { from: 'USD', to: 'SAR', rate: exchangeRates.SAR / exchangeRates.USD, key: 'SAR-USD', fromSymbol: '$', toSymbol: 'ر.س' },
  ];

  const voucherBg = isDark ? '#1A1A1A' : '#FFFFFF';
  const voucherBorderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  const voucherDividerColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)';

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
              <h1 className="text-white text-xl font-bold">تبديل العملات</h1>
              <p className="text-white/40 text-xs">اسعار مباشرة • تبديل فوري</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.2)' }}>
              <Globe size={20} strokeWidth={1.5} color="#10B981" />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 pb-8 space-y-4">
        {/* ═══ Live Exchange Rates ═══ */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden" style={{ background: cardBg, backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="pulse-dot w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
              <span className="text-xs font-bold" style={{ color: '#10B981' }}>اسعار مباشرة</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>آخر تحديث: الآن</span>
              <motion.button whileTap={{ scale: 0.85 }} onClick={handleRefresh} animate={{ rotate: isRefreshing ? 360 : 0 }} transition={{ duration: 0.8 }}
                className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }}>
                <RefreshCw size={12} color={isDark ? '#AAA' : '#888'} />
              </motion.button>
            </div>
          </div>

          <div className="px-4 pb-4 space-y-2">
            {liveRateCards.map((pair) => {
              const trend = trends[pair.key];
              return (
                <div key={pair.key} className="flex items-center justify-between p-3 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold" style={{ background: `${currencyBadgeColors[pair.from]}15`, color: currencyBadgeColors[pair.from] }}>
                        {pair.fromSymbol}
                      </div>
                      <ArrowRightLeft size={10} color="#E60000" />
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold" style={{ background: `${currencyBadgeColors[pair.to]}15`, color: currencyBadgeColors[pair.to] }}>
                        {pair.toSymbol}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium" style={{ color: isDark ? '#CCC' : '#444' }}>
                        1 {pair.from} → {pair.to}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" dir="ltr" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                      {pair.rate < 1 ? pair.rate.toFixed(4) : formatNumber(parseFloat(pair.rate.toFixed(2)))}
                    </span>
                    {trend === 'up' && <TrendingUp size={12} color="#10B981" />}
                    {trend === 'down' && <TrendingDown size={12} color="#E60000" />}
                    {trend === 'stable' && <div className="w-1.5 h-1.5 rounded-full" style={{ background: isDark ? '#555' : '#CCC' }} />}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ═══ Currency Converter Form ═══ */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl p-4" style={{ background: cardBg, backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Calculator size={16} color="#E60000" />
            <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>محول العملات</h3>
          </div>

          <div className="space-y-3">
            {/* From */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium" style={{ color: isDark ? '#888' : '#999' }}>من</span>
                <span className="text-[11px]" style={{ color: isDark ? '#666' : '#BBB' }}>
                  الرصيد: {formatNumber(fromBalance)} {currencySymbols[fromCurrency]}
                </span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                <input type="number" value={fromAmount} onChange={e => setFromAmount(e.target.value)} placeholder="0" dir="ltr"
                  className="flex-1 bg-transparent outline-none text-2xl font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }} />
                <select value={fromCurrency} onChange={e => setFromCurrency(e.target.value as 'YER' | 'SAR' | 'USD')}
                  className="px-3 py-2 rounded-lg text-sm font-bold outline-none" style={{ background: `${currencyBadgeColors[fromCurrency]}15`, color: currencyBadgeColors[fromCurrency] }}>
                  <option value="YER">ر.ي</option><option value="SAR">ر.س</option><option value="USD">$</option>
                </select>
              </div>
            </div>

            {/* Swap button */}
            <div className="flex justify-center">
              <motion.button whileTap={{ scale: 0.85, rotate: 180 }} onClick={handleSwap}
                className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(230,0,0,0.15)' }}>
                <ArrowRightLeft size={18} color="#E60000" />
              </motion.button>
            </div>

            {/* To */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium" style={{ color: isDark ? '#888' : '#999' }}>الى</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                <motion.p key={result} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="flex-1 text-2xl font-bold" dir="ltr" style={{ color: '#E60000' }}>
                  {result < 0.01 && result > 0 ? result.toFixed(6) : result < 1 ? result.toFixed(4) : formatNumber(parseFloat(result.toFixed(2)))}
                </motion.p>
                <select value={toCurrency} onChange={e => setToCurrency(e.target.value as 'YER' | 'SAR' | 'USD')}
                  className="px-3 py-2 rounded-lg text-sm font-bold outline-none" style={{ background: `${currencyBadgeColors[toCurrency]}15`, color: currencyBadgeColors[toCurrency] }}>
                  <option value="YER">ر.ي</option><option value="SAR">ر.س</option><option value="USD">$</option>
                </select>
              </div>
            </div>

            {/* Rate & Fee Info */}
            <div className="space-y-2 p-3 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
              <div className="flex items-center justify-between">
                <span className="text-[11px]" style={{ color: isDark ? '#888' : '#AAA' }}>سعر الصرف</span>
                <span className="text-[11px] font-bold" dir="ltr" style={{ color: isDark ? '#CCC' : '#444' }}>
                  1 {currencySymbols[fromCurrency]} = {currentRate < 1 ? currentRate.toFixed(4) : currentRate.toFixed(2)} {currencySymbols[toCurrency]}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px]" style={{ color: isDark ? '#888' : '#AAA' }}>المبلغ قبل العمولة</span>
                <span className="text-[11px] font-bold" dir="ltr" style={{ color: isDark ? '#CCC' : '#444' }}>
                  {rawResult < 1 ? rawResult.toFixed(4) : formatNumber(parseFloat(rawResult.toFixed(2)))} {currencySymbols[toCurrency]}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px]" style={{ color: isDark ? '#888' : '#AAA' }}>رسوم التبديل ({commission}%)</span>
                <span className="text-[11px] font-bold" dir="ltr" style={{ color: '#E60000' }}>
                  -{commissionAmount < 1 ? commissionAmount.toFixed(4) : formatNumber(parseFloat(commissionAmount.toFixed(2)))} {currencySymbols[toCurrency]}
                </span>
              </div>
              <div className="h-px" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>ستحصل على</span>
                <span className="text-xs font-bold" dir="ltr" style={{ color: '#10B981' }}>
                  {result < 0.01 && result > 0 ? result.toFixed(6) : result < 1 ? result.toFixed(4) : formatNumber(parseFloat(result.toFixed(2)))} {currencySymbols[toCurrency]}
                </span>
              </div>
            </div>

            {/* Insufficient balance warning */}
            {(parseFloat(fromAmount) || 0) > fromBalance && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(230,0,0,0.1)', border: '1px solid rgba(230,0,0,0.2)' }}>
                <Wallet size={14} color="#E60000" />
                <span className="text-[11px] font-medium" style={{ color: '#E60000' }}>رصيدك غير كافي في {currencyNames[fromCurrency]}</span>
              </div>
            )}

            <motion.button whileTap={{ scale: 0.95 }} onClick={handleConfirmExchange}
              disabled={!fromAmount || result <= 0 || (parseFloat(fromAmount) || 0) > fromBalance || fromCurrency === toCurrency}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-opacity"
              style={{ background: (!fromAmount || result <= 0 || (parseFloat(fromAmount) || 0) > fromBalance || fromCurrency === toCurrency) ? '#555' : '#E60000' }}>
              {fromCurrency === toCurrency ? 'اختر عملتين مختلفتين' : 'تأكيد التبديل'}
            </motion.button>
          </div>
        </motion.div>

        {/* Conversion History */}
        {conversionHistory.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl p-4" style={{ background: cardBg, backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
            <div className="flex items-center gap-2 mb-3">
              <History size={16} color="#E60000" />
              <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>سجل التحويلات</h3>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {conversionHistory.map((rec, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: currencyBadgeColors[rec.fromCurrency] }}>
                      {rec.fromAmount.toLocaleString()} {currencySymbols[rec.fromCurrency]}
                    </span>
                    <ArrowRightLeft size={10} color={isDark ? '#555' : '#AAA'} />
                    <span className="text-xs font-bold" style={{ color: currencyBadgeColors[rec.toCurrency] }}>
                      {rec.toAmount < 1 ? rec.toAmount.toFixed(4) : rec.toAmount.toLocaleString()} {currencySymbols[rec.toCurrency]}
                    </span>
                  </div>
                  <span className="text-[9px]" style={{ color: isDark ? '#555' : '#BBB' }}>{timeAgo(rec.date)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          CONFIRM DIALOG
          ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl p-5"
              style={{ background: isDark ? '#1A1A1A' : '#FFFFFF', border: `1px solid ${voucherBorderColor}` }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(230,0,0,0.1)' }}>
                  <Shield size={20} strokeWidth={1.5} color="#E60000" />
                </div>
                <div>
                  <h3 className="text-base font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>تأكيد التبديل</h3>
                  <p className="text-[11px]" style={{ color: isDark ? '#888' : '#AAA' }}>هل أنت متأكد من عملية التبديل؟</p>
                </div>
              </div>

              <div className="space-y-2 mb-4 p-3 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                <div className="flex justify-between">
                  <span className="text-xs" style={{ color: isDark ? '#888' : '#AAA' }}>من</span>
                  <span className="text-xs font-bold" style={{ color: currencyBadgeColors[fromCurrency] }}>
                    {formatNumber(parseFloat(fromAmount) || 0)} {currencySymbols[fromCurrency]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs" style={{ color: isDark ? '#888' : '#AAA' }}>الى</span>
                  <span className="text-xs font-bold" style={{ color: '#10B981' }}>
                    {result < 1 ? result.toFixed(4) : formatNumber(parseFloat(result.toFixed(2)))} {currencySymbols[toCurrency]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs" style={{ color: isDark ? '#888' : '#AAA' }}>العمولة</span>
                  <span className="text-xs font-bold" style={{ color: '#E60000' }}>
                    {commissionAmount < 1 ? commissionAmount.toFixed(4) : formatNumber(parseFloat(commissionAmount.toFixed(2)))} {currencySymbols[toCurrency]}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold"
                  style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: isDark ? '#FFF' : '#1a1a1a' }}>
                  إلغاء
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleSaveConversion} disabled={isProcessing}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
                  style={{ background: isProcessing ? '#555' : '#E60000' }}>
                  {isProcessing ? 'جارٍ التبديل...' : 'تأكيد'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════
          TRANSFER VOUCHER / RECEIPT (سند التحويل)
          ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showVoucher && voucherData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowVoucher(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-full max-w-lg rounded-t-3xl overflow-hidden"
              style={{ background: isDark ? '#0F0F0F' : '#F5F5F5', maxHeight: '92vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Voucher Header */}
              <div className="relative px-5 pt-5 pb-4" style={{ background: 'linear-gradient(145deg, #1A1A1A 0%, #2A0A0A 50%, #0F0F0F 100%)' }}>
                <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(230,0,0,0.15), transparent 50%)' }} />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.2)' }}>
                      <CheckCircle2 size={20} strokeWidth={1.5} color="#10B981" />
                    </div>
                    <div>
                      <h2 className="text-white text-base font-bold">تم التبديل بنجاح</h2>
                      <p className="text-white/40 text-[11px]">سند التحويل</p>
                    </div>
                  </div>
                  <button onClick={() => setShowVoucher(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <X size={16} color="#FFF" />
                  </button>
                </div>
              </div>

              {/* Voucher Body */}
              <div className="px-5 py-4 overflow-y-auto" style={{ maxHeight: 'calc(92vh - 80px)' }}>
                <div ref={receiptRef}>
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                      background: voucherBg,
                      border: `1px solid ${voucherBorderColor}`,
                      boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.08)',
                    }}
                  >
                    {/* Logo + Brand Row */}
                    <div className="flex items-center gap-3 p-4" style={{ borderBottom: `1px dashed ${voucherDividerColor}` }}>
                      <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center" style={{ background: 'rgba(230,0,0,0.1)' }}>
                        <img src={LOGO_BASE64} alt="محفظة الجنوب" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>محفظة الجنوب</p>
                        <p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>سند تبديل عملات</p>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-md" style={{ background: 'rgba(16,185,129,0.1)' }}>
                        <CheckCircle2 size={10} color="#10B981" />
                        <span className="text-[9px] font-bold" style={{ color: '#10B981' }}>مكتمل</span>
                      </div>
                    </div>

                    {/* Receipt Number & Date */}
                    <div className="p-4" style={{ borderBottom: `1px dashed ${voucherDividerColor}` }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText size={12} color="#E60000" />
                          <span className="text-[10px] font-bold" style={{ color: isDark ? '#888' : '#999' }}>رقم السند</span>
                        </div>
                        <button onClick={handleCopyRef}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md active:scale-95 transition-transform"
                          style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                          <span className="text-[11px] font-mono font-bold" dir="ltr" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                            {voucherData.referenceNumber}
                          </span>
                          {copiedRef ? <CheckCircle2 size={12} color="#10B981" /> : <Copy size={12} color={isDark ? '#888' : '#AAA'} />}
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>التاريخ والوقت</span>
                        <span className="text-[11px] font-medium" dir="ltr" style={{ color: isDark ? '#CCC' : '#555' }}>
                          {formatVoucherDate(voucherData.date)}
                        </span>
                      </div>
                    </div>

                    {/* Sender Info */}
                    <div className="p-4" style={{ borderBottom: `1px dashed ${voucherDividerColor}` }}>
                      <p className="text-[10px] font-bold mb-2" style={{ color: '#E60000' }}>معلومات المرسل</p>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px]" style={{ color: isDark ? '#888' : '#999' }}>اسم المرسل</span>
                        <span className="text-[11px] font-medium" style={{ color: isDark ? '#CCC' : '#444' }}>
                          {voucherData.userName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px]" style={{ color: isDark ? '#888' : '#999' }}>رقم الحساب</span>
                        <span className="text-[11px] font-mono font-medium" dir="ltr" style={{ color: isDark ? '#CCC' : '#444' }}>
                          {voucherData.senderAccount}
                        </span>
                      </div>
                    </div>

                    {/* From -> To Section */}
                    <div className="p-4" style={{ borderBottom: `1px dashed ${voucherDividerColor}` }}>
                      <div className="flex items-center gap-3">
                        {/* From */}
                        <div className="flex-1 text-center">
                          <p className="text-[10px] mb-1" style={{ color: isDark ? '#666' : '#999' }}>من</p>
                          <div className="py-2 px-3 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                            <p className="text-lg font-bold" dir="ltr" style={{ color: currencyBadgeColors[voucherData.fromCurrency] }}>
                              {formatBalance(voucherData.fromAmount, voucherData.fromCurrency)}
                            </p>
                            <p className="text-[10px] font-medium mt-0.5" style={{ color: isDark ? '#888' : '#AAA' }}>
                              {currencyNames[voucherData.fromCurrency]} ({voucherData.fromCurrency})
                            </p>
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(230,0,0,0.1)' }}>
                          <ArrowRightLeft size={14} color="#E60000" />
                        </div>

                        {/* To */}
                        <div className="flex-1 text-center">
                          <p className="text-[10px] mb-1" style={{ color: isDark ? '#666' : '#999' }}>الى</p>
                          <div className="py-2 px-3 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                            <p className="text-lg font-bold" dir="ltr" style={{ color: '#10B981' }}>
                              {voucherData.toAmount < 0.01 && voucherData.toAmount > 0 ? voucherData.toAmount.toFixed(6) : voucherData.toAmount < 1 ? voucherData.toAmount.toFixed(4) : formatBalance(voucherData.toAmount, voucherData.toCurrency)}
                            </p>
                            <p className="text-[10px] font-medium mt-0.5" style={{ color: isDark ? '#888' : '#AAA' }}>
                              {currencyNames[voucherData.toCurrency]} ({voucherData.toCurrency})
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Details Rows */}
                    <div className="p-4 space-y-0">
                      <div className="flex items-center justify-between py-2.5" style={{ borderBottom: `1px solid ${voucherDividerColor}` }}>
                        <span className="text-xs" style={{ color: isDark ? '#888' : '#888' }}>سعر الصرف</span>
                        <span className="text-xs font-bold" dir="ltr" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                          1 {currencySymbols[voucherData.fromCurrency]} = {voucherData.rate < 1 ? voucherData.rate.toFixed(4) : voucherData.rate.toFixed(2)} {currencySymbols[voucherData.toCurrency]}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2.5" style={{ borderBottom: `1px solid ${voucherDividerColor}` }}>
                        <span className="text-xs" style={{ color: isDark ? '#888' : '#888' }}>المبلغ قبل العمولة</span>
                        <span className="text-xs font-bold" dir="ltr" style={{ color: isDark ? '#CCC' : '#555' }}>
                          {voucherData.rawResult < 1 ? voucherData.rawResult.toFixed(4) : formatNumber(parseFloat(voucherData.rawResult.toFixed(2)))} {currencySymbols[voucherData.toCurrency]}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2.5" style={{ borderBottom: `1px solid ${voucherDividerColor}` }}>
                        <span className="text-xs" style={{ color: isDark ? '#888' : '#888' }}>العمولة ({voucherData.commission}%)</span>
                        <span className="text-xs font-bold" dir="ltr" style={{ color: '#E60000' }}>
                          {voucherData.commissionAmount < 1 ? voucherData.commissionAmount.toFixed(4) : formatNumber(parseFloat(voucherData.commissionAmount.toFixed(2)))} {currencySymbols[voucherData.toCurrency]}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2.5">
                        <span className="text-xs font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>صافي المبلغ المحول</span>
                        <span className="text-xs font-bold" dir="ltr" style={{ color: '#10B981' }}>
                          {voucherData.toAmount < 1 ? voucherData.toAmount.toFixed(4) : formatNumber(parseFloat(voucherData.toAmount.toFixed(2)))} {currencySymbols[voucherData.toCurrency]}
                        </span>
                      </div>
                    </div>

                    {/* Dashed line with circles (receipt tear-off style) */}
                    <div className="relative h-6" style={{ borderTop: `2px dashed ${voucherDividerColor}` }}>
                      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full" style={{ background: isDark ? '#0F0F0F' : '#F5F5F5' }} />
                      <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full" style={{ background: isDark ? '#0F0F0F' : '#F5F5F5' }} />
                    </div>

                    {/* Note */}
                    <div className="px-4 pb-3 pt-1">
                      <div className="p-2.5 rounded-lg text-center" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px dashed ${voucherDividerColor}` }}>
                        <p className="text-[9px]" style={{ color: isDark ? '#888' : '#999' }}>
                          ملاحظة: هذا السند إلكتروني ولا يحتاج توقيع
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-4 pb-4 text-center">
                      <p className="text-[10px] font-bold" style={{ color: isDark ? '#555' : '#999' }}>
                        محفظة الجنوب - محفظتك الرقمية
                      </p>
                      <p className="text-[9px] mt-1" style={{ color: isDark ? '#444' : '#DDD' }}>
                        {voucherData.referenceNumber}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-4">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={handleShareReceipt}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      color: isDark ? '#FFF' : '#1a1a1a',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                    }}>
                    <Share2 size={16} />
                    مشاركة السند
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={async () => { if (voucherData) { await navigator.clipboard.writeText(`سند تبديل - ${voucherData.referenceNumber}\nمن: ${voucherData.userName}\nالمبلغ: ${formatNumber(voucherData.fromAmount)} ${currencySymbols[voucherData.fromCurrency]} → ${voucherData.toAmount < 1 ? voucherData.toAmount.toFixed(4) : formatNumber(parseFloat(voucherData.toAmount.toFixed(2)))} ${currencySymbols[voucherData.toCurrency]}`).catch(() => {}); } }}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      color: isDark ? '#FFF' : '#1a1a1a',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                    }}>
                    <Copy size={16} />
                    نسخ السند
                  </motion.button>
                </div>
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleDownloadReceipt}
                  className="w-full mt-3 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: '#E60000' }}>
                  <Download size={16} />
                  تحميل السند
                </motion.button>

                {/* Close Button */}
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowVoucher(false)}
                  className="w-full mt-3 py-3.5 rounded-xl text-sm font-bold"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    color: isDark ? '#FFF' : '#1a1a1a',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                  }}>
                  اغلاق
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
