'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Globe,
  Ban,
  Plus,
  Trash2,
  Search,
  Shield,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function IPBlockingPanel() {
  const [ipList, setIpList] = useState([
    { ip: '192.168.1.100', reason: 'محاولات متعددة', date: '2024-01-15' },
    { ip: '10.0.0.55', reason: 'نشاط مشبوه', date: '2024-01-14' },
  ]);
  const [newIp, setNewIp] = useState('');
  const [newReason, setNewReason] = useState('');
  const [search, setSearch] = useState('');

  const filteredIps = ipList.filter(item =>
    item.ip.includes(search) || item.reason.includes(search)
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="ios-large-title text-foreground">حظر عناوين IP</h1>
        <p className="text-muted-foreground text-sm mt-1">إدارة العناوين المحظورة من الوصول</p>
      </div>

      {/* Add IP */}
      <div className="ios-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">حظر عنوان جديد</h3>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={newIp}
            onChange={(e) => setNewIp(e.target.value)}
            placeholder="عنوان IP"
            className="flex-1 min-w-[200px] h-11 px-4 rounded-xl bg-muted/30 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            dir="ltr"
          />
          <input
            type="text"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            placeholder="السبب"
            className="flex-1 min-w-[200px] h-11 px-4 rounded-xl bg-muted/30 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          />
          <button
            onClick={() => {
              if (newIp) {
                setIpList(prev => [...prev, { ip: newIp, reason: newReason || 'حظر يدوي', date: new Date().toISOString().split('T')[0] }]);
                setNewIp('');
                setNewReason('');
              }
            }}
            className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium flex items-center gap-2 shadow-lg shadow-red-500/25 active:scale-[0.98] transition-transform"
          >
            <Ban className="w-4 h-4" />
            حظر
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث في العناوين المحظورة..."
          className="w-full h-11 pr-10 pl-4 rounded-xl bg-muted/30 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30"
        />
      </div>

      {/* IP List */}
      <div className="ios-card overflow-hidden">
        <div className="p-4 pb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">العناوين المحظورة ({filteredIps.length})</h3>
        </div>
        <div>
          {filteredIps.map((item, i) => (
            <div key={i} className="ios-list-item gap-3">
              <Globe className="w-4 h-4 text-red-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground font-mono" dir="ltr">{item.ip}</p>
                <p className="text-[11px] text-muted-foreground">{item.reason} • {item.date}</p>
              </div>
              <button
                onClick={() => setIpList(prev => prev.filter((_, idx) => idx !== i))}
                className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))}
          {filteredIps.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">لا توجد عناوين محظورة</p>
          )}
        </div>
      </div>
    </div>
  );
}
