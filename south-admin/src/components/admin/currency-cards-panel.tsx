'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, set, remove, update, push } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAdminStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Save, Loader2, Plus, Trash2, Edit, CreditCard, Wallet, Coins,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CurrencyCard {
  id: string;
  code: string;
  name: string;
  symbol: string;
  color: string;
  icon: string;
  isActive: boolean;
  isCrypto: boolean;
  network?: string;
  walletAddress?: string;
  minDeposit?: number;
  minWithdraw?: number;
  exchangeRateToYER?: number;
}

const defaultCurrencies: Omit<CurrencyCard, 'id'>[] = [
  { code: 'USDT', name: 'تيثر', symbol: 'USDT', color: '#26A17B', icon: 'crypto', isActive: true, isCrypto: true, network: 'TRC20', walletAddress: '', minDeposit: 10, minWithdraw: 20 },
  { code: 'BTC', name: 'بيتكوين', symbol: '₿', color: '#F7931A', icon: 'crypto', isActive: false, isCrypto: true, network: 'Bitcoin', walletAddress: '', minDeposit: 0.0001, minWithdraw: 0.0002 },
  { code: 'ETH', name: 'إيثريوم', symbol: 'Ξ', color: '#627EEA', icon: 'crypto', isActive: false, isCrypto: true, network: 'ERC20', walletAddress: '', minDeposit: 0.001, minWithdraw: 0.002 },
  { code: 'AED', name: 'الدرهم الإماراتي', symbol: 'د.إ', color: '#007A3D', icon: 'fiat', isActive: false, isCrypto: false, exchangeRateToYER: 425 },
  { code: 'EUR', name: 'اليورو', symbol: '€', color: '#003399', icon: 'fiat', isActive: false, isCrypto: false, exchangeRateToYER: 1700 },
  { code: 'TRY', name: 'الليرة التركية', symbol: '₺', color: '#E30A17', icon: 'fiat', isActive: false, isCrypto: false, exchangeRateToYER: 45 },
  { code: 'OMR', name: 'الريال العماني', symbol: 'ر.ع', color: '#DB161B', icon: 'fiat', isActive: false, isCrypto: false, exchangeRateToYER: 4046 },
  { code: 'KWD', name: 'الدينار الكويتي', symbol: 'د.ك', color: '#007A3D', icon: 'fiat', isActive: false, isCrypto: false, exchangeRateToYER: 5070 },
];

