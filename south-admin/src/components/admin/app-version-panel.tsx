'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Smartphone,
  Save,
  AlertTriangle,
  Globe,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AppVersionPanel() {
  const [androidVersion, setAndroidVersion] = useState('2.1.0');
  const [iosVersion, setIosVersion] = useState('2.1.0');
  const [forceUpdate, setForceUpdate] = useState(false);
  const [minVersion, setMinVersion] = useState('2.0.0');
  const [updateMessage, setUpdateMessage] = useState('يتوفر تحديث جديد! يرجى التحديث للحصول على أحدث الميزات.');
  const [updateUrl, setUpdateUrl] = useState('https://play.google.com/store/apps/details?id=com.southwallet');

  return (
    <div className="space-y-6 max-w-[800px] mx-auto">
      <div>
        <h1 className="ios-large-title text-foreground">إصدار التطبيق</h1>
        <p className="text-muted-foreground text-sm mt-1">إدارة إصدارات التطبيق وإعدادات التحديث</p>
      </div>

      {/* Current Version */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="ios-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-500/10">
              <Smartphone className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">إصدار أندرويد</p>
              <p className="text-lg font-bold text-foreground">{androidVersion}</p>
            </div>
          </div>
        </div>
        <div className="ios-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10">
              <Globe className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">إصدار iOS</p>
              <p className="text-lg font-bold text-foreground">{iosVersion}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Version Settings */}
      <div className="ios-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">إعدادات التحديث</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">إصدار أندرويد الحالي</label>
            <input
              type="text"
              value={androidVersion}
              onChange={(e) => setAndroidVersion(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-muted/30 border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              dir="ltr"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">إصدار iOS الحالي</label>
            <input
              type="text"
              value={iosVersion}
              onChange={(e) => setIosVersion(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-muted/30 border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              dir="ltr"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">الحد الأدنى للإصدار المسموح</label>
          <input
            type="text"
            value={minVersion}
            onChange={(e) => setMinVersion(e.target.value)}
            className="w-full h-11 px-4 rounded-xl bg-muted/30 border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            dir="ltr"
          />
          <p className="text-[10px] text-muted-foreground/60 mt-1">الإصدارات الأقدم سيتم منعها من الاستخدام</p>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
          <div>
            <p className="text-sm text-foreground">تحديث إجباري</p>
            <p className="text-[11px] text-muted-foreground">إجبار المستخدمين على التحديث قبل الاستخدام</p>
          </div>
          <div
            onClick={() => setForceUpdate(!forceUpdate)}
            className={cn('ios-toggle', forceUpdate && 'active')}
          />
        </div>

        {forceUpdate && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
            <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
            <span className="text-xs text-yellow-600 dark:text-yellow-400">سيتم منع المستخدمين بالإصدارات الأقدم من الاستخدام</span>
          </div>
        )}
      </div>

      {/* Update Message */}
      <div className="ios-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">رسالة التحديث</h3>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">رسالة تظهر للمستخدمين</label>
          <textarea
            value={updateMessage}
            onChange={(e) => setUpdateMessage(e.target.value)}
            className="w-full h-24 px-4 py-3 rounded-xl bg-muted/30 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-none"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">رابط التحديث</label>
          <input
            type="url"
            value={updateUrl}
            onChange={(e) => setUpdateUrl(e.target.value)}
            className="w-full h-11 px-4 rounded-xl bg-muted/30 border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            dir="ltr"
          />
        </div>
      </div>

      {/* Save */}
      <button className="w-full py-3 rounded-2xl bg-purple-500 text-white font-medium text-sm shadow-lg shadow-purple-500/25 active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
        <Save className="w-4 h-4" />
        حفظ الإعدادات
      </button>
    </div>
  );
}
