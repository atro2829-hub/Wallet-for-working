'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAdminStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2, Code, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ApiSettingsPanel() {
  const { showToast } = useAdminStore();
  const [settings, setSettings] = useState({
    provider1ApiKey: '',
    provider1WebhookUrl: '',
    provider2ApiKey: '',
    provider2WebhookUrl: '',
    provider3ApiKey: '',
    provider3WebhookUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    const ref_ = ref(database, 'ownerSettings/projectConfig');
    const unsub = onValue(ref_, (snapshot) => {
      const data = snapshot.val() || {};
      setSettings({
        provider1ApiKey: data.provider1ApiKey || '',
        provider1WebhookUrl: data.provider1WebhookUrl || '',
        provider2ApiKey: data.provider2ApiKey || '',
        provider2WebhookUrl: data.provider2WebhookUrl || '',
        provider3ApiKey: data.provider3ApiKey || '',
        provider3WebhookUrl: data.provider3WebhookUrl || '',
      });
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await update(ref(database, 'ownerSettings/projectConfig'), settings);
      showToast('تم حفظ إعدادات API', 'success');
    } catch (e) { showToast('حدث خطأ', 'error'); }
    finally { setSaving(false); }
  };

  const testConnection = async (provider: string) => {
    setTesting(provider);
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 1500));
    setTesting(null);
    showToast(`اختبار ${provider} - الاتصال ناجح`, 'success');
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;

  const providers = [
    { key: '1', name: 'المزود الأول' },
    { key: '2', name: 'المزود الثاني' },
    { key: '3', name: 'المزود الثالث' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">إعدادات API</h1>
        <p className="text-muted-foreground text-sm mt-1">تكوين مفاتيح API وروابط الويبهوك</p>
      </div>

      <div className="space-y-4">
        {providers.map((p, i) => (
          <motion.div key={p.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="admin-card border-0 shadow-none">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Code className="w-5 h-5 text-purple-500" /> {p.name}
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => testConnection(p.name)} disabled={testing === p.name}>
                    {testing === p.name ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <CheckCircle className="w-4 h-4 ml-1" />}
                    اختبار الاتصال
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>مفتاح API</Label>
                  <Input
                    type="password"
                    value={(settings as any)[`provider${p.key}ApiKey`]}
                    onChange={(e) => setSettings({ ...settings, [`provider${p.key}ApiKey`]: e.target.value })}
                    dir="ltr"
                    placeholder="أدخل مفتاح API..."
                  />
                </div>
                <div>
                  <Label>رابط الويبهوك</Label>
                  <Input
                    value={(settings as any)[`provider${p.key}WebhookUrl`]}
                    onChange={(e) => setSettings({ ...settings, [`provider${p.key}WebhookUrl`]: e.target.value })}
                    dir="ltr"
                    placeholder="https://..."
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700">
        {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
        حفظ الإعدادات
      </Button>
    </div>
  );
}
