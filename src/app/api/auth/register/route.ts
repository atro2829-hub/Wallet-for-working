import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateAccountNo } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const { phone, name, pin } = await req.json();
    
    if (!phone || !pin) {
      return NextResponse.json({ error: 'رقم الهاتف والرقم السري مطلوبان' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json({ error: 'رقم الهاتف مسجل مسبقاً' }, { status: 409 });
    }

    const user = await db.user.create({
      data: {
        phone,
        name: name || phone,
        pin, // In production, hash this with bcrypt
        accountNo1: generateAccountNo(),
        accountNo2: generateAccountNo(),
        balanceYER: 0,
        balanceSAR: 0,
        balanceUSD: 0,
      },
    });

    return NextResponse.json({ 
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role },
      message: 'تم التسجيل بنجاح'
    });
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في التسجيل' }, { status: 500 });
  }
}
