'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, push, update, remove, set } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAdminStore } from '@/lib/store';
import { formatNumber, generateId } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Edit, Layers, ArrowUp, ArrowDown, RotateCcw, Save } from 'lucide-react';
import { motion } from 'framer-motion';

const defaultSections = [
  { name: 'الاتصالات', iconKey: 'phone', order: 0, isVisible: true, categoryId: 'telecom' },
  { name: 'الإنترنت', iconKey: 'wifi', order: 1, isVisible: true, categoryId: 'internet' },
  { name: 'خدمات ترفيهية', iconKey: 'gamepad', order: 2, isVisible: true, categoryId: 'entertainment' },
  { name: 'بطاقات رقمية', iconKey: 'credit-card', order: 3, isVisible: true, categoryId: 'cards' },
  { name: 'الكهرباء والماء', iconKey: 'zap', order: 4, isVisible: true, categoryId: 'electricity' },
  { name: 'خدمات حكومية', iconKey: 'landmark', order: 5, isVisible: true, categoryId: 'government' },
  { name: 'الكريبتو', iconKey: 'bitcoin', order: 6, isVisible: true, categoryId: 'crypto' },
  { name: 'استثمار الكريبتو', iconKey: 'trending-up', order: 7, isVisible: true, categoryId: 'investment' },
];

