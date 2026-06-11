'use client';

import { useState, useEffect } from 'react';
import { ref, set, push, onValue, get, update, remove } from 'firebase/database';
import { storage, database } from '@/lib/firebase';
import { useAdminStore } from '@/lib/store';
import { uploadBytes, getDownloadURL, ref as storageRef } from 'firebase/storage';
import {
  Store, Plus, Smartphone, Tablet, Download, Trash2, RefreshCw,
  Eye, Copy, CheckCircle, XCircle, Clock, Settings, Palette,
  Upload, Globe, ChevronDown, ChevronUp, ExternalLink,
  Package, Shield, Zap, AlertTriangle, Check, Loader2, FileCode,
  Building2, Mail, Link2, Tag, Rocket, Info, Key, Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ───────────────────────────────────────────────────
interface AppInstance {
  id: string;
  // Branding
  appName: string;
  appLogoUrl: string;
  appTransparentIconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  // Firebase Config
  googleServicesJson: string;
  firebaseApiKey: string;
  firebaseProjectId: string;
  firebaseDatabaseUrl: string;
  firebaseStorageBucket: string;
  firebaseMessagingSenderId: string;
  firebaseAppId: string;
  firebaseAdminSdk: string;
  // App identity
  userAppPackageName: string;
  adminAppPackageName: string;
  // Contact & Social
  contactEmail: string;
  supportPhone: string;
  socialLinks: {
    telegram?: string;
    whatsapp?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  // Build status
  userAppBuildStatus: 'none' | 'queued' | 'building' | 'success' | 'failed';
  adminAppBuildStatus: 'none' | 'queued' | 'building' | 'success' | 'failed';
  userAppApkUrl: string;
  adminAppApkUrl: string;
  userAppBuildLog: string;
  adminAppBuildLog: string;
  userAppBuildAt: string;
  adminAppBuildAt: string;
  // GitHub
  githubRunId: string;
  // Metadata
  clientName: string;
  clientEmail: string;
  notes: string;
  price: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  version: string;
}

const defaultAppInstance: Omit<AppInstance, 'id'> = {
  appName: '',
  appLogoUrl: '',
  appTransparentIconUrl: '',
  primaryColor: '#6C3CE1',
  secondaryColor: '#FF9800',
  googleServicesJson: '',
  firebaseApiKey: '',
  firebaseProjectId: '',
  firebaseDatabaseUrl: '',
  firebaseStorageBucket: '',
  firebaseMessagingSenderId: '',
  firebaseAppId: '',
  firebaseAdminSdk: '',
  userAppPackageName: 'com.example.wallet',
  adminAppPackageName: 'com.example.wallet.admin',
  contactEmail: '',
  supportPhone: '',
  socialLinks: {},
  userAppBuildStatus: 'none',
  adminAppBuildStatus: 'none',
  userAppApkUrl: '',
  adminAppApkUrl: '',
  userAppBuildLog: '',
  adminAppBuildLog: '',
  userAppBuildAt: '',
  adminAppBuildAt: '',
  githubRunId: '',
  clientName: '',
  clientEmail: '',
  notes: '',
  price: 0,
  currency: 'YER',
  isActive: true,
  createdAt: '',
  updatedAt: '',
  version: '1.0.0',
};

const GITHUB_REPO = 'atro2829-hub/Wallet-for-working';

// GitHub token is stored in Firebase adminSettings/githubToken for security
async function getGithubToken(): Promise<string> {
  try {
    const snapshot = await get(ref(database, 'adminSettings/githubToken'));
    return snapshot.val() || '';
  } catch {
    return '';
  }
}

// ─── Component ───────────────────────────────────────────────
export default function AppStorePanel() {
  const { adminUser } = useAdminStore();
  const [instances, setInstances] = useState<AppInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<AppInstance, 'id'>>(defaultAppInstance);
  const [saving, setSaving] = useState(false);
  const [building, setBuilding] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [transparentIconUploading, setTransparentIconUploading] = useState(false);
  const [jsonUploading, setJsonUploading] = useState(false);
  const [sdkUploading, setSdkUploading] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'branding' | 'firebase' | 'identity' | 'social' | 'client'>('branding');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Listen to instances
  useEffect(() => {
    const instRef = ref(database, 'appInstances');
    const unsub = onValue(instRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val } as AppInstance));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setInstances(list);
      } else {
        setInstances([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type });

  // ─── File Upload Handlers ────────────────────────────────
  const handleLogoUpload = async (file: File) => {
    setLogoUploading(true);
    try {
      const sRef = storageRef(storage, `app-store/logos/${Date.now()}_${file.name}`);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      setFormData(prev => ({ ...prev, appLogoUrl: url }));
      showToast('تم رفع شعار التطبيق بنجاح');
    } catch (e: any) {
      showToast('فشل رفع الشعار: ' + e.message, 'error');
    }
    setLogoUploading(false);
  };

  const handleTransparentIconUpload = async (file: File) => {
    setTransparentIconUploading(true);
    try {
      const sRef = storageRef(storage, `app-store/transparent-icons/${Date.now()}_${file.name}`);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      setFormData(prev => ({ ...prev, appTransparentIconUrl: url }));
      showToast('تم رفع الأيقونة الشفافة بنجاح');
    } catch (e: any) {
      showToast('فشل رفع الأيقونة: ' + e.message, 'error');
    }
    setTransparentIconUploading(false);
  };

  const handleGoogleServicesUpload = async (file: File) => {
    setJsonUploading(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const appClient = parsed.client?.[0];
      const appInfo = appClient?.client_info;
      const apiKey = appClient?.api_key?.[0]?.current_key || '';

      setFormData(prev => ({
        ...prev,
        googleServicesJson: text,
        firebaseProjectId: parsed.project_info?.project_id || prev.firebaseProjectId,
        firebaseDatabaseUrl: parsed.project_info?.firebase_url || prev.firebaseDatabaseUrl,
        firebaseStorageBucket: parsed.project_info?.storage_bucket || prev.firebaseStorageBucket,
        firebaseMessagingSenderId: String(appInfo?.mobilesdk_app_id?.split(':')[1]?.split('#')[0] || prev.firebaseMessagingSenderId),
        firebaseAppId: appInfo?.mobilesdk_app_id || prev.firebaseAppId,
        firebaseApiKey: apiKey || prev.firebaseApiKey,
      }));
      showToast('تم تحميل ملف google-services.json بنجاح');
    } catch (e: any) {
      showToast('ملف غير صالح: ' + e.message, 'error');
    }
    setJsonUploading(false);
  };

  const handleAdminSdkUpload = async (file: File) => {
    setSdkUploading(true);
    try {
      const text = await file.text();
      JSON.parse(text);
      setFormData(prev => ({ ...prev, firebaseAdminSdk: text }));
      showToast('تم تحميل ملف Firebase Admin SDK بنجاح');
    } catch (e: any) {
      showToast('ملف غير صالح: ' + e.message, 'error');
    }
    setSdkUploading(false);
  };

  // ─── Save Instance ─────────────────────────────────────
  const handleSave = async () => {
    if (!formData.appName || !formData.userAppPackageName) {
      showToast('الرجاء تعبئة الحقول المطلوبة (اسم التطبيق واسم الحزمة)', 'error');
      return;
    }
    // Validate package name format
    if (!/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/.test(formData.userAppPackageName)) {
      showToast('اسم حزمة التطبيق غير صالح. مثال: com.example.wallet', 'error');
      return;
    }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const instanceData = { ...formData, updatedAt: now };

      if (editingId) {
        await update(ref(database, `appInstances/${editingId}`), instanceData);
        showToast('تم تحديث النسخة بنجاح');
      } else {
        instanceData.createdAt = now;
        const newRef = push(ref(database, 'appInstances'));
        await set(newRef, { ...instanceData, id: newRef.key });
        showToast('تم إنشاء النسخة بنجاح');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(defaultAppInstance);
    } catch (e: any) {
      showToast('فشل الحفظ: ' + e.message, 'error');
    }
    setSaving(false);
  };

  // ─── Delete Instance ───────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه النسخة؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    try {
      await remove(ref(database, `appInstances/${id}`));
      showToast('تم حذف النسخة');
    } catch (e: any) {
      showToast('فشل الحذف: ' + e.message, 'error');
    }
  };

  // ─── Trigger GitHub Actions Build ──────────────────────
  const triggerBuild = async (instance: AppInstance, appType: 'user' | 'admin' | 'both') => {
    setBuilding(instance.id);
    try {
      const githubToken = await getGithubToken();
      if (!githubToken) {
        throw new Error('لم يتم تعيين توكن GitHub. أضفه من الإعدادات العامة.');
      }

      // Update status to queued
      const statusUpdate: any = {};
      if (appType === 'user' || appType === 'both') {
        statusUpdate.userAppBuildStatus = 'queued';
        statusUpdate.userAppBuildLog = 'تم إرسال طلب البناء...';
      }
      if (appType === 'admin' || appType === 'both') {
        statusUpdate.adminAppBuildStatus = 'queued';
        statusUpdate.adminAppBuildLog = 'تم إرسال طلب البناء...';
      }
      await update(ref(database, `appInstances/${instance.id}`), statusUpdate);

      // Trigger GitHub Actions via repository_dispatch
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/dispatches`,
        {
          method: 'POST',
          headers: {
            Authorization: `token ${githubToken}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_type: 'build-custom-app',
            client_payload: {
              instanceId: instance.id,
              appType: appType,
              appName: instance.appName,
              appLogoUrl: instance.appLogoUrl,
              appTransparentIconUrl: instance.appTransparentIconUrl || '',
              primaryColor: instance.primaryColor,
              secondaryColor: instance.secondaryColor,
              userAppPackageName: instance.userAppPackageName,
              adminAppPackageName: instance.adminAppPackageName,
              googleServicesJson: instance.googleServicesJson,
              firebaseApiKey: instance.firebaseApiKey,
              firebaseProjectId: instance.firebaseProjectId,
              firebaseDatabaseUrl: instance.firebaseDatabaseUrl,
              firebaseStorageBucket: instance.firebaseStorageBucket,
              firebaseMessagingSenderId: instance.firebaseMessagingSenderId,
              firebaseAppId: instance.firebaseAppId,
              firebaseAdminSdk: instance.firebaseAdminSdk,
              contactEmail: instance.contactEmail,
              supportPhone: instance.supportPhone,
              socialLinks: JSON.stringify(instance.socialLinks),
              version: instance.version,
            },
          }),
        }
      );

      if (response.status === 204) {
        showToast('تم إرسال طلب البناء بنجاح! سيبدأ البناء تلقائياً');
        // Poll for build status - pass the token
        pollBuildStatus(instance.id, githubToken);
      } else {
        const errData = await response.json().catch(() => ({ message: 'فشل إرسال طلب البناء' }));
        throw new Error(errData.message || 'فشل إرسال طلب البناء');
      }
    } catch (e: any) {
      showToast('فشل البناء: ' + e.message, 'error');
      // Reset status
      try {
        const resetUpdate: any = {};
        if (appType === 'user' || appType === 'both') {
          resetUpdate.userAppBuildStatus = 'failed';
          resetUpdate.userAppBuildLog = 'فشل: ' + e.message;
        }
        if (appType === 'admin' || appType === 'both') {
          resetUpdate.adminAppBuildStatus = 'failed';
          resetUpdate.adminAppBuildLog = 'فشل: ' + e.message;
        }
        await update(ref(database, `appInstances/${instance.id}`), resetUpdate);
      } catch {}
    }
    setBuilding(null);
  };

  // ─── Poll Build Status ─────────────────────────────────
  const pollBuildStatus = async (instanceId: string, token: string) => {
    let attempts = 0;
    const maxAttempts = 120;

    const poll = async () => {
      attempts++;
      try {
        const runsRes = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/actions/runs?per_page=5&event=repository_dispatch`,
          {
            headers: {
              Authorization: `token ${token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        );
        const runsData = await runsRes.json();
        const latestRun = runsData.workflow_runs?.find(
          (r: any) => r.status === 'in_progress' || r.status === 'queued' || r.status === 'completed'
        );

        if (latestRun) {
          const status = latestRun.status;
          const conclusion = latestRun.conclusion;

          await update(ref(database, `appInstances/${instanceId}`), {
            githubRunId: String(latestRun.id),
          });

          if (status === 'completed') {
            const buildResult = conclusion === 'success' ? 'success' : 'failed';
            const updateData: any = {
              userAppBuildAt: new Date().toISOString(),
              adminAppBuildAt: new Date().toISOString(),
            };

            if (buildResult === 'success') {
              updateData.userAppBuildStatus = 'success';
              updateData.adminAppBuildStatus = 'success';
              updateData.userAppBuildLog = `تم البناء بنجاح - Run #${latestRun.run_number}`;
              updateData.adminAppBuildLog = `تم البناء بنجاح - Run #${latestRun.run_number}`;
              updateData.userAppApkUrl = latestRun.html_url;
              updateData.adminAppApkUrl = latestRun.html_url;
            } else {
              updateData.userAppBuildStatus = 'failed';
              updateData.adminAppBuildStatus = 'failed';
              updateData.userAppBuildLog = `فشل البناء - Run #${latestRun.run_number}`;
              updateData.adminAppBuildLog = `فشل البناء - Run #${latestRun.run_number}`;
            }

            await update(ref(database, `appInstances/${instanceId}`), updateData);
            return;
          }

          if (status === 'in_progress' || status === 'queued') {
            await update(ref(database, `appInstances/${instanceId}`), {
              userAppBuildStatus: 'building',
              adminAppBuildStatus: 'building',
              userAppBuildLog: `جاري البناء... (محاولة ${attempts})`,
              adminAppBuildLog: `جاري البناء... (محاولة ${attempts})`,
            });
          }
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        }
      } catch (e) {
        console.error('Poll error:', e);
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        }
      }
    };

    setTimeout(poll, 15000);
  };

  // ─── Edit Instance ─────────────────────────────────────
  const handleEdit = (instance: AppInstance) => {
    setFormData({ ...instance, appTransparentIconUrl: instance.appTransparentIconUrl || '' });
    setEditingId(instance.id);
    setShowForm(true);
    setActiveTab('branding');
  };

  // ─── Status Badge ──────────────────────────────────────
  const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { icon: React.ElementType; color: string; label: string }> = {
      none: { icon: Clock, color: 'text-gray-400 bg-gray-100 dark:bg-gray-800', label: 'لم يُبنَ' },
      queued: { icon: Clock, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20', label: 'في الانتظار' },
      building: { icon: Loader2, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', label: 'جاري البناء' },
      success: { icon: CheckCircle, color: 'text-green-600 bg-green-50 dark:bg-green-900/20', label: 'مكتمل' },
      failed: { icon: XCircle, color: 'text-red-600 bg-red-50 dark:bg-red-900/20', label: 'فشل' },
    };
    const c = config[status] || config.none;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.color}`}>
        <Icon className={`w-3 h-3 ${status === 'building' ? 'animate-spin' : ''}`} />
        {c.label}
      </span>
    );
  };

  // ─── Form Tabs ─────────────────────────────────────────
  const formTabs = [
    { id: 'branding' as const, label: 'الهوية', icon: Palette },
    { id: 'firebase' as const, label: 'Firebase', icon: Shield },
    { id: 'identity' as const, label: 'الحزمة', icon: Package },
    { id: 'social' as const, label: 'التواصل', icon: Link2 },
    { id: 'client' as const, label: 'العميل', icon: Building2 },
  ];

  const inputClass = "w-full px-3 py-2.5 rounded-xl text-sm border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all";
  const labelClass = "block text-xs font-semibold text-muted-foreground mb-1.5";

  // ─── Render ────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-2xl shadow-xl text-sm font-medium flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {toast.type === 'success' ? <Check className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">متجر النسخ</h2>
            <p className="text-xs text-muted-foreground">بيع نسخ مخصصة من التطبيق تلقائياً</p>
          </div>
        </div>
        <button
          onClick={() => {
            setFormData(defaultAppInstance);
            setEditingId(null);
            setShowForm(true);
            setActiveTab('branding');
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-purple-500/20 hover:shadow-xl transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          نسخة جديدة
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'إجمالي النسخ', value: instances.length, icon: Store, color: 'from-purple-500 to-purple-700' },
          { label: 'نشطة', value: instances.filter(i => i.isActive).length, icon: CheckCircle, color: 'from-green-500 to-green-700' },
          { label: 'تم البناء', value: instances.filter(i => i.userAppBuildStatus === 'success').length, icon: Download, color: 'from-blue-500 to-blue-700' },
          { label: 'في الانتظار', value: instances.filter(i => ['queued', 'building'].includes(i.userAppBuildStatus)).length, icon: Clock, color: 'from-yellow-500 to-yellow-700' },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl p-3 border border-border/30 bg-card">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-2`}>
              <stat.icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      )}

      {/* Instances List */}
      {!loading && !showForm && (
        <div className="space-y-3">
          {instances.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                <Store className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-muted-foreground text-sm">لا توجد نسخ بعد</p>
              <p className="text-muted-foreground/60 text-xs mt-1">اضغط &quot;نسخة جديدة&quot; لبدء البيع</p>
            </div>
          ) : (
            instances.map((instance) => (
              <motion.div
                key={instance.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border/30 bg-card overflow-hidden"
              >
                {/* Card Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => setExpandedCard(expandedCard === instance.id ? null : instance.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center overflow-hidden shrink-0"
                        style={{ background: instance.primaryColor || '#6C3CE1' }}
                      >
                        {instance.appLogoUrl ? (
                          <img src={instance.appLogoUrl} alt="" className="w-7 h-7 object-contain" />
                        ) : (
                          <Smartphone className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{instance.appName || 'بدون اسم'}</h3>
                        <p className="text-[10px] text-muted-foreground font-mono">{instance.userAppPackageName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={instance.userAppBuildStatus} />
                      {expandedCard === instance.id ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Expanded Content */}
                <AnimatePresence>
                  {expandedCard === instance.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3 border-t border-border/20 pt-3">
                        {/* Build Status Cards */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-xl p-3 border border-border/20 bg-muted/10">
                            <div className="flex items-center gap-2 mb-2">
                              <Smartphone className="w-4 h-4 text-purple-500" />
                              <span className="text-xs font-semibold">تطبيق المستخدم</span>
                            </div>
                            <StatusBadge status={instance.userAppBuildStatus} />
                            {instance.userAppBuildLog && (
                              <p className="text-[10px] text-muted-foreground mt-2 line-clamp-2">{instance.userAppBuildLog}</p>
                            )}
                            {instance.userAppBuildAt && (
                              <p className="text-[9px] text-muted-foreground/50 mt-1">
                                {new Date(instance.userAppBuildAt).toLocaleString('ar')}
                              </p>
                            )}
                          </div>
                          <div className="rounded-xl p-3 border border-border/20 bg-muted/10">
                            <div className="flex items-center gap-2 mb-2">
                              <Tablet className="w-4 h-4 text-indigo-500" />
                              <span className="text-xs font-semibold">تطبيق الأدمن</span>
                            </div>
                            <StatusBadge status={instance.adminAppBuildStatus} />
                            {instance.adminAppBuildLog && (
                              <p className="text-[10px] text-muted-foreground mt-2 line-clamp-2">{instance.adminAppBuildLog}</p>
                            )}
                            {instance.adminAppBuildAt && (
                              <p className="text-[9px] text-muted-foreground/50 mt-1">
                                {new Date(instance.adminAppBuildAt).toLocaleString('ar')}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Instance Info */}
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Building2 className="w-3 h-3" />
                            <span>العميل: {instance.clientName || '—'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            <span>{instance.clientEmail || '—'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Tag className="w-3 h-3" />
                            <span>السعر: {instance.price} {instance.currency}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Globe className="w-3 h-3" />
                            <span>{instance.firebaseProjectId || '—'}</span>
                          </div>
                        </div>

                        {/* GitHub Run Link */}
                        {instance.githubRunId && (
                          <a
                            href={`https://github.com/${GITHUB_REPO}/actions/runs/${instance.githubRunId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-[10px] text-blue-500 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            عرض البناء في GitHub
                          </a>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); triggerBuild(instance, 'both'); }}
                            disabled={building === instance.id || ['queued', 'building'].includes(instance.userAppBuildStatus)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl text-[11px] font-semibold disabled:opacity-50 active:scale-[0.98] transition-all"
                          >
                            {building === instance.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Rocket className="w-3.5 h-3.5" />
                            )}
                            بناء التطبيقين
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); triggerBuild(instance, 'user'); }}
                            disabled={building === instance.id || ['queued', 'building'].includes(instance.userAppBuildStatus)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white rounded-xl text-[11px] font-semibold disabled:opacity-50 active:scale-[0.98] transition-all"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                            مستخدم فقط
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); triggerBuild(instance, 'admin'); }}
                            disabled={building === instance.id || ['queued', 'building'].includes(instance.adminAppBuildStatus)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500 text-white rounded-xl text-[11px] font-semibold disabled:opacity-50 active:scale-[0.98] transition-all"
                          >
                            <Tablet className="w-3.5 h-3.5" />
                            أدمن فقط
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(instance); }}
                            className="flex items-center gap-1.5 px-3 py-2 border border-border/50 rounded-xl text-[11px] font-semibold text-muted-foreground hover:text-foreground active:scale-[0.98] transition-all"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            تعديل
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(instance.id); }}
                            className="flex items-center gap-1.5 px-3 py-2 border border-red-500/30 rounded-xl text-[11px] font-semibold text-red-500 hover:bg-red-500/10 active:scale-[0.98] transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            حذف
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* ─── New/Edit Form ───────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="rounded-2xl border border-border/30 bg-card overflow-hidden"
          >
            {/* Form Header */}
            <div className="p-4 border-b border-border/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">{editingId ? 'تعديل النسخة' : 'إنشاء نسخة جديدة'}</h3>
                  <p className="text-[10px] text-muted-foreground">أدخل بيانات التطبيق المخصص</p>
                </div>
              </div>
              <button
                onClick={() => { setShowForm(false); setEditingId(null); setFormData(defaultAppInstance); }}
                className="p-2 rounded-xl hover:bg-muted/50 text-muted-foreground"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Form Tabs */}
            <div className="flex gap-1 p-3 overflow-x-auto">
              {formTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                      : 'text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Form Content */}
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Branding Tab */}
              {activeTab === 'branding' && (
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>اسم التطبيق *</label>
                    <input
                      type="text"
                      value={formData.appName}
                      onChange={e => setFormData(prev => ({ ...prev, appName: e.target.value }))}
                      className={inputClass}
                      placeholder="مثال: محفظة النور"
                      dir="rtl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>اللون الرئيسي</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.primaryColor}
                          onChange={e => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                          className="w-10 h-10 rounded-xl border-0 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.primaryColor}
                          onChange={e => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                          className={inputClass}
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>اللون الثانوي</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.secondaryColor}
                          onChange={e => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                          className="w-10 h-10 rounded-xl border-0 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.secondaryColor}
                          onChange={e => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                          className={inputClass}
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  {/* App Logo */}
                  <div>
                    <label className={labelClass}>شعار التطبيق</label>
                    <p className="text-[10px] text-muted-foreground mb-2">يُستخدم كأيقونة التطبيق في الهاتف وعند البناء يتم توزيعها لجميع الأحجام</p>
                    <div className="flex items-center gap-3">
                      {formData.appLogoUrl && (
                        <img src={formData.appLogoUrl} alt="Logo" className="w-12 h-12 rounded-xl object-contain border border-border/20" />
                      )}
                      <label className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-border/50 rounded-xl cursor-pointer hover:bg-muted/20 transition-colors">
                        {logoUploading ? <Loader2 className="w-4 h-4 animate-spin text-purple-500" /> : <Upload className="w-4 h-4 text-muted-foreground" />}
                        <span className="text-xs text-muted-foreground">{logoUploading ? 'جاري الرفع...' : 'رفع شعار'}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={e => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Transparent Icon for Balance Cards */}
                  <div>
                    <label className={labelClass}>الأيقونة الشفافة (لبطاقات الأرصدة)</label>
                    <p className="text-[10px] text-muted-foreground mb-2">أيقونة PNG شفافة تظهر في بطاقات الأرصدة داخل تطبيق المستخدم</p>
                    <div className="flex items-center gap-3">
                      {formData.appTransparentIconUrl && (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center border border-border/20">
                          <img src={formData.appTransparentIconUrl} alt="Transparent Icon" className="w-10 h-10 object-contain" />
                        </div>
                      )}
                      <label className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-border/50 rounded-xl cursor-pointer hover:bg-muted/20 transition-colors">
                        {transparentIconUploading ? <Loader2 className="w-4 h-4 animate-spin text-purple-500" /> : <ImageIcon className="w-4 h-4 text-muted-foreground" />}
                        <span className="text-xs text-muted-foreground">{transparentIconUploading ? 'جاري الرفع...' : 'رفع أيقونة شفافة'}</span>
                        <input
                          type="file"
                          accept="image/png"
                          className="hidden"
                          onChange={e => e.target.files?.[0] && handleTransparentIconUpload(e.target.files[0])}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="rounded-xl p-4 border border-border/20 bg-muted/10">
                    <p className="text-[10px] text-muted-foreground mb-2">معاينة مباشرة</p>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden"
                        style={{ background: formData.primaryColor }}
                      >
                        {formData.appLogoUrl ? (
                          <img src={formData.appLogoUrl} alt="" className="w-9 h-9 object-contain" />
                        ) : (
                          <Smartphone className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: formData.primaryColor }}>
                          {formData.appName || 'اسم التطبيق'}
                        </p>
                        <div className="flex gap-1 mt-1">
                          <div className="w-6 h-1.5 rounded-full" style={{ background: formData.primaryColor }} />
                          <div className="w-4 h-1.5 rounded-full" style={{ background: formData.secondaryColor }} />
                          <div className="w-3 h-1.5 rounded-full bg-muted-foreground/20" />
                        </div>
                      </div>
                      {formData.appTransparentIconUrl && (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center mr-auto">
                          <img src={formData.appTransparentIconUrl} alt="" className="w-8 h-8 object-contain" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Firebase Tab */}
              {activeTab === 'firebase' && (
                <div className="space-y-4">
                  <div className="rounded-xl p-3 bg-yellow-500/10 border border-yellow-500/20">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-yellow-700 dark:text-yellow-400">
                        يجب أن يكون لدى العميل مشروع Firebase خاص به. ارفع ملف google-services.json لاستخراج الإعدادات تلقائياً.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>ملف google-services.json</label>
                    <label className="flex items-center gap-2 px-4 py-3 border border-dashed border-border/50 rounded-xl cursor-pointer hover:bg-muted/20 transition-colors">
                      {jsonUploading ? <Loader2 className="w-4 h-4 animate-spin text-purple-500" /> : <FileCode className="w-4 h-4 text-muted-foreground" />}
                      <span className="text-xs text-muted-foreground">{jsonUploading ? 'جاري التحليل...' : 'رفع google-services.json'}</span>
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={e => e.target.files?.[0] && handleGoogleServicesUpload(e.target.files[0])}
                      />
                    </label>
                    {formData.googleServicesJson && (
                      <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1">
                        <Check className="w-3 h-3" /> تم تحميل الملف
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Firebase API Key</label>
                    <input
                      type="text"
                      value={formData.firebaseApiKey}
                      onChange={e => setFormData(prev => ({ ...prev, firebaseApiKey: e.target.value }))}
                      className={inputClass}
                      placeholder="AIzaSy..."
                      dir="ltr"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Project ID</label>
                      <input
                        type="text"
                        value={formData.firebaseProjectId}
                        onChange={e => setFormData(prev => ({ ...prev, firebaseProjectId: e.target.value }))}
                        className={inputClass}
                        placeholder="my-project"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Database URL</label>
                      <input
                        type="text"
                        value={formData.firebaseDatabaseUrl}
                        onChange={e => setFormData(prev => ({ ...prev, firebaseDatabaseUrl: e.target.value }))}
                        className={inputClass}
                        placeholder="https://...firebaseio.com"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Storage Bucket</label>
                      <input
                        type="text"
                        value={formData.firebaseStorageBucket}
                        onChange={e => setFormData(prev => ({ ...prev, firebaseStorageBucket: e.target.value }))}
                        className={inputClass}
                        placeholder="project.appspot.com"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Messaging Sender ID</label>
                      <input
                        type="text"
                        value={formData.firebaseMessagingSenderId}
                        onChange={e => setFormData(prev => ({ ...prev, firebaseMessagingSenderId: e.target.value }))}
                        className={inputClass}
                        placeholder="123456789"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Firebase App ID</label>
                    <input
                      type="text"
                      value={formData.firebaseAppId}
                      onChange={e => setFormData(prev => ({ ...prev, firebaseAppId: e.target.value }))}
                      className={inputClass}
                      placeholder="1:123456:android:abc123"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Firebase Admin SDK JSON (اختياري)</label>
                    <label className="flex items-center gap-2 px-4 py-3 border border-dashed border-border/50 rounded-xl cursor-pointer hover:bg-muted/20 transition-colors">
                      {sdkUploading ? <Loader2 className="w-4 h-4 animate-spin text-purple-500" /> : <FileCode className="w-4 h-4 text-muted-foreground" />}
                      <span className="text-xs text-muted-foreground">{sdkUploading ? 'جاري التحليل...' : 'رفع ملف Admin SDK'}</span>
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={e => e.target.files?.[0] && handleAdminSdkUpload(e.target.files[0])}
                      />
                    </label>
                    {formData.firebaseAdminSdk && (
                      <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1">
                        <Check className="w-3 h-3" /> تم تحميل الملف
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Identity Tab */}
              {activeTab === 'identity' && (
                <div className="space-y-4">
                  <div className="rounded-xl p-3 bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-start gap-2">
                      <Package className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-blue-700 dark:text-blue-400">
                        اسم الحزمة يجب أن يكون فريداً لكل عميل ويتبع صيغة Java package. مثال: com.company.wallet
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>اسم حزمة تطبيق المستخدم *</label>
                    <input
                      type="text"
                      value={formData.userAppPackageName}
                      onChange={e => setFormData(prev => ({ ...prev, userAppPackageName: e.target.value }))}
                      className={inputClass}
                      placeholder="com.example.wallet"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>اسم حزمة تطبيق الأدمن</label>
                    <input
                      type="text"
                      value={formData.adminAppPackageName}
                      onChange={e => setFormData(prev => ({ ...prev, adminAppPackageName: e.target.value }))}
                      className={inputClass}
                      placeholder="com.example.wallet.admin"
                      dir="ltr"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">يتم إنشاؤه تلقائياً بإضافة .admin لاسم حزمة المستخدم</p>
                  </div>

                  <div>
                    <label className={labelClass}>الإصدار</label>
                    <input
                      type="text"
                      value={formData.version}
                      onChange={e => setFormData(prev => ({ ...prev, version: e.target.value }))}
                      className={inputClass}
                      placeholder="1.0.0"
                      dir="ltr"
                    />
                  </div>
                </div>
              )}

              {/* Social Tab */}
              {activeTab === 'social' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>بريد التواصل</label>
                      <input
                        type="email"
                        value={formData.contactEmail}
                        onChange={e => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                        className={inputClass}
                        placeholder="info@example.com"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>هاتف الدعم</label>
                      <input
                        type="tel"
                        value={formData.supportPhone}
                        onChange={e => setFormData(prev => ({ ...prev, supportPhone: e.target.value }))}
                        className={inputClass}
                        placeholder="+967..."
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>رابط تيليجرام</label>
                    <input
                      type="url"
                      value={formData.socialLinks.telegram || ''}
                      onChange={e => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, telegram: e.target.value } }))}
                      className={inputClass}
                      placeholder="https://t.me/..."
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>رابط واتساب</label>
                    <input
                      type="url"
                      value={formData.socialLinks.whatsapp || ''}
                      onChange={e => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, whatsapp: e.target.value } }))}
                      className={inputClass}
                      placeholder="https://wa.me/..."
                      dir="ltr"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>فيسبوك</label>
                      <input
                        type="url"
                        value={formData.socialLinks.facebook || ''}
                        onChange={e => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, facebook: e.target.value } }))}
                        className={inputClass}
                        placeholder="https://facebook.com/..."
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>انستغرام</label>
                      <input
                        type="url"
                        value={formData.socialLinks.instagram || ''}
                        onChange={e => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, instagram: e.target.value } }))}
                        className={inputClass}
                        placeholder="https://instagram.com/..."
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>تويتر / X</label>
                      <input
                        type="url"
                        value={formData.socialLinks.twitter || ''}
                        onChange={e => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, twitter: e.target.value } }))}
                        className={inputClass}
                        placeholder="https://x.com/..."
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>يوتيوب</label>
                      <input
                        type="url"
                        value={formData.socialLinks.youtube || ''}
                        onChange={e => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, youtube: e.target.value } }))}
                        className={inputClass}
                        placeholder="https://youtube.com/..."
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Client Tab */}
              {activeTab === 'client' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>اسم العميل</label>
                      <input
                        type="text"
                        value={formData.clientName}
                        onChange={e => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                        className={inputClass}
                        placeholder="اسم الشركة أو الشخص"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>بريد العميل</label>
                      <input
                        type="email"
                        value={formData.clientEmail}
                        onChange={e => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                        className={inputClass}
                        placeholder="client@example.com"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>السعر</label>
                      <input
                        type="number"
                        value={formData.price || ''}
                        onChange={e => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                        className={inputClass}
                        placeholder="0"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>العملة</label>
                      <select
                        value={formData.currency}
                        onChange={e => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                        className={inputClass}
                      >
                        <option value="YER">ريال يمني</option>
                        <option value="SAR">ريال سعودي</option>
                        <option value="USD">دولار أمريكي</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/20">
                    <div>
                      <p className="text-xs font-semibold">حالة النسخة</p>
                      <p className="text-[10px] text-muted-foreground">النسخة النشطة تظهر في القائمة</p>
                    </div>
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                      className={`relative w-11 h-6 rounded-full transition-colors ${formData.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${formData.isActive ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                  </div>

                  <div>
                    <label className={labelClass}>ملاحظات</label>
                    <textarea
                      value={formData.notes}
                      onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className={`${inputClass} min-h-[80px] resize-none`}
                      placeholder="ملاحظات إضافية عن العميل أو النسخة..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="p-4 border-t border-border/20 flex items-center justify-between gap-3">
              <button
                onClick={() => { setShowForm(false); setEditingId(null); setFormData(defaultAppInstance); }}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted/20 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 active:scale-[0.98] transition-all"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingId ? 'تحديث النسخة' : 'إنشاء النسخة'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Box */}
      {!showForm && (
        <div className="rounded-2xl p-4 border border-border/20 bg-muted/5">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div className="text-[11px] text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground text-xs">كيف يتم بناء التطبيق؟</p>
              <p>1. أنشئ نسخة جديدة مع بيانات العميل وشعار التطبيق وملف Firebase</p>
              <p>2. اضغط &quot;بناء&quot; لإرسال طلب البناء تلقائياً عبر GitHub Actions</p>
              <p>3. يتم تغيير اسم الحزمة والألوان والشعار تلقائياً حسب إعدادات العميل</p>
              <p>4. تطبيق الأدمن المُبنى لا يحتوي على قسم &quot;متجر النسخ&quot;</p>
              <p>5. ملفات APK تظهر كـ Artifacts في صفحة GitHub Actions</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
