'use client';

import { useState, useRef } from 'react';
import { useDevStore, AppInstance } from '@/lib/store';
import { database } from '@/lib/firebase';
import { ref, set, push, remove, update, get } from 'firebase/database';
import { initializeApp, deleteApp } from 'firebase/app';
import { getDatabase as getClientDb, ref as clientRef, get as clientGet } from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit3, Trash2, Copy, Search, Upload, TestTube,
  CheckCircle, XCircle, Loader2, ExternalLink, ChevronDown,
  ChevronUp, Save, X, Rocket, FileJson, Tag, Copy as CopyIcon,
  ArrowLeft, Zap, Package, User, CreditCard, Clock,
  Shield, Phone, MapPin, Calendar, Layers, Hash,
  Info, ToggleLeft, ToggleRight, Eye, Github
} from 'lucide-react';
import {
  cn, generateId, generateOrderNumber, buildStatusLabels, buildStatusColors,
  paymentStatusLabels, paymentStatusColors, currencySymbols, parseGoogleServicesJson,
  isValidPackageName, generatePackageName, getSubscriptionStatus,
  subscriptionStatusLabels, subscriptionStatusColors, subscriptionTypeLabels,
  subscriptionTypeColors, buildPriorityLabels, buildPriorityColors,
  formatDateAr, copyToClipboard
} from '@/lib/utils';

const emptyInstance: Partial<AppInstance> = {
  orderNumber: '',
  paymentAmount: 0,
  paymentCurrency: 'YER',
  paymentStatus: 'pending',
  orderDate: new Date().toISOString(),
  completionDate: '',
  appName: '',
  appLogoUrl: '',
  appTransparentIconUrl: '',
  primaryColor: '#6C3CE1',
  secondaryColor: '#8B5CF6',
  googleServicesJson: '',
  firebaseApiKey: '',
  firebaseProjectId: '',
  firebaseDatabaseUrl: '',
  firebaseStorageBucket: '',
  firebaseMessagingSenderId: '',
  firebaseAppId: '',
  firebaseAdminSdk: '',
  adminGoogleServicesJson: '',
  adminFirebaseApiKey: '',
  adminFirebaseProjectId: '',
  adminFirebaseDatabaseUrl: '',
  adminFirebaseStorageBucket: '',
  adminFirebaseMessagingSenderId: '',
  adminFirebaseAppId: '',
  adminFirebaseAdminSdk: '',
  userAppPackageName: 'com.qtbm.south',
  adminAppPackageName: 'com.qtbm.south.admin',
  contactEmail: '',
  supportPhone: '',
  socialLinks: {
    telegram: '',
    whatsapp: '',
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
  },
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
  clientPhone: '',
  clientAddress: '',
  subscriptionType: 'one-time',
  subscriptionEndDate: '',
  autoRenew: false,
  supportEndDate: '',
  templateId: '',
  tags: [],
  buildPriority: 'normal',
  lastBuildAt: '',
  totalBuilds: 0,
  apkSizeUser: '',
  apkSizeAdmin: '',
  minAndroidVersion: '5.0',
  notes: '',
  isActive: true,
  version: '1.0.0',
};

