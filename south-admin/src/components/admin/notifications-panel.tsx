'use client';

import { useState } from 'react';
import { ref, push } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAdminStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Send, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotificationsPanel() {
  const { adminUser, showToast } = useAdminStore();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<'all' | 'specific'>('all');
  const [targetUserId, setTargetUserId] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title || !body) return;
    setSending(true);
    try {
      if (type === 'all') {
        // Save to a global notification path that all users can read
        await push(ref(database, 'adminSettings/globalNotifications'), {
          title,
          body,
          type: 'broadcast',
          createdAt: new Date().toISOString(),
          sentBy: adminUser?.uid,
        });
        showToast('تم إرسال الإشعار لجميع المستخدمين', 'success');
      } else if (targetUserId) {
        await push(ref(database, `notifications/${targetUserId}`), {
          title,
          body,
          type: 'admin',
          isRead: false,
          createdAt: new Date().toISOString(),
        });
        showToast('تم إرسال الإشعار للمستخدم', 'success');
      }
      setTitle(''); setBody(''); setTargetUserId('');
    } catch (e) { showToast('حدث خطأ', 'error'); }
    finally { setSending(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">الإشعارات</h1>
        <p className="text-muted-foreground text-sm mt-1">إرسال إشعارات للمستخدمين</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="admin-card border-0 shadow-none">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10">
              <Bell className="w-6 h-6 text-purple-500" />
              <div>
                <p className="font-medium text-sm">إرسال إشعار جديد</p>
                <p className="text-xs text-muted-foreground">إرسال إشعار فوري للمستخدمين</p>
              </div>
            </div>

            <div>
              <Label>نوع الإرسال</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">لجميع المستخدمين</SelectItem>
                  <SelectItem value="specific">لمستخدم محدد</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {type === 'specific' && (
              <div>
                <Label>معرف المستخدم (UID)</Label>
                <Input value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} dir="ltr" placeholder="أدخل UID المستخدم..." />
              </div>
            )}

            <div>
              <Label>عنوان الإشعار</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان الإشعار..." />
            </div>

            <div>
              <Label>محتوى الإشعار</Label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="محتوى الإشعار..." className="min-h-[120px]" />
            </div>

            <Button onClick={handleSend} disabled={sending || !title || !body} className="w-full bg-purple-600 hover:bg-purple-700">
              {sending ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Send className="w-4 h-4 ml-2" />}
              إرسال الإشعار
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
