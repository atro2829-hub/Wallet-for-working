'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Tag, Copy, CheckCircle2, XCircle, Percent,
  Gift, Clock, Check, AlertCircle, Hash, Calendar
} from 'lucide-react';
import { useAppStore, type PromoCode } from '@/lib/store';
import { currencySymbols, currencyNames, currencyBadgeColors, timeAgo } from '@/lib/utils';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';

export default function PromoScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { setActiveScreen, promoCodes, applyPromoCode, addNotification, user } = useAppStore();

  const [codeInput, setCodeInput] = useState('');
  const [applyResult, setApplyResult] = useState<{ success: boolean; message: string; discount?: number; discountType?: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [appliedHistory, setAppliedHistory] = useState<{ code: string; discount: number; type: string; date: string }[]>([]);

  // Firebase promo codes
  const [firebaseCodes, setFirebaseCodes] = useState<PromoCode[]>([]);

  useEffect(() => {
    const codesRef = ref(database, 'promo-codes');
    const unsubscribe = onValue(codesRef, (snapshot) => {
      if (snapshot.exists()) {
        setFirebaseCodes(Object.values(snapshot.val()) as PromoCode[]);
      } else {
        setFirebaseCodes([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const allCodes = [...firebaseCodes, ...promoCodes].filter(
    (code, index, self) => index === self.findIndex(c => c.id === code.id)
  );
  const activeCodes = allCodes.filter(c => c.isActive && c.usedCount < c.maxUses && new Date(c.expiresAt) > new Date());

  const handleApplyCode = () => {
    if (!codeInput.trim()) return;
    const result = applyPromoCode(codeInput.trim());
    if (result) {
      const discountText = result.type === 'percentage' ? `${result.discount}%` : `${result.discount} ${currencySymbols[result.currency]}`;
      setApplyResult({ success: true, message: `تم تطبيق الخصم بنجاح`, discount: result.discount, discountType: discountText });
      setAppliedHistory(prev => [{ code: result.code, discount: result.discount, type: result.type, date: new Date().toISOString() }, ...prev]);
      // Add notification
      if (user) {
        addNotification({
          id: `promo-${Date.now()}`, title: 'تم تطبيق كود الخصم', body: `كود ${result.code}: خصم ${discountText}`,
          type: 'promo', isRead: false, createdAt: new Date().toISOString()
        });
      }
      setCodeInput('');
    } else {
      setApplyResult({ success: false, message: 'الكود غير صالح أو منتهي الصلاحية' });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

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
              <h1 className="text-white text-xl font-bold">أكواد الخصم</h1>
              <p className="text-white/40 text-xs">وفر أكثر مع الحبيلين اونلاين</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(230,0,0,0.2)' }}>
              <Tag size={20} strokeWidth={1.5} color="#E60000" />
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 pb-8 space-y-4">
        {/* Apply Code Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Gift size={16} color="#E60000" />
            <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>تطبيق كود خصم</h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
              <Hash size={14} color={isDark ? '#555' : '#AAA'} />
              <input type="text" placeholder="أدخل الكود هنا..." value={codeInput} onChange={e => { setCodeInput(e.target.value.toUpperCase()); setApplyResult(null); }}
                className="flex-1 bg-transparent outline-none text-sm font-mono" style={{ color: isDark ? '#FFF' : '#1a1a1a' }} dir="ltr" />
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleApplyCode}
              className="px-5 py-3 rounded-xl text-sm font-bold text-white" style={{ background: '#E60000' }}>
              تطبيق
            </motion.button>
          </div>

          {/* Result */}
          <AnimatePresence>
            {applyResult && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3">
                <div className="flex items-center gap-2 p-3 rounded-xl" style={{
                  background: applyResult.success ? 'rgba(16,185,129,0.1)' : 'rgba(230,0,0,0.1)',
                  border: applyResult.success ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(230,0,0,0.2)',
                }}>
                  {applyResult.success ? (
                    <CheckCircle2 size={18} color="#10B981" />
                  ) : (
                    <XCircle size={18} color="#E60000" />
                  )}
                  <div className="flex-1">
                    <p className="text-xs font-medium" style={{ color: applyResult.success ? '#10B981' : '#E60000' }}>{applyResult.message}</p>
                    {applyResult.discountType && (
                      <p className="text-lg font-bold mt-0.5" style={{ color: '#10B981' }}>خصم {applyResult.discountType}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Available Codes */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl p-4" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Percent size={16} color="#E60000" />
            <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>الأكواد المتاحة</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full mr-auto" style={{ background: 'rgba(230,0,0,0.15)', color: '#E60000' }}>{activeCodes.length} كود</span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
            {activeCodes.map((code) => (
              <div key={code.id} className="rounded-xl p-4" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderRight: '3px solid #E60000' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-mono font-bold" style={{ color: '#E60000' }} dir="ltr">{code.code}</span>
                    <motion.button whileTap={{ scale: 0.8 }} onClick={() => handleCopyCode(code.code)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(230,0,0,0.1)' }}>
                      {copiedCode === code.code ? <Check size={12} color="#10B981" /> : <Copy size={12} color="#E60000" />}
                    </motion.button>
                  </div>
                  <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(230,0,0,0.15)', color: '#E60000' }}>
                    {code.type === 'percentage' ? `${code.discount}%` : `${code.discount} ${currencySymbols[code.currency]}`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${currencyBadgeColors[code.currency]}12`, color: currencyBadgeColors[code.currency] }}>
                    {currencyNames[code.currency]}
                  </span>
                  <span className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>
                    {code.type === 'percentage' ? 'خصم نسبة' : 'خصم ثابت'}
                  </span>
                  <span className="text-[10px] flex items-center gap-1" style={{ color: isDark ? '#666' : '#AAA' }}>
                    <Calendar size={8} />
                    {new Date(code.expiresAt).toLocaleDateString('ar-SA')}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min((code.usedCount / code.maxUses) * 100, 100)}%`, background: '#E60000' }} />
                  </div>
                  <span className="text-[9px]" style={{ color: isDark ? '#555' : '#BBB' }}>متبقي {code.maxUses - code.usedCount}</span>
                </div>
              </div>
            ))}

            {activeCodes.length === 0 && (
              <div className="flex flex-col items-center py-6">
                <Tag size={36} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} />
                <p className="text-xs mt-2" style={{ color: isDark ? '#666' : '#AAA' }}>لا توجد أكواد متاحة حالياً</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Applied History */}
        {appliedHistory.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl p-4" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} color="#10B981" />
              <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>الأكواد المطبقة</h3>
            </div>
            <div className="space-y-2">
              {appliedHistory.map((h, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} color="#10B981" />
                    <span className="text-xs font-mono font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }} dir="ltr">{h.code}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: '#10B981' }}>
                      {h.type === 'percentage' ? `${h.discount}%` : `${h.discount}`}
                    </span>
                    <span className="text-[9px]" style={{ color: isDark ? '#555' : '#BBB' }}>{timeAgo(h.date)}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
