'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAdminStore } from '@/lib/store';
import { formatNumber } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Edit, Image } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BannersPanel() {
  const { showToast } = useAdminStore();
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [link, setLink] = useState('');
  const [order, setOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const ref_ = ref(database, 'adminSettings/banners');
    const unsub = onValue(ref_, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val }));
      list.sort((a, b) => (a.order || 0) - (b.order || 0));
      setBanners(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      const data = { title, image: imageBase64, link, order: parseInt(order) || 0, isActive };
      if (editing) {
        await update(ref(database, `adminSettings/banners/${editing.id}`), data);
        showToast('تم تحديث البانر', 'success');
      } else {
        await push(ref(database, 'adminSettings/banners'), data);
        showToast('تم إضافة البانر', 'success');
      }
      setDialog(false);
      setTitle(''); setImageBase64(''); setLink(''); setOrder('0'); setIsActive(true); setEditing(null);
    } catch (e) { showToast('حدث خطأ', 'error'); }
  };

  const handleDelete = async (id: string) => {
    try { await remove(ref(database, `adminSettings/banners/${id}`)); showToast('تم حذف البانر', 'success'); }
    catch (e) { showToast('حدث خطأ', 'error'); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">البانرات الإعلانية</h1><p className="text-muted-foreground text-sm mt-1">{formatNumber(banners.length)} بانر</p></div>
        <Button onClick={() => { setEditing(null); setTitle(''); setImageBase64(''); setLink(''); setOrder('0'); setIsActive(true); setDialog(true); }} size="sm"><Plus className="w-4 h-4 ml-1" /> بانر جديد</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {banners.map((b, i) => (
          <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
            <Card className="admin-card border-0 shadow-none overflow-hidden">
              {b.image && <img src={b.image} alt={b.title || ''} className="w-full h-32 object-cover" />}
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{b.title || 'بدون عنوان'}</p>
                    <p className="text-xs text-muted-foreground">ترتيب: {b.order || 0}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={b.isActive ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'}>{b.isActive ? 'نشط' : 'معطل'}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(b); setTitle(b.title || ''); setImageBase64(b.image || ''); setLink(b.link || ''); setOrder(String(b.order || 0)); setIsActive(b.isActive !== false); setDialog(true); }}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(b.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {banners.length === 0 && <p className="text-center text-muted-foreground py-8 col-span-2">لا توجد بانرات</p>}
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'تعديل بانر' : 'إضافة بانر'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>العنوان</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><Label>الصورة</Label>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm" />
              {imageBase64 && <img src={imageBase64} alt="preview" className="mt-2 w-full h-24 object-cover rounded-lg" />}
            </div>
            <div><Label>الرابط</Label><Input value={link} onChange={(e) => setLink(e.target.value)} dir="ltr" /></div>
            <div><Label>الترتيب</Label><Input type="number" value={order} onChange={(e) => setOrder(e.target.value)} dir="ltr" /></div>
            <div className="flex items-center gap-2"><Switch checked={isActive} onCheckedChange={setIsActive} /><Label>نشط</Label></div>
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