export default function CurrencyCardsPanel() {
  const { showToast } = useAdminStore();
  const [currencies, setCurrencies] = useState<CurrencyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<Omit<CurrencyCard, 'id'>>({
    code: '', name: '', symbol: '', color: '#627EEA', icon: 'fiat', isActive: true, isCrypto: false, network: '', walletAddress: '', minDeposit: 0, minWithdraw: 0, exchangeRateToYER: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const curRef = ref(database, 'adminSettings/currencyCards');
    const unsub = onValue(curRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: CurrencyCard[] = Object.entries(data).map(([id, val]: [string, any]) => ({
          id, code: val.code || '', name: val.name || '', symbol: val.symbol || '', color: val.color || '#627EEA',
          icon: val.icon || 'fiat', isActive: val.isActive !== false, isCrypto: val.isCrypto || false,
          network: val.network || '', walletAddress: val.walletAddress || '', minDeposit: val.minDeposit || 0,
          minWithdraw: val.minWithdraw || 0, exchangeRateToYER: val.exchangeRateToYER || 0,
        }));
        setCurrencies(list);
      } else {
        // Initialize with defaults
        setCurrencies([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      showToast('يرجى إدخال رمز العملة واسمها', 'error');
      return;
    }
    setSaving(true);
    try {
      const id = editingId || `cur-${Date.now()}`;
      await set(ref(database, `adminSettings/currencyCards/${id}`), { ...form, id });
      showToast(editingId ? 'تم تحديث العملة' : 'تم إضافة العملة', 'success');
      setShowForm(false);
      setEditingId(null);
      resetForm();
    } catch {
      showToast('حدث خطأ', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(ref(database, `adminSettings/currencyCards/${id}`));
      showToast('تم حذف العملة', 'success');
    } catch {
      showToast('حدث خطأ', 'error');
    }
  };

  const handleToggle = async (cur: CurrencyCard) => {
    try {
      await update(ref(database, `adminSettings/currencyCards/${cur.id}`), { isActive: !cur.isActive });
      showToast(cur.isActive ? 'تم تعطيل العملة' : 'تم تفعيل العملة', 'success');
    } catch {
      showToast('حدث خطأ', 'error');
    }
  };

  const handleEdit = (cur: CurrencyCard) => {
    setEditingId(cur.id);
    setForm({
      code: cur.code, name: cur.name, symbol: cur.symbol, color: cur.color, icon: cur.icon,
      isActive: cur.isActive, isCrypto: cur.isCrypto, network: cur.network || '',
      walletAddress: cur.walletAddress || '', minDeposit: cur.minDeposit || 0,
      minWithdraw: cur.minWithdraw || 0, exchangeRateToYER: cur.exchangeRateToYER || 0,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({ code: '', name: '', symbol: '', color: '#627EEA', icon: 'fiat', isActive: true, isCrypto: false, network: '', walletAddress: '', minDeposit: 0, minWithdraw: 0, exchangeRateToYER: 0 });
  };

  const handleInitDefaults = async () => {
    setSaving(true);
    try {
      const updates: Record<string, any> = {};
      defaultCurrencies.forEach((cur, i) => {
        const id = `cur-default-${i}`;
        updates[id] = { ...cur, id };
      });
      await update(ref(database, 'adminSettings/currencyCards'), updates);
      showToast('تم إضافة العملات الافتراضية', 'success');
    } catch {
      showToast('حدث خطأ', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">بطاقات العملات</h1>
          <p className="text-muted-foreground text-sm mt-1">إضافة عملات رقمية وأجنبية مع رموزها</p>
        </div>
        <div className="flex gap-2">
          {currencies.length === 0 && (
            <Button onClick={handleInitDefaults} variant="outline" size="sm" disabled={saving}>
              إضافة الافتراضية
            </Button>
          )}
          <Button onClick={() => { setShowForm(!showForm); if (!showForm) { setEditingId(null); resetForm(); } }} size="sm">
            <Plus className="w-4 h-4 ml-1" />
            عملة جديدة
          </Button>
        </div>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Card className="admin-card border-0 shadow-none">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  {form.isCrypto ? <Coins className="w-5 h-5 text-purple-500" /> : <CreditCard className="w-5 h-5 text-purple-500" />}
                  {editingId ? 'تعديل العملة' : 'إضافة عملة جديدة'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>رمز العملة (مثال: USDT)</Label>
                    <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} dir="ltr" placeholder="USDT" />
                  </div>
                  <div>
                    <Label>اسم العملة (عربي)</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="تيثر" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>الرمز</Label>
                    <Input value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} dir="ltr" placeholder="$" />
                  </div>
                  <div>
                    <Label>اللون</Label>
                    <div className="flex gap-2">
                      <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-12 h-10 p-1" />
                      <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} dir="ltr" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-muted">
                  <div>
                    <p className="text-sm font-medium">عملة رقمية (كريبتو)</p>
                    <p className="text-xs text-muted-foreground">{form.isCrypto ? 'سيتم عرض خيارات الشبكة والمحفظة' : 'عملة ورقية تقليدية'}</p>
                  </div>
                  <Switch checked={form.isCrypto} onCheckedChange={(v) => setForm({ ...form, isCrypto: v })} />
                </div>

                {form.isCrypto && (
                  <>
                    <div>
                      <Label>الشبكة (مثال: TRC20, ERC20, BEP20)</Label>
                      <Input value={form.network} onChange={(e) => setForm({ ...form, network: e.target.value })} dir="ltr" placeholder="TRC20" />
                    </div>
                    <div>
                      <Label>عنوان المحفظة (للاستقبال)</Label>
                      <Input value={form.walletAddress} onChange={(e) => setForm({ ...form, walletAddress: e.target.value })} dir="ltr" placeholder="TJxR4f8mQb..." />
                    </div>
                  </>
                )}

                {!form.isCrypto && (
                  <div>
                    <Label>سعر الصرف إلى الريال اليمني</Label>
                    <Input type="number" value={form.exchangeRateToYER} onChange={(e) => setForm({ ...form, exchangeRateToYER: parseFloat(e.target.value) || 0 })} dir="ltr" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>الحد الأدنى للإيداع</Label>
                    <Input type="number" value={form.minDeposit} onChange={(e) => setForm({ ...form, minDeposit: parseFloat(e.target.value) || 0 })} dir="ltr" />
                  </div>
                  <div>
                    <Label>الحد الأدنى للسحب</Label>
                    <Input type="number" value={form.minWithdraw} onChange={(e) => setForm({ ...form, minWithdraw: parseFloat(e.target.value) || 0 })} dir="ltr" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving} className="flex-1 bg-purple-600 hover:bg-purple-700">
                    {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
                    {editingId ? 'تحديث' : 'إضافة'}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); resetForm(); }}>إلغاء</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Currency Cards Grid */}
      {currencies.length === 0 ? (
        <Card className="admin-card border-0 shadow-none">
          <CardContent className="p-8 text-center">
            <Wallet className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium text-muted-foreground">لا توجد عملات إضافية</p>
            <p className="text-xs text-muted-foreground mt-1">أضف عملات رقمية أو أجنبية أو استخدم الافتراضية</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {currencies.map((cur, i) => (
            <motion.div key={cur.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="admin-card border-0 shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: `${cur.color}20`, color: cur.color }}>
                      {cur.symbol || cur.code}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{cur.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground" dir="ltr">{cur.code}</span>
                        {cur.isCrypto && <Badge variant="outline" className="text-[9px]">كريبتو</Badge>}
                      </div>
                    </div>
                    <Badge className={cur.isActive ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}>
                      {cur.isActive ? 'نشط' : 'معطل'}
                    </Badge>
                  </div>

                  {cur.isCrypto && cur.network && (
                    <p className="text-xs text-muted-foreground mb-1">الشبكة: {cur.network}</p>
                  )}
                  {cur.isCrypto && cur.walletAddress && (
                    <p className="text-[10px] text-muted-foreground truncate mb-1" dir="ltr">العنوان: {cur.walletAddress}</p>
                  )}
                  {!cur.isCrypto && cur.exchangeRateToYER ? (
                    <p className="text-xs text-muted-foreground mb-1">السعر: 1 {cur.code} = {cur.exchangeRateToYER} ر.ي</p>
                  ) : null}

                  <div className="flex items-center gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(cur)}>
                      <Edit className="w-3 h-3 ml-1" /> تعديل
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleToggle(cur)}>
                      {cur.isActive ? 'تعطيل' : 'تفعيل'}
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-500" onClick={() => handleDelete(cur.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
