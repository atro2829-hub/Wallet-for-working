'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAdminStore } from '@/lib/store';
import { formatNumber, generateId } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Search, Plus, Edit, Trash2, Package, Server } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProvidersPanel() {
  const { adminUser, showToast } = useAdminStore();
  const [providers, setProviders] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [providerDialog, setProviderDialog] = useState(false);
  const [packageDialog, setPackageDialog] = useState(false);
  const [editingProvider, setEditingProvider] = useState<any>(null);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [selectedProviderId, setSelectedProviderId] = useState('');

  // Provider form
  const [provName, setProvName] = useState('');
  const [provCategory, setProvCategory] = useState('telecom');
  const [provColor, setProvColor] = useState('#6C3CE1');
  const [provIcon, setProvIcon] = useState('');
  const [provInputLabel, setProvInputLabel] = useState('رقم الهاتف');
  const [provInputType, setProvInputType] = useState('phone');
  const [provActive, setProvActive] = useState(true);

  // Package form
  const [pkgName, setPkgName] = useState('');
  const [pkgPrice, setPkgPrice] = useState('');
  const [pkgCurrency, setPkgCurrency] = useState('YER');
  const [pkgExecution, setPkgExecution] = useState<'manual' | 'auto'>('manual');
  const [pkgActive, setPkgActive] = useState(true);

  useEffect(() => {
    const provRef = ref(database, 'providers');
    const unsub1 = onValue(provRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val }));
      setProviders(list);
    });
    const pkgRef = ref(database, 'packages');
    const unsub2 = onValue(pkgRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val }));
      setPackages(list);
      setLoading(false);
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  const resetProviderForm = () => {
    setProvName(''); setProvCategory('telecom'); setProvColor('#6C3CE1');
    setProvIcon(''); setProvInputLabel('رقم الهاتف'); setProvInputType('phone');
    setProvActive(true); setEditingProvider(null);
  };

  const resetPackageForm = () => {
    setPkgName(''); setPkgPrice(''); setPkgCurrency('YER');
    setPkgExecution('manual'); setPkgActive(true); setEditingPackage(null);
  };

  const saveProvider = async () => {
    if (!provName) return;
    try {
      const data = {
        name: provName, categoryId: provCategory, color: provColor, icon: provIcon,
        inputLabel: provInputLabel, inputType: provInputType, isActive: provActive,
      };
      if (editingProvider) {
        await update(ref(database, `providers/${editingProvider.id}`), data);
        showToast('تم تحديث المزود', 'success');
      } else {
        await push(ref(database, 'providers'), { ...data, id: generateId() });
        showToast('تم إضافة المزود', 'success');
      }
      setProviderDialog(false);
      resetProviderForm();
    } catch (e) { showToast('حدث خطأ', 'error'); }
  };

  const deleteProvider = async (id: string) => {
    try {
      await remove(ref(database, `providers/${id}`));
      showToast('تم حذف المزود', 'success');
    } catch (e) { showToast('حدث خطأ', 'error'); }
  };

  const savePackage = async () => {
    if (!pkgName || !pkgPrice || !selectedProviderId) return;
    try {
      const provider = providers.find(p => p.id === selectedProviderId);
      const data = {
        name: pkgName, price: parseFloat(pkgPrice), currency: pkgCurrency,
        executionType: pkgExecution, isActive: pkgActive, providerId: selectedProviderId,
        providerName: provider?.name || '',
      };
      if (editingPackage) {
        await update(ref(database, `packages/${editingPackage.id}`), data);
        showToast('تم تحديث الباقة', 'success');
      } else {
        await push(ref(database, 'packages'), { ...data, id: generateId() });
        showToast('تم إضافة الباقة', 'success');
      }
      setPackageDialog(false);
      resetPackageForm();
    } catch (e) { showToast('حدث خطأ', 'error'); }
  };

  const deletePackage = async (id: string) => {
    try {
      await remove(ref(database, `packages/${id}`));
      showToast('تم حذف الباقة', 'success');
    } catch (e) { showToast('حدث خطأ', 'error'); }
  };

  const filteredProviders = providers.filter(p =>
    !search || p.name?.includes(search) || p.categoryId?.includes(search)
  );

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">المزودون والباقات</h1>
          <p className="text-muted-foreground text-sm mt-1">{formatNumber(providers.length)} مزود</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { resetProviderForm(); setProviderDialog(true); }} size="sm">
            <Plus className="w-4 h-4 ml-1" /> مزود جديد
          </Button>
          <Button onClick={() => { resetPackageForm(); setPackageDialog(true); }} variant="outline" size="sm">
            <Plus className="w-4 h-4 ml-1" /> باقة جديدة
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
      </div>

      <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto scrollbar-thin">
        {filteredProviders.map((prov, i) => {
          const provPackages = packages.filter(p => p.providerId === prov.id || p.providerId === prov.name);
          return (
            <motion.div key={prov.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
              <Card className="admin-card border-0 shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {prov.icon ? (
                        <img src={prov.icon} className="w-10 h-10 rounded-lg object-cover" alt="" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: prov.color + '20' }}>
                          <Server className="w-5 h-5" style={{ color: prov.color }} />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{prov.name}</p>
                        <p className="text-xs text-muted-foreground">{prov.categoryId} - {provPackages.length} باقة</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={prov.isActive ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'}>
                        {prov.isActive ? 'نشط' : 'معطل'}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setEditingProvider(prov);
                        setProvName(prov.name); setProvCategory(prov.categoryId || 'telecom');
                        setProvColor(prov.color || '#6C3CE1'); setProvIcon(prov.icon || '');
                        setProvInputLabel(prov.inputLabel || 'رقم الهاتف'); setProvInputType(prov.inputType || 'phone');
                        setProvActive(prov.isActive !== false);
                        setProviderDialog(true);
                      }}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteProvider(prov.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </div>
                  </div>
                  {provPackages.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {provPackages.slice(0, 4).map((pkg: any) => (
                        <div key={pkg.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-xs">
                          <span>{pkg.name}</span>
                          <span className="font-bold">{formatNumber(pkg.price)} {pkg.currency === 'YER' ? 'ر.ي' : pkg.currency === 'SAR' ? 'ر.س' : '$'}</span>
                        </div>
                      ))}
                      {provPackages.length > 4 && <p className="text-xs text-muted-foreground">+{provPackages.length - 4} المزيد</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
        {filteredProviders.length === 0 && <p className="text-center text-muted-foreground py-8">لا توجد مزودين</p>}
      </div>

      {/* Provider Dialog */}
      <Dialog open={providerDialog} onOpenChange={setProviderDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingProvider ? 'تعديل مزود' : 'إضافة مزود'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>الاسم</Label><Input value={provName} onChange={(e) => setProvName(e.target.value)} /></div>
            <div><Label>التصنيف</Label>
              <Select value={provCategory} onValueChange={setProvCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="telecom">الاتصالات</SelectItem>
                  <SelectItem value="internet">الإنترنت</SelectItem>
                  <SelectItem value="games">ألعاب</SelectItem>
                  <SelectItem value="cards">بطاقات</SelectItem>
                  <SelectItem value="electricity">كهرباء</SelectItem>
                  <SelectItem value="government">حكومي</SelectItem>
                  <SelectItem value="crypto">كريبتو</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>اللون</Label><Input type="color" value={provColor} onChange={(e) => setProvColor(e.target.value)} /></div>
            <div><Label>تسمية الحقل</Label><Input value={provInputLabel} onChange={(e) => setProvInputLabel(e.target.value)} /></div>
            <div><Label>نوع الحقل</Label>
              <Select value={provInputType} onValueChange={setProvInputType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">هاتف</SelectItem>
                  <SelectItem value="text">نص</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2"><Switch checked={provActive} onCheckedChange={setProvActive} /><Label>نشط</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProviderDialog(false)}>إلغاء</Button>
            <Button onClick={saveProvider}>{editingProvider ? 'تحديث' : 'إضافة'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Package Dialog */}
      <Dialog open={packageDialog} onOpenChange={setPackageDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingPackage ? 'تعديل باقة' : 'إضافة باقة'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>المزود</Label>
              <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                <SelectTrigger><SelectValue placeholder="اختر مزود" /></SelectTrigger>
                <SelectContent>
                  {providers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>اسم الباقة</Label><Input value={pkgName} onChange={(e) => setPkgName(e.target.value)} /></div>
            <div><Label>السعر</Label><Input type="number" value={pkgPrice} onChange={(e) => setPkgPrice(e.target.value)} dir="ltr" /></div>
            <div><Label>العملة</Label>
              <Select value={pkgCurrency} onValueChange={setPkgCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="YER">ريال يمني</SelectItem>
                  <SelectItem value="SAR">ريال سعودي</SelectItem>
                  <SelectItem value="USD">دولار</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>نوع التنفيذ</Label>
              <Select value={pkgExecution} onValueChange={(v: any) => setPkgExecution(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">يدوي</SelectItem>
                  <SelectItem value="auto">تلقائي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2"><Switch checked={pkgActive} onCheckedChange={setPkgActive} /><Label>نشط</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPackageDialog(false)}>إلغاء</Button>
            <Button onClick={savePackage}>{editingPackage ? 'تحديث' : 'إضافة'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
