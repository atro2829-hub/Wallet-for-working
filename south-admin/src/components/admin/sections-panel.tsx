'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, push, update, remove } from 'firebase/database';
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
import { Plus, Trash2, Edit, Layers, ArrowUp, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SectionsPanel() {
  const { showToast } = useAdminStore();
  const [sections, setSections] = useState<any[]>([]);
  const [subsections, setSubsections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [secName, setSecName] = useState('');
  const [secIcon, setSecIcon] = useState('');
  const [secOrder, setSecOrder] = useState('0');
  const [secVisible, setSecVisible] = useState(true);

  useEffect(() => {
    const secRef = ref(database, 'ownerSettings/sections');
    const unsub1 = onValue(secRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val }));
      list.sort((a, b) => (a.order || 0) - (b.order || 0));
      setSections(list);
    });
    const subRef = ref(database, 'ownerSettings/subsections');
    const unsub2 = onValue(subRef, (snapshot) => {
      const data = snapshot.val() || {};
      setSubsections(Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })));
      setLoading(false);
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  const handleSave = async () => {
    if (!secName) return;
    try {
      const data = { name: secName, icon: secIcon, order: parseInt(secOrder) || 0, isVisible: secVisible };
      if (editing) {
        await update(ref(database, `ownerSettings/sections/${editing.id}`), data);
        showToast('تم التحديث', 'success');
      } else {
        await push(ref(database, 'ownerSettings/sections'), data);
        showToast('تم الإضافة', 'success');
      }
      setDialog(false);
      setSecName(''); setSecIcon(''); setSecOrder('0'); setSecVisible(true); setEditing(null);
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
    try { await remove(ref(database, `ownerSettings/sections/${id}`)); showToast('تم الحذف', 'success'); }
    catch (e) { showToast('حدث خطأ', 'error'); }
  };

  const handleToggle = async (s: any) => {
    try { await update(ref(database, `ownerSettings/sections/${s.id}`), { isVisible: !s.isVisible }); }
    catch (e) { showToast('حدث خطأ', 'error'); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">إدارة الأقسام</h1><p className="text-muted-foreground text-sm mt-1">{formatNumber(sections.length)} قسم</p></div>
        <Button onClick={() => { setEditing(null); setSecName(''); setSecIcon(''); setSecOrder('0'); setSecVisible(true); setDialog(true); }} size="sm"><Plus className="w-4 h-4 ml-1" /> قسم جديد</Button>
      </div>

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
                    <p className="text-xs text-muted-foreground">ترتيب: {s.order || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={s.isVisible !== false} onCheckedChange={() => handleToggle(s)} />
                  <Badge className={s.isVisible !== false ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}>{s.isVisible !== false ? 'ظاهر' : 'مخفي'}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(s); setSecName(s.name); setSecIcon(s.icon || ''); setSecOrder(String(s.order || 0)); setSecVisible(s.isVisible !== false); setDialog(true); }}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'تعديل قسم' : 'إضافة قسم'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>الاسم</Label><Input value={secName} onChange={(e) => setSecName(e.target.value)} /></div>
            <div><Label>الأيقونة (Base64 أو مفتاح)</Label><Input value={secIcon} onChange={(e) => setSecIcon(e.target.value)} /></div>
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
