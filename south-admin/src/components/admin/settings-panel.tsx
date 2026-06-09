'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, update, set } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAdminStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Loader2, Settings as SettingsIcon, Wrench, Download, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPanel() {
  const { showToast } = useAdminStore();
  const [config, setConfig] = useState({
    appName: 'محفظة الجنوب',
    packageName: 'com.qtbm.south',
    latestVersion: '1.0.0',
    minVersion: '1.0.0',
  });
  const [maintenance, setMaintenance] = useState({ active: false, message: '', estimatedTime: '' });
  const [forceUpdate, setForceUpdate] = useState({ active: false, minVersion: '', updateUrl: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        message: data.message || '',
        estimatedTime: data.estimatedTime || '',
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
      setLoading(false);
    });

    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await update(ref(database, 'ownerSettings/projectConfig'), config);
      showToast('تم حفظ الإعدادات', 'success');
    } catch (e) { showToast('حدث خطأ', 'error'); }
    finally { setSaving(false); }
  };

  const handleSaveMaintenance = async () => {
    setSaving(true);
    try {
      await set(ref(database, 'adminSettings/maintenance'), maintenance);
      showToast(maintenance.active ? 'تم تفعيل وضع الصيانة' : 'تم تعطيل وضع الصيانة', 'success');
    } catch (e) { showToast('حدث خطأ', 'error'); }
    finally { setSaving(false); }
  };

  const handleSaveForceUpdate = async () => {
    setSaving(true);
    try {
      await set(ref(database, 'adminSettings/forceUpdate'), forceUpdate);
      showToast(forceUpdate.active ? 'تم تفعيل التحديث الإجباري' : 'تم تعطيل التحديث الإجباري', 'success');
    } catch (e) { showToast('حدث خطأ', 'error'); }
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
          <TabsTrigger value="maintenance" className="flex-1">الصيانة</TabsTrigger>
          <TabsTrigger value="force-update" className="flex-1">تحديث إجباري</TabsTrigger>
        </TabsList>

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

        <TabsContent value="maintenance" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="admin-card border-0 shadow-none">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-yellow-500" /> وضع الصيانة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">عند التفعيل، يظهر تطبيق المستخدم شاشة صيانة كاملة تمنع الاستخدام</p>

                {maintenance.active && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">وضع الصيانة مفعّل حاليا</p>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 rounded-xl bg-muted">
                  <div>
                    <p className="text-sm font-medium">تفعيل وضع الصيانة</p>
                    <p className="text-xs text-muted-foreground">تعطيل التطبيق مؤقتا للمستخدمين</p>
                  </div>
                  <Switch checked={maintenance.active} onCheckedChange={(v) => setMaintenance({ ...maintenance, active: v })} />
                </div>

                <div><Label>رسالة الصيانة</Label>
                  <Textarea value={maintenance.message} onChange={(e) => setMaintenance({ ...maintenance, message: e.target.value })} placeholder="نحن نقوم بتحسين التطبيق، سنكون بالعودة قريبا..." className="min-h-[80px]" />
                </div>

                <div><Label>الوقت المتوقع للعودة</Label>
                  <Input value={maintenance.estimatedTime} onChange={(e) => setMaintenance({ ...maintenance, estimatedTime: e.target.value })} placeholder="مثال: خلال ساعة" />
                </div>

                <Button onClick={handleSaveMaintenance} disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700">
                  {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
                  حفظ إعدادات الصيانة
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="force-update" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="admin-card border-0 shadow-none">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Download className="w-5 h-5 text-red-500" /> تحديث إجباري
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">إجبار المستخدمين على تحديث التطبيق قبل الاستمرار</p>

                {forceUpdate.active && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <p className="text-sm text-red-600 dark:text-red-400">التحديث الإجباري مفعّل حاليا</p>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 rounded-xl bg-muted">
                  <div>
                    <p className="text-sm font-medium">تفعيل التحديث الإجباري</p>
                    <p className="text-xs text-muted-foreground">إجبار المستخدمين على تحديث التطبيق</p>
                  </div>
                  <Switch checked={forceUpdate.active} onCheckedChange={(v) => setForceUpdate({ ...forceUpdate, active: v })} />
                </div>

                <div><Label>الحد الأدنى للإصدار المطلوب</Label>
                  <Input value={forceUpdate.minVersion} onChange={(e) => setForceUpdate({ ...forceUpdate, minVersion: e.target.value })} dir="ltr" placeholder="1.0.0" />
                </div>

                <div><Label>رابط التحديث</Label>
                  <Input value={forceUpdate.updateUrl} onChange={(e) => setForceUpdate({ ...forceUpdate, updateUrl: e.target.value })} dir="ltr" placeholder="https://play.google.com/store/apps/details?id=..." />
                </div>

                <div><Label>رسالة التحديث</Label>
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
