'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, update, set, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAdminStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Loader2, Code, CheckCircle, XCircle, RefreshCw, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ApiSettingsPanel() {
  const { showToast } = useAdminStore();
  const [exchangeRateUrl, setExchangeRateUrl] = useState('https://api.yemen-rate.com/v1/rates');
  const [syncInterval, setSyncInterval] = useState('15');
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [manualOverrides, setManualOverrides] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; data?: any; error?: string } | null>(null);
  const [currentRates, setCurrentRates] = useState<Record<string, any>>({});

  // Provider API settings
  const [providerSettings, setProviderSettings] = useState({
    provider1ApiKey: '',
    provider1WebhookUrl: '',
    provider2ApiKey: '',
    provider2WebhookUrl: '',
    provider3ApiKey: '',
    provider3WebhookUrl: '',
  });

  useEffect(() => {
    const configRef = ref(database, 'ownerSettings/projectConfig');
    const unsub1 = onValue(configRef, (snapshot) => {
      const data = snapshot.val() || {};
      setProviderSettings({
        provider1ApiKey: data.provider1ApiKey || '',
        provider1WebhookUrl: data.provider1WebhookUrl || '',
        provider2ApiKey: data.provider2ApiKey || '',
        provider2WebhookUrl: data.provider2WebhookUrl || '',
        provider3ApiKey: data.provider3ApiKey || '',
        provider3WebhookUrl: data.provider3WebhookUrl || '',
      });
    });

    const apiRef = ref(database, 'adminSettings/apiSettings');
    const unsub2 = onValue(apiRef, (snapshot) => {
      const data = snapshot.val() || {};
      setExchangeRateUrl(data.exchangeRateUrl || 'https://api.yemen-rate.com/v1/rates');
      setSyncInterval(String(data.exchangeRateSyncInterval || '15'));
      setSyncEnabled(data.syncEnabled || false);
      setManualOverrides(data.manualOverrides || {});
    });

    const ratesRef = ref(database, 'adminSettings/exchangeRates');
    const unsub3 = onValue(ratesRef, (snapshot) => {
      setCurrentRates(snapshot.val() || {});
      setLoading(false);
    });

    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  const handleSaveProviderSettings = async () => {
    setSaving(true);
    try {
      await update(ref(database, 'ownerSettings/projectConfig'), providerSettings);
      showToast('تم حفظ إعدادات API للمزودين', 'success');
    } catch (e) { showToast('حدث خطأ', 'error'); }
    finally { setSaving(false); }
  };

  const handleSaveExchangeRateSettings = async () => {
    setSaving(true);
    try {
      await set(ref(database, 'adminSettings/apiSettings'), {
        exchangeRateUrl,
        exchangeRateSyncInterval: parseInt(syncInterval) || 15,
        syncEnabled,
        manualOverrides,
      });
      showToast('تم حفظ إعدادات أسعار الصرف', 'success');
    } catch (e) { showToast('حدث خطأ', 'error'); }
    finally { setSaving(false); }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch(exchangeRateUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setTestResult({ success: true, data });

      // Save fetched rates
      await set(ref(database, 'adminSettings/exchangeRates'), data);
      setCurrentRates(data);
      showToast('تم جلب الأسعار بنجاح', 'success');
    } catch (e: any) {
      setTestResult({ success: false, error: e.message });
      showToast('فشل الاتصال', 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveOverrides = async () => {
    try {
      await update(ref(database, 'adminSettings/apiSettings'), { manualOverrides });
      await update(ref(database, 'adminSettings/exchangeRates'), manualOverrides);
      showToast('تم حفظ الأسعار اليدوية', 'success');
    } catch (e) { showToast('حدث خطأ', 'error'); }
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
        <p className="text-muted-foreground text-sm mt-1">تكوين مفاتيح API وأسعار الصرف</p>
      </div>

      <Tabs defaultValue="exchange-rate">
        <TabsList className="w-full">
          <TabsTrigger value="exchange-rate" className="flex-1">أسعار الصرف</TabsTrigger>
          <TabsTrigger value="providers" className="flex-1">مفاتيح المزودين</TabsTrigger>
        </TabsList>

        <TabsContent value="exchange-rate" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="admin-card border-0 shadow-none">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-purple-500" /> إعدادات أسعار الصرف
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>رابط API لأسعار الصرف</Label>
                  <Input value={exchangeRateUrl} onChange={(e) => setExchangeRateUrl(e.target.value)} dir="ltr" placeholder="https://api.yemen-rate.com/v1/rates" />
                </div>

                <div>
                  <Label>فترة المزامنة التلقائية</Label>
                  <Select value={syncInterval} onValueChange={setSyncInterval}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">كل 5 دقائق</SelectItem>
                      <SelectItem value="15">كل 15 دقيقة</SelectItem>
                      <SelectItem value="30">كل 30 دقيقة</SelectItem>
                      <SelectItem value="60">كل ساعة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-muted">
                  <div>
                    <p className="text-sm font-medium">تفعيل المزامنة التلقائية</p>
                    <p className="text-xs text-muted-foreground">تحديث الأسعار تلقائيا من API</p>
                  </div>
                  <Switch checked={syncEnabled} onCheckedChange={setSyncEnabled} />
                </div>

                <Button onClick={handleTestConnection} disabled={testing} variant="outline" className="w-full">
                  {testing ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <RefreshCw className="w-4 h-4 ml-2" />}
                  اختبار الاتصال وجلب الأسعار
                </Button>

                {testResult && (
                  <div className={`p-3 rounded-xl ${testResult.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {testResult.success ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                      <span className="text-sm font-medium">{testResult.success ? 'الاتصال ناجح' : 'الاتصال فشل'}</span>
                    </div>
                    {testResult.success && testResult.data && (
                      <pre className="text-xs bg-muted p-2 rounded-lg overflow-auto max-h-40" dir="ltr">{JSON.stringify(testResult.data, null, 2)}</pre>
                    )}
                    {testResult.error && <p className="text-xs text-red-500">{testResult.error}</p>}
                  </div>
                )}

                <Button onClick={handleSaveExchangeRateSettings} disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700">
                  {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
                  حفظ إعدادات أسعار الصرف
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Current Rates Display */}
          {Object.keys(currentRates).length > 0 && (
            <Card className="admin-card border-0 shadow-none">
              <CardHeader>
                <CardTitle className="text-base">الأسعار الحالية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(currentRates).map(([key, value]) => (
                    <div key={key} className="p-3 rounded-xl bg-muted text-center">
                      <p className="text-xs text-muted-foreground">{key}</p>
                      <p className="font-bold">{typeof value === 'number' ? value.toFixed(2) : String(value)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Manual Overrides */}
          <Card className="admin-card border-0 shadow-none">
            <CardHeader>
              <CardTitle className="text-base">تجاوز الأسعار يدويا</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">أدخل قيم الأسعار لتجاوز القيم من API</p>
              {['YER_USD', 'YER_SAR', 'SAR_USD'].map(key => (
                <div key={key} className="flex items-center gap-3">
                  <Label className="w-24 text-xs">{key}</Label>
                  <Input type="number" value={manualOverrides[key] || ''} onChange={(e) => setManualOverrides(p => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))} dir="ltr" className="flex-1" />
                </div>
              ))}
              <Button onClick={handleSaveOverrides} variant="outline" size="sm">حفظ التجاوزات</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          {providers.map((p, i) => (
            <motion.div key={p.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="admin-card border-0 shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Code className="w-5 h-5 text-purple-500" /> {p.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div><Label>مفتاح API</Label><Input type="password" value={(providerSettings as any)[`provider${p.key}ApiKey`]} onChange={(e) => setProviderSettings({ ...providerSettings, [`provider${p.key}ApiKey`]: e.target.value })} dir="ltr" /></div>
                  <div><Label>رابط الويبهوك</Label><Input value={(providerSettings as any)[`provider${p.key}WebhookUrl`]} onChange={(e) => setProviderSettings({ ...providerSettings, [`provider${p.key}WebhookUrl`]: e.target.value })} dir="ltr" /></div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          <Button onClick={handleSaveProviderSettings} disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700">
            {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
            حفظ إعدادات المزودين
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
