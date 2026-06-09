'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAdminStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VisibilityPanel() {
  const { showToast } = useAdminStore();
  const [visibility, setVisibility] = useState<Record<string, boolean>>({
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const ref_ = ref(database, 'adminSettings/visibility');
    const unsub = onValue(ref_, (snapshot) => {
      const data = snapshot.val() || {};
      setVisibility({
        transfer: data.transfer !== false,
        exchange: data.exchange !== false,
        deposit: data.deposit !== false,
        withdraw: data.withdraw !== false,
        kyc: data.kyc !== false,
        support: data.support !== false,
        giftCodes: data.giftCodes !== false,
        promoCodes: data.promoCodes !== false,
        savings: data.savings !== false,
        investments: data.investments !== false,
      });
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await update(ref(database, 'adminSettings/visibility'), visibility);
      showToast('تم حفظ إعدادات الظهور', 'success');
    } catch (e) { showToast('حدث خطأ', 'error'); }
    finally { setSaving(false); }
  };

  const items = [
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
        <p className="text-muted-foreground text-sm mt-1">التحكم بإظهار وإخفاء الميزات</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="admin-card border-0 shadow-none">
          <CardContent className="p-6 space-y-4">
            {items.map((item) => (
              <div key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  {visibility[item.key] ? (
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
                  checked={visibility[item.key]}
                  onCheckedChange={(checked) => setVisibility({ ...visibility, [item.key]: checked })}
                />
              </div>
            ))}

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
