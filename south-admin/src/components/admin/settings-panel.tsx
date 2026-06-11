'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, update, set, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAdminStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Loader2, Settings as SettingsIcon, Wrench, Download, AlertTriangle, Eye, Bell, Key, Check, EyeOff, Eye as EyeIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendFCMDirect } from '@/lib/fcm-sender';

interface MaintenanceData {
  active: boolean;
  message: string;
  estimatedTime: string;
  activatedAt: string;
  activatedBy: string;
}

interface ForceUpdateData {
  active: boolean;
  minVersion: string;
  updateUrl: string;
  message: string;
}

export default function SettingsPanel() {
  const { showToast, adminUser } = useAdminStore();
  const [config, setConfig] = useState({
    appName: 'محفظة الجنوب',
    packageName: 'com.qtbm.south',
    latestVersion: '1.0.0',
    minVersion: '1.0.0',
  });
  const [maintenance, setMaintenance] = useState<MaintenanceData>({
    active: false,
    message: 'التطبيق حالياً في وضع الصيانة، سنكون بالعودة قريباً...',
    estimatedTime: '30 دقيقة',
    activatedAt: '',
    activatedBy: '',
  });
  const [forceUpdate, setForceUpdate] = useState<ForceUpdateData>({
    active: false,
    minVersion: '',
    updateUrl: '',
    message: '',
  });
  const [githubToken, setGithubToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [savingToken, setSavingToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingNotif, setSendingNotif] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const configRef = ref(database, 'ownerSettings/projectConfig');
    const unsub1 = onValue(configRef, (snapshot) => {
      const data = snapshot.val() || {};
      setConfig({
        appName: data.appName || 'محفظة الجنوب',
        packageName: data.packageName || 'com.qtbm.south',
        latestVersion: data.latestVersion || '1.0.0',
        minVersion: data.minVersion || '1.0.0',
      });
    });

    const maintRef = ref(database, 'adminSettings/maintenance');
    const unsub2 = onValue(maintRef, (snapshot) => {
      const data = snapshot.val() || {};
      setMaintenance({
        active: data.active || false,
        message: data.message || 'التطبيق حالياً في وضع الصيانة، سنكون بالعودة قريباً...',
        estimatedTime: data.estimatedTime || '30 دقيقة',
        activatedAt: data.activatedAt || '',
        activatedBy: data.activatedBy || '',
      });
    });

    const forceRef = ref(database, 'adminSettings/forceUpdate');
    const unsub3 = onValue(forceRef, (snapshot) => {
      const data = snapshot.val() || {};
      setForceUpdate({
        active: data.active || false,
        minVersion: data.minVersion || '',
        updateUrl: data.updateUrl || '',
        message: data.message || '',
      });
    });

    const tokenRef = ref(database, 'adminSettings/githubToken');
    const unsub4 = onValue(tokenRef, (snapshot) => {
      setGithubToken(snapshot.val() || '');
      setLoading(false);
    });

    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, []);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await update(ref(database, 'ownerSettings/projectConfig'), config);
      showToast('تم حفظ الإعدادات', 'success');
    } catch { showToast('حدث خطأ', 'error'); }
    finally { setSaving(false); }
  };

  const handleSaveGithubToken = async () => {
    setSavingToken(true);
    try {
      await set(ref(database, 'adminSettings/githubToken'), githubToken);
      showToast('تم حفظ توكن GitHub بنجاح', 'success');
    } catch { showToast('فشل حفظ التوكن', 'error'); }
    finally { setSavingToken(false); }
  };

  const sendMaintenanceNotification = async (isActive: boolean) => {
    try {
      setSendingNotif(true);
      // Get all users' FCM tokens
      const usersSnapshot = await get(ref(database, 'users'));
      const tokens: string[] = [];
      if (usersSnapshot.exists()) {
        const usersData = usersSnapshot.val() as Record<string, { fcmToken?: string }>;
        Object.values(usersData).forEach((userData) => {
          if (userData?.fcmToken) {
            tokens.push(userData.fcmToken);
          }
        });
      }

      if (tokens.length > 0) {
        const title = isActive ? 'وضع الصيانة مفعّل' : 'تم تعطيل وضع الصيانة';
        const body = isActive
          ? (maintenance.message || 'التطبيق حالياً في وضع الصيانة، سنكون بالعودة قريباً...')
          : 'تم العودة إلى التشغيل الطبيعي، شكراً لصبركم';
        await sendFCMDirect(
          tokens,
          title,
          body,
          isActive ? 'security' : 'info',
          { maintenanceMode: isActive ? 'active' : 'inactive' }
        );
        showToast(`تم إرسال إشعار إلى ${tokens.length} جهاز`, 'success');
      } else {
        showToast('لم يتم العثور على أجهزة مسجلة للإشعارات', 'info');
      }
    } catch (e) {
      console.warn('Failed to send maintenance notification:', e);
      showToast('فشل إرسال إشعار الصيانة', 'error');
    } finally {
      setSendingNotif(false);
    }
  };

  const handleSaveMaintenance = async () => {
    setSaving(true);
    try {
      const dataToSave: MaintenanceData = {
        active: maintenance.active,
        message: maintenance.message || 'التطبيق حالياً في وضع الصيانة، سنكون بالعودة قريباً...',
        estimatedTime: maintenance.estimatedTime || '',
        activatedAt: maintenance.active
          ? (maintenance.activatedAt || new Date().toISOString())
          : maintenance.activatedAt, // keep previous activation time
        activatedBy: maintenance.active
          ? (maintenance.activatedBy || adminUser?.uid || 'admin')
          : maintenance.activatedBy,
      };

      // If toggling ON, set activatedAt to now
      if (maintenance.active && !maintenance.activatedAt) {
        dataToSave.activatedAt = new Date().toISOString();
        dataToSave.activatedBy = adminUser?.uid || 'admin';
      }

      await set(ref(database, 'adminSettings/maintenance'), dataToSave);
      showToast(maintenance.active ? 'تم تفعيل وضع الصيانة' : 'تم تعطيل وضع الصيانة', 'success');

      // Send FCM notification to all users
      await sendMaintenanceNotification(maintenance.active);
    } catch { showToast('حدث خطأ', 'error'); }
    finally { setSaving(false); }
  };

  const handleSaveForceUpdate = async () => {
    setSaving(true);
    try {
      await set(ref(database, 'adminSettings/forceUpdate'), forceUpdate);
      showToast(forceUpdate.active ? 'تم تفعيل التحديث الإجباري' : 'تم تعطيل التحديث الإجباري', 'success');
    } catch { showToast('حدث خطأ', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">الإعدادات</h1>
        <p className="text-muted-foreground text-sm mt-1">إعدادات التطبيق العامة والصيانة والتحديثات</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="w-full">
          <TabsTrigger value="general" className="flex-1">عام</TabsTrigger>
          <TabsTrigger value="github" className="flex-1">GitHub</TabsTrigger>
          <TabsTrigger value="maintenance" className="flex-1">الصيانة</TabsTrigger>
          <TabsTrigger value="force-update" className="flex-1">تحديث إجباري</TabsTrigger>
        </TabsList>

        {/* ─── General Tab ─── */}
        <TabsContent value="general" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="admin-card border-0 shadow-none">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10">
                  <SettingsIcon className="w-6 h-6 text-purple-500" />
                  <p className="font-medium text-sm">إعدادات التطبيق</p>
                </div>
                <div><Label>اسم التطبيق</Label><Input value={config.appName} onChange={(e) => setConfig({ ...config, appName: e.target.value })} /></div>
                <div><Label>اسم الحزمة</Label><Input value={config.packageName} onChange={(e) => setConfig({ ...config, packageName: e.target.value })} dir="ltr" /></div>
                <div><Label>آخر إصدار</Label><Input value={config.latestVersion} onChange={(e) => setConfig({ ...config, latestVersion: e.target.value })} dir="ltr" /></div>
                <div><Label>الحد الأدنى للإصدار</Label><Input value={config.minVersion} onChange={(e) => setConfig({ ...config, minVersion: e.target.value })} dir="ltr" /></div>
                <Button onClick={handleSaveConfig} disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700">
                  {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
                  حفظ الإعدادات
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ─── GitHub Token Tab ─── */}
        <TabsContent value="github" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="admin-card border-0 shadow-none">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-500/10">
                  <Key className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="font-medium text-sm">توكن GitHub</p>
                    <p className="text-[10px] text-muted-foreground">يُستخدم لتشغيل بناء النسخ تلقائياً عبر GitHub Actions</p>
                  </div>
                </div>
                
                <div className="rounded-xl p-3 bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-yellow-700 dark:text-yellow-400">
                      التوكن حساس جداً! لا تشاركه مع أحد. يحتاج صلاحيات repo و workflow_dispatch.
                    </p>
                  </div>
                </div>

                <div>
                  <Label>Personal Access Token (PAT)</Label>
                  <div className="relative">
                    <Input
                      type={showToken ? 'text' : 'password'}
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      dir="ltr"
                      className="pl-10 pr-10"
                    />
                    <button
                      onClick={() => setShowToken(!showToken)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                      type="button"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {githubToken && (
                  <div className="flex items-center gap-1.5 text-[10px] text-green-600">
                    <Check className="w-3 h-3" />
                    <span>تم تعيين التوكن ({githubToken.substring(0, 7)}...{githubToken.substring(githubToken.length - 4)})</span>
                  </div>
                )}

                <Button onClick={handleSaveGithubToken} disabled={savingToken} className="w-full bg-gray-700 hover:bg-gray-800">
                  {savingToken ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Key className="w-4 h-4 ml-2" />}
                  حفظ التوكن
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ─── Maintenance Tab ─── */}
        <TabsContent value="maintenance" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="admin-card border-0 shadow-none">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-yellow-500" /> وضع الصيانة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">عند التفعيل، يظهر تطبيق المستخدم شاشة صيانة كاملة تمنع الاستخدام. سيتم إرسال إشعار فوري لجميع المستخدمين.</p>

                {/* Active status banner */}
                {maintenance.active && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">وضع الصيانة مفعّل حاليا</p>
                      {maintenance.activatedAt && (
                        <p className="text-xs text-yellow-500/70 mt-0.5">
                          تم التفعيل: {new Date(maintenance.activatedAt).toLocaleString('ar-EG')}
                          {maintenance.activatedBy && ` — بواسطة: ${maintenance.activatedBy}`}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted">
                  <div>
                    <p className="text-sm font-medium">تفعيل وضع الصيانة</p>
                    <p className="text-xs text-muted-foreground">تعطيل التطبيق مؤقتا للمستخدمين وإرسال إشعار</p>
                  </div>
                  <Switch checked={maintenance.active} onCheckedChange={(v) => setMaintenance({ ...maintenance, active: v })} />
                </div>

                {/* Message */}
                <div>
                  <Label>رسالة الصيانة</Label>
                  <Textarea
                    value={maintenance.message}
                    onChange={(e) => setMaintenance({ ...maintenance, message: e.target.value })}
                    placeholder="نحن نقوم بتحسين التطبيق، سنكون بالعودة قريباً..."
                    className="min-h-[80px]"
                  />
                </div>

                {/* Estimated time */}
                <div>
                  <Label>الوقت المتوقع للعودة</Label>
                  <Input
                    value={maintenance.estimatedTime}
                    onChange={(e) => setMaintenance({ ...maintenance, estimatedTime: e.target.value })}
                    placeholder="مثال: خلال ساعة"
                  />
                </div>

                {/* Preview toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  {showPreview ? 'إخفاء المعاينة' : 'معاينة شاشة الصيانة'}
                </Button>

                {/* Save button */}
                <Button onClick={handleSaveMaintenance} disabled={saving || sendingNotif} className="w-full bg-purple-600 hover:bg-purple-700">
                  {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : sendingNotif ? <Bell className="w-4 h-4 ml-2 animate-pulse" /> : <Save className="w-4 h-4 ml-2" />}
                  {sendingNotif ? 'جاري إرسال الإشعارات...' : 'حفظ إعدادات الصيانة'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Maintenance Preview */}
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Card className="admin-card border-0 shadow-none">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Eye className="w-5 h-5 text-blue-500" /> معاينة شاشة الصيانة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mx-auto max-w-[300px] rounded-2xl overflow-hidden shadow-2xl">
                      <div
                        className="min-h-[500px] flex items-center justify-center"
                        style={{ background: 'linear-gradient(145deg, #E60000 0%, #8B0000 60%, #5C0000 100%)' }}
                      >
                        <div className="flex flex-col items-center px-8 text-center">
                          {/* Wrench icon */}
                          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6" style={{ background: 'rgba(255,255,255,0.15)' }}>
                            <Wrench className="w-10 h-10 text-white" />
                          </div>
                          <h1 className="text-2xl font-bold text-white mb-3">صيانة مجدولة</h1>
                          <p className="text-white/70 text-sm leading-relaxed mb-2">
                            {maintenance.message || 'التطبيق حالياً في وضع الصيانة'}
                          </p>
                          {maintenance.estimatedTime && (
                            <p className="text-white/50 text-xs">الوقت المتوقع للعودة: {maintenance.estimatedTime}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* ─── Force Update Tab ─── */}
        <TabsContent value="force-update" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="admin-card border-0 shadow-none">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Download className="w-5 h-5 text-red-500" /> تحديث إجباري
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">إجبار المستخدمين على تحديث التطبيق قبل الاستمرار. المستخدمون بإصدار أقل من الحد الأدنى سيتم حظرهم.</p>

                {forceUpdate.active && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <p className="text-sm text-red-600 dark:text-red-400">التحديث الإجباري مفعّل حاليا — الحد الأدنى: {forceUpdate.minVersion}</p>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 rounded-xl bg-muted">
                  <div>
                    <p className="text-sm font-medium">تفعيل التحديث الإجباري</p>
                    <p className="text-xs text-muted-foreground">إجبار المستخدمين على تحديث التطبيق</p>
                  </div>
                  <Switch checked={forceUpdate.active} onCheckedChange={(v) => setForceUpdate({ ...forceUpdate, active: v })} />
                </div>

                <div>
                  <Label>الحد الأدنى للإصدار المطلوب</Label>
                  <Input value={forceUpdate.minVersion} onChange={(e) => setForceUpdate({ ...forceUpdate, minVersion: e.target.value })} dir="ltr" placeholder="1.0.0" />
                  <p className="text-xs text-muted-foreground mt-1">المستخدمون بإصدار أقل من هذا سيتم إجبارهم على التحديث</p>
                </div>

                <div>
                  <Label>رابط التحديث</Label>
                  <Input value={forceUpdate.updateUrl} onChange={(e) => setForceUpdate({ ...forceUpdate, updateUrl: e.target.value })} dir="ltr" placeholder="https://play.google.com/store/apps/details?id=..." />
                </div>

                <div>
                  <Label>رسالة التحديث</Label>
                  <Textarea value={forceUpdate.message} onChange={(e) => setForceUpdate({ ...forceUpdate, message: e.target.value })} placeholder="يتوفر إصدار جديد من التطبيق. يرجى التحديث للمتابعة." className="min-h-[80px]" />
                </div>

                <Button onClick={handleSaveForceUpdate} disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700">
                  {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
                  حفظ إعدادات التحديث
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
