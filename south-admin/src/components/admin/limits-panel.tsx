'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, update, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAdminStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Loader2, RefreshCw } from 'lucide-react';

interface LimitConfig {
  minDeposit: number;
  maxDeposit: number;
  dailyDepositLimit: number;
  minWithdraw: number;
  maxWithdraw: number;
  dailyWithdrawLimit: number;
  minTransfer: number;
  maxTransfer: number;
  dailyTransferLimit: number;
}

const defaultLimits: LimitConfig = {
  minDeposit: 500,
  maxDeposit: 5000000,
  dailyDepositLimit: 10000000,
  minWithdraw: 1000,
  maxWithdraw: 2000000,
  dailyWithdrawLimit: 5000000,
  minTransfer: 100,
  maxTransfer: 1000000,
  dailyTransferLimit: 3000000,
};

export default function LimitsPanel() {
  const { showToast } = useAdminStore();
  const [limits, setLimits] = useState<LimitConfig>(defaultLimits);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const limitsRef = ref(database, 'adminSettings/limits');
    const unsub = onValue(limitsRef, (snapshot) => {
      if (snapshot.exists()) {
        setLimits({ ...defaultLimits, ...snapshot.val() });
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await update(ref(database, 'adminSettings/limits'), limits);
      showToast('تم حفظ إعدادات السقوف بنجاح', 'success');
    } catch (e) {
      showToast('حدث خطأ في حفظ الإعدادات', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateLimit = (key: keyof LimitConfig, value: string) => {
    const num = parseInt(value) || 0;
    setLimits(prev => ({ ...prev, [key]: num }));
  };

  const resetDefaults = () => {
    setLimits(defaultLimits);
    showToast('تم استعادة القيم الافتراضية', 'info');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة السقوف والحدود</h1>
          <p className="text-muted-foreground text-sm mt-1">تحديد الحدود الدنيا والقصوى للإيداع والسحب والتحويل</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetDefaults}>
            <RefreshCw className="w-4 h-4 ml-1" /> استعادة الافتراضي
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 ml-1" /> {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        </div>
      </div>

      {/* Deposit Limits */}
      <Card className="border-green-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ArrowDownCircle className="w-5 h-5 text-green-500" />
            سقف الإيداع
            <Badge className="bg-green-500/20 text-green-600 text-xs">YER</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">الحد الأدنى للإيداع</label>
              <Input type="number" value={limits.minDeposit} onChange={(e) => updateLimit('minDeposit', e.target.value)} min={0} />
              <p className="text-xs text-muted-foreground">أقل مبلغ يمكن إيداعه في العملية الواحدة</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">الحد الأقصى للإيداع</label>
              <Input type="number" value={limits.maxDeposit} onChange={(e) => updateLimit('maxDeposit', e.target.value)} min={0} />
              <p className="text-xs text-muted-foreground">أعلى مبلغ يمكن إيداعه في العملية الواحدة</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">السقف اليومي للإيداع</label>
              <Input type="number" value={limits.dailyDepositLimit} onChange={(e) => updateLimit('dailyDepositLimit', e.target.value)} min={0} />
              <p className="text-xs text-muted-foreground">أقصى إجمالي إيداع في اليوم للمستخدم الواحد</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdraw Limits */}
      <Card className="border-orange-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ArrowUpCircle className="w-5 h-5 text-orange-500" />
            سقف السحب
            <Badge className="bg-orange-500/20 text-orange-600 text-xs">YER</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">الحد الأدنى للسحب</label>
              <Input type="number" value={limits.minWithdraw} onChange={(e) => updateLimit('minWithdraw', e.target.value)} min={0} />
              <p className="text-xs text-muted-foreground">أقل مبلغ يمكن سحبه في العملية الواحدة</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">الحد الأقصى للسحب</label>
              <Input type="number" value={limits.maxWithdraw} onChange={(e) => updateLimit('maxWithdraw', e.target.value)} min={0} />
              <p className="text-xs text-muted-foreground">أعلى مبلغ يمكن سحبه في العملية الواحدة</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">السقف اليومي للسحب</label>
              <Input type="number" value={limits.dailyWithdrawLimit} onChange={(e) => updateLimit('dailyWithdrawLimit', e.target.value)} min={0} />
              <p className="text-xs text-muted-foreground">أقصى إجمالي سحب في اليوم للمستخدم الواحد</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transfer Limits */}
      <Card className="border-blue-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ArrowLeftRight className="w-5 h-5 text-blue-500" />
            سقف التحويل بين المستخدمين
            <Badge className="bg-blue-500/20 text-blue-600 text-xs">YER</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">الحد الأدنى للتحويل</label>
              <Input type="number" value={limits.minTransfer} onChange={(e) => updateLimit('minTransfer', e.target.value)} min={0} />
              <p className="text-xs text-muted-foreground">أقل مبلغ يمكن تحويله في العملية الواحدة</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">الحد الأقصى للتحويل</label>
              <Input type="number" value={limits.maxTransfer} onChange={(e) => updateLimit('maxTransfer', e.target.value)} min={0} />
              <p className="text-xs text-muted-foreground">أعلى مبلغ يمكن تحويله في العملية الواحدة</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">السقف اليومي للتحويل</label>
              <Input type="number" value={limits.dailyTransferLimit} onChange={(e) => updateLimit('dailyTransferLimit', e.target.value)} min={0} />
              <p className="text-xs text-muted-foreground">أقصى إجمالي تحويل في اليوم للمستخدم الواحد</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              هذه الحدود تنطبق على جميع المستخدمين. يتم تخزينها في مسار <code className="bg-muted px-1.5 py-0.5 rounded text-xs">adminSettings/limits</code> في Firebase.
            </p>
            <p className="text-sm text-muted-foreground">
              يجب أن يكون الحد الأدنى أقل من الحد الأقصى، والحد الأقصى أقل من السقف اليومي لكل عملية.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
