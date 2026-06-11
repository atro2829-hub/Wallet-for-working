'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Wrench,
  ToggleLeft,
  Save,
  AlertTriangle,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function MaintenancePanel() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('نحن نقوم بتحسين النظام. سنعود قريباً!');
  const [estimatedTime, setEstimatedTime] = useState('30 دقيقة');
  const [allowAdminAccess, setAllowAdminAccess] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');

  return (
    <div className="space-y-6 max-w-[800px] mx-auto">
      <div>
        <h1 className="ios-large-title text-foreground">وضع الصيانة</h1>
        <p className="text-muted-foreground text-sm mt-1">إدارة وضع صيانة التطبيق</p>
      </div>

      {/* Warning */}
      {maintenanceMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20"
        >
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-500">وضع الصيانة مفعّل</p>
            <p className="text-xs text-red-400">المستخدمون لن يتمكنوا من الوصول للتطبيق</p>
          </div>
        </motion.div>
      )}

      {/* Main Toggle */}
      <div className="ios-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2.5 rounded-xl', maintenanceMode ? 'bg-red-500/10' : 'bg-green-500/10')}>
              <Wrench className={cn('w-5 h-5', maintenanceMode ? 'text-red-500' : 'text-green-500')} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">وضع الصيانة</p>
              <p className="text-xs text-muted-foreground">{maintenanceMode ? 'التطبيق في وضع الصيانة' : 'التطبيق يعمل بشكل طبيعي'}</p>
            </div>
          </div>
          <div
            onClick={() => setMaintenanceMode(!maintenanceMode)}
            className={cn('ios-toggle', maintenanceMode && 'active')}
          />
        </div>
      </div>

      {/* Settings */}
      <div className="ios-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">إعدادات الصيانة</h3>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">رسالة الصيانة</label>
          <textarea
            value={maintenanceMessage}
            onChange={(e) => setMaintenanceMessage(e.target.value)}
            className="w-full h-24 px-4 py-3 rounded-xl bg-muted/30 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-none"
            placeholder="رسالة تظهر للمستخدمين أثناء الصيانة"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">الوقت المتوقع للعودة</label>
          <input
            type="text"
            value={estimatedTime}
            onChange={(e) => setEstimatedTime(e.target.value)}
            className="w-full h-11 px-4 rounded-xl bg-muted/30 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            placeholder="مثال: 30 دقيقة"
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">السماح بوصول المديرين</span>
          </div>
          <div
            onClick={() => setAllowAdminAccess(!allowAdminAccess)}
            className={cn('ios-toggle', allowAdminAccess && 'active')}
          />
        </div>
      </div>

      {/* Banner */}
      <div className="ios-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">بانر إعلاني مؤقت</h3>
          <div
            onClick={() => setShowBanner(!showBanner)}
            className={cn('ios-toggle', showBanner && 'active')}
          />
        </div>
        {showBanner && (
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">نص البانر</label>
            <input
              type="text"
              value={bannerMessage}
              onChange={(e) => setBannerMessage(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-muted/30 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              placeholder="رسالة تظهر في أعلى التطبيق"
            />
          </div>
        )}
      </div>

      {/* Save */}
      <button className="w-full py-3 rounded-2xl bg-purple-500 text-white font-medium text-sm shadow-lg shadow-purple-500/25 active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
        <Save className="w-4 h-4" />
        حفظ الإعدادات
      </button>
    </div>
  );
}