export default function SectionsPanel() {
  const { showToast } = useAdminStore();
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [secName, setSecName] = useState('');
  const [secIcon, setSecIcon] = useState('');
  const [secOrder, setSecOrder] = useState('0');
  const [secVisible, setSecVisible] = useState(true);
  const [secCategoryId, setSecCategoryId] = useState('');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const secRef = ref(database, 'ownerSettings/sections');
    const unsub = onValue(secRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val }));
      list.sort((a, b) => (a.order || 0) - (b.order || 0));
      setSections(list);
      if (Object.keys(data).length === 0 && !initialized) {
        setInitialized(true);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [initialized]);

  const handleInitializeDefaults = async () => {
    try {
      const updates: Record<string, any> = {};
      defaultSections.forEach((sec, i) => {
        const key = `section_${i}`;
        updates[`ownerSettings/sections/${key}`] = { ...sec, order: i };
        // Sync visibility to adminSettings/visibility/sections
        updates[`adminSettings/visibility/sections/${sec.categoryId}`] = sec.isVisible !== false;
      });
      await update(ref(database), updates);
      showToast('تم إنشاء الأقسام الافتراضية', 'success');
    } catch (e) { showToast('حدث خطأ', 'error'); }
  };

  const handleSave = async () => {
    if (!secName) return;
    try {
      const data = { name: secName, icon: secIcon, order: parseInt(secOrder) || 0, isVisible: secVisible, categoryId: secCategoryId };
      if (editing) {
        const updates: Record<string, any> = {
          [`ownerSettings/sections/${editing.id}`]: { ...editing, ...data },
        };
        // Sync visibility to adminSettings/visibility/sections/{categoryId}
        const catId = secCategoryId || editing.categoryId || editing.id;
        updates[`adminSettings/visibility/sections/${catId}`] = secVisible;
        // If categoryId changed, remove the old entry
        if (editing.categoryId && editing.categoryId !== secCategoryId && secCategoryId) {
          updates[`adminSettings/visibility/sections/${editing.categoryId}`] = null;
        }
        await update(ref(database), updates);
        showToast('تم التحديث', 'success');
      } else {
        const newRef = push(ref(database, 'ownerSettings/sections'));
        const updates: Record<string, any> = {
          [`ownerSettings/sections/${newRef.key}`]: data,
        };
        // Sync visibility to adminSettings/visibility/sections/{categoryId}
        const catId = secCategoryId || newRef.key!;
        updates[`adminSettings/visibility/sections/${catId}`] = secVisible;
        await update(ref(database), updates);
        showToast('تم الإضافة', 'success');
      }
      setDialog(false);
      setSecName(''); setSecIcon(''); setSecOrder('0'); setSecVisible(true); setSecCategoryId(''); setEditing(null);
    } catch (e) { showToast('حدث خطأ', 'error'); }
  };

  const handleMove = async (section: any, direction: 'up' | 'down') => {
    const sorted = [...sections].sort((a, b) => (a.order || 0) - (b.order || 0));
    const idx = sorted.findIndex(s => s.id === section.id);
    if (direction === 'up' && idx > 0) {
      await update(ref(database, `ownerSettings/sections/${section.id}`), { order: sorted[idx - 1].order });
      await update(ref(database, `ownerSettings/sections/${sorted[idx - 1].id}`), { order: section.order });
    } else if (direction === 'down' && idx < sorted.length - 1) {
      await update(ref(database, `ownerSettings/sections/${section.id}`), { order: sorted[idx + 1].order });
      await update(ref(database, `ownerSettings/sections/${sorted[idx + 1].id}`), { order: section.order });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Find the section to get its categoryId for visibility cleanup
      const section = sections.find(s => s.id === id);
      const catId = section?.categoryId || id;
      const updates: Record<string, any> = {
        [`ownerSettings/sections/${id}`]: null,
        [`adminSettings/visibility/sections/${catId}`]: null,
      };
      await update(ref(database), updates);
      showToast('تم الحذف', 'success');
    }
    catch (e) { showToast('حدث خطأ', 'error'); }
  };

  const handleToggle = async (s: any) => {
    try {
      const newVisible = !s.isVisible;
      const catId = s.categoryId || s.id;
      const updates: Record<string, any> = {
        [`ownerSettings/sections/${s.id}/isVisible`]: newVisible,
        [`adminSettings/visibility/sections/${catId}`]: newVisible,
      };
      await update(ref(database), updates);
    }
    catch (e) { showToast('حدث خطأ', 'error'); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة الأقسام</h1>
          <p className="text-muted-foreground text-sm mt-1">{formatNumber(sections.length)} قسم</p>
        </div>
        <div className="flex gap-2">
          {sections.length === 0 && (
            <Button variant="outline" size="sm" onClick={handleInitializeDefaults}>
              <RotateCcw className="w-4 h-4 ml-1" /> إنشاء الأقسام الافتراضية
            </Button>
          )}
          <Button size="sm" onClick={() => { setEditing(null); setSecName(''); setSecIcon(''); setSecOrder('0'); setSecVisible(true); setSecCategoryId(''); setDialog(true); }}>
            <Plus className="w-4 h-4 ml-1" /> قسم جديد
          </Button>
        </div>
      </div>

      {/* Default sections reference */}
      <Card className="admin-card border-0 shadow-none">
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-2">الأقسام الافتراضية للتطبيق:</p>
          <div className="flex flex-wrap gap-2">
            {defaultSections.map((sec, i) => (
              <Badge key={i} variant="outline" className="text-xs">{sec.name}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {sections.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
            <Card className="admin-card border-0 shadow-none">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => handleMove(s, 'up')} className="text-muted-foreground hover:text-foreground"><ArrowUp className="w-3 h-3" /></button>
                    <button onClick={() => handleMove(s, 'down')} className="text-muted-foreground hover:text-foreground"><ArrowDown className="w-3 h-3" /></button>
                  </div>
                  <div className="p-2 rounded-lg bg-purple-500/10"><Layers className="w-4 h-4 text-purple-500" /></div>
                  <div>
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">ترتيب: {s.order || i} {s.categoryId ? `- ${s.categoryId}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={s.isVisible !== false} onCheckedChange={() => handleToggle(s)} />
                  <Badge className={s.isVisible !== false ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}>{s.isVisible !== false ? 'ظاهر' : 'مخفي'}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setEditing(s); setSecName(s.name); setSecIcon(s.icon || '');
                    setSecOrder(String(s.order || i)); setSecVisible(s.isVisible !== false);
                    setSecCategoryId(s.categoryId || '');
                    setDialog(true);
                  }}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {sections.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">لا توجد أقسام. اضغط على &quot;إنشاء الأقسام الافتراضية&quot; للبدء</p>
          </div>
        )}
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'تعديل قسم' : 'إضافة قسم'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>الاسم</Label><Input value={secName} onChange={(e) => setSecName(e.target.value)} /></div>
            <div><Label>معرف التصنيف</Label><Input value={secCategoryId} onChange={(e) => setSecCategoryId(e.target.value)} placeholder="مثال: telecom" dir="ltr" /></div>
            <div><Label>الأيقونة (مفتاح أو Base64)</Label><Input value={secIcon} onChange={(e) => setSecIcon(e.target.value)} /></div>
            <div><Label>الترتيب</Label><Input type="number" value={secOrder} onChange={(e) => setSecOrder(e.target.value)} dir="ltr" /></div>
            <div className="flex items-center gap-2"><Switch checked={secVisible} onCheckedChange={setSecVisible} /><Label>ظاهر</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>إلغاء</Button>
            <Button onClick={handleSave}>{editing ? 'تحديث' : 'إضافة'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
