import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateAccountNo } from '@/lib/utils';

export async function POST() {
  try {
    // Create admin user
    const existingAdmin = await db.user.findUnique({ where: { phone: 'admin' } });

    if (!existingAdmin) {
      await db.user.create({
        data: {
          phone: 'admin',
          name: 'المدير',
          pin: '1234',
          role: 'admin',
          kycStatus: 'verified',
          balanceYER: 500000,
          balanceSAR: 5000,
          balanceUSD: 1000,
          accountNo1: generateAccountNo(),
          accountNo2: generateAccountNo(),
        },
      });
    }

    // Create demo user
    const existingDemo = await db.user.findUnique({ where: { phone: '7771234567' } });

    if (!existingDemo) {
      await db.user.create({
        data: {
          phone: '7771234567',
          name: 'أحمد محمد',
          pin: '1234',
          role: 'user',
          kycStatus: 'verified',
          balanceYER: 150000,
          balanceSAR: 1500,
          balanceUSD: 300,
          accountNo1: generateAccountNo(),
          accountNo2: generateAccountNo(),
        },
      });
    }

    return NextResponse.json({ message: 'تم إنشاء البيانات التجريبية بنجاح' });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
