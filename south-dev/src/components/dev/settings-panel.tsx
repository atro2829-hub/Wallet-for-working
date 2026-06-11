'use client';

import { useState, useEffect } from 'react';
import { useDevStore, DevSettings } from '@/lib/store';
import { database } from '@/lib/firebase';
import { ref, set, get, update } from 'firebase/database';
import { motion } from 'framer-motion';
import {
  Settings, Github, TestTube, CheckCircle, XCircle,
  Loader2, Save, Link, Package, Calendar, Mail,
  Clock, Shield, Database
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPanel() {
  const { devSettings, setDevSettings } = useDevStore();
  const [localSettings, setLocalSettings] = useState<DevSettings>({ ...devSettings });
  const [saving, setSaving] = useState(false);
  const [testingGithub, setTestingGithub] = useState(false);
  const [testingRepo, setTestingRepo] = useState(false);
  const [githubTestResult, setGithubTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [repoTestResult, setRepoTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Load settings from Firebase on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsRef = ref(database, 'devSettings');
        const snapshot = await get(settingsRef);
        const data = snapshot.val() || {};

        const loaded: DevSettings = {
          githubToken: data.githubToken || '',
          githubOwner: data.githubOwner || '',
          githubRepo: data.githubRepo || 'working',
          defaultPackagePrefix: data.defaultPackagePrefix || 'com.qtbm',
          defaultSubscriptionMonths: data.defaultSubscriptionMonths || 12,
          defaultSupportMonths: data.defaultSupportMonths || 3,
          notificationEmail: data.notificationEmail || '',
          autoBackup: data.autoBackup || false,
          buildTimeout: data.buildTimeout || 30,
        };

        setLocalSettings(loaded);
        setDevSettings(loaded);
      } catch (error) {
        console.error('Load settings error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await update(ref(database, 'devSettings'), {
        githubToken: localSettings.githubToken,
        githubOwner: localSettings.githubOwner,
        githubRepo: localSettings.githubRepo || 'working',
        defaultPackagePrefix: localSettings.defaultPackagePrefix || 'com.qtbm',
        defaultSubscriptionMonths: localSettings.defaultSubscriptionMonths || 12,
        defaultSupportMonths: localSettings.defaultSupportMonths || 3,
        notificationEmail: localSettings.notificationEmail || '',
        autoBackup: localSettings.autoBackup || false,
        buildTimeout: localSettings.buildTimeout || 30,
      });
      setDevSettings(localSettings);
    } catch (error) {
      console.error('Save settings error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleTestGithub = async () => {
    if (!localSettings.githubToken) {
      setGithubTestResult({ success: false, message: 'يجب إدخال رمز GitHub أولاً' });
      return;
    }
    setTestingGithub(true);
    setGithubTestResult(null);

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${localSettings.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGithubTestResult({
          success: true,
          message: `تم الاتصال بنجاح كـ: ${data.login || data.name || 'مستخدم GitHub'}`,
        });

        // Auto-fill owner if empty
        if (!localSettings.githubOwner && data.login) {
          setLocalSettings(prev => ({ ...prev, githubOwner: data.login }));
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setGithubTestResult({
          success: false,
          message: `فشل الاتصال: ${errorData.message || 'رمز غير صالح'}`,
        });
      }
    } catch (error: any) {
      setGithubTestResult({
        success: false,
        message: `خطأ في الاتصال: ${error.message || 'خطأ غير معروف'}`,
      });
    } finally {
      setTestingGithub(false);
    }
  };

  const handleTestRepo = async () => {
    if (!localSettings.githubToken || !localSettings.githubOwner || !localSettings.githubRepo) {
      setRepoTestResult({ success: false, message: 'يجب ملء جميع حقول GitHub أولاً' });
      return;
    }
    setTestingRepo(true);
    setRepoTestResult(null);

    try {
      const response = await fetch(
        `https://api.github.com/repos/${localSettings.githubOwner}/${localSettings.githubRepo}`,
        {
          headers: {
            'Authorization': `Bearer ${localSettings.githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRepoTestResult({
          success: true,
          message: `المستودع موجود: ${data.full_name} (${data.private ? 'خاص' : 'عام'})`,
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setRepoTestResult({
          success: false,
          message: `المستودع غير قابل للوصول: ${errorData.message || 'غير موجود'}`,
        });
      }
    } catch (error: any) {
      setRepoTestResult({
        success: false,
        message: `خطأ في الاتصال: ${error.message || 'خطأ غير معروف'}`,
      });
    } finally {
      setTestingRepo(false);
    }
  };

  const inputClass = "w-full h-11 px-4 rounded-xl bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/30 transition-all text-sm";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1 px-1";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="ios-large-title text-foreground">الإعدادات</h1>
        <p className="text-muted-foreground text-sm mt-1">تكوين إعدادات المطور و GitHub</p>
      </div>

      {/* GitHub Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="ios-card p-5"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gray-500/10 flex items-center justify-center">
            <Github className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">إعدادات GitHub</h3>
            <p className="text-xs text-muted-foreground">تكوين الاتصال بـ GitHub Actions</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>رمز الوصول الشخصي (Token)</label>
            <input
              type="password"
              className={inputClass}
              value={localSettings.githubToken}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, githubToken: e.target.value }))}
              placeholder="ghp_xxxxxxxxxxxx"
              dir="ltr"
            />
          </div>

          <div>
            <label className={labelClass}>اسم المستخدم / المنظمة</label>
            <input
              className={inputClass}
              value={localSettings.githubOwner}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, githubOwner: e.target.value }))}
              placeholder="github-username"
              dir="ltr"
            />
          </div>

          <div>
            <label className={labelClass}>اسم المستودع</label>
            <input
              className={inputClass}
              value={localSettings.githubRepo}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, githubRepo: e.target.value }))}
              placeholder="working"
              dir="ltr"
            />
            <p className="text-[10px] text-muted-foreground mt-1 px-1">الافتراضي: working</p>
          </div>

          {/* Test Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleTestGithub}
              disabled={testingGithub || !localSettings.githubToken}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-500/10 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-500/20 transition-colors disabled:opacity-50"
            >
              {testingGithub ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
              اختبار اتصال GitHub
            </button>
            <button
              onClick={handleTestRepo}
              disabled={testingRepo || !localSettings.githubToken || !localSettings.githubOwner || !localSettings.githubRepo}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-colors disabled:opacity-50"
            >
              {testingRepo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
              اختبار اتصال المستودع
            </button>
          </div>

          {/* Test Results */}
          {githubTestResult && (
            <div className={cn(
              'flex items-center gap-2 p-3 rounded-xl text-sm',
              githubTestResult.success ? 'bg-green-500/5 border border-green-500/15 text-green-600 dark:text-green-400' : 'bg-red-500/5 border border-red-500/15 text-red-600 dark:text-red-400'
            )}>
              {githubTestResult.success ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
              {githubTestResult.message}
            </div>
          )}

          {repoTestResult && (
            <div className={cn(
              'flex items-center gap-2 p-3 rounded-xl text-sm',
              repoTestResult.success ? 'bg-green-500/5 border border-green-500/15 text-green-600 dark:text-green-400' : 'bg-red-500/5 border border-red-500/15 text-red-600 dark:text-red-400'
            )}>
              {repoTestResult.success ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
              {repoTestResult.message}
            </div>
          )}
        </div>
      </motion.div>

      {/* Default Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="ios-card p-5"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">الإعدادات الافتراضية</h3>
            <p className="text-xs text-muted-foreground">قيم افتراضية للنسخ الجديدة</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>بادئة الحزمة الافتراضية</label>
            <input
              className={inputClass}
              value={localSettings.defaultPackagePrefix}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, defaultPackagePrefix: e.target.value }))}
              placeholder="com.qtbm"
              dir="ltr"
            />
            <p className="text-[10px] text-muted-foreground mt-1 px-1">تُستخدم كبادئة لأسماء حزم التطبيقات</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>أشهر الاشتراك الافتراضية</label>
              <input
                type="number"
                className={inputClass}
                value={localSettings.defaultSubscriptionMonths}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, defaultSubscriptionMonths: Number(e.target.value) }))}
                placeholder="12"
                dir="ltr"
                min={1}
              />
            </div>
            <div>
              <label className={labelClass}>أشهر الدعم الافتراضية</label>
              <input
                type="number"
                className={inputClass}
                value={localSettings.defaultSupportMonths}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, defaultSupportMonths: Number(e.target.value) }))}
                placeholder="3"
                dir="ltr"
                min={1}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Notification & Backup Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="ios-card p-5"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">الإشعارات والنسخ الاحتياطي</h3>
            <p className="text-xs text-muted-foreground">إعدادات الإشعارات والنسخ الاحتياطي التلقائي</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>بريد الإشعارات</label>
            <input
              type="email"
              className={inputClass}
              value={localSettings.notificationEmail}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, notificationEmail: e.target.value }))}
              placeholder="admin@example.com"
              dir="ltr"
            />
            <p className="text-[10px] text-muted-foreground mt-1 px-1">يُستخدم لإرسال إشعارات النظام</p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20">
            <div>
              <p className="text-sm font-medium text-foreground">نسخ احتياطي تلقائي</p>
              <p className="text-xs text-muted-foreground mt-0.5">إنشاء نسخة احتياطية تلقائية للبيانات</p>
            </div>
            <button
              onClick={() => setLocalSettings(prev => ({ ...prev, autoBackup: !prev.autoBackup }))}
              className={cn(
                'w-12 h-7 rounded-full relative transition-colors duration-300',
                localSettings.autoBackup ? 'bg-green-500' : 'bg-muted-foreground/30'
              )}
            >
              <div className={cn(
                'absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-300',
                localSettings.autoBackup ? 'translate-x-5' : 'translate-x-0.5'
              )} />
            </button>
          </div>

          <div>
            <label className={labelClass}>مهلة البناء (بالدقائق)</label>
            <input
              type="number"
              className={inputClass}
              value={localSettings.buildTimeout}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, buildTimeout: Number(e.target.value) }))}
              placeholder="30"
              dir="ltr"
              min={5}
              max={120}
            />
            <p className="text-[10px] text-muted-foreground mt-1 px-1">الحد الأقصى لانتظار اكتمال عملية البناء</p>
          </div>
        </div>
      </motion.div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-12 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/30 text-white font-semibold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 active:scale-[0.98]"
      >
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
      </button>

      {/* Info */}
      <div className="ios-card p-5">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-gray-500" /> معلومات
        </h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• رمز GitHub يحتاج صلاحية <code className="bg-muted/50 px-1 rounded text-xs">repo</code> للوصول للمستودعات</p>
          <p>• يستخدم هذا الرمز لإطلاق عمليات البناء عبر GitHub Actions</p>
          <p>• يتم تخزين الإعدادات بشكل مشفر في Firebase</p>
          <p>• المستودع الافتراضي هو <code className="bg-muted/50 px-1 rounded text-xs">working</code></p>
          <p>• بادئة الحزمة الافتراضية تُطبق على جميع النسخ الجديدة</p>
          <p>• النسخ الاحتياطي التلقائي يعمل يومياً عند التفعيل</p>
        </div>
      </div>
    </div>
  );
}
