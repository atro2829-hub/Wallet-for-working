'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, update, push } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAdminStore } from '@/lib/store';
import { formatNumber, generateId } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, CheckCircle, XCircle, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { notifyKycStatus } from '@/lib/notifications';

export default function KYCPanel() {
  const { adminUser, showToast } = useAdminStore();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    const usersRef = ref(database, 'users');
    const unsub = onValue(usersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data)
        .map(([uid, val]: [string, any]) => ({ uid, ...val }))
        .filter((u: any) => u.kycStatus === 'submitted' || u.kycStatus === 'verified' || u.kycStatus === 'rejected');
      setUsers(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = users.filter((u) =>
    !search || (u.name && u.name.includes(search)) || (u.email && u.email.includes(search))
  );

  const handleApprove = async () => {
    if (!selected) return;
    try {
      await update(ref(database, `users/${selected.uid}`), { kycStatus: 'verified' });

      // Send FCM push notification to the user
      try { await notifyKycStatus(selected.uid, 'verified'); } catch {}

      await push(ref(database, 'ownerSettings/activityLog'), {
        id: generateId(), type: 'admin', action: 'توثيق حساب',
        details: `توثيق هوية ${selected.name || selected.email}`,
        adminId: adminUser?.uid, adminName: adminUser?.displayName, timestamp: new Date().toISOString(),
      });
      showToast('تم توثيق الحساب', 'success');
      setDetailOpen(false);
    } catch (e) { showToast('حدث خطأ', 'error'); }
  };

  const handleReject = async () => {
    if (!selected) return;
    try {
      await update(ref(database, `users/${selected.uid}`), { kycStatus: 'rejected', kycRejectReason: reason });

      // Send FCM push notification to the user
      try { await notifyKycStatus(selected.uid, 'rejected'); } catch {}

      showToast('تم رفض التوثيق', 'success');
      setDetailOpen(false);
      setReason('');
    } catch (e) { showToast('حدث خطأ', 'error'); }
  };

  const statusLabel: Record<string, string> = { submitted: 'مقدم', verified: 'موثق', rejected: 'مرفوض' };
  const statusColor: Record<string, string> = {
    submitted: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
    verified: 'bg-green-500/20 text-green-600 dark:text-green-400',
    rejected: 'bg-red-500/20 text-red-600 dark:text-red-400',
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">التحقق من الهوية</h1>
        <p className="text-muted-foreground text-sm mt-1">{formatNumber(users.filter(u => u.kycStatus === 'submitted').length)} طلب بانتظار المراجعة</p>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
      </div>

      <div className="space-y-3 max-h-[calc(100vh-260px)] overflow-y-auto scrollbar-thin">
        {filtered.map((user, i) => (
          <motion.div key={user.uid} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
            <Card className="admin-card border-0 shadow-none cursor-pointer card-press" onClick={() => { setSelected(user); setDetailOpen(true); setReason(''); }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 font-bold text-sm">
                      {(user.name || '?')[0]}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{user.name || user.email}</p>
                      <p className="text-xs text-muted-foreground">{user.nationalId || '-'}</p>
                    </div>
                  </div>
                  <Badge className={statusColor[user.kycStatus] || ''}>{statusLabel[user.kycStatus] || user.kycStatus}</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">لا توجد طلبات</p>}
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>تفاصيل التحقق</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><Label className="text-muted-foreground">الاسم</Label><p className="font-medium">{selected.name || '-'}</p></div>
                <div><Label className="text-muted-foreground">رقم الهوية</Label><p className="font-medium">{selected.nationalId || '-'}</p></div>
                <div><Label className="text-muted-foreground">نوع الوثيقة</Label><p className="font-medium">{selected.cardType || '-'}</p></div>
                <div><Label className="text-muted-foreground">الحالة</Label><Badge className={statusColor[selected.kycStatus]}>{statusLabel[selected.kycStatus]}</Badge></div>
              </div>

              {selected.idPhoto && (
                <div>
                  <Label className="text-muted-foreground">صورة الهوية</Label>
                  <div className="mt-2 rounded-xl overflow-hidden border border-border">
                    <img src={selected.idPhoto} alt="ID" className="w-full max-h-60 object-contain bg-white" />
                  </div>
                </div>
              )}
              {selected.selfiePhoto && (
                <div>
                  <Label className="text-muted-foreground">الصورة الشخصية</Label>
                  <div className="mt-2 rounded-xl overflow-hidden border border-border">
                    <img src={selected.selfiePhoto} alt="Selfie" className="w-full max-h-60 object-contain bg-white" />
                  </div>
                </div>
              )}

              {selected.kycStatus === 'submitted' && (
                <>
                  <div>
                    <Label>سبب الرفض (اختياري)</Label>
                    <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="سبب رفض التوثيق..." />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleApprove} className="flex-1 bg-green-600 hover:bg-green-700">
                      <UserCheck className="w-4 h-4 ml-1" /> توثيق
                    </Button>
                    <Button onClick={handleReject} variant="destructive" className="flex-1">
                      <XCircle className="w-4 h-4 ml-1" /> رفض
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
