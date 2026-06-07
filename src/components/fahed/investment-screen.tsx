'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, TrendingUp, Clock, CheckCircle2, AlertCircle,
  Coins, BarChart3, History, Wallet, ArrowRightLeft, Info, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { currencySymbols, formatNumber, formatBalance } from '@/lib/utils';
import { LOGO_BASE64 } from '@/lib/logo';
import { ref, get, update } from 'firebase/database';
import { database } from '@/lib/firebase';

interface InvestmentPlan {
  id: string;
  name: string;
  duration: string;
  durationDays: number;
  dailyRate: number;
  minAmount: number;
  maxAmount: number;
  description: string;
  color: string;
}

interface ActiveInvestment {
  id: string;
  planId: string;
  planName: string;
  amount: number;
  dailyRate: number;
  startDate: string;
  endDate: string;
  earnedSoFar: number;
  status: 'active' | 'completed' | 'withdrawn';
}

const investmentPlans: InvestmentPlan[] = [
  {
    id: 'usdt-daily',
    name: 'USDT يومي',
    duration: 'يومي',
    durationDays: 1,
    dailyRate: 0.5,
    minAmount: 10,
    maxAmount: 1000,
    description: 'عائد يومي 0.5% - سحب يومي',
    color: '#10B981',
  },
  {
    id: 'usdt-weekly',
    name: 'USDT أسبوعي',
    duration: 'أسبوعي (7 أيام)',
    durationDays: 7,
    dailyRate: 0.8,
    minAmount: 50,
    maxAmount: 5000,
    description: 'عائد يومي 0.8% - سحب أسبوعي',
    color: '#3B82F6',
  },
  {
    id: 'usdt-monthly',
    name: 'USDT شهري',
    duration: 'شهري (30 يوم)',
    durationDays: 30,
    dailyRate: 1.2,
    minAmount: 100,
    maxAmount: 10000,
    description: 'عائد يومي 1.2% - سحب شهري',
    color: '#8B5CF6',
  },
  {
    id: 'usdt-quarterly',
    name: 'USDT ربع سنوي',
    duration: 'ربع سنوي (90 يوم)',
    durationDays: 90,
    dailyRate: 1.5,
    minAmount: 500,
    maxAmount: 50000,
    description: 'عائد يومي 1.5% - سحب ربع سنوي',
    color: '#F59E0B',
  },
];

