'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Copy,
  Check,
  Coins,
  QrCode,
  AlertCircle,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatNumber, currencySymbols, currencyBadgeColors, generateReference, compressBase64Image, defaultExchangeRates } from '@/lib/utils';
import { playTransactionSound } from '@/lib/transaction-sounds';
import { database } from '@/lib/firebase';
import { ref, get, set, update } from 'firebase/database';

type Tab = 'deposit' | 'withdraw';
type DepositMethod = 'bank_transfer' | 'cash' | 'card' | 'crypto';
type WithdrawMethod = 'bank_transfer' | 'cash' | 'crypto';

const depositMethods: { id: DepositMethod; label: string; icon: typeof Building2; desc: string }[] = [
  { id: 'bank_transfer', label: 'حوالة بنكية', icon: Building2, desc: 'تحويل عبر البنك' },
  { id: 'crypto', label: 'عملات رقمية', icon: Coins, desc: 'USDT وغيرها' },
  { id: 'cash', label: 'نقطة بيع', icon: MapPin, desc: 'الدفع نقداً' },
  { id: 'card', label: 'كرت شحن', icon: CreditCard, desc: 'إدخال كرت شحن' },
];

const withdrawMethods: { id: WithdrawMethod; label: string; icon: typeof Building2; desc: string }[] = [
  { id: 'bank_transfer', label: 'حوالة بنكية', icon: Building2, desc: 'تحويل لحسابك' },
  { id: 'crypto', label: 'عملات رقمية', icon: Coins, desc: 'سحب كريبتو' },
  { id: 'cash', label: 'نقطة بيع', icon: MapPin, desc: 'استلام نقداً' },
];

interface BankInfo {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  color: string;
  icon: string;
  isActive: boolean;
}

interface CryptoCurrency {
  id: string;
  name: string;
  symbol: string;
  network: string;
  address: string;
  icon: string;
  color: string;
  isActive: boolean;
  minDeposit: number;
  minWithdraw: number;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof CheckCircle2 }> = {
  pending: { label: 'قيد الانتظار', color: '#F59E0B', bgColor: 'rgba(245,158,11,0.12)', icon: Clock },
  approved: { label: 'تمت الموافقة', color: '#10B981', bgColor: 'rgba(16,185,129,0.12)', icon: CheckCircle2 },
  rejected: { label: 'مرفوض', color: '#E60000', bgColor: 'rgba(230,0,0,0.12)', icon: XCircle },
};