export default function InstancesPanel() {
  const { instances, setInstances, devSettings, addNotification } = useDevStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [view, setView] = useState<'list' | 'detail' | 'form'>('list');
  const [selectedInstance, setSelectedInstance] = useState<AppInstance | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<AppInstance>>({ ...emptyInstance });
  const [saving, setSaving] = useState(false);
  const [testingFirebase, setTestingFirebase] = useState(false);
  const [firebaseTestResult, setFirebaseTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testingAdminFirebase, setTestingAdminFirebase] = useState(false);
  const [adminFirebaseTestResult, setAdminFirebaseTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    order: true,
    branding: true,
    firebase: false,
    adminFirebase: false,
    packages: false,
    contact: false,
    social: false,
    client: false,
    subscription: false,
    tags: false,
    notes: false,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [autoFilled, setAutoFilled] = useState(false);
  const [adminAutoFilled, setAdminAutoFilled] = useState(false);
  const [autoFillToast, setAutoFillToast] = useState<string | null>(null);
  const [testingGithubRepo, setTestingGithubRepo] = useState(false);
  const [githubRepoTestResult, setGithubRepoTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const adminFileInputRef = useRef<HTMLInputElement>(null);

  const filteredInstances = instances.filter(i => {
    const matchSearch = !searchQuery ||
      i.appName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchStatus = true;
    if (statusFilter === 'active') matchStatus = i.isActive;
    else if (statusFilter === 'building') matchStatus = i.userAppBuildStatus === 'building' || i.adminAppBuildStatus === 'building';
    else if (statusFilter === 'pending_payment') matchStatus = i.paymentStatus === 'pending';
    else if (statusFilter === 'expiring') matchStatus = i.subscriptionEndDate ? getSubscriptionStatus(i.subscriptionEndDate) !== 'active' : false;
    else if (statusFilter === 'failed') matchStatus = i.userAppBuildStatus === 'failed' || i.adminAppBuildStatus === 'failed';

    return matchSearch && matchStatus;
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateForm = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const updateSocialLink = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [key]: value }
    }));
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags?.includes(tag)) {
      updateForm('tags', [...(formData.tags || []), tag]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    updateForm('tags', formData.tags?.filter(t => t !== tag) || []);
  };

  const handleNewInstance = () => {
    const prefix = devSettings.defaultPackagePrefix || 'com.qtbm';
    setFormData({
      ...emptyInstance,
      orderNumber: generateOrderNumber(),
      orderDate: new Date().toISOString(),
      userAppPackageName: `${prefix}.south`,
      adminAppPackageName: `${prefix}.south.admin`,
      subscriptionEndDate: devSettings.defaultSubscriptionMonths
        ? new Date(Date.now() + devSettings.defaultSubscriptionMonths * 30 * 24 * 60 * 60 * 1000).toISOString()
        : '',
      supportEndDate: devSettings.defaultSupportMonths
        ? new Date(Date.now() + devSettings.defaultSupportMonths * 30 * 24 * 60 * 60 * 1000).toISOString()
        : '',
    });
    setEditingId(null);
    setView('form');
    setFirebaseTestResult(null);
    setAdminFirebaseTestResult(null);
    setAutoFilled(false);
    setAdminAutoFilled(false);
    setAutoFillToast(null);
    setGithubRepoTestResult(null);
  };

  const handleEditInstance = (instance: AppInstance) => {
    setFormData({ ...instance });
    setEditingId(instance.id);
    setView('form');
    setFirebaseTestResult(null);
    setAdminFirebaseTestResult(null);
    setAutoFilled(false);
    setAdminAutoFilled(false);
    setAutoFillToast(null);
    setGithubRepoTestResult(null);
  };

  const handleViewDetail = (instance: AppInstance) => {
    setSelectedInstance(instance);
    setView('detail');
  };

  const handleCloneInstance = (instance: AppInstance) => {
    const prefix = devSettings.defaultPackagePrefix || 'com.qtbm';
    setFormData({
      ...instance,
      id: undefined,
      orderNumber: generateOrderNumber(),
      orderDate: new Date().toISOString(),
      appName: `${instance.appName} (نسخة)`,
      userAppBuildStatus: 'none',
      adminAppBuildStatus: 'none',
      userAppApkUrl: '',
      adminAppApkUrl: '',
      userAppBuildLog: '',
      adminAppBuildLog: '',
      userAppBuildAt: '',
      adminAppBuildAt: '',
      githubRunId: '',
      lastBuildAt: '',
      totalBuilds: 0,
      createdAt: undefined,
      updatedAt: undefined,
    });
    setEditingId(null);
    setView('form');
    setFirebaseTestResult(null);
    setAdminFirebaseTestResult(null);
  };

  const handleSave = async () => {
    if (!formData.appName) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      if (editingId) {
        const updated = { ...formData, updatedAt: now } as AppInstance;
        await update(ref(database, `appInstances/${editingId}`), updated);
        setInstances(instances.map(i => i.id === editingId ? updated : i));
      } else {
        const id = generateId();
        const newInstance = {
          ...formData,
          id,
          createdAt: now,
          updatedAt: now,
        } as AppInstance;
        await set(ref(database, `appInstances/${id}`), newInstance);
        setInstances([...instances, newInstance]);
        addNotification({
          type: 'new_order',
          title: 'نسخة جديدة',
          message: `تم إنشاء نسخة "${newInstance.appName}" بنجاح`,
          read: false,
          instanceId: id,
        });
      }
      setView('list');
      setEditingId(null);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(ref(database, `appInstances/${id}`));
      setInstances(instances.filter(i => i.id !== id));
      setDeleteConfirm(null);
      setView('list');
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleToggleActive = async (instance: AppInstance) => {
    try {
      const updated = { ...instance, isActive: !instance.isActive, updatedAt: new Date().toISOString() };
      await update(ref(database, `appInstances/${instance.id}`), { isActive: !instance.isActive, updatedAt: updated.updatedAt });
      setInstances(instances.map(i => i.id === instance.id ? updated : i));
      if (view === 'detail') setSelectedInstance(updated);
    } catch (error) {
      console.error('Toggle active error:', error);
    }
  };

  const handleGoogleServicesUpload = (e: React.ChangeEvent<HTMLInputElement>, isAdmin: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const jsonStr = ev.target?.result as string;
        const parsed = parseGoogleServicesJson(jsonStr);

        if (parsed.apiKey || parsed.projectId) {
          if (isAdmin) {
            setFormData(prev => ({
              ...prev,
              adminGoogleServicesJson: jsonStr,
              adminFirebaseApiKey: parsed.apiKey,
              adminFirebaseProjectId: parsed.projectId,
              adminFirebaseDatabaseUrl: parsed.databaseUrl,
              adminFirebaseStorageBucket: parsed.storageBucket,
              adminFirebaseMessagingSenderId: parsed.messagingSenderId,
              adminFirebaseAppId: parsed.appId,
            }));
            setAdminAutoFilled(true);
            setAutoFillToast('تم تعبئة حقول الإدارة تلقائياً');
            setTimeout(() => setAdminAutoFilled(false), 3000);
            setTimeout(() => setAutoFillToast(null), 4000);
          } else {
            setFormData(prev => ({
              ...prev,
              googleServicesJson: jsonStr,
              firebaseApiKey: parsed.apiKey,
              firebaseProjectId: parsed.projectId,
              firebaseDatabaseUrl: parsed.databaseUrl,
              firebaseStorageBucket: parsed.storageBucket,
              firebaseMessagingSenderId: parsed.messagingSenderId,
              firebaseAppId: parsed.appId,
            }));
            setAutoFilled(true);
            setAutoFillToast('تم تعبئة الحقول تلقائياً');
            setTimeout(() => setAutoFilled(false), 3000);
            setTimeout(() => setAutoFillToast(null), 4000);
          }
        }
      } catch (error) {
        console.error('Error parsing google-services.json:', error);
      }
    };
    reader.readAsText(file);
  };

  const handleTestFirebase = async (isAdmin: boolean = false) => {
    const apiKey = isAdmin ? formData.adminFirebaseApiKey : formData.firebaseApiKey;
    const projectId = isAdmin ? formData.adminFirebaseProjectId : formData.firebaseProjectId;
    const databaseUrl = isAdmin ? formData.adminFirebaseDatabaseUrl : formData.firebaseDatabaseUrl;
    const storageBucket = isAdmin ? formData.adminFirebaseStorageBucket : formData.firebaseStorageBucket;
    const messagingSenderId = isAdmin ? formData.adminFirebaseMessagingSenderId : formData.firebaseMessagingSenderId;
    const appId = isAdmin ? formData.adminFirebaseAppId : formData.firebaseAppId;

    if (!apiKey || !projectId) {
      const result = { success: false, message: 'يجب ملء حقل مفتاح API ومعرف المشروع أولاً' };
      if (isAdmin) setAdminFirebaseTestResult(result);
      else setFirebaseTestResult(result);
      return;
    }

    if (isAdmin) { setTestingAdminFirebase(true); setAdminFirebaseTestResult(null); }
    else { setTestingFirebase(true); setFirebaseTestResult(null); }

    try {
      const testConfig = {
        apiKey,
        authDomain: `${projectId}.firebaseapp.com`,
        databaseURL: databaseUrl || `https://${projectId}-default-rtdb.firebaseio.com`,
        projectId,
        storageBucket: storageBucket || `${projectId}.appspot.com`,
        messagingSenderId: messagingSenderId || '',
        appId: appId || '',
      };

      const testAppName = `test-${isAdmin ? 'admin' : 'client'}-${Date.now()}`;
      const testApp = initializeApp(testConfig, testAppName);
      const testDb = getClientDb(testApp);

      const testRef = clientRef(testDb, '.info/connected');
      const snapshot = await clientGet(testRef);
      const connected = snapshot.val();

      await deleteApp(testApp);

      const result = {
        success: true,
        message: connected
          ? `تم الاتصال بنجاح! المشروع: ${projectId} | قاعدة البيانات: ${testConfig.databaseURL}`
          : `تم الاتصال لكن قاعدة البيانات غير متاحة حالياً | المشروع: ${projectId}`,
      };

      if (isAdmin) setAdminFirebaseTestResult(result);
      else setFirebaseTestResult(result);
    } catch (error: any) {
      const result = {
        success: false,
        message: `فشل الاتصال: ${error.message || 'خطأ غير معروف'}`,
      };
      if (isAdmin) setAdminFirebaseTestResult(result);
      else setFirebaseTestResult(result);
    } finally {
      if (isAdmin) setTestingAdminFirebase(false);
      else setTestingFirebase(false);
    }
  };

  const handleTriggerBuild = async (instance: AppInstance, appType: 'user' | 'admin') => {
    if (!devSettings.githubToken || !devSettings.githubOwner || !devSettings.githubRepo) {
      addNotification({
        type: 'build_failed',
        title: 'فشل البناء',
        message: 'يجب تكوين إعدادات GitHub أولاً',
        read: false,
        instanceId: instance.id,
      });
      return;
    }

    try {
      const statusKey = appType === 'user' ? 'userAppBuildStatus' : 'adminAppBuildStatus';
      await update(ref(database, `appInstances/${instance.id}`), {
        [statusKey]: 'queued',
        buildPriority: instance.buildPriority || 'normal',
        lastBuildAt: new Date().toISOString(),
        totalBuilds: (instance.totalBuilds || 0) + 1,
        updatedAt: new Date().toISOString(),
      });

      const response = await fetch(
        `https://api.github.com/repos/${devSettings.githubOwner}/${devSettings.githubRepo}/dispatches`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${devSettings.githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_type: 'build-custom-app',
            client_payload: {
              instanceId: instance.id,
              appType,
              appName: instance.appName,
              primaryColor: instance.primaryColor,
              secondaryColor: instance.secondaryColor,
              packageName: appType === 'user' ? instance.userAppPackageName : instance.adminAppPackageName,
              firebaseApiKey: appType === 'admin' ? instance.adminFirebaseApiKey : instance.firebaseApiKey,
              firebaseProjectId: appType === 'admin' ? instance.adminFirebaseProjectId : instance.firebaseProjectId,
              firebaseDatabaseUrl: appType === 'admin' ? instance.adminFirebaseDatabaseUrl : instance.firebaseDatabaseUrl,
              firebaseStorageBucket: appType === 'admin' ? instance.adminFirebaseStorageBucket : instance.firebaseStorageBucket,
              firebaseMessagingSenderId: appType === 'admin' ? instance.adminFirebaseMessagingSenderId : instance.firebaseMessagingSenderId,
              firebaseAppId: appType === 'admin' ? instance.adminFirebaseAppId : instance.firebaseAppId,
            },
          }),
        }
      );

      if (response.ok) {
        const updated = {
          ...instance,
          [statusKey]: 'queued',
          lastBuildAt: new Date().toISOString(),
          totalBuilds: (instance.totalBuilds || 0) + 1,
        };
        setInstances(instances.map(i => i.id === instance.id ? updated : i));
        if (view === 'detail') setSelectedInstance(updated);
        addNotification({
          type: 'build_complete',
          title: 'طلب بناء',
          message: `تم إرسال طلب بناء ${appType === 'user' ? 'تطبيق المستخدم' : 'تطبيق الإدارة'} لـ "${instance.appName}"`,
          read: false,
          instanceId: instance.id,
        });
      }
    } catch (error) {
      console.error('Build trigger error:', error);
    }
  };

  const handleBuildBoth = async (instance: AppInstance) => {
    await handleTriggerBuild(instance, 'user');
    await handleTriggerBuild(instance, 'admin');
  };

  const handleAppNameChange = (name: string) => {
    updateForm('appName', name);
    const prefix = devSettings.defaultPackagePrefix || 'com.qtbm';
    if (name && !editingId) {
      const baseName = name.replace(/\s+/g, '.').toLowerCase();
      updateForm('userAppPackageName', `${prefix}.${baseName}`);
      updateForm('adminAppPackageName', `${prefix}.${baseName}.admin`);
    }
  };

  const handleTestGithubRepo = async () => {
    if (!devSettings.githubToken || !devSettings.githubOwner || !devSettings.githubRepo) {
      setGithubRepoTestResult({ success: false, message: 'يجب تكوين إعدادات GitHub أولاً في صفحة الإعدادات' });
      return;
    }
    setTestingGithubRepo(true);
    setGithubRepoTestResult(null);

    try {
      const response = await fetch(
        `https://api.github.com/repos/${devSettings.githubOwner}/${devSettings.githubRepo}`,
        {
          headers: {
            'Authorization': `Bearer ${devSettings.githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setGithubRepoTestResult({
          success: true,
          message: `المستودع متاح: ${data.full_name} (${data.private ? 'خاص' : 'عام'}) - آخر تحديث: ${new Date(data.updated_at).toLocaleDateString('ar-SA')}`,
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setGithubRepoTestResult({
          success: false,
          message: `المستودع غير قابل للوصول: ${errorData.message || 'غير موجود'}`,
        });
      }
    } catch (error: any) {
      setGithubRepoTestResult({
        success: false,
        message: `خطأ في الاتصال: ${error.message || 'خطأ غير معروف'}`,
      });
    } finally {
      setTestingGithubRepo(false);
    }
  };

  const renderSection = (key: string, title: string, icon: React.ReactNode, content: React.ReactNode) => (
    <div className="border border-border/30 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => toggleSection(key)}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted/30 transition-colors"
      >
        {icon}
        <span className="flex-1 text-right">{title}</span>
        {expandedSections[key] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      <AnimatePresence>
        {expandedSections[key] && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const inputClass = "w-full h-11 px-4 rounded-xl bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/30 transition-all text-sm";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1 px-1";

  // =========== DETAIL VIEW ===========
  if (view === 'detail' && selectedInstance) {
    const inst = selectedInstance;
    const subStatus = inst.subscriptionEndDate ? getSubscriptionStatus(inst.subscriptionEndDate) : null;

    return (
      <div className="space-y-4">
        {/* Back button */}
        <button
          onClick={() => { setView('list'); setSelectedInstance(null); }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          العودة للقائمة
        </button>

        {/* Header */}
        <div className="ios-card p-5">
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shrink-0 shadow-lg"
              style={{ background: inst.primaryColor || '#6C3CE1' }}
            >
              {inst.appLogoUrl ? (
                <img src={inst.appLogoUrl} alt="" className="w-12 h-12 object-contain rounded" />
              ) : (
                inst.appName?.charAt(0) || 'N'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="text-xl font-bold text-foreground">{inst.appName || 'بدون اسم'}</h2>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${paymentStatusColors[inst.paymentStatus]}`}>
                  {paymentStatusLabels[inst.paymentStatus]}
                </span>
                {subStatus && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${subscriptionStatusColors[subStatus]}`}>
                    {subscriptionStatusLabels[subStatus]}
                  </span>
                )}
                {!inst.isActive && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    غير نشط
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground" dir="ltr">{inst.orderNumber}</p>
              {inst.tags && inst.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {inst.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/30">
            <button
              onClick={() => handleEditInstance(inst)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-medium hover:bg-purple-500/20 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" /> تعديل
            </button>
            <button
              onClick={() => handleCloneInstance(inst)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors"
            >
              <CopyIcon className="w-3.5 h-3.5" /> استنساخ
            </button>
            <button
              onClick={() => handleToggleActive(inst)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-500/10 text-gray-600 dark:text-gray-400 text-xs font-medium hover:bg-gray-500/20 transition-colors"
            >
              {inst.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
              {inst.isActive ? 'إلغاء التفعيل' : 'تفعيل'}
            </button>
            {(inst.userAppBuildStatus === 'none' || inst.userAppBuildStatus === 'failed') && (
              <button
                onClick={() => handleTriggerBuild(inst, 'user')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium hover:bg-green-500/20 transition-colors"
              >
                <Rocket className="w-3.5 h-3.5" /> بناء المستخدم
              </button>
            )}
            {(inst.adminAppBuildStatus === 'none' || inst.adminAppBuildStatus === 'failed') && (
              <button
                onClick={() => handleTriggerBuild(inst, 'admin')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-medium hover:bg-orange-500/20 transition-colors"
              >
                <Rocket className="w-3.5 h-3.5" /> بناء الإدارة
              </button>
            )}
            {((inst.userAppBuildStatus === 'none' || inst.userAppBuildStatus === 'failed') &&
              (inst.adminAppBuildStatus === 'none' || inst.adminAppBuildStatus === 'failed')) && (
              <button
                onClick={() => handleBuildBoth(inst)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500 text-white text-xs font-medium hover:bg-purple-600 transition-colors shadow-lg shadow-purple-500/25"
              >
                <Zap className="w-3.5 h-3.5" /> بناء الاثنين
              </button>
            )}
            {deleteConfirm === inst.id ? (
              <div className="flex items-center gap-1">
                <button onClick={() => handleDelete(inst.id)} className="p-2 rounded-xl bg-red-500 text-white">
                  <CheckCircle className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteConfirm(null)} className="p-2 rounded-xl bg-muted/50 text-muted-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeleteConfirm(inst.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-medium hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> حذف
              </button>
            )}
          </div>
        </div>

        {/* Order & Payment */}
        <div className="ios-card p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-purple-500" /> معلومات الطلب
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">رقم الطلب</p>
              <p className="font-medium text-foreground" dir="ltr">{inst.orderNumber || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">المبلغ</p>
              <p className="font-medium text-foreground">{inst.paymentAmount > 0 ? `${inst.paymentAmount.toLocaleString()} ${currencySymbols[inst.paymentCurrency] || ''}` : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">تاريخ الطلب</p>
              <p className="font-medium text-foreground">{inst.orderDate ? formatDateAr(inst.orderDate) : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">تاريخ الإكمال</p>
              <p className="font-medium text-foreground">{inst.completionDate ? formatDateAr(inst.completionDate) : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">أولوية البناء</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${buildPriorityColors[inst.buildPriority || 'normal']}`}>
                {buildPriorityLabels[inst.buildPriority || 'normal']}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">إجمالي البناءات</p>
              <p className="font-medium text-foreground">{inst.totalBuilds || 0}</p>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="ios-card p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-purple-500" /> الهوية البصرية
          </h3>
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg" style={{ background: inst.primaryColor || '#6C3CE1' }} />
              <span className="text-xs text-muted-foreground">الأساسي: {inst.primaryColor}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg" style={{ background: inst.secondaryColor || '#8B5CF6' }} />
              <span className="text-xs text-muted-foreground">الثانوي: {inst.secondaryColor}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">الإصدار</p>
              <p className="font-medium text-foreground" dir="ltr">v{inst.version || '1.0.0'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">أندرويد أدنى إصدار</p>
              <p className="font-medium text-foreground" dir="ltr">{inst.minAndroidVersion || '5.0'}</p>
            </div>
          </div>
        </div>

        {/* Build Status */}
        <div className="ios-card p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-500" /> حالة البناء
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">تطبيق المستخدم</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${buildStatusColors[inst.userAppBuildStatus]}`}>
                  {buildStatusLabels[inst.userAppBuildStatus]}
                </span>
              </div>
              {inst.userAppBuildAt && <p className="text-xs text-muted-foreground">{formatDateAr(inst.userAppBuildAt)}</p>}
              {inst.apkSizeUser && <p className="text-xs text-muted-foreground">الحجم: {inst.apkSizeUser}</p>}
              {inst.userAppApkUrl && (
                <a href={inst.userAppApkUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 mt-1">
                  <ExternalLink className="w-3 h-3" /> تحميل APK
                </a>
              )}
            </div>
            <div className="p-3 rounded-xl bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">تطبيق الإدارة</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${buildStatusColors[inst.adminAppBuildStatus]}`}>
                  {buildStatusLabels[inst.adminAppBuildStatus]}
                </span>
              </div>
              {inst.adminAppBuildAt && <p className="text-xs text-muted-foreground">{formatDateAr(inst.adminAppBuildAt)}</p>}
              {inst.apkSizeAdmin && <p className="text-xs text-muted-foreground">الحجم: {inst.apkSizeAdmin}</p>}
              {inst.adminAppApkUrl && (
                <a href={inst.adminAppApkUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 mt-1">
                  <ExternalLink className="w-3 h-3" /> تحميل APK
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Firebase Config */}
        <div className="ios-card p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <TestTube className="w-4 h-4 text-orange-500" /> إعدادات Firebase (العميل)
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Project ID</p>
              <p className="font-medium text-foreground text-xs" dir="ltr">{inst.firebaseProjectId || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Database URL</p>
              <p className="font-medium text-foreground text-xs truncate" dir="ltr">{inst.firebaseDatabaseUrl || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">App ID</p>
              <p className="font-medium text-foreground text-xs truncate" dir="ltr">{inst.firebaseAppId || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Storage Bucket</p>
              <p className="font-medium text-foreground text-xs" dir="ltr">{inst.firebaseStorageBucket || '—'}</p>
            </div>
          </div>
        </div>

        {/* Admin Firebase Config */}
        {(inst.adminFirebaseApiKey || inst.adminFirebaseProjectId) && (
          <div className="ios-card p-5">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" /> إعدادات Firebase (الإدارة)
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Project ID</p>
                <p className="font-medium text-foreground text-xs" dir="ltr">{inst.adminFirebaseProjectId || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Database URL</p>
                <p className="font-medium text-foreground text-xs truncate" dir="ltr">{inst.adminFirebaseDatabaseUrl || '—'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Package Names */}
        <div className="ios-card p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-500" /> أسماء الحزم
          </h3>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">حزمة المستخدم</p>
              <p className="font-medium text-foreground text-sm" dir="ltr">{inst.userAppPackageName || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">حزمة الإدارة</p>
              <p className="font-medium text-foreground text-sm" dir="ltr">{inst.adminAppPackageName || '—'}</p>
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="ios-card p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-amber-500" /> معلومات العميل
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">الاسم</p>
              <p className="font-medium text-foreground">{inst.clientName || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">البريد</p>
              <p className="font-medium text-foreground" dir="ltr">{inst.clientEmail || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">الهاتف</p>
              <p className="font-medium text-foreground" dir="ltr">{inst.clientPhone || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">العنوان</p>
              <p className="font-medium text-foreground">{inst.clientAddress || '—'}</p>
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="ios-card p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-green-500" /> معلومات الاشتراك
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">نوع الاشتراك</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${subscriptionTypeColors[inst.subscriptionType || 'one-time']}`}>
                {subscriptionTypeLabels[inst.subscriptionType || 'one-time']}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">تاريخ الانتهاء</p>
              <p className="font-medium text-foreground">{inst.subscriptionEndDate ? formatDateAr(inst.subscriptionEndDate) : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">تجديد تلقائي</p>
              <p className="font-medium text-foreground">{inst.autoRenew ? 'نعم' : 'لا'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">انتهاء الدعم</p>
              <p className="font-medium text-foreground">{inst.supportEndDate ? formatDateAr(inst.supportEndDate) : '—'}</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {inst.notes && (
          <div className="ios-card p-5">
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-gray-500" /> ملاحظات
            </h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{inst.notes}</p>
          </div>
        )}
      </div>
    );
  }

  // =========== FORM VIEW ===========
  if (view === 'form') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">
            {editingId ? 'تعديل النسخة' : 'إضافة نسخة جديدة'}
          </h1>
          <button
            onClick={() => { setView('list'); setEditingId(null); }}
            className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-3 max-h-[calc(100vh-160px)] overflow-y-auto scrollbar-thin pb-4">
          {/* Order Info */}
          {renderSection('order', 'معلومات الطلب', <CreditCard className="w-4 h-4 text-purple-500" />, (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>رقم الطلب</label>
                  <input className={cn(inputClass, 'bg-muted/50')} value={formData.orderNumber || ''} readOnly dir="ltr" />
                </div>
                <div>
                  <label className={labelClass}>المبلغ</label>
                  <input type="number" className={inputClass} value={formData.paymentAmount || 0} onChange={e => updateForm('paymentAmount', Number(e.target.value))} dir="ltr" />
                </div>
                <div>
                  <label className={labelClass}>العملة</label>
                  <select className={inputClass} value={formData.paymentCurrency || 'YER'} onChange={e => updateForm('paymentCurrency', e.target.value)}>
                    <option value="YER">ريال يمني (YER)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                    <option value="SAR">ريال سعودي (SAR)</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>حالة الدفع</label>
                  <select className={inputClass} value={formData.paymentStatus || 'pending'} onChange={e => updateForm('paymentStatus', e.target.value)}>
                    <option value="pending">معلّق</option>
                    <option value="paid">مدفوع</option>
                    <option value="refunded">مسترد</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>أولوية البناء</label>
                  <select className={inputClass} value={formData.buildPriority || 'normal'} onChange={e => updateForm('buildPriority', e.target.value)}>
                    <option value="normal">عادي</option>
                    <option value="high">مرتفع</option>
                    <option value="urgent">عاجل</option>
                  </select>
                </div>
              </div>
              {/* GitHub Repository Test */}
              <div className="p-3 rounded-xl bg-gray-500/5 border border-gray-500/15 mt-1">
                <div className="flex items-center gap-2 mb-2">
                  <Github className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">اختبار اتصال مستودع GitHub</span>
                </div>
                <button type="button" onClick={handleTestGithubRepo} disabled={testingGithubRepo} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-500/10 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-500/20 transition-colors disabled:opacity-50">
                  {testingGithubRepo ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                  اختبار اتصال المستودع
                </button>
                {githubRepoTestResult && (
                  <div className={cn('flex items-center gap-2 p-2.5 rounded-lg text-xs mt-2', githubRepoTestResult.success ? 'bg-green-500/5 border border-green-500/15 text-green-600 dark:text-green-400' : 'bg-red-500/5 border border-red-500/15 text-red-600 dark:text-red-400')}>
                    <div className={cn('w-2 h-2 rounded-full shrink-0', githubRepoTestResult.success ? 'bg-green-500' : 'bg-red-500')} />
                    {githubRepoTestResult.message}
                  </div>
                )}
              </div>
            </>
          ))}

          {/* Branding */}
          {renderSection('branding', 'الهوية البصرية', <Package className="w-4 h-4 text-purple-500" />, (
            <>
              <div>
                <label className={labelClass}>اسم التطبيق *</label>
                <input className={inputClass} value={formData.appName || ''} onChange={e => handleAppNameChange(e.target.value)} placeholder="مثال: محفظة النور" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>رابط الشعار</label>
                  <input className={inputClass} value={formData.appLogoUrl || ''} onChange={e => updateForm('appLogoUrl', e.target.value)} placeholder="https://..." dir="ltr" />
                </div>
                <div>
                  <label className={labelClass}>رابط الأيقونة الشفافة</label>
                  <input className={inputClass} value={formData.appTransparentIconUrl || ''} onChange={e => updateForm('appTransparentIconUrl', e.target.value)} placeholder="https://..." dir="ltr" />
                </div>
                <div>
                  <label className={labelClass}>اللون الأساسي</label>
                  <div className="flex items-center gap-2">
                    <input type="color" className="w-10 h-10 rounded-xl border-0 cursor-pointer" value={formData.primaryColor || '#6C3CE1'} onChange={e => updateForm('primaryColor', e.target.value)} />
                    <input className={cn(inputClass, 'flex-1')} value={formData.primaryColor || ''} onChange={e => updateForm('primaryColor', e.target.value)} dir="ltr" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>اللون الثانوي</label>
                  <div className="flex items-center gap-2">
                    <input type="color" className="w-10 h-10 rounded-xl border-0 cursor-pointer" value={formData.secondaryColor || '#8B5CF6'} onChange={e => updateForm('secondaryColor', e.target.value)} />
                    <input className={cn(inputClass, 'flex-1')} value={formData.secondaryColor || ''} onChange={e => updateForm('secondaryColor', e.target.value)} dir="ltr" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>الإصدار</label>
                  <input className={inputClass} value={formData.version || '1.0.0'} onChange={e => updateForm('version', e.target.value)} placeholder="1.0.0" dir="ltr" />
                </div>
                <div>
                  <label className={labelClass}>أدنى إصدار أندرويد</label>
                  <input className={inputClass} value={formData.minAndroidVersion || '5.0'} onChange={e => updateForm('minAndroidVersion', e.target.value)} placeholder="5.0" dir="ltr" />
                </div>
              </div>
            </>
          ))}

          {/* Client Firebase Config */}
          {renderSection('firebase', 'إعدادات Firebase (العميل)', <TestTube className="w-4 h-4 text-orange-500" />, (
            <>
              <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/15">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-medium text-orange-600 dark:text-orange-400">تعبئة تلقائية من google-services.json</span>
                  </div>
                  {autoFilled && (
                    <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 animate-pulse">
                      <CheckCircle className="w-3 h-3" /> تم التعبئة
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={e => handleGoogleServicesUpload(e, false)} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 text-sm font-medium hover:bg-orange-500/20 transition-colors">
                    <Upload className="w-4 h-4" /> رفع الملف
                  </button>
                  <button type="button" onClick={() => handleTestFirebase(false)} disabled={testingFirebase || !formData.firebaseApiKey || !formData.firebaseProjectId} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium hover:bg-green-500/20 transition-colors disabled:opacity-50">
                    {testingFirebase ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                    اختبار اتصال Firebase
                  </button>
                </div>
                {autoFillToast && !autoFillToast.includes('الإدارة') && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 mt-2 p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-600 dark:text-green-400 font-medium"
                  >
                    <CheckCircle className="w-4 h-4 shrink-0" /> {autoFillToast}
                  </motion.div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className={labelClass}>API Key</label><input className={inputClass} value={formData.firebaseApiKey || ''} onChange={e => updateForm('firebaseApiKey', e.target.value)} placeholder="AIza..." dir="ltr" /></div>
                <div><label className={labelClass}>Project ID</label><input className={inputClass} value={formData.firebaseProjectId || ''} onChange={e => updateForm('firebaseProjectId', e.target.value)} placeholder="my-project" dir="ltr" /></div>
                <div className="sm:col-span-2"><label className={labelClass}>Database URL</label><input className={inputClass} value={formData.firebaseDatabaseUrl || ''} onChange={e => updateForm('firebaseDatabaseUrl', e.target.value)} placeholder="https://xxx.firebaseio.com" dir="ltr" /></div>
                <div><label className={labelClass}>Storage Bucket</label><input className={inputClass} value={formData.firebaseStorageBucket || ''} onChange={e => updateForm('firebaseStorageBucket', e.target.value)} placeholder="xxx.appspot.com" dir="ltr" /></div>
                <div><label className={labelClass}>Messaging Sender ID</label><input className={inputClass} value={formData.firebaseMessagingSenderId || ''} onChange={e => updateForm('firebaseMessagingSenderId', e.target.value)} placeholder="123456" dir="ltr" /></div>
                <div className="sm:col-span-2"><label className={labelClass}>App ID</label><input className={inputClass} value={formData.firebaseAppId || ''} onChange={e => updateForm('firebaseAppId', e.target.value)} placeholder="1:123:android:abc" dir="ltr" /></div>
                <div className="sm:col-span-2"><label className={labelClass}>Admin SDK (JSON)</label><textarea className={cn(inputClass, 'h-24 resize-none py-3')} value={formData.firebaseAdminSdk || ''} onChange={e => updateForm('firebaseAdminSdk', e.target.value)} placeholder='{"type": "service_account", ...}' dir="ltr" /></div>
              </div>
              {firebaseTestResult && (
                <div className={cn('p-4 rounded-xl text-sm', firebaseTestResult.success ? 'bg-green-500/5 border border-green-500/15' : 'bg-red-500/5 border border-red-500/15')}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn('w-3 h-3 rounded-full shrink-0', firebaseTestResult.success ? 'bg-green-500' : 'bg-red-500')} />
                    <span className={cn('font-semibold', firebaseTestResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                      {firebaseTestResult.success ? 'اتصال ناجح' : 'فشل الاتصال'}
                    </span>
                  </div>
                  {firebaseTestResult.success && (
                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                      {formData.firebaseProjectId && (
                        <div><span className="text-muted-foreground">Project ID:</span> <span className="text-foreground font-medium" dir="ltr">{formData.firebaseProjectId}</span></div>
                      )}
                      {formData.firebaseDatabaseUrl && (
                        <div><span className="text-muted-foreground">Database:</span> <span className="text-foreground font-medium truncate" dir="ltr">{formData.firebaseDatabaseUrl}</span></div>
                      )}
                    </div>
                  )}
                  <p className={cn('text-xs mt-1', firebaseTestResult.success ? 'text-green-600/70 dark:text-green-400/70' : 'text-red-600 dark:text-red-400')}>{firebaseTestResult.message}</p>
                </div>
              )}
            </>
          ))}

          {/* Admin Firebase Config */}
          {renderSection('adminFirebase', 'إعدادات Firebase (الإدارة)', <Shield className="w-4 h-4 text-blue-500" />, (
            <>
              <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">ملف google-services.json لتطبيق الإدارة</span>
                  </div>
                  {adminAutoFilled && (
                    <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle className="w-3 h-3" /> تم التعبئة
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input ref={adminFileInputRef} type="file" accept=".json" className="hidden" onChange={e => handleGoogleServicesUpload(e, true)} />
                  <button type="button" onClick={() => adminFileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-colors">
                    <Upload className="w-4 h-4" /> رفع الملف
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className={labelClass}>API Key (الإدارة)</label><input className={inputClass} value={formData.adminFirebaseApiKey || ''} onChange={e => updateForm('adminFirebaseApiKey', e.target.value)} placeholder="AIza..." dir="ltr" /></div>
                <div><label className={labelClass}>Project ID (الإدارة)</label><input className={inputClass} value={formData.adminFirebaseProjectId || ''} onChange={e => updateForm('adminFirebaseProjectId', e.target.value)} placeholder="my-project" dir="ltr" /></div>
                <div className="sm:col-span-2"><label className={labelClass}>Database URL (الإدارة)</label><input className={inputClass} value={formData.adminFirebaseDatabaseUrl || ''} onChange={e => updateForm('adminFirebaseDatabaseUrl', e.target.value)} placeholder="https://xxx.firebaseio.com" dir="ltr" /></div>
                <div><label className={labelClass}>Storage Bucket (الإدارة)</label><input className={inputClass} value={formData.adminFirebaseStorageBucket || ''} onChange={e => updateForm('adminFirebaseStorageBucket', e.target.value)} placeholder="xxx.appspot.com" dir="ltr" /></div>
                <div><label className={labelClass}>Messaging Sender ID (الإدارة)</label><input className={inputClass} value={formData.adminFirebaseMessagingSenderId || ''} onChange={e => updateForm('adminFirebaseMessagingSenderId', e.target.value)} placeholder="123456" dir="ltr" /></div>
                <div className="sm:col-span-2"><label className={labelClass}>App ID (الإدارة)</label><input className={inputClass} value={formData.adminFirebaseAppId || ''} onChange={e => updateForm('adminFirebaseAppId', e.target.value)} placeholder="1:123:android:abc" dir="ltr" /></div>
                <div className="sm:col-span-2"><label className={labelClass}>Admin SDK (الإدارة)</label><textarea className={cn(inputClass, 'h-24 resize-none py-3')} value={formData.adminFirebaseAdminSdk || ''} onChange={e => updateForm('adminFirebaseAdminSdk', e.target.value)} placeholder='{"type": "service_account", ...}' dir="ltr" /></div>
              </div>
              <div className="space-y-2">
                <button type="button" onClick={() => handleTestFirebase(true)} disabled={testingAdminFirebase} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-colors disabled:opacity-50">
                  {testingAdminFirebase ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                  اختبار اتصال Firebase (الإدارة)
                </button>
                {adminFirebaseTestResult && (
                  <div className={cn('p-4 rounded-xl text-sm', adminFirebaseTestResult.success ? 'bg-green-500/5 border border-green-500/15' : 'bg-red-500/5 border border-red-500/15')}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn('w-3 h-3 rounded-full shrink-0', adminFirebaseTestResult.success ? 'bg-green-500' : 'bg-red-500')} />
                      <span className={cn('font-semibold', adminFirebaseTestResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                        {adminFirebaseTestResult.success ? 'اتصال ناجح' : 'فشل الاتصال'}
                      </span>
                    </div>
                    <p className={cn('text-xs mt-1', adminFirebaseTestResult.success ? 'text-green-600/70 dark:text-green-400/70' : 'text-red-600 dark:text-red-400')}>{adminFirebaseTestResult.message}</p>
                  </div>
                )}
                {autoFillToast && autoFillToast.includes('الإدارة') && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-600 dark:text-green-400 font-medium"
                  >
                    <CheckCircle className="w-4 h-4 shrink-0" /> {autoFillToast}
                  </motion.div>
                )}
              </div>
            </>
          ))}

          {/* Package Names */}
          {renderSection('packages', 'أسماء الحزم', <Rocket className="w-4 h-4 text-blue-500" />, (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>حزمة تطبيق المستخدم</label>
                <input className={cn(inputClass, !isValidPackageName(formData.userAppPackageName || '') && formData.userAppPackageName ? 'border-red-500/50' : '')} value={formData.userAppPackageName || ''} onChange={e => updateForm('userAppPackageName', e.target.value)} placeholder="com.example.app" dir="ltr" />
                {!isValidPackageName(formData.userAppPackageName || '') && formData.userAppPackageName && (
                  <p className="text-[10px] text-red-500 mt-1 px-1">اسم الحزمة غير صالح</p>
                )}
              </div>
              <div>
                <label className={labelClass}>حزمة تطبيق الإدارة</label>
                <input className={cn(inputClass, !isValidPackageName(formData.adminAppPackageName || '') && formData.adminAppPackageName ? 'border-red-500/50' : '')} value={formData.adminAppPackageName || ''} onChange={e => updateForm('adminAppPackageName', e.target.value)} placeholder="com.example.admin" dir="ltr" />
              </div>
            </div>
          ))}

          {/* Contact */}
          {renderSection('contact', 'معلومات التواصل', <Phone className="w-4 h-4 text-green-500" />, (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className={labelClass}>البريد الإلكتروني</label><input className={inputClass} value={formData.contactEmail || ''} onChange={e => updateForm('contactEmail', e.target.value)} placeholder="support@example.com" dir="ltr" /></div>
              <div><label className={labelClass}>رقم الدعم</label><input className={inputClass} value={formData.supportPhone || ''} onChange={e => updateForm('supportPhone', e.target.value)} placeholder="+967..." dir="ltr" /></div>
            </div>
          ))}

          {/* Social Links */}
          {renderSection('social', 'روابط التواصل الاجتماعي', <ExternalLink className="w-4 h-4 text-cyan-500" />, (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['telegram', 'whatsapp', 'facebook', 'instagram', 'twitter', 'youtube'].map(social => (
                <div key={social}>
                  <label className={labelClass}>{social.charAt(0).toUpperCase() + social.slice(1)}</label>
                  <input className={inputClass} value={(formData.socialLinks as any)?.[social] || ''} onChange={e => updateSocialLink(social, e.target.value)} placeholder={`https://${social}.com/...`} dir="ltr" />
                </div>
              ))}
            </div>
          ))}

          {/* Client Info */}
          {renderSection('client', 'معلومات العميل', <User className="w-4 h-4 text-amber-500" />, (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className={labelClass}>اسم العميل</label><input className={inputClass} value={formData.clientName || ''} onChange={e => updateForm('clientName', e.target.value)} placeholder="اسم العميل" /></div>
              <div><label className={labelClass}>بريد العميل</label><input className={inputClass} value={formData.clientEmail || ''} onChange={e => updateForm('clientEmail', e.target.value)} placeholder="client@example.com" dir="ltr" /></div>
              <div><label className={labelClass}>هاتف العميل</label><input className={inputClass} value={formData.clientPhone || ''} onChange={e => updateForm('clientPhone', e.target.value)} placeholder="+967..." dir="ltr" /></div>
              <div><label className={labelClass}>عنوان العميل</label><input className={inputClass} value={formData.clientAddress || ''} onChange={e => updateForm('clientAddress', e.target.value)} placeholder="عنوان العميل" /></div>
            </div>
          ))}

          {/* Subscription */}
          {renderSection('subscription', 'معلومات الاشتراك', <Calendar className="w-4 h-4 text-green-500" />, (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>نوع الاشتراك</label>
                <select className={inputClass} value={formData.subscriptionType || 'one-time'} onChange={e => updateForm('subscriptionType', e.target.value)}>
                  <option value="one-time">مرة واحدة</option>
                  <option value="monthly">شهري</option>
                  <option value="yearly">سنوي</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>تاريخ انتهاء الاشتراك</label>
                <input type="date" className={inputClass} value={formData.subscriptionEndDate ? formData.subscriptionEndDate.split('T')[0] : ''} onChange={e => updateForm('subscriptionEndDate', e.target.value ? new Date(e.target.value).toISOString() : '')} />
              </div>
              <div>
                <label className={labelClass}>تجديد تلقائي</label>
                <select className={inputClass} value={formData.autoRenew ? 'true' : 'false'} onChange={e => updateForm('autoRenew', e.target.value === 'true')}>
                  <option value="false">لا</option>
                  <option value="true">نعم</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>تاريخ انتهاء الدعم</label>
                <input type="date" className={inputClass} value={formData.supportEndDate ? formData.supportEndDate.split('T')[0] : ''} onChange={e => updateForm('supportEndDate', e.target.value ? new Date(e.target.value).toISOString() : '')} />
              </div>
            </div>
          ))}

          {/* Tags */}
          {renderSection('tags', 'التصنيفات', <Tag className="w-4 h-4 text-purple-500" />, (
            <>
              <div className="flex gap-2">
                <input className={cn(inputClass, 'flex-1')} value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="أضف تصنيف..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                <button type="button" onClick={addTag} className="px-4 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium hover:bg-purple-500/20 transition-colors">
                  إضافة
                </button>
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </>
          ))}

          {/* Notes */}
          {renderSection('notes', 'ملاحظات', <Edit3 className="w-4 h-4 text-gray-500" />, (
            <textarea className={cn(inputClass, 'h-24 resize-none py-3')} value={formData.notes || ''} onChange={e => updateForm('notes', e.target.value)} placeholder="ملاحظات إضافية..." />
          ))}
        </div>

        {/* Save Button */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSave}
            disabled={saving || !formData.appName}
            className="flex-1 h-12 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/30 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 active:scale-[0.98]"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'جاري الحفظ...' : editingId ? 'تحديث النسخة' : 'إضافة النسخة'}
          </button>
          <button
            onClick={() => { setView('list'); setEditingId(null); }}
            className="px-6 h-12 bg-muted/50 hover:bg-muted/70 text-foreground font-medium rounded-2xl transition-all active:scale-[0.98]"
          >
            إلغاء
          </button>
        </div>
      </div>
    );
  }

  // =========== LIST VIEW ===========
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="ios-large-title text-foreground">إدارة النسخ</h1>
          <p className="text-muted-foreground text-sm mt-1">إنشاء وإدارة نسخ التطبيقات</p>
        </div>
        <button
          onClick={handleNewInstance}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-purple-500/25"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">نسخة جديدة</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، رقم الطلب، العميل، أو التصنيفات..."
            className="w-full h-11 pr-10 pl-4 rounded-2xl bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 px-3 rounded-2xl bg-muted/30 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
        >
          <option value="all">الكل</option>
          <option value="active">نشط</option>
          <option value="building">قيد البناء</option>
          <option value="pending_payment">بانتظار الدفع</option>
          <option value="expiring">اشتراك منتهي</option>
          <option value="failed">بناء فاشل</option>
        </select>
      </div>

      {/* Instances List */}
      {filteredInstances.length === 0 ? (
        <div className="text-center py-16">
          <Copy className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg font-medium">لا توجد نسخ</p>
          <p className="text-muted-foreground/60 text-sm mt-1">ابدأ بإنشاء نسخة جديدة من التطبيق</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInstances.map(instance => {
            const subStatus = instance.subscriptionEndDate ? getSubscriptionStatus(instance.subscriptionEndDate) : null;
            return (
              <motion.div
                key={instance.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="ios-card p-4 card-press"
                onClick={() => handleViewDetail(instance)}
              >
                <div className="flex items-start gap-3">
                  {/* App Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                    style={{ background: instance.primaryColor || '#6C3CE1' }}
                  >
                    {instance.appLogoUrl ? (
                      <img src={instance.appLogoUrl} alt="" className="w-8 h-8 object-contain rounded" />
                    ) : (
                      instance.appName?.charAt(0) || 'N'
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-foreground truncate">{instance.appName || 'بدون اسم'}</h3>
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', paymentStatusColors[instance.paymentStatus])}>
                        {paymentStatusLabels[instance.paymentStatus]}
                      </span>
                      {subStatus && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${subscriptionStatusColors[subStatus]}`}>
                          {subscriptionStatusLabels[subStatus]}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2" dir="ltr">{instance.orderNumber}</p>

                    {/* Build Status Badges */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', buildStatusColors[instance.userAppBuildStatus])}>
                        المستخدم: {buildStatusLabels[instance.userAppBuildStatus]}
                      </span>
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', buildStatusColors[instance.adminAppBuildStatus])}>
                        الإدارة: {buildStatusLabels[instance.adminAppBuildStatus]}
                      </span>
                    </div>

                    {/* Tags, Client & Payment */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      {instance.clientName && <span>العميل: {instance.clientName}</span>}
                      {instance.paymentAmount > 0 && (
                        <span>{instance.paymentAmount.toLocaleString()} {currencySymbols[instance.paymentCurrency]}</span>
                      )}
                      {instance.lastBuildAt && <span>آخر بناء: {new Date(instance.lastBuildAt).toLocaleDateString('ar-SA')}</span>}
                    </div>

                    {instance.tags && instance.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {instance.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">
                            {tag}
                          </span>
                        ))}
                        {instance.tags.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{instance.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    {(instance.userAppBuildStatus === 'none' || instance.userAppBuildStatus === 'failed') && (
                      <button onClick={() => handleTriggerBuild(instance, 'user')} className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-500 transition-colors" title="بناء تطبيق المستخدم">
                        <Rocket className="w-4 h-4" />
                      </button>
                    )}
                    {(instance.adminAppBuildStatus === 'none' || instance.adminAppBuildStatus === 'failed') && (
                      <button onClick={() => handleTriggerBuild(instance, 'admin')} className="p-2 rounded-lg hover:bg-green-500/10 text-green-500 transition-colors" title="بناء تطبيق الإدارة">
                        <Rocket className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleViewDetail(instance)} className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors" title="عرض التفاصيل">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEditInstance(instance)} className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors" title="تعديل">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
