'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAdminStore } from '@/lib/store';
import { formatNumber, currencySymbols } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  ShoppingCart,
  ArrowDownCircle,
  ArrowUpCircle,
  Shield,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  totalOrders: number;
  pendingOrders: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  pendingKYC: number;
  revenueYER: number;
  revenueSAR: number;
  revenueUSD: number;
}

export default function Dashboard() {
  const { adminUser } = useAdminStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    newUsersToday: 0,
    totalOrders: 0,
    pendingOrders: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    pendingKYC: 0,
    revenueYER: 0,
    revenueSAR: 0,
    revenueUSD: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];

    // Users count
    const usersRef = ref(database, 'users');
    const unsubUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const users = Object.values(data) as any[];
      const newToday = users.filter(
        (u: any) => u.createdAt && u.createdAt.startsWith(today)
      ).length;
      const pendingKyc = users.filter(
        (u: any) => u.kycStatus === 'submitted'
      ).length;

      setStats((prev) => ({
        ...prev,
        totalUsers: users.length,
        newUsersToday: newToday,
        pendingKYC: pendingKyc,
      }));
    });

    // Orders
    const ordersRef = ref(database, 'orders');
    const unsubOrders = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const orders = Object.values(data) as any[];
      const pending = orders.filter((o: any) => o.status === 'pending').length;
      const completed = orders.filter((o: any) => o.status === 'completed');
      const revYER = completed.filter((o: any) => o.currency === 'YER').reduce((sum: number, o: any) => sum + (o.amount || 0), 0);
      const revSAR = completed.filter((o: any) => o.currency === 'SAR').reduce((sum: number, o: any) => sum + (o.amount || 0), 0);
      const revUSD = completed.filter((o: any) => o.currency === 'USD').reduce((sum: number, o: any) => sum + (o.amount || 0), 0);

      const sorted = [...orders].sort((a: any, b: any) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      ).slice(0, 5);

      setStats((prev) => ({
        ...prev,
        totalOrders: orders.length,
        pendingOrders: pending,
        revenueYER: revYER,
        revenueSAR: revSAR,
        revenueUSD: revUSD,
      }));
      setRecentOrders(sorted);
    });

    // Deposits
    const depRef = ref(database, 'depositRequests');
    const unsubDep = onValue(depRef, (snapshot) => {
      const data = snapshot.val() || {};
      const deposits = Object.values(data) as any[];
      const pending = deposits.filter((d: any) => d.status === 'pending').length;
      setStats((prev) => ({ ...prev, pendingDeposits: pending }));
    });

    // Withdrawals
    const wdRef = ref(database, 'withdrawRequests');
    const unsubWd = onValue(wdRef, (snapshot) => {
      const data = snapshot.val() || {};
      const withdrawals = Object.values(data) as any[];
      const pending = withdrawals.filter((w: any) => w.status === 'pending').length;
      setStats((prev) => ({ ...prev, pendingWithdrawals: pending }));
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubOrders();
      unsubDep();
      unsubWd();
    };
  }, []);

  const statCards = [
    {
      title: 'إجمالي المستخدمين',
      value: formatNumber(stats.totalUsers),
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      sub: `${formatNumber(stats.newUsersToday)} جديد اليوم`,
    },
    {
      title: 'إجمالي الطلبات',
      value: formatNumber(stats.totalOrders),
      icon: ShoppingCart,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      sub: `${formatNumber(stats.pendingOrders)} قيد الانتظار`,
    },
    {
      title: 'طلبات الإيداع',
      value: formatNumber(stats.pendingDeposits),
      icon: ArrowDownCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      sub: 'بانتظار المراجعة',
    },
    {
      title: 'طلبات السحب',
      value: formatNumber(stats.pendingWithdrawals),
      icon: ArrowUpCircle,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      sub: 'بانتظار المراجعة',
    },
    {
      title: 'طلبات التحقق',
      value: formatNumber(stats.pendingKYC),
      icon: Shield,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      sub: 'بانتظار المراجعة',
    },
    {
      title: 'إيرادات ر.ي',
      value: formatNumber(stats.revenueYER),
      icon: DollarSign,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      sub: currencySymbols.YER,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">لوحة المعلومات</h1>
        <p className="text-muted-foreground text-sm mt-1">
          مرحبا {adminUser?.displayName} - ملخص النظام
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="admin-card border-0 shadow-none">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn('p-2 rounded-xl', card.bgColor)}>
                    <card.icon className={cn('w-5 h-5', card.color)} />
                  </div>
                </div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="admin-card border-0 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-500/10">
                <DollarSign className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إيرادات الريال اليمني</p>
                <p className="text-xl font-bold">{formatNumber(stats.revenueYER)} {currencySymbols.YER}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="admin-card border-0 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-500/10">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إيرادات الريال السعودي</p>
                <p className="text-xl font-bold">{formatNumber(stats.revenueSAR)} {currencySymbols.SAR}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="admin-card border-0 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10">
                <DollarSign className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إيرادات الدولار</p>
                <p className="text-xl font-bold">{formatNumber(stats.revenueUSD)} {currencySymbols.USD}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="admin-card border-0 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">آخر الطلبات</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">لا توجد طلبات</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      {order.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : order.status === 'pending' ? (
                        <Clock className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{order.packageName || order.providerName || 'طلب'}</p>
                      <p className="text-xs text-muted-foreground">{order.userName || 'مستخدم'}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">{formatNumber(order.amount || 0)} {currencySymbols[order.currency || 'YER']}</p>
                    <Badge className={
                      order.status === 'completed' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                      order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                      'bg-red-500/20 text-red-600 dark:text-red-400'
                    }>
                      {order.status === 'completed' ? 'مكتمل' : order.status === 'pending' ? 'معلق' : 'ملغي'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
