'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRightLeft, RefreshCw, TrendingUp, TrendingDown,
  Globe, Clock, Calculator, History, ChevronDown
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { currencySymbols, currencyNames, currencyBadgeColors, formatNumber, timeAgo, defaultExchangeRates } from '@/lib/utils';
import { ref, get, set } from 'firebase/database';
import { database } from '@/lib/firebase';

interface ConversionRecord {
  fromAmount: number;
  fromCurrency: string;
  toAmount: number;
  toCurrency: string;
  rate: number;
  commission: number;
  date: string;
}

export default function ExchangeScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { setActiveScreen, exchangeRates, setExchangeRates } = useAppStore();

  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toISOString());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [commission, setCommission] = useState<number>(0);

  // Converter state
  const [fromAmount, setFromAmount] = useState('1000');
  const [fromCurrency, setFromCurrency] = useState<'YER' | 'SAR' | 'USD'>('YER');
  const [toCurrency, setToCurrency] = useState<'YER' | 'SAR' | 'USD'>('SAR');
  const [conversionHistory, setConversionHistory] = useState<ConversionRecord[]>([]);

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
  }, []);

  // Calculate conversion result inline
  const getRate = (from: string, to: string): number => {
    if (from === to) return 1;
    if (from === 'YER' && to === 'SAR') return exchangeRates.SAR;
    if (from === 'YER' && to === 'USD') return exchangeRates.USD;
    if (from === 'SAR' && to === 'YER') return 1 / exchangeRates.SAR;
    if (from === 'SAR' && to === 'USD') return exchangeRates.USD / exchangeRates.SAR;
    if (from === 'USD' && to === 'YER') return 1 / exchangeRates.USD;
    if (from === 'USD' && to === 'SAR') return exchangeRates.SAR / exchangeRates.USD;
    return 1;
  };

  const currentRate = getRate(fromCurrency, toCurrency);
  const rawResult = (parseFloat(fromAmount) || 0) * currentRate;
  const result = rawResult * (1 - commission / 100);

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
        // Update trends
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

  const handleSaveConversion = () => {
    if (!fromAmount || result === 0) return;
    const record: ConversionRecord = {
      fromAmount: parseFloat(fromAmount) || 0,
      fromCurrency, toAmount: result, toCurrency, rate: currentRate, commission, date: new Date().toISOString(),
    };
    setConversionHistory(prev => [record, ...prev].slice(0, 10));
  };

  const ratePairs = [
    { from: 'YER', to: 'SAR', key: 'YER-SAR' },
    { from: 'YER', to: 'USD', key: 'YER-USD' },
    { from: 'SAR', to: 'USD', key: 'SAR-USD' },
  ];

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
              <h1 className="text-white text-xl font-bold">أسعار الصرف</h1>
              <p className="text-white/40 text-xs">تحديث مباشر للعملات</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.2)' }}>
              <Globe size={20} strokeWidth={1.5} color="#10B981" />
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 pb-8 space-y-4">
        {/* Live Rates Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="pulse-dot w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
              <span className="text-xs font-medium" style={{ color: '#10B981' }}>أسعار مباشرة</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>آخر تحديث: {timeAgo(lastUpdate)}</span>
              <motion.button whileTap={{ scale: 0.85 }} onClick={handleRefresh} animate={{ rotate: isRefreshing ? 360 : 0 }} transition={{ duration: 0.8 }}
                className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }}>
                <RefreshCw size={14} color={isDark ? '#AAA' : '#888'} />
              </motion.button>
            </div>
          </div>

          <div className="space-y-3">
            {ratePairs.map((pair) => {
              const rate = getRate(pair.from, pair.to);
              const trend = trends[pair.key];
              return (
                <div key={pair.key} className="flex items-center justify-between p-3 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold" style={{ background: `${currencyBadgeColors[pair.from]}15`, color: currencyBadgeColors[pair.from] }}>
                      {currencySymbols[pair.from]}
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                        {currencyNames[pair.from]}
                      </p>
                      <p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>
                        {pair.from} {'->'} {pair.to}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" dir="ltr" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>
                      {rate < 1 ? rate.toFixed(4) : rate.toFixed(2)}
                    </span>
                    {trend === 'up' && <TrendingUp size={12} color="#10B981" />}
                    {trend === 'down' && <TrendingDown size={12} color="#E60000" />}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Currency Converter */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl p-4" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Calculator size={16} color="#E60000" />
            <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>محول العملات</h3>
          </div>

          {/* From */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
              <input type="number" value={fromAmount} onChange={e => setFromAmount(e.target.value)} placeholder="0" dir="ltr"
                className="flex-1 bg-transparent outline-none text-2xl font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }} />
              <select value={fromCurrency} onChange={e => setFromCurrency(e.target.value as 'YER' | 'SAR' | 'USD')}
                className="px-3 py-2 rounded-lg text-sm font-bold outline-none" style={{ background: `${currencyBadgeColors[fromCurrency]}15`, color: currencyBadgeColors[fromCurrency] }}>
                <option value="YER">ر.ي</option><option value="SAR">ر.س</option><option value="USD">$</option>
              </select>
            </div>

            {/* Swap button */}
            <div className="flex justify-center">
              <motion.button whileTap={{ scale: 0.85, rotate: 180 }} onClick={handleSwap}
                className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(230,0,0,0.15)' }}>
                <ArrowRightLeft size={18} color="#E60000" />
              </motion.button>
            </div>

            {/* To */}
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

            {/* Rate info */}
            <div className="flex items-center justify-center gap-3 p-2 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
              <p className="text-[10px]" style={{ color: isDark ? '#888' : '#AAA' }}>
                1 {currencySymbols[fromCurrency]} = {getRate(fromCurrency, toCurrency) < 1 ? getRate(fromCurrency, toCurrency).toFixed(4) : getRate(fromCurrency, toCurrency).toFixed(2)} {currencySymbols[toCurrency]}
              </p>
              {commission > 0 && (
                <span className="text-[10px]" style={{ color: '#E60000' }}>
                  عمولة {commission}%
                </span>
              )}
            </div>

            <motion.button whileTap={{ scale: 0.95 }} onClick={handleSaveConversion}
              className="w-full py-3 rounded-xl text-xs font-bold text-white" style={{ background: '#E60000' }}>
              حفظ التحويل
            </motion.button>
          </div>
        </motion.div>

        {/* Conversion History */}
        {conversionHistory.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl p-4" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
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
    </div>
  );
}
