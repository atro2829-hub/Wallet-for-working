'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, push, update, remove, set } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAdminStore } from '@/lib/store';
import { formatNumber, currencySymbols, generateId } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Edit, Percent, TrendingUp, Search, Loader2, Bitcoin, Landmark } from 'lucide-react';
import { motion } from 'framer-motion';

interface CommissionRule {
  id?: string;
  packageId: string;
  packageName: string;
  providerId: string;
  providerName: string;
  type: 'percentage' | 'fixed';
  value: number;
  currency?: string;
  isActive: boolean;
}

interface CryptoCommission {
  buyPercentage: number;
  sellPercentage: number;
  minFee: number;
  maxFee: number;
  feeCurrency: string;
}

interface InvestmentCommission {
  percentage: number;
  minFee: number;
  maxFee: number;
  feeCurrency: string;
}

export default function CommissionsPanel() {
  const { adminUser, showToast } = useAdminStore();
  const [commissions, setCommissions] = useState<CommissionRule[]>([]);
  const [cryptoCommission, setCryptoCommission] = useState<CryptoCommission>({
    buyPercentage: 1, sellPercentage: 1, minFee: 0, maxFee: 0, feeCurrency: 'YER',
  });
  const [investmentCommission, setInvestmentCommission] = useState<InvestmentCommission>({
    percentage: 5, minFee: 0, maxFee: 0, feeCurrency: 'YER',
  });
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<CommissionRule | null>(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Form state
  const [formPackageId, setFormPackageId] = useState('');
  const [formPackageName, setFormPackageName] = useState('');
  const [formProviderId, setFormProviderId] = useState('');
  const [formProviderName, setFormProviderName] = useState('');
  const [formType, setFormType] = useState<'percentage' | 'fixed'>('percentage');
  const [formValue, setFormValue] = useState('');
  const [formCurrency, setFormCurrency] = useState('YER');
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    const commRef = ref(database, 'adminSettings/commissions');
    const unsub1 = onValue(commRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list: CommissionRule[] = [];
      Object.entries(data).forEach(([id, val]: [string, any]) => {
        if (id !== '_global' && id !== 'crypto' && id !== 'investment') {
          list.push({ id, ...val });
        }
      });
      setCommissions(list);

      // Load crypto commission
      const cryptoData = data.crypto as CryptoCommission | undefined;
      if (cryptoData) setCryptoCommission(cryptoData);

      // Load investment commission
      const investData = data.investment as InvestmentCommission | undefined;
      if (investData) setInvestmentCommission(investData);

      setLoading(false);
    });
    return () => unsub1();
  }, []);

  const resetForm = () => {
    setFormPackageId(''); setFormPackageName(''); setFormProviderId('');
    setFormProviderName(''); setFormType('percentage'); setFormValue('');
    setFormCurrency('YER'); setFormIsActive(true); setEditing(null);
  };

  const handleSave = async () => {
    if (!formPackageName || !formValue) {
      showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
      return;
    }
    try {
      const data: CommissionRule = {
        packageId: formPackageId || generateId(),
        packageName: formPackageName,
        providerId: formProviderId || 'default',
        providerName: formProviderName || 'عام',
        type: formType,
        value: parseFloat(formValue) || 0,
        currency: formType === 'fixed' ? formCurrency : undefined,
        isActive: formIsActive,
      };
      if (editing?.id) {
        await update(ref(database, `adminSettings/commissions/${editing.id}`), data);
        showToast('تم تحديث العمولة', 'success');
      } else {
        await push(ref(database, 'adminSettings/commissions'), data);
        showToast('تم إضافة العمولة', 'success');
      }
      setDialog(false);
      resetForm();
    } catch (e) { showToast('حدث خطأ', 'error'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(ref(database, `adminSettings/commissions/${id}`));
      showToast('تم حذف العمولة', 'success');
    } catch (e) { showToast('حدث خطأ', 'error'); }
  };

  const handleSaveCryptoCommission = async () => {
    setSaving(true);
    try {
      await set(ref(database, 'adminSettings/commissions/crypto'), cryptoCommission);
      showToast('تم حفظ عمولات الكريبتو', 'success');
    } catch (e) { showToast('حدث خطأ', 'error'); }
    finally { setSaving(false); }
  };

  const handleSaveInvestmentCommission = async () => {
    setSaving(true);
    try {
      await set(ref(database, 'adminSettings/commissions/investment'), investmentCommission);
      showToast('تم حفظ عمولات الاستثمار', 'success');
    } catch (e) { showToast('حدث خطأ', 'error'); }
    finally { setSaving(false); }
  };

  const filteredCommissions = commissions.filter((c) => {
    return !search || c.packageName?.includes(search) || c.providerName?.includes(search);
  });

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ضبط العمولات</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة عمولات المنتجات والخدمات والكريبتو والاستثمار</p>
        </div>
        <Button onClick={() => { resetForm(); setDialog(true); }} size="sm">
          <Plus className="w-4 h-4 ml-1" /> عمولة جديدة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="admin-card border-0 shadow-none">
            <CardContent className="p-4 text-center">
              <Percent className="w-6 h-6 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">{formatNumber(commissions.filter(c => c.isActive).length)}</p>
              <p className="text-xs text-muted-foreground">عمولة نشطة</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="admin-card border-0 shadow-none">
            <CardContent className="p-4 text-center">
              <Bitcoin className="w-6 h-6 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold">{cryptoCommission.buyPercentage}%</p>
              <p className="text-xs text-muted-foreground">عمولة شراء كريبتو</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="admin-card border-0 shadow-none">
            <CardContent className="p-4 text-center">
              <Landmark className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{investmentCommission.percentage}%</p>
              <p className="text-xs text-muted-foreground">عمولة استثمار</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="rules">
        <TabsList className="w-full">
          <TabsTrigger value="rules" className="flex-1">قواعد العمولات</TabsTrigger>
          <TabsTrigger value="crypto" className="flex-1">عمولات الكريبتو</TabsTrigger>
          <TabsTrigger value="investment" className="flex-1">عمولات الاستثمار</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="بحث بالاسم..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
          </div>
          <div className="space-y-3 max-h-[calc(100vh-480px)] overflow-y-auto scrollbar-thin">
            {filteredCommissions.map((comm, i) => (
              <motion.div key={comm.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                <Card className="admin-card border-0 shadow-none">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: comm.type === 'percentage' ? 'rgba(34,197,94,0.1)' : 'rgba(249,115,22,0.1)' }}>
                          {comm.type === 'percentage' ? <Percent className="w-5 h-5 text-green-500" /> : <span className="text-sm font-bold text-orange-500">{currencySymbols[comm.currency || 'YER']}</span>}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{comm.packageName}</p>
                          <p className="text-xs text-muted-foreground">{comm.providerName} - {comm.type === 'percentage' ? `${comm.value}%` : `${comm.value} ${currencySymbols[comm.currency || 'YER']}`}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={comm.isActive ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'}>{comm.isActive ? 'نشط' : 'معطل'}</Badge>
                        <Button variant="ghost" size="sm" onClick={() => { update(ref(database, `adminSettings/commissions/${comm.id}`), { isActive: !comm.isActive }); }}><Switch checked={comm.isActive} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditing(comm); setFormPackageId(comm.packageId); setFormPackageName(comm.packageName);
                          setFormProviderId(comm.providerId); setFormProviderName(comm.providerName);
                          setFormType(comm.type); setFormValue(String(comm.value));
                          setFormCurrency(comm.currency || 'YER'); setFormIsActive(comm.isActive);
                          setDialog(true);
                        }}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => comm.id && handleDelete(comm.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {filteredCommissions.length === 0 && <p className="text-center text-muted-foreground py-8">لا توجد عمولات</p>}
          </div>
        </TabsContent>

        <TabsContent value="crypto" className="space-y-4">
          <Card className="admin-card border-0 shadow-none">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bitcoin className="w-5 h-5 text-orange-500" /> عمولات معاملات الكريبتو
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">يتم تطبيق هذه العمولات على جميع معاملات الشراء والبيع للعملات الرقمية</p>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>عمولة الشراء (%)</Label><Input type="number" value={cryptoCommission.buyPercentage} onChange={(e) => setCryptoCommission(p => ({ ...p, buyPercentage: parseFloat(e.target.value) || 0 }))} dir="ltr" /></div>
                <div><Label>عمولة البيع (%)</Label><Input type="number" value={cryptoCommission.sellPercentage} onChange={(e) => setCryptoCommission(p => ({ ...p, sellPercentage: parseFloat(e.target.value) || 0 }))} dir="ltr" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>الحد الأدنى للرسوم</Label><Input type="number" value={cryptoCommission.minFee} onChange={(e) => setCryptoCommission(p => ({ ...p, minFee: parseFloat(e.target.value) || 0 }))} dir="ltr" /></div>
                <div><Label>الحد الأقصى للرسوم</Label><Input type="number" value={cryptoCommission.maxFee} onChange={(e) => setCryptoCommission(p => ({ ...p, maxFee: parseFloat(e.target.value) || 0 }))} dir="ltr" /></div>
              </div>
              <div><Label>عملة الرسوم</Label>
                <Select value={cryptoCommission.feeCurrency} onValueChange={(v) => setCryptoCommission(p => ({ ...p, feeCurrency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YER">ريال يمني</SelectItem>
                    <SelectItem value="SAR">ريال سعودي</SelectItem>
                    <SelectItem value="USD">دولار</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSaveCryptoCommission} disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700">
                {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : null}
                حفظ عمولات الكريبتو
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investment" className="space-y-4">
          <Card className="admin-card border-0 shadow-none">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Landmark className="w-5 h-5 text-green-500" /> عمولات خطط الاستثمار
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">يتم تطبيق هذه العمولة على أرباح الاستثمار عند الإكمال</p>
              <div><Label>نسبة العمولة على الأرباح (%)</Label><Input type="number" value={investmentCommission.percentage} onChange={(e) => setInvestmentCommission(p => ({ ...p, percentage: parseFloat(e.target.value) || 0 }))} dir="ltr" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>الحد الأدنى للرسوم</Label><Input type="number" value={investmentCommission.minFee} onChange={(e) => setInvestmentCommission(p => ({ ...p, minFee: parseFloat(e.target.value) || 0 }))} dir="ltr" /></div>
                <div><Label>الحد الأقصى للرسوم</Label><Input type="number" value={investmentCommission.maxFee} onChange={(e) => setInvestmentCommission(p => ({ ...p, maxFee: parseFloat(e.target.value) || 0 }))} dir="ltr" /></div>
              </div>
              <div><Label>عملة الرسوم</Label>
                <Select value={investmentCommission.feeCurrency} onValueChange={(v) => setInvestmentCommission(p => ({ ...p, feeCurrency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YER">ريال يمني</SelectItem>
                    <SelectItem value="SAR">ريال سعودي</SelectItem>
                    <SelectItem value="USD">دولار</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSaveInvestmentCommission} disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700">
                {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : null}
                حفظ عمولات الاستثمار
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Commission Dialog */}
      <Dialog open={dialog} onOpenChange={(open) => { setDialog(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'تعديل العمولة' : 'إضافة عمولة'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>اسم الباقة / الخدمة</Label><Input value={formPackageName} onChange={(e) => setFormPackageName(e.target.value)} placeholder="اسم الباقة أو الخدمة" /></div>
            <div><Label>اسم المزود</Label><Input value={formProviderName} onChange={(e) => setFormProviderName(e.target.value)} placeholder="اسم المزود" /></div>
            <div><Label>نوع العمولة</Label>
              <Select value={formType} onValueChange={(v: any) => setFormType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">نسبة مئوية</SelectItem>
                  <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>القيمة {formType === 'percentage' ? '(%)' : ''}</Label><Input type="number" value={formValue} onChange={(e) => setFormValue(e.target.value)} dir="ltr" /></div>
            {formType === 'fixed' && (
              <div><Label>العملة</Label>
                <Select value={formCurrency} onValueChange={setFormCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YER">ريال يمني</SelectItem>
                    <SelectItem value="SAR">ريال سعودي</SelectItem>
                    <SelectItem value="USD">دولار</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center gap-2"><Switch checked={formIsActive} onCheckedChange={setFormIsActive} /><Label>نشط</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialog(false); resetForm(); }}>إلغاء</Button>
            <Button onClick={handleSave}>{editing ? 'تحديث' : 'إضافة'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
