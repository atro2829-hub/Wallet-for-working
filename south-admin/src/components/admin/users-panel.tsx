'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, update, remove, push, set, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAdminStore } from '@/lib/store';
import { formatBalance, formatNumber, currencySymbols, timeAgo, generateId } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, UserCheck, UserX, DollarSign, Shield, Eye, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UsersPanel() {
  const { adminUser, showToast } = useAdminStore();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [balanceDialog, setBalanceDialog] = useState(false);
  const [roleDialog, setRoleDialog] = useState(false);
  const [balanceAction, setBalanceAction] = useState<'add' | 'subtract'>('add');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceCurrency, setBalanceCurrency] = useState('YER');
  const [newRole, setNewRole] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = ref(database, 'users');
    const unsub = onValue(usersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([uid, val]: [string, any]) => ({ uid, ...val }));
      setUsers(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      (u.name && u.name.includes(search)) ||
      (u.firstName && u.firstName.includes(search)) ||
      (u.email && u.email.includes(search)) ||
      (u.phone && u.phone.includes(search)) ||
      (u.userId && u.userId.includes(search));
    const matchesFilter =
      filter === 'all' ||
      (filter === 'blocked' && u.isBlocked) ||
      (filter === 'kyc-submitted' && u.kycStatus === 'submitted') ||
      (filter === 'admin' && (u.role === 'admin' || u.role === 'owner'));
    return matchesSearch && matchesFilter;
  });

  const handleBlockUser = async (user: any, block: boolean) => {
    try {
      await update(ref(database, `users/${user.uid}`), { isBlocked: block });
      showToast(block ? 'تم حظر المستخدم' : 'تم إلغاء حظر المستخدم', 'success');
    } catch (e) {
      showToast('حدث خطأ', 'error');
    }
  };

  const handleBalanceAdjust = async () => {
    if (!selectedUser || !balanceAmount) return;
    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      const balanceKey = `balance${balanceCurrency}`;
      const currentBalance = selectedUser[balanceKey] || 0;
      const newBalance = balanceAction === 'add' ? currentBalance + amount : Math.max(0, currentBalance - amount);

      await update(ref(database, `users/${selectedUser.uid}`), { [balanceKey]: newBalance });

      // Log activity
      const logEntry = {
        id: generateId(),
        type: 'admin',
        action: balanceAction === 'add' ? 'إضافة رصيد' : 'خصم رصيد',
        details: `${balanceAction === 'add' ? 'إضافة' : 'خصم'} ${amount} ${currencySymbols[balanceCurrency]} ${balanceAction === 'add' ? 'إلى' : 'من'} حساب ${selectedUser.name || selectedUser.email}`,
        adminId: adminUser?.uid,
        adminName: adminUser?.displayName,
        timestamp: new Date().toISOString(),
      };
      await push(ref(database, 'ownerSettings/activityLog'), logEntry);

      showToast(
        `تم ${balanceAction === 'add' ? 'إضافة' : 'خصم'} ${amount} ${currencySymbols[balanceCurrency]}`,
        'success'
      );
      setBalanceDialog(false);
      setBalanceAmount('');
    } catch (e) {
      showToast('حدث خطأ', 'error');
    }
  };

  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return;
    try {
      await update(ref(database, `users/${selectedUser.uid}`), { role: newRole });

      const logEntry = {
        id: generateId(),
        type: 'admin',
        action: 'تغيير صلاحية',
        details: `تغيير صلاحية ${selectedUser.name || selectedUser.email} إلى ${newRole === 'owner' ? 'مالك' : newRole === 'admin' ? 'مدير' : 'مستخدم'}`,
        adminId: adminUser?.uid,
        adminName: adminUser?.displayName,
        timestamp: new Date().toISOString(),
      };
      await push(ref(database, 'ownerSettings/activityLog'), logEntry);

      showToast('تم تغيير الصلاحية', 'success');
      setRoleDialog(false);
      setNewRole('');
    } catch (e) {
      showToast('حدث خطأ', 'error');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
        <p className="text-muted-foreground text-sm mt-1">إجمالي {formatNumber(users.length)} مستخدم</p>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم، البريد، الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="blocked">محظور</SelectItem>
            <SelectItem value="kyc-submitted">بانتظار التحقق</SelectItem>
            <SelectItem value="admin">مديرين</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users List */}
      <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin">
        {filteredUsers.map((user, index) => (
          <motion.div
            key={user.uid}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
          >
            <Card className="admin-card border-0 shadow-none cursor-pointer card-press" onClick={() => { setSelectedUser(user); setDetailOpen(true); }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 font-bold text-sm">
                      {(user.name || user.firstName || '?')[0]}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{user.name || `${user.firstName || ''} ${user.familyName || ''}`}</p>
                      <p className="text-xs text-muted-foreground">{user.email || user.phone || user.userId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.isBlocked && <Badge className="bg-red-500/20 text-red-500 text-xs">محظور</Badge>}
                    {user.role === 'owner' && <Badge className="bg-purple-500/20 text-purple-500 text-xs">مالك</Badge>}
                    {user.role === 'admin' && <Badge className="bg-blue-500/20 text-blue-500 text-xs">مدير</Badge>}
                    {user.kycStatus === 'verified' && <Badge className="bg-green-500/20 text-green-500 text-xs">موثق</Badge>}
                  </div>
                </div>
                <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                  <span>ر.ي: {formatNumber(user.balanceYER || 0)}</span>
                  <span>ر.س: {formatNumber(user.balanceSAR || 0)}</span>
                  <span>$: {formatNumber(user.balanceUSD || 0)}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {filteredUsers.length === 0 && (
          <p className="text-center text-muted-foreground py-8">لا توجد نتائج</p>
        )}
      </div>

      {/* User Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل المستخدم</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><Label className="text-muted-foreground">الاسم</Label><p className="font-medium">{selectedUser.name || '-'}</p></div>
                <div><Label className="text-muted-foreground">البريد</Label><p className="font-medium" dir="ltr">{selectedUser.email || '-'}</p></div>
                <div><Label className="text-muted-foreground">الهاتف</Label><p className="font-medium" dir="ltr">{selectedUser.phone || '-'}</p></div>
                <div><Label className="text-muted-foreground">رقم الحساب</Label><p className="font-medium">{selectedUser.userId || '-'}</p></div>
                <div><Label className="text-muted-foreground">الصلاحية</Label><p className="font-medium">{selectedUser.role === 'owner' ? 'مالك' : selectedUser.role === 'admin' ? 'مدير' : 'مستخدم'}</p></div>
                <div><Label className="text-muted-foreground">حالة التحقق</Label><p className="font-medium">{selectedUser.kycStatus === 'verified' ? 'موثق' : selectedUser.kycStatus === 'submitted' ? 'مقدم' : selectedUser.kycStatus === 'rejected' ? 'مرفوض' : 'لم يقدم'}</p></div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Card className="admin-card border-0 shadow-none"><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">ر.ي</p><p className="font-bold text-lg">{formatNumber(selectedUser.balanceYER || 0)}</p></CardContent></Card>
                <Card className="admin-card border-0 shadow-none"><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">ر.س</p><p className="font-bold text-lg">{formatNumber(selectedUser.balanceSAR || 0)}</p></CardContent></Card>
                <Card className="admin-card border-0 shadow-none"><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">$</p><p className="font-bold text-lg">{formatNumber(selectedUser.balanceUSD || 0)}</p></CardContent></Card>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => { setBalanceDialog(true); setBalanceAction('add'); }} className="flex-1 bg-green-600 hover:bg-green-700" size="sm">
                  <DollarSign className="w-4 h-4 ml-1" /> إضافة رصيد
                </Button>
                <Button onClick={() => { setBalanceDialog(true); setBalanceAction('subtract'); }} className="flex-1 bg-orange-600 hover:bg-orange-700" size="sm">
                  <DollarSign className="w-4 h-4 ml-1" /> خصم رصيد
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleBlockUser(selectedUser, !selectedUser.isBlocked)}
                  variant={selectedUser.isBlocked ? 'default' : 'destructive'}
                  className="flex-1"
                  size="sm"
                >
                  {selectedUser.isBlocked ? <UserCheck className="w-4 h-4 ml-1" /> : <UserX className="w-4 h-4 ml-1" />}
                  {selectedUser.isBlocked ? 'إلغاء الحظر' : 'حظر'}
                </Button>
                {adminUser?.role === 'owner' && (
                  <Button onClick={() => setRoleDialog(true)} variant="outline" className="flex-1" size="sm">
                    <Shield className="w-4 h-4 ml-1" /> تغيير الصلاحية
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Balance Dialog */}
      <Dialog open={balanceDialog} onOpenChange={setBalanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{balanceAction === 'add' ? 'إضافة رصيد' : 'خصم رصيد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>العملة</Label>
              <Select value={balanceCurrency} onValueChange={setBalanceCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="YER">ريال يمني</SelectItem>
                  <SelectItem value="SAR">ريال سعودي</SelectItem>
                  <SelectItem value="USD">دولار</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>المبلغ</Label>
              <Input type="number" value={balanceAmount} onChange={(e) => setBalanceAmount(e.target.value)} placeholder="0" dir="ltr" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceDialog(false)}>إلغاء</Button>
            <Button onClick={handleBalanceAdjust} className={balanceAction === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}>
              {balanceAction === 'add' ? 'إضافة' : 'خصم'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={roleDialog} onOpenChange={setRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغيير صلاحية المستخدم</DialogTitle>
          </DialogHeader>
          <div>
            <Label>الصلاحية الجديدة</Label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="user">مستخدم</SelectItem>
                <SelectItem value="admin">مدير</SelectItem>
                <SelectItem value="owner">مالك</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialog(false)}>إلغاء</Button>
            <Button onClick={handleChangeRole}>تغيير</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
