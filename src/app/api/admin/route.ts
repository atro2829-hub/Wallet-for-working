import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all users (admin only)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'users';
    
    if (type === 'users') {
      const users = await db.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, phone: true, name: true, role: true, kycStatus: true,
          isBlocked: true, balanceYER: true, balanceSAR: true, balanceUSD: true,
          userId: true, governorate: true, createdAt: true,
        },
      });
      return NextResponse.json({ users });
    }
    
    if (type === 'transactions') {
      const transactions = await db.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      return NextResponse.json({ transactions });
    }

    if (type === 'products') {
      const products = await db.product.findMany({ orderBy: { sortOrder: 'asc' } });
      return NextResponse.json({ products });
    }

    if (type === 'stats') {
      const totalUsers = await db.user.count();
      const totalTransactions = await db.transaction.count();
      const verifiedUsers = await db.user.count({ where: { kycStatus: 'verified' } });
      const blockedUsers = await db.user.count({ where: { isBlocked: true } });
      return NextResponse.json({ totalUsers, totalTransactions, verifiedUsers, blockedUsers });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Admin actions
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'blockUser') {
      const { userId, reason } = body;
      await db.user.update({ where: { id: userId }, data: { isBlocked: true, blockReason: reason || '' } });
      return NextResponse.json({ message: 'تم حظر المستخدم' });
    }

    if (action === 'unblockUser') {
      const { userId } = body;
      await db.user.update({ where: { id: userId }, data: { isBlocked: false, blockReason: '' } });
      return NextResponse.json({ message: 'تم إلغاء حظر المستخدم' });
    }

    if (action === 'verifyKyc') {
      const { userId } = body;
      await db.user.update({ where: { id: userId }, data: { kycStatus: 'verified' } });
      return NextResponse.json({ message: 'تم التحقق من الهوية' });
    }

    if (action === 'rejectKyc') {
      const { userId, reason } = body;
      await db.user.update({ where: { id: userId }, data: { kycStatus: 'rejected' } });
      return NextResponse.json({ message: 'تم رفض التحقق' });
    }

    if (action === 'addProduct') {
      const { name, nameEn, category, price, currency, icon } = body;
      const product = await db.product.create({
        data: { name, nameEn, category, price, currency: currency || 'YER', icon: icon || '' },
      });
      return NextResponse.json({ product, message: 'تم إضافة المنتج' });
    }

    if (action === 'toggleProduct') {
      const { productId } = body;
      const product = await db.product.findUnique({ where: { id: productId } });
      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      await db.product.update({ where: { id: productId }, data: { isActive: !product.isActive } });
      return NextResponse.json({ message: 'تم تحديث المنتج' });
    }

    if (action === 'updateBalance') {
      const { userId, currency, amount, operation } = body;
      const balanceField = `balance${currency}`;
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      const currentBalance = user[balanceField as keyof typeof user] as number;
      const newBalance = operation === 'add' ? currentBalance + amount : currentBalance - amount;
      await db.user.update({ where: { id: userId }, data: { [balanceField]: Math.max(0, newBalance) } });
      return NextResponse.json({ message: 'تم تحديث الرصيد' });
    }

    if (action === 'deleteProduct') {
      const { productId } = body;
      await db.product.delete({ where: { id: productId } });
      return NextResponse.json({ message: 'تم حذف المنتج' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
