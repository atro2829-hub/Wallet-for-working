'use client';

import { useState } from 'react';
import { useAdminStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  CircleDollarSign,
  Receipt,
  PiggyBank,
  ArrowRightLeft,
  Calendar,
  Download,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatNumber, currencySymbols } from '@/lib/utils';

export default function FinancialReportsPanel() {
  const { orders, depositRequests, withdrawRequests, allUsers } = useAdminStore();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Calculate financial stats
  const completedOrders = orders.filter((o: any) => o.status === 'completed');
  const totalRevenueYER = completedOrders.filter((o: any) => o.currency === 'YER').reduce((sum: number, o: any) => sum + (o.amount || 0), 0);
  const totalRevenueSAR = completedOrders.filter((o: any) => o.currency === 'SAR').reduce((sum: number, o: any) => sum + (o.amount || 0), 0);
  const totalRevenueUSD = completedOrders.filter((o: any) => o.currency === 'USD').reduce((sum: number, o: any) => sum + (o.amount || 0), 0);

  const totalDeposits = depositRequests.filter((d: any) => d.status === 'completed');
  const totalWithdrawals = withdrawRequests.filter((w: any) => w.status === 'completed');

  const depositTotalYER = totalDeposits.filter((d: any) => d.currency === 'YER').reduce((s: number, d: any) => s + (d.amount || 0), 0);
  const depositTotalSAR = totalDeposits.filter((d: any) => d.currency === 'SAR').reduce((s: number, d: any) => s + (d.amount || 0), 0);

  const withdrawTotalYER = totalWithdrawals.filter((w: any) => w.currency === 'YER').reduce((s: number, w: any) => s + (w.amount || 0), 0);
  const withdrawTotalSAR = totalWithdrawals.filter((w: any) => w.currency === 'SAR').reduce((s: number, w: any) => s + (w.amount || 0), 0);

  const stats = [
    { title: 'إيرادات ر.ي', value: totalRevenueYER, currency: 'YER', icon: DollarSign, color: 'text-red-500', bg: 'bg-red-500/10' },
    { title: 'إيرادات ر.س', value: totalRevenueSAR, currency: 'SAR', icon: CircleDollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
    { title: 'إيرادات $', value: totalRevenueUSD, currency: 'USD', icon: DollarSign, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'إجمالي الإيداعات', value: depositTotalYER, currency: 'YER', icon: ArrowDownCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'إجمالي السحوبات', value: withdrawTotalYER, currency: 'YER', icon: ArrowUpCircle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { title: 'طلبات مكتملة', value: completedOrders.length, currency: '', icon: Receipt, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="ios-large-title text-foreground">التقارير المالية</h1>
          <p className="text-muted-foreground text-sm mt-1">تحليل الإيرادات والمعاملات</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2.5 rounded-xl ios-card card-press">
            <Download className="w-4 h-4 text-muted-foreground" />
          </button>
          <button className="p-2.5 rounded-xl ios-card card-press">
            <Filter className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex gap-2">
        {(['daily', 'weekly', 'monthly'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all',
              period === p
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                : 'ios-card text-muted-foreground'
            )}
          >
            {p === 'daily' ? 'يومي' : p === 'weekly' ? 'أسبوعي' : 'شهري'}
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="ios-card p-4">
              <div className={cn('p-2 rounded-xl w-fit', stat.bg)}>
                <stat.icon className={cn('w-4 h-4', stat.color)} />
              </div>
              <p className="text-lg font-bold text-foreground mt-2">{formatNumber(stat.value)}</p>
              <p className="text-[11px] text-muted-foreground">{stat.title}</p>
              {stat.currency && <p className="text-[10px] text-muted-foreground/60">{currencySymbols[stat.currency]}</p>}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="ios-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">تفاصيل الإيرادات</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <span className="text-sm text-foreground">إيرادات الريال اليمني</span>
              <span className="text-sm font-bold text-foreground">{formatNumber(totalRevenueYER)} {currencySymbols.YER}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <span className="text-sm text-foreground">إيرادات الريال السعودي</span>
              <span className="text-sm font-bold text-foreground">{formatNumber(totalRevenueSAR)} {currencySymbols.SAR}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <span className="text-sm text-foreground">إيرادات الدولار</span>
              <span className="text-sm font-bold text-foreground">{formatNumber(totalRevenueUSD)} {currencySymbols.USD}</span>
            </div>
          </div>
        </div>

        <div className="ios-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">ملخص الإيداع والسحب</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/5 border border-green-500/10">
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-foreground">إجمالي الإيداعات (ر.ي)</span>
              </div>
              <span className="text-sm font-bold text-green-600 dark:text-green-400">{formatNumber(depositTotalYER)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/5 border border-green-500/10">
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-foreground">إجمالي الإيداعات (ر.س)</span>
              </div>
              <span className="text-sm font-bold text-green-600 dark:text-green-400">{formatNumber(depositTotalSAR)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-foreground">إجمالي السحوبات (ر.ي)</span>
              </div>
              <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{formatNumber(withdrawTotalYER)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-foreground">إجمالي السحوبات (ر.س)</span>
              </div>
              <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{formatNumber(withdrawTotalSAR)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
