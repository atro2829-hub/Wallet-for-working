'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  ScanEye,
  Plus,
  Shield,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Edit,
} from 'lucide-react';
import { motion } from 'framer-motion';

const defaultRules = [
  { id: 1, name: 'حد الإيداع اليومي', description: 'تنبيه عند تجاوز 500,000 ر.ي يومياً', active: true, severity: 'high' },
  { id: 2, name: 'السحب المتكرر', description: 'حظر بعد 5 محاولات سحب فاشلة', active: true, severity: 'high' },
  { id: 3, name: 'تسجيل من IP جديد', description: 'تنبيه عند تسجيل الدخول من موقع جديد', active: false, severity: 'medium' },
  { id: 4, name: 'تحويلات متعددة', description: 'تنبيه عند أكثر من 10 تحويلات في ساعة', active: true, severity: 'high' },
  { id: 5, name: 'تغيير بيانات الحساب', description: 'تنبيه عند تغيير البريد أو كلمة المرور', active: true, severity: 'medium' },
  { id: 6, name: 'رصيد سلبي', description: 'منع المعاملات التي تؤدي لرصيد سالب', active: true, severity: 'critical' },
  { id: 7, name: 'نشاط من بلد مختلف', description: 'تنبيه عند الدخول من بلد مختلف عن المعتاد', active: false, severity: 'low' },
  { id: 8, name: 'محاولات تسجيل متعددة', description: 'حظر مؤقت بعد 5 محاولات فاشلة', active: true, severity: 'high' },
];

export default function FraudRulesPanel() {
  const [rules, setRules] = useState(defaultRules);

  const toggleRule = (id: number) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const activeCount = rules.filter(r => r.active).length;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="ios-large-title text-foreground">قواعد كشف الاحتيال</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة قواعد الحماية والكشف عن الاحتيال</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{activeCount}/{rules.length} نشطة</span>
          <button className="px-4 py-2.5 rounded-xl bg-purple-500 text-white text-sm font-medium flex items-center gap-2 shadow-lg shadow-purple-500/25 active:scale-[0.98] transition-transform">
            <Plus className="w-4 h-4" />
            قاعدة جديدة
          </button>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-2">
        {rules.map((rule, i) => (
          <motion.div
            key={rule.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="ios-card p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={cn(
                  'p-2 rounded-xl shrink-0',
                  rule.active ? 'bg-green-500/10' : 'bg-muted/30'
                )}>
                  <ScanEye className={cn(
                    'w-4 h-4',
                    rule.active ? 'text-green-500' : 'text-muted-foreground'
                  )} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{rule.name}</p>
                    <span className={cn(
                      'px-1.5 py-0.5 rounded text-[9px] font-bold',
                      rule.severity === 'critical' ? 'bg-red-500/15 text-red-500' :
                      rule.severity === 'high' ? 'bg-orange-500/15 text-orange-500' :
                      rule.severity === 'medium' ? 'bg-yellow-500/15 text-yellow-500' :
                      'bg-blue-500/15 text-blue-500'
                    )}>
                      {rule.severity === 'critical' ? 'حرج' :
                       rule.severity === 'high' ? 'عالي' :
                       rule.severity === 'medium' ? 'متوسط' : 'منخفض'}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{rule.description}</p>
                </div>
              </div>
              <div
                onClick={() => toggleRule(rule.id)}
                className={cn('ios-toggle shrink-0', rule.active && 'active')}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