// Helper: mask account number (show first 3 and last 4 digits)
function maskAccountNumber(accNum: string): string {
  if (!accNum || accNum.length <= 7) return accNum;
  return accNum.substring(0, 3) + '****' + accNum.substring(accNum.length - 4);
}

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

  // Crypto deposit form
  const [selectedCryptoId, setSelectedCryptoId] = useState('');
  const [cryptoTxHash, setCryptoTxHash] = useState('');

  // Withdraw form
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawCurrency, setWithdrawCurrency] = useState<'YER' | 'SAR' | 'USD'>('YER');
  const [withdrawMethod, setWithdrawMethod] = useState<WithdrawMethod>('bank_transfer');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');

  // Crypto withdraw form
  const [selectedWithdrawCryptoId, setSelectedWithdrawCryptoId] = useState('');
  const [cryptoWalletAddress, setCryptoWalletAddress] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Banks from Firebase
  const [banks, setBanks] = useState<BankInfo[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);

  // Crypto currencies from Firebase
  const [cryptoCurrencies, setCryptoCurrencies] = useState<CryptoCurrency[]>([]);
  const [cryptoLoading, setCryptoLoading] = useState(true);

  // Exchange rates from Firebase
  const [exchangeRates, setExchangeRates] = useState(defaultExchangeRates);

  // Copy feedback
  const [copiedBankId, setCopiedBankId] = useState<string | null>(null);
  const [copiedCryptoId, setCopiedCryptoId] = useState<string | null>(null);

  // Card code feedback
  const [cardError, setCardError] = useState('');
  const [cardSuccess, setCardSuccess] = useState(false);

  // Fetch banks, crypto currencies, and exchange rates from Firebase on mount
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const banksRef = ref(database, 'adminSettings/banks');
        const snapshot = await get(banksRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const banksList: BankInfo[] = [];
          if (Array.isArray(data)) {
            data.forEach((item: Record<string, any>, index: number) => {
              if (item && (item.bankName || item.name)) {
                banksList.push({
                  id: String(index),
                  bankName: item.bankName || item.name || '',
                  accountName: item.accountName || item.accountHolder || '',
                  accountNumber: item.accountNumber || '',
                  color: item.color || '#E60000',
                  icon: item.icon || '',
                  isActive: item.isActive !== false,
                });
              }
            });
          } else if (typeof data === 'object') {
            Object.entries(data).forEach(([key, item]: [string, Record<string, any>]) => {
              if (item && (item.bankName || item.name)) {
                banksList.push({
                  id: key,
                  bankName: item.bankName || item.name || '',
                  accountName: item.accountName || item.accountHolder || '',
                  accountNumber: item.accountNumber || '',
                  color: item.color || '#E60000',
                  icon: item.icon || '',
                  isActive: item.isActive !== false,
                });
              }
            });
          }
          // Only show active banks
          setBanks(banksList.filter(b => b.isActive));
        } else {
          setBanks([]);
        }
      } catch (error) {
        console.error('Error fetching banks:', error);
        setBanks([]);
      }
      setBanksLoading(false);
    };

    const fetchCryptoCurrencies = async () => {
      try {
        const cryptoRef = ref(database, 'adminSettings/cryptoCurrencies');
        const snapshot = await get(cryptoRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const cryptoList: CryptoCurrency[] = [];
          if (Array.isArray(data)) {
            data.forEach((item: Record<string, any>, index: number) => {
              if (item && item.name) {
                cryptoList.push({
                  id: item.id || String(index),
                  name: item.name || '',
                  symbol: item.symbol || '',
                  network: item.network || '',
                  address: item.address || '',
                  icon: item.icon || '',
                  color: item.color || '#26A17B',
                  isActive: item.isActive !== false,
                  minDeposit: item.minDeposit || 10,
                  minWithdraw: item.minWithdraw || 20,
                });
              }
            });
          } else if (typeof data === 'object') {
            Object.entries(data).forEach(([key, item]: [string, Record<string, any>]) => {
              if (item && item.name) {
                cryptoList.push({
                  id: item.id || key,
                  name: item.name || '',
                  symbol: item.symbol || '',
                  network: item.network || '',
                  address: item.address || '',
                  icon: item.icon || '',
                  color: item.color || '#26A17B',
                  isActive: item.isActive !== false,
                  minDeposit: item.minDeposit || 10,
                  minWithdraw: item.minWithdraw || 20,
                });
              }
            });
          }
          // Only show active cryptos
          setCryptoCurrencies(cryptoList.filter(c => c.isActive));
        } else {
          setCryptoCurrencies([]);
        }
      } catch (error) {
        console.error('Error fetching crypto currencies:', error);
        setCryptoCurrencies([]);
      }
      setCryptoLoading(false);
    };

    const fetchExchangeRates = async () => {
      try {
        const ratesRef = ref(database, 'adminSettings/exchangeRates');
        const snapshot = await get(ratesRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          setExchangeRates({
            YER: data.YER ?? defaultExchangeRates.YER,
            SAR: data.SAR ?? defaultExchangeRates.SAR,
            USD: data.USD ?? defaultExchangeRates.USD,
          });
        }
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
      }
    };

    fetchBanks();
    fetchCryptoCurrencies();
    fetchExchangeRates();
  }, []);

  const handleCopyText = useCallback((text: string, type: 'bank' | 'crypto', id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'bank') setCopiedBankId(id);
      else setCopiedCryptoId(id);
      setTimeout(() => {
        if (type === 'bank') setCopiedBankId(null);
        else setCopiedCryptoId(null);
      }, 2000);
    }).catch(() => {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      if (type === 'bank') setCopiedBankId(id);
      else setCopiedCryptoId(id);
      setTimeout(() => {
        if (type === 'bank') setCopiedBankId(null);
        else setCopiedCryptoId(null);
      }, 2000);
    });
  }, []);

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

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    const result = await applyPromoCode(promoCode.trim().toUpperCase());
    if (result) {
      setPromoApplied(true);
      if (result.type === 'fixed') {
        setPromoDiscount(result.discount);
      } else {
        setPromoDiscount(Math.round(depositAmountNum * result.discount / 100));
      }
    }
  };

  // Validate and redeem recharge card code against Firebase bulkCodes
  const handleRedeemCardCode = async () => {
    if (!user || !cardCode.trim()) return;

    setCardError('');
    setCardSuccess(false);
    setIsSubmitting(true);

    try {
      // Search through all products in bulkCodes
      const bulkCodesRef = ref(database, 'adminSettings/bulkCodes');
      const snapshot = await get(bulkCodesRef);

      if (!snapshot.exists()) {
        setCardError('كود الشحن غير صالح أو مستخدم مسبقاً');
        setIsSubmitting(false);
        return;
      }

      const bulkData = snapshot.val();
      let foundCode: { productId: string; codeKey: string; codeData: Record<string, any> } | null = null;

      // Iterate over products
      for (const [productId, productData] of Object.entries(bulkData as Record<string, any>)) {
        if (!productData || !productData.codes) continue;

        // Iterate over codes in this product
        for (const [codeKey, codeData] of Object.entries(productData.codes as Record<string, any>)) {
          if (codeData && codeData.code === cardCode.trim()) {
            foundCode = { productId, codeKey, codeData };
            break;
          }
        }
        if (foundCode) break;
      }

      if (!foundCode) {
        setCardError('كود الشحن غير صالح أو مستخدم مسبقاً');
        setIsSubmitting(false);
        return;
      }

      if (foundCode.codeData.used || foundCode.codeData.status === 'used') {
        setCardError('كود الشحن غير صالح أو مستخدم مسبقاً');
        setIsSubmitting(false);
        return;
      }

      // Mark the code as used
      const codeRef = ref(database, `adminSettings/bulkCodes/${foundCode.productId}/codes/${foundCode.codeKey}`);
      await update(codeRef, {
        used: true,
        usedBy: user.id,
        usedAt: new Date().toISOString(),
        status: 'used',
      });

      // Credit the user's balance
      const cardAmount = foundCode.codeData.amount || foundCode.codeData.value || 0;
      const cardCurrency = foundCode.codeData.currency || 'YER';
      const balanceKey = `balance${cardCurrency}`;

      if (cardAmount > 0 && user.id) {
        const userRef = ref(database, `users/${user.id}`);
        const userSnap = await get(userRef);
        const userData = userSnap.val();
        if (userData) {
          const currentBal = userData[balanceKey] || 0;
          await update(userRef, {
            [balanceKey]: currentBal + cardAmount,
          });

          // Update local store
          const storeUser = useAppStore.getState().user;
          if (storeUser) {
            useAppStore.getState().setUser({
              ...storeUser,
              [balanceKey]: currentBal + cardAmount,
            });
          }
        }
      }

      setCardSuccess(true);
      setCardCode('');
      setTimeout(() => setCardSuccess(false), 3000);
    } catch (error) {
      console.error('Error redeeming card code:', error);
      setCardError('حدث خطأ أثناء التحقق من الكود');
    }
    setIsSubmitting(false);
  };

  const handleSubmitDeposit = async () => {
    if (!user || !depositAmountNum || depositAmountNum <= 0) return;

    // If card method, use the card redemption flow instead
    if (depositMethod === 'card') {
      await handleRedeemCardCode();
      return;
    }

    // Crypto deposit validation
    if (depositMethod === 'crypto' && !selectedCryptoId) {
      return;
    }
    if (depositMethod === 'crypto' && !cryptoTxHash.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const requestId = generateReference();
      const request: Record<string, any> = {
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

      // Add crypto-specific fields
      if (depositMethod === 'crypto') {
        const selectedCrypto = cryptoCurrencies.find(c => c.id === selectedCryptoId);
        request.cryptoId = selectedCryptoId;
        request.cryptoSymbol = selectedCrypto?.symbol || '';
        request.cryptoNetwork = selectedCrypto?.network || '';
        request.cryptoTxHash = cryptoTxHash.trim();
        request.notes = `إيداع ${selectedCrypto?.symbol || ''} - شبكة: ${selectedCrypto?.network || ''} - Hash: ${cryptoTxHash.trim()}`;
      }

      // Save to Firebase
      const depositRef = ref(database, `depositRequests/${requestId}`);
      await set(depositRef, request);

      // Send notification to admin about new deposit
      try {
        const { notifyDepositRequest } = await import('@/lib/notifications');
        await notifyDepositRequest(user.id, user.name, parseFloat(depositAmount) || 0, depositCurrency);
      } catch {
        // Non-critical
      }

      // Update local store
      addDepositRequest(request as any);

      // Play deposit sound
      playTransactionSound('deposit');

      // Reset form
      setDepositAmount('');
      setReceiptImage('');
      setCardCode('');
      setPromoCode('');
      setPromoApplied(false);
      setPromoDiscount(0);
      setSelectedCryptoId('');
      setCryptoTxHash('');
    } catch (error) {
      console.error('Error submitting deposit:', error);
    }
    setIsSubmitting(false);
  };

  const handleSubmitWithdraw = async () => {
    if (!user || !withdrawAmountNum || withdrawAmountNum <= 0) return;
    if (withdrawAmountNum > withdrawBalance) return;

    // Crypto withdraw validation
    if (withdrawMethod === 'crypto' && !selectedWithdrawCryptoId) {
      return;
    }
    if (withdrawMethod === 'crypto' && !cryptoWalletAddress.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const requestId = generateReference();
      const request: Record<string, any> = {
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

      // Add crypto-specific fields
      if (withdrawMethod === 'crypto') {
        const selectedCrypto = cryptoCurrencies.find(c => c.id === selectedWithdrawCryptoId);
        request.cryptoId = selectedWithdrawCryptoId;
        request.cryptoSymbol = selectedCrypto?.symbol || '';
        request.cryptoNetwork = selectedCrypto?.network || '';
        request.cryptoWalletAddress = cryptoWalletAddress.trim();
        request.notes = `سحب ${selectedCrypto?.symbol || ''} - شبكة: ${selectedCrypto?.network || ''} - محفظة: ${cryptoWalletAddress.trim()}`;
      }

      // Save to Firebase
      const withdrawRef = ref(database, `withdrawRequests/${requestId}`);
      await set(withdrawRef, request);

      // Send notification to admin about new withdraw request
      try {
        const { notifyWithdrawRequest } = await import('@/lib/notifications');
        await notifyWithdrawRequest(user.id, user.name, withdrawAmountNum, withdrawCurrency);
      } catch {
        // Non-critical
      }

      // Update local store
      addWithdrawRequest(request as any);

      // Play withdraw sound
      playTransactionSound('withdraw');

      // Reset form
      setWithdrawAmount('');
      setBankAccountNumber('');
      setBankName('');
      setSelectedWithdrawCryptoId('');
      setCryptoWalletAddress('');
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
      case 'crypto': return 'عملات رقمية';
      default: return method;
    }
  };

  // Get selected crypto for display
  const selectedCrypto = cryptoCurrencies.find(c => c.id === selectedCryptoId);
  const selectedWithdrawCrypto = cryptoCurrencies.find(c => c.id === selectedWithdrawCryptoId);

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
            <div className="space-y-3">
              {/* Amount Input */}
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
                        onClick={() => { setDepositMethod(method.id); setCardError(''); setCardSuccess(false); }}
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

              {/* Bank Transfer Method */}
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

                  {banksLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                    </div>
                  ) : banks.length === 0 ? (
                    <div className="flex flex-col items-center py-6">
                      <Building2 size={24} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} />
                      <p className="text-xs mt-2" style={{ color: isDark ? '#555' : '#AAA' }}>لا توجد بنوك متاحة حالياً</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {banks.map((bank) => {
                        const bankColor = bank.color || '#E60000';
                        const bankFirstLetter = bank.bankName ? bank.bankName.charAt(0) : 'B';
                        return (
                          <div key={bank.id} className="rounded-xl p-3" style={{ background: isDark ? '#1A1A1A' : '#F8F8F8', borderRight: `3px solid ${bankColor}` }}>
                            <div className="flex items-center gap-2 mb-2">
                              {/* Bank icon: uploaded image or first letter fallback */}
                              {bank.icon ? (
                                <img src={bank.icon} alt={bank.bankName} className="w-8 h-8 rounded-lg object-cover" />
                              ) : (
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                                  style={{ backgroundColor: bankColor }}
                                >
                                  {bankFirstLetter}
                                </div>
                              )}
                              <span className="text-xs font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{bank.bankName}</span>
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>اسم الحساب</span>
                                <span className="text-xs font-medium" style={{ color: isDark ? '#CCC' : '#333' }}>{bank.accountName}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>رقم الحساب</span>
                                <button
                                  onClick={() => handleCopyText(bank.accountNumber, 'bank', bank.id)}
                                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all"
                                  style={{ background: isDark ? '#222' : '#F0F0F0' }}
                                >
                                  <span className="text-xs font-medium font-mono" style={{ color: isDark ? '#CCC' : '#333' }} dir="ltr">{bank.accountNumber}</span>
                                  {copiedBankId === bank.id ? (
                                    <Check size={12} color="#10B981" />
                                  ) : (
                                    <Copy size={12} color={isDark ? '#666' : '#AAA'} />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

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

              {/* Crypto Deposit Method */}
              {depositMethod === 'crypto' && (
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
                    <Coins size={14} color="#26A17B" strokeWidth={1.5} />
                    <span className="text-xs font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>إيداع عملات رقمية</span>
                  </div>

                  {cryptoLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="w-6 h-6 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                    </div>
                  ) : cryptoCurrencies.length === 0 ? (
                    <div className="flex flex-col items-center py-6">
                      <Coins size={24} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} />
                      <p className="text-xs mt-2" style={{ color: isDark ? '#555' : '#AAA' }}>لا توجد عملات رقمية متاحة حالياً</p>
                    </div>
                  ) : (
                    <>
                      {/* Crypto Currency Selector */}
                      <label className="text-xs font-medium block mb-2" style={{ color: isDark ? '#AAA' : '#666' }}>اختر العملة</label>
                      <div className="space-y-2 mb-4">
                        {cryptoCurrencies.map((crypto) => (
                          <button
                            key={crypto.id}
                            onClick={() => setSelectedCryptoId(crypto.id)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl transition-all"
                            style={{
                              background: selectedCryptoId === crypto.id ? `${crypto.color}15` : (isDark ? '#1A1A1A' : '#F8F8F8'),
                              border: selectedCryptoId === crypto.id ? `1px solid ${crypto.color}40` : '1px solid transparent',
                            }}
                          >
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: crypto.color }}
                            >
                              {crypto.icon && crypto.icon.length > 5 ? (
                                <img src={crypto.icon} alt={crypto.symbol} className="w-6 h-6 rounded object-cover" />
                              ) : (
                                <span>{crypto.symbol.substring(0, 2)}</span>
                              )}
                            </div>
                            <div className="text-right flex-1">
                              <p className="text-sm font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{crypto.name}</p>
                              <p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>شبكة: {crypto.network}</p>
                            </div>
                            <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: selectedCryptoId === crypto.id ? crypto.color : (isDark ? '#333' : '#DDD') }}>
                              {selectedCryptoId === crypto.id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: crypto.color }} />}
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Show selected crypto address + QR */}
                      {selectedCrypto && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3"
                        >
                          {/* Wallet Address */}
                          <div className="rounded-xl p-3" style={{ background: isDark ? '#1A1A1A' : '#F8F8F8', borderRight: `3px solid ${selectedCrypto.color}` }}>
                            <div className="flex items-center gap-2 mb-2">
                              <QrCode size={12} color={selectedCrypto.color} strokeWidth={1.5} />
                              <span className="text-[10px] font-bold" style={{ color: isDark ? '#AAA' : '#666' }}>
                                عنوان الإيداع ({selectedCrypto.network})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-mono break-all flex-1" style={{ color: isDark ? '#CCC' : '#333' }} dir="ltr">
                                {selectedCrypto.address}
                              </p>
                              <button
                                onClick={() => handleCopyText(selectedCrypto.address, 'crypto', selectedCrypto.id)}
                                className="p-2 rounded-lg flex-shrink-0"
                                style={{ background: isDark ? '#222' : '#F0F0F0' }}
                              >
                                {copiedCryptoId === selectedCrypto.id ? (
                                  <Check size={14} color="#10B981" />
                                ) : (
                                  <Copy size={14} color={isDark ? '#666' : '#AAA'} />
                                )}
                              </button>
                            </div>
                            {/* QR Code placeholder */}
                            <div className="mt-2 flex justify-center">
                              <div className="w-32 h-32 rounded-xl flex items-center justify-center" style={{ background: '#FFF' }}>
                                <img
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(selectedCrypto.address)}`}
                                  alt="QR Code"
                                  className="w-28 h-28 rounded-lg"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Min deposit info */}
                          {selectedCrypto.minDeposit > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Info size={10} color={selectedCrypto.color} />
                              <span className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>
                                الحد الأدنى للإيداع: {selectedCrypto.minDeposit} {selectedCrypto.symbol}
                              </span>
                            </div>
                          )}

                          {/* Transaction Hash Input */}
                          <div>
                            <label className="text-xs font-medium block mb-2" style={{ color: isDark ? '#AAA' : '#666' }}>
                              رقم المعاملة (Transaction Hash)
                            </label>
                            <input
                              type="text"
                              value={cryptoTxHash}
                              onChange={(e) => setCryptoTxHash(e.target.value)}
                              placeholder="أدخل رقم المعاملة كدليل على التحويل"
                              className="w-full bg-transparent outline-none text-sm p-2.5 rounded-xl"
                              style={{
                                color: isDark ? '#FFF' : '#1a1a1a',
                                background: isDark ? '#1A1A1A' : '#F8F8F8',
                              }}
                              dir="ltr"
                            />
                          </div>

                          <div className="flex items-start gap-1.5 p-2 rounded-lg" style={{ background: `${selectedCrypto.color}10` }}>
                            <AlertCircle size={12} color={selectedCrypto.color} className="flex-shrink-0 mt-0.5" />
                            <span className="text-[10px]" style={{ color: isDark ? '#AAA' : '#666' }}>
                              تأكد من إرسال العملات على شبكة {selectedCrypto.network} فقط. الإرسال على شبكة خاطئة قد يؤدي لفقدان أموالك.
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </>
                  )}
                </motion.div>
              )}

              {/* Cash Method */}
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

              {/* Recharge Card Method - Auto-credit flow */}
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
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard size={14} color="#E60000" strokeWidth={1.5} />
                    <span className="text-xs font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>كرت الشحن</span>
                  </div>
                  <label className="text-xs font-medium block mb-2" style={{ color: isDark ? '#AAA' : '#666' }}>رقم كرت الشحن</label>
                  <input
                    type="text"
                    value={cardCode}
                    onChange={(e) => { setCardCode(e.target.value); setCardError(''); setCardSuccess(false); }}
                    placeholder="أدخل رقم كرت الشحن"
                    className="w-full bg-transparent outline-none text-lg font-bold tracking-wider p-2 rounded-xl"
                    style={{
                      color: isDark ? '#FFF' : '#1a1a1a',
                      background: isDark ? '#1A1A1A' : '#F8F8F8',
                    }}
                    dir="ltr"
                  />

                  {/* Card error message */}
                  {cardError && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-1.5 mt-2 p-2 rounded-lg"
                      style={{ background: 'rgba(230,0,0,0.1)' }}
                    >
                      <XCircle size={12} color="#E60000" />
                      <span className="text-[10px] font-medium" style={{ color: '#E60000' }}>{cardError}</span>
                    </motion.div>
                  )}

                  {/* Card success message */}
                  {cardSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-1.5 mt-2 p-2 rounded-lg"
                      style={{ background: 'rgba(16,185,129,0.1)' }}
                    >
                      <CheckCircle2 size={12} color="#10B981" />
                      <span className="text-[10px] font-medium" style={{ color: '#10B981' }}>تم شحن الرصيد بنجاح!</span>
                    </motion.div>
                  )}

                  <div className="flex items-start gap-1.5 mt-2">
                    <Info size={10} color={isDark ? '#666' : '#AAA'} className="flex-shrink-0 mt-0.5" />
                    <span className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>
                      أدخل كود الشحن وسيتم إضافة الرصيد تلقائياً لحسابك
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Promo Code - hidden for card method since it's auto-credited */}
              {depositMethod !== 'card' && (
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
              )}

              {/* Balance After Deposit Preview */}
              {depositAmountNum > 0 && depositMethod !== 'card' && (
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
                disabled={
                  isSubmitting ||
                  (depositMethod === 'card'
                    ? !cardCode.trim()
                    : !depositAmountNum || depositAmountNum <= 0) ||
                  (depositMethod === 'crypto' && (!selectedCryptoId || !cryptoTxHash.trim()))
                }
                className="w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                style={{
                  background: (depositMethod === 'card' ? cardCode.trim() : depositAmountNum > 0) ? '#E60000' : (isDark ? '#1A1A1A' : '#EEE'),
                  color: (depositMethod === 'card' ? cardCode.trim() : depositAmountNum > 0) ? '#FFF' : (isDark ? '#444' : '#AAA'),
                  boxShadow: (depositMethod === 'card' ? cardCode.trim() : depositAmountNum > 0) ? '0 4px 16px rgba(230,0,0,0.3)' : 'none',
                }}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={16} strokeWidth={2} />
                    {depositMethod === 'card' ? 'شحن الرصيد' : 'تأكيد الطلب'}
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

              {/* Crypto Withdraw Method */}
              {withdrawMethod === 'crypto' && (
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
                    <Coins size={14} color="#26A17B" strokeWidth={1.5} />
                    <span className="text-xs font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>سحب عملات رقمية</span>
                  </div>

                  {cryptoLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="w-6 h-6 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                    </div>
                  ) : cryptoCurrencies.length === 0 ? (
                    <div className="flex flex-col items-center py-6">
                      <Coins size={24} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} />
                      <p className="text-xs mt-2" style={{ color: isDark ? '#555' : '#AAA' }}>لا توجد عملات رقمية متاحة حالياً</p>
                    </div>
                  ) : (
                    <>
                      {/* Crypto Currency Selector */}
                      <label className="text-xs font-medium block mb-2" style={{ color: isDark ? '#AAA' : '#666' }}>اختر العملة</label>
                      <div className="space-y-2 mb-4">
                        {cryptoCurrencies.map((crypto) => (
                          <button
                            key={crypto.id}
                            onClick={() => setSelectedWithdrawCryptoId(crypto.id)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl transition-all"
                            style={{
                              background: selectedWithdrawCryptoId === crypto.id ? `${crypto.color}15` : (isDark ? '#1A1A1A' : '#F8F8F8'),
                              border: selectedWithdrawCryptoId === crypto.id ? `1px solid ${crypto.color}40` : '1px solid transparent',
                            }}
                          >
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: crypto.color }}
                            >
                              {crypto.icon && crypto.icon.length > 5 ? (
                                <img src={crypto.icon} alt={crypto.symbol} className="w-6 h-6 rounded object-cover" />
                              ) : (
                                <span>{crypto.symbol.substring(0, 2)}</span>
                              )}
                            </div>
                            <div className="text-right flex-1">
                              <p className="text-sm font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{crypto.name}</p>
                              <p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>شبكة: {crypto.network}</p>
                            </div>
                            <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: selectedWithdrawCryptoId === crypto.id ? crypto.color : (isDark ? '#333' : '#DDD') }}>
                              {selectedWithdrawCryptoId === crypto.id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: crypto.color }} />}
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Wallet Address Input */}
                      {selectedWithdrawCrypto && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3"
                        >
                          <div>
                            <label className="text-xs font-medium block mb-2" style={{ color: isDark ? '#AAA' : '#666' }}>
                              عنوان محفظتك ({selectedWithdrawCrypto.network})
                            </label>
                            <input
                              type="text"
                              value={cryptoWalletAddress}
                              onChange={(e) => setCryptoWalletAddress(e.target.value)}
                              placeholder={`أدخل عنوان محفظة ${selectedWithdrawCrypto.symbol}`}
                              className="w-full bg-transparent outline-none text-sm p-2.5 rounded-xl"
                              style={{
                                color: isDark ? '#FFF' : '#1a1a1a',
                                background: isDark ? '#1A1A1A' : '#F8F8F8',
                              }}
                              dir="ltr"
                            />
                          </div>

                          {/* Min withdraw info */}
                          {selectedWithdrawCrypto.minWithdraw > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Info size={10} color={selectedWithdrawCrypto.color} />
                              <span className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>
                                الحد الأدنى للسحب: {selectedWithdrawCrypto.minWithdraw} {selectedWithdrawCrypto.symbol}
                              </span>
                            </div>
                          )}

                          <div className="flex items-start gap-1.5 p-2 rounded-lg" style={{ background: `${selectedWithdrawCrypto.color}10` }}>
                            <AlertCircle size={12} color={selectedWithdrawCrypto.color} className="flex-shrink-0 mt-0.5" />
                            <span className="text-[10px]" style={{ color: isDark ? '#AAA' : '#666' }}>
                              تأكد من إدخال عنوان صحيح على شبكة {selectedWithdrawCrypto.network}. الإرسال لعنوان خاطئ قد يؤدي لفقدان أموالك.
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </>
                  )}
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
                disabled={
                  !withdrawAmountNum || withdrawAmountNum <= 0 || withdrawAmountNum > withdrawBalance || isSubmitting ||
                  (withdrawMethod === 'crypto' && (!selectedWithdrawCryptoId || !cryptoWalletAddress.trim()))
                }
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
