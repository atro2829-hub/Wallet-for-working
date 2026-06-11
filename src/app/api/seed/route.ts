import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateUserId } from '@/lib/utils';

export async function POST() {
  try {
    // Create admin user
    const existingAdmin = await db.user.findUnique({ where: { email: 'admin@fahednet.com' } });

    if (!existingAdmin) {
      await db.user.create({
        data: {
          email: 'admin@fahednet.com',
          password: 'admin123',
          name: 'المدير',
          role: 'admin',
          userId: '100001',
          kycStatus: 'verified',
          balanceYER: 500000,
          balanceSAR: 5000,
          balanceUSD: 1000,
          governorate: 'عدن',
        },
      });
    }

    // Create demo user
    const existingDemo = await db.user.findUnique({ where: { email: 'demo@fahednet.com' } });

    if (!existingDemo) {
      await db.user.create({
        data: {
          email: 'demo@fahednet.com',
          password: 'demo123',
          phone: '+967777123456',
          name: 'أحمد محمد',
          role: 'user',
          userId: generateUserId(),
          kycStatus: 'verified',
          balanceYER: 150000,
          balanceSAR: 1500,
          balanceUSD: 300,
          governorate: 'عدن',
        },
      });
    }

    return NextResponse.json({ message: 'تم إنشاء البيانات التجريبية بنجاح' });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
