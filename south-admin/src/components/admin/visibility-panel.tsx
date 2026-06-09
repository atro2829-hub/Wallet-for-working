'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAdminStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, Loader2, Eye, EyeOff, Layers, Server, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface SectionMeta {
  id: string;
  name: string;
  categoryId: string;
}

interface ProviderMeta {
  id: string;
  name: string;
  categoryId: string;
}

export default function VisibilityPanel() {
  const { showToast } = useAdminStore();

  // Visibility state — mirrors adminSettings/visibility/{sections,providers,features}
  const [sections, setSections] = useState<Record<string, boolean>>({});
  const [providers, setProviders] = useState<Record<string, boolean>>({});
  const [features, setFeatures] = useState<Record<string, boolean>>({
    transfer: true,
    exchange: true,
    deposit: true,
    withdraw: true,
    kyc: true,
    support: true,
    giftCodes: true,
    promoCodes: true,
    savings: true,
    investments: true,
  });

  // Metadata for display names (from ownerSettings/sections and providers)
  const [sectionMeta, setSectionMeta] = useState<SectionMeta[]>([]);
  const [providerMeta, setProviderMeta] = useState<ProviderMeta[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Read visibility settings from adminSettings/visibility
  useEffect(() => {
    const visRef = ref(database, 'adminSettings/visibility');
    const unsub = onValue(visRef, (snapshot) => {
      const data = snapshot.val() || {};
      const secData = data.sections || {};
      const provData = data.providers || {};
      const featData = data.features || {};

      setSections(secData);
      setProviders(provData);
      setFeatures({
        transfer: featData.transfer !== false,
        exchange: featData.exchange !== false,
        deposit: featData.deposit !== false,
        withdraw: featData.withdraw !== false,
        kyc: featData.kyc !== false,
        support: featData.support !== false,
        giftCodes: featData.giftCodes !== false,
        promoCodes: featData.promoCodes !== false,
        savings: featData.savings !== false,
        investments: featData.investments !== false,
      });
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Read section metadata from ownerSettings/sections
  useEffect(() => {
    const secRef = ref(database, 'ownerSettings/sections');
    const unsub = onValue(secRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([id, val]: [string, any]) => ({
        id,
        name: val.name || id,
        categoryId: val.categoryId || id,
      }));
      setSectionMeta(list);
    });
    return () => unsub();
  }, []);

  // Read provider metadata from providers
  useEffect(() => {
    const provRef = ref(database, 'providers');
    const unsub = onValue(provRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([id, val]: [string, any]) => ({
        id,
        name: val.name || id,
        categoryId: val.categoryId || '',
      }));
      setProviderMeta(list);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: Record<string, any> = {};

      // Write sections visibility
      Object.entries(sections).forEach(([key, val]) => {
        updates[`adminSettings/visibility/sections/${key}`] = val;
      });

      // Write providers visibility
      Object.entries(providers).forEach(([key, val]) => {
        updates[`adminSettings/visibility/providers/${key}`] = val;
      });

      // Write features visibility
      Object.entries(features).forEach(([key, val]) => {
        updates[`adminSettings/visibility/features/${key}`] = val;
      });

      await update(ref(database), updates);
      showToast('تم حفظ إعدادات الظهور', 'success');
    } catch (e) {
      showToast('حدث خطأ', 'error');
    } finally {
      setSaving(false);
    }
  };

  const featureItems = [
    { key: 'transfer', label: 'التحويل', desc: 'إظهار أو إخفاء ميزة التحويل' },
    { key: 'exchange', label: 'الصرف', desc: 'إظهار أو إخفاء ميزة الصرف' },
    { key: 'deposit', label: 'الإيداع', desc: 'إظهار أو إخفاء ميزة الإيداع' },
    { key: 'withdraw', label: 'السحب', desc: 'إظهار أو إخفاء ميزة السحب' },
    { key: 'kyc', label: 'التحقق', desc: 'إظهار أو إخفاء ميزة التحقق' },
    { key: 'support', label: 'الدعم', desc: 'إظهار أو إخفاء الدعم المباشر' },
    { key: 'giftCodes', label: 'أكواد الهدايا', desc: 'إظهار أو إخفاء أكواد الهدايا' },
    { key: 'promoCodes', label: 'أكواد الخصم', desc: 'إظهار أو إخفاء أكواد الخصم' },
    { key: 'savings', label: 'التوفير', desc: 'إظهار أو إخفاء ميزة التوفير' },
    { key: 'investments', label: 'الاستثمار', desc: 'إظهار أو إخفاء ميزة الاستثمار' },
  ];

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">إعدادات الظهور</h1>
        <p className="text-muted-foreground text-sm mt-1">التحكم بإظهار وإخفاء الأقسام والمزودين والميزات</p>
      </div>

      {/* Sections Visibility */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="admin-card border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-500" />
              ظهور الأقسام
            </CardTitle>
            <p className="text-xs text-muted-foreground">إظهار أو إخفاء الأقسام للمستخدمين</p>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-3">
            {sectionMeta.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">لا توجد أقسام. أضف أقسام من لوحة إدارة الأقسام.</p>
            )}
            {sectionMeta.map((sec) => {
              const key = sec.categoryId || sec.id;
              const isVisible = sections[key] !== false;
              return (
                <div key={sec.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-3">
                    {isVisible ? (
                      <Eye className="w-5 h-5 text-green-500" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{sec.name}</p>
                      <p className="text-xs text-muted-foreground">المعرف: {key}</p>
                    </div>
                  </div>
                  <Switch
                    checked={isVisible}
                    onCheckedChange={(checked) => setSections({ ...sections, [key]: checked })}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* Providers Visibility */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="admin-card border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-500" />
              ظهور المزودين
            </CardTitle>
            <p className="text-xs text-muted-foreground">إظهار أو إخفاء المزودين للمستخدمين</p>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-3">
            {providerMeta.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">لا يوجد مزودون. أضف مزودين من لوحة إدارة المزودين.</p>
            )}
            {providerMeta.map((prov) => {
              const key = prov.id;
              const isVisible = providers[key] !== false;
              return (
                <div key={prov.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-3">
                    {isVisible ? (
                      <Eye className="w-5 h-5 text-green-500" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{prov.name}</p>
                      <p className="text-xs text-muted-foreground">المعرف: {key}</p>
                    </div>
                  </div>
                  <Switch
                    checked={isVisible}
                    onCheckedChange={(checked) => setProviders({ ...providers, [key]: checked })}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* Features Visibility */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="admin-card border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              ظهور الميزات
            </CardTitle>
            <p className="text-xs text-muted-foreground">إظهار أو إخفاء الميزات للمستخدمين</p>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-3">
            {featureItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  {features[item.key] ? (
                    <Eye className="w-5 h-5 text-green-500" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <Switch
                  checked={features[item.key]}
                  onCheckedChange={(checked) => setFeatures({ ...features, [item.key]: checked })}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700">
        {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
        حفظ الإعدادات
      </Button>
    </div>
  );
}
