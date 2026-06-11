'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatNumber, currencySymbols } from '@/lib/utils';
import {
  CircleDollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRightLeft,
  Plus,
  Filter,
  Download,
  Search,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAdminStore } from '@/lib/store';

const mockSettlements = [
  { id: 1, provider: 'مزود Y', amount: 150000, currency: 'YER', status: 'completed', date: '2024-01-15' },
  { id: 2, provider: 'مزود S', amount: 500, currency: 'SAR', status: 'pending', date: '2024-01-14' },
  { id: 3, provider: 'مزود Y2', amount: 75000, currency: 'YER', status: 'completed', date: '2024-01-13' },
  { id: 4, provider: 'مزود U', amount: 200, currency: 'USD', status: 'rejected', date: '2024-01-12' },
];

export default function SettlementsPanel() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredSettlements = mockSettlements.filter(s => {
    const matchSearch = s.provider.includes(search);
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    completed: { label: 'مكتمل', color: 'bg-green-500/15 text-green-500', icon: CheckCircle2 },
    pending: { label: 'معلق', color: 'bg-yellow-500/15 text-yellow-500', icon: Clock },
    rejected: { label: 'مرفوض', color: 'bg-red-500/15 text-red-500', icon: XCircle },
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="ios-large-title text-foreground">إدارة التسويات</h1>
          <p className="text-muted-foreground text-sm mt-1">تسوية الحسابات مع المزودين</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2.5 rounded-xl ios-card card-press">
            <Download className="w-4 h-4 text-muted-foreground" />
          </button>
          <button className="px-4 py-2.5 rounded-xl bg-purple-500 text-white text-sm font-medium flex items-center gap-2 shadow-lg shadow-purple-500/25 active:scale-[0.98] transition-transform">
            <Plus className="w-4 h-4" />
            تسوية جديدة
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث..."
            className="w-full h-11 pr-10 pl-4 rounded-xl bg-muted/30 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          />
        </div>
        {['all', 'completed', 'pending', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all',
              statusFilter === status
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                : 'ios-card text-muted-foreground'
            )}
          >
            {status === 'all' ? 'الكل' : statusConfig[status]?.label}
          </button>
        ))}
      </div>

      {/* Settlements List */}
      <div className="ios-card overflow-hidden">
        <div>
          {filteredSettlements.map((settlement, i) => {
            const config = statusConfig[settlement.status];
            const StatusIcon = config.icon;
            return (
              <div key={settlement.id} className="ios-list-item gap-3">
                <div className={cn('p-2 rounded-xl shrink-0', settlement.status === 'completed' ? 'bg-green-500/10' : settlement.status === 'pending' ? 'bg-yellow-500/10' : 'bg-red-500/10')}>
                  <ArrowRightLeft className={cn('w-4 h-4', settlement.status === 'completed' ? 'text-green-500' : settlement.status === 'pending' ? 'text-yellow-500' : 'text-red-500')} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{settlement.provider}</p>
                  <p className="text-[11px] text-muted-foreground">{settlement.date}</p>
                </div>
                <div className="text-left shrink-0 flex items-center gap-2">
                  <div>
                    <p className="text-sm font-bold text-foreground">{formatNumber(settlement.amount)} {currencySymbols[settlement.currency]}</p>
                    <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold', config.color)}>
                      <StatusIcon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredSettlements.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">لا توجد تسويات</p>
          )}
        </div>
      </div>
    </div>
  );
}
