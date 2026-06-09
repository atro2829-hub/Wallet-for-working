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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit, Image, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BannersPanel() {
  const { showToast } = useAdminStore();
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [url, setUrl] = useState('');
  const [urlType, setUrlType] = useState<'whatsapp' | 'facebook' | 'website' | 'deeplink' | 'none'>('none');
  const [order, setOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [urlTestResult, setUrlTestResult] = useState<'none' | 'valid' | 'invalid'>('none');

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

  const testUrl = () => {
    if (!url) {
      setUrlTestResult('invalid');
      return;
    }
    try {
      new URL(url);
      setUrlTestResult('valid');
    } catch {
      if (url.startsWith('/') || url.startsWith('southwallet://')) {
        setUrlTestResult('valid');
      } else {
        setUrlTestResult('invalid');
      }
    }
  };

  const handleSave = async () => {
    try {
      const data = {
        title,
        description,
        imageUrl: imageBase64,
        image: imageBase64,
        url: urlType !== 'none' ? url : '',
        urlType: urlType !== 'none' ? urlType : '',
        link: urlType !== 'none' ? url : '',
        order: parseInt(order) || 0,
        isActive,
      };
      if (editing) {
        await update(ref(database, `adminSettings/banners/${editing.id}`), data);
        showToast('تم تحديث البانر', 'success');
      } else {
        await push(ref(database, 'adminSettings/banners'), data);
        showToast('تم إضافة البانر', 'success');
      }
      setDialog(false);
      setTitle(''); setDescription(''); setImageBase64(''); setUrl(''); setUrlType('none'); setOrder('0'); setIsActive(true); setEditing(null); setUrlTestResult('none');
    } catch (e) { showToast('حدث خطأ', 'error'); }
  };

  const handleDelete = async (id: string) => {
    try { await remove(ref(database, `adminSettings/banners/${id}`)); showToast('تم حذف البانر', 'success'); }
    catch (e) { showToast('حدث خطأ', 'error'); }
  };

  const getUrlTypeLabel = (type: string) => {
    switch (type) {
      case 'whatsapp': return 'واتساب';
      case 'facebook': return 'فيسبوك';
      case 'website': return 'موقع ويب';
      case 'deeplink': return 'رابط داخلي';
      default: return '';
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">البانرات الإعلانية</h1><p className="text-muted-foreground text-sm mt-1">{formatNumber(banners.length)} بانر</p></div>
        <Button onClick={() => { setEditing(null); setTitle(''); setDescription(''); setImageBase64(''); setUrl(''); setUrlType('none'); setOrder('0'); setIsActive(true); setUrlTestResult('none'); setDialog(true); }} size="sm"><Plus className="w-4 h-4 ml-1" /> بانر جديد</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {banners.map((b, i) => (
          <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
            <Card className="admin-card border-0 shadow-none overflow-hidden">
              {(b.imageUrl || b.image) && <img src={b.imageUrl || b.image} alt={b.title || ''} className="w-full h-32 object-cover" />}
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{b.title || 'بدون عنوان'}</p>
                    <p className="text-xs text-muted-foreground">ترتيب: {b.order || 0}</p>
                    {b.url && (
                      <div className="flex items-center gap-1 mt-1">
                        <ExternalLink className="w-3 h-3 text-purple-500" />
                        <span className="text-xs text-purple-500 truncate max-w-[150px]" dir="ltr">{b.url}</span>
                        {b.urlType && <Badge className="bg-purple-500/20 text-purple-600 text-xs h-4">{getUrlTypeLabel(b.urlType)}</Badge>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={b.isActive ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'}>{b.isActive ? 'نشط' : 'معطل'}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => {
                      setEditing(b); setTitle(b.title || ''); setDescription(b.description || ''); setImageBase64(b.imageUrl || b.image || '');
                      setUrl(b.url || b.link || ''); setUrlType(b.urlType || (b.url || b.link ? 'website' : 'none'));
                      setOrder(String(b.order || 0)); setIsActive(b.isActive !== false); setUrlTestResult('none'); setDialog(true);
                    }}><Edit className="w-4 h-4" /></Button>
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
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'تعديل بانر' : 'إضافة بانر'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>العنوان</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><Label>الوصف</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف مختصر للبانر..." /></div>
            <div><Label>الصورة</Label>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm" />
              {imageBase64 && <img src={imageBase64} alt="preview" className="mt-2 w-full h-24 object-cover rounded-lg" />}
            </div>
            <div>
              <Label>نوع الرابط</Label>
              <Select value={urlType} onValueChange={(v: any) => { setUrlType(v); setUrlTestResult('none'); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون رابط</SelectItem>
                  <SelectItem value="whatsapp">واتساب</SelectItem>
                  <SelectItem value="facebook">فيسبوك</SelectItem>
                  <SelectItem value="website">موقع ويب</SelectItem>
                  <SelectItem value="deeplink">رابط داخلي (Deep Link)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {urlType !== 'none' && (
              <div>
                <Label>الرابط</Label>
                <div className="flex gap-2">
                  <Input
                    value={url}
                    onChange={(e) => { setUrl(e.target.value); setUrlTestResult('none'); }}
                    dir="ltr"
                    placeholder={urlType === 'whatsapp' ? 'https://wa.me/967...' : urlType === 'facebook' ? 'https://facebook.com/...' : urlType === 'deeplink' ? 'southwallet://...' : 'https://...'}
                  />
                  <Button variant="outline" size="sm" onClick={testUrl}>
                    {urlTestResult === 'valid' ? <CheckCircle className="w-4 h-4 text-green-500" /> : urlTestResult === 'invalid' ? <AlertCircle className="w-4 h-4 text-red-500" /> : <ExternalLink className="w-4 h-4" />}
                  </Button>
                </div>
                {urlTestResult === 'valid' && <p className="text-xs text-green-500 mt-1">الرابط صالح</p>}
                {urlTestResult === 'invalid' && <p className="text-xs text-red-500 mt-1">الرابط غير صالح</p>}
              </div>
            )}
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
