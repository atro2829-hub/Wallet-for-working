'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  KeyRound,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Shield,
  Code,
} from 'lucide-react';
import { motion } from 'framer-motion';

const defaultKeys = [
  { id: 1, name: 'تطبيق المستخدم', key: 'sw_prod_k3y8x9f2m7a1b4c6d0e3', created: '2024-01-01', active: true, permissions: ['read', 'write'] },
  { id: 2, name: 'خدمة الإشعارات', key: 'sw_prod_k3y5n2h8j4k6l0p9q3r7', created: '2024-01-05', active: true, permissions: ['read'] },
  { id: 3, name: 'نظام التقارير', key: 'sw_prod_k3y1a4b7c0d3e6f9g2h5', created: '2024-01-10', active: false, permissions: ['read'] },
];

export default function APIKeysPanel() {
  const [keys, setKeys] = useState(defaultKeys);
  const [showKeys, setShowKeys] = useState<Record<number, boolean>>({});
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  const toggleKeyVisibility = (id: number) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const maskKey = (key: string) => {
    return key.substring(0, 12) + '***...' + key.substring(key.length - 4);
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="ios-large-title text-foreground">مفاتيح API</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة مفاتيح الوصول للخدمات الخارجية</p>
        </div>
        <button
          onClick={() => setShowNewKeyForm(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-500 text-white text-sm font-medium flex items-center gap-2 shadow-lg shadow-purple-500/25 active:scale-[0.98] transition-transform"
        >
          <Plus className="w-4 h-4" />
          إنشاء مفتاح
        </button>
      </div>

      {/* New Key Form */}
      {showNewKeyForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="ios-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">إنشاء مفتاح جديد</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="اسم المفتاح"
              className="flex-1 h-11 px-4 rounded-xl bg-muted/30 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            />
            <button
              onClick={() => {
                if (newKeyName) {
                  const newKey = {
                    id: Date.now(),
                    name: newKeyName,
                    key: 'sw_prod_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 10),
                    created: new Date().toISOString().split('T')[0],
                    active: true,
                    permissions: ['read'],
                  };
                  setKeys(prev => [...prev, newKey]);
                  setNewKeyName('');
                  setShowNewKeyForm(false);
                }
              }}
              className="px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-medium shadow-lg shadow-green-500/25 active:scale-[0.98] transition-transform"
            >
              إنشاء
            </button>
            <button
              onClick={() => { setShowNewKeyForm(false); setNewKeyName(''); }}
              className="px-4 py-2 rounded-xl bg-muted text-foreground text-sm font-medium active:scale-[0.98] transition-transform"
            >
              إلغاء
            </button>
          </div>
        </motion.div>
      )}

      {/* Keys List */}
      <div className="space-y-3">
        {keys.map((key, i) => (
          <motion.div
            key={key.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="ios-card p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={cn('p-2 rounded-xl shrink-0', key.active ? 'bg-green-500/10' : 'bg-muted/30')}>
                  <KeyRound className={cn('w-4 h-4', key.active ? 'text-green-500' : 'text-muted-foreground')} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{key.name}</p>
                    <span className={cn(
                      'px-1.5 py-0.5 rounded text-[9px] font-bold',
                      key.active ? 'bg-green-500/15 text-green-500' : 'bg-muted/30 text-muted-foreground'
                    )}>
                      {key.active ? 'نشط' : 'معطل'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[11px] text-muted-foreground font-mono" dir="ltr">
                      {showKeys[key.id] ? key.key : maskKey(key.key)}
                    </p>
                    <button onClick={() => toggleKeyVisibility(key.id)} className="p-1 rounded hover:bg-muted/50">
                      {showKeys[key.id] ? <EyeOff className="w-3 h-3 text-muted-foreground" /> : <Eye className="w-3 h-3 text-muted-foreground" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60">أُنشئ في: {key.created} • صلاحيات: {key.permissions.join(', ')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(key.key);
                  }}
                  className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Copy className="w-4 h-4 text-muted-foreground" />
                </button>
                <div
                  onClick={() => setKeys(prev => prev.map(k => k.id === key.id ? { ...k, active: !k.active } : k))}
                  className={cn('ios-toggle', key.active && 'active')}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
