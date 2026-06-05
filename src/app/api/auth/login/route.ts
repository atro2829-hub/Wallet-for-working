import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { phone, pin } = await req.json();
    
    if (!phone || !pin) {
      return NextResponse.json({ error: 'رقم الهاتف والرقم السري مطلوبان' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { phone } });
    if (!user) {
      return NextResponse.json({ error: 'رقم الهاتف غير مسجل' }, { status: 404 });
    }

    if (user.pin !== pin) {
      return NextResponse.json({ error: 'الرقم السري غير صحيح' }, { status: 401 });
    }

    if (user.isBlocked) {
      return NextResponse.json({ error: `الحساب محظور: ${user.blockReason}` }, { status: 403 });
    }

    return NextResponse.json({ 
      user: {
        id: user.id, phone: user.phone, name: user.name, role: user.role,
        kycStatus: user.kycStatus, balanceYER: user.balanceYER,
        balanceSAR: user.balanceSAR, balanceUSD: user.balanceUSD,
        accountNo1: user.accountNo1, accountNo2: user.accountNo2,
        avatar: user.avatar, theme: user.theme, isBlocked: user.isBlocked,
      },
      message: 'تم تسجيل الدخول بنجاح'
    });
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في تسجيل الدخول' }, { status: 500 });
  }
}
