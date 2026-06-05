'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Phone,
  DollarSign,
  FileText,
  Send,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { currencySymbols, currencyNames, currencyFlags } from '@/lib/utils';

type Currency = 'YER' | 'SAR' | 'USD';

export default function TransferModal() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { isTransferOpen, setTransferOpen, user } = useAppStore();

  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('YER');
  const [description, setDescription] = useState('');
  const [showCurrencySelect, setShowCurrencySelect] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const currencies: Currency[] = ['YER', 'SAR', 'USD'];

  const handleClose = () => {
    setTransferOpen(false);
    setTimeout(() => {
      setPhone('');
      setAmount('');
      setCurrency('YER');
      setDescription('');
      setStatus('idle');
      setErrorMsg('');
    }, 300);
  };

  const handleTransfer = async () => {
    if (!phone || !amount || !user) return;

    setIsLoading(true);
    setStatus('idle');

    try {
      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: user.id,
          toPhone: phone,
          amount: parseFloat(amount),
          currency,
          description,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setErrorMsg(data.error || 'حدث خطأ في التحويل');
        return;
      }

      setStatus('success');

      // Update user balance in store
      const updatedUser = { ...user };
      const balanceField = `balance${currency}` as keyof typeof user;
      (updatedUser as Record<string, unknown>)[balanceField] =
        ((user as Record<string, unknown>)[balanceField] as number) - parseFloat(amount);
      useAppStore.getState().setUser(updatedUser);

      setTimeout(handleClose, 2000);
    } catch {
      setStatus('error');
      setErrorMsg('حدث خطأ في الاتصال');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isTransferOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 rounded-t-3xl overflow-hidden"
            style={{ background: isDark ? '#1A1A1A' : '#FFFFFF' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div
                className="w-10 h-1 rounded-full"
                style={{ background: isDark ? '#444' : '#DDD' }}
              />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3">
              <h2
                className="text-lg font-bold"
                style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
              >
                تحويل أموال
              </h2>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: isDark ? '#2D2D2D' : '#F0F0F0' }}
              >
                <X size={16} strokeWidth={1.5} color={isDark ? '#FFF' : '#666'} />
              </button>
            </div>

            {/* Success State */}
            {status === 'success' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center py-8 px-6"
              >
                <CheckCircle2 size={56} strokeWidth={1.5} color="#10B981" />
                <p className="text-lg font-bold mt-3" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                  تم التحويل بنجاح!
                </p>
                <p className="text-sm mt-1" style={{ color: isDark ? '#AAA' : '#888' }}>
                  {amount} {currencySymbols[currency]} إلى {phone}
                </p>
              </motion.div>
            )}

            {/* Error State */}
            {status === 'error' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center py-4 px-6"
              >
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl w-full" style={{ background: 'rgba(230,0,0,0.1)' }}>
                  <AlertCircle size={18} color="#E60000" />
                  <p className="text-sm" style={{ color: '#E60000' }}>
                    {errorMsg}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Form */}
            {status !== 'success' && (
              <div className="px-6 pb-8 space-y-4">
                {/* Phone Input */}
                <div>
                  <label
                    className="text-xs font-medium mb-1.5 block"
                    style={{ color: isDark ? '#AAA' : '#888' }}
                  >
                    رقم المستلم
                  </label>
                  <div
                    className="flex items-center gap-2 px-4 py-3 rounded-2xl"
                    style={{
                      background: isDark ? '#222' : '#F8F8F8',
                      border: isDark ? '1px solid #333' : '1px solid #EEE',
                    }}
                  >
                    <Phone size={18} strokeWidth={1.5} color="#E60000" />
                    <input
                      type="tel"
                      placeholder="7XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-sm"
                      style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label
                    className="text-xs font-medium mb-1.5 block"
                    style={{ color: isDark ? '#AAA' : '#888' }}
                  >
                    المبلغ
                  </label>
                  <div
                    className="flex items-center gap-2 px-4 py-3 rounded-2xl"
                    style={{
                      background: isDark ? '#222' : '#F8F8F8',
                      border: isDark ? '1px solid #333' : '1px solid #EEE',
                    }}
                  >
                    <DollarSign size={18} strokeWidth={1.5} color="#E60000" />
                    <input
                      type="number"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-sm"
                      style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                      dir="ltr"
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: isDark ? '#AAA' : '#888' }}
                    >
                      {currencySymbols[currency]}
                    </span>
                  </div>
                </div>

                {/* Currency Selector */}
                <div>
                  <label
                    className="text-xs font-medium mb-1.5 block"
                    style={{ color: isDark ? '#AAA' : '#888' }}
                  >
                    العملة
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setShowCurrencySelect(!showCurrencySelect)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-2xl"
                      style={{
                        background: isDark ? '#222' : '#F8F8F8',
                        border: isDark ? '1px solid #333' : '1px solid #EEE',
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-lg">{currencyFlags[currency]}</span>
                        <span
                          className="text-sm font-medium"
                          style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                        >
                          {currencyNames[currency]}
                        </span>
                      </span>
                      <ChevronDown
                        size={16}
                        strokeWidth={1.5}
                        color={isDark ? '#AAA' : '#888'}
                      />
                    </button>

                    <AnimatePresence>
                      {showCurrencySelect && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="absolute top-full left-0 right-0 mt-1 rounded-2xl overflow-hidden z-10"
                          style={{
                            background: isDark ? '#2D2D2D' : '#FFF',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                          }}
                        >
                          {currencies.map((c) => (
                            <button
                              key={c}
                              onClick={() => {
                                setCurrency(c);
                                setShowCurrencySelect(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#E60000]/5 transition-colors"
                              style={{
                                borderBottom: isDark ? '1px solid #333' : '1px solid #F0F0F0',
                              }}
                            >
                              <span className="text-lg">{currencyFlags[c]}</span>
                              <span
                                className="text-sm font-medium"
                                style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                              >
                                {currencyNames[c]}
                              </span>
                              <span
                                className="text-xs mr-auto"
                                style={{ color: isDark ? '#888' : '#AAA' }}
                              >
                                {currencySymbols[c]}
                              </span>
                              {currency === c && (
                                <CheckCircle2 size={16} color="#E60000" strokeWidth={1.5} />
                              )}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label
                    className="text-xs font-medium mb-1.5 block"
                    style={{ color: isDark ? '#AAA' : '#888' }}
                  >
                    الوصف (اختياري)
                  </label>
                  <div
                    className="flex items-center gap-2 px-4 py-3 rounded-2xl"
                    style={{
                      background: isDark ? '#222' : '#F8F8F8',
                      border: isDark ? '1px solid #333' : '1px solid #EEE',
                    }}
                  >
                    <FileText size={18} strokeWidth={1.5} color="#E60000" />
                    <input
                      type="text"
                      placeholder="أضف وصفاً للتحويل"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-sm"
                      style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                    />
                  </div>
                </div>

                {/* Send Button */}
                <button
                  onClick={handleTransfer}
                  disabled={!phone || !amount || isLoading}
                  className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{
                    background: isLoading
                      ? '#999'
                      : 'linear-gradient(135deg, #E60000 0%, #CC0000 100%)',
                    boxShadow: isLoading ? 'none' : '0 4px 16px rgba(230,0,0,0.3)',
                  }}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      <Send size={18} strokeWidth={1.5} />
                      <span>إرسال</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
