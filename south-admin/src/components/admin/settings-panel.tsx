'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAdminStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, Loader2, Settings as SettingsIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPanel() {
  const { showToast } = useAdminStore();
  const [config, setConfig] = useState({
    appName: 'محفظة الجنوب',
    packageName: 'com.qtbm.south',
    maintenanceMode: false,
    forceUpdate: false,
    latestVersion: '1.0.0',
    minVersion: '1.0.0',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const ref_ = ref(database, 'ownerSettings/projectConfig');
    const unsub = onValue(ref_, (snapshot) => {
      const data = snapshot.val() || {};
      setConfig({
        appName: data.appName || 'محفظة الجنوب',
        packageName: data.packageName || 'com.qtbm.south',
        maintenanceMode: data.maintenanceMode || false,
        forceUpdate: data.forceUpdate || false,
        latestVersion: data.latestVersion || '1.0.0',
        minVersion: data.minVersion || '1.0.0',
      });
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await update(ref(database, 'ownerSettings/projectConfig'), config);
      showToast('تم حفظ الإعدادات', 'success');
    } catch (e) { showToast('حدث خطأ', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">الإعدادات</h1>
        <p className="text-muted-foreground text-sm mt-1">إعدادات التطبيق العامة</p>
      </div>

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

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div><p className="text-sm font-medium">وضع الصيانة</p><p className="text-xs text-muted-foreground">تعطيل التطبيق مؤقتا للمستخدمين</p></div>
              <Switch checked={config.maintenanceMode} onCheckedChange={(v) => setConfig({ ...config, maintenanceMode: v })} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div><p className="text-sm font-medium">تحديث إجباري</p><p className="text-xs text-muted-foreground">إجبار المستخدمين على تحديث التطبيق</p></div>
              <Switch checked={config.forceUpdate} onCheckedChange={(v) => setConfig({ ...config, forceUpdate: v })} />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700">
              {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
              حفظ الإعدادات
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