function formatUsdtAmount(amount: number): string {
  if (amount < 0.01) return '0.00';
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function InvestmentScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user, setActiveScreen, providers, setSelectedProvider, setOrderOpen } = useAppStore();

  const [activeInvestments, setActiveInvestments] = useState<ActiveInvestment[]>([]);
  const [investmentHistory, setInvestmentHistory] = useState<ActiveInvestment[]>([]);
  const [activeTab, setActiveTab] = useState<'plans' | 'active' | 'history'>('plans');
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [investAmount, setInvestAmount] = useState('');
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  const usdtBalance = user?.balanceUSD || 0;

  // Fetch investments from Firebase
  useEffect(() => {
    if (!user?.id) return;
    const fetchInvestments = async () => {
      try {
        const snapshot = await get(ref(database, `investments/${user.id}`));
        if (snapshot.exists()) {
          const data = snapshot.val();
          const allInvestments = Object.values(data) as ActiveInvestment[];
          const active = allInvestments.filter(inv => inv.status === 'active');
          const history = allInvestments.filter(inv => inv.status !== 'active');
          setActiveInvestments(active);
          setInvestmentHistory(history);
        }
      } catch {
        // No investments yet
      }
    };
    fetchInvestments();
  }, [user?.id]);

  const handleInvestClick = (plan: InvestmentPlan) => {
    setSelectedPlan(plan);
    setInvestAmount(plan.minAmount.toString());
    setShowInvestModal(true);
  };

  const handleConfirmInvest = async () => {
    if (!selectedPlan || !user) return;
    const amount = parseFloat(investAmount) || 0;
    if (amount < selectedPlan.minAmount || amount > selectedPlan.maxAmount) return;
    if (amount > usdtBalance) return;

    setIsProcessing(true);
    try {
      const investId = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + selectedPlan.durationDays * 24 * 60 * 60 * 1000);

      const newInvestment: ActiveInvestment = {
        id: investId,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        amount,
        dailyRate: selectedPlan.dailyRate,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        earnedSoFar: 0,
        status: 'active',
      };

      // Update Firebase
      const updates: Record<string, unknown> = {};
      updates[`investments/${user.id}/${investId}`] = newInvestment;
      updates[`users/${user.id}/balanceUSD`] = (user.balanceUSD || 0) - amount;

      // Add transaction
      const txId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      updates[`transactions/${txId}`] = {
        id: txId,
        fromUserId: user.id,
        toUserId: user.id,
        amount,
        currency: 'USD',
        type: 'investment',
        status: 'completed',
        description: `استثمار ${formatUsdtAmount(amount)} USDT في خطة ${selectedPlan.name}`,
        createdAt: new Date().toISOString(),
      };

      // Add notification
      const notifId = `notif-${Date.now()}`;
      updates[`notifications/${user.id}/${notifId}`] = {
        title: 'تم الاستثمار بنجاح',
        body: `تم استثمار ${formatUsdtAmount(amount)} USDT في خطة ${selectedPlan.name} بعائد ${selectedPlan.dailyRate}% يومياً`,
        type: 'transaction',
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      await update(ref(database), updates);

      setActiveInvestments(prev => [newInvestment, ...prev]);
      setShowInvestModal(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch {
      // Error
    } finally {
      setIsProcessing(false);
    }
  };

  const estimatedReturn = selectedPlan
    ? (parseFloat(investAmount) || 0) * (1 + (selectedPlan.dailyRate / 100) * selectedPlan.durationDays)
    : 0;
  const estimatedProfit = estimatedReturn - (parseFloat(investAmount) || 0);

  const totalEarnings = activeInvestments.reduce((sum, inv) => {
    const daysElapsed = Math.floor((Date.now() - new Date(inv.startDate).getTime()) / (1000 * 60 * 60 * 24));
    return sum + (inv.amount * (inv.dailyRate / 100) * Math.min(daysElapsed, 30));
  }, 0);

  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const innerBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';

  return (
    <div className="min-h-screen" style={{ background: isDark ? '#0F0F0F' : '#F5F5F5' }}>
      {/* Header */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #0A2A1A 0%, #0F1A0F 50%, #0F0F0F 100%)' }}>
        <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 20% 50%, rgba(16,185,129,0.2), transparent 60%)' }} />
        <div className="relative px-5 pt-4 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setActiveScreen('main')} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <ArrowLeft size={18} strokeWidth={1.5} color="#FFF" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-white text-xl font-bold">استثمار USDT</h1>
              <p className="text-white/40 text-xs">عوائد مضمونة • سحب مرن</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.2)' }}>
              <TrendingUp size={20} strokeWidth={1.5} color="#10B981" />
            </div>
          </div>

          {/* USDT Balance Card */}
          <div className="rounded-2xl p-4" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Coins size={16} color="#10B981" />
              <span className="text-[11px] font-medium" style={{ color: '#10B981' }}>رصيد USDT</span>
            </div>
            <p className="text-3xl font-bold" dir="ltr" style={{ color: '#10B981' }}>
              {formatUsdtAmount(usdtBalance)}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <div>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>استثمارات نشطة</span>
                <p className="text-sm font-bold" style={{ color: '#FFF' }}>{activeInvestments.length}</p>
              </div>
              <div>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>أرباح مكتسبة</span>
                <p className="text-sm font-bold" style={{ color: '#10B981' }}>${formatUsdtAmount(totalEarnings)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 mt-4 mb-4">
        <div className="flex gap-2">
          {[
            { id: 'plans' as const, label: 'خطط الاستثمار', icon: BarChart3 },
            { id: 'active' as const, label: 'الاستثمارات النشطة', icon: TrendingUp },
            { id: 'history' as const, label: 'السجل', icon: History },
          ].map(tab => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all"
                style={{
                  background: isActive ? '#10B981' : (isDark ? '#1A1A1A' : '#FFFFFF'),
                  border: `1px solid ${isActive ? '#10B981' : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)')}`,
                }}>
                <TabIcon size={14} color={isActive ? '#FFF' : (isDark ? '#666' : '#AAA')} />
                <span className="text-[10px] font-bold" style={{ color: isActive ? '#FFF' : (isDark ? '#666' : '#AAA') }}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 pb-8">
        <AnimatePresence mode="wait">
          {activeTab === 'plans' && (
            <motion.div key="plans" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
              {investmentPlans.map((plan, index) => (
                <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * index }}
                  className="rounded-2xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${plan.color}15` }}>
                          <TrendingUp size={18} color={plan.color} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{plan.name}</h3>
                          <p className="text-[10px]" style={{ color: isDark ? '#888' : '#AAA' }}>{plan.duration}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-lg font-bold" style={{ color: plan.color }}>{plan.dailyRate}%</p>
                        <p className="text-[9px]" style={{ color: isDark ? '#666' : '#BBB' }}>عائد يومي</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="p-2 rounded-lg text-center" style={{ background: innerBg }}>
                        <p className="text-[9px]" style={{ color: isDark ? '#666' : '#AAA' }}>الحد الأدنى</p>
                        <p className="text-xs font-bold" style={{ color: isDark ? '#CCC' : '#444' }}>${formatUsdtAmount(plan.minAmount)}</p>
                      </div>
                      <div className="p-2 rounded-lg text-center" style={{ background: innerBg }}>
                        <p className="text-[9px]" style={{ color: isDark ? '#666' : '#AAA' }}>الحد الأقصى</p>
                        <p className="text-xs font-bold" style={{ color: isDark ? '#CCC' : '#444' }}>${formatUsdtAmount(plan.maxAmount)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg mb-3" style={{ background: innerBg }}>
                      <Info size={12} color={isDark ? '#888' : '#AAA'} />
                      <span className="text-[10px]" style={{ color: isDark ? '#888' : '#888' }}>
                        عائد إجمالي {((plan.dailyRate / 100) * plan.durationDays * 100).toFixed(0)}% خلال {plan.durationDays} يوم
                      </span>
                    </div>

                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleInvestClick(plan)}
                      className="w-full py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: plan.color }}>
                      استثمر الآن
                    </motion.button>
                  </div>
                </motion.div>
              ))}

              {/* Info box */}
              <div className="rounded-2xl p-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} color="#10B981" className="mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold mb-1" style={{ color: '#10B981' }}>ملاحظة مهمة</p>
                    <p className="text-[10px] leading-relaxed" style={{ color: isDark ? '#AAA' : '#666' }}>
                      الاستثمار في العملات الرقمية ينطوي على مخاطر. العوائد المذكورة تقديرية وليست مضمونة. يرجى الاستثمار بما يتوافق مع قدرتك المالية. يجب توثيق حسابك للاستثمار.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'active' && (
            <motion.div key="active" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {activeInvestments.length > 0 ? (
                <div className="space-y-3">
                  {activeInvestments.map((inv) => {
                    const daysElapsed = Math.floor((Date.now() - new Date(inv.startDate).getTime()) / (1000 * 60 * 60 * 24));
                    const dailyEarning = inv.amount * (inv.dailyRate / 100);
                    const totalEarning = dailyEarning * daysElapsed;
                    const plan = investmentPlans.find(p => p.id === inv.planId);
                    return (
                      <div key={inv.id} className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${plan?.color || '#10B981'}15` }}>
                              <TrendingUp size={14} color={plan?.color || '#10B981'} />
                            </div>
                            <div>
                              <p className="text-xs font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{inv.planName}</p>
                              <p className="text-[9px]" style={{ color: isDark ? '#666' : '#AAA' }}>منذ {daysElapsed} يوم</p>
                            </div>
                          </div>
                          <div className="px-2 py-1 rounded-md" style={{ background: 'rgba(16,185,129,0.1)' }}>
                            <span className="text-[9px] font-bold" style={{ color: '#10B981' }}>نشط</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2 rounded-lg text-center" style={{ background: innerBg }}>
                            <p className="text-[9px]" style={{ color: isDark ? '#666' : '#AAA' }}>المبلغ</p>
                            <p className="text-[11px] font-bold" style={{ color: isDark ? '#CCC' : '#444' }}>${formatUsdtAmount(inv.amount)}</p>
                          </div>
                          <div className="p-2 rounded-lg text-center" style={{ background: innerBg }}>
                            <p className="text-[9px]" style={{ color: isDark ? '#666' : '#AAA' }}>عائد يومي</p>
                            <p className="text-[11px] font-bold" style={{ color: '#10B981' }}>${formatUsdtAmount(dailyEarning)}</p>
                          </div>
                          <div className="p-2 rounded-lg text-center" style={{ background: innerBg }}>
                            <p className="text-[9px]" style={{ color: isDark ? '#666' : '#AAA' }}>مكتسب</p>
                            <p className="text-[11px] font-bold" style={{ color: '#10B981' }}>${formatUsdtAmount(totalEarning)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl p-8 flex flex-col items-center" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: innerBg }}>
                    <TrendingUp size={24} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: isDark ? '#555' : '#AAA' }}>لا توجد استثمارات نشطة</p>
                  <p className="text-[11px] mt-1" style={{ color: isDark ? '#444' : '#CCC' }}>ابدأ بالاستثمار في خطط USDT</p>
                  <button onClick={() => setActiveTab('plans')}
                    className="mt-3 px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ background: '#10B981' }}>
                    عرض الخطط
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {investmentHistory.length > 0 ? (
                <div className="space-y-2">
                  {investmentHistory.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: inv.status === 'completed' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)' }}>
                          {inv.status === 'completed' ? <CheckCircle2 size={14} color="#10B981" /> : <Clock size={14} color="#F59E0B" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{inv.planName}</p>
                          <p className="text-[9px]" style={{ color: isDark ? '#666' : '#AAA' }}>${formatUsdtAmount(inv.amount)} USDT</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md"
                          style={{ background: inv.status === 'completed' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: inv.status === 'completed' ? '#10B981' : '#F59E0B' }}>
                          {inv.status === 'completed' ? 'مكتمل' : inv.status === 'withdrawn' ? 'مسحوب' : 'منتهي'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl p-8 flex flex-col items-center" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: innerBg }}>
                    <History size={24} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: isDark ? '#555' : '#AAA' }}>لا يوجد سجل استثمارات</p>
                  <p className="text-[11px] mt-1" style={{ color: isDark ? '#444' : '#CCC' }}>ستظهر هنا استثماراتك السابقة</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ Investment Modal ═══ */}
      <AnimatePresence>
        {showInvestModal && selectedPlan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowInvestModal(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-full max-w-lg rounded-t-3xl p-5"
              style={{ background: isDark ? '#0F0F0F' : '#F5F5F5' }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${selectedPlan.color}15` }}>
                  <TrendingUp size={20} color={selectedPlan.color} />
                </div>
                <div>
                  <h3 className="text-base font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>استثمار في {selectedPlan.name}</h3>
                  <p className="text-[11px]" style={{ color: isDark ? '#888' : '#AAA' }}>عائد يومي {selectedPlan.dailyRate}%</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium" style={{ color: isDark ? '#888' : '#999' }}>مبلغ الاستثمار (USDT)</span>
                    <span className="text-[11px]" style={{ color: isDark ? '#666' : '#BBB' }}>
                      رصيدك: ${formatUsdtAmount(usdtBalance)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                    <input type="number" value={investAmount} onChange={e => setInvestAmount(e.target.value)} placeholder="0" dir="ltr"
                      className="flex-1 bg-transparent outline-none text-xl font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }} />
                    <span className="text-sm font-bold" style={{ color: '#10B981' }}>USDT</span>
                  </div>
                  {/* Quick amount buttons */}
                  <div className="flex gap-2 mt-2">
                    {[selectedPlan.minAmount, selectedPlan.minAmount * 5, selectedPlan.minAmount * 10, selectedPlan.maxAmount].map((amt, i) => (
                      <button key={i} onClick={() => setInvestAmount(amt.toString())}
                        className="flex-1 py-1.5 rounded-lg text-[10px] font-bold"
                        style={{ background: innerBg, color: isDark ? '#CCC' : '#444' }}>
                        ${formatUsdtAmount(amt)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Estimated returns */}
                <div className="p-3 rounded-xl space-y-2" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px]" style={{ color: isDark ? '#888' : '#999' }}>عائد يومي</span>
                    <span className="text-[11px] font-bold" style={{ color: '#10B981' }}>
                      ${formatUsdtAmount((parseFloat(investAmount) || 0) * (selectedPlan.dailyRate / 100))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px]" style={{ color: isDark ? '#888' : '#999' }}>عائد إجمالي ({selectedPlan.durationDays} يوم)</span>
                    <span className="text-[11px] font-bold" style={{ color: '#10B981' }}>
                      ${formatUsdtAmount(estimatedProfit)}
                    </span>
                  </div>
                  <div className="h-px" style={{ background: 'rgba(16,185,129,0.2)' }} />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>إجمالي الاسترداد</span>
                    <span className="text-xs font-bold" style={{ color: '#10B981' }}>${formatUsdtAmount(estimatedReturn)}</span>
                  </div>
                </div>

                {/* Insufficient balance */}
                {(parseFloat(investAmount) || 0) > usdtBalance && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(230,0,0,0.1)', border: '1px solid rgba(230,0,0,0.2)' }}>
                    <Wallet size={14} color="#E60000" />
                    <span className="text-[11px] font-medium" style={{ color: '#E60000' }}>رصيد USDT غير كافي</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowInvestModal(false)}
                    className="flex-1 py-3 rounded-xl text-sm font-bold"
                    style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: isDark ? '#FFF' : '#1a1a1a' }}>
                    إلغاء
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={handleConfirmInvest}
                    disabled={isProcessing || (parseFloat(investAmount) || 0) < selectedPlan.minAmount || (parseFloat(investAmount) || 0) > usdtBalance}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
                    style={{ background: (isProcessing || (parseFloat(investAmount) || 0) < selectedPlan.minAmount || (parseFloat(investAmount) || 0) > usdtBalance) ? '#555' : selectedPlan.color }}>
                    {isProcessing ? 'جارٍ الاستثمار...' : 'تأكيد الاستثمار'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl p-4 flex items-center gap-3"
            style={{ background: 'rgba(16,185,129,0.95)', backdropFilter: 'blur(10px)' }}>
            <CheckCircle2 size={20} color="#FFF" />
            <p className="text-sm font-bold text-white">تم الاستثمار بنجاح!</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
